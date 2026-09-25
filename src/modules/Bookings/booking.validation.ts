import { z } from "zod";

export const createBookingValidationSchema = z.object({
  body: z.object({
    tutorId: z.string().min(1, "Tutor ID is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(100, "Title must be at most 100 characters"),
    description: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(1000, "Description must be at most 1000 characters"),
    goalType: z.enum(["SOLVE_PROBLEM", "LEARN_TOPIC"]).optional(),
    currentTime: z.string().optional(),
    todayDate: z.string().optional(),
  }),
});

export const getAllBookingsValidationSchema = z.object({
  query: z.object({
    status: z
      .enum(["PENDING", "CONFIRMED", "RUNNING", "COMPLETED", "CANCELLED"])
      .optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getBookingDetailsValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Booking ID is required"),
  }),
});

export const recordOutcomeValidationSchema = z.object({
  body: z.object({
    outcome: z.enum(["SOLVED", "PARTIALLY_SOLVED", "NOT_SOLVED"], {
      message: "Invalid session outcome",
    }),
  }),
  params: z.object({
    id: z.string().min(1, "Booking ID is required"),
  }),
});

export const updateBookingSummaryValidationSchema = z.object({
  body: z.object({
    summary: z
      .string()
      .trim()
      .min(1, "Summary is required")
      .max(2000, "Summary must be at most 2000 characters"),
  }),
  params: z.object({
    id: z.string().min(1, "Booking ID is required"),
  }),
});

export const updateBookingStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(
      ["PENDING", "CONFIRMED", "RUNNING", "COMPLETED", "CANCELLED"],
      {
        message: "Invalid booking status",
      },
    ),
  }),
  params: z.object({
    id: z.string().min(1, "Booking ID is required"),
  }),
});
