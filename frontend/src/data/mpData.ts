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
  // Pune (MH-PUNE-01) - Hon'ble Murlidhar Mohol
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
  },
  {
    id: "REC-MH-PUNE-2024-004",
    title: "Construction of Synthetic Athletic Track and Multipurpose Sports Hall",
    category: "Sports",
    estimatedCost: 1.10,
    location: "Warje & Dhayari Sports Complex",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    justification: "Nurturing grassroots youth talent and providing professional running tracks in South-West Pune.",
    status: "PROPOSED",
    dateProposed: "2024-06-15",
    districtNotes: "Submitted to PMC Sports Department for municipal plot allocation clearance."
  },
  {
    id: "REC-MH-PUNE-2024-005",
    title: "Upgradation of Critical Arterial Link Roads and Paver Blocks in Wadgaon Sheri",
    category: "Roads",
    estimatedCost: 0.75,
    location: "Wadgaon Sheri Ward 4",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    justification: "Relieving severe monsoon water runoff and repairing potholed residential approach routes.",
    status: "UNDER_SCRUTINY",
    dateProposed: "2024-07-02",
    districtNotes: "DPR received from Pune Municipal Corporation Road Department."
  },
  {
    id: "REC-MH-PUNE-2024-006",
    title: "Establishment of Model E-Learning Centers and Digital Study Hubs",
    category: "Education",
    estimatedCost: 0.65,
    sanctionedCost: 0.65,
    location: "Aundh & Baner Municipal Schools",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    justification: "Provides low-income students with high-speed internet, digital tablets, and competitive exam guidance.",
    status: "SANCTIONED",
    dateProposed: "2024-03-10",
    dateSanctioned: "2024-04-05",
    districtNotes: "Sanction granted. Device procurement through GeM portal finalized."
  },

  // Varanasi (UP-VARAN-01) - Hon'ble Narendra Modi
  {
    id: "REC-UP-VARAN-2024-001",
    title: "Solar High-Mast Lighting and CCTV Surveillance at Assi & Dashashwamedh Ghats",
    category: "Renewable Energy",
    estimatedCost: 1.10,
    sanctionedCost: 1.10,
    location: "Assi & Dashashwamedh Ghat Riverfront",
    district: "Varanasi",
    constituency: "Varanasi",
    constituency_code: "UP-VARAN-01",
    mpName: "Narendra Modi",
    justification: "Enhance safety, tourist convenience, and green illumination across high-footfall pilgrimage ghats.",
    status: "SANCTIONED",
    dateProposed: "2024-01-20",
    dateSanctioned: "2024-02-18",
    districtNotes: "Approved under Smart Pilgrim Infrastructure scheme. Installation completed in sector 1."
  },
  {
    id: "REC-UP-VARAN-2024-002",
    title: "Modern Community Dialysis and Diagnostic Health Center at Shivpur",
    category: "Health",
    estimatedCost: 1.65,
    sanctionedCost: 1.65,
    location: "Shivpur Primary Health Complex",
    district: "Varanasi",
    constituency: "Varanasi",
    constituency_code: "UP-VARAN-01",
    mpName: "Narendra Modi",
    justification: "Provides low-cost dialysis and clinical testing for suburban and rural weavers and artisans.",
    status: "SANCTIONED",
    dateProposed: "2024-03-05",
    dateSanctioned: "2024-04-12",
    districtNotes: "Building construction completed, medical equipment procurement under tendering."
  },
  {
    id: "REC-UP-VARAN-2024-003",
    title: "Underground Drainage Network and Surface Water Desilting in Sigra Ward",
    category: "Drinking Water",
    estimatedCost: 1.40,
    location: "Sigra & Mahmoorganj Wards",
    district: "Varanasi",
    constituency: "Varanasi",
    constituency_code: "UP-VARAN-01",
    mpName: "Narendra Modi",
    justification: "Addresses severe waterlogging and contamination issues raised in citizen representation #ISSUE-UP-2024-001.",
    status: "UNDER_SCRUTINY",
    dateProposed: "2024-05-18",
    districtNotes: "DPR received from Jal Nigam Varanasi. Technical review in final stage.",
    citizenRequestId: "ISSUE-UP-2024-001"
  },
  {
    id: "REC-UP-VARAN-2024-004",
    title: "Multi-Purpose Youth Sports Complex and Gymnasium at Rohaniya",
    category: "Sports",
    estimatedCost: 0.75,
    location: "Rohaniya Rural Block",
    district: "Varanasi",
    constituency: "Varanasi",
    constituency_code: "UP-VARAN-01",
    mpName: "Narendra Modi",
    justification: "Encourage sports participation and physical training for rural athletes and youth.",
    status: "PROPOSED",
    dateProposed: "2024-06-10",
    districtNotes: "Proposal forwarded to District Youth Welfare Officer for land site clearance."
  },
  {
    id: "REC-UP-VARAN-2024-005",
    title: "Establishment of Skill Development and Handloom Weaving Incubation Hub",
    category: "Education",
    estimatedCost: 0.90,
    sanctionedCost: 0.90,
    location: "Ramnagar Industrial & Artisan Zone",
    district: "Varanasi",
    constituency: "Varanasi",
    constituency_code: "UP-VARAN-01",
    mpName: "Narendra Modi",
    justification: "Modern digital jacquard loom training and e-commerce marketing support for young Banarasi silk weavers.",
    status: "SANCTIONED",
    dateProposed: "2024-02-25",
    dateSanctioned: "2024-03-28",
    districtNotes: "Administrative sanction issued by DM Varanasi. Civil retrofitting in progress."
  },
  {
    id: "REC-UP-VARAN-2024-006",
    title: "Pedestrian Heritage Walkway & Stone Paving along Godowlia-Dashashwamedh Corridor",
    category: "Roads",
    estimatedCost: 0.85,
    location: "Godowlia Chowk to Ghat Approach",
    district: "Varanasi",
    constituency: "Varanasi",
    constituency_code: "UP-VARAN-01",
    mpName: "Narendra Modi",
    justification: "Reduces congestion and provides slip-resistant red sandstone pedestrian pathways for pilgrims.",
    status: "PROPOSED",
    dateProposed: "2024-07-08",
    districtNotes: "Preliminary traffic diversion plan under consultation with Varanasi Traffic Police."
  },

  // New Delhi (DL-NEW-DELHI-01) - Hon'ble Bansuri Swaraj
  {
    id: "REC-DL-ND-2024-001",
    title: "Smart Digital Classrooms and STEM Innovation Labs in NDMC Schools",
    category: "Education",
    estimatedCost: 0.95,
    sanctionedCost: 0.95,
    location: "Gole Market & Lodhi Road NDMC Schools",
    district: "New Delhi",
    constituency: "New Delhi",
    constituency_code: "DL-NEW-DELHI-01",
    mpName: "Bansuri Swaraj",
    justification: "Equip 8 municipal senior secondary schools with interactive smart boards, robotics kits, and high-speed Wi-Fi.",
    status: "SANCTIONED",
    dateProposed: "2024-01-25",
    dateSanctioned: "2024-02-22",
    districtNotes: "Tender awarded by NDMC Education Dept. Lab setup underway."
  },
  {
    id: "REC-DL-ND-2024-002",
    title: "Installation of EV Fast-Charging Hubs and Solar Canopies in Connaught Place Outer Circle",
    category: "Renewable Energy",
    estimatedCost: 1.30,
    sanctionedCost: 1.30,
    location: "Connaught Place Blocks B, F & K",
    district: "New Delhi",
    constituency: "New Delhi",
    constituency_code: "DL-NEW-DELHI-01",
    mpName: "Bansuri Swaraj",
    justification: "Support clean urban mobility and reduce vehicular emissions in high-density central commercial hub.",
    status: "SANCTIONED",
    dateProposed: "2024-02-14",
    dateSanctioned: "2024-03-20",
    districtNotes: "Joint site survey completed with Delhi Discom and NDMC Enforcement."
  },
  {
    id: "REC-DL-ND-2024-003",
    title: "Revitalization of Walking Tracks, Open Gyms, and Rainwater Harvesting in Lodhi Colony Parks",
    category: "Community Assets",
    estimatedCost: 0.80,
    location: "Lodhi Colony & Aliganj Parks",
    district: "New Delhi",
    constituency: "New Delhi",
    constituency_code: "DL-NEW-DELHI-01",
    mpName: "Bansuri Swaraj",
    justification: "Grievance redressal based on citizen issue #ISSUE-DL-2024-001 for public park maintenance and senior citizen wellness.",
    status: "UNDER_SCRUTINY",
    dateProposed: "2024-04-10",
    districtNotes: "Horticulture Department estimates received. Under scrutiny for cost norms.",
    citizenRequestId: "ISSUE-DL-2024-001"
  },
  {
    id: "REC-DL-ND-2024-004",
    title: "Pedestrian Walkway Upgrades and Universal Accessibility Ramps at Sarojini Nagar",
    category: "Roads",
    estimatedCost: 0.60,
    location: "Sarojini Nagar Market & Ring Road Junction",
    district: "New Delhi",
    constituency: "New Delhi",
    constituency_code: "DL-NEW-DELHI-01",
    mpName: "Bansuri Swaraj",
    justification: "Eliminate pedestrian hazards, build tactile pavers and wheelchair ramps for differently-abled visitors.",
    status: "PROPOSED",
    dateProposed: "2024-06-02",
    districtNotes: "Traffic police NOC and municipal clearance requested."
  },
  {
    id: "REC-DL-ND-2024-005",
    title: "Mobile Specialized Cardiology & Diabetes Diagnostic Clinic Units",
    category: "Health",
    estimatedCost: 1.15,
    sanctionedCost: 1.15,
    location: "Barakhamba & Mandi House Clusters",
    district: "New Delhi",
    constituency: "New Delhi",
    constituency_code: "DL-NEW-DELHI-01",
    mpName: "Bansuri Swaraj",
    justification: "Delivers essential preventive cardiology checks and diabetic screening for informal workers and residents.",
    status: "SANCTIONED",
    dateProposed: "2024-03-12",
    dateSanctioned: "2024-04-15",
    districtNotes: "Approved under Central District Health Plan. Operational rollout initiated."
  },
  {
    id: "REC-DL-ND-2024-006",
    title: "Rainwater Harvesting Wells & Decentralized Water Filtration Plants",
    category: "Drinking Water",
    estimatedCost: 0.70,
    location: "Chanakyapuri & RK Puram Sectors",
    district: "New Delhi",
    constituency: "New Delhi",
    constituency_code: "DL-NEW-DELHI-01",
    mpName: "Bansuri Swaraj",
    justification: "Recharges receding groundwater aquifers and ensures clean, treated drinking water supply in summer.",
    status: "PROPOSED",
    dateProposed: "2024-06-25",
    districtNotes: "Central Ground Water Board (CGWB) technical review underway."
  }
];
