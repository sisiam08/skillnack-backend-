import { z } from "zod";

export const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Category name is required"),
    description: z.string().optional(),
  }),
});

export const updateCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    description: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Category ID is required"),
  }),
});

export const deleteCategoryValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Category ID is required"),
  }),
});
