import { Request, Response } from "express";
import { StudentServices } from "./student.service";
import { catchAsync } from "../../utils/catchAsync";

const getStudentStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const data = await StudentServices.getStudentStats(userId!);

  return res.status(200).json({
    success: true,
    message: "Stats retrieved successfully",
    data: data,
  });
});

export const StudentControllers = {
  getStudentStats,
};
