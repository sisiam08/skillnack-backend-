import { z } from "zod";

export const createTutorProfileValidationSchema = z.object({
  body: z.object({
    bio: z.string().optional(),
    qualifications: z.string().optional(),
    specialization: z.string().optional(),
    experience: z.number().optional(),
    hourlyRate: z.number().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const updateTutorProfileValidationSchema = z.object({
  body: z.object({
    bio: z.string().optional(),
    qualifications: z.string().optional(),
    specialization: z.string().optional(),
    experience: z.number().optional(),
    hourlyRate: z.number().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
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
    day: z.string().min(1, "Day is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  }),
});

export const updateAvailabilityValidationSchema = z.object({
  body: z.object({
    day: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
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
