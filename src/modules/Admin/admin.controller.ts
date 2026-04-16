import { Request, Response } from "express";
import { AdminServices } from "./admin.service";
import { UserRole, UserStatus } from "../../../generated/prisma/client";
import PaginationHelper from "../../helpers/Pagination";
import { PaginationOptions } from "../../interfaces";
import { catchAsync } from "../../utils/catchAsync";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const search = req.query.search ? String(req.query.search) : undefined;

  const role = req.query.role
    ? (String(req.query.role) as UserRole)
    : undefined;

  const status = req.query.status
    ? (String(req.query.status) as UserStatus)
    : undefined;

  const { page, limit, skip }: PaginationOptions = PaginationHelper(req.query);

  const data = await AdminServices.getAllUsers(
    search,
    role,
    status,
    page,
    limit,
    skip,
  );

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "You can update only the status field",
    });
  }

  const data = await AdminServices.updateUser(id, status);

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data,
  });
});

const getStats = catchAsync(async (req: Request, res: Response) => {
  const data = await AdminServices.getStats();

  res.status(200).json({
    success: true,
    message: "Stats retrieved successfully",
    data,
  });
});

export const AdminControllers = {
  getAllUsers,
  updateUser,
  getStats,
};
