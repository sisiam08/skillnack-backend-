import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { isAppError } from "../errors/appError";
import {
  handlePrismaError,
  handlePrismaValidationError,
  handlePrismaInitializationError,
} from "../errors/prismaErrors";
import { IErrorSource } from "../interfaces";
import { Prisma } from "../../generated/prisma/client";
import { handleZodError } from "../errors/zodError";

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorSource: IErrorSource[] = [];

  // Store original error for logging in development
  const isDevelopment = process.env.NODE_ENV === "development";
  const stack = isDevelopment ? (err as Error).stack : undefined;

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const {
      statusCode: code,
      message: msg,
      errorSource: source,
    } = handleZodError(err);
    statusCode = code;
    message = msg;
    errorSource = source;
  }
  // Handle Prisma Known Request Errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const {
      statusCode: code,
      message: msg,
      errorSource: source,
    } = handlePrismaError(err);
    statusCode = code;
    message = msg;
    errorSource = source;
  }
  // Handle Prisma Validation Error
  else if (err instanceof Prisma.PrismaClientValidationError) {
    const {
      statusCode: code,
      message: msg,
      errorSource: source,
    } = handlePrismaValidationError(err);
    statusCode = code;
    message = msg;
    errorSource = source;
  }
  // Handle Prisma Initialization Error
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    const {
      statusCode: code,
      message: msg,
      errorSource: source,
    } = handlePrismaInitializationError(err);
    statusCode = code;
    message = msg;
    errorSource = source;
  }
  // Handle Custom AppError
  else if (isAppError(err)) {
    statusCode = err.statusCode;
    message = err.message;
    errorSource = [
      {
        path: "application",
        message: err.message,
      },
    ];
  }
  // Handle Generic Error
  else if (err instanceof Error) {
    message = err.message;
    errorSource = [
      {
        path: "application",
        message: err.message,
      },
    ];
  }

  const response: any = {
    success: false,
    message,
    errorSource,
  };

  // Only include stack in development
  if (process.env.NODE_ENV === "development") {
    response.statusCode = statusCode;
    response.stack = stack;
  }

  res.status(statusCode).json(response);
};
