-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "tutorProfiles" ADD COLUMN     "currentRoleOrInstitution" TEXT,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "headline" VARCHAR(100),
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "portfolioUrl" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';

-- Backfill: tutors that already existed before the verification gate are
-- auto-approved so they are not silently hidden from public listings.
-- Documented decision in AI_CONTEXT.md (Task 3). New profiles still default
-- to PENDING because the column default stays 'PENDING'.
UPDATE "tutorProfiles" SET "verificationStatus" = 'APPROVED';
