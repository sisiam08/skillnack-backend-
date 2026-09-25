import { Request, Response } from "express";
import { BookingServices } from "./booking.service";
import { catchAsync } from "../../utils/catchAsync";
import { BookingStatus, UserRole } from "../../generated/enums";
import { PaginationOptions } from "../../interfaces";
import PaginationHelper from "../../helpers/Pagination";
import { Status } from "../../errors/httpStatus";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!.id;
  const bookingData = req.body;
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const attachments = files
    .map((file) => (file as any).path || (file as any).url)
    .filter(Boolean) as string[];

  const data = await BookingServices.createBooking(studentId, {
    ...bookingData,
    attachments,
  });

  return res.status(Status.CREATED).json({
    success: true,
    message: "Booking pending...",
    data,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const status = req.query.status
    ? (req.query.status as BookingStatus)
    : undefined;

  const { page, limit, skip }: PaginationOptions = PaginationHelper(req.query);

  const data = await BookingServices.getAllBookings(status, page, limit, skip);

  return res.status(Status.OK).json({
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

  return res.status(Status.OK).json({
    success: true,
    message: "Bookings retrieved successfully",
    data,
  });
});

const getBookingDetails = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.id;
  const data = await BookingServices.getBookingDetails(bookingId as string);

  if (!data) {
    return res.status(Status.NOT_FOUND).json({
      success: false,
      message: "Booking not found",
    });
  }

  return res.status(Status.OK).json({
    success: true,
    message: "Booking details retrieved successfully",
    data,
  });
});

const recordOutcome = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!.id;
  const bookingId = req.params.id as string;
  const { outcome } = req.body;

  const data = await BookingServices.recordOutcome(
    studentId,
    bookingId,
    outcome,
  );

  return res.status(Status.OK).json({
    success: true,
    message: "Outcome recorded successfully",
    data,
  });
});

const updateBookingSummary = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const bookingId = req.params.id as string;
  const { summary } = req.body;

  const data = await BookingServices.updateBookingSummary(
    userId,
    bookingId,
    summary,
  );

  return res.status(Status.OK).json({
    success: true,
    message: "Session summary saved successfully",
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
    return res.status(Status.NOT_FOUND).json({
      success: false,
      message: "Booking not found",
    });
  }
  return res.status(Status.OK).json({
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
  recordOutcome,
  updateBookingSummary,
  updateBookingStatus,
};
