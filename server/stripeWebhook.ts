import type { Express, Request, Response } from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getUserByStripeCustomerId, getUserByStripeSubscriptionId, updateUserBilling } from "./db";

function getPlanFromSubscription(subscription: Stripe.Subscription): "free" | "pro" | "agency" {
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId === ENV.stripePriceIdPro) return "pro";
  if (priceId === ENV.stripePriceIdAgency) return "agency";
  return "free";
}

export function registerStripeWebhook(app: Express): void {
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    if (!ENV.stripeSecretKey) {
      res.status(200).json({ received: true });
      return;
    }

    const stripe = new Stripe(ENV.stripeSecretKey);
    const sig = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, ENV.stripeWebhookSecret);
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode !== "subscription" || !session.subscription) break;
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const user = await getUserByStripeCustomerId(session.customer as string);
          if (!user) break;
          await updateUserBilling(user.id, {
            plan: getPlanFromSubscription(sub),
            stripeSubscriptionId: sub.id,
            subscriptionStatus: sub.status as "active" | "canceled" | "past_due" | "trialing",
          });
          console.log(`[Stripe] User ${user.id} upgraded to ${getPlanFromSubscription(sub)}`);
          break;
        }
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const user = await getUserByStripeSubscriptionId(sub.id);
          if (!user) break;
          await updateUserBilling(user.id, {
            plan: getPlanFromSubscription(sub),
            subscriptionStatus: sub.status as "active" | "canceled" | "past_due" | "trialing",
          });
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const user = await getUserByStripeSubscriptionId(sub.id);
          if (!user) break;
          await updateUserBilling(user.id, {
            plan: "free",
            stripeSubscriptionId: null,
            subscriptionStatus: null,
          });
          console.log(`[Stripe] User ${user.id} downgraded to free`);
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          if (!(invoice as any).subscription) break;
          const user = await getUserByStripeSubscriptionId((invoice as any).subscription as string);
          if (!user) break;
          await updateUserBilling(user.id, { subscriptionStatus: "past_due" });
          break;
        }
      }
    } catch (err) {
      console.error("[Stripe Webhook] Handler error:", err);
    }

    res.json({ received: true });
  });
}
