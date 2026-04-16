import { Router } from "express";
import { TutorProfileControllers } from "./tutorProfile.controller";
import { auth_middleware } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.createProfile,
);

router.get("/", TutorProfileControllers.getAllProfiles);

router.get(
  "/profile",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.getMyProfile,
);

router.get("/:id", TutorProfileControllers.getProfileById);

router.patch(
  "/",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.updateProfile,
);

router.post(
  "/availability",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.setAvailability,
);

router.get("/:id/availability", TutorProfileControllers.getAvailability);

export const TutorProfileRouters: Router = router;
