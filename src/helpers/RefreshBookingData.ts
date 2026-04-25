import { addHours, format, startOfDay } from "date-fns";
import { BookingStatus } from "../generated/enums";
import { Prisma } from "../generated/browser";

export const refreshBookingData = async (tx: Prisma.TransactionClient) => {
  const today = startOfDay(new Date());
  const currentTime = format(addHours(new Date(), 6), "HH:mm");

  await tx.bookings.updateMany({
    where: {
      OR: [
        {
          sessionDate: {
            lt: today,
          },
        },
        {
          sessionDate: {
            equals: today,
          },
          endTime: {
            lt: currentTime,
          },
        },
      ],
      status: BookingStatus.CONFIRMED,
    },
    data: {
      status: BookingStatus.CANCELLED,
    },
  });

  await tx.bookings.deleteMany({
    where: {
      OR: [
        {
          sessionDate: {
            lt: today,
          },
        },
        {
          sessionDate: {
            equals: today,
          },
          endTime: {
            lt: currentTime,
          },
        },
      ],
      status: BookingStatus.PENDING,
    },
  });
};
