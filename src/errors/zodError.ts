import { ZodError } from "zod";
import { IErrorSource } from "../interfaces";

/**
 * Handle Zod validation errors and format them consistently
 * Returns status code, message, and detailed error sources
 */
export const handleZodError = (err: ZodError<unknown>) => {
  const statusCode = 400;
  const message = "Validation Error";

  const errorSource: IErrorSource[] = err.issues.map((issue: any) => {
    const pathArray = Array.isArray(issue.path) ? issue.path : [issue.path];
    const path = pathArray
      .filter((p: string | number | undefined) => p !== undefined)
      .join(".");

    return {
      path: path || "root",
      message: issue.message,
    };
  });

  return {
    statusCode,
    message,
    errorSource,
  };
};
