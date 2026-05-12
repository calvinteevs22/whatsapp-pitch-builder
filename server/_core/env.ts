export const ENV = {
  appId: process.env.VITE_APP_ID ?? "wa-thread-builder",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceIdPro: process.env.STRIPE_PRICE_ID_PRO ?? "",
  stripePriceIdAgency: process.env.STRIPE_PRICE_ID_AGENCY ?? "",
  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "noreply@example.com",
  // App URL (used in email links)
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
};
