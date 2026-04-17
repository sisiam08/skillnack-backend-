import {
  addDays,
  addHours,
  format,
  getHours,
  getMinutes,
  isEqual,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { BookingStatus } from "../../../generated/prisma/enums";
import {
  TutorProfilesCreateInput,
  TutorProfilesUpdateInput,
} from "../../../generated/prisma/models";
import { calculateTutionPrice } from "../../helpers/CalculateTutionPrice";
import {
  isOverlapping,
  minutesToTime,
  subtractBookedFromFreeSlots,
  timeToMinutes,
  validateBookingDateTime,
} from "../../helpers/TimeHelpers";
import { prisma } from "../../lib/prisma";
import { refreshBookingData } from "../../helpers/RefreshBookingData";
import createAppError from "../../errors/appError";
import { Status } from "../../errors/httpStatus";

const createProfile = async (tutorData: TutorProfilesCreateInput) => {
  return await prisma.tutorProfiles.create({
    data: tutorData,
  });
};

const getAllProfiles = async (
  search?: string | undefined,
  category?: string | undefined,
  maxPrice?: number | undefined,
  minPrice?: number | undefined,
  page?: number,
  limit?: number,
  skip?: number,
  sortBy?: string,
  sortOrder?: string,
  rating?: number | undefined,
  availability?: number | undefined,
) => {
  const andConsditions: any[] = [];

  if (search) {
    search = search.trim();

    const numberSearch = Number(search);

    if (Number.isNaN(numberSearch)) {
      andConsditions.push({
        OR: [
          {
            bio: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            category: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      });
    } else {
      andConsditions.push({
        OR: [
          {
            hourlyRate: {
              gte: numberSearch,
            },
          },
          {
            totalRating: {
              gte: numberSearch,
            },
          },
        ],
      });
    }
  }

  if (category) {
    const categoryName = category.trim();

    andConsditions.push({
      category: {
        name: {
          contains: categoryName,
          mode: "insensitive",
        },
      },
    });
  }

  if (minPrice || maxPrice) {
    andConsditions.push({
      hourlyRate: {
        ...(minPrice && { gte: Number(minPrice) }),
        ...(maxPrice && { lte: Number(maxPrice) }),
      },
    });
  }

  if (availability) {
    andConsditions.push({
      availability: {
        some: {
          dayOfWeek: availability,
        },
      },
    });
  }
  const isPaginated = limit !== undefined;

  const result = await prisma.tutorProfiles.findMany({
    ...(isPaginated && { skip: skip as number, take: limit as number }),

    where: {
      AND: [...andConsditions],
      user: {
        status: "UNBAN",
      },
    },
    orderBy: {
      [sortBy as string]: sortOrder,
    },
    include: {
      user: true,
      category: true,
      availability: true,
      bookings: {
        where: { status: BookingStatus.COMPLETED },
        include: {
          reviews: {
            select: {
              rating: true,
              comment: true,
            },
          },
        },
      },
    },
  });

  let filteredResult = result;
  if (rating) {
    filteredResult = result.filter((tutor) => {
      if (tutor.totalReviews === 0) return false;
      const averageRating = tutor.totalRating / tutor.totalReviews;
      return averageRating >= rating;
    });
  }

  let totalData = await prisma.tutorProfiles.count({
    where: {
      AND: [...andConsditions],
      user: {
        status: "UNBAN",
      },
    },
  });

  totalData = rating ? filteredResult.length : totalData;

  const totalPages = Math.ceil(totalData / (limit as number));

  return {
    data: filteredResult,
    pagination: { totalData, page, limit, totalPages },
  };
};

const getProfileById = async (id: string) => {
  return await prisma.tutorProfiles.findUnique({
    where: { id },
    include: {
      user: true,
      category: true,
      availability: true,
      bookings: {
        where: { status: BookingStatus.COMPLETED },
        include: {
          reviews: {
            select: {
              rating: true,
              comment: true,
            },
          },
        },
      },
    },
  });
};

const getMyProfile = async (userId: string) => {
  return await prisma.tutorProfiles.findUnique({
    where: { userId },
    include: {
      user: true,
      category: true,
      availability: true,
      bookings: {
        where: { status: BookingStatus.COMPLETED },
        include: {
          reviews: {
            select: {
              rating: true,
              comment: true,
            },
          },
        },
      },
    },
  });
};

const updateProfile = async (
  userId: string,
  tutorData: TutorProfilesUpdateInput,
) => {
  return await prisma.tutorProfiles.update({
    where: { userId },
    data: tutorData,
    include: {
      user: true,
      category: true,
      availability: true,
      bookings: {
        where: { status: BookingStatus.COMPLETED },
        include: {
          reviews: {
            select: {
              rating: true,
              comment: true,
            },
          },
        },
      },
    },
  });
};

const setAvailability = async (
  userId: string,
  availability: { dayOfWeek: number; startTime: string; endTime: string },
) => {
  const { dayOfWeek, startTime, endTime } = availability;

  const StartMin = timeToMinutes(startTime);
  const EndMin = timeToMinutes(endTime);

  if (EndMin <= StartMin) {
    throw createAppError("Invalid time range", Status.BAD_REQUEST);
  }

  const tutorProfile = await prisma.tutorProfiles.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!tutorProfile) {
    throw createAppError("Tutor profile not found", Status.NOT_FOUND);
  }

  const tutorId = tutorProfile.id;

  const exixtingSlots = await prisma.tutorAvailability.findMany({
    where: {
      tutorId,
      dayOfWeek,
    },
  });

  if (isOverlapping({ startTime, endTime }, exixtingSlots)) {
    throw createAppError("Overlapping availability slots", Status.CONFLICT);
  }

  return await prisma.tutorAvailability.create({
    data: {
      tutorId,
      ...availability,
    },
  });
};

const getAvailability = async (tutorId: string) => {
  const availabilities = await prisma.tutorAvailability.findMany({
    where: { tutorId, isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "desc" }],
  });

  return availabilities.filter((av) => {
    if (!av.startTime || !av.endTime) {
      return false;
    }
    return true;
  });
};

const getAvailableSlots = async (
  tutorId: string,
  selectedDate: string,
  slotDuration: number,
) => {
  const date = new Date(selectedDate);
  const dayOfWeek = date.getDay();

  validateBookingDateTime(date);

  const tutorSlots = await prisma.tutorAvailability.findMany({
    where: {
      tutorId,
      dayOfWeek,
      isActive: true,
    },
  });

  if (!tutorSlots.length) {
    throw createAppError("Tutor not available on this day", Status.BAD_REQUEST);
  }

  const bookedSlots = await prisma.bookings.findMany({
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

  let availableSlots: { startTime: string; endTime: string }[] = [];

  const now = addHours(new Date(), 6);

  const isToday = isSameDay(date, now);

  const currentMinutes = getHours(now) * 60 + getMinutes(now);
  const currentSlotMinutes = Math.ceil(currentMinutes / 30) * 30;

  tutorSlots.forEach((slot) => {
    const freeRanges = subtractBookedFromFreeSlots(
      { startTime: slot.startTime, endTime: slot.endTime },
      bookedSlots,
    );
    freeRanges.forEach((freeSlot) => {
      let freeStartMin = timeToMinutes(freeSlot.startTime);
      let freeEndMin = timeToMinutes(freeSlot.endTime);

      if (isToday) {
        if (freeEndMin <= currentSlotMinutes) {
          return;
        } else if (freeStartMin < currentSlotMinutes) {
          freeStartMin = currentSlotMinutes;
        }
      }

      let currentStart = freeStartMin;

      while (currentStart + slotDuration <= freeEndMin) {
        const endMin = currentStart + slotDuration;

        availableSlots.push({
          startTime: minutesToTime(currentStart),
          endTime: minutesToTime(endMin),
        });

        currentStart = currentStart + 60;
      }
    });
  });

  availableSlots.sort((a, b) => {
    const aStart = timeToMinutes(a.startTime);
    const bStart = timeToMinutes(b.startTime);
    return aStart - bStart;
  });

  const tutor = await prisma.tutorProfiles.findUnique({
    where: { id: tutorId },
    select: { hourlyRate: true },
  });

  if (!tutor) {
    throw createAppError("Tutor not found", Status.NOT_FOUND);
  }

  const price = calculateTutionPrice(slotDuration, tutor.hourlyRate);

  return { dayOfWeek, availableSlots, price };
};

const updateAvailability = async (
  userId: string,
  id: string,
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  },
) => {
  const { dayOfWeek, startTime, endTime, isActive } = availability;

  if (isActive === null) {
    const StartMin = timeToMinutes(startTime);
    const EndMin = timeToMinutes(endTime);

    if (EndMin <= StartMin) {
      throw createAppError("Invalid time range", Status.BAD_REQUEST);
    }

    const tutorProfile = await prisma.tutorProfiles.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!tutorProfile) {
      throw createAppError("Tutor profile not found", Status.NOT_FOUND);
    }

    const tutorId = tutorProfile.id;

    const exixtingSlots = await prisma.tutorAvailability.findMany({
      where: {
        tutorId,
        dayOfWeek,
      },
    });

    if (isOverlapping({ startTime, endTime }, exixtingSlots)) {
      throw createAppError("Overlapping availability slots", Status.CONFLICT);
    }
  }

  const data = await prisma.tutorAvailability.update({
    where: { id },
    data: availability,
  });

  return data;
};

const deleteAvailability = async (id: string) => {
  return await prisma.tutorAvailability.delete({
    where: { id },
  });
};

const getBookingSessions = async (
  userId: string,
  status: BookingStatus | undefined,
  page?: number,
  limit?: number,
  skip?: number,
) => {
  const tutorProfile = await prisma.tutorProfiles.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!tutorProfile) {
    throw createAppError("Tutor profile not found", Status.NOT_FOUND);
  }

  const andConditions: any = { tutorId: tutorProfile.id };

  if (status) {
    andConditions.status = status;
  }

  return await prisma.$transaction(async (tx) => {
    refreshBookingData(tx);

    const isPaginated = limit !== undefined;

    const [result, totalData] = await Promise.all([
      prisma.bookings.findMany({
        ...(isPaginated && { skip: skip as number, take: limit as number }),

        where: andConditions,
        orderBy: [{ sessionDate: "asc" }, { startTime: "asc" }],
        include: {
          tutor: {
            select: {
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          student: {
            select: {
              name: true,
              email: true,
              role: true,
              image: true,
            },
          },
          reviews: {
            select: {
              rating: true,
              comment: true,
            },
          },
        },
      }),

      tx.bookings.count({ where: andConditions }),
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

const setDefaultClassLink = async (
  userId: string,
  defaultClassLink: string,
) => {
  const tutorProfile = await prisma.tutorProfiles.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) {
    throw createAppError("Tutor profile not found", Status.NOT_FOUND);
  }
  return await prisma.tutorProfiles.update({
    where: { id: tutorProfile.id },
    data: { defaultClassLink: defaultClassLink },
  });
};

const getDefaultClassLink = async (userId: string) => {
  const tutorProfile = await prisma.tutorProfiles.findUnique({
    where: { userId },
    select: { defaultClassLink: true },
  });
  if (!tutorProfile) {
    throw createAppError("Tutor profile not found", Status.NOT_FOUND);
  }
  return { defaultClassLink: tutorProfile.defaultClassLink };
};

const getTutorStats = async (userId: string) => {
  const today = startOfDay(new Date());
  const currentMonthStart = startOfMonth(new Date());
  const currentWeekStart = startOfWeek(new Date());

  return await prisma.$transaction(async (tx) => {
    refreshBookingData(tx);

    const tutorProfile = await tx.tutorProfiles.findUnique({
      where: { userId },
      select: {
        id: true,
        totalRating: true,
        totalReviews: true,
        hourlyRate: true,
        experienceYears: true,
      },
    });

    if (!tutorProfile) {
      throw createAppError("Tutor profile not found", Status.NOT_FOUND);
    }

    const tutorId = tutorProfile.id as string;

    const bookingsPrice = await tx.bookings.findMany({
      where: {
        tutorId,
        status: "COMPLETED",
      },
      select: {
        price: true,
        sessionDate: true,
      },
    });

    const earningsPerBooking = bookingsPrice.map((booking) => ({
      earnings: booking.price * 0.9,
      sessionDate: booking.sessionDate,
    }));

    const [
      totalEarnings,
      monthlyEarnings,
      todayEarnings,
      totalUniqueStudents,
      activeAvailableDays,
      totalRatings,
      averageRating,
      totalReviews,
      completedSessions,
      todayCompletedSessions,
      weeklyCompletedSessions,
      canceledSessions,
      monthlyCanceledSessions,
      confirmedSessions,
    ] = await Promise.all([
      // Total Earnings
      earningsPerBooking.reduce(
        (accumulator, currentbooking) => accumulator + currentbooking.earnings,
        0,
      ),

      // Monthly Earnings
      earningsPerBooking
        .filter((booking) => booking.sessionDate > currentMonthStart)
        .reduce(
          (accumulator, currentbooking) =>
            accumulator + currentbooking.earnings,
          0,
        ),

      // Today's Earnings
      earningsPerBooking
        .filter((booking) => booking.sessionDate == today)
        .reduce(
          (accumulator, currentbooking) =>
            accumulator + currentbooking.earnings,
          0,
        ),

      // Total Unique Students
      tx.bookings.findMany({
        where: {
          tutorId,
          status: BookingStatus.COMPLETED,
        },
        distinct: ["studentId"],
        select: { studentId: true },
      }),

      // Active Available Days
      tx.tutorAvailability.findMany({
        where: { tutorId, isActive: true },
        distinct: ["dayOfWeek"],
        select: { dayOfWeek: true },
      }),

      // Total Ratings
      tutorProfile.totalRating,

      // Average Rating
      tutorProfile.totalRating /
        (tutorProfile.totalReviews ? tutorProfile.totalReviews : 1),

      // Total Reviews
      tutorProfile.totalReviews,

      // Total Completed Sessions
      tx.bookings.count({
        where: { tutorId, status: BookingStatus.COMPLETED },
      }),

      // Today's Completed Sessions
      tx.bookings.count({
        where: {
          tutorId,
          status: BookingStatus.COMPLETED,
          sessionDate: {
            equals: today,
          },
        },
      }),

      // Weekly Completed Sessions
      tx.bookings.count({
        where: {
          tutorId,
          status: BookingStatus.COMPLETED,
          sessionDate: { gte: currentWeekStart },
        },
      }),

      // Canceled Sessions
      tx.bookings.count({
        where: { tutorId, status: BookingStatus.CANCELLED },
      }),

      // Monthly Canceled Sessions
      tx.bookings.count({
        where: {
          tutorId,
          status: BookingStatus.CANCELLED,
          sessionDate: { gte: currentMonthStart },
        },
      }),

      // Confirmed Sessions
      tx.bookings.count({
        where: { tutorId, status: BookingStatus.CONFIRMED },
      }),
    ]);

    return {
      earnings: {
        totalEarnings: totalEarnings ?? 0,
        earningsThisMonth: monthlyEarnings ?? 0,
        earningsToday: todayEarnings ?? 0,
        hourlyRate: tutorProfile.hourlyRate,
      },
      profile: {
        uniqueStudents: totalUniqueStudents.length,
        experienceYears: tutorProfile.experienceYears,
        activeDays: activeAvailableDays.length,
        averageRating,
        totalRatings,
        reviewCount: totalReviews,
      },
      sessions: {
        completed: completedSessions,
        completedToday: todayCompletedSessions,
        completedThisWeek: weeklyCompletedSessions,
        cancelled: canceledSessions,
        cancelledThisMonth: monthlyCanceledSessions,
        upcoming: confirmedSessions,
      },
    };
  });
};

const getWeeklyEarnings = async (userId: string) => {
  const tutorProfile = await prisma.tutorProfiles.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!tutorProfile) {
    throw createAppError("Tutor profile not found", Status.NOT_FOUND);
  }

  const currentWeekStart = startOfWeek(new Date());

  const data = Array.from({ length: 7 }, async (_, i) => {
    const dayStart = addDays(currentWeekStart, i);
    const dayEnd = addDays(dayStart, 1);
    const dayName = format(dayStart, "EEE");

    const result = await prisma.bookings.aggregate({
      where: {
        tutorId: tutorProfile.id,
        status: BookingStatus.COMPLETED,
        sessionDate: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
      _sum: { price: true },
    });

    return {
      weekDay: dayName,
      earnings: result._sum.price ?? 0,
    };
  });

  const weeklyEarnings = await Promise.all(data);

  return weeklyEarnings;
};

const sendClassLink = async (bookingId: string, classLink: string) => {
  const today = startOfDay(new Date());
  const currentTime = format(addHours(new Date(), 6), "HH:mm");

  const bookings = await prisma.bookings.findUnique({
    where: { id: bookingId },
    select: { sessionDate: true, startTime: true },
  });

  if (!bookings) {
    throw createAppError("Booking not found", Status.NOT_FOUND);
  }

  if (
    bookings.sessionDate > today ||
    (isEqual(bookings.sessionDate, today) && bookings.startTime > currentTime)
  ) {
    throw createAppError(
      "Cannot send class link before the session time starts.",
      Status.BAD_REQUEST,
    );
  }

  return await prisma.bookings.update({
    where: { id: bookingId },
    data: { status: BookingStatus.RUNNING, classLink },
  });
};

export const TutorProfileServices = {
  createProfile,
  getAllProfiles,
  getProfileById,
  getMyProfile,
  updateProfile,
  setAvailability,
  getAvailability,
  getAvailableSlots,
  updateAvailability,
  deleteAvailability,
  getBookingSessions,
  setDefaultClassLink,
  getDefaultClassLink,
  getTutorStats,
  getWeeklyEarnings,
  sendClassLink,
};
