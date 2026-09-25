import { z } from "zod";

export const createSubjectValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Subject name is required")
      .max(150, "Subject name must be at most 150 characters"),
    categoryId: z.string().min(1, "Category ID cannot be empty").optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateSubjectValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty")
      .max(150, "Subject name must be at most 150 characters")
      .optional(),
    categoryId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Subject ID is required"),
  }),
});

export const deleteSubjectValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Subject ID is required"),
  }),
});
