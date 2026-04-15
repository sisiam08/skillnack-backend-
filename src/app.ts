import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { notFoundMiddleware } from "./middleware/notFound";
import { globalErrorHandler } from "./middleware/globalErrorHandler";

const app: Application = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Learners!");
});

app.use(notFoundMiddleware);

app.use(globalErrorHandler);

export default app;
