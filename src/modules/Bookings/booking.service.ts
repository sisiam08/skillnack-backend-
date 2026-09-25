import { v7 as uuidv7 } from "uuid";
import {
  BookingGoalType,
  BookingStatus,
  SessionOutcome,
  UserRole,
  VerificationStatus,
} from "../../generated/enums";
import { calculateTutionPrice } from "../../helpers/CalculateTutionPrice";
import {
  convertInto12h,
  fitsInAvailabilitySlot,
  isOverlapping,
  timeDuration,
  validateBookingDateTime,
} from "../../helpers/TimeHelpers";
import { prisma } from "../../lib/prisma";
import { getStripeClient } from "../../config/stripe.config";
import config from "../../config";
import { refreshBookingData } from "../../helpers/RefreshBookingData";
import createAppError from "../../errors/appError";
import { Status } from "../../errors/httpStatus";

const createBooking = async (
  studentId: string,
  bookingData: {
    tutorId: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    title?: string;
    description?: string;
    goalType?: BookingGoalType;
    attachments?: string[];
    currentTime?: string;
    todayDate?: string;
  },
) => {
  return await prisma.$transaction(async (tx) => {
    const {
      tutorId,
      sessionDate,
      startTime,
      endTime,
      title,
      description,
      goalType,
      attachments,
      currentTime,
      todayDate,
    } = bookingData;

    const date = new Date(sessionDate);
    const dayOfWeek = date.getDay();
    const slotDuration = timeDuration(startTime, endTime);

    validateBookingDateTime(date, startTime, currentTime, todayDate);

    const availabilitySlots = await tx.tutorAvailability.findMany({
      where: {
        tutorId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!availabilitySlots.length) {
      throw createAppError(
        "Tutor not available on this day",
        Status.BAD_REQUEST,
      );
    }

    if (!fitsInAvailabilitySlot({ startTime, endTime }, availabilitySlots)) {
      throw createAppError(
        "Selected time outside of tutor availability",
        Status.BAD_REQUEST,
      );
    }

    const existingTutorBookings = await tx.bookings.findMany({
      where: {
        tutorId,
        sessionDate: date,
        status: BookingStatus.CONFIRMED,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    if (isOverlapping({ startTime, endTime }, existingTutorBookings)) {
      throw createAppError("Slot already booked", Status.CONFLICT);
    }

    const existingMyBookings = await tx.bookings.findMany({
      where: {
        studentId,
        sessionDate: date,
        status: BookingStatus.CONFIRMED,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    if (isOverlapping({ startTime, endTime }, existingMyBookings)) {
      throw createAppError(
        "Already you book this slot with another tutor.",
        Status.CONFLICT,
      );
    }

    const tutor = await tx.tutorProfiles.findUnique({
      where: { id: tutorId },
      select: {
        hourlyRate: true,
        verificationStatus: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!tutor) {
      throw createAppError("Tutor not found", Status.NOT_FOUND);
    }

    if (tutor.verificationStatus !== VerificationStatus.APPROVED) {
      throw createAppError(
        "This tutor is not available for booking yet",
        Status.BAD_REQUEST,
      );
    }

    const price = calculateTutionPrice(slotDuration, tutor.hourlyRate);

    const booking = await tx.bookings.create({
      data: {
        studentId,
        tutorId,
        sessionDate: date,
        startTime,
        endTime,
        price,
        title: title ?? null,
        description: description ?? null,
        goalType: goalType ?? null,
        attachments: attachments ?? [],
      },
    });

    // Payment integration
    const transactionId = String(uuidv7());

    const paymentData = await tx.payment.create({
      data: {
        bookingId: booking.id,
        amount: price,
        transactionId,
      },
    });

    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: "Session Booking",
              description: `Session with ${tutor.user.name} | Date: ${sessionDate} | Time: ${convertInto12h(startTime)} - ${convertInto12h(endTime)}`,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking.id,
        paymentId: paymentData.id,
      },

      success_url: `${config.appUrl}/dashboard/session`,
      cancel_url: `${config.appUrl}/find-tutors/${tutorId}`,
    });

    return {
      booking,
      payment: paymentData,
      paymentUrl: session.url,
    };
  });
};

const getAllBookings = async (
  status?: BookingStatus,
  page?: number,
  limit?: number,
  skip?: number,
) => {
  return await prisma.$transaction(async (tx) => {
    await refreshBookingData(tx);

    const isPaginated = limit !== undefined;

    const [result, totalData] = await Promise.all([
      tx.bookings.findMany({
        ...(isPaginated && { skip: skip as number, take: limit as number }),

        where: status ? { status } : {},
        orderBy: [{ sessionDate: "desc" }, { startTime: "desc" }],
        include: {
          tutor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  image: true,
                },
              },
              category: {
                select: { id: true, name: true },
              },
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
            },
          },
          reviews: {
            select: { id: true, rating: true, comment: true },
          },
        },
      }),

      tx.bookings.count({
        where: status ? { status } : {},
      }),
    ]);

    const totalPages = Math.ceil(totalData / (limit as number));

    return {
      data: result,
      pagination: {
        totalData,
        page,
        limit,
        totalPages,
      },
    };
  });
};

const getMyBookings = async (
  studentId: string,
  status?: BookingStatus | undefined,
  page?: number,
  limit?: number,
  skip?: number,
) => {
  return await prisma.$transaction(async (tx) => {
    await refreshBookingData(tx);

    const andConditions: any = {
      studentId,
      status: { not: BookingStatus.PENDING },
    };

    if (status) {
      andConditions.status = status;
    }

    const isPaginated = limit !== undefined;

    const [result, totalData] = await Promise.all([
      tx.bookings.findMany({
        ...(isPaginated && { skip: skip as number, take: limit as number }),
        where: andConditions,
        orderBy: [{ sessionDate: "desc" }, { startTime: "asc" }],
        include: {
          tutor: {
            include: {
              user: true,
              category: true,
            },
          },
          reviews: true,
        },
      }),

      tx.bookings.count({
        where: andConditions,
      }),
    ]);

    const totalPages = Math.ceil(totalData / (limit as number));

    return {
      data: result,
      pagination: {
        totalData,
        page,
        limit,
        totalPages,
      },
    };
  });
};

const getBookingDetails = async (bookingId: string) => {
  return await prisma.bookings.findUnique({
    where: {
      id: bookingId,
    },
    include: {
      tutor: {
        include: {
          user: true,
          category: true,
        },
      },
      reviews: true,
    },
  });
};

const recordOutcome = async (
  studentId: string,
  bookingId: string,
  outcome: SessionOutcome,
) => {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.bookings.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        studentId: true,
        tutorId: true,
        status: true,
        outcome: true,
      },
    });

    if (!booking) {
      throw createAppError("Booking not found", Status.NOT_FOUND);
    }

    if (booking.studentId !== studentId) {
      throw createAppError(
        "You don't have permission to update this booking",
        Status.FORBIDDEN,
      );
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw createAppError(
        "Outcome can only be recorded for completed sessions",
        Status.BAD_REQUEST,
      );
    }

    if (booking.outcome) {
      throw createAppError(
        "Outcome already recorded for this booking",
        Status.CONFLICT,
      );
    }

    await tx.tutorProfiles.update({
      where: { id: booking.tutorId },
      data: {
        totalOutcomesRecorded: { increment: 1 },
        ...(outcome === SessionOutcome.SOLVED
          ? { solvedCount: { increment: 1 } }
          : {}),
      },
    });

    return await tx.bookings.update({
      where: { id: bookingId },
      data: { outcome, outcomeAt: new Date() },
    });
  });
};

const SUMMARY_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const updateBookingSummary = async (
  userId: string,
  bookingId: string,
  summary: string,
) => {
  return await prisma.$transaction(async (tx) => {
    const tutorProfile = await tx.tutorProfiles.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!tutorProfile) {
      throw createAppError("Tutor profile not found", Status.NOT_FOUND);
    }

    const booking = await tx.bookings.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        tutorId: true,
        status: true,
        summaryAt: true,
      },
    });

    if (!booking) {
      throw createAppError("Booking not found", Status.NOT_FOUND);
    }

    if (booking.tutorId !== tutorProfile.id) {
      throw createAppError(
        "You don't have permission to update this booking",
        Status.FORBIDDEN,
      );
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw createAppError(
        "A summary can only be added after the session is completed",
        Status.BAD_REQUEST,
      );
    }

    const now = new Date();

    if (
      booking.summaryAt &&
      now.getTime() - booking.summaryAt.getTime() > SUMMARY_EDIT_WINDOW_MS
    ) {
      throw createAppError(
        "The 24-hour editing window for this summary has passed",
        Status.FORBIDDEN,
      );
    }

    return await tx.bookings.update({
      where: { id: bookingId },
      data: {
        summary,
        summaryAt: booking.summaryAt ?? now,
        summaryUpdatedAt: now,
      },
    });
  });
};

const updateBookingStatus = async (
  userId: string,
  userRole: UserRole,
  bookingId: string,
  status: BookingStatus,
) => {
  return await prisma.$transaction(async (tx) => {
    if (userRole === UserRole.TUTOR) {
      await tx.tutorProfiles.update({
        where: {
          userId,
        },
        data: {
          totalCompletedBookings: {
            increment: 1,
          },
        },
      });
    }

    return await tx.bookings.update({
      where: { id: bookingId },
      data: { status },
    });
  });
};

export const BookingServices = {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingDetails,
  recordOutcome,
  updateBookingSummary,
  updateBookingStatus,
};
