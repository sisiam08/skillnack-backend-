import express from "express";
import { auth_middleware } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserRole } from "../../generated/client";
import { AdminControllers } from "./admin.controller";
import {
  getAllUsersValidationSchema,
  updateUserStatusValidationSchema,
  getAllTutorsValidationSchema,
  updateTutorVerificationValidationSchema,
  getAnalyticsValidationSchema,
} from "./admin.validation";

const router = express.Router();

router.get(
  "/users",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(getAllUsersValidationSchema),
  AdminControllers.getAllUsers,
);

router.patch(
  "/users/:id",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(updateUserStatusValidationSchema),
  AdminControllers.updateUser,
);

router.get(
  "/stats",
  auth_middleware([UserRole.ADMIN]),
  AdminControllers.getStats,
);

router.get(
  "/analytics",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(getAnalyticsValidationSchema),
  AdminControllers.getAnalytics,
);

router.get(
  "/tutors",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(getAllTutorsValidationSchema),
  AdminControllers.getAllTutors,
);

router.patch(
  "/tutors/:id/verification",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(updateTutorVerificationValidationSchema),
  AdminControllers.updateTutorVerification,
);

export const AdminRouters = router;
