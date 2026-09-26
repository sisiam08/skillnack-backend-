import { z } from "zod";

export const getAllUsersValidationSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    role: z.enum(["ADMIN", "TUTOR", "STUDENT"]).optional(),
    status: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const updateUserStatusValidationSchema = z.object({
  body: z.object({
    status: z.string().min(1, "Status is required"),
  }),
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});

export const getAllTutorsValidationSchema = z.object({
  query: z.object({
    verificationStatus: z
      .enum(["PENDING", "APPROVED", "REJECTED"])
      .optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getAnalyticsValidationSchema = z.object({
  query: z.object({
    range: z.enum(["7d", "30d", "90d", "12m"]).optional(),
  }),
});

export const updateTutorVerificationValidationSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"], {
      message: "Status must be APPROVED or REJECTED",
    }),
    rejectionReason: z
      .string()
      .max(500, "Reason must be at most 500 characters")
      .optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Tutor profile ID is required"),
  }),
});
