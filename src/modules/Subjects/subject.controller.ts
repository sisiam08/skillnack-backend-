import { Request, Response } from "express";
import { SubjectServices } from "./subject.service";
import { catchAsync } from "../../utils/catchAsync";
import { Status } from "../../errors/httpStatus";

const createSubject = catchAsync(async (req: Request, res: Response) => {
  const data = await SubjectServices.createSubject(req.body);
  res.status(Status.CREATED).json({
    success: true,
    message: "Subject created successfully",
    data,
  });
});

const getAllSubjects = catchAsync(async (req: Request, res: Response) => {
  const data = await SubjectServices.getAllSubjects();
  res.status(Status.OK).json({
    success: true,
    message: "Subjects retrieved successfully",
    data,
  });
});

const updateSubject = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await SubjectServices.updateSubject(id, req.body);
  res.status(Status.OK).json({
    success: true,
    message: "Subject updated successfully",
    data,
  });
});

const deleteSubject = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await SubjectServices.deleteSubject(id);
  res.status(Status.OK).json({
    success: true,
    message: "Subject deleted successfully",
    data,
  });
});

export const SubjectControllers = {
  createSubject,
  getAllSubjects,
  updateSubject,
  deleteSubject,
};
