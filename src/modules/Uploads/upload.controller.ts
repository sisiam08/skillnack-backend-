import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import createAppError from "../../errors/appError";
import { httpStatus } from "../../errors/httpStatus";

const uploadImage = catchAsync(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    throw createAppError("No file uploaded", httpStatus.BAD_REQUEST);
  }

  // Validate file path was set by Cloudinary
  const fileUrl = (file as any).path;
  if (!fileUrl) {
    throw createAppError(
      "File upload failed - invalid response from storage",
      httpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  return res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    data: { url: fileUrl },
  });
});

export const UploadControllers = {
  uploadImage,
};
