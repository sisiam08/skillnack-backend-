import {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
} from "../../config/cloudinary.config";

const uploadImage = async (file: Express.Multer.File) => {
  try {
    if (!file) {
      throw new Error("No file provided for upload");
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
      throw new Error("No image URL provided for deletion");
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
