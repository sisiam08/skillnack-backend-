import Stripe from "stripe";
import config from ".";

export const stripe = new Stripe(config.stripe.stripeSecretKey!);
