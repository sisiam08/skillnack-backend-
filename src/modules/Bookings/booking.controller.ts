import { Request, Response } from "express";
import { BookingServices } from "./booking.service";
import { catchAsync } from "../../utils/catchAsync";
import { BookingStatus, UserRole } from "../../../generated/prisma/enums";
import { PaginationOptions } from "../../interfaces";
import PaginationHelper from "../../helpers/Pagination";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!.id; // req.user is guaranteed by auth middleware
  const { currentTime, todayDate, ...bookingData } = req.body;

  const data = await BookingServices.createBooking(
    studentId,
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

const getBookingDetails = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.id;
  const data = await BookingServices.getBookingDetails(bookingId as string);

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Booking details retrieved successfully",
    data,
  });
});

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const userRole = req.user?.role as UserRole;
  const bookingId = req.params.id;
  const { status } = req.body;
  const data = await BookingServices.updateBookingStatus(
    userId,
    userRole,
    bookingId as string,
    status,
  );
  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
    });
  }
  return res.status(200).json({
    success: true,
    message: "Booking status updated successfully",
    data,
  });
});

export const BookingControllers = {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingDetails,
  updateBookingStatus,
};
