-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "summary" VARCHAR(2000),
ADD COLUMN     "summaryAt" TIMESTAMP(3),
ADD COLUMN     "summaryUpdatedAt" TIMESTAMP(3);
