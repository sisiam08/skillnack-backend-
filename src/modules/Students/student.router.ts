import express from "express";
import { StudentControllers } from "./student.controller";
import { auth_middleware } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";

const router = express.Router();

router.get(
  "/stats",
  auth_middleware([UserRole.STUDENT]),
  StudentControllers.getStudentStats,
);

router.get(
  "/recentActivity",
  auth_middleware([UserRole.STUDENT]),
  StudentControllers.getRecentActivity,
);

export const StudentRouter = router;
