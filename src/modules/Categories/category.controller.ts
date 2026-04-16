import { Request, Response } from "express";
import { CategoryServices } from "./category.service";
import { catchAsync } from "../../utils/catchAsync";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const data = await CategoryServices.createCategory(req.body);
  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const data = await CategoryServices.getAllCategories();
  res.status(200).json({
    success: true,
    message: "Categories retrieved successfully",
    data,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await CategoryServices.updateCategory(id, req.body);
  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await CategoryServices.deleteCategory(id);
  res.status(200).json({
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
