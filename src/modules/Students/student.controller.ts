import { Request, Response } from "express";
import { StudentServices } from "./student.service";
import { catchAsync } from "../../utils/catchAsync";
import { Status } from "../../errors/httpStatus";

const getStudentStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const data = await StudentServices.getStudentStats(userId!);

  return res.status(Status.OK).json({
    success: true,
    message: "Stats retrieved successfully",
    data: data,
  });
});

const getRecentActivity = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const data = await StudentServices.getRecentActivity(userId!);

  return res.status(Status.OK).json({
    success: true,
    message: "Recent activity retrieved successfully",
    data: data,
  });
});

export const StudentControllers = {
  getStudentStats,
  getRecentActivity,
};
