import { BookingStatus, UserRole } from "../../../generated/prisma/enums";
import { calculateTutionPrice } from "../../helpers/CalculateTutionPrice";
import {
  fitsInAvailabilitySlot,
  isOverlapping,
  timeDuration,
  validateBookingDateTime,
} from "../../helpers/TimeHelpers";
import { prisma } from "../../lib/prisma";

const createBooking = async (
  studentId: string,
  bookingData: {
    tutorId: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
  },
  currentTime?: string,
  todayDate?: string,
) => {
  return await prisma.$transaction(async (tx) => {
    const { tutorId, sessionDate, startTime, endTime } = bookingData;

    const date = new Date(sessionDate);
    const dayOfWeek = date.getDay();
    const slotDuration = timeDuration(startTime, endTime);

    validateBookingDateTime(date, startTime, currentTime, todayDate);

    const availabilitySlots = await tx.tutorAvailability.findMany({
      where: {
        tutorId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!availabilitySlots.length) {
      throw new Error("Tutor not available on this day");
    }

    if (!fitsInAvailabilitySlot({ startTime, endTime }, availabilitySlots)) {
      throw new Error("Selected time outside of tutor availability");
    }

    const existingTutorBookings = await tx.bookings.findMany({
      where: {
        tutorId,
        sessionDate: date,
        status: BookingStatus.CONFIRMED,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    if (isOverlapping({ startTime, endTime }, existingTutorBookings)) {
      throw new Error("Slot already booked");
    }

    const existingMyBookings = await tx.bookings.findMany({
      where: {
        studentId,
        sessionDate: date,
        status: BookingStatus.CONFIRMED,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    if (isOverlapping({ startTime, endTime }, existingMyBookings)) {
      throw new Error("Already you book this slot with another tutor.");
    }

    const tutor = await tx.tutorProfiles.findUnique({
      where: { id: tutorId },
      select: { hourlyRate: true },
    });

    if (!tutor) {
      throw new Error("Tutor not found");
    }

    const price = calculateTutionPrice(slotDuration, tutor.hourlyRate);

    return await tx.bookings.create({
      data: {
        studentId,
        tutorId,
        sessionDate: date,
        startTime,
        endTime,
        price,
      },
    });
  });
};

export const BookingServices = {
  createBooking,
};
