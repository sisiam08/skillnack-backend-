import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { BookingStatus, PaymentStatus } from "../../generated/enums";

const handlerStripeWebshookEvent = async (event: Stripe.Event) => {
  const existingPayment = await prisma.payment.findFirst({
    where: {
      stripeEventId: event.id,
    },
  });

  if (existingPayment) {
    console.log(`Event ${event.id} already processed. Skipping.`);
    return { message: `Event ${event.id} already processed. Skipping.` };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const bookingId = session.metadata?.bookingId;
      const paymentId = session.metadata?.paymentId;

      if (!bookingId || !paymentId) {
        console.error("Missing bookingId or paymentId in session metadata.");
        return { error: "Missing bookingId or paymentId in session metadata." };
      }

      const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        console.error(`Booking with ID ${bookingId} not found.`);
        return { error: `Booking with ID ${bookingId} not found.` };
      }

      await prisma.$transaction(async (tx) => {
        await tx.bookings.update({
          where: { id: bookingId },
          data: {
            status:
              session.payment_status === "paid"
                ? BookingStatus.CONFIRMED
                : BookingStatus.PENDING,
            paymentStatus:
              session.payment_status === "paid"
                ? PaymentStatus.PAID
                : PaymentStatus.PENDING,
          },
        });

        await tx.payment.update({
          where: { id: paymentId },
          data: {
            stripeEventId: event.id,
            status:
              session.payment_status === "paid"
                ? PaymentStatus.PAID
                : PaymentStatus.PENDING,
            paymentGatewayData: session as any,
          },
        });
      });

      console.log(
        `Processed checkout.session.completed for booking ${bookingId} and payment ${paymentId}.`,
      );
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;

      const bookingId = session.metadata?.bookingId;

      if (!bookingId) {
        console.error("Missing bookingId in session metadata.");
        return { error: "Missing bookingId in session metadata." };
      }

      await prisma.bookings.delete({
        where: { id: bookingId },
      });

      console.log(`Checkout session ${session.id} expired. Booking deleted.`);
      break;
    }
    case "payment_intent.payment_failed": {
      const session = event.data.object as Stripe.PaymentIntent;

      const bookingId = session.metadata?.bookingId;
      const paymentId = session.metadata?.paymentId;

      if (!bookingId) {
        console.error("Missing bookingId in payment intent metadata.");
        return { error: "Missing bookingId in payment intent metadata." };
      }

      await prisma.bookings.update({
        where: { id: bookingId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      });
      await prisma.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      console.log(
        `Payment intent ${session.id} failed. Marking payment as failed.`,
      );

      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return { message: `Event ${event.id} processed successfully.` };
};

export const PaymentService = {
  handlerStripeWebshookEvent,
};
