import {
  UserRole,
  UserStatus,
  VerificationStatus,
} from "../../generated/enums";
import { prisma } from "../../lib/prisma";
import {
  addDays,
  addHours,
  addMonths,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";

const getAllTutors = async (
  verificationStatus?: VerificationStatus,
  search?: string,
  page?: number,
  limit?: number,
  skip?: number,
) => {
  const where: any = {};

  if (verificationStatus) {
    where.verificationStatus = verificationStatus;
  }

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { headline: { contains: search, mode: "insensitive" } },
    ];
  }

  const isPaginated = limit !== undefined;

  const [result, totalData] = await Promise.all([
    prisma.tutorProfiles.findMany({
      ...(isPaginated && { skip: skip as number, take: limit as number }),
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          },
        },
        category: { select: { id: true, name: true } },
        subjects: { select: { id: true, name: true } },
        skills: { select: { id: true, name: true } },
      },
    }),
    prisma.tutorProfiles.count({ where }),
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

const updateTutorVerification = async (
  tutorProfileId: string,
  status: VerificationStatus,
  rejectionReason?: string,
) => {
  return await prisma.tutorProfiles.update({
    where: { id: tutorProfileId },
    data: {
      verificationStatus: status,
      rejectionReason: status === VerificationStatus.REJECTED
        ? rejectionReason ?? null
        : null,
    },
  });
};

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

// Point-in-time account/volume totals only. Revenue lives in `getAnalytics`
// (the single source of truth, by Payment.createdAt + PAID); the former
// COMPLETED-booking revenue read was removed to avoid computing it twice.
const getStats = async () => {
  return await prisma.$transaction(async (tx) => {
    // One grouped read yields the whole role composition (users / tutors /
    // students) plus banned tutors — the single source feeding the "Users by
    // Role" and "Tutor Account Status" donuts. Replaces 4 separate
    // user.count() calls.
    const roleStatusCounts = await tx.user.groupBy({
      by: ["role", "status"],
      _count: { _all: true },
    });

    let totalUsers = 0;
    let totalTutors = 0;
    let totalStudents = 0;
    let bannedTutors = 0;
    for (const row of roleStatusCounts) {
      totalUsers += row._count._all;
      if (row.role === UserRole.TUTOR) totalTutors += row._count._all;
      if (row.role === UserRole.STUDENT) totalStudents += row._count._all;
      if (row.role === UserRole.TUTOR && row.status === UserStatus.BAN) {
        bannedTutors += row._count._all;
      }
    }

    const [totalBookings, totalReviews] = await Promise.all([
      tx.bookings.count(),
      tx.reviews.count(),
    ]);

    return {
      totalUsers,
      totalTutors,
      bannedTutors,
      totalStudents,
      totalBookings,
      totalReviews,
    };
  });
};

type AnalyticsRangeKey = "7d" | "30d" | "90d" | "12m";

const RANGE_DAYS: Record<AnalyticsRangeKey, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Business analytics for the admin dashboard. Every metric is produced by an
 * aggregated/grouped query (batched in one `Promise.all`) — no per-row loops and
 * no N+1. Money-over-time metrics use `Payment.createdAt` (when collected), NOT
 * `booking.sessionDate`.
 */
const getAnalytics = async (rangeKey: AnalyticsRangeKey = "30d") => {
  const days = RANGE_DAYS[rangeKey] ?? 30;
  const isMonthly = days > 90;
  const interval = isMonthly ? "1 month" : "1 day";
  const anchor = addHours(new Date(), 6); // app's +6h (BD) wall clock

  const to = isMonthly ? startOfMonth(anchor) : startOfDay(anchor);
  const from = isMonthly
    ? startOfMonth(subMonths(anchor, 11))
    : startOfDay(subDays(anchor, days - 1));
  const toExclusive = isMonthly ? addMonths(to, 1) : addDays(to, 1);

  // Date strings are tz-independent once cast to `timestamp`, so bucket
  // boundaries stay aligned regardless of the DB session timezone. Stored
  // timestamps are shifted by the app's +6h convention before bucketing.
  const fromStr = format(from, "yyyy-MM-dd");
  const toStr = format(to, "yyyy-MM-dd");
  const toExclusiveStr = format(toExclusive, "yyyy-MM-dd");
  const activeCutoffStr = format(subDays(anchor, 30), "yyyy-MM-dd");
  const labelFormat = isMonthly ? "Mon YYYY" : "DD Mon";
  const pct = (n: number, total: number) =>
    total > 0 ? round2((n / total) * 100) : 0;

  const run = async (tx: typeof prisma) => {
    const [
      revenueSeriesRaw,
      revenueTotalsRaw,
      bookingStatusRaw,
      avgDurationRaw,
      userGrowthRaw,
      demandByCategory,
      topTutors,
      tutorFunnelRaw,
      supplyByCategory,
      supplyBySubject,
      supplyBySkill,
      solveRateRaw,
      activeTutorsRaw,
      ratingDistributionRaw,
      goalSplitRaw,
      hourlyRateRaw,
      ratingVsCompletedRaw,
    ] = await Promise.all([
      // 1. Collected revenue per bucket (uses Payment.createdAt).
      tx.$queryRaw<{ label: string; gmv: number }[]>`
        WITH buckets AS (
          SELECT generate_series(
            ${fromStr}::timestamp, ${toStr}::timestamp, ${interval}::interval
          ) AS bucket
        )
        SELECT to_char(b.bucket, ${labelFormat}) AS label,
               COALESCE(SUM(pay.amount), 0)::float AS gmv
        FROM buckets b
        LEFT JOIN (
          SELECT (p.amount) AS amount, (p."createdAt" + interval '6 hours') AS shifted
          FROM "payment" p
          WHERE p.status = 'PAID'
        ) pay
          ON pay.shifted >= b.bucket
         AND pay.shifted < b.bucket + ${interval}::interval
        GROUP BY b.bucket
        ORDER BY b.bucket
      `,

      // 2. Paid totals in range.
      tx.$queryRaw<{ gmv: number; avg: number; count: number }[]>`
        SELECT COALESCE(SUM(p.amount), 0)::float AS gmv,
               COALESCE(AVG(p.amount), 0)::float AS avg,
               COUNT(*)::int AS count
        FROM "payment" p
        WHERE p.status = 'PAID'
          AND (p."createdAt" + interval '6 hours') >= ${fromStr}::timestamp
          AND (p."createdAt" + interval '6 hours') < ${toExclusiveStr}::timestamp
      `,

      // 3. Booking funnel (cohort = bookings created in range).
      // NOTE: abandoned/expired Stripe checkouts hard-delete the booking, so they
      // never appear here — these are persisted bookings only.
      tx.$queryRaw<{ status: string; paymentStatus: string; count: number }[]>`
        SELECT b.status::text AS status,
               b."paymentStatus"::text AS "paymentStatus",
               COUNT(*)::int AS count
        FROM "bookings" b
        WHERE (b."createdAt" + interval '6 hours') >= ${fromStr}::timestamp
          AND (b."createdAt" + interval '6 hours') < ${toExclusiveStr}::timestamp
        GROUP BY 1, 2
      `,

      // 4. Average session duration (minutes).
      tx.$queryRaw<{ avgMinutes: number }[]>`
        SELECT COALESCE(AVG(
          EXTRACT(EPOCH FROM (b."endTime"::time - b."startTime"::time)) / 60
        ), 0)::float AS "avgMinutes"
        FROM "bookings" b
        WHERE (b."createdAt" + interval '6 hours') >= ${fromStr}::timestamp
          AND (b."createdAt" + interval '6 hours') < ${toExclusiveStr}::timestamp
      `,

      // 5. New signups per bucket, split by role.
      tx.$queryRaw<{ label: string; students: number; tutors: number }[]>`
        WITH buckets AS (
          SELECT generate_series(
            ${fromStr}::timestamp, ${toStr}::timestamp, ${interval}::interval
          ) AS bucket
        )
        SELECT to_char(b.bucket, ${labelFormat}) AS label,
               COALESCE(COUNT(u.id) FILTER (WHERE u.role = 'STUDENT'), 0)::int AS students,
               COALESCE(COUNT(u.id) FILTER (WHERE u.role = 'TUTOR'), 0)::int AS tutors
        FROM buckets b
        LEFT JOIN "user" u
          ON (u."createdAt" + interval '6 hours') >= b.bucket
         AND (u."createdAt" + interval '6 hours') < b.bucket + ${interval}::interval
        GROUP BY b.bucket
        ORDER BY b.bucket
      `,

      // 6. DEMAND — bookings per tutor category in range.
      tx.$queryRaw<{ category: string; bookings: number; revenue: number }[]>`
        SELECT COALESCE(c.name, 'Uncategorized') AS category,
               COUNT(*)::int AS bookings,
               COALESCE(SUM(b.price), 0)::float AS revenue
        FROM "bookings" b
        JOIN "tutorProfiles" tp ON tp."id" = b."tutorId"
        LEFT JOIN "categories" c ON c."id" = tp."categoriesId"
        WHERE (b."createdAt" + interval '6 hours') >= ${fromStr}::timestamp
          AND (b."createdAt" + interval '6 hours') < ${toExclusiveStr}::timestamp
        GROUP BY 1
        ORDER BY bookings DESC
        LIMIT 10
      `,

      // 7. Top tutors by collected revenue in range.
      tx.$queryRaw<
        { name: string; revenue: number; paidBookings: number; completed: number }[]
      >`
        SELECT u.name AS name,
               COALESCE(SUM(p.amount), 0)::float AS revenue,
               COUNT(*)::int AS "paidBookings",
               COUNT(*) FILTER (WHERE b.status = 'COMPLETED')::int AS completed
        FROM "payment" p
        JOIN "bookings" b ON b."id" = p."bookingId"
        JOIN "tutorProfiles" tp ON tp."id" = b."tutorId"
        JOIN "user" u ON u."id" = tp."userId"
        WHERE p.status = 'PAID'
          AND (p."createdAt" + interval '6 hours') >= ${fromStr}::timestamp
          AND (p."createdAt" + interval '6 hours') < ${toExclusiveStr}::timestamp
        GROUP BY u.id, u.name
        ORDER BY revenue DESC
        LIMIT 5
      `,

      // 8. Tutor verification funnel.
      tx.tutorProfiles.groupBy({
        by: ["verificationStatus"],
        _count: { _all: true },
      }),

      // 9. SUPPLY — approved tutors per category.
      tx.$queryRaw<{ category: string; tutors: number }[]>`
        SELECT COALESCE(c.name, 'Uncategorized') AS category, COUNT(*)::int AS tutors
        FROM "tutorProfiles" tp
        LEFT JOIN "categories" c ON c."id" = tp."categoriesId"
        WHERE tp."verificationStatus" = 'APPROVED'
        GROUP BY 1
        ORDER BY tutors DESC
      `,

      // 10. SUPPLY — tutors offering each subject.
      tx.$queryRaw<{ name: string; tutors: number }[]>`
        SELECT s.name AS name, COUNT(*)::int AS tutors
        FROM "subjects" s
        JOIN "_SubjectToTutorProfiles" j ON j."A" = s.id
        GROUP BY s.id, s.name
        ORDER BY tutors DESC
        LIMIT 10
      `,

      // 11. SUPPLY — tutors offering each skill.
      tx.$queryRaw<{ name: string; tutors: number }[]>`
        SELECT s.name AS name, COUNT(*)::int AS tutors
        FROM "skills" s
        JOIN "_SkillToTutorProfiles" j ON j."A" = s.id
        GROUP BY s.id, s.name
        ORDER BY tutors DESC
        LIMIT 10
      `,

      // 12. Platform-wide solve rate.
      tx.tutorProfiles.aggregate({
        _sum: { solvedCount: true, totalOutcomesRecorded: true },
      }),

      // 13. Active tutors: >=1 booking in the last 30 days (by session date).
      tx.$queryRaw<{ active: number }[]>`
        SELECT COUNT(DISTINCT b."tutorId")::int AS active
        FROM "bookings" b
        WHERE b."sessionDate" >= ${activeCutoffStr}::timestamp
      `,

      // 14. Rating distribution (all-time, from reviews).
      tx.reviews.groupBy({ by: ["rating"], _count: { _all: true } }),

      // 15. Booking goal split in range.
      tx.$queryRaw<{ goalType: string | null; count: number }[]>`
        SELECT b."goalType"::text AS "goalType", COUNT(*)::int AS count
        FROM "bookings" b
        WHERE (b."createdAt" + interval '6 hours') >= ${fromStr}::timestamp
          AND (b."createdAt" + interval '6 hours') < ${toExclusiveStr}::timestamp
        GROUP BY 1
      `,

      // 16. Approved-tutor hourly-rate histogram (250-wide buckets up to 2000).
      tx.$queryRaw<{ bucket: number; count: number }[]>`
        SELECT width_bucket("hourlyRate", 0, 2000, 8) AS bucket, COUNT(*)::int AS count
        FROM "tutorProfiles"
        WHERE "verificationStatus" = 'APPROVED'
        GROUP BY 1
        ORDER BY 1
      `,

      // 17. Relationship: rating vs completed bookings (tutors with reviews).
      tx.$queryRaw<{ name: string; completed: number; rating: number }[]>`
        SELECT u.name AS name,
               tp."totalCompletedBookings"::int AS completed,
               ROUND((tp."totalRating"::numeric / tp."totalReviews"), 2)::float AS rating
        FROM "tutorProfiles" tp
        JOIN "user" u ON u."id" = tp."userId"
        WHERE tp."verificationStatus" = 'APPROVED' AND tp."totalReviews" > 0
        ORDER BY completed DESC
        LIMIT 50
      `,
    ]);

    const revenueTotals = revenueTotalsRaw[0] ?? { gmv: 0, avg: 0, count: 0 };
    const gmv = revenueTotals.gmv;

    const statusCounts: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      RUNNING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    let totalCreated = 0;
    let paid = 0;
    for (const row of bookingStatusRaw) {
      statusCounts[row.status] = (statusCounts[row.status] ?? 0) + row.count;
      totalCreated += row.count;
      if (row.paymentStatus === "PAID") paid += row.count;
    }

    const tutorFunnel = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const row of tutorFunnelRaw) {
      tutorFunnel[row.verificationStatus] = row._count._all;
    }

    const solved = solveRateRaw._sum.solvedCount ?? 0;
    const outcomesTotal = solveRateRaw._sum.totalOutcomesRecorded ?? 0;

    const ratingMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of ratingDistributionRaw) {
      if (row.rating >= 1 && row.rating <= 5) {
        ratingMap[row.rating] = row._count._all;
      }
    }

    const active = activeTutorsRaw[0]?.active ?? 0;

    const rateMap: Record<number, number> = {};
    for (const row of hourlyRateRaw) {
      rateMap[row.bucket] = row.count;
    }
    const hourlyRateDistribution = Array.from({ length: 9 }, (_, index) => {
      const bucket = index + 1;
      return {
        bucket: bucket >= 9 ? "2000+" : `${(bucket - 1) * 250}-${bucket * 250}`,
        count: rateMap[bucket] ?? 0,
      };
    });

    return {
      range: {
        key: rangeKey,
        days,
        isMonthly,
        from: from.toISOString(),
        to: toExclusive.toISOString(),
      },
      revenue: {
        gmv: round2(gmv),
        commission: round2(gmv * 0.1),
        tutorPayout: round2(gmv * 0.9),
        paidBookings: revenueTotals.count,
        avgBookingValue: round2(revenueTotals.avg),
        series: revenueSeriesRaw.map((row) => ({
          label: row.label,
          gmv: round2(row.gmv),
          commission: round2(row.gmv * 0.1),
          payout: round2(row.gmv * 0.9),
        })),
      },
      bookings: {
        statusCounts,
        totalCreated,
        paid,
        funnel: [
          { stage: "Created", count: totalCreated, pct: totalCreated > 0 ? 100 : 0 },
          { stage: "Paid", count: paid, pct: pct(paid, totalCreated) },
          { stage: "Completed", count: statusCounts.COMPLETED, pct: pct(statusCounts.COMPLETED, totalCreated) },
          { stage: "Cancelled", count: statusCounts.CANCELLED, pct: pct(statusCounts.CANCELLED, totalCreated) },
        ],
        paidConversionRate: pct(paid, totalCreated),
        completionRate: pct(statusCounts.COMPLETED, totalCreated),
        cancellationRate: pct(statusCounts.CANCELLED, totalCreated),
        avgSessionMinutes: Math.round(avgDurationRaw[0]?.avgMinutes ?? 0),
      },
      tutorFunnel,
      demandByCategory,
      supplyByCategory,
      supplyBySubject,
      supplyBySkill,
      topTutors: topTutors.map((tutor) => ({
        ...tutor,
        revenue: round2(tutor.revenue),
      })),
      userGrowth: {
        isMonthly,
        series: userGrowthRaw.map((row) => ({
          label: row.label,
          students: row.students,
          tutors: row.tutors,
        })),
      },
      solveRate: {
        solved,
        total: outcomesTotal,
        rate: outcomesTotal > 0 ? round2((solved / outcomesTotal) * 100) : 0,
      },
      activeTutors: {
        active,
        total: tutorFunnel.APPROVED,
        inactive: Math.max(tutorFunnel.APPROVED - active, 0),
        windowDays: 30,
      },
      ratingDistribution: [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count: ratingMap[rating],
      })),
      goalSplit: goalSplitRaw.map((row) => ({
        goalType: row.goalType ?? "UNSPECIFIED",
        count: row.count,
      })),
      hourlyRateDistribution,
      ratingVsCompleted: ratingVsCompletedRaw,
    };
  };

  return await run(prisma);
};

export const AdminServices = {
  getAllUsers,
  updateUser,
  getStats,
  getAllTutors,
  updateTutorVerification,
  getAnalytics,
};
