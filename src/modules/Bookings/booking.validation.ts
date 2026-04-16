import { z } from "zod";

/**
 * Booking creation validation schema
 * Validates: tutorId, startTime, endTime, optional currentTime and todayDate
 */
export const createBookingValidationSchema = z.object({
  body: z.object({
    tutorId: z.string().min(1, "Tutor ID is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    currentTime: z.string().optional(),
    todayDate: z.string().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * Get all bookings validation schema
 * Validates: status (optional), pagination parameters
 */
export const getAllBookingsValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    status: z
      .enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"])
      .optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

/**
 * Get booking details validation schema
 * Validates: bookingId in params
 */
export const getBookingDetailsValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1, "Booking ID is required"),
  }),
  query: z.object({}).optional(),
});

/**
 * Update booking status validation schema
 * Validates: bookingId in params, new status in body
 */
export const updateBookingStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"], {
      message: "Invalid booking status",
    }),
  }),
  params: z.object({
    id: z.string().min(1, "Booking ID is required"),
  }),
  query: z.object({}).optional(),
});
