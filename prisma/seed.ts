import config from "../src/config";
import { prisma } from "../src/lib/prisma";
import { setSkipEmailDuringSeed } from "../src/lib/auth";
import { UserRole } from "../src/generated/enums";

/**
 * Seed admin user on application startup via better-auth API
 * Checks if admin exists before creating to avoid duplicates
 */
export async function seedAdmin() {
  try {
    // Check required admin config
    if (!config.admin.email || !config.admin.name || !config.admin.password) {
      console.warn(
        "⚠️  Admin credentials not set in .env. Skipping admin creation.",
      );
      return;
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: config.admin.email,
      },
    });

    if (existingAdmin) {
      console.log("✓ Admin user already exists");
      return;
    }

    const authUrl = `${config.betterAuth.betterAuthUrl}/api/auth/sign-up/email`;

    // Skip email verification during seeding
    setSkipEmailDuringSeed(true);

    const signUpResponse = await fetch(authUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: config.appUrl || "http://localhost:3000",
      },
      body: JSON.stringify({
        name: config.admin.name,
        email: config.admin.email,
        password: config.admin.password,
        role: UserRole.ADMIN,
      }),
    });

    // Reset flag after API call
    setSkipEmailDuringSeed(false);

    if (!signUpResponse.ok) {
      const errorText = await signUpResponse.text();
      console.error("❌ API Error Response:", errorText);
      throw new Error(
        `Better-auth API failed with status ${signUpResponse.status}: ${errorText}`,
      );
    }

    // Mark email as verified and set role to ADMIN
    await prisma.user.update({
      where: {
        email: config.admin.email,
      },
      data: {
        emailVerified: true,
      },
    });

    console.log("✅ Admin user created successfully");
  } catch (error: any) {
    console.error("❌ Admin seeding error:", error.message || error);
    throw error;
  }
}

// Only run seed if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await seedAdmin();
    process.exit(0);
  })().catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
}
