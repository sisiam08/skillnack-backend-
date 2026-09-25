import { z } from "zod";

export const createSkillValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Skill name is required")
      .max(150, "Skill name must be at most 150 characters"),
    categoryId: z.string().min(1, "Category ID cannot be empty").optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateSkillValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty")
      .max(150, "Skill name must be at most 150 characters")
      .optional(),
    categoryId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Skill ID is required"),
  }),
});

export const deleteSkillValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Skill ID is required"),
  }),
});
