import { Router } from "express";
import { TutorProfileControllers } from "./tutorProfile.controller";
import { auth_middleware } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserRole } from "../../generated/enums";
import {
  createTutorProfileValidationSchema,
  updateTutorProfileValidationSchema,
  getAllTutorProfilesValidationSchema,
  getTutorProfileByIdValidationSchema,
  getTutorAvailabilityValidationSchema,
  getAvailableSlotsValidationSchema,
  setAvailabilityValidationSchema,
  updateAvailabilityValidationSchema,
  deleteAvailabilityValidationSchema,
  sendClassLinkValidationSchema,
  setDefaultClassLinkValidationSchema,
  getBookingSessionsValidationSchema,
} from "./tutorProfile.validation";

const router = Router();

router.post(
  "/",
  auth_middleware([UserRole.TUTOR]),
  validateRequest(createTutorProfileValidationSchema),
  TutorProfileControllers.createProfile,
);

router.get(
  "/",
  validateRequest(getAllTutorProfilesValidationSchema),
  TutorProfileControllers.getAllProfiles,
);

router.get(
  "/profile",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.getMyProfile,
);

router.get(
  "/bookings",
  auth_middleware([UserRole.TUTOR]),
  validateRequest(getBookingSessionsValidationSchema),
  TutorProfileControllers.getBookingSessions,
);

router.get(
  "/defaultClassLink",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.getDefaultClassLink,
);

router.get(
  "/stats",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.getTutorStats,
);

router.get(
  "/weeklyEarnings",
  auth_middleware([UserRole.TUTOR]),
  TutorProfileControllers.getWeeklyEarnings,
);

router.get(
  "/:id",
  validateRequest(getTutorProfileByIdValidationSchema),
  TutorProfileControllers.getProfileById,
);

router.patch(
  "/",
  auth_middleware([UserRole.TUTOR]),
  validateRequest(updateTutorProfileValidationSchema),
  TutorProfileControllers.updateProfile,
);

router.post(
  "/availability",
  auth_middleware([UserRole.TUTOR]),
  validateRequest(setAvailabilityValidationSchema),
  TutorProfileControllers.setAvailability,
);

router.get(
  "/:id/availability",
  validateRequest(getTutorAvailabilityValidationSchema),
  TutorProfileControllers.getAvailability,
);

router.get(
  "/:id/availableSlots",
  validateRequest(getAvailableSlotsValidationSchema),
  TutorProfileControllers.getAvailableSlots,
);

router.patch(
  "/:id/classLink",
  auth_middleware([UserRole.TUTOR]),
  validateRequest(sendClassLinkValidationSchema),
  TutorProfileControllers.sendClassLink,
);

router.patch(
  "/availability/:id",
  auth_middleware([UserRole.TUTOR]),
  validateRequest(updateAvailabilityValidationSchema),
  TutorProfileControllers.updateAvailability,
);

router.delete(
  "/availability/:id",
  auth_middleware([UserRole.TUTOR]),
  validateRequest(deleteAvailabilityValidationSchema),
  TutorProfileControllers.deleteAvailability,
);

router.patch(
  "/defaultClassLink",
  auth_middleware([UserRole.TUTOR]),
  validateRequest(setDefaultClassLinkValidationSchema),
  TutorProfileControllers.setDefaultClassLink,
);

export const TutorProfileRouters: Router = router;
