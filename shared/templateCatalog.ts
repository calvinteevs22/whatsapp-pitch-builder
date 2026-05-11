/**
 * Comprehensive Industry Use Case Template Catalog
 * Covers all 15 industries × 3 message types for maximum coverage.
 * Each template includes a rich AI prompt that generates conversations with
 * images, carousels, and interactive elements.
 */

import type { TemplateBusinessContext } from './templateBusinessContext';
// Sub-vertical templates removed — sub-vertical context is now injected via AI prompt dropdown

export type EcommerceSubVertical =
  | "Fashion & Apparel"
  | "Grocery & Food Delivery"
  | "Electronics & Gadgets"
  | "Beauty & Cosmetics"
  | "Home & Furniture"
  | "Health & Pharmacy"
  | "Jewelry & Luxury"
  | "Sports & Outdoors";

export const ECOMMERCE_SUB_VERTICALS: EcommerceSubVertical[] = [
  "Fashion & Apparel",
  "Grocery & Food Delivery",
  "Electronics & Gadgets",
  "Beauty & Cosmetics",
  "Home & Furniture",
  "Health & Pharmacy",
  "Jewelry & Luxury",
  "Sports & Outdoors",
];

export type RealEstateSubVertical =
  | "Residential Sales"
  | "Commercial Real Estate"
  | "Luxury & Premium"
  | "Rental & Leasing"
  | "New Development / Off-Plan";

export const REAL_ESTATE_SUB_VERTICALS: RealEstateSubVertical[] = [
  "Residential Sales",
  "Commercial Real Estate",
  "Luxury & Premium",
  "Rental & Leasing",
  "New Development / Off-Plan",
];

export type HealthcareSubVertical =
  | "Dental Clinics"
  | "Dermatology & Aesthetics"
  | "Pediatrics & Family Medicine"
  | "Orthopedics & Sports Medicine"
  | "Mental Health & Wellness"
  | "Ophthalmology & Optometry"
  | "OB/GYN & Women's Health"
  | "Cardiology";

export const HEALTHCARE_SUB_VERTICALS: HealthcareSubVertical[] = [
  "Dental Clinics",
  "Dermatology & Aesthetics",
  "Pediatrics & Family Medicine",
  "Orthopedics & Sports Medicine",
  "Mental Health & Wellness",
  "Ophthalmology & Optometry",
  "OB/GYN & Women's Health",
  "Cardiology",
];

/** Business outcome categories for template filtering */


export interface TemplateUseCase {
  id: string;
  title: string;
  description: string;
  industry: string;
  messageType: "marketing" | "utility" | "authentication";
tags: string[];
  flowSteps: string[];
  prompt: string;
}

export const TEMPLATE_CATALOG: TemplateUseCase[] = [
  // ═══════════════════════════════════════════
  // E-COMMERCE
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "ecom-flash-sale",
    title: "Flash Sale Announcement",
    description: "Announce a limited-time flash sale with product images, countdown urgency, and quick-buy buttons for immediate conversion.",
    industry: "E-Commerce",
    messageType: "marketing",
    tags: ["Flash Sale", "Product Images", "Quick Buy"],
    flowSteps: ["Promo Template", "Product Showcase", "Quick Buy CTA", "Order Confirmation"],
    prompt: "Create a WhatsApp marketing flow for an e-commerce flash sale. Include a promotional template with product image and urgency messaging about limited time. Show a product carousel with prices and 'View Details' buttons. After the customer selects a product from the carousel, show that specific product's details (features, availability, shipping info) with a 'Buy Now' button. After the customer clicks 'Buy Now', confirm the purchase with a specific order ID (e.g., #WA-78432), itemized list with product name, quantity, and price, and a calculated total.",
  },
  {
    id: "ecom-new-arrivals",
    title: "New Arrivals Showcase",
    description: "Showcase new product arrivals with a carousel of items, seasonal collections, and personalized recommendations.",
    industry: "E-Commerce",
    messageType: "marketing",
    tags: ["New Arrivals", "Carousel", "Seasonal"],
    flowSteps: ["Announcement", "Product Carousel", "Personalized Pick", "Shop Now"],
    prompt: "Create a WhatsApp marketing flow for an e-commerce store showcasing new arrivals. Start with an announcement template with a hero image, then show a carousel of 3 new products with prices and 'View Details' buttons. After the customer selects a product from the carousel, show that product's details with a personalized recommendation and a 'Shop Now' button. After the customer clicks 'Shop Now', confirm the order.",
  },
  {
    id: "ecom-abandoned-cart",
    title: "Abandoned Cart Recovery",
    description: "Re-engage customers who left items in their cart with product reminders, limited stock alerts, and exclusive discount incentives.",
    industry: "E-Commerce",
    messageType: "marketing",
    tags: ["Cart Recovery", "Discount", "Urgency"],
    flowSteps: ["Cart Reminder", "Product Image", "Discount Offer", "Checkout CTA"],
    prompt: "Create a WhatsApp marketing flow for abandoned cart recovery. Remind the customer about items left in their cart with a product image, mention limited stock availability. Show the cart items with 'View Item' and 'Complete Purchase' buttons. After the customer clicks a button, either show the item details with updated pricing or apply a 10% discount code and confirm the checkout.",
  },
  // Utility
  {
    id: "ecom-order-tracking",
    title: "Order Status & Tracking",
    description: "Send real-time order updates from confirmation to delivery with tracking links and delivery ETA.",
    industry: "E-Commerce",
    messageType: "utility",
    tags: ["Order Tracking", "Delivery Updates", "ETA"],
    flowSteps: ["Order Confirmed", "Shipped", "Out for Delivery", "Delivered"],
    prompt: "Create a WhatsApp utility flow for e-commerce order tracking. Start with order confirmation showing a specific order ID (e.g., #WA-78432), itemized products with quantities and prices, and total amount. Then send shipping notification with tracking number (e.g., TRK-9847362) and carrier name. Send out-for-delivery update with specific ETA (e.g., 'arriving by 2:30 PM today'). Finally send delivery confirmation with the customer's name and a feedback rating request.",
  },
  {
    id: "ecom-return-exchange",
    title: "Return & Exchange Process",
    description: "Guide customers through the return or exchange process with step-by-step instructions and pickup scheduling.",
    industry: "E-Commerce",
    messageType: "utility",
    tags: ["Returns", "Exchange", "Pickup"],
    flowSteps: ["Return Request", "Reason Selection", "Pickup Date/Time Selection", "Pickup Confirmed", "Thank You"],
    prompt: "Create a WhatsApp utility flow for handling product returns. Start with a return request confirmation, ask the customer to select a reason from a list. Then present an interactive_list message with available pickup date and time slots (e.g. 'Mon 10 Mar, 9:00 AM - 12:00 PM', 'Tue 11 Mar, 2:00 PM - 5:00 PM', etc.). After the customer selects a date/time slot, confirm the pickup appointment with the chosen details and end with a thank you message.",
  },
  // Authentication
  {
    id: "ecom-login-otp",
    title: "Account Login OTP",
    description: "Send one-time passcode for secure e-commerce account login with expiry timer and retry options.",
    industry: "E-Commerce",
    messageType: "authentication",
    tags: ["OTP", "Login", "Security"],
    flowSteps: ["OTP Sent", "Verification", "Login Complete"],
    prompt: "Create a WhatsApp authentication flow for e-commerce account login. Send a 6-digit OTP code with 5-minute expiry, include a security notice about not sharing the code, and provide a resend option.",
  },

  // ═══════════════════════════════════════════
  // HEALTHCARE
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "health-screening",
    title: "Health Screening Promotion",
    description: "Promote health screening packages with educational content, package options, and appointment booking.",
    industry: "Healthcare",
    messageType: "marketing",
    tags: ["Health Screening", "Educational", "Appointment Booking"],
    flowSteps: ["Promo Template", "Health Info", "Package Selection", "Date/Time Selection", "Booking Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for a healthcare lab promoting health screening packages. Include educational content about the importance of screening, a carousel of package options with pricing and 'Select Package' buttons. After the customer selects a package, present an interactive_list message with available appointment date and time slots (e.g. 'Mon 10 Mar, 9:00 AM', 'Tue 11 Mar, 10:30 AM', 'Wed 12 Mar, 2:00 PM', etc.). After the customer picks a date/time, confirm the appointment booking with the chosen details and end with a thank you message.",
  },
  {
    id: "health-wellness-program",
    title: "Wellness Program Enrollment",
    description: "Promote corporate wellness programs with benefits overview, plan comparison, and enrollment CTA.",
    industry: "Healthcare",
    messageType: "marketing",
    tags: ["Wellness", "Corporate", "Enrollment"],
    flowSteps: ["Program Intro", "Benefits Overview", "Plan Options", "Enroll Now"],
    prompt: "Create a WhatsApp marketing flow for a healthcare provider promoting a wellness program. Start with a template about the program benefits. Show a carousel of plan options with pricing and 'Learn More' buttons. After the customer selects a plan from the carousel, show that plan's detailed benefits, coverage, and inclusions with an 'Enroll Now' button. After the customer clicks 'Enroll Now', confirm the enrollment with plan details.",
  },
  {
    id: "health-vaccination",
    title: "Vaccination Drive Campaign",
    description: "Promote vaccination campaigns with eligibility info, available vaccines, and appointment booking.",
    industry: "Healthcare",
    messageType: "marketing",
    tags: ["Vaccination", "Campaign", "Booking"],
    flowSteps: ["Campaign Alert", "Vaccine Info", "Eligibility Check", "Date/Time Selection", "Booking Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for a vaccination drive. Include a campaign announcement with an image, list available vaccines with details, check eligibility with quick questions. Then present an interactive_list message with available vaccination appointment date and time slots (e.g. 'Sat 15 Mar, 9:00 AM', 'Sat 15 Mar, 11:00 AM', 'Sun 16 Mar, 10:00 AM', etc.). After the customer selects a slot, confirm the vaccination appointment with the chosen date/time and end with a thank you message.",
  },
  // Utility
  {
    id: "health-appointment",
    title: "Appointment Reminder",
    description: "Send appointment reminders with date/time details, reschedule options, and preparation instructions.",
    industry: "Healthcare",
    messageType: "utility",
    tags: ["Appointment", "Reminder", "Reschedule"],
    flowSteps: ["Reminder Sent", "Confirm/Reschedule", "Reschedule Date/Time Selection", "Appointment Confirmed", "Thank You"],
    prompt: "Create a WhatsApp utility flow for a healthcare clinic appointment reminder. Include appointment details with confirm/reschedule buttons. If the customer chooses to reschedule, present an interactive_list message with available date and time slots (e.g. 'Mon 10 Mar, 9:00 AM', 'Tue 11 Mar, 2:30 PM', 'Wed 12 Mar, 11:00 AM', etc.). After the customer picks a new date/time, confirm the rescheduled appointment with the chosen details and end with a thank you message.",
  },
  {
    id: "health-lab-results",
    title: "Lab Results Notification",
    description: "Notify patients when lab results are ready with secure access link and follow-up appointment booking.",
    industry: "Healthcare",
    messageType: "utility",
    tags: ["Lab Results", "Notification", "Follow-up"],
    flowSteps: ["Results Ready", "Secure Access", "Summary", "Follow-up Date/Time Selection", "Appointment Confirmed", "Thank You"],
    prompt: "Create a WhatsApp utility flow for lab results notification. Notify the patient that results are ready, provide a secure link to view results, show a brief summary. Then offer to book a follow-up consultation by presenting an interactive_list message with available doctor appointment date and time slots (e.g. 'Mon 10 Mar, 10:00 AM', 'Wed 12 Mar, 3:00 PM', 'Fri 14 Mar, 9:30 AM', etc.). After the patient selects a slot, confirm the follow-up appointment with the chosen details and end with a thank you message.",
  },
  // Authentication
  {
    id: "health-patient-verify",
    title: "Patient Portal Verification",
    description: "Verify patient identity for secure access to medical records and health portal.",
    industry: "Healthcare",
    messageType: "authentication",
    tags: ["Patient Portal", "Verification", "Medical Records"],
    flowSteps: ["Verification Request", "OTP Sent", "Identity Confirmed", "Portal Access"],
    prompt: "Create a WhatsApp authentication flow for patient portal access. Send a verification code to confirm patient identity, include a security notice, and grant access to the medical records portal upon verification.",
  },

  // ═══════════════════════════════════════════
  // FOOD & BEVERAGE
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "food-reengagement",
    title: "Customer Re-engagement",
    description: "Re-engage inactive customers with personalized food recommendations and a special discount code.",
    industry: "Food & Beverage",
    messageType: "marketing",
    tags: ["Re-engagement", "Personalized", "Discount"],
    flowSteps: ["Re-engagement Template", "Menu Carousel", "Discount Offer", "Order Placed"],
    prompt: "Create a WhatsApp marketing flow for a food delivery app re-engagement. Start with a personalized template mentioning the customer's favorite cuisine. Show a carousel of recommended dishes with images, prices, and 'Order Now' buttons. After the customer selects a dish from the carousel, show that dish's details (ingredients, preparation time, ratings) and apply a 20% discount code. Then include a 'Confirm Order' button and confirm the order with delivery details.",
  },
  {
    id: "food-new-menu",
    title: "New Menu Launch",
    description: "Launch a new seasonal menu with food photography, chef's picks, and table reservation booking.",
    industry: "Food & Beverage",
    messageType: "marketing",
    tags: ["New Menu", "Seasonal", "Reservation"],
    flowSteps: ["Launch Announcement", "Menu Carousel", "Chef's Pick", "Reservation Date/Time Selection", "Reservation Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for a restaurant launching a new seasonal menu. Include a beautiful food image in the template, show a carousel of 3 new dishes with prices and 'Order' buttons, highlight the chef's special pick. Then present an interactive_list message with available table reservation date and time slots (e.g. 'Fri 14 Mar, 7:00 PM', 'Sat 15 Mar, 7:30 PM', 'Sun 16 Mar, 12:00 PM', etc.). After the customer selects a date/time, confirm the reservation with the chosen details and end with a thank you message.",
  },
  {
    id: "food-loyalty-program",
    title: "Loyalty Program Rewards",
    description: "Notify loyalty members about earned rewards, point balance, and exclusive member-only deals.",
    industry: "Food & Beverage",
    messageType: "marketing",
    tags: ["Loyalty", "Rewards", "Exclusive"],
    flowSteps: ["Reward Alert", "Points Balance", "Exclusive Deals", "Redeem Now"],
    prompt: "Create a WhatsApp marketing flow for a food delivery loyalty program. Notify the customer about earned reward points and show their balance. Present exclusive member-only deals in a carousel with images, prices, and 'Redeem' buttons. After the customer selects a deal from the carousel, show the deal details and redemption instructions with a 'Confirm Redemption' button. After the customer confirms, show the redemption confirmation with a QR code.",
  },
  // Utility
  {
    id: "food-order-status",
    title: "Order Status Updates",
    description: "Send real-time food order updates from kitchen preparation to delivery with driver tracking.",
    industry: "Food & Beverage",
    messageType: "utility",
    tags: ["Order Status", "Delivery", "Tracking"],
    flowSteps: ["Order Confirmed", "Preparing", "Out for Delivery", "Delivered"],
    prompt: "Create a WhatsApp utility flow for food delivery order tracking. Start with order confirmation showing order ID (e.g., #FD-8834), specific items with quantities and prices (e.g., 'Margherita Pizza x1 - $14.99, Garlic Bread x1 - $5.99'), and total ($20.98). Update when food is being prepared (e.g., 'Chef Marco is preparing your order!'). Notify when driver is on the way with specific ETA (e.g., 'Driver Raj is 12 min away'). Confirm delivery with a rating request.",
  },
  {
    id: "food-reservation",
    title: "Table Reservation Booking",
    description: "Book restaurant table reservations with date/time selection, menu preview, and special requests handling.",
    industry: "Food & Beverage",
    messageType: "utility",
    tags: ["Reservation", "Booking", "Menu Preview"],
    flowSteps: ["Reservation Request", "Date/Time Selection", "Party Size", "Reservation Confirmed", "Thank You"],
    prompt: "Create a WhatsApp utility flow for restaurant table reservation booking. Start by asking the customer about their reservation, then present an interactive_list message with available date and time slots (e.g. 'Fri 14 Mar, 7:00 PM', 'Sat 15 Mar, 7:30 PM', 'Sun 16 Mar, 12:00 PM', etc.). After the customer selects a date/time, ask about party size and any special dietary requirements. Then confirm the reservation with the chosen date/time and details, and end with a thank you message.",
  },
  // Authentication
  {
    id: "food-account-verify",
    title: "Delivery Account Verification",
    description: "Verify new food delivery account with OTP for secure ordering and payment setup.",
    industry: "Food & Beverage",
    messageType: "authentication",
    tags: ["Account Setup", "OTP", "Verification"],
    flowSteps: ["Welcome", "OTP Sent", "Verified", "Ready to Order"],
    prompt: "Create a WhatsApp authentication flow for a new food delivery account. Welcome the user, send a verification OTP, confirm the account is verified, and let them know they're ready to start ordering.",
  },

  // ═══════════════════════════════════════════
  // FINANCE & BANKING
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "finance-credit-card",
    title: "Credit Card Offer",
    description: "Promote a premium credit card with benefits showcase, eligibility check, and instant application flow.",
    industry: "Finance & Banking",
    messageType: "marketing",
    tags: ["Credit Card", "Benefits", "Application"],
    flowSteps: ["Offer Template", "Benefits Carousel", "Eligibility Check", "Apply Now"],
    prompt: "Create a WhatsApp marketing flow for a bank promoting a new premium credit card. Start with a template announcing the card with an image. Show key benefits like cashback and lounge access in a carousel with 'Learn More' buttons. After the customer selects a benefit to learn more about, show detailed information about that benefit. Then ask a quick eligibility question with interactive buttons, and provide an instant application link.",
  },
  {
    id: "finance-investment",
    title: "Investment Product Promotion",
    description: "Promote investment products like mutual funds or fixed deposits with returns comparison and quick invest option.",
    industry: "Finance & Banking",
    messageType: "marketing",
    tags: ["Investment", "Mutual Funds", "Returns"],
    flowSteps: ["Product Intro", "Returns Comparison", "Risk Profile", "Invest Now"],
    prompt: "Create a WhatsApp marketing flow for a bank promoting investment products. Introduce the investment opportunity with an image. Show a carousel comparing 3 products with expected returns and 'View Details' buttons. After the customer selects a product from the carousel, show that product's detailed breakdown (risk level, tenure, minimum investment, projected returns). Then ask about their risk appetite with interactive buttons and include an invest-now button.",
  },
  {
    id: "finance-loan-offer",
    title: "Personal Loan Pre-approval",
    description: "Notify pre-approved customers about personal loan offers with competitive rates and instant disbursement.",
    industry: "Finance & Banking",
    messageType: "marketing",
    tags: ["Personal Loan", "Pre-approved", "Instant"],
    flowSteps: ["Pre-approval Alert", "Loan Details", "EMI Calculator", "Apply Now"],
    prompt: "Create a WhatsApp marketing flow for a pre-approved personal loan offer. Notify the customer about their pre-approved amount with a template. Show loan term options in a carousel with different tenures and interest rates with 'Select Plan' buttons. After the customer selects a loan plan, show the detailed EMI breakdown for that specific plan with monthly payment amount. Then include an 'Apply Now' button and confirm the application.",
  },
  // Utility
  {
    id: "finance-payment-receipt",
    title: "Payment Confirmation",
    description: "Send payment receipts with transaction details, invoice download, and support contact.",
    industry: "Finance & Banking",
    messageType: "utility",
    tags: ["Payment", "Receipt", "Invoice"],
    flowSteps: ["Payment Received", "Receipt Details", "Invoice Link", "Support"],
    prompt: "Create a WhatsApp utility flow for payment confirmation. Include transaction details with amount and reference number, downloadable invoice link, and customer support options for any payment issues.",
  },
  {
    id: "finance-statement",
    title: "Monthly Statement Alert",
    description: "Send monthly account statement summaries with spending insights and bill payment reminders.",
    industry: "Finance & Banking",
    messageType: "utility",
    tags: ["Statement", "Spending", "Bill Payment"],
    flowSteps: ["Statement Ready", "Summary", "Spending Insights", "Pay Bills"],
    prompt: "Create a WhatsApp utility flow for monthly bank statement notification. Alert the customer that their statement is ready, show a summary of key transactions, provide spending category insights, and include a bill payment button.",
  },
  // Authentication
  {
    id: "finance-transaction-verify",
    title: "Transaction Verification",
    description: "Verify high-value transactions with OTP confirmation, transaction details, and fraud alert options.",
    industry: "Finance & Banking",
    messageType: "authentication",
    tags: ["Transaction", "OTP", "Fraud Prevention"],
    flowSteps: ["Transaction Alert", "OTP Verification", "Confirmed", "Receipt"],
    prompt: "Create a WhatsApp authentication flow for transaction verification. Show transaction details (amount, merchant, time), send OTP for confirmation, include a 'Not me' fraud report button, and send confirmation receipt after verification.",
  },

  // ═══════════════════════════════════════════
  // TRAVEL & HOSPITALITY
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "travel-package-deal",
    title: "Travel Package Deal",
    description: "Showcase exclusive travel packages with destination images, itinerary highlights, and booking with date selection.",
    industry: "Travel & Hospitality",
    messageType: "marketing",
    tags: ["Travel Package", "Destinations", "Booking"],
    flowSteps: ["Deal Template", "Destination Carousel", "Itinerary Preview", "Travel Date/Time Selection", "Booking Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for a travel agency promoting holiday packages. Include beautiful destination images, a carousel of 3 package options with pricing and 'View Package' buttons, itinerary highlights. After the customer selects a package, present an interactive_list message with available travel dates (e.g. 'Sat 22 Mar - Sat 29 Mar', 'Sat 5 Apr - Sat 12 Apr', 'Sat 19 Apr - Sat 26 Apr', etc.). After the customer picks a date, confirm the booking with the chosen details and end with a thank you message.",
  },
  {
    id: "travel-early-bird",
    title: "Early Bird Flight Deals",
    description: "Promote early bird flight deals with route options, fare comparison, and flight date booking.",
    industry: "Travel & Hospitality",
    messageType: "marketing",
    tags: ["Flights", "Early Bird", "Fare Deals"],
    flowSteps: ["Deal Alert", "Route Options", "Fare Comparison", "Flight Date/Time Selection", "Booking Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for an airline promoting early bird flight deals. Announce the sale with an image, show a carousel of popular routes with discounted fares and 'Book Flight' buttons, compare economy vs business class. After the customer selects a route, present an interactive_list message with available flight dates and times (e.g. 'Mon 17 Mar, 6:30 AM', 'Wed 19 Mar, 10:00 AM', 'Fri 21 Mar, 3:15 PM', etc.). After the customer picks a flight, confirm the booking with the chosen details and end with a thank you message.",
  },
  {
    id: "travel-loyalty-upgrade",
    title: "Hotel Loyalty Upgrade Offer",
    description: "Offer loyalty members room upgrades, spa packages, and exclusive dining experiences at partner hotels.",
    industry: "Travel & Hospitality",
    messageType: "marketing",
    tags: ["Loyalty", "Room Upgrade", "Exclusive"],
    flowSteps: ["Upgrade Offer", "Room Options", "Add-on Packages", "Confirm Upgrade"],
    prompt: "Create a WhatsApp marketing flow for a hotel loyalty program upgrade offer. Notify the member about a complimentary room upgrade. Show room options in a carousel with images and 'Select Room' buttons. After the customer selects a room from the carousel, show that room's detailed amenities and features. Then offer add-on spa and dining packages with interactive buttons, and confirm the upgrade with all selected options.",
  },
  // Utility
  {
    id: "travel-booking-confirm",
    title: "Hotel Booking Confirmation",
    description: "Confirm hotel reservations with check-in details, amenity information, and pre-arrival preferences.",
    industry: "Travel & Hospitality",
    messageType: "utility",
    tags: ["Booking", "Hotel", "Check-in"],
    flowSteps: ["Booking Confirmed", "Room Details", "Check-in Time Selection", "Pre-arrival Prefs", "Confirmed", "Thank You"],
    prompt: "Create a WhatsApp utility flow for hotel booking confirmation. Include reservation details, room type and amenities. Present an interactive_list message with available check-in time slots (e.g. 'Early Check-in 12:00 PM', 'Standard 2:00 PM', 'Late Check-in 4:00 PM', 'Evening 6:00 PM', etc.). After the customer selects a check-in time, ask about pre-arrival preferences (pillow type, special requests), confirm the booking with all chosen details, and end with a thank you message.",
  },
  {
    id: "travel-flight-update",
    title: "Flight Status Updates",
    description: "Send real-time flight status updates including gate changes, delays, and boarding notifications.",
    industry: "Travel & Hospitality",
    messageType: "utility",
    tags: ["Flight Status", "Gate Info", "Boarding"],
    flowSteps: ["Check-in Reminder", "Gate Assignment", "Boarding Alert", "Arrival Info"],
    prompt: "Create a WhatsApp utility flow for flight status updates. Send a check-in reminder 24 hours before, notify about gate assignment, send a boarding alert with seat info, and provide arrival information with baggage claim details.",
  },
  // Authentication
  {
    id: "travel-booking-verify",
    title: "Booking Verification",
    description: "Verify travel booking modifications or cancellations with OTP to prevent unauthorized changes.",
    industry: "Travel & Hospitality",
    messageType: "authentication",
    tags: ["Booking", "Verification", "Security"],
    flowSteps: ["Modification Request", "OTP Sent", "Verified", "Change Confirmed"],
    prompt: "Create a WhatsApp authentication flow for travel booking modification verification. Alert about a booking change request, send OTP for verification, confirm the change upon verification, and send updated booking details.",
  },

  // ═══════════════════════════════════════════
  // EDUCATION
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "edu-course-launch",
    title: "New Course Launch",
    description: "Promote new courses with curriculum highlights, instructor profiles, and early enrollment discounts.",
    industry: "Education",
    messageType: "marketing",
    tags: ["Course Launch", "Curriculum", "Enrollment"],
    flowSteps: ["Course Announcement", "Curriculum Preview", "Instructor Info", "Enroll Now"],
    prompt: "Create a WhatsApp marketing flow for an online education platform launching a new course. Include a course announcement with an image. Show a carousel of course modules with curriculum highlights and 'Learn More' buttons. After the customer selects a module to learn more about, show detailed curriculum content and the instructor profile. Then offer an early-bird enrollment discount with a 'Sign Up Now' button and confirm the enrollment.",
  },
  {
    id: "edu-open-day",
    title: "Open Day Invitation",
    description: "Invite prospective students to campus open days with program showcases, session time selection, and registration.",
    industry: "Education",
    messageType: "marketing",
    tags: ["Open Day", "Campus Tour", "Registration"],
    flowSteps: ["Invitation", "Program Showcase", "Session Date/Time Selection", "Registration Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for a university open day invitation. Send an invitation with campus image. Show a carousel of featured programs with 'Learn More' buttons. After the student selects a program from the carousel, show that program's details, highlights, and career prospects. Then present an interactive_list message with available open day session date and time slots (e.g. 'Sat 15 Mar, 9:00 AM Session', 'Sat 15 Mar, 1:00 PM Session', 'Sun 16 Mar, 10:00 AM Session', etc.). After the student selects a session, confirm the registration with the chosen date/time and end with a thank you message.",
  },
  {
    id: "edu-scholarship",
    title: "Scholarship Opportunity",
    description: "Promote scholarship programs with eligibility criteria, application steps, and deadline reminders.",
    industry: "Education",
    messageType: "marketing",
    tags: ["Scholarship", "Financial Aid", "Application"],
    flowSteps: ["Scholarship Alert", "Eligibility Info", "Application Steps", "Apply Now"],
    prompt: "Create a WhatsApp marketing flow for a scholarship program. Announce the scholarship opportunity with an image. Show a carousel of available scholarships with coverage amounts and 'View Details' buttons. After the student selects a scholarship from the carousel, show that scholarship's eligibility criteria and application process. Then include an 'Apply Now' button with the deadline and confirm the application submission.",
  },
  // Utility
  {
    id: "edu-enrollment-confirm",
    title: "Enrollment Confirmation",
    description: "Confirm course enrollment with schedule details, material links, and orientation information.",
    industry: "Education",
    messageType: "utility",
    tags: ["Enrollment", "Schedule", "Orientation"],
    flowSteps: ["Enrollment Confirmed", "Schedule", "Materials", "Orientation Info"],
    prompt: "Create a WhatsApp utility flow for course enrollment confirmation. Confirm the enrollment with course details and a congratulations image. Share the class schedule with interactive buttons to view different sections. After the student selects a section, show the detailed schedule and provide links to course materials. Then send orientation information with date and location details.",
  },
  {
    id: "edu-exam-reminder",
    title: "Exam Schedule & Reminder",
    description: "Send exam schedule reminders with venue details, preparation tips, and required documents.",
    industry: "Education",
    messageType: "utility",
    tags: ["Exam", "Reminder", "Preparation"],
    flowSteps: ["Exam Reminder", "Venue Details", "Prep Tips", "Required Docs"],
    prompt: "Create a WhatsApp utility flow for exam reminders. Send a reminder with exam date and time, provide venue details with directions, share preparation tips, and list required documents to bring.",
  },
  // Authentication
  {
    id: "edu-student-portal",
    title: "Student Portal Login",
    description: "Verify student identity for secure access to grades, assignments, and academic records.",
    industry: "Education",
    messageType: "authentication",
    tags: ["Student Portal", "OTP", "Academic Records"],
    flowSteps: ["Login Request", "OTP Sent", "Verified", "Portal Access"],
    prompt: "Create a WhatsApp authentication flow for student portal access. Send a verification OTP when the student attempts to log in, verify their identity, and grant access to their academic dashboard.",
  },

  // ═══════════════════════════════════════════
  // REAL ESTATE
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "realestate-new-listing",
    title: "New Property Listing",
    description: "Showcase new property listings with virtual tours, floor plans, and viewing appointment booking.",
    industry: "Real Estate",
    messageType: "marketing",
    tags: ["New Listing", "Virtual Tour", "Viewing"],
    flowSteps: ["Listing Alert", "Property Carousel", "Virtual Tour", "Viewing Date/Time Selection", "Viewing Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for a real estate agency showcasing new property listings. Send a listing alert with a property image, show a carousel of 3 properties with prices, key features, and 'View Property' buttons, offer a virtual tour link. Then present an interactive_list message with available property viewing date and time slots (e.g. 'Sat 15 Mar, 10:00 AM', 'Sun 16 Mar, 2:00 PM', 'Tue 18 Mar, 5:30 PM', etc.). After the customer selects a viewing slot, confirm the appointment with the chosen details and end with a thank you message.",
  },
  {
    id: "realestate-investment",
    title: "Property Investment Opportunity",
    description: "Promote property investment opportunities with ROI projections, location highlights, and consultation booking.",
    industry: "Real Estate",
    messageType: "marketing",
    tags: ["Investment", "ROI", "Consultation"],
    flowSteps: ["Investment Alert", "Property Details", "ROI Projection", "Consultation Date/Time Selection", "Consultation Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for a property investment opportunity. Announce the investment with a property image, show key details and location highlights, present ROI projections. Then present an interactive_list message with available consultation date and time slots (e.g. 'Mon 10 Mar, 10:00 AM', 'Wed 12 Mar, 2:00 PM', 'Fri 14 Mar, 4:00 PM', etc.). After the customer selects a slot, confirm the consultation appointment with the chosen details and end with a thank you message.",
  },
  // Utility
  {
    id: "realestate-viewing-confirm",
    title: "Property Viewing Booking",
    description: "Book property viewing appointments with date/time selection, address, directions, and agent contact.",
    industry: "Real Estate",
    messageType: "utility",
    tags: ["Viewing", "Appointment", "Booking"],
    flowSteps: ["Viewing Request", "Property Details", "Viewing Date/Time Selection", "Viewing Confirmed", "Thank You"],
    prompt: "Create a WhatsApp utility flow for property viewing booking. Share property details with an image, then present an interactive_list message with available viewing date and time slots (e.g. 'Sat 15 Mar, 10:00 AM', 'Sun 16 Mar, 2:00 PM', 'Mon 17 Mar, 5:00 PM', etc.). After the customer selects a viewing slot, confirm the appointment with the chosen date/time, provide directions and the agent's contact information, and end with a thank you message.",
  },
  {
    id: "realestate-payment-milestone",
    title: "Payment Milestone Reminder",
    description: "Remind buyers about upcoming payment milestones with amount details and payment options.",
    industry: "Real Estate",
    messageType: "utility",
    tags: ["Payment", "Milestone", "Reminder"],
    flowSteps: ["Payment Reminder", "Amount Details", "Payment Options", "Confirmation"],
    prompt: "Create a WhatsApp utility flow for property payment milestone reminders. Remind the buyer about the upcoming payment, show the amount and due date, present payment method options, and confirm receipt after payment.",
  },
  // Marketing
  {
    id: "realestate-open-house",
    title: "Open House Invitation",
    description: "Invite potential buyers to open house events with property previews, session time selection, and RSVP.",
    industry: "Real Estate",
    messageType: "marketing",
    tags: ["Open House", "Event", "RSVP"],
    flowSteps: ["Invitation", "Property Preview", "Session Date/Time Selection", "RSVP Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for a real estate open house invitation. Send an invitation with a property image, preview the featured properties. Then present an interactive_list message with available open house session date and time slots (e.g. 'Sat 15 Mar, 10:00 AM', 'Sat 15 Mar, 2:00 PM', 'Sun 16 Mar, 11:00 AM', etc.). After the customer selects a session, confirm the RSVP with the chosen date/time and end with a thank you message.",
  },
  // Authentication
  {
    id: "realestate-document-verify",
    title: "Document Access Verification",
    description: "Verify identity before granting access to sensitive property documents like contracts and agreements.",
    industry: "Real Estate",
    messageType: "authentication",
    tags: ["Document Access", "Verification", "Contracts"],
    flowSteps: ["Access Request", "OTP Sent", "Verified", "Document Access"],
    prompt: "Create a WhatsApp authentication flow for accessing property documents. When a buyer requests access to contracts, send an OTP for verification, confirm identity, and provide secure access to the documents.",
  },

  // ═══════════════════════════════════════════
  // AUTOMOTIVE
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "auto-new-model",
    title: "New Model Launch",
    description: "Launch a new car model with feature highlights, variant comparison, and test drive appointment booking.",
    industry: "Automotive",
    messageType: "marketing",
    tags: ["New Model", "Features", "Test Drive"],
    flowSteps: ["Launch Announcement", "Feature Carousel", "Variant Comparison", "Test Drive Date/Time Selection", "Booking Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for a car dealership launching a new model. Announce the launch with a hero image, show a carousel of key features with 'Explore' buttons, compare variants with pricing. Then present an interactive_list message with available test drive date and time slots (e.g. 'Sat 15 Mar, 10:00 AM', 'Sat 15 Mar, 2:00 PM', 'Sun 16 Mar, 11:00 AM', etc.). After the customer selects a slot, confirm the test drive appointment with the chosen details and end with a thank you message.",
  },
  {
    id: "auto-service-promo",
    title: "Service Package Promotion",
    description: "Promote car service packages with maintenance checklist, package comparison, and service appointment booking.",
    industry: "Automotive",
    messageType: "marketing",
    tags: ["Service", "Maintenance", "Booking"],
    flowSteps: ["Service Reminder", "Package Options", "Price Comparison", "Service Date/Time Selection", "Booking Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for an automotive service center promoting service packages. Send a service reminder with a car image, show a carousel of service packages with pricing and 'Book Service' buttons, compare basic vs premium options. Then present an interactive_list message with available service appointment date and time slots (e.g. 'Mon 10 Mar, 8:00 AM', 'Wed 12 Mar, 9:30 AM', 'Fri 14 Mar, 2:00 PM', etc.). After the customer selects a slot, confirm the service appointment with the chosen details and end with a thank you message.",
  },
  {
    id: "auto-trade-in",
    title: "Trade-In Value Offer",
    description: "Offer customers trade-in valuations for their current vehicle with upgrade options and dealership visit booking.",
    industry: "Automotive",
    messageType: "marketing",
    tags: ["Trade-In", "Valuation", "Upgrade"],
    flowSteps: ["Trade-In Offer", "Valuation", "Upgrade Options", "Visit Date/Time Selection", "Visit Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for a car trade-in program. Offer the customer a free trade-in valuation, show estimated value, present upgrade options in a carousel with prices and 'View Details' buttons. Then present an interactive_list message with available dealership visit date and time slots (e.g. 'Sat 15 Mar, 10:00 AM', 'Sat 15 Mar, 3:00 PM', 'Sun 16 Mar, 11:00 AM', etc.). After the customer selects a slot, confirm the dealership visit appointment with the chosen details and end with a thank you message.",
  },
  // Utility
  {
    id: "auto-service-update",
    title: "Service Status Updates",
    description: "Send real-time car service updates from drop-off to pickup with inspection reports and cost estimates.",
    industry: "Automotive",
    messageType: "utility",
    tags: ["Service Status", "Inspection", "Pickup"],
    flowSteps: ["Drop-off Confirmed", "Inspection Report", "Cost Estimate", "Ready for Pickup"],
    prompt: "Create a WhatsApp utility flow for car service status updates. Confirm vehicle drop-off, send an inspection report with findings, provide a cost estimate for approval, and notify when the car is ready for pickup.",
  },
  {
    id: "auto-insurance-renewal",
    title: "Insurance Renewal Reminder",
    description: "Remind customers about upcoming car insurance renewal with coverage options and quick renewal.",
    industry: "Automotive",
    messageType: "utility",
    tags: ["Insurance", "Renewal", "Coverage"],
    flowSteps: ["Renewal Reminder", "Current Coverage", "Renewal Options", "Renew Now"],
    prompt: "Create a WhatsApp utility flow for car insurance renewal. Remind the customer about the upcoming expiry with policy number and expiry date, show current coverage details and premium amount, present renewal options with 'Renew Same Plan' and 'Contact Agent' buttons, and confirm the renewal.",
  },
  // Authentication
  {
    id: "auto-service-verify",
    title: "Service Authorization",
    description: "Verify customer identity before authorizing expensive repairs or modifications to their vehicle.",
    industry: "Automotive",
    messageType: "authentication",
    tags: ["Authorization", "Repair", "Verification"],
    flowSteps: ["Repair Request", "Cost Details", "OTP Verification", "Authorized"],
    prompt: "Create a WhatsApp authentication flow for authorizing car repairs. Show the repair details and cost, send an OTP for authorization, verify the customer's identity, and confirm the repair is authorized to proceed.",
  },

  // ═══════════════════════════════════════════
  // RETAIL
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "retail-seasonal-sale",
    title: "Seasonal Sale Campaign",
    description: "Promote seasonal sales with category highlights, top deals carousel, and store locator.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Seasonal Sale", "Top Deals", "Store Locator"],
    flowSteps: ["Sale Announcement", "Category Highlights", "Top Deals Carousel", "Find Store"],
    prompt: "Create a WhatsApp marketing flow for a retail chain's seasonal sale. Announce the sale with a vibrant image. Show category highlights with interactive buttons. Present top deals in a carousel with images, prices, and 'View Deal' buttons. After the customer selects a deal from the carousel, show that deal's details (original price, discount, savings) with a 'Buy Now' button and a store locator option.",
  },
  {
    id: "retail-membership",
    title: "VIP Membership Drive",
    description: "Promote VIP membership with exclusive benefits, tier comparison, and instant sign-up.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["VIP", "Membership", "Exclusive Benefits"],
    flowSteps: ["Membership Offer", "Benefits Overview", "Tier Comparison", "Join Now"],
    prompt: "Create a WhatsApp marketing flow for a retail VIP membership program. Introduce the membership with an image. Compare membership tiers in a carousel with pricing and 'View Benefits' buttons. After the customer selects a tier from the carousel, show that tier's detailed exclusive benefits and perks. Then include a 'Join Now' button and confirm the membership enrollment.",
  },
  {
    id: "retail-product-restock",
    title: "Back-in-Stock Alert",
    description: "Notify customers when popular items are back in stock with product details and quick purchase options.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Restock", "Alert", "Quick Buy"],
    flowSteps: ["Restock Alert", "Product Details", "Size/Color Options", "Buy Now"],
    prompt: "Create a WhatsApp marketing flow for a back-in-stock notification. Alert the customer that their wished item is back with a product image. Show size and color options with interactive buttons. After the customer selects their preferred size/color, show the product details with availability count and a 'Buy Now' button with limited stock urgency. Confirm the purchase after the customer clicks 'Buy Now'.",
  },
  // Utility
  {
    id: "retail-pickup-ready",
    title: "Click & Collect Notification",
    description: "Notify customers when their click-and-collect order is ready for pickup with store details.",
    industry: "Retail",
    messageType: "utility",
    tags: ["Click & Collect", "Pickup", "Store Info"],
    flowSteps: ["Order Ready", "Store Details", "Pickup Instructions", "Collected"],
    prompt: "Create a WhatsApp utility flow for click-and-collect order pickup. Notify the customer their order is ready, share store details and hours, provide pickup instructions with a QR code mention, and confirm collection.",
  },
  {
    id: "retail-warranty",
    title: "Warranty Registration",
    description: "Guide customers through product warranty registration with product details and coverage information.",
    industry: "Retail",
    messageType: "utility",
    tags: ["Warranty", "Registration", "Coverage"],
    flowSteps: ["Purchase Confirmed", "Warranty Info", "Registration", "Coverage Details"],
    prompt: "Create a WhatsApp utility flow for product warranty registration. Confirm the purchase, explain warranty coverage, guide through registration with product serial number, and provide coverage details and claim instructions.",
  },
  // Authentication
  {
    id: "retail-account-verify",
    title: "Loyalty Account Verification",
    description: "Verify loyalty account access for points redemption and exclusive member benefits.",
    industry: "Retail",
    messageType: "authentication",
    tags: ["Loyalty", "Verification", "Points"],
    flowSteps: ["Redemption Request", "OTP Sent", "Verified", "Points Redeemed"],
    prompt: "Create a WhatsApp authentication flow for loyalty points redemption. When a customer wants to redeem points, send an OTP for verification, confirm their identity, and process the points redemption.",
  },

  // ═══════════════════════════════════════════
  // TECHNOLOGY
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "tech-product-launch",
    title: "Tech Product Launch",
    description: "Launch a new tech product with feature showcase, spec comparison, and pre-order capability.",
    industry: "Technology",
    messageType: "marketing",
    tags: ["Product Launch", "Features", "Pre-order"],
    flowSteps: ["Launch Announcement", "Feature Showcase", "Spec Comparison", "Pre-order"],
    prompt: "Create a WhatsApp marketing flow for a tech company launching a new smartphone. Announce the launch with a product image. Show key features in a carousel with 'Learn More' buttons. After the customer selects a feature to learn more about, show detailed specs and comparison with the previous model. Then include a 'Pre-order Now' button with early-bird pricing and confirm the pre-order.",
  },
  {
    id: "tech-saas-trial",
    title: "SaaS Free Trial Offer",
    description: "Promote a SaaS product free trial with feature highlights, use case examples, and sign-up flow.",
    industry: "Technology",
    messageType: "marketing",
    tags: ["SaaS", "Free Trial", "Features"],
    flowSteps: ["Trial Offer", "Feature Highlights", "Use Cases", "Start Trial"],
    prompt: "Create a WhatsApp marketing flow for a SaaS company offering a free trial. Introduce the product with an image. Show key features in a carousel with 'Learn More' buttons. After the customer selects a feature, show that feature's detailed use case examples for their industry. Then include a 'Start Free Trial' button and confirm the trial activation with login details.",
  },
  {
    id: "tech-webinar",
    title: "Tech Webinar Invitation",
    description: "Invite users to a tech webinar with speaker profiles, agenda preview, and registration.",
    industry: "Technology",
    messageType: "marketing",
    tags: ["Webinar", "Speaker", "Registration"],
    flowSteps: ["Webinar Invite", "Speaker Profile", "Agenda Preview", "Register Now"],
    prompt: "Create a WhatsApp marketing flow for a tech webinar invitation. Send an invitation with a banner image. Show the agenda topics in a carousel with 'Learn More' buttons. After the customer selects a topic, show that topic's details and the speaker profile. Then include a 'Register Now' button with calendar add option and confirm the registration.",
  },
  // Utility
  {
    id: "tech-subscription-renewal",
    title: "Subscription Renewal Notice",
    description: "Notify users about upcoming subscription renewal with plan details and renewal confirmation.",
    industry: "Technology",
    messageType: "utility",
    tags: ["Subscription", "Renewal", "Notice"],
    flowSteps: ["Renewal Notice", "Current Plan", "Renewal Confirmation"],
    prompt: "Create a WhatsApp utility flow for subscription renewal notification. Notify the user about the upcoming renewal date with their current plan name and price. Show a summary of their plan details (features, usage). Include 'Confirm Renewal', 'Cancel Auto-Renew', and 'Contact Support' buttons. Confirm the renewal with the next billing date.",
  },
  {
    id: "tech-incident-alert",
    title: "Service Incident Alert",
    description: "Alert users about service incidents with status updates, estimated resolution time, and workarounds.",
    industry: "Technology",
    messageType: "utility",
    tags: ["Incident", "Status Update", "Resolution"],
    flowSteps: ["Incident Alert", "Impact Details", "Status Update", "Resolved"],
    prompt: "Create a WhatsApp utility flow for service incident notification. Alert users about the incident, explain the impact, provide status updates with estimated resolution time, and confirm when the service is restored.",
  },
  // Authentication
  {
    id: "tech-login-otp",
    title: "Two-Factor Authentication",
    description: "Send 2FA codes for secure account access with device recognition and backup code options.",
    industry: "Technology",
    messageType: "authentication",
    tags: ["2FA", "OTP", "Device Recognition"],
    flowSteps: ["Login Attempt", "2FA Code Sent", "Verified", "Access Granted"],
    prompt: "Create a WhatsApp authentication flow for two-factor authentication. Detect a login attempt from a new device, send a 2FA code, verify the code, and grant access with an option to trust the device.",
  },

  // ═══════════════════════════════════════════
  // BEAUTY & WELLNESS
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "beauty-product-launch",
    title: "Beauty Product Launch",
    description: "Launch a new skincare line with product showcase, ingredient highlights, and exclusive pre-order access.",
    industry: "Beauty & Wellness",
    messageType: "marketing",
    tags: ["Product Launch", "Skincare", "Pre-order"],
    flowSteps: ["Launch Template", "Product Carousel", "Ingredient Info", "Pre-order CTA"],
    prompt: "Create a WhatsApp marketing flow for a beauty brand launching a new skincare serum. Include a product image in the template. Show a carousel of the product line with prices and 'View Details' buttons. After the customer selects a product from the carousel, show that product's key ingredients, benefits, and usage instructions. Then offer an exclusive pre-order with early-bird pricing and confirm the order.",
  },
  {
    id: "beauty-spa-promo",
    title: "Spa Package Promotion",
    description: "Promote spa and wellness packages with treatment options, testimonials, and appointment booking.",
    industry: "Beauty & Wellness",
    messageType: "marketing",
    tags: ["Spa", "Wellness", "Booking"],
    flowSteps: ["Spa Promo", "Treatment Carousel", "Results Gallery", "Appointment Date/Time Selection", "Booking Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for a spa promoting wellness packages. Send a relaxing spa image, show a carousel of treatment packages with pricing and 'Book Now' buttons, share customer testimonials. Then present an interactive_list message with available appointment date and time slots (e.g. 'Sat 15 Mar, 10:00 AM', 'Sat 15 Mar, 2:00 PM', 'Sun 16 Mar, 11:00 AM', etc.). After the customer selects a slot, confirm the spa appointment with the chosen details and end with a thank you message.",
  },
  {
    id: "beauty-personalized",
    title: "Personalized Skincare Quiz",
    description: "Engage customers with a skincare quiz that recommends products based on their skin type and concerns.",
    industry: "Beauty & Wellness",
    messageType: "marketing",
    tags: ["Quiz", "Personalized", "Recommendations"],
    flowSteps: ["Quiz Invite", "Skin Type Q", "Concern Q", "Product Recommendations"],
    prompt: "Create a WhatsApp marketing flow for a personalized skincare recommendation quiz. Invite the customer to take the quiz with an image. Ask about their skin type with interactive buttons. After they select their skin type, ask about specific concerns with interactive buttons. Then show recommended products in a carousel with prices and 'View Details' buttons. After the customer selects a product, show that product's details tailored to their skin profile with a 'Buy Now' button.",
  },
  // Utility
  {
    id: "beauty-appointment-reminder",
    title: "Salon Appointment Reminder",
    description: "Send salon appointment reminders with service details, stylist info, and reschedule with date/time selection.",
    industry: "Beauty & Wellness",
    messageType: "utility",
    tags: ["Appointment", "Salon", "Reminder"],
    flowSteps: ["Reminder", "Service Details", "Stylist Info", "Confirm/Reschedule", "Reschedule Date/Time Selection", "Confirmed", "Thank You"],
    prompt: "Create a WhatsApp utility flow for salon appointment reminders. Send a reminder with date and time, show the booked service details, share the stylist's profile, and include confirm or reschedule buttons. If the customer chooses to reschedule, present an interactive_list message with available date and time slots (e.g. 'Wed 12 Mar, 10:00 AM', 'Thu 13 Mar, 2:00 PM', 'Fri 14 Mar, 11:30 AM', etc.). After the customer picks a new slot, confirm the rescheduled appointment with the chosen details and end with a thank you message.",
  },
  {
    id: "beauty-aftercare",
    title: "Post-Treatment Aftercare",
    description: "Send post-treatment care instructions with tips and follow-up appointment booking.",
    industry: "Beauty & Wellness",
    messageType: "utility",
    tags: ["Aftercare", "Instructions", "Follow-up"],
    flowSteps: ["Treatment Complete", "Care Instructions", "Follow-up Date/Time Selection", "Appointment Confirmed", "Thank You"],
    prompt: "Create a WhatsApp utility flow for post-treatment aftercare. Thank the customer for their visit and the specific treatment they received. Share personalized care instructions (e.g., 'Avoid direct sunlight for 24 hours', 'Apply the provided ointment twice daily'). Then present an interactive_list message with available follow-up appointment date and time slots (e.g. 'Mon 24 Mar, 10:00 AM', 'Wed 26 Mar, 2:00 PM', 'Fri 28 Mar, 11:00 AM', etc.). After the customer selects a slot, confirm the follow-up appointment with the chosen details and end with a thank you message.",
  },
  // Authentication
  {
    id: "beauty-membership-verify",
    title: "Membership Verification",
    description: "Verify membership for accessing exclusive member pricing and booking priority slots.",
    industry: "Beauty & Wellness",
    messageType: "authentication",
    tags: ["Membership", "Verification", "Exclusive"],
    flowSteps: ["Membership Check", "OTP Sent", "Verified", "Member Access"],
    prompt: "Create a WhatsApp authentication flow for beauty membership verification. When a member wants to access exclusive pricing, send an OTP, verify their identity, and unlock member-only benefits and booking slots.",
  },

  // ═══════════════════════════════════════════
  // ENTERTAINMENT
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "entertainment-event-promo",
    title: "Event Ticket Promotion",
    description: "Promote upcoming events with artist lineups, ticket tiers, and event date/session booking.",
    industry: "Entertainment",
    messageType: "marketing",
    tags: ["Events", "Tickets", "Early Access"],
    flowSteps: ["Event Announcement", "Artist Lineup", "Ticket Tiers", "Event Date/Time Selection", "Booking Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for an entertainment company promoting a music festival. Announce the event with a poster image, show the artist lineup, present ticket tiers in a carousel with pricing (General, VIP, Premium) and 'Select Tier' buttons. Then present an interactive_list message with available event dates and sessions (e.g. 'Sat 15 Mar, Gates Open 4:00 PM', 'Sun 16 Mar, Gates Open 2:00 PM', etc.). After the customer selects a date/session, confirm the ticket booking with the chosen details and end with a thank you message.",
  },
  {
    id: "entertainment-streaming",
    title: "New Release Notification",
    description: "Notify subscribers about new movie/show releases with trailers, cast info, and watch-now links.",
    industry: "Entertainment",
    messageType: "marketing",
    tags: ["New Release", "Streaming", "Watch Now"],
    flowSteps: ["Release Alert", "Trailer Link", "Cast Info", "Watch Now"],
    prompt: "Create a WhatsApp marketing flow for a streaming platform announcing a new release. Send a release alert with a poster image. Show a carousel of related content (the new release plus similar titles) with 'Watch Trailer' and 'Add to List' buttons. After the customer selects an option, show the cast information and synopsis for that title. Then include a 'Watch Now' button and confirm their watchlist addition.",
  },
  {
    id: "entertainment-membership",
    title: "Premium Membership Offer",
    description: "Promote premium streaming or entertainment membership with exclusive content and ad-free experience.",
    industry: "Entertainment",
    messageType: "marketing",
    tags: ["Premium", "Membership", "Exclusive Content"],
    flowSteps: ["Membership Offer", "Benefits", "Content Preview", "Subscribe Now"],
    prompt: "Create a WhatsApp marketing flow for a premium entertainment membership. Introduce the premium tier with an image. Preview upcoming exclusive content in a carousel with 'Learn More' buttons. After the customer selects content to learn more about, show that content's details and exclusive benefits of the premium tier. Then include a 'Subscribe Now' button with a free trial offer and confirm the subscription.",
  },
  // Utility
  {
    id: "entertainment-ticket-confirm",
    title: "Event Ticket Confirmation",
    description: "Confirm event ticket purchase with e-ticket, venue details, and event day instructions.",
    industry: "Entertainment",
    messageType: "utility",
    tags: ["Ticket", "Confirmation", "E-ticket"],
    flowSteps: ["Ticket Confirmed", "E-ticket", "Venue Details", "Event Day Info"],
    prompt: "Create a WhatsApp utility flow for event ticket confirmation. Confirm the purchase with ticket details, provide an e-ticket with QR code mention, share venue details with directions, and send event day instructions.",
  },
  {
    id: "entertainment-schedule",
    title: "Show Schedule Update",
    description: "Send show or event schedule updates with time changes, seat assignments, and venue maps.",
    industry: "Entertainment",
    messageType: "utility",
    tags: ["Schedule", "Update", "Venue Map"],
    flowSteps: ["Schedule Update", "New Timing", "Seat Info", "Venue Map"],
    prompt: "Create a WhatsApp utility flow for show schedule updates. Notify about a schedule change, provide the new date and time, confirm seat assignments, and share a venue map with entry gate information.",
  },
  // Authentication
  {
    id: "entertainment-account-verify",
    title: "Streaming Account Verification",
    description: "Verify streaming account access when logging in from a new device or location.",
    industry: "Entertainment",
    messageType: "authentication",
    tags: ["Account", "New Device", "Verification"],
    flowSteps: ["New Device Alert", "OTP Sent", "Verified", "Device Trusted"],
    prompt: "Create a WhatsApp authentication flow for streaming account verification. Alert about a login from a new device, send an OTP, verify the user's identity, and offer to trust the new device for future logins.",
  },

  // ═══════════════════════════════════════════
  // LOGISTICS
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "logistics-business-solutions",
    title: "Business Shipping Solutions",
    description: "Promote business shipping solutions with volume discounts, service tiers, and account setup.",
    industry: "Logistics",
    messageType: "marketing",
    tags: ["Business", "Shipping", "Volume Discount"],
    flowSteps: ["Solution Intro", "Service Tiers", "Volume Pricing", "Get Started"],
    prompt: "Create a WhatsApp marketing flow for a logistics company promoting business shipping solutions. Introduce the business program with an image. Show service tiers in a carousel (Express, Standard, Economy) with 'View Details' buttons. After the customer selects a tier from the carousel, show that tier's detailed features, delivery times, and volume discount pricing. Then include a 'Get Started' button and confirm the account setup.",
  },
  {
    id: "logistics-warehouse",
    title: "Warehouse & Fulfillment Promo",
    description: "Promote warehousing and fulfillment services with facility tours, pricing plans, and tour appointment booking.",
    industry: "Logistics",
    messageType: "marketing",
    tags: ["Warehouse", "Fulfillment", "Facility Tour"],
    flowSteps: ["Service Intro", "Facility Showcase", "Pricing Plans", "Tour Date/Time Selection", "Tour Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for a logistics company promoting warehouse and fulfillment services. Introduce the service with a warehouse image, show facility features, present pricing plans in a carousel with 'View Plan' buttons. Then present an interactive_list message with available facility tour date and time slots (e.g. 'Tue 11 Mar, 10:00 AM', 'Thu 13 Mar, 2:00 PM', 'Fri 14 Mar, 11:00 AM', etc.). After the customer selects a slot, confirm the tour appointment with the chosen details and end with a thank you message.",
  },
  // Utility
  {
    id: "logistics-shipment-tracking",
    title: "Shipment Tracking Updates",
    description: "Send real-time shipment tracking updates with location milestones and estimated delivery time.",
    industry: "Logistics",
    messageType: "utility",
    tags: ["Shipment", "Tracking", "Delivery ETA"],
    flowSteps: ["Shipment Created", "In Transit", "Out for Delivery", "Delivered"],
    prompt: "Create a WhatsApp utility flow for shipment tracking. Confirm shipment creation with tracking number, send in-transit updates with location milestones, notify when out for delivery with ETA, and confirm delivery with proof of delivery option.",
  },
  {
    id: "logistics-customs",
    title: "Customs Clearance Update",
    description: "Notify about customs clearance status with required documents and action items.",
    industry: "Logistics",
    messageType: "utility",
    tags: ["Customs", "Clearance", "Documents"],
    flowSteps: ["Customs Hold", "Required Docs", "Documents Submitted", "Cleared"],
    prompt: "Create a WhatsApp utility flow for customs clearance updates. Notify about a customs hold, list required documents, confirm document submission, and notify when the shipment is cleared for delivery.",
  },
  // Marketing
  {
    id: "logistics-last-mile",
    title: "Last-Mile Delivery Solutions",
    description: "Promote last-mile delivery solutions for businesses with speed tiers, coverage areas, and partnership signup.",
    industry: "Logistics",
    messageType: "marketing",
    tags: ["Last-Mile", "Delivery", "Partnership"],
    flowSteps: ["Solution Intro", "Speed Tiers", "Coverage Map", "Partner Signup"],
    prompt: "Create a WhatsApp marketing flow for a logistics company promoting last-mile delivery solutions. Introduce the service with an image. Show speed tiers in a carousel with 'Learn More' buttons. After the customer selects a tier, show that tier's detailed coverage areas, pricing, and SLA guarantees. Then include a 'Partner With Us' button and confirm the partnership application.",
  },
  // Authentication
  {
    id: "logistics-pickup-verify",
    title: "Pickup Authorization",
    description: "Verify identity for package pickup at collection points with OTP and package details.",
    industry: "Logistics",
    messageType: "authentication",
    tags: ["Pickup", "Authorization", "OTP"],
    flowSteps: ["Pickup Request", "OTP Sent", "Verified", "Package Released"],
    prompt: "Create a WhatsApp authentication flow for package pickup authorization. When someone arrives to collect a package, send an OTP to the recipient, verify their identity, and authorize the package release.",
  },

  // ═══════════════════════════════════════════
  // INSURANCE
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "insurance-health-plan",
    title: "Health Insurance Plan Promotion",
    description: "Promote health insurance plans with coverage comparison, premium calculator, and instant enrollment.",
    industry: "Insurance",
    messageType: "marketing",
    tags: ["Health Insurance", "Coverage", "Enrollment"],
    flowSteps: ["Plan Intro", "Coverage Carousel", "Premium Calculator", "Enroll Now"],
    prompt: "Create a WhatsApp marketing flow for a health insurance plan promotion. Introduce the plans with an image. Show a carousel of plan options with coverage details, pricing, and 'View Details' buttons. After the customer selects a plan from the carousel, show that plan's detailed coverage breakdown, deductibles, and co-pay information. Then offer a premium calculator with interactive buttons and include an 'Enroll Now' button to confirm enrollment.",
  },
  {
    id: "insurance-life-policy",
    title: "Life Insurance Awareness",
    description: "Educate customers about life insurance benefits with plan options, coverage calculator, and advisor appointment booking.",
    industry: "Insurance",
    messageType: "marketing",
    tags: ["Life Insurance", "Education", "Advisor"],
    flowSteps: ["Awareness Message", "Plan Options", "Coverage Calculator", "Advisor Date/Time Selection", "Consultation Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for life insurance awareness. Send an educational message about the importance of life insurance, show plan options in a carousel with coverage amounts and 'View Plan' buttons, offer a coverage calculator. Then present an interactive_list message with available advisor consultation date and time slots (e.g. 'Mon 10 Mar, 10:00 AM', 'Wed 12 Mar, 2:00 PM', 'Fri 14 Mar, 4:00 PM', etc.). After the customer selects a slot, confirm the consultation appointment with the chosen details and end with a thank you message.",
  },
  {
    id: "insurance-bundle",
    title: "Insurance Bundle Discount",
    description: "Promote insurance bundle deals combining auto, home, and life insurance with savings highlights.",
    industry: "Insurance",
    messageType: "marketing",
    tags: ["Bundle", "Discount", "Multi-policy"],
    flowSteps: ["Bundle Offer", "Savings Breakdown", "Coverage Details", "Get Quote"],
    prompt: "Create a WhatsApp marketing flow for an insurance bundle discount. Announce the bundle deal with an image. Present coverage details for each policy type in a carousel with 'View Details' buttons. After the customer selects a policy type from the carousel, show that policy's detailed coverage, savings breakdown, and bundle discount. Then include a 'Get Quote' button and confirm the quote request.",
  },
  // Utility
  {
    id: "insurance-claim-status",
    title: "Claim Status Updates",
    description: "Send insurance claim status updates with processing milestones and required actions.",
    industry: "Insurance",
    messageType: "utility",
    tags: ["Claim", "Status", "Processing"],
    flowSteps: ["Claim Filed", "Under Review", "Additional Info", "Claim Settled"],
    prompt: "Create a WhatsApp utility flow for insurance claim status updates. Confirm claim filing with reference number, update on review progress, request additional information if needed, and notify when the claim is settled with payout details.",
  },
  {
    id: "insurance-renewal",
    title: "Policy Renewal Reminder",
    description: "Remind customers about upcoming policy renewal with coverage summary and renewal options.",
    industry: "Insurance",
    messageType: "utility",
    tags: ["Renewal", "Policy", "Coverage Summary"],
    flowSteps: ["Renewal Reminder", "Coverage Summary", "Renewal Options", "Renewed"],
    prompt: "Create a WhatsApp utility flow for insurance policy renewal. Send a renewal reminder with the expiry date, show current coverage summary, present renewal options with pricing, and confirm the renewal.",
  },
  // Authentication
  {
    id: "insurance-claim-verify",
    title: "Claim Submission Verification",
    description: "Verify policyholder identity before processing insurance claims to prevent fraud.",
    industry: "Insurance",
    messageType: "authentication",
    tags: ["Claim", "Verification", "Anti-fraud"],
    flowSteps: ["Claim Request", "Identity Verification", "OTP Sent", "Claim Authorized"],
    prompt: "Create a WhatsApp authentication flow for insurance claim verification. When a claim is submitted, verify the policyholder's identity with an OTP, confirm their policy details, and authorize the claim for processing.",
  },

  // ═══════════════════════════════════════════
  // TELECOMMUNICATIONS
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "telco-plan-upgrade",
    title: "Plan Upgrade Promotion",
    description: "Promote mobile plan upgrades with data comparison, speed benefits, and instant upgrade capability.",
    industry: "Telecommunications",
    messageType: "marketing",
    tags: ["Plan Upgrade", "Data", "Speed"],
    flowSteps: ["Upgrade Offer", "Plan Comparison", "Speed Benefits", "Upgrade Now"],
    prompt: "Create a WhatsApp marketing flow for a telco promoting plan upgrades. Offer an upgrade with an image. Show a carousel comparing plan options with data, speed, and pricing with 'View Details' buttons. After the customer selects a plan from the carousel, show that plan's detailed benefits, speed comparison, and savings. Then include an 'Upgrade Now' button and confirm the plan upgrade.",
  },
  {
    id: "telco-device-offer",
    title: "New Device Bundle Offer",
    description: "Promote new device bundles with phone showcase, installment plans, and trade-in options.",
    industry: "Telecommunications",
    messageType: "marketing",
    tags: ["Device", "Bundle", "Installment"],
    flowSteps: ["Device Showcase", "Bundle Options", "Installment Plans", "Order Now"],
    prompt: "Create a WhatsApp marketing flow for a telco promoting new device bundles. Showcase the latest phones in a carousel with images, prices, and 'View Details' buttons. After the customer selects a phone from the carousel, show that device's detailed specs, bundle options with data plans, and installment payment options. Then include an 'Order Now' button and confirm the order.",
  },
  {
    id: "telco-family-plan",
    title: "Family Plan Promotion",
    description: "Promote family plans with shared data, multi-line discounts, and family member management.",
    industry: "Telecommunications",
    messageType: "marketing",
    tags: ["Family Plan", "Shared Data", "Multi-line"],
    flowSteps: ["Family Offer", "Plan Details", "Savings Calculator", "Add Lines"],
    prompt: "Create a WhatsApp marketing flow for a family mobile plan. Introduce the family plan with an image. Show plan options in a carousel with different line counts and pricing with 'View Details' buttons. After the customer selects a plan from the carousel, show that plan's detailed shared data benefits and savings compared to individual plans. Then include an 'Add Family Lines' button and confirm the plan activation.",
  },
  // Utility
  {
    id: "telco-data-usage",
    title: "Data Usage Alert",
    description: "Alert customers about data usage thresholds with usage breakdown and top-up options.",
    industry: "Telecommunications",
    messageType: "utility",
    tags: ["Data Usage", "Alert", "Top-up"],
    flowSteps: ["Usage Alert", "Usage Breakdown", "Top-up Options", "Confirmed"],
    prompt: "Create a WhatsApp utility flow for data usage alerts. Alert the customer about reaching 80% data usage, show a usage breakdown by category, present top-up options with pricing, and confirm the top-up.",
  },
  {
    id: "telco-bill-ready",
    title: "Monthly Bill Notification",
    description: "Send monthly bill notifications with amount details, usage summary, and payment options.",
    industry: "Telecommunications",
    messageType: "utility",
    tags: ["Bill", "Payment", "Usage Summary"],
    flowSteps: ["Bill Ready", "Amount Details", "Usage Summary", "Pay Now"],
    prompt: "Create a WhatsApp utility flow for monthly bill notification. Notify the customer their bill is ready, show the amount and due date, provide a usage summary, and include payment options with a pay-now button.",
  },
  // Authentication
  {
    id: "telco-sim-swap",
    title: "SIM Swap Verification",
    description: "Verify customer identity for SIM swap requests to prevent unauthorized number porting.",
    industry: "Telecommunications",
    messageType: "authentication",
    tags: ["SIM Swap", "Verification", "Security"],
    flowSteps: ["Swap Request", "Identity Check", "OTP Verification", "Swap Confirmed"],
    prompt: "Create a WhatsApp authentication flow for SIM swap verification. Alert about a SIM swap request, verify the customer's identity with security questions, send an OTP, and confirm the SIM swap upon successful verification.",
  },
  // ==================== ADDITIONAL HIGH-VALUE TEMPLATES ====================
  // Cross-sell & Upsell (E-Commerce)
  {
    id: "ecom-cross-sell",
    title: "Cross-Sell Recommendation",
    description: "Recommend complementary products based on recent purchase with personalized carousel and quick-buy buttons.",
    industry: "E-Commerce",
    messageType: "marketing",
    tags: ["Cross-sell", "Recommendations", "Personalized"],
    flowSteps: ["Purchase Thank You", "Recommended Products Carousel", "Quick Buy Selection", "Order Confirmed"],
    prompt: "Create a WhatsApp marketing flow for cross-selling. Thank the customer for their recent purchase, show a carousel of 3 complementary products with prices and 'Add to Cart' buttons, let the customer select one, and confirm the add-on order.",
  },
  // Telemedicine Booking (Healthcare)
  {
    id: "health-telemedicine",
    title: "Telemedicine Consultation Booking",
    description: "Book a virtual consultation with service selection, date/time slot picker, and video call link delivery.",
    industry: "Healthcare",
    messageType: "utility",
    tags: ["Telemedicine", "Video Call", "Booking"],
    flowSteps: ["Service Selection", "Date/Time Selection", "Booking Confirmed", "Video Link Sent", "Thank You"],
    prompt: "Create a WhatsApp utility flow for telemedicine booking. Present a list of available consultation types with fees (e.g., 'Initial Consultation - $45', 'Follow-up Visit - $30', 'Second Opinion - $60', 'Specialist Referral - $55'). After the customer selects a consultation type, present an interactive_list message with available date and time slots (e.g. 'Mon 10 Mar, 9:00 AM', 'Tue 11 Mar, 2:00 PM', 'Wed 12 Mar, 10:30 AM', etc.). After the customer picks a slot, confirm the booking with the chosen details, send the video consultation link, and end with a thank you message.",
  },
  // Loyalty Program (Food & Beverage)
  {
    id: "fnb-private-dining",
    title: "Private Dining Experience",
    description: "Promote exclusive private dining events with chef's table options, wine pairing menus, and group booking for special occasions.",
    industry: "Food & Beverage",
    messageType: "marketing",
    tags: ["Private Dining", "Chef's Table", "Wine Pairing", "Events"],
    flowSteps: ["Event Announcement", "Experience Options Carousel", "Select Experience", "Guest Count & Date", "Booking Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a private dining experience. Start with an announcement about exclusive dining events with an elegant image. Show a carousel of 3 experiences with pricing and 'Book Now' buttons (e.g., 'Chef's Table - $150/person - 6-course tasting menu', 'Wine Pairing Dinner - $120/person - 5 courses with sommelier', 'Private Room Party - $80/person - customizable menu for 10-20 guests'). After the customer selects an experience from the carousel, ask for guest count and preferred date with interactive buttons. Confirm the booking with all details and a deposit payment link.",
  },
  // Investment Alert (Finance & Banking)
  {
    id: "finance-investment-alert",
    title: "Investment Opportunity Alert",
    description: "Alert customers about new investment opportunities with risk profiles, returns comparison, and one-tap invest buttons.",
    industry: "Finance & Banking",
    messageType: "marketing",
    tags: ["Investment", "Portfolio", "Returns"],
    flowSteps: ["Market Alert", "Investment Options Carousel", "Risk Profile Selection", "Investment Confirmed"],
    prompt: "Create a WhatsApp marketing flow for investment alerts. Alert about a new investment opportunity, show a carousel of 3 investment options with risk levels and projected returns with 'Invest Now' buttons, let the customer select their preferred option, and confirm the investment.",
  },
  // Trip Itinerary (Travel & Hospitality)
  {
    id: "travel-itinerary-builder",
    title: "Trip Itinerary Builder",
    description: "Help travelers build a custom itinerary with activity selection, date/time booking, and confirmation.",
    industry: "Travel & Hospitality",
    messageType: "marketing",
    tags: ["Itinerary", "Activities", "Planning"],
    flowSteps: ["Destination Welcome", "Activity Carousel", "Activity Date/Time Selection", "Itinerary Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for trip itinerary building. Welcome the traveler to their destination, show a carousel of 3 popular activities with prices and 'Add to Itinerary' buttons. After the customer selects activities, present an interactive_list message with available date and time slots for the selected activities (e.g. 'Mon 17 Mar, 9:00 AM - Snorkeling', 'Tue 18 Mar, 2:00 PM - City Tour', 'Wed 19 Mar, 10:00 AM - Cooking Class', etc.). After the customer picks their preferred schedule, confirm the itinerary with the chosen details and end with a thank you message.",
  },
  // Live Class Reminder (Education)
  {
    id: "edu-live-class",
    title: "Live Class Reminder & Join",
    description: "Remind students about upcoming live classes with topic preview, materials download, and one-tap join button.",
    industry: "Education",
    messageType: "utility",
    tags: ["Live Class", "Reminder", "Join"],
    flowSteps: ["Class Reminder", "Topic Preview", "Materials Ready", "Join Now"],
    prompt: "Create a WhatsApp utility flow for live class reminders. Remind the student about an upcoming class with the topic and instructor, offer to download class materials with a button, and provide a 'Join Class Now' button that opens the video session.",
  },
  // Virtual Tour (Real Estate)
  {
    id: "realestate-virtual-tour",
    title: "Virtual Property Tour",
    description: "Invite prospects to virtual property tours with property carousel, tour date/time booking, and follow-up.",
    industry: "Real Estate",
    messageType: "marketing",
    tags: ["Virtual Tour", "Property", "Scheduling"],
    flowSteps: ["Tour Invitation", "Property Carousel", "Tour Date/Time Selection", "Tour Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for virtual property tours. Invite the prospect to explore new listings, show a carousel of 3 properties with images, prices, and 'View Tour' buttons. After the customer selects a property, present an interactive_list message with available virtual tour date and time slots (e.g. 'Sat 15 Mar, 10:00 AM', 'Sun 16 Mar, 2:00 PM', 'Tue 18 Mar, 6:00 PM', etc.). After the customer picks a slot, confirm the tour appointment, send the virtual tour link, and end with a thank you message.",
  },
  // Trade-In Valuation (Automotive)
  {
    id: "auto-trade-in-v2",
    title: "Trade-In Valuation",
    description: "Guide car owners through a trade-in valuation process with vehicle details, instant estimate, and dealership visit booking.",
    industry: "Automotive",
    messageType: "utility",
    tags: ["Trade-In", "Valuation", "Dealership"],
    flowSteps: ["Trade-In Offer", "Vehicle Details", "Instant Estimate", "Visit Date/Time Selection", "Visit Confirmed", "Thank You"],
    prompt: "Create a WhatsApp utility flow for car trade-in valuation. Offer a free trade-in valuation, collect vehicle details via interactive list (make, model, year), provide an instant estimated value with buttons to accept or negotiate. Then present an interactive_list message with available dealership visit date and time slots (e.g. 'Sat 15 Mar, 10:00 AM', 'Sat 15 Mar, 3:00 PM', 'Sun 16 Mar, 11:00 AM', etc.). After the customer selects a slot, confirm the dealership visit with the chosen details and end with a thank you message.",
  },
  // Personal Shopper (Retail)
  {
    id: "retail-personal-shopper",
    title: "Personal Shopper Assistant",
    description: "Provide a personal shopping experience with style quiz, curated picks carousel, and one-tap purchase.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Personal Shopper", "Style", "Curated"],
    flowSteps: ["Style Quiz", "Curated Picks Carousel", "Selection Made", "Purchase Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a personal shopper assistant. Start with a style preference quiz using interactive buttons (casual/formal/sporty), show a carousel of 3 curated outfit picks with prices and 'Buy Now' buttons, let the customer select their favorite, and confirm the purchase.",
  },
  // Product Launch Waitlist (Technology)
  {
    id: "tech-product-waitlist",
    title: "Product Launch Waitlist",
    description: "Build excitement for a product launch with feature preview, waitlist signup, and early access notification.",
    industry: "Technology",
    messageType: "marketing",
    tags: ["Product Launch", "Waitlist", "Early Access"],
    flowSteps: ["Launch Teaser", "Feature Preview Carousel", "Waitlist Signup", "Early Access Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a product launch waitlist. Tease the upcoming product launch with an image. Show a carousel of 3 key features with images and 'Learn More' buttons. After the customer selects a feature to learn more about, show that feature's detailed description and how it compares to competitors. Then invite the user to join the waitlist with interactive buttons and confirm their early access spot.",
  },
  // Spa Package (Beauty & Wellness)
  {
    id: "beauty-spa-package",
    title: "Spa Package Builder",
    description: "Let customers build a custom spa package by selecting treatments from a carousel with pricing and date/time booking.",
    industry: "Beauty & Wellness",
    messageType: "marketing",
    tags: ["Spa", "Package", "Treatments"],
    flowSteps: ["Welcome Offer", "Treatment Carousel", "Date/Time Selection", "Package Confirmed", "Thank You"],
    prompt: "Create a WhatsApp marketing flow for building a spa package. Present a special offer, show a carousel of 3 spa treatments (massage, facial, body wrap) with prices and 'Add to Package' buttons. After the customer selects treatments, present an interactive_list message with available appointment date and time slots (e.g. 'Sat 15 Mar, 10:00 AM', 'Sat 15 Mar, 2:00 PM', 'Sun 16 Mar, 11:00 AM', etc.). After the customer picks a slot, confirm the spa package booking with the chosen details and end with a thank you message.",
  },
  // Event VIP Upgrade (Entertainment)
  {
    id: "entertainment-vip-upgrade",
    title: "VIP Experience Upgrade",
    description: "Offer ticket holders a VIP upgrade with exclusive perks carousel, upgrade options, and instant confirmation.",
    industry: "Entertainment",
    messageType: "marketing",
    tags: ["VIP", "Upgrade", "Exclusive"],
    flowSteps: ["Upgrade Offer", "VIP Perks Carousel", "Upgrade Selection", "VIP Confirmed"],
    prompt: "Create a WhatsApp marketing flow for VIP experience upgrades. Offer the ticket holder an exclusive VIP upgrade, show a carousel of 3 VIP tiers (Silver, Gold, Platinum) with perks and prices and 'Upgrade' buttons, let them select their preferred tier, and confirm the VIP upgrade with a digital pass.",
  },
  // Delivery Rescheduling (Logistics)
  {
    id: "logistics-reschedule",
    title: "Delivery Rescheduling",
    description: "Allow customers to reschedule missed deliveries with date/time selection and address confirmation.",
    industry: "Logistics",
    messageType: "utility",
    tags: ["Reschedule", "Delivery", "Time Slots"],
    flowSteps: ["Missed Delivery Alert", "Reschedule Date/Time Selection", "Address Confirmation", "Delivery Confirmed", "Thank You"],
    prompt: "Create a WhatsApp utility flow for delivery rescheduling. Alert about a missed delivery attempt, then present an interactive_list message with available reschedule date and time slots (e.g. 'Mon 10 Mar, 9:00 AM - 12:00 PM', 'Tue 11 Mar, 2:00 PM - 5:00 PM', 'Wed 12 Mar, 9:00 AM - 12:00 PM', etc.). After the customer selects a new date/time, confirm their delivery address with buttons, confirm the new delivery schedule with the chosen details, and end with a thank you message.",
  },
  // Claim Fast-Track (Insurance)
  {
    id: "insurance-fast-track",
    title: "Claim Fast-Track Process",
    description: "Guide policyholders through a fast-track claims process with damage assessment, document upload, and instant approval.",
    industry: "Insurance",
    messageType: "utility",
    tags: ["Fast-Track", "Claims", "Instant Approval"],
    flowSteps: ["Claim Initiated", "Damage Assessment", "Document Upload", "Instant Approval"],
    prompt: "Create a WhatsApp utility flow for fast-track insurance claims. Acknowledge the claim, guide through damage assessment with interactive buttons for severity level, request document upload with a button, and provide instant approval with the payout amount and timeline.",
  },
  // Plan Upgrade (Telecommunications)
  {
    id: "telco-device-trade-in",
    title: "Device Trade-In Program",
    description: "Promote device trade-in program with instant valuation, trade-in steps, and new device upgrade options.",
    industry: "Telecommunications",
    messageType: "marketing",
    tags: ["Trade-In", "Device Upgrade", "Valuation"],
    flowSteps: ["Trade-In Offer", "Device Valuation", "New Device Carousel", "Select Device", "Trade-In Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a device trade-in program. Start with a promotional message about trading in old devices for credit toward new ones. Ask the customer to select their current device model from an interactive list (e.g., 'iPhone 13', 'Samsung Galaxy S22', 'Google Pixel 7'). After selection, show the trade-in value (e.g., '$280 credit'). Present a carousel of 3 new devices they can upgrade to with the trade-in discount applied (e.g., 'iPhone 15 - $999 → $719 with trade-in', 'Samsung S24 - $899 → $619', 'Pixel 8 Pro - $799 → $519'). Each carousel card should have a 'Select This Device' button. After the customer selects a device from the carousel, confirm the trade-in order with shipping instructions for the old device.",
  },

  // ═══════════════════════════════════════════
  // NEW TEMPLATES — EXPANDED COVERAGE
  // ═══════════════════════════════════════════

  // ── E-COMMERCE: New Marketing ──
  {
    id: "ecom-loyalty-rewards",
    title: "Loyalty Rewards Redemption",
    description: "Notify loyalty members of available rewards with points balance, reward catalog carousel, and one-tap redemption.",
    industry: "E-Commerce",
    messageType: "marketing",
    tags: ["Loyalty", "Rewards", "Points", "Redemption"],
    flowSteps: ["Points Balance Alert", "Reward Catalog Carousel", "Customer Selects Reward", "Reward Details", "Redeem Confirmation"],
    prompt: "Create a WhatsApp marketing flow for an e-commerce loyalty rewards program. Start with a personalized message showing the customer's points balance (e.g., '2,450 points'). Show a carousel of 3-4 redeemable rewards with point costs and 'Redeem' buttons (e.g., '$10 Store Credit - 500 pts', 'Free Shipping Pass - 300 pts', 'Exclusive Tote Bag - 1,200 pts'). After the customer selects a reward from the carousel, show that reward's details and confirm redemption with remaining points balance.",
  },
  {
    id: "ecom-referral-program",
    title: "Referral Program Invite",
    description: "Drive word-of-mouth growth with personalized referral links, reward tiers, and sharing options.",
    industry: "E-Commerce",
    messageType: "marketing",
    tags: ["Referral", "Invite", "Rewards", "Sharing"],
    flowSteps: ["Referral Invite", "How It Works", "Share Link", "Referral Tracked"],
    prompt: "Create a WhatsApp marketing flow for an e-commerce referral program. Start with a personalized invite explaining the reward (e.g., 'Give $15, Get $15'). Show how it works in 3 simple steps with an image. Provide a unique referral link with 'Share with Friends' and 'Copy Link' buttons. After the customer shares, confirm the referral is being tracked and show progress toward rewards.",
  },
  {
    id: "ecom-seasonal-campaign",
    title: "Seasonal Sale Campaign",
    description: "Drive seasonal sales with themed promotions, category-based deals, and countdown urgency.",
    industry: "E-Commerce",
    messageType: "marketing",
    tags: ["Seasonal", "Sale", "Categories", "Countdown"],
    flowSteps: ["Sale Announcement", "Category Deals Carousel", "Customer Selects Category", "Top Picks", "Shop Now"],
    prompt: "Create a WhatsApp marketing flow for a seasonal e-commerce sale (e.g., Year-End Sale, Summer Clearance). Start with a hero banner announcing the sale with dates and headline discount. Show a carousel of deal categories with discount percentages and 'Shop Now' buttons (e.g., 'Fashion - Up to 60% Off', 'Electronics - Up to 40% Off', 'Home & Living - Up to 50% Off'). After the customer selects a category from the carousel, show that category's top 3 picks with prices and a 'Buy Now' button. After clicking 'Buy Now', confirm the purchase.",
  },
  // ── E-COMMERCE: New Utility ──
  {
    id: "ecom-price-drop-alert",
    title: "Price Drop Alert",
    description: "Notify customers when wishlisted items drop in price with before/after pricing and quick buy.",
    industry: "E-Commerce",
    messageType: "marketing",
    tags: ["Price Drop", "Wishlist", "Alert", "Quick Buy"],
    flowSteps: ["Price Drop Notification", "Product Details", "Buy Now", "Order Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a price drop alert. Notify the customer that an item on their wishlist has dropped in price — show the product image, original price crossed out, new price, and savings percentage. Include 'Buy Now' and 'View More Deals' buttons. After the customer clicks 'Buy Now', confirm the purchase with order details and estimated delivery.",
  },
  {
    id: "ecom-delivery-reschedule",
    title: "Delivery Rescheduling",
    description: "Let customers reschedule failed or upcoming deliveries with available time slot selection.",
    industry: "E-Commerce",
    messageType: "utility",
    tags: ["Delivery", "Reschedule", "Time Slots"],
    flowSteps: ["Delivery Update", "Reschedule Options", "Date/Time Selection", "Confirmed"],
    prompt: "Create a WhatsApp utility flow for delivery rescheduling. Notify the customer about a delivery attempt or upcoming delivery. Offer to reschedule with 'Reschedule' and 'Keep Current' buttons. If rescheduling, present an interactive_list with available date and time slots (e.g., 'Tomorrow 9AM-12PM', 'Tomorrow 2PM-5PM', 'Wed 10 Mar 9AM-12PM'). After the customer selects a slot, confirm the new delivery schedule.",
  },
  {
    id: "ecom-feedback-review",
    title: "Post-Purchase Feedback",
    description: "Collect product reviews and ratings after delivery with star rating and photo upload prompts.",
    industry: "E-Commerce",
    messageType: "utility",
    tags: ["Feedback", "Review", "Rating", "Post-Purchase"],
    flowSteps: ["Delivery Confirmed", "Rate Experience", "Write Review", "Thank You"],
    prompt: "Create a WhatsApp utility flow for post-purchase feedback collection. Start with a delivery confirmation for a specific order (e.g., order #WA-78432), then ask the customer to rate their experience with quick reply buttons ('⭐ Loved It', '👍 Good', '😐 Okay', '👎 Not Great'). After rating, ask for a brief review. Thank them for their feedback and let them know it helps improve the service.",
  },
  // ── E-COMMERCE: New Authentication ──
  {
    id: "ecom-payment-verify",
    title: "Payment Verification OTP",
    description: "Verify high-value transactions with OTP confirmation including amount, merchant, and security warnings.",
    industry: "E-Commerce",
    messageType: "authentication",
    tags: ["Payment", "OTP", "Transaction", "Security"],
    flowSteps: ["Transaction Alert", "OTP Sent", "Verification", "Payment Confirmed"],
    prompt: "Create a WhatsApp authentication flow for payment verification. Alert the customer about a transaction (amount, merchant name), send a 6-digit OTP with 3-minute expiry, include a fraud warning ('If you didn't make this purchase, call us immediately'), and confirm payment upon verification.",
  },
  {
    id: "ecom-account-recovery",
    title: "Account Recovery",
    description: "Help customers recover their account with identity verification steps and password reset.",
    industry: "E-Commerce",
    messageType: "authentication",
    tags: ["Account Recovery", "Password Reset", "Identity"],
    flowSteps: ["Recovery Request", "Identity Verification", "OTP Sent", "Password Reset Link"],
    prompt: "Create a WhatsApp authentication flow for account recovery. Confirm the recovery request, verify identity with a security question, send a 6-digit OTP, and provide a secure password reset link upon verification. Include security tips about creating a strong password.",
  },

  // ── HEALTHCARE: New Marketing ──
  {
    id: "health-specialist-intro",
    title: "New Specialist Introduction",
    description: "Introduce a new specialist joining the clinic with credentials, specialties, and appointment booking.",
    industry: "Healthcare",
    messageType: "marketing",
    tags: ["Specialist", "Doctor", "Introduction", "Booking"],
    flowSteps: ["Specialist Announcement", "Credentials & Expertise", "Book Consultation", "Date/Time Selection", "Confirmed"],
    prompt: "Create a WhatsApp marketing flow introducing a new specialist at a healthcare facility. Start with an announcement featuring the doctor's photo and name. Show their credentials, years of experience, and areas of expertise. Offer to book a consultation with 'Book Appointment' button. Present an interactive_list with available appointment slots. After the patient selects a slot, confirm the booking with doctor name, specialty, date/time, and preparation instructions.",
  },
  {
    id: "health-preventive-care",
    title: "Preventive Care Campaign",
    description: "Share seasonal health tips with educational content, risk assessment quiz, and screening package offers.",
    industry: "Healthcare",
    messageType: "marketing",
    tags: ["Preventive Care", "Health Tips", "Seasonal", "Quiz"],
    flowSteps: ["Health Tip", "Risk Assessment Quiz", "Results", "Screening Recommendation", "Book Now"],
    prompt: "Create a WhatsApp marketing flow for a preventive care campaign. Start with a seasonal wellness tip with an educational image (e.g., 'National Health Awareness Month'). Include a quick 3-question health risk assessment quiz with button responses. Based on answers, provide a personalized wellness score and recommend a relevant screening package with pricing (e.g., 'Basic Health Screen - $99', 'Comprehensive Panel - $249'). Offer to book with 'Schedule Screening' button and confirm the appointment.",
  },
  {
    id: "health-service-package",
    title: "Medical Service Package Promotion",
    description: "Promote medical service packages with treatment options, before/after showcases, and appointment booking.",
    industry: "Healthcare",
    messageType: "marketing",
    tags: ["Medical", "Treatment", "Package", "Booking"],
    flowSteps: ["Service Promo", "Package Carousel", "Select Package", "Package Details", "Book Appointment"],
    prompt: "Create a WhatsApp marketing flow for medical service packages. Start with a promotional message about a limited-time healthcare offer with an image. Show a carousel of service packages with pricing and 'Learn More' buttons (e.g., 'Basic Checkup - $89', 'Premium Wellness Package - $249', 'Comprehensive Health Screen - $449'). After the patient selects a package from the carousel, show that package's detailed service information, duration, and what's included. Offer appointment booking with date/time selection.",
  },
  // ── HEALTHCARE: New Utility ──
  {
    id: "health-prescription-refill",
    title: "Prescription Refill Reminder",
    description: "Remind patients to refill prescriptions with medication details, refill options, and pharmacy pickup.",
    industry: "Healthcare",
    messageType: "utility",
    tags: ["Prescription", "Refill", "Medication", "Pharmacy"],
    flowSteps: ["Refill Reminder", "Medication Details", "Refill Options", "Pickup/Delivery", "Confirmed"],
    prompt: "Create a WhatsApp utility flow for prescription refill reminders. Notify the patient that their prescription is due for refill with medication name and dosage. Show 'Refill Now' and 'Remind Later' buttons. If refilling, offer pickup or delivery options. Confirm the refill with pharmacy location or delivery ETA.",
  },
  {
    id: "health-post-visit-followup",
    title: "Post-Visit Follow-up",
    description: "Follow up after a clinic visit with care instructions, medication reminders, and satisfaction survey.",
    industry: "Healthcare",
    messageType: "utility",
    tags: ["Follow-up", "Post-Visit", "Care Instructions", "Survey"],
    flowSteps: ["Visit Summary", "Care Instructions", "Medication Reminder", "Satisfaction Survey", "Thank You"],
    prompt: "Create a WhatsApp utility flow for post-visit follow-up. Send a visit summary with doctor's name and diagnosis. Provide care instructions and medication schedule. Ask for a satisfaction rating with quick reply buttons ('Excellent', 'Good', 'Fair', 'Poor'). Thank the patient and offer to book a follow-up if needed.",
  },
  // ── HEALTHCARE: New Authentication ──
  {
    id: "health-prescription-verify",
    title: "Prescription Authorization",
    description: "Verify patient identity before dispensing controlled medications with multi-step verification.",
    industry: "Healthcare",
    messageType: "authentication",
    tags: ["Prescription", "Verification", "Controlled Substance", "Identity"],
    flowSteps: ["Prescription Request", "Identity Verification", "OTP Sent", "Authorized"],
    prompt: "Create a WhatsApp authentication flow for prescription authorization. Confirm the prescription request with medication name (no dosage for privacy), verify patient identity with date of birth confirmation, send a 6-digit OTP, and authorize the prescription pickup upon verification. Include pharmacy hours and location.",
  },
  {
    id: "health-insurance-verify",
    title: "Insurance Eligibility Check",
    description: "Verify insurance coverage before a procedure with policy validation and pre-authorization.",
    industry: "Healthcare",
    messageType: "authentication",
    tags: ["Insurance", "Eligibility", "Pre-Authorization", "Coverage"],
    flowSteps: ["Coverage Check", "Policy Verification", "Eligibility Confirmed", "Pre-Authorization"],
    prompt: "Create a WhatsApp authentication flow for insurance eligibility verification. Request the patient's insurance policy number, verify coverage for the upcoming procedure, confirm eligibility with coverage details (co-pay amount, covered percentage), and provide a pre-authorization reference number.",
  },

  // ── FOOD & BEVERAGE: New Marketing ──
  {
    id: "fnb-happy-hour",
    title: "Happy Hour Promotion",
    description: "Promote happy hour deals with drink specials, food pairings, and table reservation.",
    industry: "Food & Beverage",
    messageType: "marketing",
    tags: ["Happy Hour", "Drinks", "Specials", "Reservation"],
    flowSteps: ["Happy Hour Alert", "Specials Carousel", "Select Item", "Reserve Table", "Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a restaurant happy hour promotion. Start with an eye-catching announcement with timing (e.g., '4-7 PM Daily'). Show a carousel of drink and food specials with prices and 'Order' buttons (e.g., 'Craft Beer Flight - $12', 'Signature Cocktails - 2 for 1', 'Loaded Nachos - $8'). After the customer selects an item from the carousel, show its details and offer to reserve a table. Present an interactive_list with available time slots and confirm the reservation.",
  },
  {
    id: "fnb-brunch-weekend",
    title: "Weekend Brunch Special",
    description: "Promote weekend brunch packages with bottomless drink options, group deals, and reservation booking.",
    industry: "Food & Beverage",
    messageType: "marketing",
    tags: ["Brunch", "Weekend", "Group Deal", "Bottomless"],
    flowSteps: ["Brunch Announcement", "Package Options Carousel", "Select Package", "Party Size & Time", "Reservation Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a weekend brunch special. Start with a vibrant announcement about the weekend brunch with an image of the brunch spread. Show a carousel of 3 brunch packages with pricing and 'Book Now' buttons (e.g., 'Classic Brunch - $35/person - 3 courses + coffee', 'Bottomless Brunch - $55/person - 3 courses + unlimited mimosas', 'Family Brunch - $120 for 4 - kids eat free + dessert bar'). After the customer selects a package from the carousel, ask for party size and preferred time slot via interactive list (e.g., '10:00 AM', '11:30 AM', '1:00 PM'). Confirm the reservation with all details.",
  },
  {
    id: "fnb-catering-promo",
    title: "Catering Services Package",
    description: "Promote catering packages for events with menu options, pricing tiers, and booking.",
    industry: "Food & Beverage",
    messageType: "marketing",
    tags: ["Catering", "Events", "Packages", "Corporate"],
    flowSteps: ["Catering Intro", "Package Carousel", "Select Package", "Customization", "Quote Confirmed"],
    prompt: "Create a WhatsApp marketing flow for catering services. Start with a promotional message about catering for events with a food spread image. Show a carousel of catering packages with pricing and 'Get Quote' buttons (e.g., 'Silver - $25/person', 'Gold - $45/person', 'Platinum - $75/person'). After the customer selects a package from the carousel, show what's included and ask about event details (guest count, date). Confirm the quote with total pricing.",
  },
  // ── FOOD & BEVERAGE: New Utility ──
  {
    id: "fnb-order-tracking",
    title: "Delivery Order Tracking",
    description: "Track food delivery orders in real-time with preparation status, driver assignment, and ETA.",
    industry: "Food & Beverage",
    messageType: "utility",
    tags: ["Delivery", "Tracking", "ETA", "Order Status"],
    flowSteps: ["Order Confirmed", "Preparing", "Driver Assigned", "On the Way", "Delivered"],
    prompt: "Create a WhatsApp utility flow for food delivery tracking. Start with order confirmation showing items and total. Update when food is being prepared with estimated prep time. Notify when driver is assigned with driver name. Provide live ETA update when on the way. Confirm delivery with a feedback request.",
  },
  {
    id: "fnb-reservation-reminder",
    title: "Reservation Reminder",
    description: "Remind diners about upcoming reservations with details, menu preview, and modification options.",
    industry: "Food & Beverage",
    messageType: "utility",
    tags: ["Reservation", "Reminder", "Menu Preview", "Modify"],
    flowSteps: ["Reservation Reminder", "Details", "Menu Preview", "Confirm/Modify", "Confirmed"],
    prompt: "Create a WhatsApp utility flow for a restaurant reservation reminder. Send a reminder 24 hours before with date, time, party size, and restaurant name. Show a preview of the current menu or specials. Offer 'Confirm', 'Modify', and 'Cancel' buttons. If modifying, present an interactive_list with available alternative time slots. Confirm the updated reservation.",
  },
  {
    id: "fnb-feedback-collection",
    title: "Dining Experience Feedback",
    description: "Collect post-dining feedback with rating and specific questions about food and service quality.",
    industry: "Food & Beverage",
    messageType: "utility",
    tags: ["Feedback", "Rating", "Post-Dining"],
    flowSteps: ["Thank You", "Rate Experience", "Specific Feedback", "Feedback Received"],
    prompt: "Create a WhatsApp utility flow for post-dining feedback. Thank the customer for visiting the restaurant with the specific location and date. Ask them to rate food quality with quick reply buttons ('🌟 Amazing', '👍 Good', '😐 Average', '👎 Poor'). Ask about service quality separately. Thank them for their feedback and let them know it will be shared with the team to improve the dining experience.",
  },
  // ── FOOD & BEVERAGE: New Authentication ──
  {
    id: "fnb-payment-verify",
    title: "Online Order Payment Verification",
    description: "Verify payment for high-value catering or large orders with OTP and order summary.",
    industry: "Food & Beverage",
    messageType: "authentication",
    tags: ["Payment", "Verification", "Order", "OTP"],
    flowSteps: ["Order Summary", "Payment OTP", "Verified", "Order Processing"],
    prompt: "Create a WhatsApp authentication flow for food order payment verification. Show the order summary with total amount, send a 6-digit OTP for payment confirmation with 5-minute expiry, verify the payment, and confirm the order is being processed with estimated preparation time.",
  },
  {
    id: "fnb-loyalty-link",
    title: "Loyalty Card Linking",
    description: "Link a physical loyalty card to the digital account with card number verification.",
    industry: "Food & Beverage",
    messageType: "authentication",
    tags: ["Loyalty", "Card Linking", "Verification", "Account"],
    flowSteps: ["Link Request", "Card Verification", "OTP Sent", "Linked Successfully"],
    prompt: "Create a WhatsApp authentication flow for linking a loyalty card. Ask the customer to enter their loyalty card number, verify it against the system, send a confirmation OTP, and confirm the card is linked with their current points balance displayed.",
  },

  // ── FINANCE & BANKING: New Marketing ──
  {
    id: "finance-savings-campaign",
    title: "Smart Savings Campaign",
    description: "Promote savings accounts with interest rate comparison, savings calculator, and account opening.",
    industry: "Finance & Banking",
    messageType: "marketing",
    tags: ["Savings", "Interest Rate", "Campaign", "Account Opening"],
    flowSteps: ["Campaign Banner", "Savings Options Carousel", "Select Account", "Calculator", "Open Account"],
    prompt: "Create a WhatsApp marketing flow for a savings account campaign. Start with a promotional banner highlighting competitive interest rates. Show a carousel of savings products with rates and 'Learn More' buttons (e.g., 'High-Yield Savings - 4.5% APY', 'Fixed Deposit - 5.2% for 12 months', 'Junior Savings - 3.8% APY'). After the customer selects a product from the carousel, show detailed terms, minimum balance, and a savings projection. Offer to open the account with 'Apply Now' button.",
  },
  {
    id: "finance-wealth-advisory",
    title: "Wealth Management Advisory",
    description: "Offer personalized wealth management with portfolio review, investment options, and advisor booking.",
    industry: "Finance & Banking",
    messageType: "marketing",
    tags: ["Wealth", "Investment", "Advisory", "Portfolio"],
    flowSteps: ["Advisory Invite", "Portfolio Snapshot", "Investment Options", "Book Advisor", "Confirmed"],
    prompt: "Create a WhatsApp marketing flow for wealth management services. Start with a personalized invitation for a portfolio review. Show a brief portfolio performance snapshot. Present investment options carousel with projected returns and 'Explore' buttons (e.g., 'Equity Funds - 12% avg return', 'Bond Portfolio - 6.5% stable', 'Balanced Fund - 9% moderate'). After the customer selects an option from the carousel, show detailed fund information and offer to book a wealth advisor session with date/time selection.",
  },
  // ── FINANCE & BANKING: New Utility ──
  {
    id: "finance-transaction-alert",
    title: "Transaction Alert & Dispute",
    description: "Send real-time transaction alerts with amount, merchant, balance, and one-tap dispute option.",
    industry: "Finance & Banking",
    messageType: "utility",
    tags: ["Transaction", "Alert", "Dispute", "Real-time"],
    flowSteps: ["Transaction Alert", "Details", "Confirm/Dispute", "Dispute Filed"],
    prompt: "Create a WhatsApp utility flow for transaction alerts. Send a real-time notification with transaction amount, merchant name, date/time, and remaining balance. Include 'This was me' and 'Report Fraud' buttons. If disputing, collect brief details and confirm the dispute has been filed with a reference number and expected resolution timeline.",
  },
  {
    id: "finance-emi-reminder",
    title: "EMI Payment Reminder",
    description: "Remind customers about upcoming EMI payments with amount, due date, and quick pay options.",
    industry: "Finance & Banking",
    messageType: "utility",
    tags: ["EMI", "Payment", "Reminder", "Loan"],
    flowSteps: ["EMI Reminder", "Payment Details", "Pay Options", "Payment Confirmed"],
    prompt: "Create a WhatsApp utility flow for EMI payment reminders. Notify the customer about an upcoming EMI with loan type, amount, due date, and remaining tenure. Show 'Pay Now', 'Set Auto-Pay', and 'Reschedule' buttons. If paying now, confirm the payment with transaction reference. Show remaining EMIs and next due date.",
  },
  {
    id: "finance-card-delivery",
    title: "Card Delivery & Activation",
    description: "Track new card delivery status, guide through card activation, and set up contactless payments.",
    industry: "Finance & Banking",
    messageType: "utility",
    tags: ["Card", "Delivery", "Activation", "Contactless"],
    flowSteps: ["Dispatch Notification", "Delivery Tracking", "Card Received", "Activation Steps", "Contactless Setup"],
    prompt: "Create a WhatsApp utility flow for new card delivery and activation. Start with a dispatch notification that the new card has been shipped with tracking number and estimated delivery date. Provide a 'Track Delivery' button that shows the current status (e.g., 'Out for delivery - Expected by 3 PM today'). Once delivered, send a 'Card Received?' confirmation with 'Yes, Activate Now' and 'Not Received' buttons. If activating, guide through the steps: verify last 4 digits, set a PIN via secure link, and confirm activation. Then offer to set up contactless payments with 'Add to Apple Pay', 'Add to Google Pay', and 'Skip for Now' buttons. Confirm the card is active and ready to use.",
  },
  // ── FINANCE & BANKING: New Authentication ──
  {
    id: "finance-beneficiary-verify",
    title: "New Beneficiary Verification",
    description: "Verify identity when adding a new payment beneficiary with multi-factor authentication.",
    industry: "Finance & Banking",
    messageType: "authentication",
    tags: ["Beneficiary", "Verification", "Transfer", "Security"],
    flowSteps: ["Beneficiary Request", "Details Confirmation", "OTP Sent", "Beneficiary Added"],
    prompt: "Create a WhatsApp authentication flow for adding a new beneficiary. Show the beneficiary details (name, bank, account ending) for confirmation. Send a 6-digit OTP with 3-minute expiry. Include a security warning about verifying the recipient. Confirm the beneficiary has been added with a 24-hour cooling period notice.",
  },
  {
    id: "finance-card-activation",
    title: "New Card Activation",
    description: "Activate a new debit or credit card with identity verification and PIN setup.",
    industry: "Finance & Banking",
    messageType: "authentication",
    tags: ["Card Activation", "PIN", "New Card", "Security"],
    flowSteps: ["Activation Request", "Card Verification", "OTP Sent", "Card Activated"],
    prompt: "Create a WhatsApp authentication flow for new card activation. Ask the customer to confirm the last 4 digits of their new card. Send a 6-digit OTP for identity verification. Upon verification, confirm the card is activated with credit limit or daily transaction limit details. Remind about PIN setup at the nearest ATM.",
  },

  // ── TRAVEL & HOSPITALITY: New Marketing ──
  {
    id: "travel-last-minute-deal",
    title: "Last-Minute Travel Deal",
    description: "Promote flash travel deals with countdown urgency, destination highlights, and instant booking.",
    industry: "Travel & Hospitality",
    messageType: "marketing",
    tags: ["Last Minute", "Flash Deal", "Urgency", "Booking"],
    flowSteps: ["Flash Deal Alert", "Destination Carousel", "Select Deal", "Package Details", "Book Now"],
    prompt: "Create a WhatsApp marketing flow for last-minute travel deals. Start with an urgent flash deal announcement with countdown (e.g., 'Ends in 48 hours!'). Show a carousel of 3 destination deals with images, original vs discounted prices, and 'Grab Deal' buttons. After the customer selects a deal from the carousel, show the full package details (flights, hotel, dates, inclusions). Offer instant booking with 'Book Now' and confirm the reservation.",
  },
  {
    id: "travel-cruise-promo",
    title: "Cruise Vacation Package",
    description: "Promote cruise vacation packages with cabin options, itinerary highlights, and onboard experience previews.",
    industry: "Travel & Hospitality",
    messageType: "marketing",
    tags: ["Cruise", "Vacation", "Cabin", "Itinerary"],
    flowSteps: ["Cruise Announcement", "Itinerary Highlights", "Cabin Options Carousel", "Select Cabin", "Booking Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a cruise vacation package. Start with an announcement about a Mediterranean cruise with a stunning ship image and departure date. Show itinerary highlights with port stops (Barcelona, Rome, Santorini, Dubrovnik) with a 'View Full Itinerary' button. After the customer clicks, present a carousel of 3 cabin options with pricing and 'Book Now' buttons (e.g., 'Interior Cabin - $1,299/person - cozy & affordable', 'Ocean View Balcony - $1,899/person - private balcony', 'Suite - $3,499/person - butler service & priority dining'). After the customer selects a cabin from the carousel, confirm the booking with cabin details, departure info, and onboard credit bonus.",
  },
  // ── TRAVEL & HOSPITALITY: New Utility ──
  {
    id: "travel-checkin-reminder",
    title: "Hotel Check-in Reminder",
    description: "Send pre-arrival check-in reminders with online check-in, room preferences, and concierge services.",
    industry: "Travel & Hospitality",
    messageType: "utility",
    tags: ["Check-in", "Pre-Arrival", "Room Preferences", "Concierge"],
    flowSteps: ["Check-in Reminder", "Online Check-in", "Room Preferences", "Concierge Services", "Confirmed"],
    prompt: "Create a WhatsApp utility flow for hotel pre-arrival check-in. Send a reminder 24 hours before with booking details. Offer online check-in with 'Check In Now' button. Ask about room preferences (floor, bed type, pillow type) with quick reply buttons. Show available concierge services (airport transfer, restaurant reservation, spa booking). Confirm check-in with room number and digital key instructions.",
  },
  {
    id: "travel-trip-concierge",
    title: "Trip Concierge Assistant",
    description: "Provide personalized trip assistance with local recommendations, restaurant reservations, and activity bookings.",
    industry: "Travel & Hospitality",
    messageType: "utility",
    tags: ["Concierge", "Recommendations", "Activities", "Local Guide"],
    flowSteps: ["Welcome Message", "Category Selection", "Recommendations Carousel", "Select Activity", "Booking Confirmed"],
    prompt: "Create a WhatsApp utility flow for a hotel trip concierge service. Start with a welcome message addressing the guest by name and mentioning their stay dates. Present an interactive list of concierge services (e.g., 'Restaurant Reservations', 'Local Tours & Activities', 'Spa & Wellness', 'Airport Transfer', 'Special Requests'). After the guest selects 'Local Tours & Activities', show a carousel of 3 curated experiences with pricing and 'Book Now' buttons (e.g., 'Sunset Sailing Tour - $85/person - 3 hours', 'Old Town Walking Tour - $45/person - 2 hours', 'Wine Country Day Trip - $120/person - full day'). After the guest selects an activity from the carousel, confirm the booking with pickup time, meeting point, and what to bring.",
  },
  {
    id: "travel-checkout-feedback",
    title: "Hotel Checkout & Feedback",
    description: "Facilitate express checkout with bill summary and feedback collection.",
    industry: "Travel & Hospitality",
    messageType: "utility",
    tags: ["Checkout", "Feedback", "Express", "Bill"],
    flowSteps: ["Express Checkout", "Bill Summary", "Rate Stay", "Thank You"],
    prompt: "Create a WhatsApp utility flow for hotel express checkout. Present the express checkout option with a detailed bill summary showing room charges, minibar, taxes, and total amount. Include 'Confirm & Check Out' and 'Dispute Charge' buttons. After checkout, ask for a stay rating with quick reply buttons ('⭐ Exceptional', '👍 Great', '😐 Average', '👎 Poor'). Thank the guest for their stay and provide the final receipt.",
  },
  // ── TRAVEL & HOSPITALITY: New Authentication ──
  {
    id: "travel-booking-modify-verify",
    title: "Booking Modification Verification",
    description: "Verify identity before modifying or cancelling a booking with OTP and change summary.",
    industry: "Travel & Hospitality",
    messageType: "authentication",
    tags: ["Booking", "Modification", "Verification", "Cancellation"],
    flowSteps: ["Modification Request", "Booking Details", "OTP Sent", "Change Confirmed"],
    prompt: "Create a WhatsApp authentication flow for booking modification. Show the current booking details (hotel/flight, dates, guest name). Send a 6-digit OTP to verify the account holder's identity. Upon verification, confirm the modification with any price difference and updated cancellation policy.",
  },
  {
    id: "travel-loyalty-login",
    title: "Loyalty Program Login",
    description: "Secure login to travel loyalty account with points balance and tier status verification.",
    industry: "Travel & Hospitality",
    messageType: "authentication",
    tags: ["Loyalty", "Login", "Points", "Tier"],
    flowSteps: ["Login Request", "OTP Sent", "Verified", "Account Summary"],
    prompt: "Create a WhatsApp authentication flow for loyalty program login. Send a 6-digit OTP for secure account access with 5-minute expiry. Upon verification, show the member's points balance, tier status, and upcoming expiring points. Include a security notice about the login.",
  },

  // ── EDUCATION: New Marketing ──
  {
    id: "edu-alumni-success",
    title: "Alumni Success Stories",
    description: "Showcase alumni achievements to attract new enrollments with testimonials and program links.",
    industry: "Education",
    messageType: "marketing",
    tags: ["Alumni", "Success Stories", "Testimonials", "Enrollment"],
    flowSteps: ["Success Story", "Alumni Carousel", "Program Details", "Apply Now"],
    prompt: "Create a WhatsApp marketing flow showcasing alumni success stories. Start with a compelling alumni achievement (name, graduation year, current role at a top company) with their photo. Show a carousel of 3 alumni profiles with career outcomes and 'Read Story' buttons. After the student selects an alumni story from the carousel, show the full story with the program they studied. Link to the program with 'Apply Now' button and confirm the application interest.",
  },
  {
    id: "edu-workshop-series",
    title: "Workshop Series Enrollment",
    description: "Promote a series of workshops with schedule, instructor profiles, and batch enrollment.",
    industry: "Education",
    messageType: "marketing",
    tags: ["Workshop", "Series", "Instructor", "Enrollment"],
    flowSteps: ["Workshop Announcement", "Schedule Carousel", "Select Workshop", "Instructor Profile", "Enroll"],
    prompt: "Create a WhatsApp marketing flow for a workshop series. Start with an announcement about the upcoming workshop series with a theme image. Show a carousel of workshops with dates, topics, and 'View Details' buttons (e.g., 'Data Science Basics - Mar 15', 'Machine Learning - Mar 22', 'AI Applications - Mar 29'). After the student selects a workshop from the carousel, show the instructor profile, syllabus preview, and prerequisites. Offer enrollment with 'Enroll Now' button and confirm registration.",
  },
  {
    id: "edu-bootcamp-promo",
    title: "Coding Bootcamp Promotion",
    description: "Promote intensive bootcamp programs with curriculum preview, career outcomes, and early bird pricing.",
    industry: "Education",
    messageType: "marketing",
    tags: ["Bootcamp", "Coding", "Career", "Early Bird"],
    flowSteps: ["Bootcamp Announcement", "Program Carousel", "Select Program", "Curriculum & Outcomes", "Apply"],
    prompt: "Create a WhatsApp marketing flow for a coding bootcamp. Start with an announcement featuring job placement rates and salary outcomes. Show a carousel of bootcamp tracks with duration, pricing, and 'View Track' buttons (e.g., 'Full-Stack Web Dev - 12 weeks - $4,999', 'Data Science - 10 weeks - $4,499', 'Mobile Development - 8 weeks - $3,999'). After the student selects a track from the carousel, show the detailed curriculum, career outcomes, and financing options. Offer early bird discount with 'Apply Now' button.",
  },
  // ── EDUCATION: New Utility ──
  {
    id: "edu-fee-payment",
    title: "Fee Payment Reminder",
    description: "Remind students about upcoming fee payments with amount, deadline, and payment options.",
    industry: "Education",
    messageType: "utility",
    tags: ["Fee", "Payment", "Reminder", "Deadline"],
    flowSteps: ["Fee Reminder", "Amount Details", "Payment Options", "Payment Confirmed"],
    prompt: "Create a WhatsApp utility flow for fee payment reminders. Notify the student about an upcoming fee with amount, semester, and deadline. Show payment options with 'Pay Now', 'Installment Plan', and 'Contact Finance' buttons. If paying now, confirm the payment with receipt number. If installment, show the plan details with monthly amounts.",
  },
  {
    id: "edu-assignment-deadline",
    title: "Assignment Deadline Reminder",
    description: "Remind students about upcoming assignment deadlines with submission link and extension request.",
    industry: "Education",
    messageType: "utility",
    tags: ["Assignment", "Deadline", "Submission", "Reminder"],
    flowSteps: ["Deadline Reminder", "Assignment Details", "Submit/Request Extension", "Confirmed"],
    prompt: "Create a WhatsApp utility flow for assignment deadline reminders. Notify the student about an upcoming deadline with course name, assignment title, and due date/time. Include 'Submit Now' and 'Request Extension' buttons. If submitting, provide the submission portal link. If requesting extension, ask for reason and confirm the extension request has been sent to the instructor.",
  },
  // ── EDUCATION: New Authentication ──
  {
    id: "edu-exam-verify",
    title: "Online Exam Verification",
    description: "Verify student identity before an online exam with multi-factor authentication.",
    industry: "Education",
    messageType: "authentication",
    tags: ["Exam", "Verification", "Identity", "Proctoring"],
    flowSteps: ["Exam Reminder", "Identity Verification", "OTP Sent", "Exam Access Granted"],
    prompt: "Create a WhatsApp authentication flow for online exam access. Send an exam reminder with subject, date, time, and duration. Verify student identity with student ID confirmation. Send a 6-digit OTP with 5-minute expiry. Upon verification, grant exam access with a secure link and exam rules reminder.",
  },
  {
    id: "edu-certificate-verify",
    title: "Certificate Verification",
    description: "Verify the authenticity of an educational certificate with certificate ID lookup.",
    industry: "Education",
    messageType: "authentication",
    tags: ["Certificate", "Verification", "Authenticity", "Credential"],
    flowSteps: ["Verification Request", "Certificate ID", "Verification Result", "Download Verified Copy"],
    prompt: "Create a WhatsApp authentication flow for certificate verification. Ask for the certificate ID or QR code. Verify against the institution's records. Display the verification result with student name, program, graduation date, and authenticity status. Provide a 'Download Verified Copy' option.",
  },

  // ── REAL ESTATE: New Marketing ──
  {
    id: "realestate-home-staging",
    title: "Home Staging & Renovation Advisory",
    description: "Offer home staging and renovation advisory services to sellers with before/after showcases and consultation booking.",
    industry: "Real Estate",
    messageType: "marketing",
    tags: ["Staging", "Renovation", "Advisory", "Seller"],
    flowSteps: ["Service Introduction", "Before/After Showcase", "Package Options Carousel", "Select Package", "Consultation Booked"],
    prompt: "Create a WhatsApp marketing flow for a real estate home staging and renovation advisory service. Start with a message about maximizing property value before listing, with a before/after image of a staged home. Show a carousel of 3 staging packages with pricing and 'Learn More' buttons (e.g., 'Essential Staging - $2,500 - furniture rental & styling for 3 rooms', 'Premium Staging - $5,000 - full home staging + professional photography', 'Renovation Advisory - $1,500 - expert recommendations to boost sale price by 10-15%'). After the customer selects a package from the carousel, acknowledge their selection (e.g., 'Great choice! Here's what's included in the Premium Staging package...'). Show detailed inclusions and past results (e.g., 'Average 12% higher sale price'). Offer a free consultation booking with available date/time slots via interactive list.",
  },
  {
    id: "realestate-luxury-collection",
    title: "Luxury Property Showcase",
    description: "Showcase premium luxury properties with virtual tours, amenity highlights, and private viewing.",
    industry: "Real Estate",
    messageType: "marketing",
    tags: ["Luxury", "Premium", "Virtual Tour", "Private Viewing"],
    flowSteps: ["Luxury Showcase", "Property Carousel", "Select Property", "Virtual Tour", "Private Viewing"],
    prompt: "Create a WhatsApp marketing flow for luxury real estate. Start with an exclusive invitation to view premium properties with a stunning hero image. Show a carousel of 3 luxury properties with images, locations, and 'Explore' buttons (e.g., 'Seaside Villa - $2.5M', 'Penthouse Suite - $1.8M', 'Heritage Mansion - $3.2M'). After the buyer selects a property from the carousel, show that property's virtual tour link, key amenities (pool, gym, concierge), and floor plan. Offer a private viewing with 'Schedule Visit' button.",
  },
  // ── REAL ESTATE: New Utility ──
  {
    id: "realestate-construction-update",
    title: "Construction Progress Update",
    description: "Update buyers on construction milestones with progress photos, timeline, and payment schedule.",
    industry: "Real Estate",
    messageType: "utility",
    tags: ["Construction", "Progress", "Milestone", "Update"],
    flowSteps: ["Progress Update", "Milestone Photos", "Timeline", "Payment Info", "Questions"],
    prompt: "Create a WhatsApp utility flow for construction progress updates. Send a milestone update with progress percentage and a construction site photo. Show the project timeline with completed and upcoming milestones. Notify about the next payment installment with amount and due date. Offer 'View Full Gallery', 'Payment Schedule', and 'Ask a Question' buttons.",
  },
  {
    id: "realestate-document-checklist",
    title: "Document Submission Checklist",
    description: "Guide buyers through required document submission with checklist tracking and upload reminders.",
    industry: "Real Estate",
    messageType: "utility",
    tags: ["Documents", "Checklist", "Submission", "Compliance"],
    flowSteps: ["Document Checklist", "Status Overview", "Upload Reminder", "Submission Confirmed"],
    prompt: "Create a WhatsApp utility flow for real estate document submission. Show a checklist of required documents with status (submitted/pending). Remind about pending documents with deadlines. Provide upload instructions with 'Upload Now' button. Confirm when all documents are received and the next steps in the purchase process.",
  },
  {
    id: "realestate-tenant-onboarding",
    title: "Tenant Move-In Onboarding",
    description: "Guide new tenants through the move-in process with checklist, key collection, and utility setup instructions.",
    industry: "Real Estate",
    messageType: "utility",
    tags: ["Tenant", "Move-In", "Onboarding", "Checklist"],
    flowSteps: ["Welcome Message", "Move-In Checklist", "Key Collection Scheduling", "Utility Setup Guide", "Onboarding Complete"],
    prompt: "Create a WhatsApp utility flow for tenant move-in onboarding. Start with a welcome message congratulating the tenant on their new home and mentioning the move-in date. Present an interactive list of onboarding steps (e.g., 'Key Collection Appointment', 'Utility Setup Guide', 'Building Rules & Amenities', 'Emergency Contacts', 'Maintenance Request Portal'). After the tenant selects 'Key Collection Appointment', show available time slots via interactive list (e.g., 'Mon 10 Mar, 10:00 AM', 'Mon 10 Mar, 2:00 PM', 'Tue 11 Mar, 11:00 AM'). After selection, confirm the appointment with the property manager's name and office location. End with a checklist summary of completed and pending onboarding steps.",
  },
  // ── REAL ESTATE: New Authentication ──
  {
    id: "realestate-buyer-verify",
    title: "Buyer Identity Verification",
    description: "Verify buyer identity for property transactions with KYC document validation.",
    industry: "Real Estate",
    messageType: "authentication",
    tags: ["KYC", "Identity", "Buyer", "Verification"],
    flowSteps: ["Verification Request", "ID Submission", "OTP Sent", "Identity Verified"],
    prompt: "Create a WhatsApp authentication flow for buyer identity verification. Request identity verification for the property transaction. Ask the buyer to confirm their full name and ID number. Send a 6-digit OTP for verification. Confirm identity is verified with a KYC reference number and next steps in the purchase process.",
  },
  {
    id: "realestate-document-signing",
    title: "Digital Document Signing",
    description: "Authenticate buyers before digital document signing with OTP and document preview.",
    industry: "Real Estate",
    messageType: "authentication",
    tags: ["Document Signing", "Digital", "OTP", "Legal"],
    flowSteps: ["Signing Request", "Document Preview", "OTP Verification", "Signed Confirmation"],
    prompt: "Create a WhatsApp authentication flow for digital document signing. Notify the buyer about a document requiring their signature (e.g., Sale Agreement). Provide a document preview link. Send a 6-digit OTP for identity verification before signing. Confirm the document has been signed with a reference number and copy download link.",
  },

  // ── AUTOMOTIVE: New Marketing ──
  {
    id: "auto-ev-showcase",
    title: "Electric Vehicle Showcase",
    description: "Showcase EV lineup with range comparison, charging info, and test drive booking.",
    industry: "Automotive",
    messageType: "marketing",
    tags: ["EV", "Electric", "Range", "Charging"],
    flowSteps: ["EV Announcement", "Model Carousel", "Select Model", "Specs & Charging", "Test Drive"],
    prompt: "Create a WhatsApp marketing flow for an electric vehicle showcase. Start with an announcement about the EV lineup with a hero image. Show a carousel of 3 EV models with range, starting price, and 'Explore' buttons (e.g., 'EcoSpark - 350km range - $35,999', 'PowerDrive EV - 500km range - $52,999', 'LuxElectric - 600km range - $78,999'). After the customer selects a model from the carousel, show detailed specs, charging time, running cost comparison vs petrol, and available incentives. Offer test drive booking with date/time selection.",
  },
  {
    id: "auto-certified-preowned",
    title: "Certified Pre-Owned Collection",
    description: "Showcase certified pre-owned vehicles with inspection reports, warranty, and financing options.",
    industry: "Automotive",
    messageType: "marketing",
    tags: ["Pre-Owned", "Certified", "Warranty", "Financing"],
    flowSteps: ["CPO Collection", "Vehicle Carousel", "Select Vehicle", "Inspection Report", "Finance Options"],
    prompt: "Create a WhatsApp marketing flow for certified pre-owned vehicles. Start with a promotional message about CPO quality assurance with an image. Show a carousel of 3 vehicles with year, mileage, price, and 'View Details' buttons (e.g., '2023 Sedan - 15K km - $28,999', '2022 SUV - 22K km - $35,999', '2024 Hatchback - 8K km - $22,999'). After the customer selects a vehicle from the carousel, show the 150-point inspection summary, warranty coverage, and financing options with EMI calculator. Offer test drive booking.",
  },
  {
    id: "auto-accessories",
    title: "Accessories & Upgrades Catalog",
    description: "Promote vehicle accessories and upgrade packages with product catalog and installation booking.",
    industry: "Automotive",
    messageType: "marketing",
    tags: ["Accessories", "Upgrades", "Catalog", "Installation"],
    flowSteps: ["Accessories Promo", "Category Carousel", "Select Category", "Products", "Book Installation"],
    prompt: "Create a WhatsApp marketing flow for automotive accessories. Start with a promotional message about enhancing the driving experience. Show a carousel of accessory categories with 'Browse' buttons (e.g., 'Interior Upgrades - From $99', 'Tech & Connectivity - From $199', 'Performance Parts - From $299', 'Exterior Styling - From $149'). After the customer selects a category from the carousel, show top products with prices and 'Add to Cart' buttons. Offer installation booking at the nearest service center.",
  },
  // ── AUTOMOTIVE: New Utility ──
  {
    id: "auto-recall-notice",
    title: "Vehicle Recall Notice",
    description: "Notify owners about safety recalls with affected parts, urgency level, and service scheduling.",
    industry: "Automotive",
    messageType: "utility",
    tags: ["Recall", "Safety", "Notice", "Service"],
    flowSteps: ["Recall Alert", "Details", "Safety Info", "Schedule Service", "Confirmed"],
    prompt: "Create a WhatsApp utility flow for a vehicle recall notice. Send an important safety notice with the recall reason and affected component. Explain the safety implications and that the repair is free. Offer 'Schedule Service' and 'Learn More' buttons. Present an interactive_list with available service appointment slots. Confirm the service appointment with dealership location and estimated repair time.",
  },
  {
    id: "auto-delivery-update",
    title: "New Vehicle Delivery Update",
    description: "Update customers on their new vehicle delivery status with milestones and handover preparation.",
    industry: "Automotive",
    messageType: "utility",
    tags: ["Delivery", "New Vehicle", "Status", "Handover"],
    flowSteps: ["Production Update", "Transit Status", "Delivery Scheduled", "Handover Prep", "Congratulations"],
    prompt: "Create a WhatsApp utility flow for new vehicle delivery updates. Update the customer on production completion with a factory photo. Notify when the vehicle is in transit with estimated arrival. Confirm the delivery date and offer handover time slot selection. Share a checklist of documents to bring for handover. Congratulate on their new vehicle with a welcome message.",
  },
  // ── AUTOMOTIVE: New Authentication ──
  {
    id: "auto-finance-verify",
    title: "Auto Finance Application Verification",
    description: "Verify identity for vehicle financing applications with document validation and credit check consent.",
    industry: "Automotive",
    messageType: "authentication",
    tags: ["Finance", "Application", "Verification", "Credit Check"],
    flowSteps: ["Application Received", "Identity Verification", "OTP Sent", "Application Confirmed"],
    prompt: "Create a WhatsApp authentication flow for auto finance application. Confirm the finance application details (vehicle model, loan amount, tenure). Verify the applicant's identity with an OTP. Upon verification, confirm the application is being processed with expected approval timeline and required documents list.",
  },
  {
    id: "auto-service-login",
    title: "Service Portal Login",
    description: "Secure login to the vehicle service portal with service history and upcoming maintenance.",
    industry: "Automotive",
    messageType: "authentication",
    tags: ["Service Portal", "Login", "History", "Maintenance"],
    flowSteps: ["Login Request", "OTP Sent", "Verified", "Service Summary"],
    prompt: "Create a WhatsApp authentication flow for the vehicle service portal. Send a 6-digit OTP for secure access. Upon verification, show a summary of the vehicle's service history, upcoming maintenance due, and any active recalls. Include a 'Book Service' shortcut.",
  },

  // ── RETAIL: New Marketing ──
  {
    id: "retail-gift-guide",
    title: "Gift Guide & Recommendations",
    description: "Help customers find perfect gifts with personalized recommendations based on recipient and budget.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Gift Guide", "Recommendations", "Personalized", "Seasonal"],
    flowSteps: ["Gift Guide Intro", "Recipient Selection", "Budget Range", "Gift Carousel", "Purchase"],
    prompt: "Create a WhatsApp marketing flow for a retail gift guide. Start with a seasonal gift guide announcement with an image. Ask who the gift is for with quick reply buttons ('Partner', 'Parent', 'Friend', 'Child'). Ask about budget range ('Under $25', '$25-$50', '$50-$100', '$100+'). Show a personalized carousel of 3-4 gift recommendations with prices and 'Buy Now' buttons. After the customer selects a gift from the carousel, show details with gift wrapping option and confirm the purchase.",
  },
  {
    id: "retail-store-opening",
    title: "New Store Grand Opening",
    description: "Announce a new store opening with exclusive launch offers, store tour, and event registration.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Store Opening", "Grand Opening", "Event", "Exclusive"],
    flowSteps: ["Opening Announcement", "Exclusive Offers", "Event Details", "Register", "Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a retail store grand opening. Start with an exciting announcement with store photo and opening date. Show exclusive launch-day offers in a carousel with 'Claim Offer' buttons (e.g., 'First 100 customers get 30% off', 'Free gift bag with $50+ purchase', 'Win a $500 shopping spree'). After the customer selects an offer from the carousel, show that offer's details and how to claim it. Show event details (live music, food, activities). Offer event registration with 'RSVP Now' button and confirm with store directions.",
  },
  // ── RETAIL: New Utility ──
  {
    id: "retail-order-status",
    title: "Online Order Status",
    description: "Track online retail orders from processing to delivery with real-time status updates.",
    industry: "Retail",
    messageType: "utility",
    tags: ["Order", "Status", "Tracking", "Delivery"],
    flowSteps: ["Order Confirmed", "Processing", "Shipped", "Delivered", "Feedback"],
    prompt: "Create a WhatsApp utility flow for retail order status tracking. Start with order confirmation showing items, total, and estimated delivery. Update when order is being packed. Notify when shipped with tracking number and carrier. Confirm delivery with 'Rate Your Purchase' and 'Need Help?' buttons.",
  },
  {
    id: "retail-exchange-process",
    title: "Product Exchange Process",
    description: "Guide customers through product exchanges with size/color selection and store pickup.",
    industry: "Retail",
    messageType: "utility",
    tags: ["Exchange", "Size", "Color", "Store Pickup"],
    flowSteps: ["Exchange Request", "Reason", "New Selection", "Store/Delivery Choice", "Confirmed"],
    prompt: "Create a WhatsApp utility flow for product exchange. Confirm the exchange request with product details. Ask for the reason with quick reply buttons ('Wrong Size', 'Wrong Color', 'Defective', 'Changed Mind'). Show available alternatives for exchange. Offer 'Store Pickup' or 'Home Delivery' for the replacement. Confirm the exchange with timeline.",
  },
  {
    id: "retail-receipt-digital",
    title: "Digital Receipt & Warranty",
    description: "Send digital receipts after purchase with warranty registration and product care tips.",
    industry: "Retail",
    messageType: "utility",
    tags: ["Receipt", "Digital", "Warranty", "Product Care"],
    flowSteps: ["Digital Receipt", "Warranty Registration", "Product Care Tips", "Support"],
    prompt: "Create a WhatsApp utility flow for digital receipt delivery. Send the purchase receipt with item details, price, payment method, and store location. Offer warranty registration with 'Register Warranty' button. Share product care tips relevant to the purchased item. Provide customer support contact for any issues.",
  },
  // ── RETAIL: New Authentication ──
  {
    id: "retail-return-auth",
    title: "Return Authorization",
    description: "Authorize product returns with order verification and return label generation.",
    industry: "Retail",
    messageType: "authentication",
    tags: ["Return", "Authorization", "Verification", "Label"],
    flowSteps: ["Return Request", "Order Verification", "OTP Sent", "Return Authorized"],
    prompt: "Create a WhatsApp authentication flow for return authorization. Verify the order with order number and purchase date. Send a 6-digit OTP for identity confirmation. Upon verification, generate a return authorization number and provide return shipping label or store drop-off instructions with deadline.",
  },
  {
    id: "retail-gift-card-activate",
    title: "Gift Card Activation",
    description: "Activate a new gift card with balance verification and recipient notification.",
    industry: "Retail",
    messageType: "authentication",
    tags: ["Gift Card", "Activation", "Balance", "Recipient"],
    flowSteps: ["Activation Request", "Card Verification", "Activated", "Send to Recipient"],
    prompt: "Create a WhatsApp authentication flow for gift card activation. Ask for the gift card number and PIN. Verify the card and show the balance. Confirm activation and offer to send a notification to the recipient with a personalized message.",
  },

  // ── TECHNOLOGY: New Marketing ──
  {
    id: "tech-feature-announcement",
    title: "Major Feature Announcement",
    description: "Announce a major product feature with before/after comparison, demo video, and upgrade CTA.",
    industry: "Technology",
    messageType: "marketing",
    tags: ["Feature", "Announcement", "Update", "Demo"],
    flowSteps: ["Feature Announcement", "Before/After", "Demo Video", "Try It Now"],
    prompt: "Create a WhatsApp marketing flow for a major feature announcement. Start with an exciting announcement about the new feature with a hero image. Show a before/after comparison of the old vs new experience. Share a demo video link with 'Watch Demo' button. Offer 'Try It Now' and 'Learn More' buttons. After clicking 'Try It Now', provide a direct link to the feature with a quick-start guide.",
  },
  {
    id: "tech-partner-program",
    title: "Partner Program Recruitment",
    description: "Recruit technology partners with program benefits, commission tiers, and application.",
    industry: "Technology",
    messageType: "marketing",
    tags: ["Partner", "Program", "Commission", "Recruitment"],
    flowSteps: ["Program Intro", "Benefits Carousel", "Commission Tiers", "Apply Now", "Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a technology partner program. Start with an invitation to join the partner ecosystem. Show a carousel of partner benefits with 'Learn More' buttons (e.g., 'Revenue Sharing - Up to 30%', 'Technical Support - Dedicated team', 'Marketing Resources - Co-branded materials', 'Early Access - Beta features'). After the partner selects a benefit from the carousel, show that benefit's detailed information and commission tier structure. Offer 'Apply Now' button and confirm the application.",
  },
  // ── TECHNOLOGY: New Utility ──
  {
    id: "tech-onboarding-guide",
    title: "Product Onboarding Guide",
    description: "Guide new users through product setup with step-by-step instructions and progress tracking.",
    industry: "Technology",
    messageType: "utility",
    tags: ["Onboarding", "Setup", "Guide", "Progress"],
    flowSteps: ["Welcome", "Step 1: Profile", "Step 2: Connect", "Step 3: First Action", "Setup Complete"],
    prompt: "Create a WhatsApp utility flow for product onboarding. Welcome the new user and show the 3-step setup process. Guide through Step 1 (complete profile) with 'Done' button. Then Step 2 (connect integrations) with options. Then Step 3 (complete first action). Celebrate setup completion with a progress badge and link to advanced features.",
  },
  {
    id: "tech-usage-report",
    title: "Monthly Usage Report",
    description: "Send monthly usage summaries with key metrics and actionable insights.",
    industry: "Technology",
    messageType: "utility",
    tags: ["Usage", "Report", "Monthly", "Analytics"],
    flowSteps: ["Report Ready", "Key Metrics", "Insights", "View Full Report"],
    prompt: "Create a WhatsApp utility flow for a monthly usage report. Notify the user that their monthly report for a specific period (e.g., 'February 2026') is ready. Show key metrics (active users, API calls, storage used) with month-over-month comparison. Provide 2-3 actionable insights based on usage patterns. Include a 'View Full Report' button that links to the detailed dashboard.",
  },
  {
    id: "tech-maintenance-window",
    title: "Scheduled Maintenance Notice",
    description: "Notify users about scheduled maintenance with timeline, impact, and status updates.",
    industry: "Technology",
    messageType: "utility",
    tags: ["Maintenance", "Downtime", "Notice", "Status"],
    flowSteps: ["Maintenance Notice", "Impact Details", "Timeline", "Maintenance Complete"],
    prompt: "Create a WhatsApp utility flow for scheduled maintenance notification. Notify users about upcoming maintenance with date, time, and expected duration. Explain the impact (which services affected, what will still work). Provide a timeline of the maintenance window. Send a completion notification when maintenance is done with a summary of improvements.",
  },
  // ── TECHNOLOGY: New Authentication ──
  {
    id: "tech-api-key-rotation",
    title: "API Key Rotation",
    description: "Notify developers about API key rotation with new key delivery and migration deadline.",
    industry: "Technology",
    messageType: "authentication",
    tags: ["API Key", "Rotation", "Security", "Developer"],
    flowSteps: ["Rotation Notice", "New Key Delivery", "Migration Guide", "Confirmed"],
    prompt: "Create a WhatsApp authentication flow for API key rotation. Notify the developer about an upcoming key rotation with the deadline. Deliver the new API key securely with a 'Copy Key' button. Provide a migration guide link. Confirm when the old key will be deactivated and remind about updating all integrations.",
  },
  {
    id: "tech-device-authorization",
    title: "New Device Authorization",
    description: "Verify and authorize login from a new or unrecognized device with device details and approval flow.",
    industry: "Technology",
    messageType: "authentication",
    tags: ["Device", "Authorization", "Security", "New Login"],
    flowSteps: ["New Device Alert", "Device Details", "Approve or Deny", "Authorization Confirmed"],
    prompt: "Create a WhatsApp authentication flow for new device authorization. Start with a security alert that a login was attempted from an unrecognized device. Show device details (device type: 'MacBook Pro', browser: 'Chrome 122', location: 'San Francisco, CA', IP: '192.168.x.x', time: 'March 15, 2024 at 3:42 PM PST'). Present 'Yes, This Was Me' and 'No, Block This Device' buttons. If the user clicks 'Yes, This Was Me', confirm the device is now trusted and added to their authorized devices list. If they click 'No, Block This Device', confirm the session is terminated, password reset is recommended, and provide a 'Reset Password Now' button.",
  },

  // ── BEAUTY & WELLNESS: New Marketing ──
  {
    id: "beauty-seasonal-treatment",
    title: "Seasonal Treatment Campaign",
    description: "Promote seasonal beauty treatments with before/after showcases and limited-time packages.",
    industry: "Beauty & Wellness",
    messageType: "marketing",
    tags: ["Seasonal", "Treatment", "Before/After", "Limited Time"],
    flowSteps: ["Seasonal Promo", "Treatment Carousel", "Select Treatment", "Before/After", "Book Now"],
    prompt: "Create a WhatsApp marketing flow for seasonal beauty treatments. Start with a seasonal campaign announcement (e.g., 'Summer Glow Collection'). Show a carousel of treatments with prices and 'View Details' buttons (e.g., 'Hydrating Facial - $89', 'Body Bronzing - $120', 'Hair Repair Treatment - $75'). After the customer selects a treatment from the carousel, show before/after results, treatment duration, and what's included. Offer booking with date/time selection.",
  },
  {
    id: "beauty-referral-reward",
    title: "Refer a Friend Reward",
    description: "Drive referrals with dual rewards for referrer and friend with easy sharing.",
    industry: "Beauty & Wellness",
    messageType: "marketing",
    tags: ["Referral", "Reward", "Friend", "Sharing"],
    flowSteps: ["Referral Invite", "How It Works", "Share Link", "Reward Earned"],
    prompt: "Create a WhatsApp marketing flow for a beauty salon referral program. Start with an invitation explaining the dual reward (e.g., 'You get a free treatment, your friend gets 20% off their first visit'). Show how it works in 3 steps. Provide a unique referral link with 'Share with Friends' button. Confirm when a referral signs up and show the reward earned.",
  },
  // ── BEAUTY & WELLNESS: New Utility ──
  {
    id: "beauty-product-reorder",
    title: "Product Reorder Reminder",
    description: "Remind customers to reorder beauty products based on usage cycle with quick reorder.",
    industry: "Beauty & Wellness",
    messageType: "utility",
    tags: ["Reorder", "Product", "Reminder"],
    flowSteps: ["Reorder Reminder", "Product Details", "Quick Reorder", "Order Confirmed"],
    prompt: "Create a WhatsApp utility flow for beauty product reorder reminders. Remind the customer that their product is likely running low based on their previous purchase (e.g., 'Your Vitamin C Serum purchased 6 weeks ago'). Show the product name and current price. Include 'Reorder Now' and 'Remind Me Later' buttons. If reordering, confirm the order with delivery estimate.",
  },
  {
    id: "beauty-membership-renewal",
    title: "Membership Renewal",
    description: "Remind members about upcoming membership renewal with benefits summary and renewal confirmation.",
    industry: "Beauty & Wellness",
    messageType: "utility",
    tags: ["Membership", "Renewal", "Benefits"],
    flowSteps: ["Renewal Reminder", "Benefits Summary", "Renewal Confirmation"],
    prompt: "Create a WhatsApp utility flow for spa/salon membership renewal. Remind the member about the upcoming expiry date with their membership plan name and number. Show a summary of benefits used this year (number of treatments, total visits). Include 'Renew Same Plan', 'Cancel Membership', and 'Contact Us' buttons. If renewing, confirm with new validity dates and next billing amount.",
  },
  {
    id: "beauty-feedback",
    title: "Treatment Feedback Collection",
    description: "Collect post-treatment feedback with rating and therapist review.",
    industry: "Beauty & Wellness",
    messageType: "utility",
    tags: ["Feedback", "Rating", "Post-Treatment"],
    flowSteps: ["Thank You", "Rate Treatment", "Therapist Review", "Feedback Received"],
    prompt: "Create a WhatsApp utility flow for post-treatment feedback. Thank the customer for their visit with the specific treatment name and date. Ask to rate the experience with quick reply buttons ('🙆 Loved It', '👍 Good', '😐 Okay', '👎 Not Great'). Ask about the therapist specifically. Thank them for their feedback and let them know it helps the team improve.",
  },
  // ── BEAUTY & WELLNESS: New Authentication ──
  {
    id: "beauty-booking-verify",
    title: "Booking Confirmation Verification",
    description: "Verify identity for high-value treatment bookings with deposit confirmation.",
    industry: "Beauty & Wellness",
    messageType: "authentication",
    tags: ["Booking", "Verification", "Deposit", "Identity"],
    flowSteps: ["Booking Summary", "Deposit Required", "OTP Verification", "Booking Confirmed"],
    prompt: "Create a WhatsApp authentication flow for high-value beauty treatment booking. Show the booking summary with treatment, date/time, and therapist. Notify about the deposit requirement. Send a 6-digit OTP for payment verification. Confirm the booking with deposit receipt and cancellation policy.",
  },
  {
    id: "beauty-gift-voucher",
    title: "Gift Voucher Redemption",
    description: "Verify and redeem beauty gift vouchers with code validation and service selection.",
    industry: "Beauty & Wellness",
    messageType: "authentication",
    tags: ["Gift Voucher", "Redemption", "Code", "Validation"],
    flowSteps: ["Voucher Code", "Validation", "Available Services", "Redeemed"],
    prompt: "Create a WhatsApp authentication flow for gift voucher redemption. Ask for the voucher code. Validate the code and show the voucher value and expiry date. Display available services within the voucher value. Confirm redemption with the selected service and remaining balance if any.",
  },

  // ── ENTERTAINMENT: New Marketing ──
  {
    id: "entertainment-festival-lineup",
    title: "Festival Lineup Reveal",
    description: "Reveal festival lineup with artist profiles, schedule, and early bird ticket sales.",
    industry: "Entertainment",
    messageType: "marketing",
    tags: ["Festival", "Lineup", "Artists", "Early Bird"],
    flowSteps: ["Lineup Reveal", "Artist Carousel", "Select Artist", "Schedule", "Get Tickets"],
    prompt: "Create a WhatsApp marketing flow for a festival lineup reveal. Start with an exciting lineup announcement with festival poster image. Show a carousel of headlining artists with photos and 'See Schedule' buttons. After the fan selects an artist from the carousel, show that artist's performance day/time and stage. Present ticket tiers with early bird pricing and 'Buy Tickets' button. Confirm the ticket purchase with festival entry details.",
  },
  {
    id: "entertainment-early-bird",
    title: "Early Bird Ticket Sale",
    description: "Drive early ticket sales with tiered pricing, countdown urgency, and group discounts.",
    industry: "Entertainment",
    messageType: "marketing",
    tags: ["Early Bird", "Tickets", "Pricing Tiers", "Group Discount"],
    flowSteps: ["Early Bird Alert", "Ticket Tiers Carousel", "Select Tier", "Group Option", "Purchase"],
    prompt: "Create a WhatsApp marketing flow for early bird ticket sales. Start with an urgent announcement about limited early bird pricing with countdown. Show a carousel of ticket tiers with prices and 'Buy Now' buttons (e.g., 'General - $49 (was $79)', 'VIP - $129 (was $199)', 'Platinum - $249 (was $399)'). After the fan selects a tier from the carousel, show that tier's inclusions and offer group discount ('Buy 4+ save extra 15%'). Confirm the purchase with e-ticket details.",
  },
  // ── ENTERTAINMENT: New Utility ──
  {
    id: "entertainment-venue-directions",
    title: "Venue Directions & Info",
    description: "Send venue information with directions, parking, entry gates, and event-day tips.",
    industry: "Entertainment",
    messageType: "utility",
    tags: ["Venue", "Directions", "Parking", "Event Day"],
    flowSteps: ["Event Reminder", "Venue Info", "Directions", "Entry Guide", "Enjoy"],
    prompt: "Create a WhatsApp utility flow for event-day venue information. Send a reminder on event day with show time. Provide venue details with address and map link. Share parking information and public transport options. Show entry gate assignment based on ticket type with QR code reminder. Wish them a great time.",
  },
  {
    id: "entertainment-post-event",
    title: "Post-Event Follow-up",
    description: "Follow up after events with photo sharing and feedback collection.",
    industry: "Entertainment",
    messageType: "utility",
    tags: ["Post-Event", "Photos", "Feedback"],
    flowSteps: ["Thank You", "Event Photos", "Rate Experience", "Feedback Received"],
    prompt: "Create a WhatsApp utility flow for post-event follow-up. Thank the attendee for coming to the specific event (name and date). Share an event photo gallery link. Ask for a rating with quick reply buttons ('🎉 Amazing', '👍 Great', '😐 Okay', '👎 Disappointing'). Thank them for their feedback.",
  },
  {
    id: "entertainment-subscription-renewal",
    title: "Streaming Subscription Renewal",
    description: "Remind subscribers about upcoming renewal with plan details and renewal confirmation.",
    industry: "Entertainment",
    messageType: "utility",
    tags: ["Subscription", "Renewal", "Streaming"],
    flowSteps: ["Renewal Reminder", "Plan Details", "Renewal Confirmation"],
    prompt: "Create a WhatsApp utility flow for streaming subscription renewal. Remind the subscriber about the upcoming renewal date with their current plan name and monthly price. Show the plan details (what's included). Include 'Confirm Renewal', 'Cancel Subscription', and 'Contact Support' buttons. If confirming, show the next billing date and amount.",
  },
  // ── ENTERTAINMENT: New Authentication ──
  {
    id: "entertainment-ticket-transfer",
    title: "Ticket Transfer Verification",
    description: "Verify identity when transferring event tickets to another person.",
    industry: "Entertainment",
    messageType: "authentication",
    tags: ["Ticket Transfer", "Verification", "Identity", "Recipient"],
    flowSteps: ["Transfer Request", "Ticket Details", "OTP Verification", "Transfer Complete"],
    prompt: "Create a WhatsApp authentication flow for ticket transfer. Show the ticket details being transferred (event, date, seat). Ask for the recipient's name and phone number. Send a 6-digit OTP to verify the ticket holder's identity. Confirm the transfer with new ticket holder details and remind that the original ticket is now void.",
  },
  {
    id: "entertainment-age-verify",
    title: "Age Verification for Restricted Events",
    description: "Verify age for age-restricted events or content with ID validation.",
    industry: "Entertainment",
    messageType: "authentication",
    tags: ["Age Verification", "Restricted", "ID", "Compliance"],
    flowSteps: ["Age Check Required", "Date of Birth", "ID Verification", "Access Granted"],
    prompt: "Create a WhatsApp authentication flow for age verification. Notify that the event/content requires age verification. Ask for date of birth confirmation. Request ID verification with a secure link. Upon verification, grant access with a verified badge and event entry instructions.",
  },

  // ── LOGISTICS: New Marketing ──
  {
    id: "logistics-express-service",
    title: "Express Delivery Service Launch",
    description: "Launch a new express delivery service with speed comparison, pricing, and first-shipment offer.",
    industry: "Logistics",
    messageType: "marketing",
    tags: ["Express", "Launch", "Speed", "First Shipment"],
    flowSteps: ["Service Launch", "Speed Comparison", "Pricing", "First Shipment Offer", "Book Now"],
    prompt: "Create a WhatsApp marketing flow for an express delivery service launch. Start with an announcement about the new service with a delivery van image. Show speed comparison (Express vs Standard vs Economy) with delivery times. Present pricing tiers with 'Get Quote' buttons. Offer a first-shipment discount (e.g., '50% off your first express shipment'). Confirm the booking with specific tracking number (e.g., 'EXP-2026-9931'), pickup time (e.g., 'Today 4:00 PM'), delivery ETA (e.g., 'Tomorrow 10:00 AM'), and total cost (e.g., '$34.50').",
  },
  {
    id: "logistics-international",
    title: "International Shipping Solutions",
    description: "Promote international shipping with country coverage, customs support, and rate calculator.",
    industry: "Logistics",
    messageType: "marketing",
    tags: ["International", "Shipping", "Customs", "Global"],
    flowSteps: ["International Promo", "Coverage Map", "Rate Calculator", "Customs Support", "Ship Now"],
    prompt: "Create a WhatsApp marketing flow for international shipping services. Start with a promotional message about global reach with a world map image. Show coverage highlights for key regions. Offer a rate calculator with 'Get Quote' button — ask for destination country and package weight. Show a specific quote: route (e.g., 'New York to London'), weight (e.g., '5.2 kg'), cost (e.g., '$78.50'), delivery timeline (e.g., '5-7 business days'), and customs handling included. Offer 'Ship Now' button and confirm the booking.",
  },
  {
    id: "logistics-bulk-discount",
    title: "Bulk Shipping Discount Program",
    description: "Offer volume-based shipping discounts for businesses with tier pricing and account setup.",
    industry: "Logistics",
    messageType: "marketing",
    tags: ["Bulk", "Discount", "Business", "Volume"],
    flowSteps: ["Bulk Program Intro", "Discount Tiers", "Calculator", "Sign Up", "Account Created"],
    prompt: "Create a WhatsApp marketing flow for a bulk shipping discount program. Start with an invitation for businesses to save on shipping. Show discount tier carousel with volume thresholds, savings, and 'Select Tier' buttons (e.g., '50+ shipments/mo - 15% off', '200+ shipments/mo - 25% off', '500+ shipments/mo - 35% off'). After the business selects a tier from the carousel, show that tier's detailed pricing and estimated monthly savings. Offer account setup with 'Sign Up' button and confirm with account manager assignment.",
  },
  // ── LOGISTICS: New Utility ──
  {
    id: "logistics-proof-of-delivery",
    title: "Proof of Delivery Notification",
    description: "Send proof of delivery with photo, signature, timestamp, and feedback request.",
    industry: "Logistics",
    messageType: "utility",
    tags: ["Proof of Delivery", "Photo", "Signature", "Confirmation"],
    flowSteps: ["Delivery Confirmed", "POD Details", "Photo/Signature", "Feedback"],
    prompt: "Create a WhatsApp utility flow for proof of delivery. Confirm the delivery with specific details: tracking number (e.g., 'SHP-2026-84721'), recipient name (e.g., 'James Wilson'), delivery time (e.g., '2:15 PM, March 22, 2026'), and delivery location (e.g., 'Front door, signed'). Show the delivery photo and recipient signature. Provide 'Confirm Receipt' and 'Report Issue' buttons. If confirmed, ask for a delivery rating. If reporting an issue, collect details and create a support ticket.",
  },
  {
    id: "logistics-invoice-ready",
    title: "Shipping Invoice Ready",
    description: "Notify businesses when shipping invoices are ready with summary and payment options.",
    industry: "Logistics",
    messageType: "utility",
    tags: ["Invoice", "Billing", "Payment", "Business"],
    flowSteps: ["Invoice Ready", "Summary", "Payment Options", "Payment Confirmed"],
    prompt: "Create a WhatsApp utility flow for shipping invoice notification. Notify the business by name (e.g., 'Hi TechCorp!') that their monthly invoice is ready: invoice number (e.g., '#INV-2026-0318'), billing period (e.g., 'Feb 1-28, 2026'), total amount (e.g., '$4,287.50'), and shipment count (e.g., '147 shipments'). Show a summary of shipments (count, total weight, destinations). Offer 'Pay Now', 'Download Invoice', and 'Dispute' buttons. Confirm payment with receipt number.",
  },
  // ── LOGISTICS: New Authentication ──
  {
    id: "logistics-receiver-confirm",
    title: "Receiver Identity Confirmation",
    description: "Verify the receiver's identity before releasing a high-value package.",
    industry: "Logistics",
    messageType: "authentication",
    tags: ["Receiver", "Identity", "High-Value", "Verification"],
    flowSteps: ["Delivery Attempt", "Identity Check", "OTP Sent", "Package Released"],
    prompt: "Create a WhatsApp authentication flow for receiver identity verification. Notify about a specific high-value package: tracking number (e.g., 'SHP-2026-91003'), declared value (e.g., '$2,500'), sender (e.g., 'LuxWatch Co.'), and delivery attempt time (e.g., 'today between 1-3 PM'). Ask the receiver to confirm their name and the sender's name. Send a 6-digit OTP for identity verification. Upon verification, authorize the driver to release the package with a digital receipt.",
  },
  {
    id: "logistics-account-setup",
    title: "Business Account Setup",
    description: "Verify business identity for new shipping account setup with document validation.",
    industry: "Logistics",
    messageType: "authentication",
    tags: ["Business Account", "Setup", "Verification", "Documents"],
    flowSteps: ["Account Request", "Business Verification", "OTP Sent", "Account Active"],
    prompt: "Create a WhatsApp authentication flow for business shipping account setup. Confirm the business registration details. Verify the authorized representative with an OTP. Confirm the account is active with account number, API credentials (if applicable), and assigned account manager contact.",
  },

  // ── INSURANCE: New Marketing ──
  {
    id: "insurance-motor",
    title: "Motor Insurance Promotion",
    description: "Promote motor insurance with coverage comparison, instant quote, and online purchase.",
    industry: "Insurance",
    messageType: "marketing",
    tags: ["Motor", "Car Insurance", "Quote", "Coverage"],
    flowSteps: ["Motor Promo", "Coverage Carousel", "Select Plan", "Instant Quote", "Purchase"],
    prompt: "Create a WhatsApp marketing flow for motor insurance. Start with a promotional message about comprehensive vehicle protection. Show a carousel of coverage plans with key features and 'Get Quote' buttons (e.g., 'Basic - Third Party Only', 'Standard - Theft & Fire', 'Comprehensive - Full Coverage'). After the customer selects a plan from the carousel, ask for vehicle details (make, model, year) and provide an instant premium quote. Offer 'Buy Now' button and confirm the policy.",
  },
  {
    id: "insurance-travel-cover",
    title: "Travel Insurance Package",
    description: "Promote travel insurance with destination-based coverage, medical limits, and instant activation.",
    industry: "Insurance",
    messageType: "marketing",
    tags: ["Travel", "Coverage", "Medical", "Instant"],
    flowSteps: ["Travel Cover Promo", "Plan Carousel", "Select Plan", "Coverage Details", "Activate"],
    prompt: "Create a WhatsApp marketing flow for travel insurance. Start with a promotional message about worry-free travel. Show a carousel of plans with coverage limits, prices, and 'Select Plan' buttons (e.g., 'Basic - $29 - Medical $50K', 'Standard - $59 - Medical $200K + Baggage', 'Premium - $99 - Medical $500K + Cancellation'). After the customer selects a plan from the carousel, show detailed coverage including medical, baggage, flight delay, and cancellation. Ask for travel dates and activate instantly.",
  },
  {
    id: "insurance-family-protection",
    title: "Family Protection Plan",
    description: "Promote family insurance bundles with scenario-based coverage and family discount.",
    industry: "Insurance",
    messageType: "marketing",
    tags: ["Family", "Protection", "Bundle", "Discount"],
    flowSteps: ["Family Plan Intro", "Coverage Scenarios", "Plan Carousel", "Select Plan", "Apply"],
    prompt: "Create a WhatsApp marketing flow for family protection insurance. Start with an emotional message about protecting what matters most. Show scenario-based coverage explanations ('What if...' scenarios for income protection, medical emergencies, education funding). Present family plan carousel with coverage amounts and 'Learn More' buttons. After the customer selects a plan from the carousel, show detailed coverage for each family member and the family discount. Offer 'Apply Now' button.",
  },
  // ── INSURANCE: New Utility ──
  {
    id: "insurance-policy-document",
    title: "Policy Document Delivery",
    description: "Deliver policy documents digitally with summary, key dates, and support contacts.",
    industry: "Insurance",
    messageType: "utility",
    tags: ["Policy", "Document", "Delivery", "Digital"],
    flowSteps: ["Policy Ready", "Summary", "Key Dates", "Download", "Support"],
    prompt: "Create a WhatsApp utility flow for policy document delivery. Notify the customer that their policy document is ready. Show a policy summary with coverage type, sum assured, premium, and validity. Highlight key dates (renewal, claim window). Provide 'Download Policy' and 'View Online' buttons. Share the customer support contact for any questions.",
  },
  {
    id: "insurance-premium-due",
    title: "Premium Payment Due",
    description: "Remind policyholders about upcoming premium payments with amount, grace period, and payment options.",
    industry: "Insurance",
    messageType: "utility",
    tags: ["Premium", "Payment", "Due", "Grace Period"],
    flowSteps: ["Premium Reminder", "Policy Details", "Payment Options", "Payment Confirmed"],
    prompt: "Create a WhatsApp utility flow for premium payment reminders. Notify the policyholder by name (e.g., 'Hi Sarah') about a specific premium: policy name (e.g., 'Family Health Shield Plus'), policy number (e.g., 'POL-2024-88431'), amount (e.g., '$247.50/month'), and due date (e.g., 'March 25, 2026'). Mention the grace period and consequences of lapse. Show 'Pay Now', 'Set Auto-Pay', and 'Contact Agent' buttons. Confirm payment with receipt and next premium date.",
  },
  // ── INSURANCE: New Authentication ──
  {
    id: "insurance-policy-login",
    title: "Policy Portal Login",
    description: "Secure login to the insurance policy portal with OTP and policy summary.",
    industry: "Insurance",
    messageType: "authentication",
    tags: ["Portal", "Login", "OTP", "Policy Access"],
    flowSteps: ["Login Request", "OTP Sent", "Verified", "Policy Dashboard"],
    prompt: "Create a WhatsApp authentication flow for insurance portal login. Send a 6-digit OTP for secure access with 5-minute expiry. Upon verification, show a quick policy dashboard with active policies count, upcoming renewals, and any pending claims. Include a security notice about the login.",
  },
  {
    id: "insurance-nominee-verify",
    title: "Nominee Verification",
    description: "Verify nominee details for life insurance policies with identity confirmation.",
    industry: "Insurance",
    messageType: "authentication",
    tags: ["Nominee", "Verification", "Life Insurance", "Identity"],
    flowSteps: ["Nominee Update", "Details Confirmation", "OTP Sent", "Nominee Verified"],
    prompt: "Create a WhatsApp authentication flow for nominee verification. Show the nominee details being updated (name, relationship, percentage). Send a 6-digit OTP to the policyholder for authorization. Confirm the nominee update with effective date and remind about updating other policies if needed.",
  },

  // ── TELECOMMUNICATIONS: New Marketing ──
  {
    id: "telco-5g-migration",
    title: "5G Network Migration",
    description: "Promote 5G migration with speed comparison, compatible devices, and upgrade offers.",
    industry: "Telecommunications",
    messageType: "marketing",
    tags: ["5G", "Migration", "Speed", "Upgrade"],
    flowSteps: ["5G Announcement", "Speed Comparison", "Device Compatibility", "Upgrade Plan", "Activated"],
    prompt: "Create a WhatsApp marketing flow for 5G network migration. Start with an exciting announcement about 5G availability in the customer's area. Show a speed comparison (4G vs 5G with real numbers). Check device compatibility with 'Check My Device' button. If compatible, offer 5G plan upgrade with pricing. If not, show 5G-ready device deals. Confirm the upgrade with activation date.",
  },
  {
    id: "telco-prepaid-recharge",
    title: "Prepaid Recharge Reminder",
    description: "Remind prepaid users about low balance with recharge options and bonus data offers.",
    industry: "Telecommunications",
    messageType: "marketing",
    tags: ["Prepaid", "Recharge", "Low Balance", "Bonus Data"],
    flowSteps: ["Low Balance Alert", "Recharge Options Carousel", "Select Plan", "Bonus Offer", "Recharged"],
    prompt: "Create a WhatsApp marketing flow for prepaid recharge. Alert the customer about low balance with current balance shown. Show a carousel of recharge options with data, validity, prices, and 'Recharge' buttons (e.g., '$10 - 5GB/30 days', '$20 - 15GB/30 days', '$35 - Unlimited/30 days'). After the customer selects a plan from the carousel, show a bonus data offer for recharging today. Confirm the recharge with new balance and validity.",
  },
  // ── TELECOMMUNICATIONS: New Utility ──
  {
    id: "telco-network-outage",
    title: "Network Outage Notification",
    description: "Notify customers about network outages with affected areas, ETA, and compensation.",
    industry: "Telecommunications",
    messageType: "utility",
    tags: ["Outage", "Network", "Notification", "Compensation"],
    flowSteps: ["Outage Alert", "Affected Areas", "ETA", "Resolved", "Compensation"],
    prompt: "Create a WhatsApp utility flow for network outage notification. Alert the customer about a service disruption with affected services (calls, data, SMS). Show the affected area and estimated resolution time. Send a resolution notification when fixed. Offer compensation (bonus data or bill credit) with 'Claim Compensation' button.",
  },
  {
    id: "telco-roaming-activation",
    title: "International Roaming Activation",
    description: "Help customers activate roaming before travel with plan options and usage tips.",
    industry: "Telecommunications",
    messageType: "utility",
    tags: ["Roaming", "International", "Travel", "Activation"],
    flowSteps: ["Roaming Info", "Destination Plans", "Select Plan", "Activation", "Usage Tips"],
    prompt: "Create a WhatsApp utility flow for international roaming activation. Detect upcoming travel (or ask destination). Show available roaming plans for the destination with data, calls, pricing, and 'Activate' buttons. After the customer selects a plan, activate it with start date. Provide usage tips (Wi-Fi calling, data saving) and emergency numbers for the destination.",
  },
  {
    id: "telco-number-porting",
    title: "Number Porting Status",
    description: "Track number porting progress with status updates and activation confirmation.",
    industry: "Telecommunications",
    messageType: "utility",
    tags: ["Number Porting", "Status", "Migration", "Activation"],
    flowSteps: ["Porting Initiated", "Verification", "Processing", "Porting Complete", "Welcome"],
    prompt: "Create a WhatsApp utility flow for number porting status. Confirm the porting request with the number being transferred. Update on verification with the previous carrier. Notify when processing is underway with estimated completion. Confirm porting is complete with new SIM activation instructions. Welcome to the new network with plan details.",
  },
  // ── TELECOMMUNICATIONS: New Authentication ──
  {
    id: "telco-esim-activation",
    title: "eSIM Activation",
    description: "Activate an eSIM with QR code delivery and device setup instructions.",
    industry: "Telecommunications",
    messageType: "authentication",
    tags: ["eSIM", "Activation", "QR Code", "Setup"],
    flowSteps: ["eSIM Request", "Identity Verification", "QR Code Delivery", "Activation Confirmed"],
    prompt: "Create a WhatsApp authentication flow for eSIM activation. Confirm the eSIM request with plan details. Verify identity with a 6-digit OTP. Deliver the eSIM QR code with step-by-step setup instructions for the device. Confirm activation with network connection status and plan details.",
  },
  {
    id: "telco-account-recovery",
    title: "Account Recovery",
    description: "Help customers recover their telecom account with multi-step identity verification.",
    industry: "Telecommunications",
    messageType: "authentication",
    tags: ["Account Recovery", "Identity", "Verification", "Security"],
    flowSteps: ["Recovery Request", "Security Questions", "OTP Sent", "Account Recovered"],
    prompt: "Create a WhatsApp authentication flow for telecom account recovery. Confirm the recovery request. Verify identity with security questions (last recharge amount, registered email). Send a 6-digit OTP to the registered alternate number. Confirm account access is restored with a security recommendation to update the password.",
  },

  // ═══════════════════════════════════════════
  // COUPON REDEMPTION JOURNEYS (O2O - Online to Offline)
  // Bridges WhatsApp engagement to physical store visits
  // ═══════════════════════════════════════════
  // Retail
  {
    id: "retail-coupon-instore",
    title: "In-Store Coupon Campaign",
    description: "Drive footfall to physical stores with exclusive WhatsApp coupons. Customers claim a unique discount code, find their nearest store, and redeem in-store for a seamless O2O experience.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Coupon", "In-Store", "O2O", "Footfall", "Discount Code", "Store Visit"],
    flowSteps: ["Exclusive Offer", "Claim Coupon", "Unique Code + QR", "Find Nearest Store", "Redemption Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a retail in-store coupon campaign that bridges online to offline. Start with a template announcing an exclusive in-store offer (e.g., '25% Off This Weekend — In-Store Only!') with a hero image of the store and 'Claim Your Coupon' and 'View Products' buttons. After customer clicks 'Claim Your Coupon', show a carousel of 3 coupon tiers (e.g., '15% Off Fashion - Code: STYLE15-AX7K', '20% Off Electronics - Code: TECH20-BM3P', '25% Off Everything - Min. spend $100 - Code: VIP25-CZ9R') with 'Claim This' buttons. After the customer selects a coupon tier, acknowledge their choice and send an image message with a QR code description and the unique coupon code, expiry date, and terms. Follow with an interactive_buttons message asking 'Find your nearest store to redeem!' with 'Find Nearest Store' and 'Share with Friend' buttons. After customer clicks 'Find Nearest Store', send store location details with address, opening hours, and directions.",
  },
  {
    id: "retail-weekend-flash-coupon",
    title: "Weekend Flash Coupon Drop",
    description: "Time-limited weekend coupon blast to drive immediate store visits. Creates urgency with expiring codes and nearby store directions.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Flash Sale", "Weekend", "Coupon", "Urgency", "Store Visit", "O2O"],
    flowSteps: ["Flash Alert", "Choose Category", "Instant Coupon", "Store Locator", "Visit Reminder"],
    prompt: "Create a WhatsApp marketing flow for a weekend flash coupon drop at a retail chain. Start with an urgent template message ('⚡ 48-Hour Flash Coupons — This Weekend Only!') with a vibrant sale image and 'Grab My Coupon' and 'View Deals' buttons. After customer clicks 'Grab My Coupon', show an interactive_list with shopping categories (Fashion, Electronics, Home & Living, Sports, Beauty) so they can pick their interest. After selection, send an image of a QR code coupon with their unique code (e.g., 'FLASH-KM4X'), 30% discount, valid this weekend only, with terms. Follow with interactive_buttons: 'Your nearest store is just 2.3km away!' with 'Get Directions' and 'Save for Later' buttons. After clicking 'Get Directions', confirm the store address, weekend hours, and a reminder to show the QR code at checkout.",
  },
  // E-Commerce (with physical stores / pop-ups)
  {
    id: "ecom-online-to-store-coupon",
    title: "Online-to-Store Pickup Coupon",
    description: "Encourage online shoppers to visit physical stores with exclusive pickup coupons. Combines online browsing with in-store collection and bonus discounts.",
    industry: "E-Commerce",
    messageType: "marketing",
    tags: ["O2O", "Click & Collect", "Coupon", "Store Pickup", "Bonus Discount"],
    flowSteps: ["Online Offer", "Product Browse", "Claim Pickup Coupon", "Store Selection", "Pickup Confirmed"],
    prompt: "Create a WhatsApp marketing flow for an e-commerce brand encouraging online-to-store pickup with a bonus coupon. Start with a template ('Order Online, Pick Up In-Store & Get 15% Extra Off!') with a store image and 'Browse Products' and 'Claim Coupon' buttons. After customer clicks 'Browse Products', show a carousel of 3-4 trending products with prices and 'Add to Cart' buttons. After the customer selects a product, acknowledge their choice and offer a pickup coupon: send an image with QR code description showing unique code (e.g., 'PICKUP15-NR2J'), 15% extra off when collecting in-store, valid 7 days. Follow with interactive_buttons: 'Choose your pickup store' with 'Find Nearest Store' and 'View Cart' buttons. After store selection, confirm pickup details with store address, operating hours, and instructions to show the QR code for the bonus discount.",
  },
  // Food & Beverage
  {
    id: "fnb-dine-in-coupon",
    title: "Dine-In Exclusive Coupon",
    description: "Drive restaurant footfall with exclusive dine-in coupons. Customers browse the menu, claim a discount code, and redeem when dining at the restaurant.",
    industry: "Food & Beverage",
    messageType: "marketing",
    tags: ["Dine-In", "Coupon", "Restaurant", "O2O", "Footfall", "Discount"],
    flowSteps: ["Dine-In Promo", "Menu Preview", "Claim Coupon", "Restaurant Directions", "Redemption"],
    prompt: "Create a WhatsApp marketing flow for a restaurant dine-in coupon campaign. Start with a template ('Dine With Us This Week — Get a Free Dessert + 20% Off!') with a mouth-watering food image and 'Claim Offer' and 'View Menu' buttons. After customer clicks 'Claim Offer', show a carousel of 3 coupon options: 'Free Dessert with Any Main' (code: SWEET-AX3K), '20% Off Total Bill' (code: DINE20-BM7P, min. 2 pax), 'Free Appetizer + Drink' (code: COMBO-CZ2R, dine-in only). After the customer selects a coupon option, acknowledge their choice and send an image with QR code showing the unique coupon code, validity (this week only), and terms (dine-in only, not combinable). Follow with interactive_buttons: 'Ready to dine? Find us here!' with 'Get Directions' and 'Make Reservation' buttons. After clicking 'Get Directions', show restaurant address, opening hours, and parking info.",
  },
  {
    id: "fnb-loyalty-stamp-coupon",
    title: "Loyalty Stamp Card Reward",
    description: "Digital loyalty stamp card that rewards repeat visits. Customers earn stamps per visit and redeem a free meal coupon when the card is full.",
    industry: "Food & Beverage",
    messageType: "marketing",
    tags: ["Loyalty", "Stamp Card", "Free Meal", "Repeat Visit", "O2O", "Reward"],
    flowSteps: ["Stamp Update", "Progress Check", "Reward Unlocked", "Claim Coupon", "Visit to Redeem"],
    prompt: "Create a WhatsApp marketing flow for a restaurant loyalty stamp card reward. Start with a template ('🎉 You earned a new stamp! 8/10 stamps collected') with an image of a digital stamp card and 'View My Card' and 'Earn More' buttons. After customer clicks 'View My Card', show their stamp progress with interactive_buttons: 'Just 2 more visits for a FREE meal!' with 'View Rewards' and 'Find Restaurant' buttons. After clicking 'View Rewards', show a carousel of redeemable rewards: 'Free Main Course' (10 stamps, code: LOYAL10-FREE), 'Free Dessert' (7 stamps, code: LOYAL7-SWEET), '50% Off Bill' (8 stamps, code: LOYAL8-HALF). After the customer selects a reward, acknowledge their choice and send QR code image with the reward coupon code, expiry (30 days), and terms. Follow with 'Visit any outlet to redeem!' with 'Get Directions' and 'Share Card' buttons.",
  },
  // Automotive
  {
    id: "auto-test-drive-voucher",
    title: "Test Drive Bonus Voucher",
    description: "Incentivize showroom visits with a test drive bonus voucher. Customers book a test drive and receive a voucher for accessories or service discounts redeemable at the dealership.",
    industry: "Automotive",
    messageType: "marketing",
    tags: ["Test Drive", "Voucher", "Showroom", "O2O", "Dealership", "Bonus"],
    flowSteps: ["New Model Launch", "Model Details", "Book Test Drive", "Bonus Voucher", "Dealership Directions"],
    prompt: "Create a WhatsApp marketing flow for an automotive test drive bonus voucher campaign. Start with a template ('Experience the All-New 2026 Model — Book a Test Drive & Get a $500 Accessories Voucher!') with a hero image of the new car model and 'Book Test Drive' and 'View Models' buttons. After customer clicks 'Book Test Drive', show an interactive_list with available test drive slots at the nearest dealership (e.g., 'Sat 15 Mar, 10:00 AM', 'Sat 15 Mar, 2:00 PM', 'Sun 16 Mar, 11:00 AM'). After slot selection, confirm the booking and immediately send a bonus voucher: image with QR code showing code 'DRIVE500-VK8M', $500 off accessories or first service, valid 30 days, redeemable at any authorized dealership. Follow with interactive_buttons: 'Your test drive is confirmed! Here are the dealership details.' with 'Get Directions' and 'Add to Calendar' buttons.",
  },
  {
    id: "auto-service-coupon",
    title: "Service Center Discount Coupon",
    description: "Drive service center visits with maintenance discount coupons. Remind customers about due service and offer exclusive WhatsApp-only discounts for booking through the chat.",
    industry: "Automotive",
    messageType: "marketing",
    tags: ["Service", "Maintenance", "Coupon", "Discount", "O2O", "Service Center"],
    flowSteps: ["Service Reminder", "Maintenance Menu", "Claim Discount", "Book Service", "Service Center Info"],
    prompt: "Create a WhatsApp marketing flow for an automotive service center discount coupon. Start with a template ('Your vehicle service is due! Book via WhatsApp and save 20%') with a car service image and 'Book Service' and 'View Packages' buttons. After customer clicks 'View Packages', show a carousel of 3 service packages: 'Basic Service' ($89 → $71 with code SERVICE20-AX3K), 'Full Service' ($189 → $151 with code SERVICE20-BM7P), 'Premium Detail' ($299 → $239 with code SERVICE20-CZ9R). After customer selects a package, send the coupon as an image with QR code, unique code, 20% discount, valid 14 days. Follow with interactive_buttons: 'Schedule your service appointment' with 'Book Now' and 'Find Service Center' buttons. After booking, confirm appointment with service center address, date/time, and what to bring.",
  },
  // Beauty & Wellness
  {
    id: "beauty-treatment-coupon",
    title: "Spa Treatment Coupon",
    description: "Drive salon and spa visits with exclusive treatment coupons. Customers browse treatments, claim a first-visit or seasonal discount, and book their appointment.",
    industry: "Beauty & Wellness",
    messageType: "marketing",
    tags: ["Spa", "Treatment", "Coupon", "First Visit", "O2O", "Salon"],
    flowSteps: ["Seasonal Promo", "Treatment Menu", "Claim Coupon", "Book Appointment", "Salon Directions"],
    prompt: "Create a WhatsApp marketing flow for a beauty spa treatment coupon campaign. Start with a template ('Pamper Yourself This Spring — 30% Off Your First Treatment!') with a luxurious spa interior image and 'View Treatments' and 'Claim Offer' buttons. After customer clicks 'View Treatments', show a carousel of 4 treatments: 'Deep Tissue Massage' ($120 → $84), 'Hydrating Facial' ($95 → $67), 'Full Body Scrub' ($80 → $56), 'Aromatherapy Package' ($150 → $105) with 'Book This' buttons. After the customer selects a treatment, acknowledge their choice and send a coupon image with QR code: unique code (e.g., 'SPA30-LX5K'), 30% off selected treatment, valid 21 days, first-time customers. Follow with interactive_buttons: 'Book your pampering session!' with 'Book Appointment' and 'Find Nearest Spa' buttons. After clicking 'Book Appointment', show an interactive_list with available time slots.",
  },
  // Entertainment
  {
    id: "entertainment-movie-voucher",
    title: "Movie Ticket Voucher",
    description: "Drive cinema visits with buy-one-get-one or discounted ticket vouchers. Customers browse upcoming movies, claim a ticket deal, and get directions to the nearest cinema.",
    industry: "Entertainment",
    messageType: "marketing",
    tags: ["Cinema", "Movie", "Voucher", "BOGO", "O2O", "Ticket"],
    flowSteps: ["Movie Promo", "Now Showing", "Claim Voucher", "Select Cinema", "Booking Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a cinema movie ticket voucher campaign. Start with a template ('🎬 Buy 1 Get 1 Free — This Weekend at All Cinemas!') with a movie poster collage image and 'Browse Movies' and 'Claim BOGO' buttons. After customer clicks 'Browse Movies', show a carousel of 3-4 now-showing movies with poster images, titles, ratings, and 'Book Tickets' buttons. After the customer selects a movie, acknowledge their choice and send a BOGO voucher as an image with QR code: code 'MOVIE-BOGO-7X3K', buy 1 get 1 free, valid this weekend, all formats. Follow with interactive_buttons: 'Choose your cinema!' with 'Find Nearest Cinema' and 'View Showtimes' buttons. After cinema selection, show available showtimes with an interactive_list and confirm the booking with seat details and a reminder to show the QR code at the counter.",
  },
  // Real Estate
  {
    id: "realestate-showroom-voucher",
    title: "Property Viewing Incentive Voucher",
    description: "Drive showroom visits for property launches with exclusive viewing incentives. Visitors who tour the showroom receive a booking discount voucher.",
    industry: "Real Estate",
    messageType: "marketing",
    tags: ["Property", "Showroom", "Voucher", "O2O", "Viewing", "Launch"],
    flowSteps: ["Property Launch", "Unit Types", "Book Viewing", "Incentive Voucher", "Showroom Directions"],
    prompt: "Create a WhatsApp marketing flow for a real estate showroom visit incentive. Start with a template ('New Launch: Luxury Residences from $350K — Visit Our Showroom & Get $5,000 Off!') with a property hero image and 'View Units' and 'Book Viewing' buttons. After customer clicks 'View Units', show a carousel of 3 unit types: '2-Bed Apartment' ($350K), '3-Bed Penthouse' ($520K), 'Garden Duplex' ($480K) with 'Learn More' buttons. After the customer selects a unit type, acknowledge their choice and show unit details with interactive_buttons 'Book a Showroom Visit' and 'Download Brochure'. After booking, show an interactive_list with viewing slots. After slot selection, send a voucher image with QR code: code 'HOME5K-VR8M', $5,000 off booking fee, valid 30 days, present at showroom. Follow with 'Your viewing is confirmed!' with 'Get Directions' and 'Add to Calendar' buttons.",
  },
  // ═══════════════════════════════════════════
  // FMCG / BABY CARE — Lifecycle Journey (8 Touchpoints)
  // Based on a typical baby care brand lifecycle messaging journey:
  // Registration → Pregnancy Tips → Pre-Birth Prep → Newborn Welcome
  // → Size Transition → Active Baby → Toddler → Re-engagement
  // ═══════════════════════════════════════════
  {
    id: "fmcg-baby-registration",
    title: "New Parent Registration & Due Date Collection",
    description: "Welcome new parents into the baby care program. Collect due date information to personalize the entire lifecycle journey with milestone-based messaging.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Baby Care", "Registration", "Lifecycle", "Due Date", "Onboarding", "FMCG"],
    flowSteps: ["Welcome Template", "Due Date Collection", "Program Benefits", "Preference Selection", "Confirmation"],
    prompt: "Create a WhatsApp marketing flow for a baby care brand's new parent registration. Start with a warm welcome template with a baby-themed image ('Welcome to our family! 👶 We're here to support your parenting journey') with 'Get Started' and 'Learn More' buttons. After clicking 'Get Started', ask 'When is your baby due?' with interactive_buttons for trimester ranges: 'First Trimester', 'Second Trimester', 'Third Trimester', 'Already Born'. After the customer selects their stage, acknowledge their selection and show program benefits: weekly tips, exclusive offers, milestone tracking. Then show an interactive_list of content preferences: 'Product Recommendations', 'Parenting Tips', 'Health & Nutrition', 'Deals & Offers', 'All of the Above'. After selection, confirm enrollment with a personalized message about what they'll receive and when.",
  },
  {
    id: "fmcg-baby-pregnancy-tips",
    title: "Weekly Pregnancy Milestone Tips",
    description: "Send weekly pregnancy milestone updates with product recommendations tailored to each stage. Covers weeks 12-36 with helpful tips and relevant product suggestions.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Baby Care", "Pregnancy", "Tips", "Milestones", "Product Recommendations", "FMCG"],
    flowSteps: ["Milestone Update", "Tips & Advice", "Product Carousel", "Shop Now", "Next Milestone Preview"],
    prompt: "Create a WhatsApp marketing flow for weekly pregnancy milestone tips from a baby care brand. Start with a template with a pregnancy milestone image ('Week 24 Update: Your baby is the size of a cantaloupe! 🍈 Here are this week's tips') with 'Read Tips' and 'Shop Essentials' buttons. After clicking 'Read Tips', show 3 helpful tips for this pregnancy stage with an image (nutrition advice, exercise tips, preparation checklist). Then show a carousel of 3 recommended products for this stage: 'Stretch Mark Cream' with price, 'Pregnancy Pillow' with price, 'Prenatal Vitamins' with price, each with 'View Details' buttons. After the customer selects a product from the carousel, show that product's details with benefits, usage tips, and a 'Add to Cart' button. After clicking 'Add to Cart', confirm and preview next week's milestone.",
  },
  {
    id: "fmcg-baby-prebirth-prep",
    title: "Pre-Birth Stock-Up Campaign",
    description: "2 weeks before the due date, send a stock-up reminder for newborn essentials with exclusive bundle deals and e-commerce integration for easy purchasing.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Baby Care", "Pre-Birth", "Stock-Up", "Bundle", "Newborn Essentials", "FMCG"],
    flowSteps: ["Due Date Reminder", "Essentials Checklist", "Bundle Deals", "Quick Purchase", "Delivery Confirmation"],
    prompt: "Create a WhatsApp marketing flow for a baby care brand's pre-birth stock-up campaign. Start with a template with a newborn essentials image ('Your little one is almost here! 🎉 Stock up on newborn essentials — exclusive bundle deals inside') with 'View Bundles' and 'Essentials Checklist' buttons. After clicking 'View Bundles', show a carousel of 3 newborn bundles: 'Newborn Starter Pack' (diapers + wipes + cream at 20% off), 'Hospital Bag Essentials' (diapers + changing mat + sanitizer), 'First Month Supply' (bulk diapers + wipes at best value), each with 'View Bundle' buttons. After the customer selects a bundle from the carousel, show the full bundle contents with individual items, total savings, and 'Order Now' and 'Customize Bundle' buttons. After clicking 'Order Now', show delivery options with interactive_buttons: 'Standard Delivery (3-5 days)', 'Express Delivery (Next Day)', 'Store Pickup'. After selection, confirm the order with estimated delivery date and a message about being ready for baby's arrival.",
  },
  {
    id: "fmcg-baby-newborn-welcome",
    title: "Newborn Welcome & Milestone Tracker",
    description: "Congratulate new parents on their baby's arrival. Introduce the milestone tracker and provide essential newborn care tips with product recommendations.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Baby Care", "Newborn", "Welcome", "Milestone Tracker", "Congratulations", "FMCG"],
    flowSteps: ["Congratulations", "Baby Details", "Milestone Tracker", "Newborn Tips", "First Purchase Offer"],
    prompt: "Create a WhatsApp marketing flow for a baby care brand's newborn welcome message. Start with a warm congratulations template with a newborn baby image ('Congratulations on your new arrival! 🎊 Welcome to the world, little one!') with 'Start Tracking' and 'Newborn Tips' buttons. After clicking 'Start Tracking', ask about the baby with interactive_buttons: 'Boy 👦', 'Girl 👧', 'Prefer Not to Say'. After selection, acknowledge and introduce the milestone tracker: 'We'll send you weekly updates on your baby's development milestones!' Then show a carousel of 3 newborn essentials: 'Newborn Diapers (Size NB)' with price, 'Gentle Baby Wipes' with price, 'Diaper Rash Cream' with price, each with 'Shop Now' buttons. After the customer selects a product from the carousel, show product details with a special first-purchase 15% discount code and 'Redeem Offer' button. After clicking 'Redeem Offer', confirm the discount applied and welcome them to the parenting journey.",
  },
  {
    id: "fmcg-baby-size-transition",
    title: "Diaper Size Transition Alert",
    description: "At ~3 months, alert parents it's time to move to the next diaper size. Include size guide, product comparison, and exclusive transition discount.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Baby Care", "Size Transition", "Diapers", "Discount", "Growth", "FMCG"],
    flowSteps: ["Size Alert", "Size Guide", "Product Options", "Transition Discount", "Quick Order"],
    prompt: "Create a WhatsApp marketing flow for a baby care brand's diaper size transition campaign. Start with a template with a growing baby image ('Time for the next size! 📏 Your baby is growing fast — here's your guide to Size S diapers') with 'View Size Guide' and 'Shop Size S' buttons. After clicking 'View Size Guide', show helpful size transition tips with an image: weight ranges, signs baby needs a bigger size, and how to ensure the right fit. Then show a carousel of 3 Size S diaper options: 'Comfort Dry Size S' with price, 'Premium Soft Size S' with price, 'Active Baby Size S' with price, each with 'View Details' buttons. After the customer selects a product from the carousel, show product details with absorbency comparison, customer reviews, and a special 10% transition discount code. Include 'Order Now' and 'Subscribe & Save' buttons. After clicking 'Order Now', confirm the order with the discount applied and a note about the next size transition reminder.",
  },
  {
    id: "fmcg-baby-active-baby",
    title: "Active Baby Stage: Solids & Product Upgrade",
    description: "At ~6 months, introduce parents to the active baby stage with solid food introduction tips, upgraded diaper recommendations, and bundle promotions.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Baby Care", "Active Baby", "Solids", "6 Months", "Product Upgrade", "FMCG"],
    flowSteps: ["Stage Intro", "Feeding Tips", "Product Carousel", "Bundle Offer", "Order Confirmation"],
    prompt: "Create a WhatsApp marketing flow for a baby care brand's active baby stage campaign at 6 months. Start with a template with an active baby image ('Your baby is 6 months old! 🎂 Time for exciting new milestones — solids, crawling & more!') with 'Feeding Guide' and 'Shop Essentials' buttons. After clicking 'Feeding Guide', show solid food introduction tips with an image: when to start, first foods to try, feeding schedule. Then show a carousel of 3 products for the active baby stage: 'Active Fit Diapers Size M' with price, 'Baby Food Starter Kit' with price, 'Sippy Cup Set' with price, each with 'Learn More' buttons. After the customer selects a product from the carousel, show product details with age-appropriate benefits and an exclusive bundle offer: 'Get all 3 for 25% off!' with 'Get Bundle Deal' and 'Just This Item' buttons. After clicking 'Get Bundle Deal', confirm the bundle order with savings summary and delivery details.",
  },
  {
    id: "fmcg-baby-toddler",
    title: "Toddler Transition: Training Pants & Tips",
    description: "At ~12 months, guide parents through the toddler transition with potty training tips, training pants promotion, and developmental milestone content.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Baby Care", "Toddler", "Potty Training", "Training Pants", "12 Months", "FMCG"],
    flowSteps: ["Toddler Welcome", "Development Tips", "Training Products", "Potty Guide", "Subscription Offer"],
    prompt: "Create a WhatsApp marketing flow for a baby care brand's toddler transition campaign at 12 months. Start with a template with a toddler image ('Happy 1st Birthday to your little one! 🎂 Ready for the toddler adventure? We've got you covered!') with 'Toddler Tips' and 'Shop Training Pants' buttons. After clicking 'Toddler Tips', show developmental milestone tips with an image: walking, talking, potty readiness signs. Then show a carousel of 3 toddler products: 'Pull-Up Training Pants' with price, 'Toddler Night Diapers' with price, 'Potty Training Kit' with price, each with 'View Details' buttons. After the customer selects a product from the carousel, show product details with potty training tips specific to that product and a 'Start Potty Training Guide' interactive_list with stages: 'Signs of Readiness', 'Getting Started', 'Daytime Training', 'Nighttime Training', 'Troubleshooting'. After selecting a stage, show relevant tips and a subscription offer: 'Subscribe for monthly delivery & save 15%' with 'Subscribe Now' and 'One-Time Purchase' buttons.",
  },
  {
    id: "fmcg-baby-reengagement",
    title: "Inactive Parent Re-engagement Campaign",
    description: "Re-engage parents who haven't interacted in 60+ days with a 'We miss you' message, exclusive comeback voucher, and updated product recommendations.",
    industry: "Retail",
    messageType: "marketing",
    tags: ["Baby Care", "Re-engagement", "Win-back", "Voucher", "Inactive", "FMCG"],
    flowSteps: ["Win-back Template", "What's New", "Exclusive Voucher", "Product Picks", "Re-subscribe"],
    prompt: "Create a WhatsApp marketing flow for a baby care brand's re-engagement campaign for inactive parents. Start with a template with a heartfelt image ('We miss you! 💛 It's been a while — here's something special just for you') with 'See What's New' and 'Claim Voucher' buttons. After clicking 'Claim Voucher', show an exclusive comeback offer image with a unique voucher code worth 20% off the next purchase, valid for 14 days. Then show interactive_buttons: 'How old is your little one now?' with age range buttons: 'Under 6 months', '6-12 months', '1-2 years', '2+ years'. After the customer selects an age range, show a personalized carousel of 3 age-appropriate product recommendations with updated prices and 'Shop Now' buttons. After the customer selects a product from the carousel, show product details with the voucher discount applied and 'Order with Voucher' and 'Browse More' buttons. After clicking 'Order with Voucher', confirm the order and ask if they'd like to re-subscribe to weekly tips and offers.",
  },


  // ═══════════════════════════════════════════
  // GOVERNMENT & PUBLIC SERVICES
  // ═══════════════════════════════════════════
  // Marketing
  {
    id: "gov-citizen-awareness",
    title: "Public Awareness Campaign",
    description: "Broadcast public health, safety, or civic awareness campaigns with rich media and clear calls to action for citizen engagement.",
    industry: "Government",
    messageType: "marketing",
    tags: ["Public Awareness", "Civic Engagement", "Health & Safety"],
    flowSteps: ["Awareness Template", "Key Information", "Resource Links", "Take Action", "Feedback Prompt"],
    prompt: "Create a WhatsApp marketing flow for a government agency running a public awareness campaign (e.g. public health, road safety, or civic initiative). Start with a hero image template announcing the campaign with key message and 'Learn More' and 'Share' buttons. Then send a rich image with key facts and statistics. Present an interactive_list of available resources and actions citizens can take. After the citizen selects an action, confirm their participation and ask for feedback with interactive_buttons.",
  },
  {
    id: "gov-program-enrollment",
    title: "Government Program Enrollment",
    description: "Drive citizen enrollment in government programs — subsidies, welfare schemes, grants — with eligibility checks and application guidance.",
    industry: "Government",
    messageType: "marketing",
    tags: ["Program", "Enrollment", "Subsidy", "Grant"],
    flowSteps: ["Program Announcement", "Benefits Overview", "Eligibility Check", "Apply Now", "Application Confirmed"],
    prompt: "Create a WhatsApp marketing flow for a government agency promoting enrollment in a citizen benefit program (e.g. housing subsidy, utility assistance, or skills grant). Start with an image template announcing the program with 'Check Eligibility' and 'Learn More' buttons. After the citizen clicks 'Check Eligibility', walk through an eligibility quiz using interactive_buttons. Then present a carousel of key program benefits with specific amounts and 'Apply Now' buttons. After the citizen selects a benefit from the carousel, guide them through the application steps and confirm their application with a reference number.",
  },
  {
    id: "gov-service-promotion",
    title: "e-Government Service Promotion",
    description: "Promote digital government services — online portals, apps, and e-services — to drive citizen adoption and reduce in-person visits.",
    industry: "Government",
    messageType: "marketing",
    tags: ["Digital Services", "e-Government", "App", "Portal"],
    flowSteps: ["Service Launch", "Feature Showcase", "Download / Register CTA", "Guided Onboarding"],
    prompt: "Create a WhatsApp marketing flow for a government agency promoting adoption of a new digital service (e.g. national ID app, e-permits portal, or tax filing platform). Start with an image template announcing the digital service with 'Download App' and 'Learn Features' buttons. After the citizen clicks 'Learn Features', show a carousel of 3-4 key features with screenshots and 'Try It' buttons. After the citizen selects a feature from the carousel, provide a step-by-step guide for that feature using interactive_buttons for confirmation at each step.",
  },

  // Utility
  {
    id: "gov-appointment-reminder",
    title: "Government Appointment Reminder",
    description: "Send citizens reminders for upcoming government appointments — visa, passport, permit, or health screenings — with reschedule options.",
    industry: "Government",
    messageType: "utility",
    tags: ["Appointment", "Reminder", "Permit", "Passport"],
    flowSteps: ["Appointment Confirmed", "24h Reminder", "Day-of Reminder", "Reschedule Option", "Outcome"],
    prompt: "Create a WhatsApp utility flow for a government agency sending appointment reminders for a citizen appointment (e.g. passport renewal, permit inspection, or vaccination schedule). Confirm the appointment with reference number, location, and required documents. Send a 24-hour reminder with interactive_buttons for 'Confirm Attendance' or 'Reschedule'. On the day, send a final reminder with directions. If the citizen selects 'Reschedule', present an interactive_list of available date/time slots, then confirm the new appointment.",
  },
  {
    id: "gov-permit-status",
    title: "Permit & License Status Update",
    description: "Keep citizens informed on permit and license application status with milestone updates and required document requests.",
    industry: "Government",
    messageType: "utility",
    tags: ["Permit", "License", "Application Status", "Documents"],
    flowSteps: ["Application Received", "Under Review", "Document Request", "Approved / Action Required"],
    prompt: "Create a WhatsApp utility flow for a government agency updating a citizen on their permit or license application status. Confirm receipt with an application reference number. Send an 'Under Review' update with expected timeline. If documents are required, send an interactive_list of the required documents with upload instructions. Finally, send an approval notification with the permit/license details, validity period, and QR code reference.",
  },
  {
    id: "gov-tax-notification",
    title: "Tax Filing & Payment Notification",
    description: "Notify citizens about tax filing deadlines, assessment results, payment due dates, and e-filing guidance.",
    industry: "Government",
    messageType: "utility",
    tags: ["Tax", "Payment", "Filing Deadline", "Assessment"],
    flowSteps: ["Filing Reminder", "Assessment Notice", "Payment Due", "Confirmation"],
    prompt: "Create a WhatsApp utility flow for a tax authority notifying a citizen about their annual tax filing. Send a filing deadline reminder with specific date and 'File Now' and 'View Guide' buttons. After clicking 'View Guide', send an image with the e-filing step-by-step guide. Then send the tax assessment result with breakdown of income, deductions, and payable amount. Present payment options via interactive_list, then confirm payment receipt with a specific transaction reference.",
  },
  {
    id: "gov-emergency-alert",
    title: "Emergency & Public Safety Alert",
    description: "Broadcast emergency alerts — natural disasters, health emergencies, road closures — with instructions and safety resource links.",
    industry: "Government",
    messageType: "utility",
    tags: ["Emergency", "Alert", "Safety", "Disaster"],
    flowSteps: ["Emergency Alert", "Safety Instructions", "Resource Links", "Status Updates"],
    prompt: "Create a WhatsApp utility flow for a government emergency management agency broadcasting a public safety alert (e.g. severe weather warning, road closure, or health advisory). Send an urgent template message with the emergency type, affected area, and 'Safety Instructions' and 'Evacuation Routes' buttons. After the citizen clicks 'Safety Instructions', send detailed step-by-step safety instructions with an image. Then present an interactive_list of emergency resources (hotlines, shelters, first aid). Follow up with a status update when the situation is resolved.",
  },

  // Authentication
  {
    id: "gov-identity-verification",
    title: "Citizen Identity Verification",
    description: "Verify citizen identity via WhatsApp OTP before granting access to sensitive government services or processing applications.",
    industry: "Government",
    messageType: "authentication",
    tags: ["Identity", "OTP", "Verification", "Security"],
    flowSteps: ["Service Access Request", "Identity Check", "OTP Sent", "Access Granted"],
    prompt: "Create a WhatsApp authentication flow for a government agency verifying a citizen's identity before processing a sensitive service request (e.g. benefits application, record access, or account change). Acknowledge the service request with a specific reference number. Send an OTP verification message with the 6-digit code and expiry time. After the citizen confirms receipt, validate the OTP and grant access with a session token and next steps.",
  },
  {
    id: "gov-digital-signature",
    title: "Document Signing & Authorization",
    description: "Facilitate secure digital consent and document authorization for government transactions via WhatsApp verification flow.",
    industry: "Government",
    messageType: "authentication",
    tags: ["Digital Signature", "Consent", "Authorization", "Document"],
    flowSteps: ["Document Request", "Review Summary", "Consent Confirmation", "Authorized"],
    prompt: "Create a WhatsApp authentication flow for a government agency requesting a citizen's digital consent to authorize a transaction or document (e.g. tax declaration consent, medical authorization, or land transfer consent). Send a document summary with key terms and 'Review Details' and 'Decline' buttons. After the citizen reviews, send the full document summary image. Then request explicit consent with interactive_buttons ('I Agree' / 'I Decline'). After the citizen confirms, send an authorization confirmation with a digital reference code and timestamp.",
  },
];

// Sub-verticals are now handled via AI prompt injection, not separate templates

/**
 * Get unique industries from the catalog
 */
export function getCatalogIndustries(): string[] {
  const industries = new Set(TEMPLATE_CATALOG.map(t => t.industry));
  return Array.from(industries).sort();
}

/**
 * Get all E-Commerce templates (sub-vertical context is injected at generation time, not at template level)
 */
export function getEcommerceTemplates(): TemplateUseCase[] {
  return TEMPLATE_CATALOG.filter(t => t.industry === "E-Commerce");
}

/**
 * Get template count by industry
 */
export function getIndustryTemplateCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  TEMPLATE_CATALOG.forEach(t => {
    counts[t.industry] = (counts[t.industry] || 0) + 1;
  });
  return counts;
}

/**
 * Get template count by message type
 */
export function getMessageTypeTemplateCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  TEMPLATE_CATALOG.forEach(t => {
    counts[t.messageType] = (counts[t.messageType] || 0) + 1;
  });
  return counts;
}
