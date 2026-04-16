import express from "express";
import { UploadControllers } from "./upload.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { upload, handleMulterErrors } from "../../config/multer.config";
import { uploadImageValidationSchema } from "./upload.validation";

const router = express.Router();

router.post(
  "/",
  upload.single("image"),
  handleMulterErrors,
  validateRequest(uploadImageValidationSchema),
  UploadControllers.uploadImage,
);

export const UploadRouters = router;
