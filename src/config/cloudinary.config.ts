import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import config from ".";
import createAppError from "../errors/appError";
import { httpStatus } from "../errors/httpStatus";

cloudinary.config({
  cloud_name: config.cloudinary.cloudinaryCloudName,
  api_key: config.cloudinary.cloudinaryApiKey,
  api_secret: config.cloudinary.cloudinaryApiSecret,
});

export const uploadFileToCloudinary = async (
  buffer: Buffer,
  fileName: string,
): Promise<UploadApiResponse> => {
  if (!buffer || !fileName) {
    throw createAppError(
      "File buffer and file name are required for upload",
      httpStatus.BAD_REQUEST,
    );
  }

  const extension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();

  const fileNameWithoutExt = fileName
    .substring(0, fileName.lastIndexOf("."))
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  const uniqueName =
    Math.random().toString(36).substring(2) +
    "-" +
    Date.now() +
    "-" +
    fileNameWithoutExt +
    extension;

  const folder =
    extension === ".pdf"
      ? "pdfs"
      : extension === ".txt"
        ? "texts"
        : extension === ".ppt" || extension === ".pptx"
          ? "presentations"
          : extension === ".doc" || extension === ".docx"
            ? "documents"
            : "images";

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `skillnack/${folder}`,
          public_id: uniqueName,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            return reject(
              createAppError(
                "Failed to upload file to Cloudinary",
                httpStatus.INTERNAL_SERVER_ERROR,
              ),
            );
          }
          resolve(result as UploadApiResponse);
        },
      )
      .end(buffer);
  });
};

export const deleteFileFromCloudinary = async (url: string) => {
  try {
    const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;

    const match = url.match(regex);

    if (match && match[1]) {
      const publicId = match[1];
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      console.log(`File ${publicId} deleted successfully from Cloudinary.`);
    }
  } catch (error) {
    console.error("Error occurred while deleting file from Cloudinary:", error);
    throw createAppError(
      "Failed to delete file from Cloudinary",
      httpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};

export const cloudinaryUpload = cloudinary;
