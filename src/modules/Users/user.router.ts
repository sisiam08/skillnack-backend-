import express from "express";
import { upload, handleMulterErrors } from "../../config/multer.config";
import { auth_middleware } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";
import { UserControllers } from "./user.controller";

const router = express.Router();

router.patch(
  "/me",
  auth_middleware([UserRole.ADMIN, UserRole.TUTOR, UserRole.STUDENT]),
  upload.single("image"),
  handleMulterErrors,
  UserControllers.updateMe,
);

export const UserRouters = router;
