import Stripe from "stripe";
import config from ".";

let stripeClient: Stripe | null = null;

export const getStripeClient = () => {
	const stripeSecretKey = config.stripe.stripeSecretKey;

	if (!stripeSecretKey) {
		throw new Error(
			"STRIPE_SECRET_KEY is missing. Configure it in environment variables before using payment features.",
		);
	}

	if (!stripeClient) {
		stripeClient = new Stripe(stripeSecretKey);
	}

	return stripeClient;
};
