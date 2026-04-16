import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";
import createAppError from "../errors/appError";
import { Status } from "../errors/httpStatus";
import { handleMulterErrors } from "../errors/multerErrors";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const FILE_SIZE_LIMIT = 50 * 1024 * 1024;

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: async (req, file) => {
    try {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw createAppError(
          `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
          Status.BAD_REQUEST,
        );
      }

      const originalName = file.originalname;
      const extension = originalName
        .substring(originalName.lastIndexOf("."))
        .toLowerCase();
      const fileNameWithoutExt = originalName
        .substring(0, originalName.lastIndexOf("."))
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

      return {
        folder: `skillnack/${folder}`,
        public_id: uniqueName,
        resource_type: "auto",
        timeout: 120000, // 2 minutes timeout for large files
      };
    } catch (error) {
      console.error("Error in multer params:", error);
      throw error;
    }
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMIT,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        createAppError(
          `File type not allowed. Allowed types: images, PDFs, documents, PowerPoints, and text files`,
          Status.BAD_REQUEST,
        ) as any,
      );
    }
    cb(null, true);
  },
});

export { storage, handleMulterErrors };
