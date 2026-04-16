import { z } from "zod";

/**
 * Update user profile validation schema
 * Validates: name (optional), phone (optional), image file (optional)
 */
export const updateUserValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    phone: z
      .string()
      .min(10, "Phone must be at least 10 characters")
      .optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
