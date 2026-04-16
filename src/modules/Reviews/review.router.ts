import express from "express";
import { ReviewControllers } from "./review.controller";
import { auth_middleware } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";

const router = express.Router();

router.post(
  "/",
  auth_middleware([UserRole.STUDENT]),
  ReviewControllers.createReview,
);

router.get("/", ReviewControllers.getAllReviews);

router.get("/tutor/:id", ReviewControllers.getAllReviewsForTutor);

export const ReviewRouters = router;
