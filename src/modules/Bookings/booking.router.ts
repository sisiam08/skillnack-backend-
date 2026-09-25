import express from "express";
import { auth_middleware } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { uploadMultiple, handleMulterErrors } from "../../config/multer.config";
import { UserRole } from "../../generated/client";
import { BookingControllers } from "./booking.controller";
import {
  createBookingValidationSchema,
  getAllBookingsValidationSchema,
  getBookingDetailsValidationSchema,
  updateBookingStatusValidationSchema,
  recordOutcomeValidationSchema,
  updateBookingSummaryValidationSchema,
} from "./booking.validation";

const router = express.Router();

router.post(
  "/",
  auth_middleware([UserRole.STUDENT]),
  uploadMultiple.array("attachments", 5),
  handleMulterErrors,
  validateRequest(createBookingValidationSchema),
  BookingControllers.createBooking,
);

router.get(
  "/",
  auth_middleware([UserRole.ADMIN]),
  validateRequest(getAllBookingsValidationSchema),
  BookingControllers.getAllBookings,
);

router.get(
  "/my-bookings",
  auth_middleware([UserRole.STUDENT]),
  validateRequest(getAllBookingsValidationSchema),
  BookingControllers.getMyBookings,
);

router.get(
  "/:id",
  auth_middleware([UserRole.ADMIN, UserRole.STUDENT]),
  validateRequest(getBookingDetailsValidationSchema),
  BookingControllers.getBookingDetails,
);

router.patch(
  "/:id/outcome",
  auth_middleware([UserRole.STUDENT]),
  validateRequest(recordOutcomeValidationSchema),
  BookingControllers.recordOutcome,
);

router.patch(
  "/:id/summary",
  auth_middleware([UserRole.TUTOR]),
  validateRequest(updateBookingSummaryValidationSchema),
  BookingControllers.updateBookingSummary,
);

router.patch(
  "/:id",
  auth_middleware([UserRole.TUTOR, UserRole.STUDENT]),
  validateRequest(updateBookingStatusValidationSchema),
  BookingControllers.updateBookingStatus,
);

export const BookingRouters = router;
