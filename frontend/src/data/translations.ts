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
  // Extended UI Keys
  constituencyWorksTab: string;
  recommendationsTab: string;
  fundLedgerTab: string;
  citizenReportsTab: string;
  riskAlertsTab: string;
  recommendNewWork: string;
  tableView: string;
  cardGridView: string;
  inspect: string;
  photos: string;
  physicalProgress: string;
  financialProgress: string;
  sanctionCost: string;
  expenditure: string;
  status: string;
  actions: string;
  ongoing: string;
  completed: string;
  delayed: string;
  sanctioned: string;
  proposed: string;
  underScrutiny: string;
  rejected: string;
  verified: string;
  highRisk: string;
  lowRisk: string;
  allCategories: string;
  allStatuses: string;
  resetFilters: string;
  adoptRecommendation: string;
  submitEvidence: string;
  updateProgress: string;
  requestCompletionCert: string;
  cancel: string;
  submit: string;
  close: string;
  back: string;
  logout: string;
  contractor: string;
  districtAuthority: string;
  stateNodal: string;
  ministryCentral: string;
  fieldOfficer: string;
  citizen: string;
  mpTitle: string;
  geotagged: string;
}

export const TRANSLATIONS: Record<'en' | 'hi', TranslationDict> = {
  en: {
    portalTitle: "Members of Parliament Local Area Development Scheme",
    portalSubtitle: "Ministry of Statistics & Programme Implementation | Government of India",
    dashboard: "Dashboard",
    analytics: "Analytics & Trends",
    worksGrid: "Constituency Works Grid",
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
    syntheticNotice: "Decision-Support Mode: Connected to MoSPI Official MPLADS Information System. All anomaly flags represent explainable AI decision support signals.",
    constituencyWorksTab: "Constituency Sanctioned Works",
    recommendationsTab: "MP Work Recommendations",
    fundLedgerTab: "Pratyaksh Fund Ledger & Vouchers",
    citizenReportsTab: "Citizen Demands & Grievances",
    riskAlertsTab: "AI Risk Signals & Anomaly Watch",
    recommendNewWork: "Recommend New Work",
    tableView: "Table View",
    cardGridView: "Card Grid",
    inspect: "Inspect",
    photos: "Photos",
    physicalProgress: "Physical Progress",
    financialProgress: "Financial Progress",
    sanctionCost: "Sanction Cost",
    expenditure: "Expenditure",
    status: "Status",
    actions: "Actions",
    ongoing: "Ongoing",
    completed: "Completed",
    delayed: "Delayed",
    sanctioned: "Sanctioned",
    proposed: "Proposed",
    underScrutiny: "Under Scrutiny",
    rejected: "Rejected",
    verified: "Verified",
    highRisk: "High Risk",
    lowRisk: "Low Risk",
    allCategories: "All Categories",
    allStatuses: "All Statuses",
    resetFilters: "Reset Filters",
    adoptRecommendation: "Adopt as MP Recommendation",
    submitEvidence: "Submit Stage Evidence",
    updateProgress: "Update Progress",
    requestCompletionCert: "Request Completion Certificate",
    cancel: "Cancel",
    submit: "Submit",
    close: "Close",
    back: "Back",
    logout: "Logout",
    contractor: "Contractor Agency",
    districtAuthority: "District Authority (DM)",
    stateNodal: "State Nodal Department",
    ministryCentral: "Ministry of Statistics (MoSPI)",
    fieldOfficer: "Field Inspection Officer",
    citizen: "Citizen Portal",
    mpTitle: "Member of Parliament",
    geotagged: "GPS Geotagged"
  },
  hi: {
    portalTitle: "सांसद स्थानीय क्षेत्र विकास योजना (MPLADS प्रत्यक्ष)",
    portalSubtitle: "सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय | भारत सरकार",
    dashboard: "डैशबोर्ड",
    analytics: "विश्लेषण एवं प्रवृत्तियाँ",
    worksGrid: "निर्वाचन क्षेत्र परियोजना ग्रिड",
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
    allMPs: "सभी माननीय सांसद",
    filterTitle: "फ़िल्टर एवं खोज",
    reset: "रीसेट",
    search: "खोजें",
    exportCsv: "CSV निर्यात करें",
    printReport: "प्रिंट रिपोर्ट",
    statusDistribution: "स्थिति एवं प्रगति वितरण",
    sectorDistribution: "क्षेत्रवार निधि आवंटन",
    stateRanking: "राज्यवार पूर्णता दर",
    worksDirectory: "मुख्य परियोजना निर्देशिका",
    viewPhotos: "फ़ोटो एवं साक्ष्य",
    reviews: "नागरिक समीक्षा एवं फीडबैक",
    sanctionedOn: "स्वीकृति तिथि",
    targetDate: "लक्ष्य पूर्णता (1 वर्ष)",
    completedOn: "पूर्ण होने की तिथि",
    agency: "कार्यान्वयन एजेंसी",
    ratingTitle: "नागरिक प्रतिक्रिया एवं रेटिंग",
    submitReview: "प्रतिक्रिया दर्ज करें",
    howItWorks: "योजना नियम एवं सहायता",
    login: "अधिकारी लॉगिन",
    roleBadge: "वर्तमान भूमिका दृष्टिकोण",
    syntheticNotice: "निर्णय-समर्थन मोड: सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय के आधिकारिक एमपीलैड्स डेटा से जुड़ा हुआ। सभी विसंगति फ़्लैग स्पष्टीकरण युक्त एआई निर्णय संकेत हैं।",
    constituencyWorksTab: "निर्वाचन क्षेत्र स्वीकृत कार्य",
    recommendationsTab: "सांसद कार्य अनुशंसाएँ",
    fundLedgerTab: "प्रत्यक्ष निधि बहीखाता एवं वाउचर",
    citizenReportsTab: "नागरिक मांगें एवं शिकायतें",
    riskAlertsTab: "एआई जोखिम संकेत एवं सतर्कता",
    recommendNewWork: "नए कार्य की अनुशंसा करें",
    tableView: "तालिका दृश्य",
    cardGridView: "कार्ड ग्रिड",
    inspect: "निरीक्षण / विवरण",
    photos: "फ़ोटो",
    physicalProgress: "भौतिक प्रगति",
    financialProgress: "वित्तीय प्रगति",
    sanctionCost: "स्वीकृत लागत",
    expenditure: "कुल व्यय",
    status: "स्थिति",
    actions: "कार्रवाई",
    ongoing: "प्रगतिरत",
    completed: "पूर्ण",
    delayed: "विलंबित",
    sanctioned: "स्वीकृत",
    proposed: "प्रस्तावित",
    underScrutiny: "संवीक्षाधीन",
    rejected: "अस्वीकृत",
    verified: "सत्यापित",
    highRisk: "उच्च जोखिम",
    lowRisk: "सामान्य जोखिम",
    allCategories: "सभी श्रेणियाँ",
    allStatuses: "सभी स्थितियाँ",
    resetFilters: "फ़िल्टर रीसेट करें",
    adoptRecommendation: "सांसद अनुशंसा के रूप में अपनाएं",
    submitEvidence: "चरणवार साक्ष्य जमा करें",
    updateProgress: "प्रगति अपडेट करें",
    requestCompletionCert: "पूर्णता प्रमाणपत्र का अनुरोध करें",
    cancel: "रद्द करें",
    submit: "जमा करें / प्रस्तुत करें",
    close: "बंद करें",
    back: "वापस",
    logout: "लॉग आउट",
    contractor: "संविदा एजेंसी (ठेकेदार)",
    districtAuthority: "ज़िला प्राधिकारी (जिलाधिकारी / डीएम)",
    stateNodal: "राज्य नोडल विभाग",
    ministryCentral: "सांख्यिकी मंत्रालय (MoSPI)",
    fieldOfficer: "क्षेत्रीय निरीक्षण अधिकारी",
    citizen: "नागरिक पोर्टल",
    mpTitle: "माननीय सांसद",
    geotagged: "जीपीएस भू-टैग युक्त"
  }
};

/**
 * Universal phrase & keyword dictionary for automatic bilingual rendering across all components
 */
const HINDI_PHRASE_MAP: Record<string, string> = {
  // Navigation & General
  "Dashboard": "डैशबोर्ड",
  "Analytics & Trends": "विश्लेषण एवं प्रवृत्तियाँ",
  "Analytics": "विश्लेषण",
  "Works Grid": "परियोजना सूची",
  "Table View": "तालिका दृश्य",
  "Card Grid": "कार्ड ग्रिड",
  "Search": "खोजें",
  "Reset": "रीसेट",
  "Reset Filters": "फ़िल्टर रीसेट करें",
  "Reset All Filters": "सभी फ़िल्टर रीसेट करें",
  "Reset Works Filters": "कार्य फ़िल्टर रीसेट करें",
  "Reset Ledger Filters": "बहीखाता फ़िल्टर रीसेट करें",
  "Filter": "फ़िल्टर",
  "Filters & Search": "फ़िल्टर एवं खोज",
  "Actions": "कार्रवाई",
  "Inspect": "निरीक्षण",
  "Photos": "फ़ोटो",
  "View": "देखें",
  "Edit": "संपादित करें",
  "Delete": "हटाएं",
  "Cancel": "रद्द करें",
  "Submit": "जमा करें",
  "Save": "सहेजें",
  "Close": "बंद करें",
  "Back": "वापस",
  "Download": "डाउनलोड",
  "Print": "प्रिंट",
  "Export CSV": "CSV निर्यात करें",
  "Export": "निर्यात",
  "Logout": "लॉग आउट",
  "Official Login": "अधिकारी लॉगिन",
  "Login": "लॉगिन",

  // MP Dashboard Tabs & Headers
  "Constituency Sanctioned Works": "निर्वाचन क्षेत्र स्वीकृत कार्य",
  "Constituency Works": "निर्वाचन क्षेत्र कार्य",
  "MP Recommendations": "सांसद अनुशंसाएँ",
  "My Recommendations": "मेरी अनुशंसाएँ",
  "Pratyaksh Fund Ledger & Vouchers": "प्रत्यक्ष निधि बहीखाता एवं वाउचर",
  "Fund Details": "निधि विवरण",
  "Citizen Reports": "नागरिक मांगें एवं रिपोर्ट",
  "Citizen Demands & Grievance Submissions": "नागरिक मांगें एवं शिकायतें",
  "Public Citizen Infrastructure Demands & Grievance Submissions": "सार्वजनिक नागरिक अवसंरचना मांगें एवं शिकायतें",
  "Risk Alerts": "जोखिम संकेत एवं अलर्ट",
  "AI Risk Alerts & Anomaly Watch": "एआई जोखिम अलर्ट एवं अनुपालन निगरानी",
  "Recommend New Work": "नए कार्य की अनुशंसा करें",
  "Adopt as MP Recommendation": "सांसद अनुशंसा के रूप में अपनाएं",

  // Metric Labels
  "Funds Allocated Limit": "आवंटित निधि सीमा",
  "Works Recommended": "अनुशंसित कार्य",
  "Works Sanctioned": "स्वीकृत कार्य",
  "Works Completed": "पूर्ण कार्य",
  "Works in Progress": "प्रगतिरत कार्य",
  "Expenditure Released": "जारी कुल व्यय",
  "Expenditure": "कुल व्यय",
  "Fund Utilisation Rate": "निधि उपयोगिता दर",
  "Sanctioned": "स्वीकृत",
  "Sanction Cost": "स्वीकृत लागत",
  "Sanctioned Amount": "स्वीकृत राशि",
  "Recommended Amount": "अनुशंसित राशि",
  "Utilized Amount": "उपयोग की गई राशि",
  "Remaining Balance": "शेष राशि",
  "Physical Progress": "भौतिक प्रगति",
  "Financial Progress": "वित्तीय प्रगति",
  "Progress": "प्रगति",
  "Target Completion": "लक्ष्य पूर्णता",
  "Sanctioned Date": "स्वीकृति तिथि",
  "Completed Date": "पूर्ण होने की तिथि",
  "Status": "स्थिति",
  "Category": "श्रेणी",
  "Agency": "कार्यान्वयन एजेंसी",
  "Contractor": "संविदा एजेंसी (ठेकेदार)",
  "District": "ज़िला",
  "State": "राज्य",
  "Constituency": "निर्वाचन क्षेत्र",
  "House": "सदन",
  "Lok Sabha": "लोकसभा",
  "Rajya Sabha": "राज्यसभा",
  "All Houses": "सभी सदन",

  // Statuses
  "Ongoing": "प्रगतिरत",
  "Completed": "पूर्ण",
  "Delayed": "विलंबित",
  "Proposed": "प्रस्तावित",
  "Under Scrutiny": "संवीक्षाधीन",
  "Rejected": "अस्वीकृत",
  "Verified": "सत्यापित",
  "Unverified": "असत्यापित",
  "Pending": "लंबित",
  "High Risk": "उच्च जोखिम",
  "Low Risk": "सामान्य जोखिम",
  "Active": "सक्रिय",
  "Approved": "स्वीकृत",

  // Categories
  "Roads": "सड़क एवं मार्ग",
  "Roads & Pathways": "सड़क एवं मार्ग",
  "Education": "शिक्षा एवं विद्यालय",
  "Education & Schools": "शिक्षा एवं विद्यालय",
  "Health": "स्वास्थ्य एवं चिकित्सा",
  "Health & Sanitation": "स्वास्थ्य एवं स्वच्छता",
  "Drinking Water": "पेयजल आपूर्ति",
  "Water Supply": "जल आपूर्ति",
  "Community Assets": "सामुदायिक परिसंपत्तियाँ",
  "Community Infrastructure": "सामुदायिक अवसंरचना",
  "Irrigation & Flood Control": "सिंचाई एवं बाढ़ नियंत्रण",
  "Irrigation": "सिंचाई",
  "Renewable Energy": "नवीकरणीय ऊर्जा",
  "Public Lighting": "सार्वजनिक प्रकाश व्यवस्था",
  "Sports & Youth": "खेल एवं युवा कल्याण",
  "Anganwadi": "आंगनवाड़ी केंद्र",
  "Sanitation": "स्वच्छता",
  "Other": "अन्य",

  // Roles
  "Citizen Portal": "नागरिक पोर्टल",
  "Member of Parliament": "माननीय सांसद",
  "Contractor Agency": "संविदा एजेंसी (ठेकेदार)",
  "Field Inspection Officer": "क्षेत्रीय निरीक्षण अधिकारी",
  "District Authority (DM)": "ज़िला प्राधिकारी (जिलाधिकारी / डीएम)",
  "District Authority": "ज़िला प्राधिकारी",
  "State Nodal Dept": "राज्य नोडल विभाग",
  "State Nodal Department": "राज्य नोडल विभाग",
  "Ministry of Statistics (MoSPI)": "सांख्यिकी मंत्रालय (MoSPI)",
  "Government of India": "भारत सरकार",
  "Ministry of Statistics and Programme Implementation": "सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय",

  // District & Authority Workspace Phrases
  "Office of District Magistrate & Collector": "कार्यालय जिलाधिकारी एवं उपायुक्त",
  "District Authority Workspace": "ज़िला प्राधिकारी कार्यक्षेत्र",
  "Total Sanctioned": "कुल स्वीकृत कार्य",
  "Disbursed (PFMS)": "संवितरित राशि (PFMS)",
  "In Progress": "प्रगतिरत",
  "Delayed Works": "विलंबित कार्य",
  "Audit Flags": "ऑडिट फ़्लैग",
  "District Works Directory": "ज़िला कार्य निर्देशिका",
  "Contractors & Vendors": "संविदाकार एवं विक्रेता",
  "Inspection Approvals": "निरीक्षण स्वीकृतियां",
  "Inquiries & Dossiers": "जांच एवं डोजियर",
  "District Works Register": "ज़िला कार्य पंजिका",
  "Issue New Work Order / Sanction": "नया कार्य आदेश / स्वीकृति जारी करें",
  "Export District Audit (PDF)": "ज़िला ऑडिट निर्यात करें (PDF)",
  "Single Nodal Agency (SNA) Fund Administration & Field Inspection Sign-off": "एकल नोडल एजेंसी (SNA) निधि प्रशासन एवं क्षेत्रीय निरीक्षण अनुमोदन",
  "Active on-site construction": "कार्यस्थल पर सक्रिय निर्माण",
  "Exceeds milestone timeline": "समय सीमा से अधिक विलंबित",
  "Under vigilance scrutiny": "सतर्कता जांच के अधीन",
  "Certified by Field Engineers": "क्षेत्रीय अभियंताओं द्वारा प्रमाणित",

  // Ministry & National Dashboard Phrases
  "Overview": "अवलोकन",
  "States & UTs": "राज्य एवं केंद्र शासित प्रदेश",
  "Parliamentarians": "सांसदगण",
  "Project Registry": "परियोजना पंजिका",
  "AI Governance & Audit": "एआई शासन एवं ऑडिट",
  "National Overview": "राष्ट्रीय अवलोकन",
  "Financial Outlay": "वित्तीय परिव्यय",
  "Total Expenditure": "कुल व्यय",
  "National Utilization Rate": "राष्ट्रीय उपयोगिता दर",
  "Active Projects": "सक्रिय परियोजनाएं",
  "High Risk Alerts": "उच्च जोखिम अलर्ट",
  "State Performance Matrix": "राज्य प्रदर्शन मैट्रिक्स",
  "Central Project Registry": "केंद्रीय परियोजना पंजिका",

  // State Nodal Dashboard Phrases
  "State Nodal Department Workspace": "राज्य नोडल विभाग कार्यक्षेत्र",
  "District Performance": "ज़िला प्रदर्शन",
  "Escalations & Vigilance": "शिकायत निवारण एवं सतर्कता",
  "Reports & Analytics": "रिपोर्ट एवं विश्लेषण",
  "State Projects": "राज्य परियोजनाएं",
  "District Performance Matrix": "ज़िला प्रदर्शन मैट्रिक्स",
  "Vigilance Escalations": "सतर्कता मामले",

  // Contractor & Field Dashboard Phrases
  "Contractor Workspace": "संविदाकार कार्यक्षेत्र",
  "Vendor Projects Portal": "विक्रेता परियोजना पोर्टल",
  "Active Work Orders": "सक्रिय कार्य आदेश",
  "Total Contract Value": "कुल अनुबंध मूल्य",
  "Milestones Completed": "पूर्ण किए गए चरण",
  "Stage Evidence Submissions": "चरणवार साक्ष्य प्रस्तुतियां",
  "Field Officer Workspace": "क्षेत्रीय अधिकारी कार्यक्षेत्र",
  "Pending Inspection Queue": "लंबित निरीक्षण सूची",
  "My Verifications": "मेरे सत्यापन",
  "Flagged Anomalies": "चिह्नित विसंगतियाँ",
  "Submit Field Verification Report": "क्षेत्रीय सत्यापन रिपोर्ट प्रस्तुत करें",
  "Submit Geotagged Evidence": "भू-टैग साक्ष्य प्रस्तुत करें",

  // Citizen Portal Phrases
  "Citizen Portal — Voice of Constituency": "नागरिक पोर्टल — निर्वाचन क्षेत्र की आवाज़",
  "Find Works": "कार्य खोजें",
  "My Reports": "मेरी रिपोर्टें",
  "Notifications": "सूचनाएं",
  "Report an Issue": "समस्या दर्ज करें",
  "Submit Infrastructure Request": "अवसंरचना मांग प्रस्तुत करें",
  "Track Application": "आवेदन स्थिति ट्रैक करें",
  "Public Demand": "सार्वजनिक मांग",
  "Grievance Redressal": "शिकायत निवारण",
  "Community Feedback": "सामुदायिक प्रतिक्रिया"
};

// Precomputed lowercase Map for high-performance O(1) constant-time lookups
const LOWERCASE_PHRASE_MAP = new Map<string, string>();
for (const [key, val] of Object.entries(HINDI_PHRASE_MAP)) {
  LOWERCASE_PHRASE_MAP.set(key.toLowerCase(), val);
}

/**
 * Universal text translation helper
 * Translates any English string or phrase to Hindi when lang === 'hi'
 * Optimized with O(1) Map lookup
 */
export function translate(text: string | null | undefined, lang: 'en' | 'hi' = 'en'): string {
  if (!text) return "";
  if (lang !== 'hi') return text;
  
  const trimmed = text.trim();
  const directMatch = HINDI_PHRASE_MAP[trimmed];
  if (directMatch) {
    return directMatch;
  }

  // Instant O(1) Case-insensitive lookup
  const caseInsensitiveMatch = LOWERCASE_PHRASE_MAP.get(trimmed.toLowerCase());
  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch;
  }

  return text;
}

