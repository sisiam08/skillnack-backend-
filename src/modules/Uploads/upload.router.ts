import express from "express";
import { UploadControllers } from "./upload.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { upload, handleMulterErrors } from "../../config/multer.config";

const router = express.Router();

router.post(
  "/",
  upload.single("image"),
  handleMulterErrors,
  UploadControllers.uploadImage,
);

export const UploadRouters = router;
