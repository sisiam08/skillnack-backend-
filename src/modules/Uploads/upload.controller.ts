import { Request, Response } from "express";
import { UploadServices } from "./upload.service";
import { catchAsync } from "../../utils/catchAsync";

const uploadImage = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const fileUrl = await UploadServices.uploadImage(file);

  return res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    data: { url: fileUrl },
  });
});

export const UploadControllers = {
  uploadImage,
};
