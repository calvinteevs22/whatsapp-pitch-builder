/**
 * Deep industry expertise for WhatsApp Business messaging.
 * Provides the AI with best-in-class knowledge about each vertical's
 * messaging patterns, conversion tactics, terminology, and proven flows.
 */

interface IndustryExpertise {
  /** Key messaging patterns that convert well */
  bestPractices: string[];
  /** Industry-specific terminology the AI should use */
  terminology: string[];
  /** Proven high-converting flow patterns */
  flowPatterns: string[];
  /** Specific product/service types to feature */
  productTypes: string[];
  /** Tone and style guidance */
  toneGuide: string;
}

const EXPERTISE: Record<string, IndustryExpertise> = {
  "E-Commerce": {
    bestPractices: [
      "Lead with urgency: countdown timers, limited stock alerts, flash sale windows",
      "Show social proof: '2,847 sold today', 'Trending now', '4.8★ (1.2K reviews)'",
      "Use abandoned cart recovery with exact item names and a time-limited discount (e.g., '15% off expires in 2 hours')",
      "Product carousels should show 3-4 items with real prices, not ranges — specificity drives clicks",
      "Include free shipping thresholds: 'Add $12 more for FREE delivery'",
      "Post-purchase: order confirmation → shipping update → delivery notification → review request",
    ],
    terminology: [
      "Flash Sale", "Limited Stock", "Best Seller", "New Arrival", "Add to Cart",
      "Checkout", "Free Shipping", "Track Order", "Wishlist", "Size Guide",
      "Customer Reviews", "Bundle Deal", "Buy 1 Get 1", "Promo Code",
    ],
    flowPatterns: [
      "Hero banner → Product carousel (3-4 items with prices) → Customer selects → Product detail with specs → Add to cart → Checkout confirmation",
      "Abandoned cart reminder → Show exact items → Limited discount → Quick checkout → Order confirmed",
      "New collection launch → Category browse → Product detail → Size/color selection → Purchase",
    ],
    productTypes: [
      "Electronics", "Fashion", "Home & Living", "Beauty Products",
      "Sports Equipment", "Accessories", "Gadgets", "Shoes",
    ],
    toneGuide: "Energetic, urgency-driven, deal-focused. Use emojis sparingly for emphasis (🔥 for deals, ⚡ for flash sales). Keep copy punchy and action-oriented.",
  },

  Healthcare: {
    bestPractices: [
      "Always maintain a professional, reassuring tone — patients trust authority",
      "Include doctor/specialist credentials and experience in promotions",
      "Health checkup packages should list all included tests with clear pricing",
      "Appointment reminders must include: doctor name, specialty, date/time, clinic address, preparation instructions",
      "Lab results should never include actual values in WhatsApp — link to secure portal",
      "Telemedicine promotions should emphasize convenience, privacy, and specialist availability",
    ],
    terminology: [
      "Consultation", "Health Checkup", "Lab Report", "Prescription", "Specialist",
      "Appointment", "Follow-up", "Telemedicine", "Wellness Program", "Vaccination",
      "Diagnostic", "Treatment Plan", "Medical Records", "Insurance Panel",
    ],
    flowPatterns: [
      "Health package promo → Package details with test list → Book appointment → Select date/time → Confirmation with preparation instructions",
      "Appointment reminder (24h before) → Clinic directions → Check-in confirmation → Post-visit follow-up → Feedback",
      "Vaccination drive → Eligibility check → Slot booking → Confirmation → Post-vaccination care instructions",
    ],
    productTypes: [
      "Health Checkup Packages", "Specialist Consultations", "Lab Tests",
      "Vaccination Programs", "Wellness Programs", "Telemedicine Sessions",
    ],
    toneGuide: "Professional, empathetic, and reassuring. Use clear medical terminology but explain in simple terms. Never be alarmist. Prioritize patient comfort and trust.",
  },

  "Food & Beverage": {
    bestPractices: [
      "Food photography descriptions must be mouth-watering: mention textures, colors, freshness",
      "Menu carousels should show dish name, brief description, and price — not just names",
      "Daily specials and chef's recommendations create urgency and exclusivity",
      "Combo/meal deals with savings highlighted outperform individual item promotions",
      "Delivery flows must include: estimated prep time, driver tracking, contactless delivery option",
      "Loyalty programs with visual stamp cards (e.g., '7/10 stamps — 3 more for a free meal!') drive repeat orders",
      "Dine-in coupon campaigns: send unique code + QR + restaurant locator to drive walk-ins and reservations",
      "Loyalty stamp card rewards with QR coupon codes bridge repeat WhatsApp engagement to repeat restaurant visits",
    ],
    terminology: [
      "Chef's Special", "Combo Deal", "Free Delivery", "Order Now", "Table for",
      "Reservation", "Menu", "Daily Special", "Meal Deal", "Takeaway",
      "Dine-in", "Prep Time", "Fresh", "Handcrafted", "Signature Dish",
    ],
    flowPatterns: [
      "Daily special with food photo → Full menu carousel → Customer selects dish → Customization options → Order confirmation with ETA",
      "Weekend brunch promo → Menu highlights → Table reservation → Date/time selection → Confirmation with directions",
      "Loyalty reward alert → Points balance → Reward catalog → Redeem → Confirmation",
      "Dine-in coupon: Exclusive offer → Coupon tier carousel → Claim coupon (QR + code) → Restaurant directions → Redemption",
      "Loyalty stamp reward: Stamp earned → View card progress → Reward catalog → Claim coupon (QR + code) → Visit to redeem",
    ],
    productTypes: [
      "Main Courses", "Appetizers", "Desserts", "Beverages",
      "Combo Meals", "Chef's Specials", "Seasonal Menu", "Catering Packages",
    ],
    toneGuide: "Warm, inviting, appetite-inducing. Use sensory language (crispy, fresh, aromatic, sizzling). Be friendly like a favorite restaurant host. Emojis OK for food items.",
  },

  "Finance & Banking": {
    bestPractices: [
      "Always include specific numbers: interest rates, loan amounts, EMI calculations, credit limits",
      "Pre-approved offers with personalized amounts convert 3x better than generic promotions",
      "Security messaging is critical: always mention encryption, secure transactions, fraud protection",
      "Credit card promotions should compare current vs upgraded benefits side by side",
      "Transaction alerts must be instant and include: amount, merchant, remaining balance, dispute option",
      "KYC flows should list exact required documents upfront to reduce drop-off",
    ],
    terminology: [
      "Pre-Approved", "EMI", "Interest Rate", "Credit Limit", "Reward Points",
      "Statement", "Balance", "Transfer", "Investment", "Fixed Deposit",
      "Mutual Fund", "Insurance", "KYC", "Net Banking", "UPI",
    ],
    flowPatterns: [
      "Pre-approved loan offer → Personalized amount/rate → EMI calculator → Apply now → Document upload → Approval confirmation",
      "Credit card upgrade → Benefits comparison carousel → Customer selects tier → Application → Instant approval",
      "Transaction alert → Amount/merchant details → 'Not you?' fraud report → Security verification → Resolution",
    ],
    productTypes: [
      "Personal Loans", "Credit Cards", "Fixed Deposits", "Savings Accounts",
      "Mutual Funds", "Insurance Plans", "Wealth Management", "Business Loans",
    ],
    toneGuide: "Professional, trustworthy, precise. Use exact numbers and percentages. Emphasize security and regulatory compliance. Avoid casual language — financial decisions require authority.",
  },

  "Travel & Hospitality": {
    bestPractices: [
      "Lead with stunning destination/property imagery — travel is visual-first",
      "Package deals should include: flights + hotel + experiences with total savings highlighted",
      "Hotel promotions must show room types with amenities, not just prices",
      "Booking confirmations need: full itinerary, check-in/out times, cancellation policy, emergency contact",
      "Local experience recommendations with ratings and 'Book Instantly' drive ancillary revenue",
      "Loyalty tier celebrations with new benefits overview increase engagement and retention",
    ],
    terminology: [
      "Getaway", "Package Deal", "All-Inclusive", "Room Upgrade", "Early Check-in",
      "Late Checkout", "Complimentary", "Concierge", "Itinerary", "Boarding Pass",
      "Resort", "Suite", "Ocean View", "City Break", "Adventure Tour",
    ],
    flowPatterns: [
      "Destination deal with hero image → Package options carousel → Select package → Room type selection → Date picker → Booking confirmation",
      "Hotel upgrade offer → Room comparison (current vs upgraded) → Customer upgrades → Confirmation with new amenities",
      "Flight status update → Gate change alert → Rebooking options → New boarding pass → Gate directions",
    ],
    productTypes: [
      "Hotel Rooms", "Flight Packages", "Tour Packages", "Local Experiences",
      "Car Rentals", "Travel Insurance", "Airport Transfers", "Cruise Packages",
    ],
    toneGuide: "Aspirational, exciting, wanderlust-inducing. Paint vivid pictures of experiences. Use descriptive language that makes the reader imagine being there. Professional but warm.",
  },

  Education: {
    bestPractices: [
      "Course promotions should highlight outcomes: career placement rates, salary increases, certifications earned",
      "Open day invitations with campus photos and faculty profiles build trust",
      "Scholarship alerts must include: eligibility criteria, application deadline, coverage details",
      "Class reminders should include: topic preview, required materials, join link (for online)",
      "Fee payment reminders with multiple payment options and installment plans reduce drop-off",
      "Alumni testimonials and success stories are the strongest conversion drivers",
    ],
    terminology: [
      "Enrollment", "Curriculum", "Faculty", "Campus", "Scholarship",
      "Semester", "Credits", "Certification", "Placement", "Alumni",
      "Webinar", "Workshop", "Masterclass", "Syllabus", "Academic Year",
    ],
    flowPatterns: [
      "New program launch → Curriculum highlights → Faculty profiles → Career outcomes → Apply now → Application confirmation",
      "Open day invitation → Event schedule → Campus tour booking → Date selection → Confirmation with directions",
      "Exam results → Score summary → Counselor booking → Career guidance → Next steps",
    ],
    productTypes: [
      "Degree Programs", "Short Courses", "Certifications", "Workshops",
      "Online Courses", "Executive Programs", "Language Courses", "Bootcamps",
    ],
    toneGuide: "Inspiring, informative, achievement-oriented. Emphasize growth, opportunity, and future success. Professional but encouraging. Use data to back claims.",
  },

  "Real Estate": {
    bestPractices: [
      "Property listings must include: location, size (sq ft), bedrooms/bathrooms, price, key amenities",
      "Virtual tour links and 3D walkthrough options dramatically increase engagement",
      "Price drop alerts with before/after and EMI estimates create urgency",
      "Neighborhood highlights (schools, hospitals, transport, restaurants) matter as much as the property",
      "Construction progress updates with milestone photos build buyer confidence for under-construction properties",
      "Site visit scheduling must include: property address, agent name/photo, what to bring",
    ],
    terminology: [
      "Sq Ft", "BHK", "Possession", "EMI", "Down Payment", "Floor Plan",
      "Amenities", "Gated Community", "Smart Home", "Premium Location",
      "Ready to Move", "Under Construction", "Handover", "Registry",
    ],
    flowPatterns: [
      "New listing alert → Property carousel (3-4 units with prices) → Select property → Virtual tour → Schedule visit → Date/time selection → Confirmation",
      "Price drop notification → Updated pricing with EMI → Property details → Site visit booking → Agent assignment",
      "Construction update → Milestone photos → Timeline → Handover scheduling → Document checklist",
    ],
    productTypes: [
      "Apartments", "Villas", "Plots", "Commercial Spaces",
      "Penthouses", "Studio Apartments", "Townhouses", "Farm Houses",
    ],
    toneGuide: "Aspirational yet informative. Emphasize lifestyle and investment value. Use specific numbers (sq ft, price, ROI). Professional and trustworthy — real estate is a major life decision.",
  },

  Automotive: {
    bestPractices: [
      "New model launches need: hero shot, key specs (engine, mileage, safety), starting price, test drive CTA",
      "Carousel cards should compare variants/trims with feature differences highlighted",
      "Service reminders with specific maintenance items due (oil change, tire rotation) and estimated cost",
      "Trade-in flows should collect vehicle details (make, model, year, mileage) for instant valuation",
      "Test drive booking must include: model, dealership location, date/time, salesperson name",
      "Post-service follow-up with service summary, next service date, and satisfaction survey",
      "Test drive campaigns should include a bonus voucher (accessories discount, free first service) to incentivize showroom visits",
      "Service coupon flows: send unique discount code + QR + service center locator to drive offline bookings",
    ],
    terminology: [
      "Test Drive", "Showroom", "EMI", "Down Payment", "Ex-Showroom Price",
      "On-Road Price", "Mileage", "Horsepower", "Torque", "Safety Rating",
      "Variant", "Trim", "Service Center", "Warranty", "Trade-In",
    ],
    flowPatterns: [
      "New model launch → Model carousel (2-3 variants with prices) → View details → Full specs with image → Book test drive → Date/time selection → Confirmation",
      "Service reminder → Maintenance checklist → Estimated cost → Schedule service → Slot selection → Confirmation with service center directions",
      "Trade-in offer → Vehicle details collection → Instant valuation → New model recommendation → Test drive booking",
      "Test drive voucher: Model launch → Book test drive → Slot selection → Bonus voucher (QR + code) → Dealership directions",
      "Service coupon: Service due reminder → Package carousel with discounted prices → Claim coupon (QR + code) → Book appointment → Service center locator",
    ],
    productTypes: [
      "Sedans", "SUVs", "Hatchbacks", "Electric Vehicles",
      "Motorcycles", "Commercial Vehicles", "Luxury Cars", "Sports Cars",
    ],
    toneGuide: "Exciting, performance-focused, aspirational. Use specific technical specs that car enthusiasts appreciate. Balance emotion (driving experience) with logic (value, safety, efficiency).",
  },

  Retail: {
    bestPractices: [
      "Seasonal sales should have clear discount tiers: 'Up to 50% off — Fashion 40%, Electronics 30%, Home 50%'",
      "VIP/member exclusive previews with early access create loyalty and urgency",
      "Back-in-stock alerts for wishlisted items have the highest conversion rates in retail",
      "Store opening announcements need: location, grand opening offers, store hours, directions",
      "Click-and-collect notifications with pickup window, store location, and QR code for quick pickup",
      "Warranty registration flows with product details and claim instructions reduce post-sale support load",
      "O2O coupon campaigns: always include a unique coupon code + QR image + store locator to bridge online engagement to in-store purchases",
      "Coupon codes must be unique and alphanumeric (e.g., STYLE15-AX7K) with clear expiry date and terms to drive urgency",
      "Every in-store promotion MUST include a 'Find Nearest Store' or 'Get Directions' button after the coupon to reduce friction",
    ],
    terminology: [
      "Sale", "Clearance", "New Arrival", "Best Seller", "Limited Edition",
      "Member Exclusive", "Loyalty Points", "Gift Card", "Store Credit",
      "Click & Collect", "In-Store", "Online Exclusive", "Seasonal Collection",
      "Coupon Code", "QR Code", "Redeem In-Store", "Store Locator", "Footfall",
    ],
    flowPatterns: [
      "Seasonal sale → Category carousel → Shop by category → Product highlights → Quick purchase → Order confirmation",
      "VIP early access → New arrivals preview → Select items → Member pricing → Checkout → Loyalty points earned",
      "Back-in-stock alert → Product details → Buy now → Size/color selection → Purchase confirmation",
      "In-store coupon: Exclusive offer → Claim coupon → Unique code + QR image → Find nearest store → Store directions → Redemption confirmation",
      "Weekend flash coupon: Urgency alert → Pick category → Instant coupon code → Store locator → Visit reminder",
    ],
    productTypes: [
      "Fashion", "Electronics", "Home & Garden", "Sports & Outdoors",
      "Toys & Games", "Books", "Jewelry", "Kitchenware",
    ],
    toneGuide: "Exciting, deal-oriented, inclusive. Create FOMO with limited availability. Celebrate the shopping experience. Friendly and approachable — like a helpful store associate.",
  },

  Technology: {
    bestPractices: [
      "Product launches should highlight 2-3 key differentiating features, not a full spec sheet",
      "Free trial offers with clear value proposition: 'Try Premium free for 14 days — no credit card required'",
      "Feature update notifications should show before/after or old vs new comparisons",
      "Onboarding flows should be step-by-step with progress indicators: 'Step 2 of 4: Connect your data'",
      "Subscription renewal reminders should compare current plan usage vs available plans",
      "Webinar invitations with speaker credentials, agenda preview, and one-click registration",
    ],
    terminology: [
      "Free Trial", "Premium", "Enterprise", "API", "Dashboard",
      "Integration", "Analytics", "Cloud", "SaaS", "Upgrade",
      "Feature", "Release", "Beta", "Onboarding", "Support Ticket",
    ],
    flowPatterns: [
      "Product launch → Feature highlights carousel → Try free → Onboarding steps → Setup complete → First value moment",
      "Trial expiring → Usage summary → Plan comparison → Upgrade with discount → Payment confirmation",
      "Feature update → What's new carousel → Try it now → Feedback collection → Share with team",
    ],
    productTypes: [
      "SaaS Products", "Mobile Apps", "Developer Tools", "Cloud Services",
      "Hardware Devices", "Software Licenses", "API Services", "IoT Devices",
    ],
    toneGuide: "Clear, innovative, solution-oriented. Lead with the problem being solved, not the technology. Use simple language for complex products. Confident but not jargon-heavy.",
  },

  "Beauty & Wellness": {
    bestPractices: [
      "Before/after showcases are the #1 conversion driver — always include transformation imagery",
      "Treatment descriptions should mention: duration, what's included, expected results, aftercare",
      "Seasonal packages (summer skin prep, winter hydration) align with customer needs",
      "Loyalty programs with points-to-treatment conversion (e.g., '500 pts = Free Facial') drive retention",
      "Appointment reminders should include: therapist/stylist name, service booked, preparation tips",
      "Product recommendations based on skin/hair type quizzes feel personalized and convert well",
      "Treatment coupon campaigns: send unique discount code + QR + salon locator to drive first-time or returning visits",
    ],
    terminology: [
      "Treatment", "Facial", "Massage", "Manicure", "Pedicure",
      "Hair Color", "Blowout", "Spa Day", "Wellness", "Glow",
      "Anti-Aging", "Hydration", "Organic", "Luxury", "Pamper",
      "Coupon", "Voucher", "First Visit", "Redeem",
    ],
    flowPatterns: [
      "New treatment launch → Before/after showcase → Treatment details → Book appointment → Therapist selection → Date/time → Confirmation",
      "Seasonal package → Service bundle details → Book now → Slot selection → Confirmation with preparation tips",
      "Skin type quiz → Questions → Personalized results → Product recommendations → Shop → Purchase confirmation",
      "Treatment coupon: Seasonal promo → Treatment carousel with discounts → Claim coupon (QR + code) → Book appointment → Salon directions",
    ],
    productTypes: [
      "Facial Treatments", "Hair Services", "Massage Therapy", "Nail Services",
      "Body Treatments", "Skincare Products", "Hair Products", "Wellness Packages",
    ],
    toneGuide: "Luxurious, pampering, aspirational. Use sensory language (silky, radiant, rejuvenating). Make the reader feel they deserve this. Warm and personal — like a trusted beauty advisor.",
  },

  Entertainment: {
    bestPractices: [
      "Event announcements need: headliner/artist, venue, date, ticket tiers with prices, 'Get Tickets' CTA",
      "Presale codes with countdown timers create exclusivity and urgency",
      "Subscription promotions should preview content (movie trailers, show clips, playlist samples)",
      "Ticket confirmations must include: QR code/barcode, seat details, venue map, parking info",
      "Post-event follow-ups with photo sharing, feedback, and 'upcoming events you might like' drive retention",
      "Group booking discounts (4+ tickets) increase average order value significantly",
      "Cinema/venue voucher campaigns: send BOGO or discount ticket codes + QR to drive walk-in ticket purchases",
    ],
    terminology: [
      "Presale", "VIP", "General Admission", "Front Row", "Backstage",
      "Premiere", "Streaming", "Binge-Watch", "Playlist", "Season Pass",
      "Festival", "Concert", "Show", "Screening", "Box Office",
    ],
    flowPatterns: [
      "Event announcement → Artist/show details → Ticket tier carousel → Select tier → Seat selection → Purchase confirmation with QR code",
      "Presale notification → Exclusive code → Event details → Buy tickets → Confirmation → Add to calendar",
      "Subscription offer → Content preview carousel → Plan comparison → Free trial → Welcome + recommendations",
    ],
    productTypes: [
      "Concert Tickets", "Movie Tickets", "Streaming Subscriptions", "Festival Passes",
      "Sports Events", "Theater Shows", "Comedy Shows", "Theme Park Tickets",
    ],
    toneGuide: "Exciting, FOMO-inducing, experiential. Create anticipation and excitement. Use vivid language that makes the reader feel the energy. Bold and dynamic.",
  },

  Logistics: {
    bestPractices: [
      "Shipment tracking must be real-time: current location, last scan, estimated delivery, driver contact",
      "Delivery scheduling with specific time slots (not just dates) reduces failed deliveries",
      "Customs clearance alerts should list exact required documents and estimated duties",
      "Proof of delivery with photo, signature, and timestamp provides accountability",
      "Business account promotions should highlight: volume discounts, API access, dedicated support",
      "Seasonal deadline campaigns (holiday shipping cutoffs) drive early bookings",
    ],
    terminology: [
      "Tracking", "Shipment", "Delivery", "Pickup", "Transit",
      "Customs", "Clearance", "Freight", "Express", "Standard",
      "Proof of Delivery", "Waybill", "Manifest", "Last Mile", "Hub",
    ],
    flowPatterns: [
      "Shipment booked → Pickup confirmed → In transit updates → Out for delivery → Delivered with POD → Feedback",
      "Business account promo → Volume pricing tiers → Feature comparison → Sign up → Welcome + API docs",
      "Customs alert → Required documents → Upload → Clearance confirmed → Delivery scheduled",
    ],
    productTypes: [
      "Express Delivery", "Standard Shipping", "Freight Services", "International Shipping",
      "Same-Day Delivery", "Warehousing", "Cold Chain", "Bulk Shipping",
    ],
    toneGuide: "Efficient, reliable, informative. Precision matters — use exact times, locations, and tracking numbers. Professional and reassuring. Customers want to know their package is safe.",
  },

  Insurance: {
    bestPractices: [
      "Policy recommendations should be life-stage specific: young professional, new parent, retiree",
      "Premium comparisons with coverage details side by side help decision-making",
      "Claim status tracking with clear milestones: filed → under review → approved → payment processed",
      "Renewal reminders should highlight no-claim bonus and updated benefits",
      "Family protection plans with scenario-based coverage explanations (what if...) resonate emotionally",
      "Cashless claim network with hospital/clinic list and process explanation reduces friction",
    ],
    terminology: [
      "Premium", "Coverage", "Claim", "Policy", "Beneficiary",
      "Deductible", "No-Claim Bonus", "Sum Assured", "Rider", "Maturity",
      "Cashless", "Reimbursement", "Underwriting", "Endorsement", "Renewal",
    ],
    flowPatterns: [
      "Policy recommendation → Life stage quiz → Coverage options carousel → Select plan → Premium calculator → Apply → Confirmation",
      "Renewal reminder → Current vs updated benefits → No-claim bonus highlight → Renew now → Payment → Confirmation",
      "Claim filing → Document upload → Status tracking → Adjuster update → Claim approved → Payment processed",
    ],
    productTypes: [
      "Health Insurance", "Life Insurance", "Motor Insurance", "Home Insurance",
      "Travel Insurance", "Business Insurance", "Critical Illness", "Term Plans",
    ],
    toneGuide: "Trustworthy, protective, empathetic. Insurance is about peace of mind — emphasize security and protection. Use clear, jargon-free explanations. Caring but professional.",
  },

  Telecommunications: {
    bestPractices: [
      "Plan upgrades should show current vs new plan with exact data/speed/price differences",
      "Device launches need: hero image, key specs, trade-in value, installment plan options",
      "Data usage alerts with visual consumption bar and top-up/upgrade options prevent bill shock",
      "Family/group plan promotions should show per-member savings and shared data pool",
      "5G migration campaigns need: speed comparison, coverage map, compatible device list",
      "Bill payment reminders with amount, due date, and auto-pay setup reduce late payments",
    ],
    terminology: [
      "Data Plan", "Unlimited", "5G", "Postpaid", "Prepaid",
      "Top-Up", "Roaming", "SIM", "eSIM", "Hotspot",
      "Bandwidth", "Coverage", "Network", "Bundle", "Add-On",
    ],
    flowPatterns: [
      "Plan upgrade → Current vs new comparison → Data/speed benefits → Upgrade now → Confirmation with activation date",
      "New device launch → Device carousel (2-3 models) → Select device → Trade-in valuation → Installment plan → Purchase confirmation",
      "Data usage alert → Consumption summary → Top-up options → Select plan → Confirmation → Usage tips",
    ],
    productTypes: [
      "Mobile Plans", "Broadband", "Fiber", "5G Plans",
      "Smartphones", "Tablets", "Wearables", "IoT SIMs",
    ],
    toneGuide: "Clear, tech-savvy, value-focused. Emphasize speed, coverage, and savings. Use specific numbers (GB, Mbps, price). Modern and straightforward — no telecom jargon.",
  },
};

/**
 * Build an industry expertise section for the AI system prompt.
 * Returns a formatted string with deep knowledge about the specific industry.
 */
export function buildIndustryExpertise(industry: string): string {
  const expertise = EXPERTISE[industry];
  if (!expertise) return "";

  return `
INDUSTRY EXPERTISE — ${industry.toUpperCase()}:
You are an expert in ${industry} WhatsApp Business messaging. Apply these best practices:

Best Practices:
${expertise.bestPractices.map((bp, i) => `${i + 1}. ${bp}`).join("\n")}

Tone & Style: ${expertise.toneGuide}

Proven Flow Patterns (use as structural guides):
${expertise.flowPatterns.map((fp, i) => `  Pattern ${i + 1}: ${fp}`).join("\n")}

Product/Service Types to Feature: ${expertise.productTypes.join(", ")}

Industry Terminology (use naturally in messages): ${expertise.terminology.join(", ")}

IMPORTANT: Your messages must sound like they were written by a ${industry} marketing expert who deeply understands the customer journey. Use industry-specific language, realistic pricing, and conversion-optimized copy. Every message should demonstrate domain expertise.`;
}

/**
 * Get all supported industries with expertise.
 */
export function getSupportedIndustries(): string[] {
  return Object.keys(EXPERTISE);
}
