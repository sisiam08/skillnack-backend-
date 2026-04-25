import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  appUrl: process.env.APP_URL,
  betterAuth: {
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    betterAuthUrl: process.env.BETTER_AUTH_URL,
  },
  cloudinary: {
    cloudinaryCloudName: process.env.CLOUDEINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDEINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDEINARY_API_SECRET,
  },
  admin: {
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
  nodemailer: {
    host: process.env.NODEMAILER_HOST,
    port: Number(process.env.NODEMAILER_PORT as string) || 587,
    auth: {
      user: process.env.APP_USER,
      pass: process.env.APP_PASSWORD,
    },
  },
  stripe: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
};

export default config;
