import { UserRole, UserStatus } from "../../generated/enums";
import { prisma } from "../../lib/prisma";
import { addHours, startOfMonth } from "date-fns";

const getAllUsers = async (
  search?: string,
  role?: UserRole,
  status?: UserStatus,
  page?: number,
  limit?: number,
  skip?: number,
) => {
  const andConditions: any[] = [];

  if (search) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (role) {
    andConditions.push({
      role: {
        equals: role,
      },
    });
  }

  if (status) {
    andConditions.push({
      status: {
        equals: status,
      },
    });
  }

  const isPaginated = limit !== undefined;

  const [result, totalData] = await Promise.all([
    prisma.user.findMany({
      ...(isPaginated && { skip: skip as number, take: limit as number }),
      where: {
        AND: andConditions,
      },
    }),
    prisma.user.count({
      where: {
        AND: andConditions,
      },
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
};

const updateUser = async (userId: string, userStatus: UserStatus) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { status: userStatus },
  });
};

const getStats = async () => {
  return await prisma.$transaction(async (tx) => {
    const bookingsPrice = await tx.bookings.findMany({
      where: { status: "COMPLETED" },
      select: {
        sessionDate: true,
        price: true,
      },
    });

    const commissionsPerBooking = bookingsPrice.map((booking) => ({
      commission: booking.price * 0.1,
      sessionDate: booking.sessionDate,
    }));

    const currentMonthStart = addHours(startOfMonth(new Date()), 6);

    const [
      totalUsers,
      totalTutors,
      bannedTutors,
      totalStudents,
      totalBookings,
      totalBookingsCompleted,
      totalBookingsCancelled,
      totalReviews,
      totalRevenue,
      monthlyRevenue,
    ] = await Promise.all([
      tx.user.count(),
      tx.user.count({ where: { role: UserRole.TUTOR } }),
      tx.user.count({
        where: { role: UserRole.TUTOR, status: UserStatus.BAN },
      }),
      tx.user.count({ where: { role: UserRole.STUDENT } }),
      tx.bookings.count(),
      tx.bookings.count({ where: { status: "COMPLETED" } }),
      tx.bookings.count({ where: { status: "CANCELLED" } }),
      tx.reviews.count(),
      commissionsPerBooking.reduce(
        (accumulator, currentbooking) =>
          accumulator + currentbooking.commission,
        0,
      ),
      commissionsPerBooking
        .filter((booking) => booking.sessionDate > currentMonthStart)
        .reduce(
          (accumulator, currentbooking) =>
            accumulator + currentbooking.commission,
          0,
        ),
    ]);

    return {
      totalUsers,
      totalTutors,
      bannedTutors,
      totalStudents,
      totalBookings,
      totalBookingsCompleted,
      totalBookingsCancelled,
      totalReviews,
      totalRevenue,
      monthlyRevenue,
    };
  });
};

export const AdminServices = {
  getAllUsers,
  updateUser,
  getStats,
};
