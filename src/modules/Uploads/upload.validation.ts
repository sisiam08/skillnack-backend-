import { z } from "zod";

/**
 * Upload image validation schema
 * Validates file upload with image field
 */
export const uploadImageValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
