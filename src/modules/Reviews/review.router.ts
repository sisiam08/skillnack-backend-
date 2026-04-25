import express from "express";
import { ReviewControllers } from "./review.controller";
import { auth_middleware } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserRole } from "../../generated/client";
import {
  createReviewValidationSchema,
  getAllReviewsValidationSchema,
  getTutorReviewsValidationSchema,
} from "./review.validation";

const router = express.Router();

router.post(
  "/",
  auth_middleware([UserRole.STUDENT]),
  validateRequest(createReviewValidationSchema),
  ReviewControllers.createReview,
);

router.get(
  "/",
  validateRequest(getAllReviewsValidationSchema),
  ReviewControllers.getAllReviews,
);

router.get(
  "/tutor/:id",
  validateRequest(getTutorReviewsValidationSchema),
  ReviewControllers.getAllReviewsForTutor,
);

export const ReviewRouters = router;
