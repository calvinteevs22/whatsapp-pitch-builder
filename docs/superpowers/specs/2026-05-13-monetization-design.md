# Monetization Design — WhatsApp Pitch Builder

**Date:** 2026-05-13
**Status:** Approved

---

## Overview

Add a tiered SaaS monetization system to WhatsApp Pitch Builder. The primary upgrade trigger is AI generation consumption. Payment is handled by Stripe Checkout + Customer Portal. No team/workspace system for MVP — pure per-user consumption.

---

## Section 1: Tier Structure

| Tier | Price | AI Generations/mo | Saved Threads | Features |
|------|-------|-------------------|---------------|----------|
| Free | $0 | 3 | 10 | Template browsing, manual editing, share links |
| Pro | $29/mo | 30 | Unlimited | + Website crawl, multi-language, CTWA ads, exports |
| Agency | $79/mo | Unlimited | Unlimited | + API access |

**Upgrade trigger:** When a user exhausts their generation quota, they hit the paywall. Gated features (website crawl, exports, etc.) are visually present but locked — clicking them opens an upgrade modal.

**No seats/teams for MVP.** Each user has their own plan. Workspace/seat-based billing deferred to v2 when demand is established.

---

## Section 2: DB Schema Changes

New columns on the `users` table (no new tables needed for MVP):

```sql
plan                  ENUM('free','pro','agency')                          DEFAULT 'free'
gen_count             INT                                                   DEFAULT 0
gen_reset_at          DATETIME                                              -- next monthly reset
stripe_customer_id    VARCHAR(255)                                          NULL
stripe_subscription_id VARCHAR(255)                                         NULL
subscription_status   ENUM('active','canceled','past_due','trialing')       NULL
```

**Reset logic:**
- `gen_reset_at` is set to the 1st of next month on account creation
- On each AI generation request, if `NOW() > gen_reset_at`, reset `gen_count = 0` and advance `gen_reset_at`
- No separate cron job needed — lazy reset on request is sufficient for MVP

---

## Section 3: Backend

### 3a. Usage tracking

Shared `checkAndIncrementUsage(userId)` function called before every LLM call:
1. Lazy-reset counter if `gen_reset_at` has passed
2. Look up plan limits via `getPlanLimits(plan)` — centralized in one place
3. Throw `TRPCError({ code: 'FORBIDDEN', message: 'generation_limit_reached' })` if at limit
4. Increment `gen_count` on success

Plan limits: `{ free: 3, pro: 30, agency: Infinity }`

### 3b. Feature gates

`requiresPlan(userId, 'pro' | 'agency')` guard added to gated tRPC procedures:
- Website crawl → Pro+
- Multi-language → Pro+
- CTWA ads → Pro+
- Exports → Pro+
- API access → Agency

### 3c. Stripe integration

Two new tRPC procedures:
- `billing.createCheckoutSession(priceId)` — creates Stripe Checkout session, returns URL for client redirect
- `billing.createPortalSession()` — creates Stripe Customer Portal session, returns URL

`stripe_customer_id` is created lazily on first checkout attempt.

### 3d. Webhook handler

New Express route `POST /api/stripe/webhook` (raw body, not tRPC):

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Write `plan`, `stripe_subscription_id`, `subscription_status = 'active'` |
| `customer.subscription.updated` | Update `plan` + `subscription_status` |
| `customer.subscription.deleted` | Set `plan = 'free'`, clear subscription fields |
| `invoice.payment_failed` | Set `subscription_status = 'past_due'` |

Webhook signature verified with `stripe.webhooks.constructEvent(rawBody, sig, secret)`.

---

## Section 4: Frontend

### 4a. Pricing page (`/pricing`)

Public page with 3 tier cards side-by-side. Pro card marked "Most Popular." Each card shows: price, generation limit, feature checklist, CTA button.

- Free CTA → `/register`
- Paid CTA → `billing.createCheckoutSession` → redirect to Stripe hosted page
- Logged-in users see current plan highlighted with "Current Plan" badge

### 4b. Upgrade modal

Single reusable `<UpgradeModal>` component. Triggered when a user hits any gate (generation limit or feature lock).

Contains:
- Context-aware headline ("Website crawl is a Pro feature")
- 3–4 benefit bullets for the target plan
- Price + "Upgrade to Pro" CTA
- Dismissible

### 4c. Usage indicator

Pill in the dashboard nav: `"12 / 30 generations"`.
- Turns amber at 2/3 of limit
- Turns red at limit
- Clicking opens the upgrade modal
- Hidden for Agency tier (unlimited)

### 4d. Feature lock UI

Gated features in Builder/Dashboard are visually dimmed with a lock icon — not hidden. Clicking triggers `<UpgradeModal>`. Users must see what they're missing to want to upgrade.

---

## Section 5: Product Gaps & Scope

### Must fix before charging anyone

1. **Email verification** — Users can register with unverified emails. Required for receipts and password reset. Add verify-on-signup email flow.
2. **Password reset** — No "forgot password" exists. Users will lose access. Add email link flow.
3. **Account page (`/account`)** — Minimal page showing current plan, next billing date, and a Stripe Customer Portal link.
4. **Past-due banner** — If `subscription_status = 'past_due'`, show a persistent banner prompting card update. Without this, users silently lose access.

### Nice-to-have (post-launch)

- Onboarding checklist for new free users (drives activation before hitting paywall)
- Annual pricing toggle (20% discount, improves LTV)
- Referral/affiliate system

### Explicitly out of scope for MVP

- Team/workspace/seats — significant complexity, defer until demand is established
- Usage analytics dashboard — running counter in DB is sufficient
- Custom invoicing / tax handling — enable Stripe Tax later
- Free trial period — the Free tier IS the trial; a separate trial state adds unnecessary complexity

---

## Implementation Notes

- Stripe SDK: `stripe` npm package (server-side only)
- Stripe price IDs stored in env vars: `STRIPE_PRO_PRICE_ID`, `STRIPE_AGENCY_PRICE_ID`
- Webhook secret: `STRIPE_WEBHOOK_SECRET`
- New env vars to document in `.env.example`
- Drizzle migration needed for the 6 new `users` columns
