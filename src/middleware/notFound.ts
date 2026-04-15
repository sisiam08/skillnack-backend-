import { Request, Response } from "express";
import { httpStatus } from "../errors/httpStatus";

export const notFoundMiddleware = (req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "The requested resource was not found",
    error: `Cannot ${req.method} ${req.originalUrl}`,
    statusCode: "notfound",
  });
};
