import { Request, Response } from "express";
import { CategoryServices } from "./category.service";
import { catchAsync } from "../../utils/catchAsync";
import { Status } from "../../errors/httpStatus";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const data = await CategoryServices.createCategory(req.body);
  res.status(Status.CREATED).json({
    success: true,
    message: "Category created successfully",
    data,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const data = await CategoryServices.getAllCategories();
  res.status(Status.OK).json({
    success: true,
    message: "Categories retrieved successfully",
    data,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await CategoryServices.updateCategory(id, req.body);
  res.status(Status.OK).json({
    success: true,
    message: "Category updated successfully",
    data,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await CategoryServices.deleteCategory(id);
  res.status(Status.OK).json({
    success: true,
    message: "Category deleted successfully",
    data,
  });
});

export const CategoryControllers = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
