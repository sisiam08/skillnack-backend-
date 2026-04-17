import { addHours, format, startOfDay } from "date-fns";
import { BookingStatus } from "../../generated/prisma/enums";

export const refreshBookingData = async (tx: any) => {
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
