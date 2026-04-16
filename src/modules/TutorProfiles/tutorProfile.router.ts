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

router.get(
  "/bookings",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.getBookingSessions,
);

router.get(
  "/defaultClassLink",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.getDefaultClassLink,
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

router.get("/:id/availableSlots", TutorProfileControllers.getAvailableSlots);

router.patch(
  "/availability/:id",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.updateAvailability,
);

router.delete(
  "/availability/:id",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.deleteAvailability,
);

router.patch(
  "/defaultClassLink",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.setDefaultClassLink,
);

export const TutorProfileRouters: Router = router;
