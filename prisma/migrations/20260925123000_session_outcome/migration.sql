-- CreateEnum
CREATE TYPE "SessionOutcome" AS ENUM ('SOLVED', 'PARTIALLY_SOLVED', 'NOT_SOLVED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "outcome" "SessionOutcome",
ADD COLUMN     "outcomeAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tutorProfiles" ADD COLUMN     "solvedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalOutcomesRecorded" INTEGER NOT NULL DEFAULT 0;
