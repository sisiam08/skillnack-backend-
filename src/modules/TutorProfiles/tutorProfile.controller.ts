import { Request, Response } from "express";
import { TutorProfileServices } from "./tutorProfile.service";
import { catchAsync } from "../../utils/catchAsync";
import { PaginationOptions, SortingOptions } from "../../interfaces";
import PaginationHelper from "../../helpers/Pagination";
import SortingHelper from "../../helpers/Sorting";

const createProfile = catchAsync(async (req: Request, res: Response) => {
  const data = await TutorProfileServices.createProfile(req.body);

  res.status(201).json({
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
  );

  res.status(200).json({
    success: true,
    message: "Profiles retrieved successfully",
    data,
  });
});

const getProfileById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await TutorProfileServices.getProfileById(id);
  res.status(200).json({
    success: true,
    message: "Profile details retrieved successfully",
    data,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const data = await TutorProfileServices.getMyProfile(userId);
  res.status(200).json({
    success: true,
    message: "Profile details retrieved successfully",
    data,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const data = await TutorProfileServices.updateProfile(userId, req.body);
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data,
  });
});

const setAvailability = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const availability = req.body;

  const data = await TutorProfileServices.setAvailability(userId, availability);

  res.status(201).json({
    success: true,
    message: "Availability set successfully",
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
};
