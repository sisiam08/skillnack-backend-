import { Request, Response } from "express";
import { TutorProfileServices } from "./tutorProfile.service";
import { catchAsync } from "../../utils/catchAsync";
import { PaginationOptions, SortingOptions } from "../../interfaces";
import PaginationHelper from "../../helpers/Pagination";
import SortingHelper from "../../helpers/Sorting";
import { BookingStatus } from "../../generated/enums";
import { Status } from "../../errors/httpStatus";

const createProfile = catchAsync(async (req: Request, res: Response) => {
  const data = await TutorProfileServices.createProfile(req.body);

  res.status(Status.CREATED).json({
    success: true,
    message: "Profile created successfully",
    data,
  });
});

const getAllProfiles = catchAsync(async (req: Request, res: Response) => {
  const search = req.query.search ? String(req.query.search) : undefined;

  const category = req.query.category ? String(req.query.category) : undefined;

  const maxPrice = req.query.maxPrice
    ? Number.parseFloat(req.query.maxPrice as string)
    : undefined;
  const minPrice = req.query.minPrice
    ? Number.parseFloat(req.query.minPrice as string)
    : undefined;

  const rating = req.query.rating
    ? Number.parseFloat(req.query.rating as string)
    : undefined;

  const availability = req.query.availability
    ? Number.parseFloat(req.query.availability as string)
    : undefined;

  const subjectId = req.query.subjectId
    ? String(req.query.subjectId)
    : undefined;

  const skillId = req.query.skillId ? String(req.query.skillId) : undefined;

  const availableToday = req.query.availableToday === "true";
  const availableNow = req.query.availableNow === "true";

  const { page, limit, skip }: PaginationOptions = PaginationHelper(req.query);

  const { sortBy, sortOrder }: SortingOptions = SortingHelper(req.query);

  const data = await TutorProfileServices.getAllProfiles(
    search,
    category,
    maxPrice,
    minPrice,
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    rating,
    availability,
    subjectId,
    skillId,
    availableToday,
    availableNow,
  );

  res.status(Status.OK).json({
    success: true,
    message: "Profiles retrieved successfully",
    data,
  });
});

const getProfileById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await TutorProfileServices.getProfileById(id);
  res.status(Status.OK).json({
    success: true,
    message: "Profile details retrieved successfully",
    data,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const data = await TutorProfileServices.getMyProfile(userId);
  res.status(Status.OK).json({
    success: true,
    message: "Profile details retrieved successfully",
    data,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const data = await TutorProfileServices.updateProfile(userId, req.body);
  res.status(Status.OK).json({
    success: true,
    message: "Profile updated successfully",
    data,
  });
});

const setAvailability = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const availability = req.body;

  const data = await TutorProfileServices.setAvailability(userId, availability);

  res.status(Status.CREATED).json({
    success: true,
    message: "Availability set successfully",
    data,
  });
});

const getAvailability = catchAsync(async (req: Request, res: Response) => {
  const tutorId = req.params.id as string;

  const tutorProfile = await TutorProfileServices.getProfileById(tutorId);

  if (req.user?.role === "TUTOR" && req.user?.id !== tutorProfile?.user.id) {
    return res.status(Status.FORBIDDEN).json({
      success: false,
      message: "You dont have permission to view other tutor's availability",
    });
  }

  const data = await TutorProfileServices.getAvailability(tutorId);

  res.status(Status.OK).json({
    success: true,
    message: "Availability retrieved successfully",
    data,
  });
});

const getAvailableSlots = catchAsync(async (req: Request, res: Response) => {
  const tutorId = req.params.id as string;
  const { selectedDate, slotDuration } = req.query;

  const data = await TutorProfileServices.getAvailableSlots(
    tutorId,
    selectedDate as string,
    Number(slotDuration),
  );

  res.status(Status.OK).json({
    success: true,
    message: "Available slots retrieved successfully",
    data,
  });
});

const updateAvailability = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const id = req.params.id as string;
  const availability = req.body;

  const data = await TutorProfileServices.updateAvailability(
    userId,
    id,
    availability,
  );

  res.status(Status.OK).json({
    success: true,
    message: "Availability updated successfully",
    data,
  });
});

const deleteAvailability = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const data = await TutorProfileServices.deleteAvailability(id);

  res.status(Status.OK).json({
    success: true,
    message: "Availability deleted successfully",
    data,
  });
});

const getBookingSessions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const status = req.query.status
    ? (req.query.status as BookingStatus)
    : undefined;

  const { page, limit, skip }: PaginationOptions = PaginationHelper(req.query);

  const data = await TutorProfileServices.getBookingSessions(
    userId!,
    status,
    page,
    limit,
    skip,
  );
  res.status(Status.OK).json({
    success: true,
    message: "Sessions retrieved successfully",
    data,
  });
});

const getTutorStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const data = await TutorProfileServices.getTutorStats(userId!);

  res.status(Status.OK).json({
    success: true,
    message: "Tutor stats retrieved successfully",
    data,
  });
});

const getWeeklyEarnings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const data = await TutorProfileServices.getWeeklyEarnings(userId!);
  res.status(Status.OK).json({
    success: true,
    message: "Weekly earnings retrieved successfully",
    data,
  });
});

const sendClassLink = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.id;
  const { classLink } = req.body;
  const data = await TutorProfileServices.sendClassLink(
    bookingId as string,
    classLink as string,
  );
  if (!data) {
    return res.status(Status.NOT_FOUND).json({
      success: false,
      message: "Booking not found",
    });
  }
  return res.status(Status.OK).json({
    success: true,
    message: "Class link sent successfully",
    data,
  });
});

export const TutorProfileControllers = {
  createProfile,
  getAllProfiles,
  getProfileById,
  getMyProfile,
  updateProfile,
  setAvailability,
  getAvailability,
  getAvailableSlots,
  updateAvailability,
  deleteAvailability,
  getBookingSessions,
  getTutorStats,
  getWeeklyEarnings,
  sendClassLink,
};
