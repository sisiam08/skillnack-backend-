import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });

// Query logging is off by default; enable with PRISMA_LOG_QUERY=true for
// performance profiling (see PERFORMANCE_REPORT.md).
const prisma = new PrismaClient({
  adapter,
  log:
    process.env.PRISMA_LOG_QUERY === "true"
      ? ["query", "warn", "error"]
      : ["warn", "error"],
});

export { prisma };