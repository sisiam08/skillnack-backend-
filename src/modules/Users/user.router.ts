import express from "express";
import { upload, handleMulterErrors } from "../../config/multer.config";
import { auth_middleware } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserRole } from "../../../generated/prisma/client";
import { UserControllers } from "./user.controller";
import { updateUserValidationSchema } from "./user.validation";

const router = express.Router();

router.patch(
  "/me",
  auth_middleware([UserRole.ADMIN, UserRole.TUTOR, UserRole.STUDENT]),
  upload.single("image"),
  handleMulterErrors,
  validateRequest(updateUserValidationSchema),
  UserControllers.updateMe,
);

export const UserRouters = router;
