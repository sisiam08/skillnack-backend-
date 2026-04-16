import { Request, Response } from "express";
import { ReviewServices } from "./review.service";
import { catchAsync } from "../../utils/catchAsync";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, rating, comment } = req.body;

  const data = await ReviewServices.createReview({
    bookingId,
    rating,
    comment,
  });
  return res.status(201).json({
    success: true,
    message: "Review created successfully",
    data,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const data = await ReviewServices.getAllReviews();
  return res.status(200).json({
    success: true,
    message: "Reviews fetched successfully",
    data,
  });
});

const getAllReviewsForTutor = catchAsync(
  async (req: Request, res: Response) => {
    const tutorId = req.params.id as string;

    const data = await ReviewServices.getAllReviewsForTutor(tutorId);

    return res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data,
    });
  },
);

export const ReviewControllers = {
  createReview,
  getAllReviews,
  getAllReviewsForTutor,
};
