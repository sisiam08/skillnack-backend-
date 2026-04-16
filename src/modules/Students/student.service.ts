import { addHours, formatDistanceToNow, startOfMonth } from "date-fns";
import { BookingStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { timeAgo } from "../../helpers/TimeHelpers";

const getStudentStats = async (userId: string) => {
  const currentMonthStart = addHours(startOfMonth(new Date()), 6);
  return await prisma.$transaction(async (tx) => {
    const [
      totalBookings,
      monthlyBookings,
      completedSessions,
      totalSpent,
      refundableAmount,
    ] = await Promise.all([
      // Total Bookings
      tx.bookings.count({
        where: {
          studentId: userId,
        },
      }),
      // This Month Bookings
      tx.bookings.count({
        where: {
          studentId: userId,
          createdAt: {
            gte: currentMonthStart,
          },
        },
      }),
      // Completed Sessions
      tx.bookings.count({
        where: {
          studentId: userId,
          status: BookingStatus.COMPLETED,
        },
      }),

      // Total Spent
      tx.bookings.aggregate({
        where: {
          studentId: userId,
        },
        _sum: {
          price: true,
        },
      }),
      // Refundable Amount
      tx.bookings.aggregate({
        where: {
          studentId: userId,
          status: BookingStatus.CANCELLED,
        },
        _sum: {
          price: true,
        },
      }),
    ]);

    const completionRate =
      totalBookings > 0 ? (completedSessions / totalBookings) * 100 : 0;

    return {
      totalBookings,
      monthlyBookings,
      completedSessions,
      completionRate,
      totalSpent: totalSpent._sum.price || 0,
      refundableAmount: refundableAmount._sum.price || 0,
    };
  });
};

export const StudentServices = {
  getStudentStats,
};
