import { Request, Response } from "express";
import { Status } from "../errors/httpStatus";

export const notFoundMiddleware = (req: Request, res: Response) => {
  res.status(Status.NOT_FOUND).json({
    success: false,
    message: "The requested resource was not found",
    error: `Cannot ${req.method} ${req.originalUrl}`,
    statusCode: "notfound",
  });
};
