export interface SeasonalMoment {
  id: string;
  name: string;
  description: string;
  campaignContext: string;
  promoAngles: string[];
  category: "Major Shopping Events" | "Cultural & Religious" | "Seasonal" | "Industry-Specific";
}

export const SEASONAL_MOMENTS: SeasonalMoment[] = [
  // ==================== MAJOR SHOPPING EVENTS ====================
  {
    id: "black-friday",
    name: "Black Friday",
    description: "Biggest shopping day of the year — massive discounts and flash sales",
    campaignContext: "Black Friday is the single highest-converting shopping day of the year. Customers are primed to buy and actively hunting for deals. Create urgency with countdown timers, exclusive early access, and doorbusters. Flash sales that expire within hours outperform generic promotions.",
    promoAngles: ["Flash sale with countdown", "Early access for loyal customers", "Doorbuster limited-quantity deal", "Bundle savings"],
    category: "Major Shopping Events",
  },
  {
    id: "cyber-monday",
    name: "Cyber Monday",
    description: "Online-focused deals day following Black Friday",
    campaignContext: "Cyber Monday is peak for digital and online purchases. Customers who missed Black Friday deals are still in buying mode. Emphasize online exclusives, free shipping, and tech/digital product promotions. Extended 24-hour deals work well.",
    promoAngles: ["Online exclusive deal", "Free shipping offer", "Digital product discount", "Extended sale window"],
    category: "Major Shopping Events",
  },
  {
    id: "singles-day",
    name: "11.11 Singles Day",
    description: "World's largest shopping event, originated in China — now global",
    campaignContext: "11.11 has grown into a global mega-sale event. Position it as a treat-yourself moment. Massive discounts (50–70% off) are expected. Build anticipation with pre-sale wishlists and early bird access. Works across all product categories.",
    promoAngles: ["Self-gifting campaign", "Countdown to 11.11", "Pre-sale wishlist lock-in", "Flash hourly deals"],
    category: "Major Shopping Events",
  },
  {
    id: "12-12",
    name: "12.12 Year-End Sale",
    description: "End-of-year mega-sale popular in Southeast Asia",
    campaignContext: "12.12 is a year-end celebration sale popular in SEA markets. Customers are clearing year-end budgets and buying last-minute gifts. Push clearance, year-end bundles, and category-wide discounts. Last chance to hit annual targets.",
    promoAngles: ["Year-end clearance", "Last chance deals", "Gift bundle packs", "Category-wide discount"],
    category: "Major Shopping Events",
  },
  {
    id: "christmas",
    name: "Christmas",
    description: "Peak gifting season — December holiday shopping rush",
    campaignContext: "Christmas is the premier gifting season globally. Customers are buying for others, making them less price-sensitive but more quality-focused. Emphasize gift sets, premium packaging, and gifting guides. Deadlines around shipping cutoffs create natural urgency.",
    promoAngles: ["Gift set bundles", "Premium packaging upgrade", "Gift guide recommendation", "Last-order shipping deadline"],
    category: "Major Shopping Events",
  },
  {
    id: "new-year",
    name: "New Year's",
    description: "Fresh-start mindset drives resolutions and renewal purchases",
    campaignContext: "New Year's triggers a fresh-start psychology. People are motivated to improve their lives, establish habits, and start new routines. This is prime time for subscriptions, health/wellness products, planning tools, and self-improvement services.",
    promoAngles: ["New year resolution support", "Fresh start offer", "Annual subscription deal", "Goal-setting toolkit"],
    category: "Major Shopping Events",
  },
  {
    id: "valentines-day",
    name: "Valentine's Day",
    description: "Romance and gifting occasion — February 14",
    campaignContext: "Valentine's Day is a strong gifting and experience occasion. Customers are buying for partners or treating themselves. Emphasize romantic experiences, curated gift pairs, and premium editions. Last-minute buyers (Feb 12–13) convert well with express delivery offers.",
    promoAngles: ["Couples gift set", "Experience or date package", "Personalized/custom gift", "Express delivery for last-minute"],
    category: "Major Shopping Events",
  },
  {
    id: "mothers-day",
    name: "Mother's Day",
    description: "Gifting occasion celebrating mothers and maternal figures",
    campaignContext: "Mother's Day is one of the highest gift-spending occasions of the year. Buyers are emotionally motivated and willing to spend on something meaningful. Focus on pampering, personalization, and premium feel. Remind customers of the emotional story behind the purchase.",
    promoAngles: ["Pampering gift set", "Personalized gift with message", "Premium experience gift", "Family group gift coordination"],
    category: "Major Shopping Events",
  },

  // ==================== CULTURAL & RELIGIOUS ====================
  {
    id: "chinese-new-year",
    name: "Chinese New Year",
    description: "Lunar New Year — major gifting and celebration season across Asia",
    campaignContext: "Chinese New Year is the most important gifting and celebration season for Chinese communities globally. Red packets (ang pow), festive hampers, and reunion-themed gifts dominate. Auspicious messaging, lucky numbers (8, 88), and prosperity themes resonate strongly. The 15-day celebration window gives multiple campaign moments.",
    promoAngles: ["Festive hamper gift set", "Red packet / ang pow promo", "Prosperity bundle", "Limited-edition CNY packaging"],
    category: "Cultural & Religious",
  },
  {
    id: "hari-raya",
    name: "Hari Raya Aidilfitri",
    description: "End of Ramadan celebration — major gifting season in Muslim communities",
    campaignContext: "Hari Raya Aidilfitri marks the end of Ramadan with a period of forgiveness, gratitude, and celebration. Gifting is central — hampers, biscuits, clothes, and home goods are popular. 'Balik kampung' (homecoming) travel and family reunion spending spikes. Raya campaigns work well 2–3 weeks before the holiday.",
    promoAngles: ["Raya hamper gift set", "Open house essentials bundle", "Raya wardrobe refresh", "Family reunion experience"],
    category: "Cultural & Religious",
  },
  {
    id: "deepavali",
    name: "Deepavali",
    description: "Festival of Lights — celebrated by Hindu communities globally",
    campaignContext: "Deepavali is the Festival of Lights, symbolizing the triumph of light over darkness. Key purchase categories include gold jewelry, new clothes, home decorations, sweets, and fireworks. Premium and traditional aesthetics work well. Family and community gifting is central.",
    promoAngles: ["Festive sweet / gift hamper", "Gold or jewelry promotion", "Home decor lighting bundle", "Premium festive packaging"],
    category: "Cultural & Religious",
  },
  {
    id: "ramadan",
    name: "Ramadan",
    description: "Holy month of fasting and spiritual reflection for Muslims",
    campaignContext: "Ramadan is a month of fasting, reflection, and community for Muslims worldwide. Consumer behavior shifts significantly — nighttime spending increases, F&B promotions for Sahur/Iftar perform strongly, and charitable giving peaks. Tone should be warm, reflective, and community-focused rather than sales-aggressive.",
    promoAngles: ["Iftar / Sahur meal bundle", "Charitable donation match", "Family gathering package", "Ramadan essentials bundle"],
    category: "Cultural & Religious",
  },
  {
    id: "diwali",
    name: "Diwali / Diwali Season",
    description: "Broader Diwali shopping season in South Asian communities",
    campaignContext: "The Diwali season spans several weeks and is the peak shopping period in India and South Asian diaspora markets. Corporate gifting, electronics, appliances, and apparel see major spikes. Gold and jewelry are traditional purchases. B2B gifting to employees and clients is extremely common.",
    promoAngles: ["Corporate gift hamper", "Electronics upgrade offer", "Gold / jewelry festive deal", "Employee appreciation bundle"],
    category: "Cultural & Religious",
  },
  {
    id: "thanksgiving",
    name: "Thanksgiving",
    description: "Gratitude and gathering occasion — prelude to holiday shopping",
    campaignContext: "Thanksgiving kicks off the holiday shopping season in North America. It's a gratitude-focused occasion that primes consumers for the Black Friday weekend. Brand messaging around appreciation, community, and giving resonates. Use Thanksgiving as a warm-up to your Black Friday campaign.",
    promoAngles: ["Early holiday preview", "Gratitude customer appreciation offer", "Friends & family discount", "Pre-Black Friday access"],
    category: "Cultural & Religious",
  },
  {
    id: "easter",
    name: "Easter",
    description: "Spring celebration with strong gifting and family gathering themes",
    campaignContext: "Easter combines religious significance with widespread spring celebration. Key categories: confectionery (chocolate eggs/bunnies), children's gifts, family gatherings, spring fashion, and home refreshes. Family and children-oriented messaging performs strongly.",
    promoAngles: ["Easter gift basket", "Children's gift promotion", "Spring collection launch", "Family activity bundle"],
    category: "Cultural & Religious",
  },
  {
    id: "holi",
    name: "Holi",
    description: "Festival of Colors — joyful Hindu spring festival",
    campaignContext: "Holi is the vibrant Festival of Colors celebrated with joy, renewal, and community. It marks the arrival of spring. Brands can leverage the color, playfulness, and energy themes. Fashion, beauty, outdoor, and F&B categories all have strong play during Holi.",
    promoAngles: ["Colorful limited edition product", "Spring refresh collection", "Festival experience package", "Community celebration bundle"],
    category: "Cultural & Religious",
  },
  {
    id: "mid-autumn",
    name: "Mid-Autumn Festival",
    description: "Mooncake festival — major gifting occasion in Chinese communities",
    campaignContext: "The Mid-Autumn Festival (Mooncake Festival) is a major gifting occasion in Chinese and Vietnamese communities. Mooncakes and lanterns are iconic, but premium hampers and corporate gifting are widespread. Brands in luxury, food, and lifestyle do extremely well with beautifully packaged gift sets.",
    promoAngles: ["Mooncake / festive hamper gift", "Corporate gifting set", "Premium limited-edition packaging", "Lantern celebration bundle"],
    category: "Cultural & Religious",
  },
  {
    id: "fathers-day",
    name: "Father's Day",
    description: "Gifting occasion celebrating fathers and paternal figures",
    campaignContext: "Father's Day is a strong gifting occasion, though typically less high-spending than Mother's Day. Buyers want practical yet meaningful gifts — gadgets, experiences, grooming, and premium food/drinks perform well. Humor and personality-driven campaigns work well for this audience.",
    promoAngles: ["Practical premium gift set", "Experience or activity gift", "Grooming / lifestyle bundle", "Personalized keepsake gift"],
    category: "Cultural & Religious",
  },
  {
    id: "childrens-day",
    name: "Children's Day",
    description: "Celebration of children — varies by country (October 1, November 20, etc.)",
    campaignContext: "Children's Day is a strong occasion for parents buying gifts for their kids and for family-oriented brands. Toys, educational products, kids' clothing, and family experiences perform well. Wholesome, joyful messaging centered on children's happiness and growth resonates.",
    promoAngles: ["Kids gift bundle", "Educational toy / product promo", "Family experience package", "Children's wardrobe refresh"],
    category: "Cultural & Religious",
  },
  {
    id: "womens-day",
    name: "International Women's Day",
    description: "Global celebration of women — March 8",
    campaignContext: "International Women's Day (March 8) has become a major commercial occasion for women-oriented brands. Empowerment, self-care, and celebration themes resonate. Beauty, wellness, fashion, and professional development products see spikes. Authenticity matters — avoid performative messaging.",
    promoAngles: ["Self-care treat-yourself offer", "Women's empowerment bundle", "Celebratory gift for her", "Workplace / professional offer"],
    category: "Cultural & Religious",
  },
  {
    id: "halloween",
    name: "Halloween",
    description: "Spooky celebration — costumes, candy, and themed events",
    campaignContext: "Halloween is a fun, creativity-driven occasion that spans all demographics in Western markets. Costumes, candy, themed parties, and home decorations drive purchases. Brands can leverage spooky/playful themes across many categories. Limited-edition Halloween packaging converts extremely well.",
    promoAngles: ["Limited-edition Halloween packaging", "Costume / themed product bundle", "Spooky promo or mystery deal", "Halloween party essentials"],
    category: "Cultural & Religious",
  },

  // ==================== SEASONAL ====================
  {
    id: "summer-sale",
    name: "Summer Sale",
    description: "Mid-year summer season promotion and clearance",
    campaignContext: "The summer season drives category-specific demand shifts — travel, outdoor activities, cooling products, summer fashion, and F&B for hot weather. It's also a mid-year clearance opportunity for winter/spring inventory. 'Summer vibes' energy translates into campaigns with warmth, freedom, and adventure themes.",
    promoAngles: ["Summer essentials bundle", "Travel / outdoor gear promo", "Mid-year clearance sale", "Seasonal limited edition"],
    category: "Seasonal",
  },
  {
    id: "back-to-school",
    name: "Back to School",
    description: "Late-summer school preparation season — stationery, bags, uniforms",
    campaignContext: "Back to School is a high-urgency seasonal moment driven by deadlines — school starts on a fixed date. Parents are purchasing stationery, bags, uniforms, electronics, and supplies. Budget-focused messaging works well, as does bundles that solve multiple needs in one purchase.",
    promoAngles: ["School supplies bundle", "Back-to-school checklist deal", "Student device or tech offer", "Uniform / wardrobe bundle"],
    category: "Seasonal",
  },
  {
    id: "year-end-clearance",
    name: "Year-End Clearance",
    description: "Final push to clear inventory before the new year",
    campaignContext: "Year-end clearance campaigns serve two goals: clearing old inventory and giving customers a final savings opportunity before the year closes. Messaging around 'last chance', 'final days', and 'closing the year' creates natural urgency without manufacturing fake scarcity.",
    promoAngles: ["Stock clearance deal", "Final days of the year offer", "Category closeout pricing", "Year-end rewards redemption"],
    category: "Seasonal",
  },
  {
    id: "mid-year-sale",
    name: "Mid-Year Sale",
    description: "June/July mid-year shopping event common in SEA and AU",
    campaignContext: "Mid-year sales (June–July) have become established shopping events in markets like Malaysia, Singapore, and Australia. Positioned as the 'second Black Friday', these sales clear first-half inventory and drive mid-year revenue targets. Strong discount expectations, so lead with savings.",
    promoAngles: ["Mid-year megasale offer", "First-half clearance deal", "Category-wide discount event", "Member-exclusive preview"],
    category: "Seasonal",
  },
  {
    id: "spring-launch",
    name: "Spring Collection Launch",
    description: "New season arrival — spring fashion and product refreshes",
    campaignContext: "Spring signifies renewal, freshness, and new beginnings. This is a prime moment to launch new collections, seasonal flavors, or fresh product lines. Customers are energized after winter and receptive to 'new' messaging. Spring aesthetics — light, bright, blooming — complement the campaign feel.",
    promoAngles: ["New collection arrival", "Season refresh offer", "Spring limited edition", "Renewal / fresh-start campaign"],
    category: "Seasonal",
  },
  {
    id: "winter-collection",
    name: "Winter Collection / Holiday Season",
    description: "Winter season arrivals and cozy-season purchases",
    campaignContext: "The winter season drives demand for warm clothing, hot beverages, comfort food, home goods, and holiday gifting. Cozy, warm, and festive aesthetics drive engagement. The holiday season overlay (Christmas, NYE) amplifies this further — position products as making the season better.",
    promoAngles: ["Winter wardrobe essentials", "Cozy season bundle", "Holiday limited edition", "Gift-ready packaging offer"],
    category: "Seasonal",
  },
  {
    id: "payday",
    name: "Payday Sale",
    description: "End-of-month or mid-month payday promotions",
    campaignContext: "Payday campaigns target the predictable spending spike when customers receive their salary. Timing precision matters — launch the campaign 1–2 days before payday. Messaging around 'reward yourself', 'you've earned it', and treating the month's work resonates strongly.",
    promoAngles: ["Payday treat-yourself offer", "End-of-month reward deal", "Salary day exclusive promo", "Weekend splurge bundle"],
    category: "Seasonal",
  },
  {
    id: "flash-sale",
    name: "Flash Sale / Limited-Time Event",
    description: "Time-limited urgency sale — 24 hours or less",
    campaignContext: "Flash sales work through scarcity and urgency. The short time window (often 12–24 hours) creates a FOMO response that drives immediate conversion. Clear countdown, limited quantities, and 'only X units left' messaging are critical. Best deployed for re-engagement and cart abandonment recovery.",
    promoAngles: ["24-hour flash deal", "Limited quantity offer", "FOMO urgency push", "Exclusive member flash sale"],
    category: "Seasonal",
  },

  // ==================== INDUSTRY-SPECIFIC ====================
  {
    id: "world-health-day",
    name: "World Health Day",
    description: "April 7 — global health awareness, strong for wellness/healthcare brands",
    campaignContext: "World Health Day (April 7) is a credible platform for health, wellness, fitness, and medical brands to reinforce their mission. Campaigns that educate, offer health screenings, or promote preventive care perform authentically. Avoid pure discount-pushing — lead with health value.",
    promoAngles: ["Free health screening / consultation", "Wellness bundle promo", "Health awareness education campaign", "Annual checkup package deal"],
    category: "Industry-Specific",
  },
  {
    id: "world-mental-health-day",
    name: "World Mental Health Day",
    description: "October 10 — mental wellness awareness for relevant brands",
    campaignContext: "World Mental Health Day (October 10) is relevant for mental health platforms, wellness apps, HR tools, and therapy services. Campaigns that reduce stigma, provide resources, or offer genuine access to support resonate. Tone must be empathetic, warm, and non-exploitative.",
    promoAngles: ["Free trial / access to mental wellness tool", "Employer mental health package", "Awareness + resource campaign", "Community support initiative"],
    category: "Industry-Specific",
  },
  {
    id: "tax-season",
    name: "Tax Season",
    description: "Annual tax filing period — strong for financial and accounting services",
    campaignContext: "Tax season is a high-stress, high-urgency period for individuals and businesses. Financial services, accounting software, and tax consultants can deliver high-value messaging around saving time, reducing errors, and maximizing refunds. Urgency builds naturally around tax deadlines.",
    promoAngles: ["Tax filing service promo", "Accounting software deal", "Early filer discount", "Business tax planning package"],
    category: "Industry-Specific",
  },
  {
    id: "back-to-university",
    name: "Back to University",
    description: "University enrollment season — student-focused products and services",
    campaignContext: "Back to university season targets students starting or returning to higher education. Key purchases: laptops, software subscriptions, banking accounts, insurance, housing essentials, and course materials. Student discount framing and bundle pricing convert well.",
    promoAngles: ["Student tech bundle", "University starter pack", "Student discount subscription", "First-year essentials offer"],
    category: "Industry-Specific",
  },
  {
    id: "world-food-day",
    name: "World Food Day",
    description: "October 16 — relevant for F&B, agriculture, and nutrition brands",
    campaignContext: "World Food Day (October 16) is a platform for food brands to emphasize quality, sustainability, and nutrition. Farm-to-table, locally sourced, and sustainable food messaging has strong resonance. F&B brands can tie in special menus, charity partnerships, or community food initiatives.",
    promoAngles: ["Sustainability-focused food offer", "Local farm sourcing highlight", "Community meal donation campaign", "Special World Food Day menu"],
    category: "Industry-Specific",
  },
  {
    id: "world-environment-day",
    name: "World Environment Day",
    description: "June 5 — sustainability and eco-friendly campaigns",
    campaignContext: "World Environment Day (June 5) is a strong platform for eco-friendly, sustainable, and ethical brands. Campaigns that demonstrate genuine environmental commitment — tree planting, carbon offsets, packaging changes — outperform generic green-washing. Authentic impact stories work best.",
    promoAngles: ["Eco-friendly product promotion", "Sustainability pledge campaign", "Carbon offset purchase add-on", "Recycling / return program launch"],
    category: "Industry-Specific",
  },
  {
    id: "travel-season",
    name: "Peak Travel Season",
    description: "School holiday and travel booking season for travel and hospitality",
    campaignContext: "Peak travel seasons (school holidays, long weekends, festive periods) are when travel intent spikes. Early booking incentives, family packages, and destination bundles perform best. Travel brands should capture intent early — customers plan and book weeks or months ahead.",
    promoAngles: ["Early bird travel deal", "Family holiday package", "Last-minute getaway offer", "Loyalty points redemption campaign"],
    category: "Industry-Specific",
  },
  {
    id: "property-season",
    name: "Property Launch Season",
    description: "Major property fair / launch periods for real estate",
    campaignContext: "Property launches and housing fairs concentrate buyer intent into specific windows. Developers and agents can leverage these periods for showroom visits, exclusive pricing, and limited-unit urgency. Messaging should focus on life milestones, investment value, and the 'perfect home' aspiration.",
    promoAngles: ["Exclusive unit launch preview", "Property fair special pricing", "Home ownership incentive", "Investment property ROI pitch"],
    category: "Industry-Specific",
  },
  {
    id: "graduation-season",
    name: "Graduation Season",
    description: "May/June graduation period — gifts, celebrations, and career transitions",
    campaignContext: "Graduation season (typically May–July) marks a major life transition. Gifting is strong — from families buying for graduates and graduates treating themselves. Career services, financial products for young adults, lifestyle upgrades, and celebratory experiences all perform well.",
    promoAngles: ["Graduation gift bundle", "Life milestone celebration offer", "Career starter package", "Graduate exclusive deal"],
    category: "Industry-Specific",
  },
  {
    id: "financial-year-end",
    name: "Financial Year-End",
    description: "Corporate budget flush — B2B procurement and software renewals",
    campaignContext: "Financial year-end (varies by country: March 31, June 30, December 31) triggers corporate budget spending. Companies with unspent budget must allocate it before year-end. B2B brands should position offers as smart budget deployment. Procurement decisions accelerate significantly in the last 4–6 weeks of the financial year.",
    promoAngles: ["Use-it-or-lose-it budget offer", "Annual license renewal deal", "Corporate procurement package", "Year-end upgrade incentive"],
    category: "Industry-Specific",
  },
  {
    id: "insurance-renewal",
    name: "Insurance Renewal Season",
    description: "Annual insurance renewal period — life, vehicle, health, property",
    campaignContext: "Insurance renewal campaigns target customers approaching their annual policy renewal. Switching intent peaks at renewal time. Comparison, value, and coverage gap messaging work well. Early renewal discounts and multi-policy bundles are strong conversion drivers.",
    promoAngles: ["Renewal discount offer", "Policy upgrade bundle", "Switch and save campaign", "Coverage gap review offer"],
    category: "Industry-Specific",
  },
  {
    id: "sports-season",
    name: "Major Sports Event",
    description: "World Cup, Olympics, major league seasons — sports and lifestyle brands",
    campaignContext: "Major sporting events (FIFA World Cup, Olympics, Super Bowl, etc.) create massive shared attention windows. Brands in sports, F&B, electronics, and lifestyle can ride the cultural moment. Watch parties, team merchandise, and performance gear see demand spikes. Patriotism and team spirit themes drive engagement.",
    promoAngles: ["Match day bundle offer", "Team merchandise promotion", "Watch party essentials pack", "Sports performance gear deal"],
    category: "Industry-Specific",
  },
  {
    id: "wedding-season",
    name: "Wedding Season",
    description: "Peak wedding months — relevant for events, fashion, gifts, and hospitality",
    campaignContext: "Wedding season varies by region but typically peaks in certain months (e.g., Oct–Feb in SEA, June–September in Western markets). Vendors across catering, photography, fashion, venues, travel, and gifting all benefit. Packages and all-inclusive offers reduce decision fatigue for busy couples.",
    promoAngles: ["Wedding package bundle", "Bridal or groom offer", "Registry or gift promotion", "Honeymoon travel package"],
    category: "Industry-Specific",
  },
  {
    id: "harvest-festival",
    name: "Harvest Festival",
    description: "Harvest and agricultural celebration seasons — varies by region",
    campaignContext: "Harvest festivals (Pongal, Onam, Gawai, Kadayawan, etc.) celebrate agricultural abundance and cultural heritage. These are community-focused events with strong local identity. Brands with regional roots or local sourcing can authentically participate. Food, traditional clothing, and home goods see strong demand.",
    promoAngles: ["Traditional product celebration offer", "Local harvest bundle", "Community / cultural gift set", "Heritage-themed limited edition"],
    category: "Industry-Specific",
  },
  {
    id: "anniversary-sale",
    name: "Brand Anniversary Sale",
    description: "Company founding anniversary — milestone celebration and loyalty campaign",
    campaignContext: "Brand anniversaries are an authentic occasion to celebrate with customers who have been part of the journey. Milestone numbers (1st, 5th, 10th) carry emotional weight. Loyal customer rewards, throwback pricing, and 'founding story' messaging resonate. These campaigns typically generate strong organic sharing.",
    promoAngles: ["Anniversary member exclusive offer", "Throwback founding-day pricing", "Loyalty reward redemption event", "Milestone bundle celebration"],
    category: "Industry-Specific",
  },
  {
    id: "mega-sale-campaign",
    name: "Platform Mega Sale (Shopee / Lazada / TikTok)",
    description: "E-commerce platform mega sale events — 3.3, 4.4, 6.6, 7.7, 8.8, 9.9, 10.10",
    campaignContext: "E-commerce platform mega sales (3.3, 4.4, 6.6, 7.7, 8.8, 9.9, 10.10) have become monthly shopping events across Southeast Asia. Platform algorithms favor participating sellers with increased visibility. Campaigns should emphasize platform-exclusive pricing, vouchers, and free shipping. Coordinating WhatsApp messages with platform promotions maximizes conversion.",
    promoAngles: ["Platform exclusive voucher", "Mega sale preview / early access", "Free shipping bundle offer", "Flash deal during sale window"],
    category: "Industry-Specific",
  },
];

export function getSeasonalMomentsByCategory(): Record<string, SeasonalMoment[]> {
  const result: Record<string, SeasonalMoment[]> = {};
  for (const moment of SEASONAL_MOMENTS) {
    if (!result[moment.category]) {
      result[moment.category] = [];
    }
    result[moment.category].push(moment);
  }
  return result;
}

export function getSeasonalMomentById(id: string): SeasonalMoment | undefined {
  return SEASONAL_MOMENTS.find((m) => m.id === id);
}
