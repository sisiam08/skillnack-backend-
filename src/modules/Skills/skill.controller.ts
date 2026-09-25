import { Request, Response } from "express";
import { SkillServices } from "./skill.service";
import { catchAsync } from "../../utils/catchAsync";
import { Status } from "../../errors/httpStatus";

const createSkill = catchAsync(async (req: Request, res: Response) => {
  const data = await SkillServices.createSkill(req.body);
  res.status(Status.CREATED).json({
    success: true,
    message: "Skill created successfully",
    data,
  });
});

const getAllSkills = catchAsync(async (req: Request, res: Response) => {
  const data = await SkillServices.getAllSkills();
  res.status(Status.OK).json({
    success: true,
    message: "Skills retrieved successfully",
    data,
  });
});

const updateSkill = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await SkillServices.updateSkill(id, req.body);
  res.status(Status.OK).json({
    success: true,
    message: "Skill updated successfully",
    data,
  });
});

const deleteSkill = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await SkillServices.deleteSkill(id);
  res.status(Status.OK).json({
    success: true,
    message: "Skill deleted successfully",
    data,
  });
});

export const SkillControllers = {
  createSkill,
  getAllSkills,
  updateSkill,
  deleteSkill,
};
