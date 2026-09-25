-- CreateEnum
CREATE TYPE "BookingGoalType" AS ENUM ('SOLVE_PROBLEM', 'LEARN_TOPIC');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "attachments" VARCHAR(500)[] DEFAULT ARRAY[]::VARCHAR(500)[],
ADD COLUMN     "description" VARCHAR(1000),
ADD COLUMN     "goalType" "BookingGoalType",
ADD COLUMN     "title" VARCHAR(100);
