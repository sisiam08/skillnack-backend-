import Stripe from "stripe";
import { catchAsync } from "../../utils/catchAsync";
import { PaymentService } from "./payment.service";
import config from "../../config";
import { Request, Response } from "express";
import { Status } from "../../errors/httpStatus";
import { getStripeClient } from "../../config/stripe.config";

const handlerStripeWebshookEvent = catchAsync(
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    const webhookSecret = config.stripe.stripeWebhookSecret;

    if (!signature || !webhookSecret) {
      console.error("Missing Stripe signature or webhook secret.");
      return res
        .status(Status.BAD_REQUEST)
        .json({ error: "Missing Stripe signature or webhook secret." });
    }

    let event;

    try {
      const stripe = getStripeClient();
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
    } catch (error) {
      console.error("Error constructing Stripe webhook event:", error);
      return res
        .status(Status.BAD_REQUEST)
        .json({ error: "Invalid Stripe signature or webhook secret." });
    }

    try {
      const result = await PaymentService.handlerStripeWebshookEvent(event);
      return res.status(Status.OK).json(result);
    } catch (error) {
      console.error("Error handling Stripe webhook event:", error);
      return res
        .status(Status.INTERNAL_SERVER_ERROR)
        .json({ error: "Error handling Stripe webhook event." });
    }
  },
);

export const PaymentController = {
  handlerStripeWebshookEvent,
};
