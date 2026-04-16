import { put } from "@vercel/blob";

const uploadImage = async (file: Express.Multer.File) => {
  try {
    const fileName = `uploads/${Date.now()}-${file.originalname}`;

    const blob = await put(fileName, file.buffer, {
      access: "public",
      contentType: file.mimetype,
    });

    return blob.url;
  } catch (error) {
    throw error;
  }
};

export const UploadServices = {
  uploadImage,
};
