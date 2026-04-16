import { z } from "zod";

/**
 * Create review validation schema
 * Validates: bookingId, rating (1-5), and optional comment
 */
export const createReviewValidationSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
    rating: z
      .number()
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot exceed 5"),
    comment: z.string().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * Get all reviews validation schema
 * Validates: pagination parameters
 */
export const getAllReviewsValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

/**
 * Get reviews for specific tutor validation schema
 * Validates: tutorId in params
 */
export const getTutorReviewsValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1, "Tutor ID is required"),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
