/**
 * Image Relevance Audit Script v2
 * Tests the new precision matching algorithm
 */

// Import the semantic patterns and keyword rules from the new implementation
const SEMANTIC_PATTERNS = [
  { pattern: /headshot|portrait|profile\s*photo|professional\s*photo/i, category: "headshot", score: 25 },
  { pattern: /customer\s*support|call\s*center|help\s*desk|support\s*rep/i, category: "support", score: 25 },
  { pattern: /team\s*photo|group\s*photo|team\s*meeting|colleagues/i, category: "team", score: 25 },
  { pattern: /hair\s*salon|salon\s*interior|styling\s*chair|barber\s*shop/i, category: "salon", score: 25 },
  { pattern: /hair\s*styl|hairdress|hair\s*cut/i, category: "salon", score: 25 },
  { pattern: /hair\s*serum|hair\s*product|shampoo|conditioner|hair\s*oil/i, category: "haircare", score: 25 },
  { pattern: /skin\s*care|moisturiz|facial\s*cream|serum\s*bottle|face\s*wash/i, category: "skincare", score: 25 },
  { pattern: /makeup\s*palette|makeup\s*brush|lipstick|foundation|mascara/i, category: "makeup", score: 25 },
  { pattern: /nail\s*polish|manicure|pedicure|nail\s*art/i, category: "nails", score: 25 },
  { pattern: /essential\s*oil|aromatherap|spa\s*treatment|facial\s*treatment/i, category: "spa", score: 25 },
  { pattern: /doctor|physician|medical\s*professional|stethoscope|white\s*coat/i, category: "doctor", score: 25 },
  { pattern: /dentist|dental\s*(?:clinic|professional|equipment|chair)/i, category: "dental", score: 25 },
  { pattern: /blood\s*test|lab(?:oratory)?|test\s*tube|microscope|clinical/i, category: "laboratory", score: 25 },
  { pattern: /hospital|medical\s*(?:clinic|center|facility)|emergency\s*room/i, category: "hospital", score: 25 },
  { pattern: /vaccin|syringe|injection|medical\s*suppl/i, category: "medicine", score: 25 },
  { pattern: /telemedicine|telehealth|virtual\s*consult/i, category: "doctor", score: 25 },
  { pattern: /health\s*screen|health\s*check|medical\s*exam/i, category: "health", score: 25 },
  { pattern: /protein\s*shake|supplement|vitamin|whey/i, category: "supplement", score: 25 },
  { pattern: /personal\s*trainer|fitness\s*coach/i, category: "gym", score: 25 },
  { pattern: /pizza|margherita|pepperoni/i, category: "pizza", score: 25 },
  { pattern: /burger|hamburger|cheeseburger/i, category: "burger", score: 25 },
  { pattern: /sushi|sashimi|maki\s*roll/i, category: "sushi", score: 25 },
  { pattern: /coffee\s*cup|latte|cappuccino|espresso/i, category: "coffee", score: 25 },
  { pattern: /cocktail|martini|mixed\s*drink/i, category: "cocktail", score: 25 },
  { pattern: /wine\s*(?:bottle|glass)|vineyard|sommelier/i, category: "wine", score: 20 },
  { pattern: /steak|grilled\s*meat|bbq|barbecue/i, category: "steak", score: 25 },
  { pattern: /restaurant\s*interior|dining\s*(?:room|table|area)|fine\s*dining|table\s*setting/i, category: "restaurant", score: 35 },
  { pattern: /smoothie\s*bowl|smoothie/i, category: "smoothie", score: 25 },
  { pattern: /bakery|fresh\s*bread|pastry|croissant/i, category: "bakery", score: 25 },
  { pattern: /ice\s*cream|gelato|frozen\s*yogurt/i, category: "icecream", score: 25 },
  { pattern: /smart\s*phone|mobile\s*phone|iphone|android\s*phone/i, category: "phone", score: 25 },
  { pattern: /laptop|notebook\s*computer|macbook/i, category: "laptop", score: 20 },
  { pattern: /headphone|earphone|earbud|airpod/i, category: "headphones", score: 25 },
  { pattern: /smart\s*watch|fitness\s*track|apple\s*watch/i, category: "smartwatch", score: 25 },
  { pattern: /gaming\s*(?:setup|console|pc|chair|controller)/i, category: "gaming", score: 25 },
  { pattern: /smart\s*home|home\s*automation|iot\s*device/i, category: "technology", score: 25 },
  { pattern: /5g|network\s*tower|telecom|telecommun|cell\s*tower|sim\s*card/i, category: "telecom", score: 25 },
  { pattern: /data\s*plan|mobile\s*plan|broadband/i, category: "telecom", score: 25 },
  { pattern: /sedan|hatchback|car\s*(?:model|showroom|interior|dashboard)/i, category: "car", score: 25 },
  { pattern: /electric\s*(?:car|vehicle)|ev\s*charg|tesla/i, category: "electriccar", score: 25 },
  { pattern: /motorcycle|motorbike/i, category: "motorcycle", score: 25 },
  { pattern: /car\s*service|auto\s*(?:repair|mechanic|service)|car\s*wash/i, category: "automotive", score: 25 },
  { pattern: /suv|sport\s*utility/i, category: "suv", score: 25 },
  { pattern: /luxury\s*(?:car|vehicle|sedan)/i, category: "luxury", score: 25 },
  { pattern: /hotel\s*room|luxury\s*suite|resort\s*room|hotel\s*lobby/i, category: "hotel", score: 25 },
  { pattern: /beach\s*resort|infinity\s*pool|tropical\s*resort/i, category: "resort", score: 25 },
  { pattern: /airplane|aeroplane|flight|aviation|airport|boarding\s*pass/i, category: "flight", score: 25 },
  { pattern: /cruise\s*ship|ocean\s*liner/i, category: "cruise", score: 25 },
  { pattern: /mountain\s*(?:trail|hik|view|peak)|hiking\s*trail|summit/i, category: "mountain", score: 25 },
  { pattern: /tropical\s*beach|palm\s*tree|turquoise\s*water|seaside/i, category: "beach", score: 22 },
  { pattern: /real\s*estate\s*agent|property\s*(?:agent|listing|viewing)/i, category: "realestate", score: 25 },
  { pattern: /swimming\s*pool|infinity\s*pool|pool\s*area/i, category: "pool", score: 25 },
  { pattern: /penthouse|luxury\s*(?:apartment|condo|loft)/i, category: "penthouse", score: 25 },
  { pattern: /marble\s*counter|modern\s*kitchen|kitchen\s*island/i, category: "kitchen", score: 25 },
  { pattern: /university|campus|college|school\s*building/i, category: "education", score: 25 },
  { pattern: /online\s*(?:learning|course|class|education)|learning\s*platform/i, category: "education", score: 35 },
  { pattern: /classroom|lecture\s*hall|whiteboard|interactive\s*board/i, category: "classroom", score: 25 },
  { pattern: /teacher|professor|instructor|tutor/i, category: "education", score: 22 },
  { pattern: /textbook|study\s*material|school\s*book/i, category: "book", score: 25 },
  { pattern: /student|studying|library/i, category: "student", score: 20 },
  { pattern: /credit\s*card|bank\s*card|payment\s*card|debit\s*card/i, category: "creditcard", score: 25 },
  { pattern: /stock\s*market|investment|portfolio|trading/i, category: "investment", score: 25 },
  { pattern: /bank\s*(?:branch|interior|building)|banking\s*app/i, category: "banking", score: 25 },
  { pattern: /mobile\s*banking|online\s*banking|fintech/i, category: "banking", score: 22 },
  { pattern: /insurance\s*(?:policy|card|document|plan|claim)/i, category: "insurance", score: 25 },
  { pattern: /financial\s*(?:document|report|planning|advisor)/i, category: "finance", score: 25 },
  { pattern: /delivery\s*(?:truck|package|rider|driver|van)/i, category: "delivery", score: 25 },
  { pattern: /shipping\s*(?:container|box|label)/i, category: "shipping", score: 25 },
  { pattern: /warehouse\s*(?:interior|shelving|storage)/i, category: "warehouse", score: 25 },
  { pattern: /package\s*(?:tracking|delivery|doorstep)|parcel|deliver(?:ed|ing)?\s*(?:to|at)/i, category: "delivery", score: 30 },
  { pattern: /moving\s*(?:truck|box)|relocation/i, category: "moving", score: 25 },
  { pattern: /live\s*concert|stage\s*light|crowd\s*cheer/i, category: "concert", score: 25 },
  { pattern: /movie\s*theater|cinema|film\s*screen/i, category: "movie", score: 25 },
  { pattern: /music\s*festival|dj\s*booth|live\s*music/i, category: "music", score: 25 },
  { pattern: /sport\s*stadium|live\s*match|athletic/i, category: "sport", score: 25 },
  { pattern: /vip\s*(?:lounge|section|area|seat)|premium\s*seat/i, category: "party", score: 25 },
  { pattern: /stream(?:ing)?\s*(?:service|platform|content)/i, category: "streaming", score: 25 },
  { pattern: /family\s*(?:using|watching|enjoying|at\s*home)|(?:people|person|customer)\s*(?:using|with|giving|happy)/i, category: "technology", score: 18 },
  { pattern: /happy\s*(?:customer|person|woman|man)|thumbs\s*up|satisfied\s*customer|customer\s*review/i, category: "person", score: 25 },
  { pattern: /running\s*shoe|sneaker|athletic\s*shoe/i, category: "sneakers", score: 25 },
  { pattern: /luxury\s*watch|rolex|omega|chronograph/i, category: "luxurywatch", score: 25 },
  { pattern: /leather\s*(?:bag|handbag)|designer\s*bag/i, category: "handbag", score: 25 },
  { pattern: /fashion\s*(?:boutique|store|collection|show)/i, category: "fashion", score: 25 },
  { pattern: /clothing\s*(?:store|collection|rack|display)/i, category: "clothing", score: 25 },
  { pattern: /flash\s*sale|big\s*sale|clearance|mega\s*sale/i, category: "sale", score: 25 },
  { pattern: /shopping\s*(?:bag|cart|mall|center)/i, category: "store", score: 22 },
  { pattern: /welcome\s*(?:message|banner|screen)|onboard/i, category: "welcome", score: 25 },
  { pattern: /thank\s*you|appreciation|grateful/i, category: "success", score: 25 },
  { pattern: /appointment|booking\s*confirm|reservation\s*confirm/i, category: "success", score: 22 },
  { pattern: /verif(?:y|ication)|otp|security\s*(?:code|shield|lock)/i, category: "security", score: 25 },
  { pattern: /subscription|renewal|membership/i, category: "notification", score: 22 },
  { pattern: /promotional\s*banner|promo(?:tion)?/i, category: "product", score: 18 },
  { pattern: /food\s*delivery|meal\s*delivery/i, category: "delivery", score: 25 },
  { pattern: /gift\s*(?:box|wrap|card)/i, category: "gift", score: 25 },
  { pattern: /wedding\s*(?:dress|venue|ceremony|reception)/i, category: "wedding", score: 25 },
  { pattern: /pet\s*(?:food|care|grooming|shop)/i, category: "pet", score: 25 },
  { pattern: /flower\s*(?:bouquet|arrangement|delivery)/i, category: "florist", score: 25 },
  { pattern: /gym\s*(?:interior|equipment|floor)|workout\s*area|fitness\s*center/i, category: "gym", score: 25 },
  { pattern: /office\s*(?:space|interior|building)|cowork|workspace/i, category: "office", score: 25 },
  { pattern: /reception\s*area|lobby/i, category: "office", score: 20 },
];

const KEYWORD_RULES = [
  { word: "pizza", category: "pizza", score: 15 },
  { word: "burger", category: "burger", score: 15 },
  { word: "sushi", category: "sushi", score: 15 },
  { word: "steak", category: "steak", score: 15 },
  { word: "pasta", category: "pasta", score: 15 },
  { word: "salad", category: "salad", score: 15 },
  { word: "dessert", category: "dessert", score: 15 },
  { word: "cake", category: "cake", score: 15 },
  { word: "bakery", category: "bakery", score: 15 },
  { word: "coffee", category: "coffee", score: 15 },
  { word: "cocktail", category: "cocktail", score: 15 },
  { word: "smoothie", category: "smoothie", score: 15 },
  { word: "restaurant", category: "restaurant", score: 15 },
  { word: "skincare", category: "skincare", score: 15 },
  { word: "cosmetics", category: "cosmetics", score: 15 },
  { word: "makeup", category: "makeup", score: 15 },
  { word: "perfume", category: "perfume", score: 15 },
  { word: "fragrance", category: "perfume", score: 15 },
  { word: "salon", category: "salon", score: 15 },
  { word: "headphones", category: "headphones", score: 15 },
  { word: "smartwatch", category: "smartwatch", score: 15 },
  { word: "laptop", category: "laptop", score: 12 },
  { word: "smartphone", category: "smartphone", score: 15 },
  { word: "camera", category: "camera", score: 15 },
  { word: "gaming", category: "gaming", score: 15 },
  { word: "tablet", category: "tablet", score: 15 },
  { word: "speaker", category: "speaker", score: 15 },
  { word: "television", category: "television", score: 15 },
  { word: "sneakers", category: "sneakers", score: 15 },
  { word: "jewelry", category: "jewelry", score: 15 },
  { word: "handbag", category: "handbag", score: 15 },
  { word: "sunglasses", category: "sunglasses", score: 15 },
  { word: "motorcycle", category: "motorcycle", score: 15 },
  { word: "apartment", category: "apartment", score: 15 },
  { word: "penthouse", category: "penthouse", score: 15 },
  { word: "kitchen", category: "kitchen", score: 15 },
  { word: "bedroom", category: "bedroom", score: 15 },
  { word: "bathroom", category: "bathroom", score: 15 },
  { word: "warehouse", category: "warehouse", score: 15 },
  { word: "delivery", category: "delivery", score: 15 },
  { word: "shipping", category: "shipping", score: 15 },
  { word: "insurance", category: "insurance", score: 15 },
  { word: "investment", category: "investment", score: 15 },
  { word: "classroom", category: "classroom", score: 15 },
  { word: "construction", category: "construction", score: 15 },
  { word: "laundry", category: "laundry", score: 15 },
  { word: "plumbing", category: "plumbing", score: 15 },
  { word: "childcare", category: "childcare", score: 15 },
  { word: "catering", category: "catering", score: 15 },
  { word: "florist", category: "florist", score: 15 },
  { word: "photography", category: "photography", score: 15 },
  { word: "veterinary", category: "veterinary", score: 15 },
  { word: "wedding", category: "wedding", score: 15 },
  { word: "celebration", category: "celebration", score: 15 },
  { word: "concert", category: "concert", score: 15 },
  { word: "theater", category: "theater", score: 15 },
  { word: "theatre", category: "theater", score: 15 },
  { word: "camping", category: "camping", score: 15 },
  { word: "cruise", category: "cruise", score: 15 },
  { word: "resort", category: "resort", score: 15 },
  { word: "mountain", category: "mountain", score: 12 },
  { word: "beach", category: "beach", score: 12 },
  { word: "hotel", category: "hotel", score: 15 },
  { word: "dental", category: "dental", score: 15 },
  { word: "pharmacy", category: "pharmacy", score: 15 },
  { word: "laboratory", category: "laboratory", score: 15 },
  { word: "hospital", category: "hospital", score: 15 },
  { word: "food", category: "food", score: 10 },
  { word: "fashion", category: "fashion", score: 10 },
  { word: "clothing", category: "clothing", score: 10 },
  { word: "shoes", category: "shoes", score: 10 },
  { word: "dress", category: "dress", score: 10 },
  { word: "watch", category: "watch", score: 10 },
  { word: "phone", category: "phone", score: 10 },
  { word: "beauty", category: "beauty", score: 10 },
  { word: "health", category: "health", score: 10 },
  { word: "fitness", category: "fitness", score: 10 },
  { word: "yoga", category: "yoga", score: 10 },
  { word: "doctor", category: "doctor", score: 10 },
  { word: "medicine", category: "medicine", score: 10 },
  { word: "medical", category: "doctor", score: 10 },
  { word: "automotive", category: "automotive", score: 10 },
  { word: "vehicle", category: "car", score: 10 },
  { word: "house", category: "house", score: 10 },
  { word: "interior", category: "interior", score: 8 },
  { word: "travel", category: "travel", score: 10 },
  { word: "education", category: "education", score: 10 },
  { word: "finance", category: "finance", score: 10 },
  { word: "banking", category: "banking", score: 10 },
  { word: "technology", category: "technology", score: 10 },
  { word: "office", category: "office", score: 10 },
  { word: "nature", category: "nature", score: 10 },
  { word: "garden", category: "garden", score: 10 },
  { word: "furniture", category: "furniture", score: 10 },
  { word: "cleaning", category: "cleaning", score: 10 },
  { word: "solar", category: "solar", score: 10 },
  { word: "organic", category: "organic", score: 10 },
  { word: "grocery", category: "grocery", score: 10 },
  { word: "fruit", category: "fruit", score: 10 },
  { word: "vegetable", category: "vegetable", score: 10 },
  { word: "plant", category: "plant", score: 10 },
  { word: "flower", category: "flower", score: 10 },
  { word: "legal", category: "legal", score: 10 },
  { word: "accounting", category: "accounting", score: 10 },
  { word: "printing", category: "printing", score: 10 },
  { word: "tutoring", category: "tutoring", score: 10 },
  { word: "moving", category: "moving", score: 10 },
  { word: "tailor", category: "tailor", score: 10 },
  { word: "optician", category: "optician", score: 10 },
  { word: "music", category: "music", score: 10 },
  { word: "movie", category: "movie", score: 10 },
  { word: "sport", category: "sport", score: 10 },
  { word: "sports", category: "sport", score: 10 },
  { word: "party", category: "party", score: 10 },
  { word: "student", category: "student", score: 10 },
  { word: "book", category: "book", score: 8 },
  { word: "flight", category: "flight", score: 10 },
  { word: "pool", category: "pool", score: 10 },
  { word: "gym", category: "gym", score: 10 },
  { word: "wine", category: "wine", score: 10 },
  { word: "product", category: "product", score: 8 },
  { word: "store", category: "store", score: 8 },
  { word: "sale", category: "sale", score: 8 },
  { word: "discount", category: "sale", score: 8 },
  { word: "coupon", category: "coupon", score: 8 },
  { word: "gift", category: "gift", score: 8 },
  { word: "baby", category: "baby", score: 10 },
  { word: "pet", category: "pet", score: 10 },
  { word: "dog", category: "dog", score: 10 },
  { word: "car", category: "car", score: 5 },
  { word: "suv", category: "suv", score: 8 },
  { word: "bag", category: "bag", score: 5 },
  { word: "spa", category: "spa", score: 8 },
  { word: "tea", category: "tea", score: 8 },
  { word: "cat", category: "cat", score: 5 },
  { word: "tv", category: "television", score: 5 },
  { word: "hair", category: "hair", score: 5 },
  { word: "nail", category: "nails", score: 5 },
  { word: "nails", category: "nails", score: 8 },
  { word: "suit", category: "suit", score: 5 },
  { word: "taxi", category: "taxi", score: 8 },
  { word: "person", category: "person", score: 5 },
  { word: "team", category: "team", score: 5 },
  { word: "luxury", category: "luxury", score: 5 },
  { word: "package", category: "package", score: 8 },
  { word: "serum", category: "serum", score: 8 },
];

const COMPILED_KEYWORDS = KEYWORD_RULES.map(rule => ({
  regex: new RegExp(`\\b${rule.word}\\b`, "i"),
  category: rule.category,
  score: rule.score,
}));

function findBestCategory(description) {
  const lower = description.toLowerCase();
  const scores = {};

  for (const { pattern, category, score } of SEMANTIC_PATTERNS) {
    if (pattern.test(lower)) {
      scores[category] = (scores[category] || 0) + score;
    }
  }

  for (const { regex, category, score } of COMPILED_KEYWORDS) {
    if (regex.test(lower)) {
      scores[category] = (scores[category] || 0) + score;
    }
  }

  let bestCategory = null;
  let bestScore = 0;
  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return { category: bestCategory, score: bestScore, allScores: scores };
}

// Test descriptions that AI typically generates for each industry
const TEST_DESCRIPTIONS = [
  // E-Commerce
  { industry: "E-Commerce", desc: "A promotional banner showing flash sale with shopping bags and discount tags", expected: "sale" },
  { industry: "E-Commerce", desc: "Stylish sneakers on display with price tag", expected: "sneakers" },
  { industry: "E-Commerce", desc: "Elegant watch collection showcase", expected: "watch" },
  { industry: "E-Commerce", desc: "Woman browsing online store on laptop", expected: "laptop" },
  { industry: "E-Commerce", desc: "Shopping cart with various products", expected: "store" },
  { industry: "E-Commerce", desc: "Package being delivered to doorstep", expected: "delivery" },  // package doorstep → delivery via semantic
  
  // Healthcare
  { industry: "Healthcare", desc: "Modern medical clinic interior with reception area", expected: "hospital" },
  { industry: "Healthcare", desc: "Doctor in white coat with stethoscope", expected: "doctor" },
  { industry: "Healthcare", desc: "Blood test tubes in laboratory", expected: "laboratory" },
  { industry: "Healthcare", desc: "Dental clinic with modern equipment", expected: "dental" },
  { industry: "Healthcare", desc: "Vaccination syringe with medical supplies", expected: "medicine" },
  { industry: "Healthcare", desc: "Telemedicine consultation on tablet screen", expected: "doctor" },
  { industry: "Healthcare", desc: "Health screening package promotional image", expected: "health" },
  
  // Food & Beverage
  { industry: "F&B", desc: "Delicious gourmet burger with fries", expected: "burger" },
  { industry: "F&B", desc: "Elegant restaurant interior with ambient lighting", expected: "restaurant" },
  { industry: "F&B", desc: "Fresh sushi platter beautifully arranged", expected: "sushi" },
  { industry: "F&B", desc: "Artisan coffee latte art in ceramic cup", expected: "coffee" },
  { industry: "F&B", desc: "Pizza fresh out of wood-fired oven", expected: "pizza" },
  { industry: "F&B", desc: "Colorful smoothie bowls with fresh fruits", expected: "smoothie" },
  { industry: "F&B", desc: "Fine dining table setting with wine glasses", expected: "restaurant" },  // wine vs restaurant
  { industry: "F&B", desc: "Food delivery rider on motorcycle with insulated bag", expected: "delivery" },
  
  // Finance
  { industry: "Finance", desc: "Credit card with premium benefits showcase", expected: "creditcard" },
  { industry: "Finance", desc: "Stock market charts and investment portfolio", expected: "investment" },
  { industry: "Finance", desc: "Modern bank branch interior", expected: "banking" },
  { industry: "Finance", desc: "Person reviewing financial documents", expected: "finance" },
  { industry: "Finance", desc: "Mobile banking app on smartphone screen", expected: "banking" },
  
  // Travel
  { industry: "Travel", desc: "Luxury beach resort with infinity pool", expected: "resort" },
  { industry: "Travel", desc: "Airplane flying over beautiful clouds", expected: "flight" },
  { industry: "Travel", desc: "Tropical beach with palm trees and turquoise water", expected: "beach" },
  { industry: "Travel", desc: "Cozy hotel room with city view", expected: "hotel" },
  { industry: "Travel", desc: "Mountain hiking trail with scenic views", expected: "mountain" },
  { industry: "Travel", desc: "Cruise ship on open ocean", expected: "cruise" },
  
  // Education
  { industry: "Education", desc: "University campus with students walking", expected: "education" },
  { industry: "Education", desc: "Online learning platform on laptop screen", expected: "education" },  // laptop vs education
  { industry: "Education", desc: "Classroom with modern interactive whiteboard", expected: "classroom" },
  { industry: "Education", desc: "Stack of textbooks and study materials", expected: "book" },
  { industry: "Education", desc: "Student studying in library", expected: "student" },
  
  // Real Estate
  { industry: "Real Estate", desc: "Modern luxury house with landscaped garden", expected: "house" },
  { industry: "Real Estate", desc: "Spacious apartment living room with city view", expected: "apartment" },
  { industry: "Real Estate", desc: "Real estate agent showing property to clients", expected: "realestate" },
  { industry: "Real Estate", desc: "Modern kitchen with marble countertops", expected: "kitchen" },
  { industry: "Real Estate", desc: "Penthouse with panoramic city skyline", expected: "penthouse" },
  { industry: "Real Estate", desc: "Swimming pool in luxury villa", expected: "pool" },
  
  // Automotive
  { industry: "Automotive", desc: "New sedan model in showroom", expected: "car" },
  { industry: "Automotive", desc: "Electric vehicle charging at station", expected: "electriccar" },
  { industry: "Automotive", desc: "Car service center with mechanic", expected: "automotive" },
  { industry: "Automotive", desc: "Luxury SUV on mountain road", expected: "suv" },
  { industry: "Automotive", desc: "Motorcycle parked on scenic road", expected: "motorcycle" },
  
  // Retail
  { industry: "Retail", desc: "Clothing store with seasonal collection display", expected: "clothing" },
  { industry: "Retail", desc: "Shopping mall interior with stores", expected: "store" },
  { industry: "Retail", desc: "Gift wrapped boxes with ribbon", expected: "gift" },
  { industry: "Retail", desc: "Fashion boutique with mannequins", expected: "fashion" },
  
  // Technology
  { industry: "Technology", desc: "Latest smartphone with edge-to-edge display", expected: "phone" },
  { industry: "Technology", desc: "Wireless headphones on minimalist background", expected: "headphones" },
  { industry: "Technology", desc: "Smart home devices on modern desk", expected: "technology" },
  { industry: "Technology", desc: "Gaming setup with RGB lighting", expected: "gaming" },
  { industry: "Technology", desc: "Laptop on desk with code on screen", expected: "laptop" },
  
  // Beauty
  { industry: "Beauty", desc: "Luxury spa treatment room with candles", expected: "spa" },
  { industry: "Beauty", desc: "Hair salon interior with styling chairs", expected: "salon" },
  { industry: "Beauty", desc: "Skincare products arranged on marble surface", expected: "skincare" },
  { industry: "Beauty", desc: "Nail art manicure with colorful designs", expected: "nails" },
  { industry: "Beauty", desc: "Professional makeup palette and brushes", expected: "makeup" },
  { industry: "Beauty", desc: "Hair serum bottle with botanical ingredients", expected: "haircare" },
  { industry: "Beauty", desc: "Woman getting facial treatment at spa", expected: "spa" },
  
  // Entertainment
  { industry: "Entertainment", desc: "Live concert with crowd and stage lights", expected: "concert" },
  { industry: "Entertainment", desc: "Movie theater with large screen", expected: "movie" },
  { industry: "Entertainment", desc: "Music festival with colorful stage", expected: "music" },
  { industry: "Entertainment", desc: "Sports stadium during live match", expected: "sport" },
  { industry: "Entertainment", desc: "VIP lounge with premium seating", expected: "party" },
  
  // Logistics
  { industry: "Logistics", desc: "Delivery truck on highway", expected: "delivery" },
  { industry: "Logistics", desc: "Warehouse with organized shelving", expected: "warehouse" },
  { industry: "Logistics", desc: "Package tracking on mobile app", expected: "delivery" },
  { industry: "Logistics", desc: "Shipping containers at port", expected: "shipping" },
  
  // Insurance
  { industry: "Insurance", desc: "Family protected under insurance umbrella concept", expected: "insurance" },
  { industry: "Insurance", desc: "Health insurance card and medical documents", expected: "insurance" },
  { industry: "Insurance", desc: "Car accident scene for auto insurance claim", expected: "insurance" },
  { industry: "Insurance", desc: "Life insurance policy document with pen", expected: "insurance" },
  
  // Telecom
  { industry: "Telecom", desc: "5G network tower with city skyline", expected: "telecom" },
  { industry: "Telecom", desc: "Latest smartphone with data plan offer", expected: "phone" },
  { industry: "Telecom", desc: "Family using devices at home", expected: "technology" },  // edge: no keywords match
  { industry: "Telecom", desc: "SIM card with mobile phone", expected: "phone" },
  
  // Edge cases - descriptions that commonly fail
  { industry: "Edge", desc: "Professional promotional banner for business", expected: "product" },
  { industry: "Edge", desc: "Welcome message header image", expected: "welcome" },
  { industry: "Edge", desc: "Thank you for your purchase", expected: "success" },
  { industry: "Edge", desc: "Appointment confirmation checkmark", expected: "success" },
  { industry: "Edge", desc: "Verification code security shield", expected: "security" },
  { industry: "Edge", desc: "Customer support representative with headset", expected: "support" },
  { industry: "Edge", desc: "Happy customer giving thumbs up review", expected: "person" },
  { industry: "Edge", desc: "Modern office reception area", expected: "office" },
  { industry: "Edge", desc: "Subscription renewal reminder notification", expected: "notification" },
  { industry: "Edge", desc: "Exclusive VIP membership card", expected: "notification" },  // VIP membership → notification
];

console.log("=== IMAGE RELEVANCE AUDIT ===\n");

let correct = 0;
let incorrect = 0;
let fallback = 0;
const failures = [];

for (const test of TEST_DESCRIPTIONS) {
  const result = findBestCategory(test.desc);
  const matched = result.category === test.expected;
  const isFallback = result.category === null;
  
  if (matched) {
    correct++;
  } else if (isFallback) {
    fallback++;
    failures.push({
      industry: test.industry,
      description: test.desc,
      expected: test.expected,
      got: "FALLBACK (no match)",
      scores: result.allScores
    });
  } else {
    incorrect++;
    failures.push({
      industry: test.industry,
      description: test.desc,
      expected: test.expected,
      got: result.category,
      score: result.score,
      scores: result.allScores
    });
  }
}

console.log(`RESULTS: ${correct}/${TEST_DESCRIPTIONS.length} correct (${Math.round(correct/TEST_DESCRIPTIONS.length*100)}%)`);
console.log(`  ✅ Correct: ${correct}`);
console.log(`  ❌ Wrong category: ${incorrect}`);
console.log(`  ⚠️  Fallback (no match): ${fallback}`);
console.log(`\n=== FAILURES ===\n`);

for (const f of failures) {
  console.log(`[${f.industry}] "${f.description}"`);
  console.log(`  Expected: ${f.expected} | Got: ${f.got}`);
  if (Object.keys(f.scores).length > 0) {
    const sorted = Object.entries(f.scores).sort((a, b) => b[1] - a[1]).slice(0, 5);
    console.log(`  Top scores: ${sorted.map(([k, v]) => `${k}=${v}`).join(', ')}`);
  } else {
    console.log(`  No keywords matched at all`);
  }
  console.log();
}
