/**
 * Internationalization (i18n) translations for Indian language support.
 * Supports: English, Hindi, Bengali, Tamil, Marathi, Telugu
 *
 * Translation keys are organized by feature area.
 * All translations are verified for accuracy.
 */

export type SupportedLanguage = "en" | "hi" | "bn" | "ta" | "mr" | "te" | "ur" | "id" | "zh-CN" | "zh-TW" | "pt" | "es";

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", flag: "🇮🇳" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", flag: "🇮🇳" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", flag: "🇮🇳" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", flag: "🇮🇳" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", flag: "🇵🇰" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "zh-CN", label: "Chinese (Simplified)", nativeLabel: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", label: "Chinese (Traditional)", nativeLabel: "繁體中文", flag: "🇹🇼" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português", flag: "🇧🇷" },
  { code: "es", label: "Spanish", nativeLabel: "Español", flag: "🇪🇸" },
];

export const LANGUAGE_NAMES_FOR_LLM: Record<SupportedLanguage, string> = {
  en: "English",
  hi: "Hindi",
  bn: "Bengali",
  ta: "Tamil",
  mr: "Marathi",
  te: "Telugu",
  ur: "Urdu (اردو)",
  id: "Indonesian (Bahasa Indonesia)",
  "zh-CN": "Simplified Chinese (简体中文)",
  "zh-TW": "Traditional Chinese (繁體中文)",
  pt: "Portuguese (Português)",
  es: "Spanish (Español)",
};

type TranslationKeys = {
  // Navigation
  "nav.industryTemplates": string;
  "nav.roiCalculator": string;
  "nav.apiDocs": string;
  "nav.signOut": string;
  "nav.signIn": string;
  "nav.myThreads": string;

  // Landing page
  "home.badge": string;
  "home.title": string;
  "home.titleHighlight": string;
  "home.subtitle": string;
  "home.browseTemplates": string;
  "home.createTailored": string;
  "home.roiCalculator": string;
  "home.getStarted": string;

  // Stats
  "stats.openRate": string;
  "stats.openRateSub": string;
  "stats.higherCtr": string;
  "stats.higherCtrSub": string;
  "stats.waUsers": string;
  "stats.waUsersSub": string;
  "stats.templates": string;
  "stats.templatesSub": string;

  // How it works
  "howItWorks.title": string;
  "howItWorks.subtitle": string;
  "howItWorks.step1Title": string;
  "howItWorks.step1Desc": string;
  "howItWorks.step2Title": string;
  "howItWorks.step2Desc": string;
  "howItWorks.step3Title": string;
  "howItWorks.step3Desc": string;

  // Messaging types
  "msgTypes.title": string;
  "msgTypes.subtitle": string;
  "msgTypes.marketing": string;
  "msgTypes.marketingSub": string;
  "msgTypes.utility": string;
  "msgTypes.utilitySub": string;
  "msgTypes.auth": string;
  "msgTypes.authSub": string;

  // Template quality
  "quality.title": string;
  "quality.subtitle": string;

  // CTA
  "cta.title": string;
  "cta.subtitle": string;

  // Footer
  "footer.tagline": string;

  // Create Tailored Pitch dialog
  "dialog.title": string;
  "dialog.threadName": string;
  "dialog.threadNamePlaceholder": string;
  "dialog.industry": string;
  "dialog.selectIndustry": string;
  "dialog.messageType": string;
  "dialog.clientUrl": string;
  "dialog.clientUrlOptional": string;
  "dialog.clientUrlPlaceholder": string;
  "dialog.clientUrlHint": string;
  "dialog.createButton": string;
  "dialog.creating": string;
  "dialog.conversationLanguage": string;
  "dialog.languageHint": string;

  // Templates page
  "templates.title": string;
  "templates.subtitle": string;
  "templates.allIndustries": string;
  "templates.allTypes": string;
  "templates.search": string;
  "templates.marketing": string;
  "templates.utility": string;
  "templates.auth": string;
  "templates.activeFilters": string;
  "templates.clearAll": string;
  "templates.noResults": string;
  "templates.noResultsHint": string;
  "templates.useTemplate": string;
  "templates.generating": string;
  "templates.conversationLanguage": string;

  // Builder
  "builder.aiGenerate": string;
  "builder.manualEdit": string;
  "builder.promptLabel": string;
  "builder.promptPlaceholder": string;
  "builder.generateButton": string;
  "builder.generating": string;
  "builder.clientAssets": string;
  "builder.uploadAssets": string;
  "builder.conversationLanguage": string;
  "builder.languageHint": string;
};

type Translations = Record<SupportedLanguage, TranslationKeys>;

export const translations: Translations = {
  en: {
    // Navigation
    "nav.industryTemplates": "Industry Templates",
    "nav.roiCalculator": "ROI Calculator",
    "nav.apiDocs": "API Docs",
    "nav.signOut": "Sign Out",
    "nav.signIn": "Sign In",
    "nav.myThreads": "My Threads",

    // Landing page
    "home.badge": "Built for Meta Account Managers",
    "home.title": "Create WhatsApp Paid Messaging Demos",
    "home.titleHighlight": " in Seconds",
    "home.subtitle": "Stop spending hours building WhatsApp mockups manually. Describe your use case in plain English and get a pixel-perfect, interactive conversation flow instantly — ready to pitch to your clients.",
    "home.browseTemplates": "Browse Industry Templates",
    "home.createTailored": "Create a Tailored Pitch",
    "home.roiCalculator": "ROI Calculator",
    "home.getStarted": "Get Started",

    // Stats
    "stats.openRate": "Message Open Rate",
    "stats.openRateSub": "vs 20% for email",
    "stats.higherCtr": "Higher CTR",
    "stats.higherCtrSub": "vs traditional channels",
    "stats.waUsers": "WhatsApp Users",
    "stats.waUsersSub": "worldwide monthly active",
    "stats.templates": "Ready Templates",
    "stats.templatesSub": "across 15 industries",

    // How it works
    "howItWorks.title": "Three Steps to a Perfect Pitch",
    "howItWorks.subtitle": "Go from idea to interactive WhatsApp demo in under a minute",
    "howItWorks.step1Title": "Describe Your Use Case",
    "howItWorks.step1Desc": "Type what you need in plain English, or paste a client's website URL. Our AI extracts business context, products, and brand information automatically.",
    "howItWorks.step2Title": "AI Generates the Flow",
    "howItWorks.step2Desc": "Get a complete, industry-aware conversation flow with the right message types, buttons, and customer responses — all in seconds.",
    "howItWorks.step3Title": "Share with Your Client",
    "howItWorks.step3Desc": "Preview the interactive simulation, fine-tune if needed, then share a link or present the pixel-perfect WhatsApp mockup directly.",

    // Messaging types
    "msgTypes.title": "Cover Every WhatsApp Messaging Use Case",
    "msgTypes.subtitle": "Build demos across all three WhatsApp Paid Messaging categories, each mapped to the business outcomes your clients care about",
    "msgTypes.marketing": "Marketing Messages",
    "msgTypes.marketingSub": "Drive Sales & Customer Retention",
    "msgTypes.utility": "Utility Messages",
    "msgTypes.utilitySub": "Drive Operational Efficiency",
    "msgTypes.auth": "Authentication Messages",
    "msgTypes.authSub": "Enhance Security & Trust",

    // Template quality
    "quality.title": "Why Template Quality Matters",
    "quality.subtitle": "The difference between a good and great WhatsApp template can mean 2-3x more conversions for your clients",

    // CTA
    "cta.title": "Ready to Pitch WhatsApp More Effectively?",
    "cta.subtitle": "Create professional, interactive WhatsApp conversation demos in seconds. Show your clients exactly what their messaging experience will look like.",

    // Footer
    "footer.tagline": "Built for Meta Account Managers to pitch WhatsApp Paid Messaging",

    // Create Tailored Pitch dialog
    "dialog.title": "Create a Tailored Pitch",
    "dialog.threadName": "Thread Name",
    "dialog.threadNamePlaceholder": "e.g., FoodArt Store Marketing Campaign",
    "dialog.industry": "Industry",
    "dialog.selectIndustry": "Select industry",
    "dialog.messageType": "Message Type",
    "dialog.clientUrl": "Client Website URL",
    "dialog.clientUrlOptional": "(optional)",
    "dialog.clientUrlPlaceholder": "e.g., https://www.clientbrand.com",
    "dialog.clientUrlHint": "AI will analyze the website to personalize your pitch with real products and branding",
    "dialog.createButton": "Create & Start Building",
    "dialog.creating": "Creating...",
    "dialog.conversationLanguage": "Conversation Language",
    "dialog.languageHint": "The AI-generated WhatsApp conversation will be in this language",

    // Templates page
    "templates.title": "Industry Use Case Template Library",
    "templates.subtitle": "ready-made conversation templates across {industries} industries. Spot whitespace opportunities and drive new use cases for WhatsApp Paid Messaging adoption.",
    "templates.allIndustries": "All Industries",
    "templates.allTypes": "All Types",
    "templates.search": "Search templates...",
    "templates.marketing": "Marketing",
    "templates.utility": "Utility",
    "templates.auth": "Auth",
    "templates.activeFilters": "Active filters:",
    "templates.clearAll": "Clear all",
    "templates.noResults": "No templates found",
    "templates.noResultsHint": "Try adjusting your filters or search query",
    "templates.useTemplate": "Use Template",
    "templates.generating": "Generating...",
    "templates.conversationLanguage": "Conversation Language",

    // Builder
    "builder.aiGenerate": "AI Generate",
    "builder.manualEdit": "Manual Edit",
    "builder.promptLabel": "Describe the conversation flow you want to create",
    "builder.promptPlaceholder": "e.g., \"Build a WhatsApp Marketing Messages flow for a food delivery app...\"",
    "builder.generateButton": "Generate Conversation Flow",
    "builder.generating": "Generating...",
    "builder.clientAssets": "Client Assets (optional)",
    "builder.uploadAssets": "Upload photos, workflow diagrams, or product images",
    "builder.conversationLanguage": "Conversation Language",
    "builder.languageHint": "Generated conversation will be in this language",
  },

  hi: {
    // Navigation
    "nav.industryTemplates": "उद्योग टेम्पलेट",
    "nav.roiCalculator": "ROI कैलकुलेटर",
    "nav.apiDocs": "API दस्तावेज़",
    "nav.signOut": "साइन आउट",
    "nav.signIn": "साइन इन",
    "nav.myThreads": "मेरे थ्रेड",

    // Landing page
    "home.badge": "Meta अकाउंट मैनेजर्स के लिए बनाया गया",
    "home.title": "WhatsApp पेड मैसेजिंग डेमो बनाएँ",
    "home.titleHighlight": " कुछ ही सेकंड में",
    "home.subtitle": "WhatsApp मॉकअप मैन्युअली बनाने में घंटे बर्बाद करना बंद करें। सरल हिंदी में अपना उपयोग केस बताएँ और तुरंत एक इंटरैक्टिव बातचीत फ्लो पाएँ — क्लाइंट को पिच करने के लिए तैयार।",
    "home.browseTemplates": "उद्योग टेम्पलेट ब्राउज़ करें",
    "home.createTailored": "कस्टम पिच बनाएँ",
    "home.roiCalculator": "ROI कैलकुलेटर",
    "home.getStarted": "शुरू करें",

    // Stats
    "stats.openRate": "मैसेज ओपन रेट",
    "stats.openRateSub": "ईमेल के 20% की तुलना में",
    "stats.higherCtr": "अधिक CTR",
    "stats.higherCtrSub": "पारंपरिक चैनलों की तुलना में",
    "stats.waUsers": "WhatsApp उपयोगकर्ता",
    "stats.waUsersSub": "विश्वव्यापी मासिक सक्रिय",
    "stats.templates": "तैयार टेम्पलेट",
    "stats.templatesSub": "15 उद्योगों में",

    // How it works
    "howItWorks.title": "परफेक्ट पिच के तीन चरण",
    "howItWorks.subtitle": "एक मिनट से कम में आइडिया से इंटरैक्टिव WhatsApp डेमो तक",
    "howItWorks.step1Title": "अपना उपयोग केस बताएँ",
    "howItWorks.step1Desc": "सरल हिंदी में लिखें या क्लाइंट की वेबसाइट URL पेस्ट करें। हमारा AI स्वचालित रूप से व्यवसाय संदर्भ, उत्पाद और ब्रांड जानकारी निकालता है।",
    "howItWorks.step2Title": "AI फ्लो जनरेट करता है",
    "howItWorks.step2Desc": "सही मैसेज प्रकार, बटन और ग्राहक प्रतिक्रियाओं के साथ एक पूर्ण, उद्योग-जागरूक बातचीत फ्लो प्राप्त करें — सब कुछ सेकंडों में।",
    "howItWorks.step3Title": "क्लाइंट के साथ साझा करें",
    "howItWorks.step3Desc": "इंटरैक्टिव सिमुलेशन का पूर्वावलोकन करें, आवश्यकतानुसार ठीक करें, फिर लिंक साझा करें या सीधे WhatsApp मॉकअप प्रस्तुत करें।",

    // Messaging types
    "msgTypes.title": "हर WhatsApp मैसेजिंग उपयोग केस को कवर करें",
    "msgTypes.subtitle": "तीनों WhatsApp पेड मैसेजिंग श्रेणियों में डेमो बनाएँ, प्रत्येक आपके क्लाइंट्स के व्यावसायिक परिणामों से जुड़ा",
    "msgTypes.marketing": "मार्केटिंग मैसेज",
    "msgTypes.marketingSub": "बिक्री और ग्राहक प्रतिधारण बढ़ाएँ",
    "msgTypes.utility": "यूटिलिटी मैसेज",
    "msgTypes.utilitySub": "परिचालन दक्षता बढ़ाएँ",
    "msgTypes.auth": "प्रमाणीकरण मैसेज",
    "msgTypes.authSub": "सुरक्षा और विश्वास बढ़ाएँ",

    // Template quality
    "quality.title": "टेम्पलेट गुणवत्ता क्यों मायने रखती है",
    "quality.subtitle": "एक अच्छे और बेहतरीन WhatsApp टेम्पलेट के बीच का अंतर आपके क्लाइंट्स के लिए 2-3 गुना अधिक रूपांतरण का मतलब हो सकता है",

    // CTA
    "cta.title": "WhatsApp को अधिक प्रभावी ढंग से पिच करने के लिए तैयार हैं?",
    "cta.subtitle": "सेकंडों में पेशेवर, इंटरैक्टिव WhatsApp बातचीत डेमो बनाएँ। अपने क्लाइंट्स को दिखाएँ कि उनका मैसेजिंग अनुभव कैसा दिखेगा।",

    // Footer
    "footer.tagline": "WhatsApp पेड मैसेजिंग पिच करने के लिए Meta अकाउंट मैनेजर्स हेतु निर्मित",

    // Create Tailored Pitch dialog
    "dialog.title": "कस्टम पिच बनाएँ",
    "dialog.threadName": "थ्रेड का नाम",
    "dialog.threadNamePlaceholder": "जैसे, FoodArt स्टोर मार्केटिंग अभियान",
    "dialog.industry": "उद्योग",
    "dialog.selectIndustry": "उद्योग चुनें",
    "dialog.messageType": "मैसेज प्रकार",
    "dialog.clientUrl": "क्लाइंट वेबसाइट URL",
    "dialog.clientUrlOptional": "(वैकल्पिक)",
    "dialog.clientUrlPlaceholder": "जैसे, https://www.clientbrand.com",
    "dialog.clientUrlHint": "AI वेबसाइट का विश्लेषण करके वास्तविक उत्पादों और ब्रांडिंग के साथ आपकी पिच को व्यक्तिगत बनाएगा",
    "dialog.createButton": "बनाएँ और शुरू करें",
    "dialog.creating": "बना रहे हैं...",
    "dialog.conversationLanguage": "बातचीत की भाषा",
    "dialog.languageHint": "AI-जनित WhatsApp बातचीत इस भाषा में होगी",

    // Templates page
    "templates.title": "उद्योग उपयोग केस टेम्पलेट लाइब्रेरी",
    "templates.subtitle": "{industries} उद्योगों में तैयार बातचीत टेम्पलेट। WhatsApp पेड मैसेजिंग अपनाने के लिए नए उपयोग केस खोजें।",
    "templates.allIndustries": "सभी उद्योग",
    "templates.allTypes": "सभी प्रकार",
    "templates.search": "टेम्पलेट खोजें...",
    "templates.marketing": "मार्केटिंग",
    "templates.utility": "यूटिलिटी",
    "templates.auth": "प्रमाणीकरण",
    "templates.activeFilters": "सक्रिय फ़िल्टर:",
    "templates.clearAll": "सभी हटाएँ",
    "templates.noResults": "कोई टेम्पलेट नहीं मिला",
    "templates.noResultsHint": "अपने फ़िल्टर या खोज क्वेरी समायोजित करें",
    "templates.useTemplate": "टेम्पलेट उपयोग करें",
    "templates.generating": "जनरेट हो रहा है...",
    "templates.conversationLanguage": "बातचीत की भाषा",

    // Builder
    "builder.aiGenerate": "AI जनरेट",
    "builder.manualEdit": "मैन्युअल संपादन",
    "builder.promptLabel": "आप जो बातचीत फ्लो बनाना चाहते हैं उसका वर्णन करें",
    "builder.promptPlaceholder": "जैसे, \"फूड डिलीवरी ऐप के लिए WhatsApp मार्केटिंग मैसेज फ्लो बनाएँ...\"",
    "builder.generateButton": "बातचीत फ्लो जनरेट करें",
    "builder.generating": "जनरेट हो रहा है...",
    "builder.clientAssets": "क्लाइंट एसेट (वैकल्पिक)",
    "builder.uploadAssets": "फ़ोटो, वर्कफ़्लो डायग्राम या उत्पाद चित्र अपलोड करें",
    "builder.conversationLanguage": "बातचीत की भाषा",
    "builder.languageHint": "जनरेट की गई बातचीत इस भाषा में होगी",
  },

  bn: {
    // Navigation
    "nav.industryTemplates": "শিল্প টেমপ্লেট",
    "nav.roiCalculator": "ROI ক্যালকুলেটর",
    "nav.apiDocs": "API ডকুমেন্টেশন",
    "nav.signOut": "সাইন আউট",
    "nav.signIn": "সাইন ইন",
    "nav.myThreads": "আমার থ্রেড",

    // Landing page
    "home.badge": "Meta অ্যাকাউন্ট ম্যানেজারদের জন্য তৈরি",
    "home.title": "WhatsApp পেইড মেসেজিং ডেমো তৈরি করুন",
    "home.titleHighlight": " কয়েক সেকেন্ডে",
    "home.subtitle": "ম্যানুয়ালি WhatsApp মকআপ তৈরি করতে ঘণ্টার পর ঘণ্টা ব্যয় করা বন্ধ করুন। সরল বাংলায় আপনার ব্যবহারের ক্ষেত্র বর্ণনা করুন এবং তাৎক্ষণিকভাবে একটি ইন্টারেক্টিভ কথোপকথন ফ্লো পান — ক্লায়েন্টকে পিচ করার জন্য প্রস্তুত।",
    "home.browseTemplates": "শিল্প টেমপ্লেট ব্রাউজ করুন",
    "home.createTailored": "কাস্টম পিচ তৈরি করুন",
    "home.roiCalculator": "ROI ক্যালকুলেটর",
    "home.getStarted": "শুরু করুন",

    // Stats
    "stats.openRate": "মেসেজ ওপেন রেট",
    "stats.openRateSub": "ইমেলের ২০% এর তুলনায়",
    "stats.higherCtr": "বেশি CTR",
    "stats.higherCtrSub": "প্রচলিত চ্যানেলের তুলনায়",
    "stats.waUsers": "WhatsApp ব্যবহারকারী",
    "stats.waUsersSub": "বিশ্বব্যাপী মাসিক সক্রিয়",
    "stats.templates": "প্রস্তুত টেমপ্লেট",
    "stats.templatesSub": "১৫টি শিল্পে",

    // How it works
    "howItWorks.title": "নিখুঁত পিচের তিনটি ধাপ",
    "howItWorks.subtitle": "এক মিনিটেরও কম সময়ে আইডিয়া থেকে ইন্টারেক্টিভ WhatsApp ডেমো",
    "howItWorks.step1Title": "আপনার ব্যবহারের ক্ষেত্র বর্ণনা করুন",
    "howItWorks.step1Desc": "সরল বাংলায় লিখুন বা ক্লায়েন্টের ওয়েবসাইট URL পেস্ট করুন। আমাদের AI স্বয়ংক্রিয়ভাবে ব্যবসায়িক প্রসঙ্গ, পণ্য এবং ব্র্যান্ড তথ্য বের করে।",
    "howItWorks.step2Title": "AI ফ্লো তৈরি করে",
    "howItWorks.step2Desc": "সঠিক মেসেজ ধরন, বাটন এবং গ্রাহক প্রতিক্রিয়া সহ একটি সম্পূর্ণ, শিল্প-সচেতন কথোপকথন ফ্লো পান — সব কিছু সেকেন্ডে।",
    "howItWorks.step3Title": "ক্লায়েন্টের সাথে শেয়ার করুন",
    "howItWorks.step3Desc": "ইন্টারেক্টিভ সিমুলেশন প্রিভিউ করুন, প্রয়োজনে সূক্ষ্ম সমন্বয় করুন, তারপর লিঙ্ক শেয়ার করুন বা সরাসরি WhatsApp মকআপ উপস্থাপন করুন।",

    // Messaging types
    "msgTypes.title": "প্রতিটি WhatsApp মেসেজিং ব্যবহারের ক্ষেত্র কভার করুন",
    "msgTypes.subtitle": "তিনটি WhatsApp পেইড মেসেজিং বিভাগে ডেমো তৈরি করুন, প্রতিটি আপনার ক্লায়েন্টদের ব্যবসায়িক ফলাফলের সাথে সংযুক্ত",
    "msgTypes.marketing": "মার্কেটিং মেসেজ",
    "msgTypes.marketingSub": "বিক্রয় ও গ্রাহক ধরে রাখা বাড়ান",
    "msgTypes.utility": "ইউটিলিটি মেসেজ",
    "msgTypes.utilitySub": "পরিচালন দক্ষতা বাড়ান",
    "msgTypes.auth": "প্রমাণীকরণ মেসেজ",
    "msgTypes.authSub": "নিরাপত্তা ও বিশ্বাস বাড়ান",

    // Template quality
    "quality.title": "টেমপ্লেট গুণমান কেন গুরুত্বপূর্ণ",
    "quality.subtitle": "একটি ভালো এবং দুর্দান্ত WhatsApp টেমপ্লেটের মধ্যে পার্থক্য আপনার ক্লায়েন্টদের জন্য ২-৩ গুণ বেশি রূপান্তর হতে পারে",

    // CTA
    "cta.title": "WhatsApp আরও কার্যকরভাবে পিচ করতে প্রস্তুত?",
    "cta.subtitle": "সেকেন্ডে পেশাদার, ইন্টারেক্টিভ WhatsApp কথোপকথন ডেমো তৈরি করুন। আপনার ক্লায়েন্টদের দেখান তাদের মেসেজিং অভিজ্ঞতা ঠিক কেমন হবে।",

    // Footer
    "footer.tagline": "WhatsApp পেইড মেসেজিং পিচ করার জন্য Meta অ্যাকাউন্ট ম্যানেজারদের জন্য তৈরি",

    // Create Tailored Pitch dialog
    "dialog.title": "কাস্টম পিচ তৈরি করুন",
    "dialog.threadName": "থ্রেডের নাম",
    "dialog.threadNamePlaceholder": "যেমন, FoodArt স্টোর মার্কেটিং ক্যাম্পেইন",
    "dialog.industry": "শিল্প",
    "dialog.selectIndustry": "শিল্প নির্বাচন করুন",
    "dialog.messageType": "মেসেজ ধরন",
    "dialog.clientUrl": "ক্লায়েন্ট ওয়েবসাইট URL",
    "dialog.clientUrlOptional": "(ঐচ্ছিক)",
    "dialog.clientUrlPlaceholder": "যেমন, https://www.clientbrand.com",
    "dialog.clientUrlHint": "AI ওয়েবসাইট বিশ্লেষণ করে প্রকৃত পণ্য ও ব্র্যান্ডিং দিয়ে আপনার পিচ ব্যক্তিগতকৃত করবে",
    "dialog.createButton": "তৈরি করুন ও শুরু করুন",
    "dialog.creating": "তৈরি হচ্ছে...",
    "dialog.conversationLanguage": "কথোপকথনের ভাষা",
    "dialog.languageHint": "AI-তৈরি WhatsApp কথোপকথন এই ভাষায় হবে",

    // Templates page
    "templates.title": "শিল্প ব্যবহারের ক্ষেত্র টেমপ্লেট লাইব্রেরি",
    "templates.subtitle": "{industries}টি শিল্পে প্রস্তুত কথোপকথন টেমপ্লেট। WhatsApp পেইড মেসেজিং গ্রহণের জন্য নতুন ব্যবহারের ক্ষেত্র খুঁজুন।",
    "templates.allIndustries": "সব শিল্প",
    "templates.allTypes": "সব ধরন",
    "templates.search": "টেমপ্লেট খুঁজুন...",
    "templates.marketing": "মার্কেটিং",
    "templates.utility": "ইউটিলিটি",
    "templates.auth": "প্রমাণীকরণ",
    "templates.activeFilters": "সক্রিয় ফিল্টার:",
    "templates.clearAll": "সব মুছুন",
    "templates.noResults": "কোনো টেমপ্লেট পাওয়া যায়নি",
    "templates.noResultsHint": "আপনার ফিল্টার বা অনুসন্ধান সমন্বয় করুন",
    "templates.useTemplate": "টেমপ্লেট ব্যবহার করুন",
    "templates.generating": "তৈরি হচ্ছে...",
    "templates.conversationLanguage": "কথোপকথনের ভাষা",

    // Builder
    "builder.aiGenerate": "AI তৈরি",
    "builder.manualEdit": "ম্যানুয়াল সম্পাদনা",
    "builder.promptLabel": "আপনি যে কথোপকথন ফ্লো তৈরি করতে চান তা বর্ণনা করুন",
    "builder.promptPlaceholder": "যেমন, \"ফুড ডেলিভারি অ্যাপের জন্য WhatsApp মার্কেটিং মেসেজ ফ্লো তৈরি করুন...\"",
    "builder.generateButton": "কথোপকথন ফ্লো তৈরি করুন",
    "builder.generating": "তৈরি হচ্ছে...",
    "builder.clientAssets": "ক্লায়েন্ট অ্যাসেট (ঐচ্ছিক)",
    "builder.uploadAssets": "ফটো, ওয়ার্কফ্লো ডায়াগ্রাম বা পণ্যের ছবি আপলোড করুন",
    "builder.conversationLanguage": "কথোপকথনের ভাষা",
    "builder.languageHint": "তৈরি কথোপকথন এই ভাষায় হবে",
  },

  ta: {
    // Navigation
    "nav.industryTemplates": "தொழில் வார்ப்புருக்கள்",
    "nav.roiCalculator": "ROI கணிப்பான்",
    "nav.apiDocs": "API ஆவணங்கள்",
    "nav.signOut": "வெளியேறு",
    "nav.signIn": "உள்நுழை",
    "nav.myThreads": "எனது த்ரெட்கள்",

    // Landing page
    "home.badge": "Meta கணக்கு மேலாளர்களுக்காக உருவாக்கப்பட்டது",
    "home.title": "WhatsApp கட்டண செய்தி டெமோக்களை உருவாக்குங்கள்",
    "home.titleHighlight": " சில நொடிகளில்",
    "home.subtitle": "WhatsApp மாக்அப்களை கைமுறையாக உருவாக்குவதில் மணிநேரம் செலவிடுவதை நிறுத்துங்கள். எளிய தமிழில் உங்கள் பயன்பாட்டு நிலையை விவரிக்கவும், உடனடியாக ஊடாடும் உரையாடல் ஓட்டத்தைப் பெறுங்கள் — வாடிக்கையாளருக்கு முன்வைக்கத் தயார்.",
    "home.browseTemplates": "தொழில் வார்ப்புருக்களை உலாவுக",
    "home.createTailored": "தனிப்பயன் பிட்ச் உருவாக்குக",
    "home.roiCalculator": "ROI கணிப்பான்",
    "home.getStarted": "தொடங்குங்கள்",

    // Stats
    "stats.openRate": "செய்தி திறப்பு விகிதம்",
    "stats.openRateSub": "மின்னஞ்சலின் 20% உடன் ஒப்பிடும்போது",
    "stats.higherCtr": "அதிக CTR",
    "stats.higherCtrSub": "பாரம்பரிய சேனல்களுடன் ஒப்பிடும்போது",
    "stats.waUsers": "WhatsApp பயனர்கள்",
    "stats.waUsersSub": "உலகளாவிய மாதாந்திர செயலில்",
    "stats.templates": "தயார் வார்ப்புருக்கள்",
    "stats.templatesSub": "15 தொழில்களில்",

    // How it works
    "howItWorks.title": "சரியான பிட்ச்சுக்கான மூன்று படிகள்",
    "howItWorks.subtitle": "ஒரு நிமிடத்திற்குள் யோசனையிலிருந்து ஊடாடும் WhatsApp டெமோவுக்கு",
    "howItWorks.step1Title": "உங்கள் பயன்பாட்டு நிலையை விவரிக்கவும்",
    "howItWorks.step1Desc": "எளிய தமிழில் தட்டச்சு செய்யுங்கள் அல்லது வாடிக்கையாளரின் வலைத்தள URL ஐ ஒட்டுங்கள். எங்கள் AI தானாகவே வணிக சூழல், தயாரிப்புகள் மற்றும் பிராண்ட் தகவலைப் பிரித்தெடுக்கும்.",
    "howItWorks.step2Title": "AI ஓட்டத்தை உருவாக்குகிறது",
    "howItWorks.step2Desc": "சரியான செய்தி வகைகள், பொத்தான்கள் மற்றும் வாடிக்கையாளர் பதில்களுடன் முழுமையான, தொழில்-அறிவுள்ள உரையாடல் ஓட்டத்தைப் பெறுங்கள் — அனைத்தும் நொடிகளில்.",
    "howItWorks.step3Title": "வாடிக்கையாளருடன் பகிரவும்",
    "howItWorks.step3Desc": "ஊடாடும் உருவகப்படுத்தலை முன்னோட்டமிடுங்கள், தேவைப்பட்டால் நுணுக்கமாக மாற்றுங்கள், பின்னர் இணைப்பைப் பகிரவும் அல்லது நேரடியாக WhatsApp மாக்அப்பை வழங்கவும்.",

    // Messaging types
    "msgTypes.title": "ஒவ்வொரு WhatsApp செய்தி பயன்பாட்டு நிலையையும் உள்ளடக்குங்கள்",
    "msgTypes.subtitle": "மூன்று WhatsApp கட்டண செய்தி வகைகளிலும் டெமோக்களை உருவாக்குங்கள், ஒவ்வொன்றும் உங்கள் வாடிக்கையாளர்களின் வணிக முடிவுகளுடன் இணைக்கப்பட்டுள்ளது",
    "msgTypes.marketing": "சந்தைப்படுத்தல் செய்திகள்",
    "msgTypes.marketingSub": "விற்பனை & வாடிக்கையாளர் தக்கவைப்பை அதிகரிக்கவும்",
    "msgTypes.utility": "பயன்பாட்டு செய்திகள்",
    "msgTypes.utilitySub": "செயல்பாட்டு திறனை அதிகரிக்கவும்",
    "msgTypes.auth": "அங்கீகார செய்திகள்",
    "msgTypes.authSub": "பாதுகாப்பு & நம்பிக்கையை மேம்படுத்தவும்",

    // Template quality
    "quality.title": "வார்ப்புரு தரம் ஏன் முக்கியம்",
    "quality.subtitle": "நல்ல மற்றும் சிறந்த WhatsApp வார்ப்புருவுக்கு இடையிலான வேறுபாடு உங்கள் வாடிக்கையாளர்களுக்கு 2-3 மடங்கு அதிக மாற்றங்களை அர்த்தப்படுத்தும்",

    // CTA
    "cta.title": "WhatsApp ஐ மிகவும் திறம்பட முன்வைக்கத் தயாரா?",
    "cta.subtitle": "நொடிகளில் தொழில்முறை, ஊடாடும் WhatsApp உரையாடல் டெமோக்களை உருவாக்குங்கள். உங்கள் வாடிக்கையாளர்களுக்கு அவர்களின் செய்தி அனுபவம் எப்படி இருக்கும் என்பதைக் காட்டுங்கள்.",

    // Footer
    "footer.tagline": "WhatsApp கட்டண செய்தியை முன்வைக்க Meta கணக்கு மேலாளர்களுக்காக உருவாக்கப்பட்டது",

    // Create Tailored Pitch dialog
    "dialog.title": "தனிப்பயன் பிட்ச் உருவாக்குக",
    "dialog.threadName": "த்ரெட் பெயர்",
    "dialog.threadNamePlaceholder": "எ.கா., FoodArt ஸ்டோர் சந்தைப்படுத்தல் பிரச்சாரம்",
    "dialog.industry": "தொழில்",
    "dialog.selectIndustry": "தொழிலைத் தேர்ந்தெடுக்கவும்",
    "dialog.messageType": "செய்தி வகை",
    "dialog.clientUrl": "வாடிக்கையாளர் வலைத்தள URL",
    "dialog.clientUrlOptional": "(விருப்பத்தேர்வு)",
    "dialog.clientUrlPlaceholder": "எ.கா., https://www.clientbrand.com",
    "dialog.clientUrlHint": "AI வலைத்தளத்தை பகுப்பாய்வு செய்து உண்மையான தயாரிப்புகள் மற்றும் பிராண்டிங்குடன் உங்கள் பிட்ச்சை தனிப்பயனாக்கும்",
    "dialog.createButton": "உருவாக்கி தொடங்குக",
    "dialog.creating": "உருவாக்கப்படுகிறது...",
    "dialog.conversationLanguage": "உரையாடல் மொழி",
    "dialog.languageHint": "AI-உருவாக்கிய WhatsApp உரையாடல் இந்த மொழியில் இருக்கும்",

    // Templates page
    "templates.title": "தொழில் பயன்பாட்டு நிலை வார்ப்புரு நூலகம்",
    "templates.subtitle": "{industries} தொழில்களில் தயார் உரையாடல் வார்ப்புருக்கள். WhatsApp கட்டண செய்தி ஏற்றுக்கொள்ளலுக்கான புதிய பயன்பாட்டு நிலைகளைக் கண்டறியுங்கள்.",
    "templates.allIndustries": "அனைத்து தொழில்கள்",
    "templates.allTypes": "அனைத்து வகைகள்",
    "templates.search": "வார்ப்புருக்களைத் தேடு...",
    "templates.marketing": "சந்தைப்படுத்தல்",
    "templates.utility": "பயன்பாடு",
    "templates.auth": "அங்கீகாரம்",
    "templates.activeFilters": "செயலில் வடிகட்டிகள்:",
    "templates.clearAll": "அனைத்தையும் அழி",
    "templates.noResults": "வார்ப்புருக்கள் எதுவும் கிடைக்கவில்லை",
    "templates.noResultsHint": "உங்கள் வடிகட்டிகள் அல்லது தேடலை சரிசெய்யவும்",
    "templates.useTemplate": "வார்ப்புருவைப் பயன்படுத்து",
    "templates.generating": "உருவாக்கப்படுகிறது...",
    "templates.conversationLanguage": "உரையாடல் மொழி",

    // Builder
    "builder.aiGenerate": "AI உருவாக்கு",
    "builder.manualEdit": "கைமுறை திருத்தம்",
    "builder.promptLabel": "நீங்கள் உருவாக்க விரும்பும் உரையாடல் ஓட்டத்தை விவரிக்கவும்",
    "builder.promptPlaceholder": "எ.கா., \"உணவு விநியோக செயலிக்கான WhatsApp சந்தைப்படுத்தல் செய்தி ஓட்டத்தை உருவாக்குங்கள்...\"",
    "builder.generateButton": "உரையாடல் ஓட்டத்தை உருவாக்கு",
    "builder.generating": "உருவாக்கப்படுகிறது...",
    "builder.clientAssets": "வாடிக்கையாளர் சொத்துக்கள் (விருப்பத்தேர்வு)",
    "builder.uploadAssets": "புகைப்படங்கள், பணிப்பாய்வு வரைபடங்கள் அல்லது தயாரிப்பு படங்களை பதிவேற்றவும்",
    "builder.conversationLanguage": "உரையாடல் மொழி",
    "builder.languageHint": "உருவாக்கப்பட்ட உரையாடல் இந்த மொழியில் இருக்கும்",
  },

  mr: {
    // Navigation
    "nav.industryTemplates": "उद्योग टेम्पलेट",
    "nav.roiCalculator": "ROI कॅल्क्युलेटर",
    "nav.apiDocs": "API दस्तऐवज",
    "nav.signOut": "साइन आउट",
    "nav.signIn": "साइन इन",
    "nav.myThreads": "माझे थ्रेड",

    // Landing page
    "home.badge": "Meta अकाउंट मॅनेजर्ससाठी तयार केलेले",
    "home.title": "WhatsApp पेड मेसेजिंग डेमो तयार करा",
    "home.titleHighlight": " काही सेकंदांत",
    "home.subtitle": "WhatsApp मॉकअप मॅन्युअली तयार करण्यात तास घालवणे थांबवा. साध्या मराठीत तुमचा वापर केस सांगा आणि लगेच एक इंटरॅक्टिव्ह संवाद फ्लो मिळवा — क्लायंटला पिच करण्यासाठी तयार.",
    "home.browseTemplates": "उद्योग टेम्पलेट ब्राउझ करा",
    "home.createTailored": "सानुकूल पिच तयार करा",
    "home.roiCalculator": "ROI कॅल्क्युलेटर",
    "home.getStarted": "सुरू करा",

    // Stats
    "stats.openRate": "मेसेज ओपन रेट",
    "stats.openRateSub": "ईमेलच्या 20% च्या तुलनेत",
    "stats.higherCtr": "अधिक CTR",
    "stats.higherCtrSub": "पारंपरिक चॅनेलच्या तुलनेत",
    "stats.waUsers": "WhatsApp वापरकर्ते",
    "stats.waUsersSub": "जगभरातील मासिक सक्रिय",
    "stats.templates": "तयार टेम्पलेट",
    "stats.templatesSub": "15 उद्योगांमध्ये",

    // How it works
    "howItWorks.title": "परिपूर्ण पिचसाठी तीन पायऱ्या",
    "howItWorks.subtitle": "एका मिनिटापेक्षा कमी वेळात कल्पनेपासून इंटरॅक्टिव्ह WhatsApp डेमोपर्यंत",
    "howItWorks.step1Title": "तुमचा वापर केस सांगा",
    "howItWorks.step1Desc": "साध्या मराठीत टाइप करा किंवा क्लायंटचा वेबसाइट URL पेस्ट करा. आमचा AI आपोआप व्यवसाय संदर्भ, उत्पादने आणि ब्रँड माहिती काढतो.",
    "howItWorks.step2Title": "AI फ्लो तयार करतो",
    "howItWorks.step2Desc": "योग्य मेसेज प्रकार, बटणे आणि ग्राहक प्रतिसादांसह एक पूर्ण, उद्योग-जागरूक संवाद फ्लो मिळवा — सर्व काही सेकंदांत.",
    "howItWorks.step3Title": "क्लायंटसोबत शेअर करा",
    "howItWorks.step3Desc": "इंटरॅक्टिव्ह सिम्युलेशनचे पूर्वावलोकन करा, आवश्यक असल्यास बारीक बदल करा, मग लिंक शेअर करा किंवा थेट WhatsApp मॉकअप सादर करा.",

    // Messaging types
    "msgTypes.title": "प्रत्येक WhatsApp मेसेजिंग वापर केस कव्हर करा",
    "msgTypes.subtitle": "तिन्ही WhatsApp पेड मेसेजिंग श्रेणींमध्ये डेमो तयार करा, प्रत्येक तुमच्या क्लायंट्सच्या व्यावसायिक परिणामांशी जोडलेला",
    "msgTypes.marketing": "मार्केटिंग मेसेज",
    "msgTypes.marketingSub": "विक्री आणि ग्राहक टिकवणूक वाढवा",
    "msgTypes.utility": "युटिलिटी मेसेज",
    "msgTypes.utilitySub": "ऑपरेशनल कार्यक्षमता वाढवा",
    "msgTypes.auth": "प्रमाणीकरण मेसेज",
    "msgTypes.authSub": "सुरक्षितता आणि विश्वास वाढवा",

    // Template quality
    "quality.title": "टेम्पलेट गुणवत्ता का महत्त्वाची आहे",
    "quality.subtitle": "चांगल्या आणि उत्कृष्ट WhatsApp टेम्पलेटमधील फरक तुमच्या क्लायंट्ससाठी 2-3 पट अधिक रूपांतरण असू शकतो",

    // CTA
    "cta.title": "WhatsApp अधिक प्रभावीपणे पिच करण्यास तयार आहात?",
    "cta.subtitle": "सेकंदांत व्यावसायिक, इंटरॅक्टिव्ह WhatsApp संवाद डेमो तयार करा. तुमच्या क्लायंट्सना दाखवा की त्यांचा मेसेजिंग अनुभव कसा दिसेल.",

    // Footer
    "footer.tagline": "WhatsApp पेड मेसेजिंग पिच करण्यासाठी Meta अकाउंट मॅनेजर्ससाठी तयार केलेले",

    // Create Tailored Pitch dialog
    "dialog.title": "सानुकूल पिच तयार करा",
    "dialog.threadName": "थ्रेडचे नाव",
    "dialog.threadNamePlaceholder": "उदा., FoodArt स्टोअर मार्केटिंग मोहीम",
    "dialog.industry": "उद्योग",
    "dialog.selectIndustry": "उद्योग निवडा",
    "dialog.messageType": "मेसेज प्रकार",
    "dialog.clientUrl": "क्लायंट वेबसाइट URL",
    "dialog.clientUrlOptional": "(ऐच्छिक)",
    "dialog.clientUrlPlaceholder": "उदा., https://www.clientbrand.com",
    "dialog.clientUrlHint": "AI वेबसाइटचे विश्लेषण करून खऱ्या उत्पादनांसह आणि ब्रँडिंगसह तुमची पिच वैयक्तिकृत करेल",
    "dialog.createButton": "तयार करा आणि सुरू करा",
    "dialog.creating": "तयार होत आहे...",
    "dialog.conversationLanguage": "संवादाची भाषा",
    "dialog.languageHint": "AI-निर्मित WhatsApp संवाद या भाषेत असेल",

    // Templates page
    "templates.title": "उद्योग वापर केस टेम्पलेट लायब्ररी",
    "templates.subtitle": "{industries} उद्योगांमध्ये तयार संवाद टेम्पलेट. WhatsApp पेड मेसेजिंग स्वीकारण्यासाठी नवीन वापर केस शोधा.",
    "templates.allIndustries": "सर्व उद्योग",
    "templates.allTypes": "सर्व प्रकार",
    "templates.search": "टेम्पलेट शोधा...",
    "templates.marketing": "मार्केटिंग",
    "templates.utility": "युटिलिटी",
    "templates.auth": "प्रमाणीकरण",
    "templates.activeFilters": "सक्रिय फिल्टर:",
    "templates.clearAll": "सर्व काढा",
    "templates.noResults": "कोणतेही टेम्पलेट सापडले नाहीत",
    "templates.noResultsHint": "तुमचे फिल्टर किंवा शोध क्वेरी समायोजित करा",
    "templates.useTemplate": "टेम्पलेट वापरा",
    "templates.generating": "तयार होत आहे...",
    "templates.conversationLanguage": "संवादाची भाषा",

    // Builder
    "builder.aiGenerate": "AI तयार करा",
    "builder.manualEdit": "मॅन्युअल संपादन",
    "builder.promptLabel": "तुम्हाला तयार करायचा असलेला संवाद फ्लो वर्णन करा",
    "builder.promptPlaceholder": "उदा., \"फूड डिलिव्हरी ॲपसाठी WhatsApp मार्केटिंग मेसेज फ्लो तयार करा...\"",
    "builder.generateButton": "संवाद फ्लो तयार करा",
    "builder.generating": "तयार होत आहे...",
    "builder.clientAssets": "क्लायंट ॲसेट (ऐच्छिक)",
    "builder.uploadAssets": "फोटो, वर्कफ्लो आकृत्या किंवा उत्पादन प्रतिमा अपलोड करा",
    "builder.conversationLanguage": "संवादाची भाषा",
    "builder.languageHint": "तयार केलेला संवाद या भाषेत असेल",
  },

  te: {
    // Navigation
    "nav.industryTemplates": "పరిశ్రమ టెంప్లేట్లు",
    "nav.roiCalculator": "ROI కాలిక్యులేటర్",
    "nav.apiDocs": "API డాక్యుమెంటేషన్",
    "nav.signOut": "సైన్ అవుట్",
    "nav.signIn": "సైన్ ఇన్",
    "nav.myThreads": "నా థ్రెడ్‌లు",

    // Landing page
    "home.badge": "Meta ఖాతా నిర్వాహకుల కోసం రూపొందించబడింది",
    "home.title": "WhatsApp చెల్లింపు సందేశ డెమోలను సృష్టించండి",
    "home.titleHighlight": " కొన్ని సెకన్లలో",
    "home.subtitle": "WhatsApp మాక్‌అప్‌లను మాన్యువల్‌గా రూపొందించడంలో గంటలు వెచ్చించడం ఆపండి. సాధారణ తెలుగులో మీ వినియోగ సందర్భాన్ని వివరించండి మరియు వెంటనే ఇంటరాక్టివ్ సంభాషణ ఫ్లోను పొందండి — క్లయింట్‌కు పిచ్ చేయడానికి సిద్ధంగా.",
    "home.browseTemplates": "పరిశ్రమ టెంప్లేట్లను బ్రౌజ్ చేయండి",
    "home.createTailored": "అనుకూల పిచ్ సృష్టించండి",
    "home.roiCalculator": "ROI కాలిక్యులేటర్",
    "home.getStarted": "ప్రారంభించండి",

    // Stats
    "stats.openRate": "సందేశ ఓపెన్ రేట్",
    "stats.openRateSub": "ఇమెయిల్ 20% తో పోలిస్తే",
    "stats.higherCtr": "ఎక్కువ CTR",
    "stats.higherCtrSub": "సాంప్రదాయ ఛానెల్‌లతో పోలిస్తే",
    "stats.waUsers": "WhatsApp వినియోగదారులు",
    "stats.waUsersSub": "ప్రపంచవ్యాప్తంగా నెలవారీ యాక్టివ్",
    "stats.templates": "సిద్ధంగా ఉన్న టెంప్లేట్లు",
    "stats.templatesSub": "15 పరిశ్రమలలో",

    // How it works
    "howItWorks.title": "పర్ఫెక్ట్ పిచ్ కోసం మూడు దశలు",
    "howItWorks.subtitle": "ఒక నిమిషంలోపు ఆలోచన నుండి ఇంటరాక్టివ్ WhatsApp డెమోకు",
    "howItWorks.step1Title": "మీ వినియోగ సందర్భాన్ని వివరించండి",
    "howItWorks.step1Desc": "సాధారణ తెలుగులో టైప్ చేయండి లేదా క్లయింట్ వెబ్‌సైట్ URL పేస్ట్ చేయండి. మా AI స్వయంచాలకంగా వ్యాపార సందర్భం, ఉత్పత్తులు మరియు బ్రాండ్ సమాచారాన్ని సేకరిస్తుంది.",
    "howItWorks.step2Title": "AI ఫ్లోను రూపొందిస్తుంది",
    "howItWorks.step2Desc": "సరైన సందేశ రకాలు, బటన్లు మరియు కస్టమర్ ప్రతిస్పందనలతో పూర్తి, పరిశ్రమ-అవగాహన సంభాషణ ఫ్లోను పొందండి — అన్నీ సెకన్లలో.",
    "howItWorks.step3Title": "క్లయింట్‌తో షేర్ చేయండి",
    "howItWorks.step3Desc": "ఇంటరాక్టివ్ సిమ్యులేషన్‌ను ప్రివ్యూ చేయండి, అవసరమైతే సర్దుబాటు చేయండి, ఆపై లింక్ షేర్ చేయండి లేదా నేరుగా WhatsApp మాక్‌అప్‌ను ప్రదర్శించండి.",

    // Messaging types
    "msgTypes.title": "ప్రతి WhatsApp సందేశ వినియోగ సందర్భాన్ని కవర్ చేయండి",
    "msgTypes.subtitle": "మూడు WhatsApp చెల్లింపు సందేశ వర్గాలలో డెమోలను రూపొందించండి, ప్రతి ఒక్కటి మీ క్లయింట్ల వ్యాపార ఫలితాలకు అనుసంధానించబడింది",
    "msgTypes.marketing": "మార్కెటింగ్ సందేశాలు",
    "msgTypes.marketingSub": "విక్రయాలు & కస్టమర్ నిలుపుదలను పెంచండి",
    "msgTypes.utility": "యుటిలిటీ సందేశాలు",
    "msgTypes.utilitySub": "కార్యాచరణ సామర్థ్యాన్ని పెంచండి",
    "msgTypes.auth": "ప్రమాణీకరణ సందేశాలు",
    "msgTypes.authSub": "భద్రత & విశ్వాసాన్ని మెరుగుపరచండి",

    // Template quality
    "quality.title": "టెంప్లేట్ నాణ్యత ఎందుకు ముఖ్యం",
    "quality.subtitle": "మంచి మరియు అద్భుతమైన WhatsApp టెంప్లేట్ మధ్య తేడా మీ క్లయింట్లకు 2-3 రెట్లు ఎక్కువ మార్పిడులను అర్థం చేసుకోవచ్చు",

    // CTA
    "cta.title": "WhatsApp ను మరింత ప్రభావవంతంగా పిచ్ చేయడానికి సిద్ధంగా ఉన్నారా?",
    "cta.subtitle": "సెకన్లలో ప్రొఫెషనల్, ఇంటరాక్టివ్ WhatsApp సంభాషణ డెమోలను సృష్టించండి. మీ క్లయింట్లకు వారి సందేశ అనుభవం ఎలా ఉంటుందో చూపించండి.",

    // Footer
    "footer.tagline": "WhatsApp చెల్లింపు సందేశాన్ని పిచ్ చేయడానికి Meta ఖాతా నిర్వాహకుల కోసం రూపొందించబడింది",

    // Create Tailored Pitch dialog
    "dialog.title": "అనుకూల పిచ్ సృష్టించండి",
    "dialog.threadName": "థ్రెడ్ పేరు",
    "dialog.threadNamePlaceholder": "ఉదా., FoodArt స్టోర్ మార్కెటింగ్ ప్రచారం",
    "dialog.industry": "పరిశ్రమ",
    "dialog.selectIndustry": "పరిశ్రమను ఎంచుకోండి",
    "dialog.messageType": "సందేశ రకం",
    "dialog.clientUrl": "క్లయింట్ వెబ్‌సైట్ URL",
    "dialog.clientUrlOptional": "(ఐచ్ఛికం)",
    "dialog.clientUrlPlaceholder": "ఉదా., https://www.clientbrand.com",
    "dialog.clientUrlHint": "AI వెబ్‌సైట్‌ను విశ్లేషించి నిజమైన ఉత్పత్తులు మరియు బ్రాండింగ్‌తో మీ పిచ్‌ను వ్యక్తిగతీకరిస్తుంది",
    "dialog.createButton": "సృష్టించి ప్రారంభించండి",
    "dialog.creating": "సృష్టిస్తోంది...",
    "dialog.conversationLanguage": "సంభాషణ భాష",
    "dialog.languageHint": "AI-రూపొందించిన WhatsApp సంభాషణ ఈ భాషలో ఉంటుంది",

    // Templates page
    "templates.title": "పరిశ్రమ వినియోగ సందర్భ టెంప్లేట్ లైబ్రరీ",
    "templates.subtitle": "{industries} పరిశ్రమలలో సిద్ధంగా ఉన్న సంభాషణ టెంప్లేట్లు. WhatsApp చెల్లింపు సందేశ స్వీకరణ కోసం కొత్త వినియోగ సందర్భాలను కనుగొనండి.",
    "templates.allIndustries": "అన్ని పరిశ్రమలు",
    "templates.allTypes": "అన్ని రకాలు",
    "templates.search": "టెంప్లేట్లను వెతకండి...",
    "templates.marketing": "మార్కెటింగ్",
    "templates.utility": "యుటిలిటీ",
    "templates.auth": "ప్రమాణీకరణ",
    "templates.activeFilters": "యాక్టివ్ ఫిల్టర్లు:",
    "templates.clearAll": "అన్నీ తొలగించు",
    "templates.noResults": "టెంప్లేట్లు ఏవీ కనుగొనబడలేదు",
    "templates.noResultsHint": "మీ ఫిల్టర్లు లేదా శోధన ప్రశ్నను సర్దుబాటు చేయండి",
    "templates.useTemplate": "టెంప్లేట్ ఉపయోగించు",
    "templates.generating": "రూపొందిస్తోంది...",
    "templates.conversationLanguage": "సంభాషణ భాష",

    // Builder
    "builder.aiGenerate": "AI రూపొందించు",
    "builder.manualEdit": "మాన్యువల్ ఎడిట్",
    "builder.promptLabel": "మీరు సృష్టించాలనుకుంటున్న సంభాషణ ఫ్లోను వివరించండి",
    "builder.promptPlaceholder": "ఉదా., \"ఫుడ్ డెలివరీ యాప్ కోసం WhatsApp మార్కెటింగ్ సందేశ ఫ్లోను సృష్టించండి...\"",
    "builder.generateButton": "సంభాషణ ఫ్లోను రూపొందించు",
    "builder.generating": "రూపొందిస్తోంది...",
    "builder.clientAssets": "క్లయింట్ ఆస్తులు (ఐచ్ఛికం)",
    "builder.uploadAssets": "ఫోటోలు, వర్క్‌ఫ్లో రేఖాచిత్రాలు లేదా ఉత్పత్తి చిత్రాలను అప్‌లోడ్ చేయండి",
    "builder.conversationLanguage": "సంభాషణ భాష",
    "builder.languageHint": "రూపొందించిన సంభాషణ ఈ భాషలో ఉంటుంది",
  },

  id: {
    // Navigation
    "nav.industryTemplates": "Template Industri",
    "nav.roiCalculator": "Kalkulator ROI",
    "nav.apiDocs": "Dokumentasi API",
    "nav.signOut": "Keluar",
    "nav.signIn": "Masuk",
    "nav.myThreads": "Utas Saya",

    // Landing page
    "home.badge": "Dibuat untuk Manajer Akun Meta",
    "home.title": "Buat Demo Pesan Berbayar WhatsApp",
    "home.titleHighlight": " dalam Hitungan Detik",
    "home.subtitle": "Berhenti menghabiskan waktu berjam-jam membuat mockup WhatsApp secara manual. Jelaskan kebutuhan Anda dalam bahasa Indonesia dan dapatkan alur percakapan interaktif secara instan \u2014 siap dipresentasikan ke klien.",
    "home.browseTemplates": "Jelajahi Template Industri",
    "home.createTailored": "Buat Presentasi Khusus",
    "home.roiCalculator": "Kalkulator ROI",
    "home.getStarted": "Mulai Sekarang",

    // Stats
    "stats.openRate": "Tingkat Buka Pesan",
    "stats.openRateSub": "dibanding 20% untuk email",
    "stats.higherCtr": "CTR Lebih Tinggi",
    "stats.higherCtrSub": "dibanding saluran tradisional",
    "stats.waUsers": "Pengguna WhatsApp",
    "stats.waUsersSub": "aktif bulanan di seluruh dunia",
    "stats.templates": "Template Siap Pakai",
    "stats.templatesSub": "di 15 industri",

    // How it works
    "howItWorks.title": "Tiga Langkah Menuju Presentasi Sempurna",
    "howItWorks.subtitle": "Dari ide ke demo WhatsApp interaktif dalam waktu kurang dari satu menit",
    "howItWorks.step1Title": "Jelaskan Kebutuhan Anda",
    "howItWorks.step1Desc": "Ketik kebutuhan Anda dalam bahasa Indonesia, atau tempel URL situs web klien. AI kami secara otomatis mengekstrak konteks bisnis, produk, dan informasi merek.",
    "howItWorks.step2Title": "AI Membuat Alur Percakapan",
    "howItWorks.step2Desc": "Dapatkan alur percakapan lengkap yang sesuai industri dengan jenis pesan, tombol, dan respons pelanggan yang tepat \u2014 semuanya dalam hitungan detik.",
    "howItWorks.step3Title": "Bagikan ke Klien",
    "howItWorks.step3Desc": "Pratinjau simulasi interaktif, sesuaikan jika perlu, lalu bagikan tautan atau presentasikan mockup WhatsApp secara langsung.",

    // Messaging types
    "msgTypes.title": "Cakup Setiap Kasus Penggunaan Pesan WhatsApp",
    "msgTypes.subtitle": "Buat demo di ketiga kategori Pesan Berbayar WhatsApp, masing-masing dipetakan ke hasil bisnis yang penting bagi klien Anda",
    "msgTypes.marketing": "Pesan Pemasaran",
    "msgTypes.marketingSub": "Dorong Penjualan & Retensi Pelanggan",
    "msgTypes.utility": "Pesan Utilitas",
    "msgTypes.utilitySub": "Tingkatkan Efisiensi Operasional",
    "msgTypes.auth": "Pesan Autentikasi",
    "msgTypes.authSub": "Tingkatkan Keamanan & Kepercayaan",

    // Template quality
    "quality.title": "Mengapa Kualitas Template Penting",
    "quality.subtitle": "Perbedaan antara template WhatsApp yang baik dan yang hebat bisa berarti 2-3x lebih banyak konversi untuk klien Anda",

    // CTA
    "cta.title": "Siap Mempresentasikan WhatsApp Lebih Efektif?",
    "cta.subtitle": "Buat demo percakapan WhatsApp yang profesional dan interaktif dalam hitungan detik. Tunjukkan kepada klien Anda seperti apa pengalaman pesan mereka nantinya.",

    // Footer
    "footer.tagline": "Dibuat untuk Manajer Akun Meta untuk mempresentasikan Pesan Berbayar WhatsApp",

    // Create Tailored Pitch dialog
    "dialog.title": "Buat Presentasi Khusus",
    "dialog.threadName": "Nama Utas",
    "dialog.threadNamePlaceholder": "contoh: Kampanye Pemasaran Toko FoodArt",
    "dialog.industry": "Industri",
    "dialog.selectIndustry": "Pilih industri",
    "dialog.messageType": "Jenis Pesan",
    "dialog.clientUrl": "URL Situs Web Klien",
    "dialog.clientUrlOptional": "(opsional)",
    "dialog.clientUrlPlaceholder": "contoh: https://www.merekklien.com",
    "dialog.clientUrlHint": "AI akan menganalisis situs web untuk mempersonalisasi presentasi Anda dengan produk dan branding asli",
    "dialog.createButton": "Buat & Mulai Membangun",
    "dialog.creating": "Membuat...",
    "dialog.conversationLanguage": "Bahasa Percakapan",
    "dialog.languageHint": "Percakapan WhatsApp yang dibuat AI akan menggunakan bahasa ini",

    // Templates page
    "templates.title": "Pustaka Template Kasus Penggunaan Industri",
    "templates.subtitle": "template percakapan siap pakai di {industries} industri. Temukan peluang baru untuk mendorong adopsi Pesan Berbayar WhatsApp.",
    "templates.allIndustries": "Semua Industri",
    "templates.allTypes": "Semua Jenis",
    "templates.search": "Cari template...",
    "templates.marketing": "Pemasaran",
    "templates.utility": "Utilitas",
    "templates.auth": "Autentikasi",
    "templates.activeFilters": "Filter aktif:",
    "templates.clearAll": "Hapus semua",
    "templates.noResults": "Tidak ada template ditemukan",
    "templates.noResultsHint": "Coba sesuaikan filter atau kata kunci pencarian Anda",
    "templates.useTemplate": "Gunakan Template",
    "templates.generating": "Membuat...",
    "templates.conversationLanguage": "Bahasa Percakapan",

    // Builder
    "builder.aiGenerate": "Buat dengan AI",
    "builder.manualEdit": "Edit Manual",
    "builder.promptLabel": "Jelaskan alur percakapan yang ingin Anda buat",
    "builder.promptPlaceholder": "contoh: \"Buat alur pesan pemasaran WhatsApp untuk aplikasi pengiriman makanan...\"",
    "builder.generateButton": "Buat Alur Percakapan",
    "builder.generating": "Membuat...",
    "builder.clientAssets": "Aset Klien (opsional)",
    "builder.uploadAssets": "Unggah foto, diagram alur kerja, atau gambar produk",
    "builder.conversationLanguage": "Bahasa Percakapan",
    "builder.languageHint": "Percakapan yang dibuat akan menggunakan bahasa ini",
  },

  "zh-CN": {
    // Navigation
    "nav.industryTemplates": "行业模板",
    "nav.roiCalculator": "ROI 计算器",
    "nav.apiDocs": "API 文档",
    "nav.signOut": "退出登录",
    "nav.signIn": "登录",
    "nav.myThreads": "我的会话",

    // Landing page
    "home.badge": "专为 Meta 客户经理打造",
    "home.title": "秒速创建 WhatsApp 付费消息演示",
    "home.titleHighlight": "",
    "home.subtitle": "无需花费数小时手动制作 WhatsApp 模拟图。描述您的需求，即可获得互动式对话流程——随时可以向客户展示。",
    "home.browseTemplates": "浏览行业模板",
    "home.createTailored": "创建定制方案",
    "home.roiCalculator": "ROI 计算器",
    "home.getStarted": "立即开始",

    // Stats
    "stats.openRate": "消息打开率",
    "stats.openRateSub": "对比电子邮件的 20%",
    "stats.higherCtr": "更高的点击率",
    "stats.higherCtrSub": "对比传统渠道",
    "stats.waUsers": "WhatsApp 用户",
    "stats.waUsersSub": "全球月活跃用户",
    "stats.templates": "现成模板",
    "stats.templatesSub": "覆盖 15 个行业",

    // How it works
    "howItWorks.title": "三步完成完美方案",
    "howItWorks.subtitle": "从想法到互动式 WhatsApp 演示，不到一分钟",
    "howItWorks.step1Title": "描述您的需求",
    "howItWorks.step1Desc": "输入您的需求，或粘贴客户网站网址。我们的 AI 会自动提取业务背景、产品和品牌信息。",
    "howItWorks.step2Title": "AI 生成对话流程",
    "howItWorks.step2Desc": "获得完整的行业适配对话流程，包含正确的消息类型、按钮和客户回复——一切只需几秒。",
    "howItWorks.step3Title": "分享给客户",
    "howItWorks.step3Desc": "预览互动模拟，根据需要进行调整，然后分享链接或直接向客户展示 WhatsApp 模拟图。",

    // Messaging types
    "msgTypes.title": "覆盖每一个 WhatsApp 消息场景",
    "msgTypes.subtitle": "在 WhatsApp 付费消息的三大类别中创建演示，每个类别都对应客户关心的业务成果",
    "msgTypes.marketing": "营销消息",
    "msgTypes.marketingSub": "推动销售和客户留存",
    "msgTypes.utility": "事务消息",
    "msgTypes.utilitySub": "提升运营效率",
    "msgTypes.auth": "身份验证消息",
    "msgTypes.authSub": "增强安全性与信任",

    // Template quality
    "quality.title": "为什么模板质量很重要",
    "quality.subtitle": "优质与普通 WhatsApp 模板的差别可能意味着客户转化率提升 2-3 倍",

    // CTA
    "cta.title": "准备好更高效地展示 WhatsApp 了吗？",
    "cta.subtitle": "在几秒钟内创建专业、互动的 WhatsApp 对话演示。向客户展示他们的消息体验将是什么样的。",

    // Footer
    "footer.tagline": "专为 Meta 客户经理打造，用于展示 WhatsApp 付费消息",

    // Create Tailored Pitch dialog
    "dialog.title": "创建定制方案",
    "dialog.threadName": "会话名称",
    "dialog.threadNamePlaceholder": "例如：FoodArt 商店营销活动",
    "dialog.industry": "行业",
    "dialog.selectIndustry": "选择行业",
    "dialog.messageType": "消息类型",
    "dialog.clientUrl": "客户网站网址",
    "dialog.clientUrlOptional": "（可选）",
    "dialog.clientUrlPlaceholder": "例如：https://www.clientbrand.com",
    "dialog.clientUrlHint": "AI 将分析网站，用真实产品和品牌信息个性化您的方案",
    "dialog.createButton": "创建并开始构建",
    "dialog.creating": "创建中...",
    "dialog.conversationLanguage": "对话语言",
    "dialog.languageHint": "AI 生成的 WhatsApp 对话将使用此语言",

    // Templates page
    "templates.title": "行业用例模板库",
    "templates.subtitle": "覆盖 {industries} 个行业的现成对话模板。发现推动 WhatsApp 付费消息采用的新场景。",
    "templates.allIndustries": "所有行业",
    "templates.allTypes": "所有类型",
    "templates.search": "搜索模板...",
    "templates.marketing": "营销",
    "templates.utility": "事务",
    "templates.auth": "身份验证",
    "templates.activeFilters": "当前筛选：",
    "templates.clearAll": "清除全部",
    "templates.noResults": "未找到模板",
    "templates.noResultsHint": "请调整筛选条件或搜索关键词",
    "templates.useTemplate": "使用模板",
    "templates.generating": "生成中...",
    "templates.conversationLanguage": "对话语言",

    // Builder
    "builder.aiGenerate": "AI 生成",
    "builder.manualEdit": "手动编辑",
    "builder.promptLabel": "描述您想要创建的对话流程",
    "builder.promptPlaceholder": "例如：\"为外卖应用创建 WhatsApp 营销消息流程...\"",
    "builder.generateButton": "生成对话流程",
    "builder.generating": "生成中...",
    "builder.clientAssets": "客户素材（可选）",
    "builder.uploadAssets": "上传照片、工作流图或产品图片",
    "builder.conversationLanguage": "对话语言",
    "builder.languageHint": "生成的对话将使用此语言",
  },

  "zh-TW": {
    // Navigation
    "nav.industryTemplates": "產業模板",
    "nav.roiCalculator": "ROI 計算器",
    "nav.apiDocs": "API 文件",
    "nav.signOut": "登出",
    "nav.signIn": "登入",
    "nav.myThreads": "我的對話",

    // Landing page
    "home.badge": "專為 Meta 客戶經理打造",
    "home.title": "秒速建立 WhatsApp 付費訊息展示",
    "home.titleHighlight": "",
    "home.subtitle": "無需花費數小時手動製作 WhatsApp 模擬圖。描述您的需求，即可獲得互動式對話流程——隨時可以向客戶展示。",
    "home.browseTemplates": "瀏覽產業模板",
    "home.createTailored": "建立定制方案",
    "home.roiCalculator": "ROI 計算器",
    "home.getStarted": "立即開始",

    // Stats
    "stats.openRate": "訊息開啟率",
    "stats.openRateSub": "對比電子郵件的 20%",
    "stats.higherCtr": "更高的點擊率",
    "stats.higherCtrSub": "對比傳統渠道",
    "stats.waUsers": "WhatsApp 用戶",
    "stats.waUsersSub": "全球月活躍用戶",
    "stats.templates": "現成模板",
    "stats.templatesSub": "涵蓋 15 個產業",

    // How it works
    "howItWorks.title": "三步完成完美方案",
    "howItWorks.subtitle": "從想法到互動式 WhatsApp 展示，不到一分鐘",
    "howItWorks.step1Title": "描述您的需求",
    "howItWorks.step1Desc": "輸入您的需求，或貼上客戶網站網址。我們的 AI 會自動擷取業務背景、產品和品牌資訊。",
    "howItWorks.step2Title": "AI 產生對話流程",
    "howItWorks.step2Desc": "獲得完整的產業適配對話流程，包含正確的訊息類型、按鈕和客戶回覆——一切只需幾秒。",
    "howItWorks.step3Title": "分享給客戶",
    "howItWorks.step3Desc": "預覽互動模擬，根據需要進行調整，然後分享連結或直接向客戶展示 WhatsApp 模擬圖。",

    // Messaging types
    "msgTypes.title": "涵蓋每一個 WhatsApp 訊息場景",
    "msgTypes.subtitle": "在 WhatsApp 付費訊息的三大類別中建立展示，每個類別都對應客戶關心的業務成果",
    "msgTypes.marketing": "行銷訊息",
    "msgTypes.marketingSub": "推動銷售與客戶留存",
    "msgTypes.utility": "事務訊息",
    "msgTypes.utilitySub": "提升運營效率",
    "msgTypes.auth": "身份驗證訊息",
    "msgTypes.authSub": "增強安全性與信任",

    // Template quality
    "quality.title": "為什麼模板品質很重要",
    "quality.subtitle": "優質與普通 WhatsApp 模板的差異可能意味著客戶轉換率提升 2-3 倍",

    // CTA
    "cta.title": "準備好更高效地展示 WhatsApp 了嗎？",
    "cta.subtitle": "在幾秒鐘內建立專業、互動的 WhatsApp 對話展示。向客戶展示他們的訊息體驗將會是什麼樣的。",

    // Footer
    "footer.tagline": "專為 Meta 客戶經理打造，用於展示 WhatsApp 付費訊息",

    // Create Tailored Pitch dialog
    "dialog.title": "建立定制方案",
    "dialog.threadName": "對話名稱",
    "dialog.threadNamePlaceholder": "例如：FoodArt 商店行銷活動",
    "dialog.industry": "產業",
    "dialog.selectIndustry": "選擇產業",
    "dialog.messageType": "訊息類型",
    "dialog.clientUrl": "客戶網站網址",
    "dialog.clientUrlOptional": "（可選）",
    "dialog.clientUrlPlaceholder": "例如：https://www.clientbrand.com",
    "dialog.clientUrlHint": "AI 將分析網站，用真實產品和品牌資訊個人化您的方案",
    "dialog.createButton": "建立並開始構建",
    "dialog.creating": "建立中...",
    "dialog.conversationLanguage": "對話語言",
    "dialog.languageHint": "AI 產生的 WhatsApp 對話將使用此語言",

    // Templates page
    "templates.title": "產業用例模板庫",
    "templates.subtitle": "涵蓋 {industries} 個產業的現成對話模板。發現推動 WhatsApp 付費訊息採用的新場景。",
    "templates.allIndustries": "所有產業",
    "templates.allTypes": "所有類型",
    "templates.search": "搜尋模板...",
    "templates.marketing": "行銷",
    "templates.utility": "事務",
    "templates.auth": "身份驗證",
    "templates.activeFilters": "當前篩選：",
    "templates.clearAll": "清除全部",
    "templates.noResults": "未找到模板",
    "templates.noResultsHint": "請調整篩選條件或搜尋關鍵字",
    "templates.useTemplate": "使用模板",
    "templates.generating": "產生中...",
    "templates.conversationLanguage": "對話語言",

    // Builder
    "builder.aiGenerate": "AI 產生",
    "builder.manualEdit": "手動編輯",
    "builder.promptLabel": "描述您想要建立的對話流程",
    "builder.promptPlaceholder": "例如：\"為外送應用建立 WhatsApp 行銷訊息流程...\"",
    "builder.generateButton": "產生對話流程",
    "builder.generating": "產生中...",
    "builder.clientAssets": "客戶素材（可選）",
    "builder.uploadAssets": "上傳照片、工作流程圖或產品圖片",
    "builder.conversationLanguage": "對話語言",
    "builder.languageHint": "產生的對話將使用此語言",
  },

  pt: {
    // Navigation
    "nav.industryTemplates": "Modelos por Setor",
    "nav.roiCalculator": "Calculadora de ROI",
    "nav.apiDocs": "Documentação da API",
    "nav.signOut": "Sair",
    "nav.signIn": "Entrar",
    "nav.myThreads": "Minhas Conversas",

    // Landing page
    "home.badge": "Desenvolvido para Gerentes de Contas Meta",
    "home.title": "Crie Demos de Mensagens Pagas do WhatsApp",
    "home.titleHighlight": " em Segundos",
    "home.subtitle": "Pare de gastar horas criando mockups do WhatsApp manualmente. Descreva seu caso de uso em português e obtenha um fluxo de conversação interativo e perfeito instantaneamente — pronto para apresentar aos seus clientes.",
    "home.browseTemplates": "Explorar Modelos por Setor",
    "home.createTailored": "Criar uma Apresentação Personalizada",
    "home.roiCalculator": "Calculadora de ROI",
    "home.getStarted": "Começar",

    // Stats
    "stats.openRate": "Taxa de Abertura",
    "stats.openRateSub": "vs 20% para e-mail",
    "stats.higherCtr": "CTR Superior",
    "stats.higherCtrSub": "vs canais tradicionais",
    "stats.waUsers": "Usuários do WhatsApp",
    "stats.waUsersSub": "ativos mensalmente no mundo",
    "stats.templates": "Modelos Prontos",
    "stats.templatesSub": "em 15 setores",

    // How it works
    "howItWorks.title": "Três Passos para uma Apresentação Perfeita",
    "howItWorks.subtitle": "Da ideia ao demo interativo do WhatsApp em menos de um minuto",
    "howItWorks.step1Title": "Descreva Seu Caso de Uso",
    "howItWorks.step1Desc": "Digite o que você precisa em português ou cole a URL do site do cliente. Nossa IA extrai o contexto do negócio, produtos e informações da marca automaticamente.",
    "howItWorks.step2Title": "A IA Gera o Fluxo",
    "howItWorks.step2Desc": "Obtenha um fluxo de conversação completo e adaptado ao setor, com os tipos de mensagem, botões e respostas do cliente corretos — tudo em segundos.",
    "howItWorks.step3Title": "Compartilhe com Seu Cliente",
    "howItWorks.step3Desc": "Visualize a simulação interativa, ajuste se necessário e compartilhe um link ou apresente o mockup perfeito do WhatsApp diretamente.",

    // Messaging types
    "msgTypes.title": "Cubra Todos os Casos de Uso de Mensagens do WhatsApp",
    "msgTypes.subtitle": "Crie demos nas três categorias de Mensagens Pagas do WhatsApp, cada uma mapeada para os resultados de negócio que seus clientes valorizam",
    "msgTypes.marketing": "Mensagens de Marketing",
    "msgTypes.marketingSub": "Impulsione Vendas e Retenção de Clientes",
    "msgTypes.utility": "Mensagens Utilitárias",
    "msgTypes.utilitySub": "Impulsione Eficiência Operacional",
    "msgTypes.auth": "Mensagens de Autenticação",
    "msgTypes.authSub": "Reforce Segurança e Confiança",

    // Template quality
    "quality.title": "Por Que a Qualidade do Modelo Importa",
    "quality.subtitle": "A diferença entre um bom e um ótimo modelo de WhatsApp pode significar 2-3x mais conversões para seus clientes",

    // CTA
    "cta.title": "Pronto para Apresentar o WhatsApp de Forma Mais Eficaz?",
    "cta.subtitle": "Crie demos profissionais e interativos de conversas do WhatsApp em segundos. Mostre aos seus clientes exatamente como será a experiência de mensagens deles.",

    // Footer
    "footer.tagline": "Desenvolvido para Gerentes de Contas Meta apresentarem Mensagens Pagas do WhatsApp",

    // Create Tailored Pitch dialog
    "dialog.title": "Criar uma Apresentação Personalizada",
    "dialog.threadName": "Nome da Conversa",
    "dialog.threadNamePlaceholder": "ex.: Campanha de Marketing da Loja FoodArt",
    "dialog.industry": "Setor",
    "dialog.selectIndustry": "Selecionar setor",
    "dialog.messageType": "Tipo de Mensagem",
    "dialog.clientUrl": "URL do Site do Cliente",
    "dialog.clientUrlOptional": "(opcional)",
    "dialog.clientUrlPlaceholder": "ex.: https://www.marcadocliente.com",
    "dialog.clientUrlHint": "A IA analisará o site para personalizar sua apresentação com produtos e marca reais",
    "dialog.createButton": "Criar e Começar a Construir",
    "dialog.creating": "Criando...",
    "dialog.conversationLanguage": "Idioma da Conversa",
    "dialog.languageHint": "A conversa do WhatsApp gerada por IA será neste idioma",

    // Templates page
    "templates.title": "Biblioteca de Modelos por Setor",
    "templates.subtitle": "modelos de conversa prontos em {industries} setores. Identifique oportunidades e impulsione novos casos de uso para adoção de Mensagens Pagas do WhatsApp.",
    "templates.allIndustries": "Todos os Setores",
    "templates.allTypes": "Todos os Tipos",
    "templates.search": "Pesquisar modelos...",
    "templates.marketing": "Marketing",
    "templates.utility": "Utilitário",
    "templates.auth": "Autenticação",
    "templates.activeFilters": "Filtros ativos:",
    "templates.clearAll": "Limpar tudo",
    "templates.noResults": "Nenhum modelo encontrado",
    "templates.noResultsHint": "Tente ajustar seus filtros ou termo de pesquisa",
    "templates.useTemplate": "Usar Modelo",
    "templates.generating": "Gerando...",
    "templates.conversationLanguage": "Idioma da Conversa",

    // Builder
    "builder.aiGenerate": "Gerar com IA",
    "builder.manualEdit": "Edição Manual",
    "builder.promptLabel": "Descreva o fluxo de conversação que deseja criar",
    "builder.promptPlaceholder": "ex.: \"Crie um fluxo de Mensagens de Marketing do WhatsApp para um app de delivery...\"",
    "builder.generateButton": "Gerar Fluxo de Conversa",
    "builder.generating": "Gerando...",
    "builder.clientAssets": "Materiais do Cliente (opcional)",
    "builder.uploadAssets": "Envie fotos, diagramas de fluxo ou imagens de produtos",
    "builder.conversationLanguage": "Idioma da Conversa",
    "builder.languageHint": "A conversa gerada será neste idioma",
  },

  es: {
    // Navigation
    "nav.industryTemplates": "Plantillas por Sector",
    "nav.roiCalculator": "Calculadora de ROI",
    "nav.apiDocs": "Documentación de API",
    "nav.signOut": "Cerrar Sesión",
    "nav.signIn": "Iniciar Sesión",
    "nav.myThreads": "Mis Conversaciones",

    // Landing page
    "home.badge": "Creado para Gerentes de Cuentas de Meta",
    "home.title": "Crea Demos de Mensajes de Pago de WhatsApp",
    "home.titleHighlight": " en Segundos",
    "home.subtitle": "Deja de pasar horas creando mockups de WhatsApp manualmente. Describe tu caso de uso en español y obtén un flujo de conversación interactivo y perfecto al instante — listo para presentar a tus clientes.",
    "home.browseTemplates": "Explorar Plantillas por Sector",
    "home.createTailored": "Crear una Presentación Personalizada",
    "home.roiCalculator": "Calculadora de ROI",
    "home.getStarted": "Comenzar",

    // Stats
    "stats.openRate": "Tasa de Apertura",
    "stats.openRateSub": "vs 20% para correo electrónico",
    "stats.higherCtr": "CTR Superior",
    "stats.higherCtrSub": "vs canales tradicionales",
    "stats.waUsers": "Usuarios de WhatsApp",
    "stats.waUsersSub": "activos mensualmente en el mundo",
    "stats.templates": "Plantillas Listas",
    "stats.templatesSub": "en 15 sectores",

    // How it works
    "howItWorks.title": "Tres Pasos para una Presentación Perfecta",
    "howItWorks.subtitle": "De la idea al demo interactivo de WhatsApp en menos de un minuto",
    "howItWorks.step1Title": "Describe Tu Caso de Uso",
    "howItWorks.step1Desc": "Escribe lo que necesitas en español o pega la URL del sitio web del cliente. Nuestra IA extrae el contexto del negocio, productos e información de marca automáticamente.",
    "howItWorks.step2Title": "La IA Genera el Flujo",
    "howItWorks.step2Desc": "Obtén un flujo de conversación completo y adaptado al sector, con los tipos de mensaje, botones y respuestas del cliente correctos — todo en segundos.",
    "howItWorks.step3Title": "Comparte con Tu Cliente",
    "howItWorks.step3Desc": "Visualiza la simulación interactiva, ajusta si es necesario y comparte un enlace o presenta el mockup perfecto de WhatsApp directamente.",

    // Messaging types
    "msgTypes.title": "Cubre Todos los Casos de Uso de Mensajes de WhatsApp",
    "msgTypes.subtitle": "Crea demos en las tres categorías de Mensajes de Pago de WhatsApp, cada una mapeada a los resultados de negocio que tus clientes valoran",
    "msgTypes.marketing": "Mensajes de Marketing",
    "msgTypes.marketingSub": "Impulsa Ventas y Retención de Clientes",
    "msgTypes.utility": "Mensajes de Utilidad",
    "msgTypes.utilitySub": "Impulsa Eficiencia Operativa",
    "msgTypes.auth": "Mensajes de Autenticación",
    "msgTypes.authSub": "Refuerza Seguridad y Confianza",

    // Template quality
    "quality.title": "Por Qué Importa la Calidad de la Plantilla",
    "quality.subtitle": "La diferencia entre una buena y una excelente plantilla de WhatsApp puede significar 2-3x más conversiones para tus clientes",

    // CTA
    "cta.title": "¿Listo para Presentar WhatsApp de Forma Más Efectiva?",
    "cta.subtitle": "Crea demos profesionales e interactivos de conversaciones de WhatsApp en segundos. Muestra a tus clientes exactamente cómo será su experiencia de mensajería.",

    // Footer
    "footer.tagline": "Creado para Gerentes de Cuentas de Meta para presentar Mensajes de Pago de WhatsApp",

    // Create Tailored Pitch dialog
    "dialog.title": "Crear una Presentación Personalizada",
    "dialog.threadName": "Nombre de la Conversación",
    "dialog.threadNamePlaceholder": "ej.: Campaña de Marketing de Tienda FoodArt",
    "dialog.industry": "Sector",
    "dialog.selectIndustry": "Seleccionar sector",
    "dialog.messageType": "Tipo de Mensaje",
    "dialog.clientUrl": "URL del Sitio Web del Cliente",
    "dialog.clientUrlOptional": "(opcional)",
    "dialog.clientUrlPlaceholder": "ej.: https://www.marcadelcliente.com",
    "dialog.clientUrlHint": "La IA analizará el sitio web para personalizar tu presentación con productos y marca reales",
    "dialog.createButton": "Crear y Empezar a Construir",
    "dialog.creating": "Creando...",
    "dialog.conversationLanguage": "Idioma de la Conversación",
    "dialog.languageHint": "La conversación de WhatsApp generada por IA será en este idioma",

    // Templates page
    "templates.title": "Biblioteca de Plantillas por Sector",
    "templates.subtitle": "plantillas de conversación listas en {industries} sectores. Identifica oportunidades e impulsa nuevos casos de uso para la adopción de Mensajes de Pago de WhatsApp.",
    "templates.allIndustries": "Todos los Sectores",
    "templates.allTypes": "Todos los Tipos",
    "templates.search": "Buscar plantillas...",
    "templates.marketing": "Marketing",
    "templates.utility": "Utilidad",
    "templates.auth": "Autenticación",
    "templates.activeFilters": "Filtros activos:",
    "templates.clearAll": "Limpiar todo",
    "templates.noResults": "No se encontraron plantillas",
    "templates.noResultsHint": "Intenta ajustar tus filtros o término de búsqueda",
    "templates.useTemplate": "Usar Plantilla",
    "templates.generating": "Generando...",
    "templates.conversationLanguage": "Idioma de la Conversación",

    // Builder
    "builder.aiGenerate": "Generar con IA",
    "builder.manualEdit": "Edición Manual",
    "builder.promptLabel": "Describe el flujo de conversación que deseas crear",
    "builder.promptPlaceholder": "ej.: \"Crea un flujo de Mensajes de Marketing de WhatsApp para una app de delivery...\"",
    "builder.generateButton": "Generar Flujo de Conversación",
    "builder.generating": "Generando...",
    "builder.clientAssets": "Materiales del Cliente (opcional)",
    "builder.uploadAssets": "Sube fotos, diagramas de flujo o imágenes de productos",
    "builder.conversationLanguage": "Idioma de la Conversación",
    "builder.languageHint": "La conversación generada será en este idioma",
  },

  ur: {
    // Navigation
    "nav.industryTemplates": "صنعتی ٹیمپلیٹس",
    "nav.roiCalculator": "ROI کیلکولیٹر",
    "nav.apiDocs": "API دستاویزات",
    "nav.signOut": "سائن آؤٹ",
    "nav.signIn": "سائن ان",
    "nav.myThreads": "میری بات چیت",

    // Landing page
    "home.badge": "میٹا اکاؤنٹ مینیجرز کے لیے تیار کیا گیا",
    "home.title": "واٹس ایپ پیڈ میسجنگ ڈیمو بنائیں",
    "home.titleHighlight": " چند سیکنڈز میں",
    "home.subtitle": "واٹس ایپ ماک اپ دستی طور پر بنانے میں گھنٹے ضائع کرنا بند کریں۔ اپنا استعمال کا معاملہ سادہ زبان میں بیان کریں اور فوری طور پر ایک مکمل، انٹرایکٹو بات چیت کا فلو حاصل کریں — اپنے کلائنٹس کو پیش کرنے کے لیے تیار۔",
    "home.browseTemplates": "صنعتی ٹیمپلیٹس دیکھیں",
    "home.createTailored": "اپنی مرضی کی پیشکش بنائیں",
    "home.roiCalculator": "ROI کیلکولیٹر",
    "home.getStarted": "شروع کریں",

    // Stats
    "stats.openRate": "پیغام کھولنے کی شرح",
    "stats.openRateSub": "ای میل کے 20% کے مقابلے میں",
    "stats.higherCtr": "زیادہ CTR",
    "stats.higherCtrSub": "روایتی چینلز کے مقابلے میں",
    "stats.waUsers": "واٹس ایپ صارفین",
    "stats.waUsersSub": "دنیا بھر میں ماہانہ فعال",
    "stats.templates": "تیار ٹیمپلیٹس",
    "stats.templatesSub": "15 صنعتوں میں",

    // How it works
    "howItWorks.title": "بہترین پیشکش کے تین مراحل",
    "howItWorks.subtitle": "خیال سے انٹرایکٹو واٹس ایپ ڈیمو تک ایک منٹ سے بھی کم میں",
    "howItWorks.step1Title": "اپنا استعمال کا معاملہ بیان کریں",
    "howItWorks.step1Desc": "جو آپ کو چاہیے وہ سادہ زبان میں لکھیں، یا کلائنٹ کی ویب سائٹ کا URL پیسٹ کریں۔ ہماری AI خود بخود کاروباری سیاق و سباق، مصنوعات اور برانڈ کی معلومات نکال لیتی ہے۔",
    "howItWorks.step2Title": "AI فلو تیار کرتی ہے",
    "howItWorks.step2Desc": "صحیح پیغام کی اقسام، بٹنز اور صارف کے جوابات کے ساتھ ایک مکمل، صنعت سے آگاہ بات چیت کا فلو حاصل کریں — سب کچھ سیکنڈز میں۔",
    "howItWorks.step3Title": "اپنے کلائنٹ کے ساتھ شیئر کریں",
    "howItWorks.step3Desc": "انٹرایکٹو سمولیشن دیکھیں، ضرورت ہو تو ایڈجسٹ کریں، پھر لنک شیئر کریں یا واٹس ایپ ماک اپ براہ راست پیش کریں۔",

    // Messaging types
    "msgTypes.title": "واٹس ایپ میسجنگ کے ہر استعمال کا احاطہ کریں",
    "msgTypes.subtitle": "واٹس ایپ پیڈ میسجنگ کی تینوں اقسام میں ڈیمو بنائیں، ہر ایک آپ کے کلائنٹس کے کاروباری نتائج سے منسلک",
    "msgTypes.marketing": "مارکیٹنگ پیغامات",
    "msgTypes.marketingSub": "فروخت اور صارفین کی برقراری بڑھائیں",
    "msgTypes.utility": "یوٹیلیٹی پیغامات",
    "msgTypes.utilitySub": "آپریشنل کارکردگی بڑھائیں",
    "msgTypes.auth": "تصدیقی پیغامات",
    "msgTypes.authSub": "سیکیورٹی اور اعتماد بڑھائیں",

    // Template quality
    "quality.title": "ٹیمپلیٹ کا معیار کیوں اہم ہے",
    "quality.subtitle": "ایک اچھے اور بہترین واٹس ایپ ٹیمپلیٹ کے درمیان فرق آپ کے کلائنٹس کے لیے 2-3 گنا زیادہ تبادلوں کا مطلب ہو سکتا ہے",

    // CTA
    "cta.title": "واٹس ایپ کو زیادہ مؤثر طریقے سے پیش کرنے کے لیے تیار ہیں؟",
    "cta.subtitle": "سیکنڈز میں پیشہ ورانہ، انٹرایکٹو واٹس ایپ بات چیت کے ڈیمو بنائیں۔ اپنے کلائنٹس کو بالکل دکھائیں کہ ان کا میسجنگ تجربہ کیسا ہوگا۔",

    // Footer
    "footer.tagline": "میٹا اکاؤنٹ مینیجرز کے لیے واٹس ایپ پیڈ میسجنگ پیش کرنے کے لیے تیار کیا گیا",

    // Create Tailored Pitch dialog
    "dialog.title": "اپنی مرضی کی پیشکش بنائیں",
    "dialog.threadName": "بات چیت کا نام",
    "dialog.threadNamePlaceholder": "مثلاً، فوڈ آرٹ اسٹور مارکیٹنگ مہم",
    "dialog.industry": "صنعت",
    "dialog.selectIndustry": "صنعت منتخب کریں",
    "dialog.messageType": "پیغام کی قسم",
    "dialog.clientUrl": "کلائنٹ ویب سائٹ URL",
    "dialog.clientUrlOptional": "(اختیاری)",
    "dialog.clientUrlPlaceholder": "مثلاً، https://www.clientbrand.com",
    "dialog.clientUrlHint": "AI ویب سائٹ کا تجزیہ کرے گی تاکہ آپ کی پیشکش کو حقیقی مصنوعات اور برانڈنگ سے ذاتی بنایا جا سکے",
    "dialog.createButton": "بنائیں اور شروع کریں",
    "dialog.creating": "بنایا جا رہا ہے...",
    "dialog.conversationLanguage": "بات چیت کی زبان",
    "dialog.languageHint": "AI سے تیار کردہ واٹس ایپ بات چیت اس زبان میں ہوگی",

    // Templates page
    "templates.title": "صنعتی استعمال کی ٹیمپلیٹ لائبریری",
    "templates.subtitle": "{industries} صنعتوں میں تیار بات چیت کے ٹیمپلیٹس۔ واٹس ایپ پیڈ میسجنگ اپنانے کے لیے نئے مواقع تلاش کریں۔",
    "templates.allIndustries": "تمام صنعتیں",
    "templates.allTypes": "تمام اقسام",
    "templates.search": "ٹیمپلیٹس تلاش کریں...",
    "templates.marketing": "مارکیٹنگ",
    "templates.utility": "یوٹیلیٹی",
    "templates.auth": "تصدیق",
    "templates.activeFilters": "فعال فلٹرز:",
    "templates.clearAll": "سب صاف کریں",
    "templates.noResults": "کوئی ٹیمپلیٹ نہیں ملا",
    "templates.noResultsHint": "اپنے فلٹرز یا تلاش کی اصطلاح ایڈجسٹ کرنے کی کوشش کریں",
    "templates.useTemplate": "ٹیمپلیٹ استعمال کریں",
    "templates.generating": "تیار ہو رہا ہے...",
    "templates.conversationLanguage": "بات چیت کی زبان",

    // Builder
    "builder.aiGenerate": "AI سے تیار کریں",
    "builder.manualEdit": "دستی ترمیم",
    "builder.promptLabel": "بات چیت کا فلو بیان کریں جو آپ بنانا چاہتے ہیں",
    "builder.promptPlaceholder": "مثلاً، \"فوڈ ڈیلیوری ایپ کے لیے واٹس ایپ مارکیٹنگ پیغامات کا فلو بنائیں...\"",
    "builder.generateButton": "بات چیت کا فلو تیار کریں",
    "builder.generating": "تیار ہو رہا ہے...",
    "builder.clientAssets": "کلائنٹ مواد (اختیاری)",
    "builder.uploadAssets": "تصاویر، ورک فلو ڈایاگرامز، یا مصنوعات کی تصاویر اپ لوڈ کریں",
    "builder.conversationLanguage": "بات چیت کی زبان",
    "builder.languageHint": "تیار کردہ بات چیت اس زبان میں ہوگی",
  },
};
