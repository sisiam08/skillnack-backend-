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

const getRecentActivity = async (userId: string) => {
  return await prisma.$transaction(async (tx) => {
    const [recentSession, recentReview, recentBooking] = await Promise.all([
      // recent completed session
      tx.bookings.findFirst({
        where: {
          studentId: userId,
          status: BookingStatus.COMPLETED,
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          updatedAt: true,
          tutor: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),

      // recent review
      tx.reviews.findFirst({
        where: {
          booking: {
            studentId: userId,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          rating: true,
          createdAt: true,
          booking: {
            select: {
              tutor: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),

      // recent booking
      tx.bookings.findFirst({
        where: {
          studentId: userId,
          status: BookingStatus.CONFIRMED,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          sessionDate: true,
          createdAt: true,
          tutor: {
            select: {
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      recentSession: {
        tutorName: recentSession?.tutor.user.name,
        categoryName: recentSession?.tutor?.category?.name,
        timeAgo: timeAgo(recentSession?.updatedAt as Date),
      },
      recentReview: {
        rating: recentReview?.rating,
        tutorName: recentReview?.booking.tutor.user.name,
        timeAgo: timeAgo(recentReview?.createdAt as Date),
      },
      recentBooking: {
        sessionDate: recentBooking?.sessionDate,
        categoryName: recentBooking?.tutor?.category?.name,
        timeAgo: timeAgo(recentBooking?.createdAt as Date),
      },
    };
  });
};

export const StudentServices = {
  getStudentStats,
  getRecentActivity,
};
