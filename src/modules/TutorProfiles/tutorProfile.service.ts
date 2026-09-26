import {
  addDays,
  addHours,
  differenceInCalendarDays,
  endOfDay,
  format,
  getHours,
  getMinutes,
  isEqual,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  BookingStatus,
  SessionOutcome,
  VerificationStatus,
} from "../../generated/enums";
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

type TutorProfilePayload = {
  userId: string;
  categoriesId?: string | null;
  bio?: string | null;
  experienceYears: number;
  hourlyRate: number;
  /** Legacy free-text tags. Accepted but intentionally ignored (never written). */
  tags?: string[];
  headline?: string | null;
  currentRoleOrInstitution?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  subjectIds?: string[];
  skillIds?: string[];
};

// Lean projection for tutor listings/details. Uses the denormalized counters
// (totalRating/totalReviews/totalCompletedBookings/solvedCount) instead of
// loading every COMPLETED booking + its reviews. The `bookings` relation is not
// read by any tutor-facing screen.
const profileInclude = () => ({
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      status: true,
    },
  },
  category: { select: { id: true, name: true } },
  availability: {
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      isActive: true,
    },
  },
  subjects: { select: { id: true, name: true } },
  skills: { select: { id: true, name: true } },
});

type AvailabilityFlags = { availableToday: boolean; availableNow: boolean };

/**
 * Batch-computes "available today / next 2 hours" flags for a set of tutors.
 * Uses exactly two queries total (availability + confirmed bookings for today)
 * regardless of how many tutors are passed — avoids N+1.
 *
 * Timezone follows the existing project convention of a hard-coded +6h offset
 * (see TimeHelpers / RefreshBookingData).
 */
const computeTutorAvailabilityFlags = async (
  tutorIds: string[],
): Promise<Record<string, AvailabilityFlags>> => {
  if (tutorIds.length === 0) return {};

  const now = addHours(new Date(), 6);
  const todayStr = format(now, "yyyy-MM-dd");
  const todayDow = new Date(todayStr).getDay();
  const nowMinutes = getHours(now) * 60 + getMinutes(now);

  const [slots, bookings] = await Promise.all([
    prisma.tutorAvailability.findMany({
      where: {
        tutorId: { in: tutorIds },
        dayOfWeek: todayDow,
        isActive: true,
      },
      select: { tutorId: true, startTime: true, endTime: true },
    }),
    prisma.bookings.findMany({
      where: {
        tutorId: { in: tutorIds },
        sessionDate: new Date(todayStr),
        status: BookingStatus.CONFIRMED,
      },
      select: { tutorId: true, startTime: true, endTime: true },
    }),
  ]);

  const slotsByTutor = new Map<string, { startTime: string; endTime: string }[]>();
  for (const slot of slots) {
    const list = slotsByTutor.get(slot.tutorId) ?? [];
    list.push({ startTime: slot.startTime, endTime: slot.endTime });
    slotsByTutor.set(slot.tutorId, list);
  }

  const bookingsByTutor = new Map<string, { startTime: string; endTime: string }[]>();
  for (const booking of bookings) {
    const list = bookingsByTutor.get(booking.tutorId) ?? [];
    list.push({ startTime: booking.startTime, endTime: booking.endTime });
    bookingsByTutor.set(booking.tutorId, list);
  }

  const result: Record<string, AvailabilityFlags> = {};

  for (const tutorId of tutorIds) {
    const tutorSlots = slotsByTutor.get(tutorId) ?? [];
    const tutorBookings = bookingsByTutor.get(tutorId) ?? [];

    let availableToday = false;
    let availableNow = false;

    for (const slot of tutorSlots) {
      const freeRanges = subtractBookedFromFreeSlots(slot, tutorBookings);

      for (const range of freeRanges) {
        const start = timeToMinutes(range.startTime);
        const end = timeToMinutes(range.endTime);

        if (end <= nowMinutes) continue;

        availableToday = true;

        if (start <= nowMinutes + 120) {
          availableNow = true;
        }
      }
    }

    result[tutorId] = { availableToday, availableNow };
  }

  return result;
};

const createProfile = async (tutorData: TutorProfilePayload) => {
  // `tags` is legacy free-text expertise, replaced by structured subjects/skills.
  // It is intentionally dropped so no new tag data can be written.
  const { subjectIds = [], skillIds = [], tags: _legacyTags, ...rest } = tutorData;

  return await prisma.tutorProfiles.create({
    data: {
      ...rest,
      subjects: subjectIds.length
        ? { connect: subjectIds.map((id) => ({ id })) }
        : undefined,
      skills: skillIds.length
        ? { connect: skillIds.map((id) => ({ id })) }
        : undefined,
    },
    include: profileInclude(),
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
  subjectId?: string | undefined,
  skillId?: string | undefined,
  availableToday?: boolean,
  availableNow?: boolean,
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

  if (subjectId) {
    andConsditions.push({
      subjects: {
        some: {
          id: subjectId,
        },
      },
    });
  }

  if (skillId) {
    andConsditions.push({
      skills: {
        some: {
          id: skillId,
        },
      },
    });
  }

  if (rating) {
    const ratingRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "tutorProfiles"
      WHERE "totalReviews" > 0
        AND ("totalRating"::numeric / "totalReviews") >= ${rating}
    `;
    andConsditions.push({ id: { in: ratingRows.map((row) => row.id) } });
  }

  const isPaginated = limit !== undefined;

  const baseWhere = {
    AND: [...andConsditions],
    user: {
      status: "UNBAN" as const,
    },
    verificationStatus: VerificationStatus.APPROVED,
  };

  const wantsAvailabilityFilter = Boolean(availableToday || availableNow);

  if (wantsAvailabilityFilter) {
    const now = addHours(new Date(), 6);
    const todayDow = new Date(format(now, "yyyy-MM-dd")).getDay();

    const candidates = await prisma.tutorProfiles.findMany({
      where: {
        ...baseWhere,
        AND: [
          ...andConsditions,
          { availability: { some: { dayOfWeek: todayDow, isActive: true } } },
        ],
      },
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      include: profileInclude(),
    });

    const flags = await computeTutorAvailabilityFlags(
      candidates.map((candidate) => candidate.id),
    );

    const filtered = candidates.filter((candidate) => {
      const flag = flags[candidate.id];
      if (!flag) return false;
      return availableNow ? flag.availableNow : flag.availableToday;
    });

    const totalData = filtered.length;
    const pageItems = isPaginated
      ? filtered.slice(skip as number, (skip as number) + (limit as number))
      : filtered;

    const data = pageItems.map((tutor) => ({
      ...tutor,
      availableToday: flags[tutor.id]?.availableToday ?? false,
      availableNow: flags[tutor.id]?.availableNow ?? false,
    }));

    return {
      data,
      pagination: {
        totalData,
        page,
        limit,
        totalPages: Math.ceil(totalData / (limit as number)),
      },
    };
  }

  const result = await prisma.tutorProfiles.findMany({
    ...(isPaginated && { skip: skip as number, take: limit as number }),
    where: baseWhere,
    orderBy: {
      [sortBy as string]: sortOrder,
    },
    include: profileInclude(),
  });

  const availabilityFlags = await computeTutorAvailabilityFlags(
    result.map((tutor) => tutor.id),
  );

  const data = result.map((tutor) => ({
    ...tutor,
    availableToday: availabilityFlags[tutor.id]?.availableToday ?? false,
    availableNow: availabilityFlags[tutor.id]?.availableNow ?? false,
  }));

  const totalData = await prisma.tutorProfiles.count({
    where: baseWhere,
  });

  const totalPages = Math.ceil(totalData / (limit as number));

  return {
    data,
    pagination: { totalData, page, limit, totalPages },
  };
};

const getProfileById = async (id: string) => {
  return await prisma.tutorProfiles.findFirst({
    where: { id, verificationStatus: VerificationStatus.APPROVED },
    include: profileInclude(),
  });
};

const getMyProfile = async (userId: string) => {
  return await prisma.tutorProfiles.findUnique({
    where: { userId },
    include: profileInclude(),
  });
};

const updateProfile = async (
  userId: string,
  tutorData: Partial<TutorProfilePayload>,
) => {
  // Drop legacy `tags` and client-supplied `userId`; expertise is set via
  // structured subjects/skills only.
  const {
    subjectIds,
    skillIds,
    userId: _ignored,
    tags: _legacyTags,
    ...rest
  } = tutorData;

  return await prisma.tutorProfiles.update({
    where: { userId },
    data: {
      ...rest,
      ...(subjectIds
        ? { subjects: { set: subjectIds.map((id) => ({ id })) } }
        : {}),
      ...(skillIds ? { skills: { set: skillIds.map((id) => ({ id })) } } : {}),
    },
    include: profileInclude(),
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

      // Step by the slot duration for sub-hour sessions (so 30-min slots can start
      // on the half-hour), otherwise keep the historical 60-minute stepping.
      const step = slotDuration <= 60 ? slotDuration : 60;

      while (currentStart + slotDuration <= freeEndMin) {
        const endMin = currentStart + slotDuration;

        availableSlots.push({
          startTime: minutesToTime(currentStart),
          endTime: minutesToTime(endMin),
        });

        currentStart = currentStart + step;
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

  const andConditions: any = {
    tutorId: tutorProfile.id,
    status: { not: BookingStatus.PENDING },
  };

  if (status) {
    andConditions.status = status;
  }

  return await prisma.$transaction(async (tx) => {
    await refreshBookingData(tx);

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

const getTutorStats = async (userId: string) => {
  const today = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const currentMonthStart = startOfMonth(new Date());
  const currentWeekStart = startOfWeek(new Date());

  return await prisma.$transaction(async (tx) => {
    await refreshBookingData(tx);

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

    // Single read for the tutor's bookings instead of ~8 separate
    // count/aggregate queries. Earnings/date semantics preserved exactly.
    const bookings = await tx.bookings.findMany({
      where: { tutorId },
      select: {
        status: true,
        price: true,
        sessionDate: true,
        studentId: true,
        outcome: true,
      },
    });

    const ratingTrendRaw = await tx.$queryRaw<
      { month: Date; averageRating: number; reviewCount: number }[]
    >`
      SELECT date_trunc('month', r."createdAt") AS month,
             AVG(r.rating)::float AS "averageRating",
             COUNT(*)::int AS "reviewCount"
      FROM "reviews" r
      JOIN "bookings" b ON b."id" = r."bookingId"
      WHERE b."tutorId" = ${tutorId}
      GROUP BY 1
      ORDER BY 1
    `;

    const completed = bookings.filter(
      (booking) => booking.status === BookingStatus.COMPLETED,
    );
    const cancelled = bookings.filter(
      (booking) => booking.status === BookingStatus.CANCELLED,
    );
    const confirmed = bookings.filter(
      (booking) => booking.status === BookingStatus.CONFIRMED,
    );

    const totalEarnings = completed.reduce(
      (accumulator, booking) => accumulator + booking.price * 0.9,
      0,
    );

    const monthlyEarnings = completed
      .filter((booking) => booking.sessionDate > currentMonthStart)
      .reduce(
        (accumulator, booking) => accumulator + booking.price * 0.9,
        0,
      );

    // Note: "today" earnings intentionally remain gross (historical behavior).
    const earningsToday = completed
      .filter(
        (booking) =>
          booking.sessionDate >= today && booking.sessionDate <= todayEnd,
      )
      .reduce((accumulator, booking) => accumulator + booking.price, 0);

    const activeAvailableDays = await tx.tutorAvailability.findMany({
      where: { tutorId, isActive: true },
      distinct: ["dayOfWeek"],
      select: { dayOfWeek: true },
    });

    return {
      earnings: {
        totalEarnings: totalEarnings ?? 0,
        earningsThisMonth: monthlyEarnings ?? 0,
        earningsToday: earningsToday ?? 0,
        hourlyRate: tutorProfile.hourlyRate,
      },
      profile: {
        uniqueStudents: new Set(completed.map((booking) => booking.studentId))
          .size,
        experienceYears: tutorProfile.experienceYears,
        activeDays: activeAvailableDays.length,
        averageRating:
          tutorProfile.totalRating /
          (tutorProfile.totalReviews ? tutorProfile.totalReviews : 1),
        totalRatings: tutorProfile.totalRating,
        reviewCount: tutorProfile.totalReviews,
      },
      sessions: {
        completed: completed.length,
        completedToday: completed.filter(
          (booking) => booking.sessionDate.getTime() === today.getTime(),
        ).length,
        completedThisWeek: completed.filter(
          (booking) => booking.sessionDate >= currentWeekStart,
        ).length,
        cancelled: cancelled.length,
        cancelledThisMonth: cancelled.filter(
          (booking) => booking.sessionDate >= currentMonthStart,
        ).length,
        upcoming: confirmed.length,
      },
      outcomes: {
        solved: bookings.filter(
          (booking) => booking.outcome === SessionOutcome.SOLVED,
        ).length,
        partiallySolved: bookings.filter(
          (booking) => booking.outcome === SessionOutcome.PARTIALLY_SOLVED,
        ).length,
        notSolved: bookings.filter(
          (booking) => booking.outcome === SessionOutcome.NOT_SOLVED,
        ).length,
      },
      ratingTrend: ratingTrendRaw.map((row) => ({
        month: format(row.month, "MMM yyyy"),
        averageRating: Number(row.averageRating.toFixed(2)),
        reviewCount: row.reviewCount,
      })),
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
  const currentWeekEnd = addDays(currentWeekStart, 7);

  // Single query for the whole week instead of 7 per-day aggregates.
  const bookings = await prisma.bookings.findMany({
    where: {
      tutorId: tutorProfile.id,
      status: BookingStatus.COMPLETED,
      sessionDate: {
        gte: currentWeekStart,
        lt: currentWeekEnd,
      },
    },
    select: { price: true, sessionDate: true },
  });

  const earningsByDay = [0, 0, 0, 0, 0, 0, 0];

  for (const booking of bookings) {
    const index = differenceInCalendarDays(
      booking.sessionDate,
      currentWeekStart,
    );
    if (index >= 0 && index < 7) {
      earningsByDay[index] += booking.price;
    }
  }

  return Array.from({ length: 7 }, (_, i) => ({
    weekDay: format(addDays(currentWeekStart, i), "EEE"),
    earnings: earningsByDay[i],
  }));
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
  getTutorStats,
  getWeeklyEarnings,
  sendClassLink,
};
