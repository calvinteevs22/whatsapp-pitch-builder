/**
 * Industry-specific quick prompt suggestions for AI generation.
 * Each industry × message type combination has 4 tailored prompts
 * based on best-in-class WhatsApp paid messaging patterns.
 */

type PromptMap = Record<string, Record<string, string[]>>;

export const INDUSTRY_PROMPTS: PromptMap = {
  // ═══════════════════════════════════════════════════════════════
  // E-COMMERCE
  // ═══════════════════════════════════════════════════════════════
  "E-Commerce": {
    marketing: [
      "Create a flash sale campaign with product carousel, countdown timer, and 'Shop Now' CTA that drives urgency",
      "Build an abandoned cart recovery flow that shows the exact items left behind with a limited-time discount offer",
      "Design a new collection launch with hero image, product highlights, and early-access VIP pricing",
      "Create a personalized product recommendation flow based on past purchases with cross-sell offers",
    ],
    utility: [
      "Build an order confirmation flow with itemized receipt, estimated delivery date, and real-time tracking link",
      "Create a shipping update notification with live tracking, delivery slot selection, and driver contact",
      "Design a return/exchange processing flow with label generation and refund status tracking",
      "Build a product feedback collection flow with emoji quick replies and review submission link",
    ],
    authentication: [
      "Create a secure checkout verification flow with OTP confirmation for high-value orders",
      "Build an account login verification with one-time code and device recognition",
      "Design a payment method verification flow for new card additions with 3D secure",
      "Create an address change confirmation flow with security verification step",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // HEALTHCARE
  // ═══════════════════════════════════════════════════════════════
  Healthcare: {
    marketing: [
      "Create a health checkup package promotion with seasonal pricing, test inclusions, and 'Book Now' button",
      "Build a vaccination drive campaign with eligibility checker, slot booking, and clinic locations",
      "Design a wellness program launch with benefits overview, doctor profiles, and free consultation offer",
      "Create a telemedicine service promotion with specialist availability and instant booking flow",
    ],
    utility: [
      "Build an appointment reminder flow sent 24h before with reschedule/cancel buttons and clinic directions",
      "Create a lab report delivery notification with 'View Report' button and doctor follow-up booking",
      "Design a prescription refill reminder with medication list, dosage info, and 'Reorder' CTA",
      "Build a post-visit follow-up flow with care instructions, satisfaction survey, and next appointment scheduling",
    ],
    authentication: [
      "Create a patient portal login verification with OTP for accessing medical records securely",
      "Build a prescription authorization flow with doctor verification code",
      "Design a health insurance claim verification with document upload and identity confirmation",
      "Create a telemedicine session verification flow with patient identity confirmation",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // FOOD & BEVERAGE
  // ═══════════════════════════════════════════════════════════════
  "Food & Beverage": {
    marketing: [
      "Create a daily specials campaign with chef's recommendation image, price, and 'Order Now' button",
      "Build a weekend brunch promotion with menu carousel, combo deals, and table reservation option",
      "Design a new menu item launch with food photography, tasting notes, and limited-time introductory price",
      "Create a loyalty program campaign showing stamp card progress with reward redemption and bonus offer",
    ],
    utility: [
      "Build an order confirmation flow with itemized receipt, preparation time, and live delivery tracking",
      "Create a table reservation confirmation with date, time, party size, and 'Modify Booking' option",
      "Design a delivery status update flow with driver location, ETA, and contactless delivery instructions",
      "Build a post-meal feedback collection with dish rating, quick replies, and 'Reorder Favorites' button",
    ],
    authentication: [
      "Create an order payment verification flow with OTP for cash-on-delivery confirmation",
      "Build a loyalty account login verification for points redemption",
      "Design a catering order confirmation with authorized signatory verification",
      "Create a gift card activation flow with secure code verification",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // FINANCE & BANKING
  // ═══════════════════════════════════════════════════════════════
  "Finance & Banking": {
    marketing: [
      "Create a pre-approved personal loan offer with personalized amount, EMI calculator, and instant apply button",
      "Build a credit card upgrade campaign comparing current vs premium benefits with reward points highlight",
      "Design a fixed deposit promotion with competitive rates, tenure options, and 'Invest Now' CTA",
      "Create a wealth management advisory flow with portfolio insights and personalized investment recommendations",
    ],
    utility: [
      "Build a transaction alert flow with amount, merchant, balance update, and 'Report Fraud' quick action",
      "Create a credit card bill reminder with due date, minimum payment, and 'Pay Now' button",
      "Design a loan EMI payment confirmation with remaining tenure, outstanding balance, and statement download",
      "Build a KYC document collection flow with required documents list, camera upload, and verification status",
    ],
    authentication: [
      "Create a fund transfer verification flow with OTP, beneficiary details, and amount confirmation",
      "Build a new device login authorization with location details and approve/deny buttons",
      "Design a card activation flow with secure PIN setup and transaction limit configuration",
      "Create a high-value transaction verification with multi-factor authentication steps",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // TRAVEL & HOSPITALITY
  // ═══════════════════════════════════════════════════════════════
  "Travel & Hospitality": {
    marketing: [
      "Create a destination deal campaign with stunning location images, package pricing, and 'Book Now' CTA",
      "Build a hotel upgrade offer with room comparison carousel, amenity highlights, and limited-time pricing",
      "Design a local experience recommendation flow with curated activities, ratings, and instant booking",
      "Create a loyalty tier upgrade celebration with new benefits overview and exclusive member-only deals",
    ],
    utility: [
      "Build a booking confirmation flow with full itinerary, hotel details, and 'Add to Calendar' button",
      "Create a flight status update notification with gate changes, delays, and rebooking options",
      "Design a check-in reminder with boarding pass, baggage info, and airport navigation guide",
      "Build a post-stay review request with rating quick replies, photo upload, and loyalty points reward",
    ],
    authentication: [
      "Create a booking modification verification with OTP for date changes and cancellation requests",
      "Build a loyalty account login verification for points redemption and tier benefits access",
      "Design a passport/ID verification flow for online check-in with secure document upload",
      "Create a payment verification for high-value bookings with cardholder confirmation",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EDUCATION
  // ═══════════════════════════════════════════════════════════════
  Education: {
    marketing: [
      "Create a course enrollment campaign with curriculum highlights, faculty profiles, and early-bird discount",
      "Build an open day invitation with campus tour schedule, program showcase, and RSVP button",
      "Design a scholarship opportunity alert with eligibility criteria, benefits, and application deadline countdown",
      "Create a new program launch with career outcomes, alumni testimonials, and free trial class offer",
    ],
    utility: [
      "Build a class schedule reminder with upcoming session details, topic preview, and join link",
      "Create an exam result notification with detailed scorecard, rank, and counselor booking option",
      "Design a fee payment reminder with due date, amount breakdown, and multiple payment method buttons",
      "Build an assignment deadline alert with submission link, guidelines summary, and extension request option",
    ],
    authentication: [
      "Create a student portal login verification with OTP for accessing grades and course materials",
      "Build an exam hall ticket download verification with enrollment number confirmation",
      "Design a parent portal access verification for viewing child's academic progress",
      "Create a certificate download verification with graduate identity confirmation",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // REAL ESTATE
  // ═══════════════════════════════════════════════════════════════
  "Real Estate": {
    marketing: [
      "Create a new property listing alert with unit images, floor plans, pricing, and 'Schedule Visit' button",
      "Build a virtual tour invitation with 3D walkthrough link, neighborhood highlights, and agent contact",
      "Design a price drop notification with before/after comparison, EMI estimate, and urgency messaging",
      "Create an investment opportunity showcase with ROI projections, location advantages, and brochure download",
    ],
    utility: [
      "Build a site visit confirmation with date, time, location map, agent details, and reschedule option",
      "Create a construction progress update with milestone photos, completion percentage, and timeline",
      "Design a document collection flow for property application with checklist and upload buttons",
      "Build a handover scheduling flow with inspection date, document requirements, and key collection details",
    ],
    authentication: [
      "Create a property booking verification with token payment confirmation and agreement preview",
      "Build a document submission verification for loan application with identity confirmation",
      "Design a virtual tour access verification for exclusive pre-launch properties",
      "Create a payment milestone verification for construction-linked installments",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // AUTOMOTIVE
  // ═══════════════════════════════════════════════════════════════
  Automotive: {
    marketing: [
      "Create a new model launch campaign with hero image, key specs carousel, pricing, and 'Book Test Drive' CTA",
      "Build a seasonal service package promotion with maintenance checklist, discounted pricing, and booking flow",
      "Design a trade-in value estimator flow with vehicle details collection and instant valuation offer",
      "Create an accessories showcase with product carousel, compatibility checker, and 'Add to Cart' button",
    ],
    utility: [
      "Build a service reminder flow with maintenance due items, estimated cost, and 'Schedule Service' button",
      "Create a vehicle delivery tracking notification with production milestones and estimated delivery date",
      "Design a test drive confirmation with dealership location, date/time, model details, and reschedule option",
      "Build a post-service feedback flow with service quality rating, invoice download, and next service reminder",
    ],
    authentication: [
      "Create a vehicle purchase agreement verification with buyer identity and financing confirmation",
      "Build a service booking verification with vehicle registration and owner confirmation",
      "Design a roadside assistance identity verification for emergency service dispatch",
      "Create a financing application verification with income document upload and credit check consent",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // RETAIL
  // ═══════════════════════════════════════════════════════════════
  Retail: {
    marketing: [
      "Create a seasonal sale campaign with category carousel, discount tiers, and 'Shop by Category' buttons",
      "Build a VIP member exclusive preview with early access to new arrivals and member-only pricing",
      "Design a store opening announcement with location, grand opening offers, and 'Get Directions' CTA",
      "Create a back-in-stock alert for wishlisted items with updated price and 'Buy Now' quick action",
    ],
    utility: [
      "Build a purchase receipt flow with itemized list, loyalty points earned, and return policy reminder",
      "Create a click-and-collect ready notification with pickup location, QR code, and store hours",
      "Design a warranty registration flow with product details, coverage period, and claim instructions",
      "Build a store appointment confirmation with stylist/advisor details and preparation tips",
    ],
    authentication: [
      "Create a loyalty account verification for high-value points redemption",
      "Build a gift registry access verification with event details confirmation",
      "Design a personal shopper account login with preference profile access",
      "Create a return authorization verification with order details and refund method confirmation",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // TECHNOLOGY
  // ═══════════════════════════════════════════════════════════════
  Technology: {
    marketing: [
      "Create a product launch announcement with feature highlights, demo video link, and 'Try Free' CTA",
      "Build a trial expiration campaign comparing free vs premium features with upgrade incentive",
      "Design a webinar invitation with speaker profiles, agenda preview, and one-click registration",
      "Create a feature update notification with changelog highlights, tutorial link, and feedback collection",
    ],
    utility: [
      "Build an onboarding welcome flow with setup guide, key feature walkthrough, and support contact",
      "Create a subscription renewal reminder with current plan details, pricing, and auto-renew toggle",
      "Design a support ticket update notification with resolution status and satisfaction survey",
      "Build a usage insights summary with key metrics, tips for optimization, and upgrade recommendation",
    ],
    authentication: [
      "Create a two-factor authentication setup flow with authenticator app QR code and backup codes",
      "Build an API key generation verification with developer identity confirmation",
      "Design a team member invitation verification with role assignment and access permissions",
      "Create a billing information update verification with payment method confirmation",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // BEAUTY & WELLNESS
  // ═══════════════════════════════════════════════════════════════
  "Beauty & Wellness": {
    marketing: [
      "Create a new treatment launch with before/after showcase, introductory pricing, and 'Book Now' button",
      "Build a seasonal beauty package promotion with service bundle, savings highlight, and limited slots alert",
      "Design a product recommendation quiz based on skin/hair type with personalized results and shop links",
      "Create a membership renewal campaign with exclusive benefits comparison and loyalty rewards summary",
    ],
    utility: [
      "Build an appointment reminder with stylist/therapist info, service details, and reschedule/cancel buttons",
      "Create a loyalty points update with current balance, expiring points alert, and redemption catalog",
      "Design a post-treatment care guide with product recommendations, follow-up booking, and tips",
      "Build a gift card delivery flow with personalized message, balance, and redemption instructions",
    ],
    authentication: [
      "Create a membership account verification for accessing exclusive booking slots and pricing",
      "Build a gift card redemption verification with card number and PIN confirmation",
      "Design a consultation booking verification with health questionnaire completion",
      "Create a product subscription modification verification with delivery preferences update",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ENTERTAINMENT
  // ═══════════════════════════════════════════════════════════════
  Entertainment: {
    marketing: [
      "Create an event announcement with artist lineup, venue details, ticket tiers, and 'Get Tickets' CTA",
      "Build a presale notification with exclusive early access code, countdown timer, and VIP upgrade option",
      "Design a subscription offer with content preview carousel, plan comparison, and free trial activation",
      "Create a personalized event recommendation based on past attendance with group booking discount",
    ],
    utility: [
      "Build a ticket confirmation flow with QR code, seat details, venue map, and 'Add to Calendar' button",
      "Create an event reminder with doors-open time, parking info, and prohibited items checklist",
      "Design a show schedule update notification with new timings and rebooking option for affected tickets",
      "Build a post-event feedback collection with performance rating, photo sharing, and upcoming event preview",
    ],
    authentication: [
      "Create a ticket transfer verification with recipient identity confirmation and seat reassignment",
      "Build a membership account login for accessing exclusive content and presale codes",
      "Design an age verification flow for restricted content or event access",
      "Create a refund request verification with booking details and payment method confirmation",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // LOGISTICS
  // ═══════════════════════════════════════════════════════════════
  Logistics: {
    marketing: [
      "Create a bulk shipping rate promotion with volume discount tiers, route coverage, and 'Get Quote' CTA",
      "Build a new service route announcement with transit times, pricing comparison, and booking incentive",
      "Design a business account signup campaign with dedicated support, API access, and volume benefits",
      "Create a seasonal shipping deadline campaign with cutoff dates by destination and express upgrade option",
    ],
    utility: [
      "Build a shipment tracking flow with real-time status, location updates, and estimated delivery time",
      "Create a delivery scheduling notification with time slot selection and address confirmation",
      "Design a customs clearance alert with required documents, duty estimates, and action buttons",
      "Build a proof of delivery confirmation with recipient signature, photo, and feedback collection",
    ],
    authentication: [
      "Create a pickup authorization verification with sender identity and package details confirmation",
      "Build a delivery release verification with recipient OTP for high-value packages",
      "Design a business account access verification for shipment management portal",
      "Create a claims submission verification with shipment details and damage documentation",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // INSURANCE
  // ═══════════════════════════════════════════════════════════════
  Insurance: {
    marketing: [
      "Create a policy recommendation flow based on life stage with coverage comparison and premium calculator",
      "Build a renewal offer with updated benefits comparison, no-claim bonus highlight, and 'Renew Now' CTA",
      "Design a family protection plan campaign with coverage scenarios, add-on options, and free consultation",
      "Create a seasonal health insurance promotion with network hospital list and cashless claim benefits",
    ],
    utility: [
      "Build a claim status tracking flow with milestone updates, required documents, and adjuster contact",
      "Create a premium payment reminder with due date, amount, and multiple payment method buttons",
      "Design a policy document delivery with coverage summary, key terms, and 'Download PDF' button",
      "Build an annual review scheduling flow with current coverage summary and advisor booking option",
    ],
    authentication: [
      "Create a claim submission verification with policyholder identity and incident details confirmation",
      "Build a policy modification verification with beneficiary change authorization",
      "Design a premium payment verification with policyholder and payment method confirmation",
      "Create a digital policy access verification with secure document download authorization",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // TELECOMMUNICATIONS
  // ═══════════════════════════════════════════════════════════════
  Telecommunications: {
    marketing: [
      "Create a plan upgrade campaign with current vs upgraded plan comparison, data/speed benefits, and 'Upgrade Now'",
      "Build a new device launch promotion with specs carousel, trade-in value, and installment plan options",
      "Design a family plan bundle offer with per-member savings, shared data pool, and 'Add Member' flow",
      "Create a 5G migration campaign with speed comparison, coverage map, and compatible device showcase",
    ],
    utility: [
      "Build a data usage alert with current consumption, remaining balance, and top-up/upgrade options",
      "Create a bill payment reminder with amount due, breakdown, and 'Pay Now' with auto-pay setup option",
      "Design a SIM activation guide with step-by-step instructions, number porting status, and support contact",
      "Build a network maintenance notification with affected area, expected duration, and service restoration update",
    ],
    authentication: [
      "Create a SIM swap verification with identity confirmation and security questions",
      "Build an account access verification for plan changes and billing modifications",
      "Design a number porting authorization with current carrier confirmation and transfer code",
      "Create a device unlock verification with contract status check and IMEI confirmation",
    ],
  },
};

/**
 * Get industry-tailored quick prompt suggestions.
 * Falls back to generic prompts if industry not found.
 */
export function getIndustryPrompts(
  messageType: string,
  industry: string
): string[] {
  const industryData = INDUSTRY_PROMPTS[industry];
  if (industryData && industryData[messageType]) {
    return industryData[messageType];
  }

  // Fallback: try to find partial match
  for (const key of Object.keys(INDUSTRY_PROMPTS)) {
    if (
      key.toLowerCase().includes(industry.toLowerCase()) ||
      industry.toLowerCase().includes(key.toLowerCase())
    ) {
      const data = INDUSTRY_PROMPTS[key];
      if (data && data[messageType]) {
        return data[messageType];
      }
    }
  }

  // Ultimate fallback: generic high-performing prompts
  const fallback: Record<string, string[]> = {
    marketing: [
      "Create a product launch announcement with exclusive early-bird discount and product showcase carousel",
      "Build a seasonal promotion flow with limited-time offer, product highlights, and quick checkout",
      "Design a customer loyalty reward campaign with points balance, tier benefits, and redemption options",
      "Create a re-engagement campaign for inactive customers with personalized offer and win-back incentive",
    ],
    utility: [
      "Build an order confirmation flow with receipt details, delivery timeline, and real-time tracking",
      "Create an appointment reminder with date/time, location details, and reschedule/cancel buttons",
      "Design a payment receipt and invoice delivery flow with itemized breakdown and support contact",
      "Build a service update notification with status changes, next steps, and feedback collection",
    ],
    authentication: [
      "Create a login verification OTP flow with retry option and trusted device setup",
      "Build a transaction confirmation with security code and fraud alert quick action",
      "Design an account recovery flow with multi-step identity verification",
      "Create a two-factor authentication setup flow with backup code generation",
    ],
  };

  return fallback[messageType] || fallback.marketing;
}
