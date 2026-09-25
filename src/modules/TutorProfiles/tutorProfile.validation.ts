import { z } from "zod";

export const createTutorProfileValidationSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
    categoriesId: z.string().min(1, "Category is required"),
    bio: z.string().optional(),
    experienceYears: z.number().min(0, "Experience must be non-negative"),
    hourlyRate: z.number().min(0, "Hourly rate must be non-negative"),
    tags: z.array(z.string()).optional(),
    subjectIds: z.array(z.string()).max(30).optional(),
    skillIds: z.array(z.string()).max(30).optional(),
    headline: z.string().max(100, "Headline must be at most 100 characters").optional(),
    currentRoleOrInstitution: z.string().max(200).optional(),
    linkedinUrl: z.union([z.string().url(), z.literal("")]).optional(),
    githubUrl: z.union([z.string().url(), z.literal("")]).optional(),
    portfolioUrl: z.union([z.string().url(), z.literal("")]).optional(),
  }),
});

export const updateTutorProfileValidationSchema = z.object({
  body: z.object({
    categoriesId: z.string().min(1, "Category is required").optional(),
    bio: z.string().optional(),
    experienceYears: z
      .number()
      .min(0, "Experience must be non-negative")
      .optional(),
    hourlyRate: z
      .number()
      .min(0, "Hourly rate must be non-negative")
      .optional(),
    tags: z.array(z.string()).optional(),
    subjectIds: z.array(z.string()).max(30).optional(),
    skillIds: z.array(z.string()).max(30).optional(),
    headline: z.string().max(100, "Headline must be at most 100 characters").optional(),
    currentRoleOrInstitution: z.string().max(200).optional(),
    linkedinUrl: z.union([z.string().url(), z.literal("")]).optional(),
    githubUrl: z.union([z.string().url(), z.literal("")]).optional(),
    portfolioUrl: z.union([z.string().url(), z.literal("")]).optional(),
  }),
});

export const getAllTutorProfilesValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    maxPrice: z.string().optional(),
    minPrice: z.string().optional(),
    rating: z.string().optional(),
    availability: z.string().optional(),
    subjectId: z.string().optional(),
    skillId: z.string().optional(),
    availableToday: z.string().optional(),
    availableNow: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const getTutorProfileByIdValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Tutor ID is required"),
  }),
});

export const getTutorAvailabilityValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Tutor ID is required"),
  }),
});

export const getAvailableSlotsValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Tutor ID is required"),
  }),
  query: z.object({
    selectedDate: z.string().min(1, "Selected date is required"),
    slotDuration: z.string().optional(),
  }),
});

export const setAvailabilityValidationSchema = z.object({
  body: z.object({
    dayOfWeek: z.number().min(0).max(6, "Day must be between 0 and 6"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  }),
});

export const updateAvailabilityValidationSchema = z.object({
  body: z.object({
    dayOfWeek: z.number().min(0).max(6).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Availability ID is required"),
  }),
});

export const deleteAvailabilityValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Availability ID is required"),
  }),
});

export const sendClassLinkValidationSchema = z.object({
  body: z.object({
    classLink: z
      .string()
      .min(1, "Class link is required")
      .url("Must be a valid URL"),
  }),
  params: z.object({
    id: z.string().min(1, "Tutor ID is required"),
  }),
  query: z.object({}).optional(),
});

export const setDefaultClassLinkValidationSchema = z.object({
  body: z.object({
    defaultClassLink: z
      .string()
      .min(1, "Default class link is required")
      .url("Must be a valid URL"),
  }),
});

export const getBookingSessionsValidationSchema = z.object({
  query: z.object({
    status: z
      .enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"])
      .optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
