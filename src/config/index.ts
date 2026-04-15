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
    secret: process.env.BETTER_AUTH_SECRET,
    url: process.env.BETTER_AUTH_URL,
  },
};

export default config;
