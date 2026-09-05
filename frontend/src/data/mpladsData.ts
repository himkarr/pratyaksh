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
 *    - Provides rich initial state so the frontend remains fully functional and
 *      demonstrable even when external backend/ML services are offline.
 */

import sampleProjects from "../../../contracts/sample-data/sample_projects.json";
import sampleFlags from "../../../contracts/sample-data/sample_flags.json";
import sampleUsers from "../../../contracts/sample-data/sample_users.json";

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

// Generate works harmonized with contracts/sample_projects.json
export const INITIAL_WORKS: WorkItem[] = sampleProjects.map((p: any, idx) => {
  const sancCr = Number(((p.sanctioned_amount || 25000000) / 10000000).toFixed(2));
  const utilCr = Number(((p.utilized_amount || 12000000) / 10000000).toFixed(2));
  const recCr = Number((sancCr * 1.05).toFixed(2));
  const finPct = sancCr > 0 ? Math.round((utilCr / sancCr) * 100) : 0;
  const physPct = p.physical_progress_percent ?? (p.status === 'completed' ? 100 : (idx % 2 === 0 ? 65 : 35));

  const statusNormalized = 
    p.status === 'completed' ? 'Completed' :
    p.status === 'delayed' ? 'Delayed' :
    p.status === 'in_progress' ? 'Ongoing' :
    p.status === 'recommended' ? 'Recommended' : 'Sanctioned';

  const sectorName = p.sector || (idx % 4 === 0 ? 'Drinking Water' : idx % 4 === 1 ? 'Education' : idx % 4 === 2 ? 'Roads' : 'Health');

  const categoryId = 
    sectorName === 'Drinking Water' ? 'water' :
    sectorName === 'Education' ? 'education' :
    sectorName === 'Health' ? 'healthcare' :
    sectorName === 'Roads' ? 'roads' :
    sectorName === 'Community Assets' ? 'community' :
    sectorName === 'Renewable Energy' ? 'solar' :
    sectorName === 'Sports' ? 'sports' : 'community';

  return {
    id: p.id,
    title: p.title,
    house: 'Lok Sabha',
    state: p.state || 'Maharashtra',
    district: p.district || 'Pune',
    constituency: p.constituency_code === 'MH-PUNE-01' ? 'Pune' :
                  p.constituency_code === 'UP-VARAN-01' ? 'Varanasi' :
                  p.constituency_code === 'KA-BLR-01' ? 'Bangalore South' :
                  p.constituency_code === 'DL-NDLS-01' ? 'New Delhi' : 'Mumbai South',
    constituency_code: p.constituency_code,
    mpName: p.constituency_code === 'UP-VARAN-01' ? 'Narendra Modi' :
            p.constituency_code === 'MH-PUNE-01' ? 'Murlidhar Mohol' :
            p.constituency_code === 'KA-BLR-01' ? 'Tejasvi Surya' : 'Arvind Sawant',
    category: categoryId,
    sectorName: sectorName,
    recommendedAmt: recCr,
    sanctionedAmt: sancCr,
    expenditureAmt: utilCr,
    physicalProgress: physPct,
    financialProgress: finPct,
    dateSanctioned: p.sanction_date || '2024-02-15',
    targetCompletion: '2025-02-14', // 1 Year Statutory Rule
    status: statusNormalized as WorkItem['status'],
    agency: p.implementing_agency || 'District Rural Development Agency (DRDA)',
    contractor: p.vendor_name || 'M/s Infra Buildcon India Ltd.',
    rating: Number((4.0 + (idx % 10) * 0.1).toFixed(1)),
    reviewsCount: 3 + (idx % 7),
    attachments: [
      {
        id: `att-${p.id}-1`,
        type: 'image',
        title: 'Geotagged Site Photo - Construction Phase',
        stage: 'Execution Phase',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800&auto=format&fit=crop&q=60'
      },
      {
        id: `att-${p.id}-2`,
        type: 'document',
        title: 'Signed Administrative Sanction Order',
        stage: 'Sanction Stage',
        url: '#'
      }
    ],
    reviews: [
      {
        id: `rev-${p.id}-1`,
        author: 'Ramesh Sharma (Resident)',
        rating: 5,
        date: '2024-05-10',
        comment: 'High quality work execution and timely progress in our area.',
        verified: true
      },
      {
        id: `rev-${p.id}-2`,
        author: 'Priya K. (Social Auditor)',
        rating: 4,
        date: '2024-06-02',
        comment: 'Asset physical verification completed. Meets technical specifications.',
        verified: true
      }
    ]
  };
});

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
