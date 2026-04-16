import { Request, Response } from "express";
import { BookingServices } from "./booking.service";
import { catchAsync } from "../../utils/catchAsync";

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

export const BookingControllers = {
  createBooking,
};
