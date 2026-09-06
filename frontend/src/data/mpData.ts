export interface MPRecommendation {
  id: string;
  title: string;
  category: "Drinking Water" | "Education" | "Roads" | "Health" | "Community Assets" | "Renewable Energy" | "Sports";
  estimatedCost: number; // in Cr
  sanctionedCost?: number; // in Cr
  location: string;
  district: string;
  constituency: string;
  constituency_code: string;
  mpName: string;
  justification: string;
  status: "PROPOSED" | "UNDER_SCRUTINY" | "SANCTIONED" | "REJECTED";
  dateProposed: string;
  dateSanctioned?: string;
  districtNotes?: string;
  citizenRequestId?: string;
}

export const INITIAL_MP_RECOMMENDATIONS: MPRecommendation[] = [
  {
    id: "REC-MH-PUNE-2024-001",
    title: "Construction of Multi-Specialty Mobile Healthcare Van Facility",
    category: "Health",
    estimatedCost: 1.20,
    sanctionedCost: 1.20,
    location: "Kothrud & Karve Nagar Sub-districts",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    justification: "Fulfills urgent demand for mobile primary healthcare diagnostics in peri-urban areas.",
    status: "SANCTIONED",
    dateProposed: "2024-01-15",
    dateSanctioned: "2024-02-10",
    districtNotes: "Technical feasibility approved by District Health Officer. Sanction issued."
  },
  {
    id: "REC-MH-PUNE-2024-002",
    title: "Rooftop Solar PV Installation across 15 Zilla Parishad Schools",
    category: "Renewable Energy",
    estimatedCost: 0.85,
    sanctionedCost: 0.85,
    location: "Haveli & Pune Rural Blocks",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    justification: "Provides 24/7 uninterrupted green power for computer labs and digital smart classrooms.",
    status: "SANCTIONED",
    dateProposed: "2024-02-01",
    dateSanctioned: "2024-02-28",
    districtNotes: "Sanctioned under Green Energy Initiative. Vendor procurement underway."
  },
  {
    id: "REC-MH-PUNE-2024-003",
    title: "Augmentation of Overhead Water Tank Capacity & Feeder Pipeline",
    category: "Drinking Water",
    estimatedCost: 1.50,
    location: "Shivajinagar Ward 12",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    justification: "Recommended based on citizen grievance #ISSUE-MH-2024-001 regarding drinking water shortage.",
    status: "UNDER_SCRUTINY",
    dateProposed: "2024-05-12",
    districtNotes: "Under technical scrutiny by Executive Engineer, Public Health Engineering Dept.",
    citizenRequestId: "ISSUE-MH-2024-001"
  }
];
