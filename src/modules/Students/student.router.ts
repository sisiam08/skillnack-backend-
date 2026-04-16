import express from "express";
import { StudentControllers } from "./student.controller";
import { auth_middleware } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserRole } from "../../../generated/prisma/enums";
import {
  getStudentStatsValidationSchema,
  getRecentActivityValidationSchema,
} from "./student.validation";

const router = express.Router();

router.get(
  "/stats",
  auth_middleware([UserRole.STUDENT]),
  validateRequest(getStudentStatsValidationSchema),
  StudentControllers.getStudentStats,
);

router.get(
  "/recentActivity",
  auth_middleware([UserRole.STUDENT]),
  validateRequest(getRecentActivityValidationSchema),
  StudentControllers.getRecentActivity,
);

export const StudentRouter = router;
