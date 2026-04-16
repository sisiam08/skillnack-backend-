import express from "express";
import { auth_middleware } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";
import { AdminControllers } from "./admin.controller";

const router = express.Router();

router.get(
  "/users",
  auth_middleware([UserRole.ADMIN]),
  AdminControllers.getAllUsers,
);

router.patch(
  "/users/:id",
  auth_middleware([UserRole.ADMIN]),
  AdminControllers.updateUser,
);

router.get(
  "/stats",
  auth_middleware([UserRole.ADMIN]),
  AdminControllers.getStats,
);

export const AdminRouters = router;
