import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { Status } from "./httpStatus";

export const handleMulterErrors = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    // File size exceeds limit
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(Status.BAD_REQUEST).json({
        success: false,
        message: "File size exceeds the maximum limit of 50MB",
        errorSource: [
          {
            path: "file",
            message: "File size exceeds the maximum limit of 50MB",
          },
        ],
      });
    }

    // Number of files exceeds limit
    if (err.code === "LIMIT_FILE_COUNT") {
      const message = "Too many files uploaded. Check the allowed file count for this endpoint";
      return res.status(Status.BAD_REQUEST).json({
        success: false,
        message,
        errorSource: [
          {
            path: "file",
            message,
          },
        ],
      });
    }

    // Unexpected field name
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(Status.BAD_REQUEST).json({
        success: false,
        message: "Unexpected field name. Expected 'image' field",
        errorSource: [
          {
            path: "file",
            message: "Unexpected field name. Expected 'image' field",
          },
        ],
      });
    }

    // Generic multer error
    return res.status(Status.BAD_REQUEST).json({
      success: false,
      message: `File upload error: ${err.message}`,
      errorSource: [
        {
          path: "file",
          message: err.message,
        },
      ],
    });
  }

  // Pass other errors to next middleware
  next(err);
};
