import { z } from "zod";

export const createBookingValidationSchema = z.object({
  body: z.object({
    tutorId: z.string().min(1, "Tutor ID is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    currentTime: z.string().optional(),
    todayDate: z.string().optional(),
  }),
});

export const getAllBookingsValidationSchema = z.object({
  query: z.object({
    status: z
      .enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"])
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

export const updateBookingStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"], {
      message: "Invalid booking status",
    }),
  }),
  params: z.object({
    id: z.string().min(1, "Booking ID is required"),
  }),
});
