import { Request, Response } from "express";
import { BookingServices } from "./booking.service";
import { catchAsync } from "../../utils/catchAsync";
import { BookingStatus } from "../../../generated/prisma/enums";
import { PaginationOptions } from "../../interfaces";
import PaginationHelper from "../../helpers/Pagination";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
  const studentId = req.user.id;
  const { currentTime, todayDate, ...bookingData } = req.body;

  const data = await BookingServices.createBooking(
    studentId as string,
    bookingData,
    currentTime as string | undefined,
    todayDate as string | undefined,
  );

  return res.status(201).json({
    success: true,
    message: "Booking completed successfully",
    data,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const status = req.query.status
    ? (req.query.status as BookingStatus)
    : undefined;

  const { page, limit, skip }: PaginationOptions = PaginationHelper(req.query);

  const data = await BookingServices.getAllBookings(status, page, limit, skip);

  return res.status(200).json({
    success: true,
    message: "Bookings retrieved successfully",
    data,
  });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const studentId = req?.user?.id;
  const status = req.query.status
    ? (req.query.status as BookingStatus)
    : undefined;

  const { page, limit, skip }: PaginationOptions = PaginationHelper(req.query);

  const data = await BookingServices.getMyBookings(
    studentId!,
    status,
    page,
    limit,
    skip,
  );

  return res.status(200).json({
    success: true,
    message: "Bookings retrieved successfully",
    data,
  });
});

export const BookingControllers = {
  createBooking,
  getAllBookings,
  getMyBookings,
};
