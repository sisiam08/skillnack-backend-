import { z } from "zod";

/**
 * Get student stats validation schema
 * No parameters needed
 */
export const getStudentStatsValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * Get recent activity validation schema
 * Validates: pagination parameters
 */
export const getRecentActivityValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
