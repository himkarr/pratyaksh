export interface TranslationDict {
  portalTitle: string;
  portalSubtitle: string;
  dashboard: string;
  analytics: string;
  worksGrid: string;
  anomalyFlags: string;
  auditTrail: string;
  liveNotice: string;
  fundsAllocated: string;
  worksRecommended: string;
  worksSanctioned: string;
  worksCompleted: string;
  worksOngoing: string;
  totalExp: string;
  utilizationRate: string;
  searchPlaceholder: string;
  allStates: string;
  allConstituencies: string;
  allMPs: string;
  filterTitle: string;
  reset: string;
  search: string;
  exportCsv: string;
  printReport: string;
  statusDistribution: string;
  sectorDistribution: string;
  stateRanking: string;
  worksDirectory: string;
  viewPhotos: string;
  reviews: string;
  sanctionedOn: string;
  targetDate: string;
  completedOn: string;
  agency: string;
  ratingTitle: string;
  submitReview: string;
  howItWorks: string;
  login: string;
  roleBadge: string;
  syntheticNotice: string;
}

export const TRANSLATIONS: Record<'en' | 'hi', TranslationDict> = {
  en: {
    portalTitle: "Members of Parliament Local Area Development Scheme",
    portalSubtitle: "Ministry of Statistics & Programme Implementation | Government of India",
    dashboard: "Dashboard",
    analytics: "Analytics & Trends",
    worksGrid: "Works Grid",
    anomalyFlags: "Audit & Anomaly Flags",
    auditTrail: "Audit Chain Integrity",
    liveNotice: "MPLAD Scheme Mandate: Sanctioned works must be completed within 12 calendar months. Real-time fund flow and photographic asset verification are mandatory.",
    fundsAllocated: "Funds Allocated Limit",
    worksRecommended: "Works Recommended",
    worksSanctioned: "Works Sanctioned",
    worksCompleted: "Works Completed",
    worksOngoing: "Works in Progress",
    totalExp: "Expenditure Released",
    utilizationRate: "Fund Utilisation Rate",
    searchPlaceholder: "Search work ID, project title, MP name, district, agency...",
    allStates: "All States / UTs",
    allConstituencies: "All Constituencies",
    allMPs: "All Hon'ble MPs",
    filterTitle: "Filters & Search",
    reset: "Reset",
    search: "Search",
    exportCsv: "Export CSV",
    printReport: "Print Summary",
    statusDistribution: "Status & Progress Breakdown",
    sectorDistribution: "Sectoral Fund Allocation",
    stateRanking: "State-wise Completion Benchmark",
    worksDirectory: "Master Works Directory",
    viewPhotos: "View Assets & Photos",
    reviews: "Citizen Feedback",
    sanctionedOn: "Sanctioned Date",
    targetDate: "Target Completion (1 Year)",
    completedOn: "Completed Date",
    agency: "Implementing Agency",
    ratingTitle: "Public Feedback & Rating",
    submitReview: "Submit Feedback",
    howItWorks: "How It Works",
    login: "Official Login",
    roleBadge: "Current Role Perspective",
    syntheticNotice: "Decision-Support Mode: Connected to MoSPI Official MPLADS Information System. All anomaly flags represent explainable AI decision support signals."
  },
  hi: {
    portalTitle: "एमपीलैड्स प्रत्यक्ष (MPLADS Pratyaksh)",
    portalSubtitle: "सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय | भारत सरकार",
    dashboard: "डैशबोर्ड",
    analytics: "विश्लेषण एवं प्रवृत्तियाँ",
    worksGrid: "परियोजना सूची",
    anomalyFlags: "ऑडिट एवं विसंगति समीक्षा",
    auditTrail: "ऑडिट ट्रेल सत्यापन",
    liveNotice: "एमपीलैड्स योजना नियम: स्वीकृत कार्यों को 12 महीनों के भीतर पूरा करना अनिवार्य है। वास्तविक समय निधि प्रवाह एवं भू-टैग फोटो सत्यापन आवश्यक है।",
    fundsAllocated: "आवंटित निधि सीमा",
    worksRecommended: "अनुशंसित कार्य",
    worksSanctioned: "स्वीकृत कार्य",
    worksCompleted: "पूर्ण कार्य",
    worksOngoing: "प्रगतिरत कार्य",
    totalExp: "जारी कुल व्यय",
    utilizationRate: "निधि उपयोगिता दर",
    searchPlaceholder: "कार्य आईडी, शीर्षक, सांसद नाम, जिला या एजेंसी खोजें...",
    allStates: "सभी राज्य / केंद्र शासित प्रदेश",
    allConstituencies: "सभी निर्वाचन क्षेत्र",
    allMPs: "सभी सांसद",
    filterTitle: "फ़िल्टर एवं खोज",
    reset: "रीसेट",
    search: "खोजें",
    exportCsv: "CSV निर्यात करें",
    printReport: "प्रिंट रिपोर्ट",
    statusDistribution: "स्थिति एवं प्रगति वितरण",
    sectorDistribution: "क्षेत्रवार निधि आवंटन",
    stateRanking: "राज्यवार पूर्णता दर",
    worksDirectory: "मुख्य परियोजना निर्देशिका",
    viewPhotos: "फ़ोटो एवं दस्तावेज़",
    reviews: "नागरिक समीक्षा",
    sanctionedOn: "स्वीकृति तिथि",
    targetDate: "लक्ष्य पूर्णता (1 वर्ष)",
    completedOn: "पूर्ण तिथि",
    agency: "कार्यान्वयन एजेंसी",
    ratingTitle: "नागरिक प्रतिक्रिया एवं रेटिंग",
    submitReview: "प्रतिक्रिया दर्ज करें",
    howItWorks: "योजना नियम एवं सहायता",
    login: "अधिकारी लॉगिन",
    roleBadge: "वर्तमान भूमिका दृष्टिकोण",
    syntheticNotice: "निर्णय-समर्थन मोड: सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय के आधिकारिक एमपीलैड्स डेटा से जुड़ा हुआ। सभी विसंगति फ़्लैग स्पष्टीकरण युक्त एआई निर्णय संकेत हैं।"
  }
};
