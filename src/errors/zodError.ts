import { ZodError } from "zod";
import { IErrorSource } from "../interfaces";

export const handleZodError = (err: ZodError<unknown>) => {
  const statusCode = 400;
  const message = "Validation Error";
  const errorSource: IErrorSource[] = err.issues.map((issue: any) => ({
    path: Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path),
    message: issue.message,
  }));

  return {
    statusCode,
    message,
    errorSource,
  };
};
