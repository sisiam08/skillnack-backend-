import { z } from "zod";

/**
 * Create category validation schema
 * Validates: name (required), description (optional)
 */
export const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Category name is required"),
    description: z.string().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * Update category validation schema
 * Validates: categoryId in params, name and/or description in body
 */
export const updateCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    description: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Category ID is required"),
  }),
  query: z.object({}).optional(),
});

/**
 * Delete category validation schema
 * Validates: categoryId in params
 */
export const deleteCategoryValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1, "Category ID is required"),
  }),
  query: z.object({}).optional(),
});

/**
 * Get all categories validation schema
 * No specific validation needed (open endpoint)
 */
export const getAllCategoriesValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
