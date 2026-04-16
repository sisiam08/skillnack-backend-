import { z } from "zod";

/**
 * Create tutor profile validation schema
 */
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
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * Update tutor profile validation schema
 */
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
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * Get all tutor profiles validation schema
 * Validates: search, category, price filters, pagination, sorting
 */
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

/**
 * Get tutor profile by ID validation schema
 */
export const getTutorProfileByIdValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string({ required_error: "Tutor ID is required" }).min(1),
  }),
  query: z.object({}).optional(),
});

/**
 * Get tutor availability validation schema
 */
export const getTutorAvailabilityValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string({ required_error: "Tutor ID is required" }).min(1),
  }),
  query: z.object({}).optional(),
});

/**
 * Get available slots validation schema
 */
export const getAvailableSlotsValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string({ required_error: "Tutor ID is required" }).min(1),
  }),
  query: z.object({
    selectedDate: z.string({ required_error: "Selected date is required" }),
    slotDuration: z.string().optional(),
  }),
});

/**
 * Set availability validation schema
 */
export const setAvailabilityValidationSchema = z.object({
  body: z.object({
    day: z.string({ required_error: "Day is required" }),
    startTime: z.string({ required_error: "Start time is required" }),
    endTime: z.string({ required_error: "End time is required" }),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * Update availability validation schema
 */
export const updateAvailabilityValidationSchema = z.object({
  body: z.object({
    day: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: "Availability ID is required" }).min(1),
  }),
  query: z.object({}).optional(),
});

/**
 * Delete availability validation schema
 */
export const deleteAvailabilityValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string({ required_error: "Availability ID is required" }).min(1),
  }),
  query: z.object({}).optional(),
});

/**
 * Send class link validation schema
 */
export const sendClassLinkValidationSchema = z.object({
  body: z.object({
    classLink: z
      .string({ required_error: "Class link is required" })
      .url("Must be a valid URL"),
  }),
  params: z.object({
    id: z.string({ required_error: "Tutor ID is required" }).min(1),
  }),
  query: z.object({}).optional(),
});

/**
 * Set default class link validation schema
 */
export const setDefaultClassLinkValidationSchema = z.object({
  body: z.object({
    defaultClassLink: z
      .string({ required_error: "Default class link is required" })
      .url("Must be a valid URL"),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * Get booking sessions validation schema
 */
export const getBookingSessionsValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    status: z
      .enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"])
      .optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

/**
 * Get tutor stats validation schema
 */
export const getTutorStatsValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * Get weekly earnings validation schema
 */
export const getWeeklyEarningsValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * Get my profile validation schema
 */
export const getMyProfileValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * Get default class link validation schema
 */
export const getDefaultClassLinkValidationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
