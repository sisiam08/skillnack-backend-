import { Server } from "http";
import app from "./app";
import { prisma } from "./lib/prisma";
import config from "./config";

let server: Server;

async function main() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
    server = app.listen(config.port, () => {
      console.log(`Ilmefy app listening on port ${config.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

main();

const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    await prisma.$disconnect();
    console.log("Database connection closed");
  } catch (err) {
    console.error("Error closing database connection:", err);
  }

  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error("Forced shutdown due to timeout");
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("Unhandled Rejection at:", promise, "Reason:", reason);
  process.exit(1);
});

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  gracefulShutdown("SIGINT");
});
