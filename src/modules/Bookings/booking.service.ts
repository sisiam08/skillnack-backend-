import { v7 as uuidv7 } from "uuid";
import { BookingStatus, UserRole } from "../../../generated/prisma/enums";
import { calculateTutionPrice } from "../../helpers/CalculateTutionPrice";
import {
  convertInto12h,
  fitsInAvailabilitySlot,
  isOverlapping,
  timeDuration,
  validateBookingDateTime,
} from "../../helpers/TimeHelpers";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../config/stripe.config";
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
    currentTime?: string;
    todayDate?: string;
  },
) => {
  return await prisma.$transaction(async (tx) => {
    const { tutorId, sessionDate, startTime, endTime, currentTime, todayDate } =
      bookingData;

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

    const price = calculateTutionPrice(slotDuration, tutor.hourlyRate);

    const booking = await tx.bookings.create({
      data: {
        studentId,
        tutorId,
        sessionDate: date,
        startTime,
        endTime,
        price,
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
  updateBookingStatus,
};
