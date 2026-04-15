import { AppErrorType } from "../interfaces";

const createAppError = (
  message: string,
  statusCode: number,
  isOperational: boolean = true,
): AppErrorType => {
  const error = new Error(message) as AppErrorType;
  error.statusCode = statusCode;
  error.isOperational = isOperational;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, createAppError);
  }

  return error;
};

export const isAppError = (error: unknown): error is AppErrorType => {
  return (
    error instanceof Error &&
    typeof (error as any).statusCode === "number" &&
    typeof (error as any).isOperational === "boolean"
  );
};

export type { AppErrorType };
export default createAppError;
