import express from "express";
import { UploadControllers } from "./upload.controller";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image"), UploadControllers.uploadImage);

export const UploadRouters = router;
