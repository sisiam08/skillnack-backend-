import { BookingStatus, UserRole } from "../../../generated/prisma/enums";
import { calculateTutionPrice } from "../../helpers/CalculateTutionPrice";
import {
  fitsInAvailabilitySlot,
  isOverlapping,
  timeDuration,
  validateBookingDateTime,
} from "../../helpers/TimeHelpers";
import { prisma } from "../../lib/prisma";
import { addHours, format, startOfDay } from "date-fns";


const createBooking = async (
  studentId: string,
  bookingData: {
    tutorId: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
  },
  currentTime?: string,
  todayDate?: string,
) => {
  return await prisma.$transaction(async (tx) => {
    const { tutorId, sessionDate, startTime, endTime } = bookingData;

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
      throw new Error("Tutor not available on this day");
    }

    if (!fitsInAvailabilitySlot({ startTime, endTime }, availabilitySlots)) {
      throw new Error("Selected time outside of tutor availability");
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
      throw new Error("Slot already booked");
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
      throw new Error("Already you book this slot with another tutor.");
    }

    const tutor = await tx.tutorProfiles.findUnique({
      where: { id: tutorId },
      select: { hourlyRate: true },
    });

    if (!tutor) {
      throw new Error("Tutor not found");
    }

    const price = calculateTutionPrice(slotDuration, tutor.hourlyRate);

    return await tx.bookings.create({
      data: {
        studentId,
        tutorId,
        sessionDate: date,
        startTime,
        endTime,
        price,
      },
    });
  });
};

const getAllBookings = async (
  status?: BookingStatus,
  page?: number,
  limit?: number,
  skip?: number,
) => {
  return await prisma.$transaction(async (tx) => {
    const today = startOfDay(new Date());
    const currentTime = format(addHours(new Date(), 6), "HH:mm");

    await tx.bookings.updateMany({
      where: {
        OR: [
          {
            sessionDate: {
              lt: today,
            },
          },
          {
            sessionDate: {
              equals: today,
            },
            endTime: {
              lt: currentTime,
            },
          },
        ],
        status: BookingStatus.CONFIRMED,
      },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });
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
    const today = startOfDay(new Date());
    const currentTime = format(addHours(new Date(), 6), "HH:mm");

    const andConditions: any = { studentId };

    if (status) {
      andConditions.status = status;
    }

    await tx.bookings.updateMany({
      where: {
        OR: [
          {
            sessionDate: {
              lt: today,
            },
          },
          {
            sessionDate: {
              equals: today,
            },
            endTime: {
              lt: currentTime,
            },
          },
        ],
        status: BookingStatus.CONFIRMED,
        studentId: studentId,
      },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

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
