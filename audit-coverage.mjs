// Audit template coverage by industry × message type
import { readFileSync } from 'fs';

const content = readFileSync('shared/templateCatalog.ts', 'utf8');

// Extract all templates
const templates = [];
const regex = /id:\s*"([^"]+)"[\s\S]*?industry:\s*"([^"]+)"[\s\S]*?messageType:\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  templates.push({ id: match[1], industry: match[2], type: match[3] });
}

const INDUSTRIES = [
  "E-Commerce", "Healthcare", "Food & Beverage", "Finance & Banking",
  "Travel & Hospitality", "Education", "Real Estate", "Automotive",
  "Retail", "Technology", "Beauty & Wellness", "Entertainment",
  "Logistics", "Insurance", "Telecommunications",
];

const TYPES = ["marketing", "utility", "authentication"];

console.log(`\n=== TEMPLATE COVERAGE AUDIT ===`);
console.log(`Total templates: ${templates.length}\n`);

// Coverage matrix
console.log("COVERAGE MATRIX (industry × message type):");
console.log("─".repeat(80));
console.log(`${"Industry".padEnd(25)} ${"Marketing".padEnd(12)} ${"Utility".padEnd(12)} ${"Auth".padEnd(12)} Total`);
console.log("─".repeat(80));

const gaps = [];
let totalByType = { marketing: 0, utility: 0, authentication: 0 };

for (const industry of INDUSTRIES) {
  const counts = {};
  for (const type of TYPES) {
    const matching = templates.filter(t => t.industry === industry && t.type === type);
    counts[type] = matching.length;
    totalByType[type] += matching.length;
    
    if (matching.length < 3) {
      gaps.push({ industry, type, current: matching.length, needed: 3 - matching.length });
    }
  }
  const total = counts.marketing + counts.utility + counts.authentication;
  const marker = total < 7 ? " ⚠️" : total < 9 ? " ⚡" : " ✅";
  console.log(`${industry.padEnd(25)} ${String(counts.marketing).padEnd(12)} ${String(counts.utility).padEnd(12)} ${String(counts.authentication).padEnd(12)} ${total}${marker}`);
}

console.log("─".repeat(80));
console.log(`${"TOTAL".padEnd(25)} ${String(totalByType.marketing).padEnd(12)} ${String(totalByType.utility).padEnd(12)} ${String(totalByType.authentication).padEnd(12)} ${templates.length}`);

// Gap analysis
console.log(`\n=== COVERAGE GAPS (< 3 templates per type) ===`);
console.log(`Found ${gaps.length} gaps:\n`);
for (const gap of gaps) {
  console.log(`  ${gap.industry} / ${gap.type}: ${gap.current} templates (need ${gap.needed} more)`);
}

// Identify missing high-value use cases per industry
console.log(`\n=== MISSING HIGH-VALUE USE CASES ===\n`);

const IDEAL_TEMPLATES = {
  "E-Commerce": {
    marketing: ["Flash Sale", "New Arrivals", "Abandoned Cart", "Cross-sell", "Loyalty Rewards", "Seasonal Campaign", "Referral Program", "VIP Early Access"],
    utility: ["Order Tracking", "Return/Exchange", "Price Drop Alert", "Wishlist Restock", "Delivery Rescheduling"],
    authentication: ["Login OTP", "Payment Verification", "Account Recovery"],
  },
  Healthcare: {
    marketing: ["Health Screening", "Wellness Program", "Vaccination Drive", "Telemedicine Promo", "Specialist Introduction", "Preventive Care Tips"],
    utility: ["Appointment Reminder", "Lab Results", "Prescription Refill", "Post-Visit Follow-up", "Insurance Claim Status"],
    authentication: ["Patient Portal", "Prescription Verification", "Insurance Verification"],
  },
  "Food & Beverage": {
    marketing: ["Re-engagement", "Daily Specials", "Loyalty Program", "Catering Promo", "New Menu Launch", "Happy Hour", "Festival Special"],
    utility: ["Order Confirmation", "Delivery Tracking", "Reservation Reminder", "Feedback Collection", "Receipt"],
    authentication: ["Account Verify", "Payment Confirm", "Loyalty Card Link"],
  },
  "Finance & Banking": {
    marketing: ["Credit Card Promo", "Loan Offer", "Investment Alert", "Insurance Cross-sell", "Wealth Management", "Savings Campaign"],
    utility: ["Transaction Alert", "Statement Ready", "EMI Reminder", "KYC Update", "Card Activation"],
    authentication: ["Transaction OTP", "Account Login", "Beneficiary Verification"],
  },
  "Travel & Hospitality": {
    marketing: ["Destination Deal", "Early Bird Offer", "Itinerary Builder", "Loyalty Tier Upgrade", "Group Package", "Last-Minute Deal"],
    utility: ["Booking Confirmation", "Check-in Reminder", "Flight Status", "Concierge Service", "Checkout Feedback"],
    authentication: ["Booking Verification", "Loyalty Login", "Travel Document Verify"],
  },
  Education: {
    marketing: ["Open Day", "Scholarship", "New Course", "Live Class Promo", "Alumni Success", "Workshop Series"],
    utility: ["Enrollment Confirm", "Class Reminder", "Exam Results", "Fee Payment", "Assignment Deadline"],
    authentication: ["Student Portal", "Exam Verification", "Certificate Verify"],
  },
  "Real Estate": {
    marketing: ["New Listing", "Open House", "Virtual Tour", "Price Drop", "Investment Opportunity", "Luxury Collection"],
    utility: ["Viewing Confirmation", "Document Checklist", "Construction Update", "Payment Schedule", "Handover Prep"],
    authentication: ["Buyer Verification", "Document Signing", "Payment Authorization"],
  },
  Automotive: {
    marketing: ["New Model Launch", "Service Promo", "Trade-In Offer", "Accessories Catalog", "EV Showcase", "Certified Pre-Owned"],
    utility: ["Service Reminder", "Trade-In Status", "Insurance Renewal", "Recall Notice", "Delivery Update"],
    authentication: ["Service Login", "Test Drive Verify", "Finance Application"],
  },
  Retail: {
    marketing: ["Seasonal Sale", "Membership", "Product Restock", "Personal Shopper", "Gift Guide", "Store Opening"],
    utility: ["Pickup Ready", "Warranty", "Order Status", "Exchange Process", "Receipt"],
    authentication: ["Account Verify", "Return Authorization", "Gift Card Activation"],
  },
  Technology: {
    marketing: ["Product Launch", "SaaS Trial", "Webinar", "Product Waitlist", "Feature Announcement", "Partner Program"],
    utility: ["Subscription Renewal", "Incident Alert", "Onboarding Guide", "Usage Report", "Maintenance Window"],
    authentication: ["Login OTP", "API Key Rotation", "Two-Factor Setup"],
  },
  "Beauty & Wellness": {
    marketing: ["Product Launch", "Spa Promo", "Personalized", "Spa Package", "Seasonal Treatment", "Referral Reward"],
    utility: ["Appointment Reminder", "Aftercare", "Product Reorder", "Membership Renewal", "Feedback"],
    authentication: ["Membership Verify", "Booking Confirm", "Gift Voucher Redeem"],
  },
  Entertainment: {
    marketing: ["Event Promo", "Streaming", "Membership", "VIP Upgrade", "Festival Lineup", "Early Bird Tickets"],
    utility: ["Ticket Confirm", "Schedule Update", "Venue Directions", "Post-Event Survey", "Subscription Renewal"],
    authentication: ["Account Verify", "Ticket Transfer", "Age Verification"],
  },
  Logistics: {
    marketing: ["Business Solutions", "Warehouse", "Last Mile", "Express Service", "International Shipping", "Bulk Discount"],
    utility: ["Shipment Tracking", "Customs", "Reschedule", "Proof of Delivery", "Invoice Ready"],
    authentication: ["Pickup Verify", "Receiver Confirm", "Account Setup"],
  },
  Insurance: {
    marketing: ["Health Plan", "Life Policy", "Bundle", "Motor Insurance", "Travel Cover", "Family Protection"],
    utility: ["Claim Status", "Renewal", "Fast Track", "Policy Document", "Premium Due"],
    authentication: ["Claim Verify", "Policy Login", "Nominee Verification"],
  },
  Telecommunications: {
    marketing: ["Plan Upgrade", "Device Offer", "Family Plan", "Plan Upgrade V2", "5G Migration", "Prepaid Recharge"],
    utility: ["Data Usage", "Bill Ready", "Network Outage", "Roaming Activation", "Number Porting"],
    authentication: ["SIM Swap", "eSIM Activation", "Account Recovery"],
  },
};

for (const industry of INDUSTRIES) {
  const existing = templates.filter(t => t.industry === industry);
  const existingIds = existing.map(t => t.id);
  const ideal = IDEAL_TEMPLATES[industry];
  if (!ideal) continue;
  
  const missing = [];
  for (const type of TYPES) {
    const existingOfType = existing.filter(t => t.type === type);
    const idealOfType = ideal[type] || [];
    if (existingOfType.length < idealOfType.length) {
      const deficit = idealOfType.length - existingOfType.length;
      missing.push(`${type}: need ${deficit} more (have ${existingOfType.length}, ideal ${idealOfType.length})`);
    }
  }
  
  if (missing.length > 0) {
    console.log(`${industry} (${existing.length} templates):`);
    missing.forEach(m => console.log(`  ${m}`));
    console.log();
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Current: ${templates.length} templates`);
console.log(`Target: ~${INDUSTRIES.length * 8} templates (avg 8 per industry)`);
console.log(`Gap: ~${Math.max(0, INDUSTRIES.length * 8 - templates.length)} new templates needed`);
