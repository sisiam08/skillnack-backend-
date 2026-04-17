import {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
} from "../../config/cloudinary.config";
import createAppError from "../../errors/appError";
import { Status } from "../../errors/httpStatus";

const uploadImage = async (file: Express.Multer.File) => {
  try {
    if (!file) {
      throw createAppError("No file provided for upload", Status.BAD_REQUEST);
    }

    const result = await uploadFileToCloudinary(file.buffer, file.originalname);
    return result.secure_url;
  } catch (error) {
    throw error;
  }
};

const deleteImage = async (imageUrl: string) => {
  try {
    if (!imageUrl) {
      throw createAppError(
        "No image URL provided for deletion",
        Status.BAD_REQUEST,
      );
    }

    await deleteFileFromCloudinary(imageUrl);
    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const UploadServices = {
  uploadImage,
  deleteImage,
};
