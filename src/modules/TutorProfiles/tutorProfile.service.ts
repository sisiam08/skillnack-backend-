import { BookingStatus } from "../../../generated/prisma/enums";
import {
  TutorProfilesCreateInput,
  TutorProfilesUpdateInput,
} from "../../../generated/prisma/models";
import { isOverlapping, timeToMinutes } from "../../helpers/TimeHelpers";
import { prisma } from "../../lib/prisma";

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
    throw new Error("Invalid time range");
  }

  const tutorProfile = await prisma.tutorProfiles.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!tutorProfile) {
    throw new Error("Tutor profile not found");
  }

  const tutorId = tutorProfile.id;

  const exixtingSlots = await prisma.tutorAvailability.findMany({
    where: {
      tutorId,
      dayOfWeek,
    },
  });

  if (isOverlapping({ startTime, endTime }, exixtingSlots)) {
    throw new Error("Overlapping availability slots");
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

export const TutorProfileServices = {
  createProfile,
  getAllProfiles,
  getProfileById,
  getMyProfile,
  updateProfile,
  setAvailability,
  getAvailability,
};
