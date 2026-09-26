import { pathToFileURL } from "node:url";
import config from "../src/config";
import { prisma } from "../src/lib/prisma";
import { setSkipEmailDuringSeed } from "../src/lib/auth";
import { UserRole, VerificationStatus } from "../src/generated/enums";

/**
 * DEV-ONLY seed: creates an approved test tutor so the tutor dashboard
 * (e.g. /tutor-dashboard/tutor-profile) can be exercised end-to-end.
 * Guarded like seedAdmin() - never runs in production. Idempotent (skips
 * if the account already exists).
 */
const TEST_TUTOR = {
  name: "Test Tutor",
  email: "tutor.test@ilmefy.dev",
  password: "TestTutor123!",
  bio: "Dev seed account for QA. Experienced software engineer covering data structures and modern frontend development.",
  headline: "Software Engineer & Tutor",
  currentRoleOrInstitution: "QA Test Account",
  experienceYears: 4,
  hourlyRate: 500,
  categoryName: "Programming & Software Development",
  subjectNames: ["Data Structures", "Algorithms"],
  skillNames: ["React", "JavaScript", "System Design"],
};

export async function seedTestTutor() {
  if (config.env === "production") return;

  const existingUser = await prisma.user.findUnique({
    where: { email: TEST_TUTOR.email },
  });

  if (existingUser) {
    console.log("✓ Test tutor already exists");
    return;
  }

  const authUrl = `${config.betterAuth.betterAuthUrl}/api/auth/sign-up/email`;

  setSkipEmailDuringSeed(true);
  const signUpResponse = await fetch(authUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: config.appUrl || "http://localhost:3000",
    },
    body: JSON.stringify({
      name: TEST_TUTOR.name,
      email: TEST_TUTOR.email,
      password: TEST_TUTOR.password,
      role: UserRole.TUTOR,
    }),
  });
  setSkipEmailDuringSeed(false);

  if (!signUpResponse.ok) {
    const errorText = await signUpResponse.text();
    throw new Error(
      `Test tutor sign-up failed (${signUpResponse.status}): ${errorText}`,
    );
  }

  const user = await prisma.user.update({
    where: { email: TEST_TUTOR.email },
    data: { emailVerified: true, role: UserRole.TUTOR },
  });

  const category = await prisma.categories.findFirst({
    where: { name: TEST_TUTOR.categoryName },
    select: { id: true, name: true },
  });
  const subjects = await prisma.subject.findMany({
    where: { name: { in: TEST_TUTOR.subjectNames } },
    select: { id: true, name: true },
  });
  const skills = await prisma.skill.findMany({
    where: { name: { in: TEST_TUTOR.skillNames } },
    select: { id: true, name: true },
  });

  const profile = await prisma.tutorProfiles.create({
    data: {
      userId: user.id,
      categoriesId: category?.id ?? null,
      bio: TEST_TUTOR.bio,
      headline: TEST_TUTOR.headline,
      currentRoleOrInstitution: TEST_TUTOR.currentRoleOrInstitution,
      experienceYears: TEST_TUTOR.experienceYears,
      hourlyRate: TEST_TUTOR.hourlyRate,
      verificationStatus: VerificationStatus.APPROVED,
      subjects: { connect: subjects.map((s) => ({ id: s.id })) },
      skills: { connect: skills.map((s) => ({ id: s.id })) },
    },
  });

  await prisma.tutorAvailability.create({
    data: {
      tutorId: profile.id,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      isActive: true,
    },
  });

  console.log(
    `✅ Test tutor created: ${TEST_TUTOR.email} | category=${category?.name ?? "none"} | subjects=[${subjects
      .map((s) => s.name)
      .join(", ")}] | skills=[${skills.map((s) => s.name).join(", ")}]`,
  );
}

// Only run seed if this file is executed directly (not imported)
const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  (async () => {
    if (config.env === "production") {
      console.error("🚫 Refusing to seed test tutor in production");
      process.exit(1);
    }
    await seedTestTutor();
    await prisma.$disconnect();
    process.exit(0);
  })().catch(async (error) => {
    console.error("❌ Test tutor seeding failed:", error.message || error);
    await prisma.$disconnect();
    process.exit(1);
  });
}
