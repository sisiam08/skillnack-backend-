import { z } from "zod";

export const getAllUsersValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
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
  query: z.object({}).optional(),
});

export const getAdminStatsValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
