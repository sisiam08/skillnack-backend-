import { Request, Response } from "express";
import { TutorProfileServices } from "./tutorProfile.service";
import { catchAsync } from "../../utils/catchAsync";

const createProfile = catchAsync(async (req: Request, res: Response) => {
  const data = await TutorProfileServices.createProfile(req.body);

  res.status(201).json({
    success: true,
    message: "Profile created successfully",
    data,
  });
});

export const TutorProfileControllers = {
  createProfile,
};
