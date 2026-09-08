/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * MODULE: mpladsData (Domain Data Models, Static Contracts & Normalization)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * This module defines the canonical TypeScript interfaces and initial dataset
 * for the MPLAD Scheme decision-support frontend:
 * 
 * 1. Harmonized Data Contracts:
 *    - Maps directly to schemas defined in `contracts/sample-data/`
 *      (`sample_projects.json`, `sample_flags.json`, `sample_users.json`).
 * 2. Statutory Policy Rules:
 *    - Embeds official MoSPI business rules:
 *      * 1-Year (365 calendar days) statutory completion ceiling
 *      * Linear burn rate trajectory benchmarks
 *      * Mandatory geotagged photographic milestone stages
 * 3. Fallback Offline Resilience:
 *    - Provides rich initial state so the frontend remains fully functional
 *      even when external backend/ML services are offline.
 */

import sampleProjects from "../../../contracts/sample-data/sample_projects.json";
import sampleFlags from "../../../contracts/sample-data/sample_flags.json";
import sampleUsers from "../../../contracts/sample-data/sample_users.json";
import officialWorksRaw from "./officialWorks.json";

export interface Sector {
  id: string;
  name: string;
  color: string;
}

export interface Tenure {
  id: string;
  label: string;
  house: string;
}

export interface WorkAttachment {
  id: string;
  type: 'image' | 'document';
  title: string;
  stage: string;
  url: string;
}

export interface WorkReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface WorkItem {
  id: string;
  title: string;
  house: string;
  state: string;
  district: string;
  constituency: string;
  constituency_code: string;
  mpName: string;
  category: string;
  sectorName: string;
  recommendedAmt: number; // in Cr
  sanctionedAmt: number; // in Cr
  expenditureAmt: number; // in Cr
  physicalProgress: number; // in %
  financialProgress: number; // in %

  dateSanctioned: string;
  targetCompletion: string;
  status: 'Sanctioned' | 'Ongoing' | 'Completed' | 'Delayed' | 'Recommended';
  agency: string;
  contractor: string;
  rating: number;
  reviewsCount: number;
  attachments: WorkAttachment[];
  reviews: WorkReview[];
  justification?: string;
  districtNotes?: string;
  citizenRequestId?: string;
}

export const TENURES: Tenure[] = [
  { id: "18-ls", label: "18th Lok Sabha (2024 - Present)", house: "Lok Sabha" },
  { id: "17-ls", label: "17th Lok Sabha (2019 - 2024)", house: "Lok Sabha" },
  { id: "rs-2024", label: "Rajya Sabha (2024 - 2030)", house: "Rajya Sabha" },
  { id: "rs-2022", label: "Rajya Sabha (2022 - 2028)", house: "Rajya Sabha" }
];

export const SECTORS: Sector[] = [
  { id: "all", name: "All Sectors", color: "#0f2942" },
  { id: "healthcare", name: "Healthcare & Hospitals", color: "#0f3460" },
  { id: "education", name: "Education & Classrooms", color: "#1e3a5f" },
  { id: "water", name: "Drinking Water & Sanitation", color: "#065f46" },
  { id: "roads", name: "Roads & Rural Bridges", color: "#92400e" },
  { id: "community", name: "Community Halls & Assets", color: "#4c1d95" },
  { id: "solar", name: "Solar & Energy Assets", color: "#b45309" },
  { id: "sports", name: "Sports & Youth Infrastructure", color: "#1e40af" },
  { id: "irrigation", name: "Water Conservation & Canals", color: "#0e7490" }
];

export const STATES_AND_CONSTITUENCIES: Record<string, { "Lok Sabha": { id: string; name: string; mp: string }[] }> = {
  "Maharashtra": {
    "Lok Sabha": [
      { id: "MH-MUMB-S", name: "Mumbai South", mp: "Arvind Sawant" },
      { id: "MH-PUNE", name: "Pune", mp: "Murlidhar Mohol" },
      { id: "MH-NAGP", name: "Nagpur", mp: "Nitin Gadkari" },
      { id: "MH-BARA", name: "Baramati", mp: "Supriya Sule" },
      { id: "MH-THANE", name: "Thane", mp: "Naresh Mhaske" }
    ]
  },
  "Uttar Pradesh": {
    "Lok Sabha": [
      { id: "UP-VARAN", name: "Varanasi", mp: "Narendra Modi" },
      { id: "UP-LUCK", name: "Lucknow", mp: "Rajnath Singh" },
      { id: "UP-RAEB", name: "Rae Bareli", mp: "Rahul Gandhi" },
      { id: "UP-GORAKH", name: "Gorakhpur", mp: "Ravi Kishan" }
    ]
  },
  "Delhi": {
    "Lok Sabha": [
      { id: "DL-NEW-DELHI", name: "New Delhi", mp: "Bansuri Swaraj" },
      { id: "DL-EAST-DELHI", name: "East Delhi", mp: "Harsh Malhotra" },
      { id: "DL-SOUTH-DELHI", name: "South Delhi", mp: "Ramvir Singh Bidhuri" }
    ]
  },
  "Karnataka": {
    "Lok Sabha": [
      { id: "KA-BLR-S", name: "Bangalore South", mp: "Tejasvi Surya" },
      { id: "KA-BLR-C", name: "Bangalore Central", mp: "P. C. Mohan" },
      { id: "KA-MYS", name: "Mysore", mp: "Yaduveer Krishnadatta" }
    ]
  },
  "Tamil Nadu": {
    "Lok Sabha": [
      { id: "TN-CHE-S", name: "Chennai South", mp: "Thamizhachi Thangapandian" },
      { id: "TN-COIM", name: "Coimbatore", mp: "Ganapathi P. Rajkumar" },
      { id: "TN-MADU", name: "Madurai", mp: "Su. Venkatesan" }
    ]
  }
};

// Monthly expenditure & fund disbursal burn rate curve data
export const MONTHLY_SPEND_TREND = [
  { month: "Apr '24", sanctionedCap: 25.0, cumulativeDisbursed: 4.5, cumulativeSpent: 2.1, targetLinear: 2.08 },
  { month: "May '24", sanctionedCap: 25.0, cumulativeDisbursed: 7.8, cumulativeSpent: 4.6, targetLinear: 4.16 },
  { month: "Jun '24", sanctionedCap: 25.0, cumulativeDisbursed: 10.2, cumulativeSpent: 7.2, targetLinear: 6.25 },
  { month: "Jul '24", sanctionedCap: 25.0, cumulativeDisbursed: 13.0, cumulativeSpent: 9.8, targetLinear: 8.33 },
  { month: "Aug '24", sanctionedCap: 25.0, cumulativeDisbursed: 15.5, cumulativeSpent: 12.1, targetLinear: 10.41 },
  { month: "Sep '24", sanctionedCap: 25.0, cumulativeDisbursed: 17.8, cumulativeSpent: 14.9, targetLinear: 12.50 },
  { month: "Oct '24", sanctionedCap: 25.0, cumulativeDisbursed: 19.4, cumulativeSpent: 16.7, targetLinear: 14.58 },
  { month: "Nov '24", sanctionedCap: 25.0, cumulativeDisbursed: 21.0, cumulativeSpent: 18.5, targetLinear: 16.66 },
  { month: "Dec '24", sanctionedCap: 25.0, cumulativeDisbursed: 22.8, cumulativeSpent: 20.2, targetLinear: 18.75 },
  { month: "Jan '25", sanctionedCap: 25.0, cumulativeDisbursed: 23.9, cumulativeSpent: 21.6, targetLinear: 20.83 },
  { month: "Feb '25", sanctionedCap: 25.0, cumulativeDisbursed: 24.6, cumulativeSpent: 22.8, targetLinear: 22.91 },
  { month: "Mar '25", sanctionedCap: 25.0, cumulativeDisbursed: 25.0, cumulativeSpent: 23.9, targetLinear: 25.00 }
];

export const JABALPUR_WORKS: WorkItem[] = [
  {
    id: "WORK-MP-JBL-001",
    title: "Construction of Concrete Access Road & Culvert Bridge in Sihora Rural Sector",
    house: "Lok Sabha",
    state: "Madhya Pradesh",
    district: "Jabalpur",
    constituency: "Jabalpur (PC-13)",
    constituency_code: "MP-JBL-13",
    mpName: "Shri Ashish Dubey",
    category: "Roads",
    sectorName: "Roads",
    recommendedAmt: 0.85,
    sanctionedAmt: 0.85,
    expenditureAmt: 0.55,
    physicalProgress: 65,
    financialProgress: 64,
    dateSanctioned: "2024-04-01",
    targetCompletion: "2025-03-31",
    status: "Ongoing",
    agency: "Office of District Magistrate, Jabalpur",
    contractor: "M/s Apex Infra & Construction Ltd.",
    rating: 4.8,
    reviewsCount: 12,
    attachments: [
      {
        id: "att-jbl-01",
        type: "image",
        title: "Sihora Road Geotagged Inspection Photo",
        stage: "Stage 2: Substructure & Progress",
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80"
      }
    ],
    reviews: []
  },
  {
    id: "WORK-MP-JBL-002",
    title: "Installation of Overhead Drinking Water Storage Tank & Pipeline Network in Patan Block",
    house: "Lok Sabha",
    state: "Madhya Pradesh",
    district: "Jabalpur",
    constituency: "Jabalpur (PC-13)",
    constituency_code: "MP-JBL-13",
    mpName: "Shri Ashish Dubey",
    category: "Drinking Water",
    sectorName: "Drinking Water",
    recommendedAmt: 1.20,
    sanctionedAmt: 1.20,
    expenditureAmt: 0.40,
    physicalProgress: 35,
    financialProgress: 33,
    dateSanctioned: "2024-05-10",
    targetCompletion: "2025-05-09",
    status: "Ongoing",
    agency: "PHE Department / DRDA Jabalpur",
    contractor: "M/s Sagar Waterworks & Civil Corp",
    rating: 4.6,
    reviewsCount: 8,
    attachments: [],
    reviews: []
  },
  {
    id: "WORK-MP-JBL-003",
    title: "Construction of Sub-Health Center Building & Emergency Care Unit, Panagar Sector",
    house: "Lok Sabha",
    state: "Madhya Pradesh",
    district: "Jabalpur",
    constituency: "Jabalpur (PC-13)",
    constituency_code: "MP-JBL-13",
    mpName: "Shri Ashish Dubey",
    category: "Health",
    sectorName: "Health",
    recommendedAmt: 0.95,
    sanctionedAmt: 0.95,
    expenditureAmt: 0.15,
    physicalProgress: 15,
    financialProgress: 15,
    dateSanctioned: "2024-06-01",
    targetCompletion: "2025-05-31",
    status: "Sanctioned",
    agency: "Health Infrastructure Division, Jabalpur",
    contractor: "M/s Apex Infra & Construction Ltd.",
    rating: 4.5,
    reviewsCount: 5,
    attachments: [],
    reviews: []
  },
  {
    id: "WORK-MP-JBL-004",
    title: "Upgradation & Digital Smart Classroom Complex in Model School, Jabalpur West",
    house: "Lok Sabha",
    state: "Madhya Pradesh",
    district: "Jabalpur",
    constituency: "Jabalpur (PC-13)",
    constituency_code: "MP-JBL-13",
    mpName: "Shri Ashish Dubey",
    category: "Education",
    sectorName: "Education",
    recommendedAmt: 0.60,
    sanctionedAmt: 0.60,
    expenditureAmt: 0.54,
    physicalProgress: 90,
    financialProgress: 90,
    dateSanctioned: "2024-02-15",
    targetCompletion: "2024-12-31",
    status: "Ongoing",
    agency: "Public Works Department, Jabalpur",
    contractor: "M/s Infra Buildcon India Ltd.",
    rating: 4.9,
    reviewsCount: 19,
    attachments: [],
    reviews: []
  },
  {
    id: "WORK-MP-JBL-005",
    title: "Solar Rooftop Power Plant & High-Mast LED Lighting in Cantonment Public Parks",
    house: "Lok Sabha",
    state: "Madhya Pradesh",
    district: "Jabalpur",
    constituency: "Jabalpur (PC-13)",
    constituency_code: "MP-JBL-13",
    mpName: "Shri Ashish Dubey",
    category: "Community Assets",
    sectorName: "Community",
    recommendedAmt: 0.40,
    sanctionedAmt: 0.40,
    expenditureAmt: 0.40,
    physicalProgress: 100,
    financialProgress: 100,
    dateSanctioned: "2024-01-10",
    targetCompletion: "2024-09-30",
    status: "Completed",
    agency: "Municipal Corporation Jabalpur",
    contractor: "M/s Sagar Waterworks & Civil Corp",
    rating: 5.0,
    reviewsCount: 31,
    attachments: [],
    reviews: []
  },
  {
    id: "WORK-MP-JBL-006",
    title: "Multi-Purpose Skill Development Center & Community Hall, Kundam Block",
    house: "Lok Sabha",
    state: "Madhya Pradesh",
    district: "Jabalpur",
    constituency: "Jabalpur (PC-13)",
    constituency_code: "MP-JBL-13",
    mpName: "Shri Ashish Dubey",
    category: "Community Assets",
    sectorName: "Community",
    recommendedAmt: 0.75,
    sanctionedAmt: 0.75,
    expenditureAmt: 0.35,
    physicalProgress: 45,
    financialProgress: 46,
    dateSanctioned: "2024-03-20",
    targetCompletion: "2025-03-19",
    status: "Ongoing",
    agency: "DRDA Jabalpur",
    contractor: "M/s Apex Infra & Construction Ltd.",
    rating: 4.7,
    reviewsCount: 9,
    attachments: [],
    reviews: []
  }
];

// Official works loaded from Supabase application database
export const INITIAL_WORKS: WorkItem[] = [...JABALPUR_WORKS, ...(officialWorksRaw as unknown as WorkItem[])];

// Demo custom works for Varanasi and New Delhi
export const CUSTOM_WORKS: WorkItem[] = [
  {
    id: "CUST-001",
    title: "Varanasi - Community Hall Renovation",
    house: "Lok Sabha",
    state: "Uttar Pradesh",
    district: "Varanasi",
    constituency: "Varanasi",
    constituency_code: "UP-VARAN-01",
    mpName: "Narendra Modi",
    category: "Community Assets",
    sectorName: "Community",
    recommendedAmt: 0.5,
    sanctionedAmt: 0.5,
    expenditureAmt: 0.2,
    physicalProgress: 40,
    financialProgress: 30,
    dateSanctioned: "2024-05-01",
    targetCompletion: "2025-04-30",
    status: "Ongoing",
    agency: "Public Works Department",
    contractor: "ABC Constructions",
    rating: 4,
    reviewsCount: 2,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-002",
    title: "New Delhi - Solar Street Lights Installation",
    house: "Lok Sabha",
    state: "Delhi",
    district: "New Delhi",
    constituency: "New Delhi",
    constituency_code: "DL-NEW-DELHI-01",
    mpName: "Bansuri Swaraj",
    category: "Solar",
    sectorName: "Solar",
    recommendedAmt: 0.8,
    sanctionedAmt: 0.8,
    expenditureAmt: 0.1,
    physicalProgress: 10,
    financialProgress: 5,
    dateSanctioned: "2024-06-15",
    targetCompletion: "2025-06-14",
    status: "Recommended",
    agency: "Energy Ministry",
    contractor: "SolarTech Ltd",
    rating: 0,
    reviewsCount: 0,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-003",
    title: "Pune - Community Library Construction",
    house: "Lok Sabha",
    state: "Maharashtra",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    category: "Education",
    sectorName: "Education",
    recommendedAmt: 0.6,
    sanctionedAmt: 0,
    expenditureAmt: 0,
    physicalProgress: 0,
    financialProgress: 0,
    dateSanctioned: "2024-07-01",
    targetCompletion: "2025-06-30",
    status: "Recommended",
    agency: "Education Department",
    contractor: "",
    rating: 0,
    reviewsCount: 0,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-004",
    title: "Pune - Old Bridge Demolition",
    house: "Lok Sabha",
    state: "Maharashtra",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    category: "Infrastructure",
    sectorName: "Roads",
    recommendedAmt: 0.4,
    sanctionedAmt: 0.4,
    expenditureAmt: 0.1,
    physicalProgress: 20,
    financialProgress: 25,
    dateSanctioned: "2023-09-15",
    targetCompletion: "2024-09-14",
    status: "Delayed",
    agency: "Public Works Department",
    contractor: "XYZ Constructions",
    rating: 2,
    reviewsCount: 1,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-005",
    title: "Varanasi - Heritage Site Restoration",
    house: "Lok Sabha",
    state: "Uttar Pradesh",
    district: "Varanasi",
    constituency: "Varanasi",
    constituency_code: "UP-VARAN-01",
    mpName: "Narendra Modi",
    category: "Cultural",
    sectorName: "Community",
    recommendedAmt: 0.7,
    sanctionedAmt: 0.7,
    expenditureAmt: 0.7,
    physicalProgress: 100,
    financialProgress: 100,
    dateSanctioned: "2022-01-10",
    targetCompletion: "2022-12-31",
    status: "Completed",
    agency: "Archaeology Department",
    contractor: "Heritage Builders Ltd",
    rating: 5,
    reviewsCount: 3,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-006",
    title: "Varanasi - Water Supply Upgrade",
    house: "Lok Sabha",
    state: "Uttar Pradesh",
    district: "Varanasi",
    constituency: "Varanasi",
    constituency_code: "UP-VARAN-01",
    mpName: "Narendra Modi",
    category: "Water",
    sectorName: "Water",
    recommendedAmt: 0.9,
    sanctionedAmt: 0.9,
    expenditureAmt: 0.3,
    physicalProgress: 45,
    financialProgress: 70,
    dateSanctioned: "2024-02-20",
    targetCompletion: "2025-02-19",
    status: "Delayed",
    agency: "Water Resources Department",
    contractor: "AquaTech Pvt Ltd",
    rating: 3,
    reviewsCount: 2,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-007",
    title: "New Delhi - Metro Extension Phase 2",
    house: "Lok Sabha",
    state: "Delhi",
    district: "New Delhi",
    constituency: "New Delhi",
    constituency_code: "DL-NEW-DELHI-01",
    mpName: "Bansuri Swaraj",
    category: "Transport",
    sectorName: "Roads",
    recommendedAmt: 1.2,
    sanctionedAmt: 1.2,
    expenditureAmt: 0.4,
    physicalProgress: 35,
    financialProgress: 30,
    dateSanctioned: "2023-05-05",
    targetCompletion: "2025-04-30",
    status: "Ongoing",
    agency: "Delhi Metro Rail Corporation",
    contractor: "MetroBuild Ltd",
    rating: 4,
    reviewsCount: 2,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-008",
    title: "New Delhi - Central Park Revamp",
    house: "Lok Sabha",
    state: "Delhi",
    district: "New Delhi",
    constituency: "New Delhi",
    constituency_code: "DL-NEW-DELHI-01",
    mpName: "Bansuri Swaraj",
    category: "Parks",
    sectorName: "Community",
    recommendedAmt: 0.5,
    sanctionedAmt: 0.5,
    expenditureAmt: 0.2,
    physicalProgress: 10,
    financialProgress: 5,
    dateSanctioned: "2024-03-10",
    targetCompletion: "2025-03-09",
    status: "Recommended",
    agency: "Delhi Municipal Council",
    contractor: "GreenScape Ltd",
    rating: 0,
    reviewsCount: 0,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-009",
    title: "Pune - Multi-Specialty Mobile Healthcare Van Facility",
    house: "Lok Sabha",
    state: "Maharashtra",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    category: "Health",
    sectorName: "Health",
    recommendedAmt: 1.2,
    sanctionedAmt: 1.2,
    expenditureAmt: 0.9,
    physicalProgress: 45,
    financialProgress: 75,
    dateSanctioned: "2024-02-10",
    targetCompletion: "2025-02-09",
    status: "Ongoing",
    agency: "District Health Society",
    contractor: "MedVan Systems India",
    rating: 4,
    reviewsCount: 2,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-010",
    title: "Pune - Rooftop Solar PV Installation across 15 Zilla Parishad Schools",
    house: "Lok Sabha",
    state: "Maharashtra",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    category: "Renewable Energy",
    sectorName: "Power",
    recommendedAmt: 0.85,
    sanctionedAmt: 0.85,
    expenditureAmt: 0.85,
    physicalProgress: 100,
    financialProgress: 100,
    dateSanctioned: "2023-11-15",
    targetCompletion: "2024-08-30",
    status: "Completed",
    agency: "Maharashtra Energy Development Agency",
    contractor: "SunPower EPC Ltd",
    rating: 5,
    reviewsCount: 4,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-011",
    title: "New Delhi - Smart Digital Classrooms at NDMC Schools",
    house: "Lok Sabha",
    state: "Delhi",
    district: "New Delhi",
    constituency: "New Delhi",
    constituency_code: "DL-NEW-DELHI-01",
    mpName: "Bansuri Swaraj",
    category: "Education",
    sectorName: "Education",
    recommendedAmt: 0.95,
    sanctionedAmt: 0.95,
    expenditureAmt: 0.95,
    physicalProgress: 100,
    financialProgress: 100,
    dateSanctioned: "2023-08-10",
    targetCompletion: "2024-05-30",
    status: "Completed",
    agency: "NDMC Education Dept",
    contractor: "EduTech Solutions",
    rating: 5,
    reviewsCount: 3,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-012",
    title: "New Delhi - EV Fast Charging Hubs Outer Circle",
    house: "Lok Sabha",
    state: "Delhi",
    district: "New Delhi",
    constituency: "New Delhi",
    constituency_code: "DL-NEW-DELHI-01",
    mpName: "Bansuri Swaraj",
    category: "Renewable Energy",
    sectorName: "Power",
    recommendedAmt: 1.3,
    sanctionedAmt: 1.3,
    expenditureAmt: 0.8,
    physicalProgress: 25,
    financialProgress: 60,
    dateSanctioned: "2023-10-15",
    targetCompletion: "2024-09-30",
    status: "Delayed",
    agency: "Delhi Power Discom",
    contractor: "VoltCharge India",
    rating: 3,
    reviewsCount: 1,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-013",
    title: "Varanasi - Handloom Incubation Center & Weavers Shed",
    house: "Lok Sabha",
    state: "Uttar Pradesh",
    district: "Varanasi",
    constituency: "Varanasi",
    constituency_code: "UP-VARAN-01",
    mpName: "Narendra Modi",
    category: "Education",
    sectorName: "Education",
    recommendedAmt: 0.90,
    sanctionedAmt: 0.90,
    expenditureAmt: 0.35,
    physicalProgress: 35,
    financialProgress: 30,
    dateSanctioned: "2024-03-28",
    targetCompletion: "2025-03-27",
    status: "Sanctioned",
    agency: "Handloom & Textile Directorate",
    contractor: "Banaras Infra Corp",
    rating: 4,
    reviewsCount: 2,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-014",
    title: "Varanasi - Solar Riverfront Illumination at Assi",
    house: "Lok Sabha",
    state: "Uttar Pradesh",
    district: "Varanasi",
    constituency: "Varanasi",
    constituency_code: "UP-VARAN-01",
    mpName: "Narendra Modi",
    category: "Renewable Energy",
    sectorName: "Power",
    recommendedAmt: 1.10,
    sanctionedAmt: 1.10,
    expenditureAmt: 0.75,
    physicalProgress: 75,
    financialProgress: 68,
    dateSanctioned: "2024-02-18",
    targetCompletion: "2025-02-17",
    status: "Ongoing",
    agency: "UP New & Renewable Energy Dev Agency",
    contractor: "Ganga Green Energy",
    rating: 5,
    reviewsCount: 3,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-015",
    title: "Pune - Warje Modern Youth Sports Ground",
    house: "Lok Sabha",
    state: "Maharashtra",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    category: "Sports",
    sectorName: "Sports",
    recommendedAmt: 1.10,
    sanctionedAmt: 0,
    expenditureAmt: 0,
    physicalProgress: 0,
    financialProgress: 0,
    dateSanctioned: "2024-07-15",
    targetCompletion: "2025-07-14",
    status: "Recommended",
    agency: "Pune Municipal Corporation Sports Wing",
    contractor: "",
    rating: 0,
    reviewsCount: 0,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-016",
    title: "Pune - Wadgaon Sheri Internal Concrete Pathways",
    house: "Lok Sabha",
    state: "Maharashtra",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    category: "Roads",
    sectorName: "Roads",
    recommendedAmt: 0.75,
    sanctionedAmt: 0.75,
    expenditureAmt: 0.40,
    physicalProgress: 60,
    financialProgress: 53,
    dateSanctioned: "2024-03-01",
    targetCompletion: "2025-02-28",
    status: "Ongoing",
    agency: "Public Works Department",
    contractor: "Shree Builders Pune",
    rating: 4,
    reviewsCount: 1,
    attachments: [],
    reviews: []
  },
  {
    id: "CUST-017",
    title: "New Delhi - Mobile Specialized Diagnostic Clinics",
    house: "Lok Sabha",
    state: "Delhi",
    district: "New Delhi",
    constituency: "New Delhi",
    constituency_code: "DL-NEW-DELHI-01",
    mpName: "Bansuri Swaraj",
    category: "Health",
    sectorName: "Health",
    recommendedAmt: 1.15,
    sanctionedAmt: 1.15,
    expenditureAmt: 0.55,
    physicalProgress: 50,
    financialProgress: 48,
    dateSanctioned: "2024-04-15",
    targetCompletion: "2025-04-14",
    status: "Sanctioned",
    agency: "Delhi Health Mission",
    contractor: "MedLife Mobile Care Ltd",
    rating: 5,
    reviewsCount: 2,
    attachments: [],
    reviews: []
  }
];


export const ALL_WORKS = [...INITIAL_WORKS, ...CUSTOM_WORKS];

export const SCHEME_POLICIES = {
  title: "Guidelines on Member of Parliament Local Area Development Scheme (MPLADS) & e-SAKSHI Implementation",
  clauses: [
    {
      title: "Statutory 1-Year Completion Ceiling",
      content: "All works sanctioned by District Authorities must be executed and completed within 12 calendar months from the formal sanction date. Any delay beyond 365 days triggers automated risk escalations and physical inspection audits."
    },
    {
      title: "e-SAKSHI Real-Time Web Fund Flow",
      content: "Since 1st April 2023, the entire workflow of recommendation, administrative sanction, fund disbursal, and expenditure tracking is executed end-to-end via the online portal without physical checks."
    },
    {
      title: "Mandatory Geotagged Milestone Verification",
      content: "Implementing agencies must upload geotagged, timestamped photographs before sanction, at mid-stage, and upon completion before final payment releases are authorized."
    },
    {
      title: "Hybrid Explainable AI & Auditability",
      content: "The decision-support system runs transparent business rules alongside machine learning anomaly detection to assist officers. Every flag is an explainable review signal, recorded to a tamper-evident audit log."
    }
  ]
};

export { sampleProjects, sampleFlags, sampleUsers };
