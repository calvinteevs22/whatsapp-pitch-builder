import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { ENV } from "./_core/env";
import { getUserById, updateUserBilling } from "./db";

function getStripe(): Stripe {
  if (!ENV.stripeSecretKey) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe is not configured" });
  }
  return new Stripe(ENV.stripeSecretKey);
}

export const billingRouter = router({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return {
      plan: user.plan,
      genCount: user.genCount,
      genResetAt: user.genResetAt,
      subscriptionStatus: user.subscriptionStatus,
      emailVerified: user.emailVerified,
    };
  }),

  createCheckoutSession: protectedProcedure
    .input(z.object({ priceId: z.enum(["pro", "agency"]) }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      // Create or reuse Stripe customer
      let customerId = user.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          metadata: { userId: String(ctx.user.id) },
        });
        customerId = customer.id;
        await updateUserBilling(ctx.user.id, { stripeCustomerId: customerId });
      }

      const priceId = input.priceId === "pro" ? ENV.stripePriceIdPro : ENV.stripePriceIdAgency;
      if (!priceId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Price not configured" });

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${ENV.appUrl}/account?checkout=success`,
        cancel_url: `${ENV.appUrl}/pricing`,
        allow_promotion_codes: true,
      });

      return { url: session.url };
    }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const user = await getUserById(ctx.user.id);
    if (!user?.stripeCustomerId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No billing account found" });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${ENV.appUrl}/account`,
    });
    return { url: session.url };
  }),
});
