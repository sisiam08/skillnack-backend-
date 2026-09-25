import { Request, Response } from "express";
import { AdminServices } from "./admin.service";
import {
  UserRole,
  UserStatus,
  VerificationStatus,
} from "../../generated/client";
import PaginationHelper from "../../helpers/Pagination";
import { PaginationOptions } from "../../interfaces";
import { catchAsync } from "../../utils/catchAsync";
import createAppError from "../../errors/appError";
import { Status } from "../../errors/httpStatus";

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

  res.status(Status.OK).json({
    success: true,
    message: "Users retrieved successfully",
    data,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;

  if (!status) {
    throw createAppError(
      "You can update only the status field",
      Status.BAD_REQUEST,
    );
  }

  const data = await AdminServices.updateUser(id, status);

  res.status(Status.OK).json({
    success: true,
    message: "User updated successfully",
    data,
  });
});

const getStats = catchAsync(async (req: Request, res: Response) => {
  const data = await AdminServices.getStats();

  res.status(Status.OK).json({
    success: true,
    message: "Stats retrieved successfully",
    data,
  });
});

const getAllTutors = catchAsync(async (req: Request, res: Response) => {
  const verificationStatus = req.query.verificationStatus
    ? (String(req.query.verificationStatus) as VerificationStatus)
    : undefined;

  const search = req.query.search ? String(req.query.search) : undefined;

  const { page, limit, skip }: PaginationOptions = PaginationHelper(req.query);

  const data = await AdminServices.getAllTutors(
    verificationStatus,
    search,
    page,
    limit,
    skip,
  );

  res.status(Status.OK).json({
    success: true,
    message: "Tutors retrieved successfully",
    data,
  });
});

const updateTutorVerification = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status, rejectionReason } = req.body;

    const data = await AdminServices.updateTutorVerification(
      id,
      status as VerificationStatus,
      rejectionReason,
    );

    res.status(Status.OK).json({
      success: true,
      message: "Tutor verification updated successfully",
      data,
    });
  },
);

export const AdminControllers = {
  getAllUsers,
  updateUser,
  getStats,
  getAllTutors,
  updateTutorVerification,
};
