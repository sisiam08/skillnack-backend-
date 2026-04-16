import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  baseURL: process.env.BETTER_AUTH_URL,
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
};

export default config;
