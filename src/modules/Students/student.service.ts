import { addHours, startOfMonth } from "date-fns";
import { BookingStatus } from "../../generated/client";
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
      spendByMonth,
      sessionsByCategory,
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

      // Paid spend per calendar month (last 6 months, zero-filled).
      // Money-over-time uses Payment.createdAt (when collected), not sessionDate.
      tx.$queryRaw<{ month: string; amount: number }[]>`
        WITH buckets AS (
          SELECT generate_series(
            date_trunc('month', (now() AT TIME ZONE 'UTC') + interval '6 hours') - interval '5 months',
            date_trunc('month', (now() AT TIME ZONE 'UTC') + interval '6 hours'),
            interval '1 month'
          ) AS bucket
        )
        SELECT to_char(b.bucket, 'Mon YYYY') AS month,
               COALESCE(SUM(pay.amount), 0)::float AS amount
        FROM buckets b
        LEFT JOIN (
          SELECT p.amount, (p."createdAt" + interval '6 hours') AS shifted
          FROM "payment" p
          JOIN "bookings" bk ON bk."id" = p."bookingId"
          WHERE bk."studentId" = ${userId} AND p.status = 'PAID'
        ) pay
          ON pay.shifted >= b.bucket
         AND pay.shifted < b.bucket + interval '1 month'
        GROUP BY b.bucket
        ORDER BY b.bucket
      `,

      // Sessions booked per tutor category (demand for this student).
      tx.$queryRaw<{ category: string; count: number }[]>`
        SELECT COALESCE(c.name, 'Uncategorized') AS category, COUNT(*)::int AS count
        FROM "bookings" b
        JOIN "tutorProfiles" tp ON tp."id" = b."tutorId"
        LEFT JOIN "categories" c ON c."id" = tp."categoriesId"
        WHERE b."studentId" = ${userId}
        GROUP BY 1
        ORDER BY count DESC
      `,
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
      spendByMonth,
      sessionsByCategory,
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
