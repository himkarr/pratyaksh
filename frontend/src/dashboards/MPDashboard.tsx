import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  Landmark,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart2,
  UserCheck,
  ShieldAlert,
  Filter,
  Eye,
  Image as ImageIcon,
  Wallet,
  TrendingUp,
  CreditCard,
  Layers,
  ArrowRight,
  Database,
  LayoutGrid,
  List,
  X,
  Camera,
  MapPin,
  Maximize2
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend, 
  CartesianGrid 
} from "recharts";
import { Header } from "../components/Header";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WorkDetailModal } from "../components/WorkDetailModal";
import { AttachmentsModal } from "../components/AttachmentsModal";
import { ReviewRatingModal } from "../components/ReviewRatingModal";
import { PolicyModal } from "../components/PolicyModal";
import { LoginModal } from "../components/LoginModal";
import { Button, Alert, Card, CardHeader, CardBody } from "../components/ui";
import { CreateRecommendationModal } from "../components/mp/CreateRecommendationModal";
import { TableColumnHeader } from "../components/common/TableColumnHeader";

import { MPRecommendation, INITIAL_MP_RECOMMENDATIONS, syncMPRecommendationsFromSupabase, saveMPRecommendation, getMPRecommendations } from "../data/mpData";
import { ALL_WORKS, WorkItem, WorkReview } from "../data/mpladsData";
import { INITIAL_CITIZEN_ISSUES, CitizenIssue, syncCitizenSubmissionsFromSupabase, getCitizenSubmissions, updateCitizenSubmissionStatus } from "../data/citizenData";
import { districtContractorSync } from "../api/districtContractorSync";
import { usePreferences } from "../context/PreferencesContext";
import { useRole, Role } from "../auth/roleContext";
import { adminDataService, MPSummary } from "../api/adminDataService";

const THREE_OFFICIAL_MPS: MPSummary[] = [
  { mpId: "Rohtak", name: "Shri Deepender Singh Hooda", constituency: "Rohtak", state: "Haryana", house: "Lok Sabha", totalRecommended: 4.80, totalSanctioned: 4.20, totalUtilized: 3.48, utilizationPercentage: 70, worksRecommendedCount: 5, worksCompletedCount: 2, rank: 1 },
  { mpId: "Varanasi", name: "Shri Narendra Modi", constituency: "Varanasi", state: "Uttar Pradesh", house: "Lok Sabha", totalRecommended: 5.00, totalSanctioned: 4.80, totalUtilized: 4.25, utilizationPercentage: 85, worksRecommendedCount: 8, worksCompletedCount: 3, rank: 2 },
  { mpId: "Pune", name: "Shri Murlidhar Mohol", constituency: "Pune", state: "Maharashtra", house: "Lok Sabha", totalRecommended: 4.50, totalSanctioned: 3.90, totalUtilized: 3.12, utilizationPercentage: 62, worksRecommendedCount: 6, worksCompletedCount: 2, rank: 3 }
];

export const MPDashboard: React.FC = () => {
  const { user } = useRole();
  const { fontScale, setFontScale, theme, setTheme, lang, setLang, t, tr } = usePreferences();

  // Active Section Navigation
  const [activeTab, setActiveTab] = useState<"constituency_works" | "my_recommendations" | "fund_details" | "citizen_reports" | "risk_alerts">("constituency_works");
  const [worksViewMode, setWorksViewMode] = useState<"grid" | "table">("table");

  // Data States
  const [recommendations, setRecommendations] = useState<MPRecommendation[]>(() => getMPRecommendations());
  const [citizenIssues, setCitizenIssues] = useState<CitizenIssue[]>(() => getCitizenSubmissions());
  
  // Tab 1: Constituency Works Sorting & Filtering States
  const [worksSearchQuery, setWorksSearchQuery] = useState<string>("");
  const [worksCategoryFilter, setWorksCategoryFilter] = useState<string>("all");
  const [worksStatusFilter, setWorksStatusFilter] = useState<string>("all");
  const [worksSortBy, setWorksSortBy] = useState<string>("sanctionedAmt");
  const [worksSortOrder, setWorksSortOrder] = useState<"asc" | "desc">("desc");

  // Tab 2: MP Recommendations Sorting & Filtering States
  const [recSearchQuery, setRecSearchQuery] = useState<string>("");
  const [recCategoryFilter, setRecCategoryFilter] = useState<string>("all");
  const [recStatusFilter, setRecStatusFilter] = useState<string>("all");
  const [recSortBy, setRecSortBy] = useState<string>("dateProposed");
  const [recSortOrder, setRecSortOrder] = useState<"asc" | "desc">("desc");

  // Tab 3: Fund Details / Ledger Sorting & Filtering States
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState<string>("");
  const [ledgerUcFilter, setLedgerUcFilter] = useState<string>("all");
  const [ledgerSortBy, setLedgerSortBy] = useState<string>("voucherNo");
  const [ledgerSortOrder, setLedgerSortOrder] = useState<"asc" | "desc">("asc");

  // Modal Controls
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [prefilledCitizenId, setPrefilledCitizenId] = useState<string>("");
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<WorkItem | null>(null);
  const [selectedWorkForAttachments, setSelectedWorkForAttachments] = useState<WorkItem | null>(null);
  const [selectedWorkForReviews, setSelectedWorkForReviews] = useState<WorkItem | null>(null);
  const [localReviews, setLocalReviews] = useState<Record<string, WorkReview[]>>({});
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState<Role | undefined>(undefined);

  // Live Supabase Data State
  const [liveMps, setLiveMps] = useState<MPSummary[]>([]);
  const [liveProjects, setLiveProjects] = useState<any[]>([]);
  const [selectedMPId, setSelectedMPId] = useState<string>(() => user.constituency || "Rohtak");

  // Synchronize active MP ID whenever the authenticated user switches
  useEffect(() => {
    if (user.constituency) {
      setSelectedMPId(user.constituency);
    }
  }, [user.constituency, user.id, user.name]);

  // Dynamic Multi-Source Evidence Cache (Contractor, Citizen, District Inspections)
  const [workEvidenceMap, setWorkEvidenceMap] = useState<Record<string, {
    totalPhotos: number;
    contractorCount: number;
    citizenCount: number;
    samplePhoto?: string;
    hasGeoTag: boolean;
  }>>({});
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{ url: string; title: string; metadata?: string } | null>(null);

  useEffect(() => {
    async function loadLiveData() {
      try {
        const [mpsList, projs, recs, issuesList] = await Promise.all([
          adminDataService.getMPSummaries(),
          adminDataService.getRawProjects(),
          syncMPRecommendationsFromSupabase(),
          syncCitizenSubmissionsFromSupabase()
        ]);
        if (mpsList && mpsList.length > 0) {
          setLiveMps(mpsList);
        }
        if (projs && projs.length > 0) {
          setLiveProjects(projs);
        }
        if (recs && recs.length > 0) {
          setRecommendations(recs);
        }
        if (issuesList && issuesList.length > 0) {
          setCitizenIssues(issuesList);
        }
      } catch (err) {
        console.warn("Could not load live MP data from Supabase:", err);
      }
    }
    loadLiveData();
  }, []);

  // Filter available MPs: prioritize the 3 official MPs, then live database
  const availableStateMps = useMemo(() => {
    return THREE_OFFICIAL_MPS;
  }, []);

  // Active Selected MP identity
  const activeSelectedMP = useMemo(() => {
    const target = (selectedMPId || user.constituency || "Rohtak").toLowerCase();
    const foundIn3 = THREE_OFFICIAL_MPS.find(
      (m) => m.mpId.toLowerCase() === target || m.constituency.toLowerCase() === target || (user.name && m.name.toLowerCase() === user.name.toLowerCase())
    );
    if (foundIn3) return foundIn3;

    const foundInLive = liveMps.find(
      (m) => m.mpId.toLowerCase() === target || m.constituency.toLowerCase() === target || (user.name && m.name.toLowerCase() === user.name.toLowerCase())
    );
    if (foundInLive) return foundInLive;

    return THREE_OFFICIAL_MPS[0];
  }, [liveMps, selectedMPId, user.constituency, user.name]);

  const mpState = activeSelectedMP?.state || user.state || "Haryana";
  const constituency = activeSelectedMP?.constituency || user.constituency || "Rohtak";
  const mpName = user.name && user.name !== "Member of Parliament"
    ? user.name
    : (activeSelectedMP?.name || "Shri Deepender Singh Hooda");
  const mpHouse = activeSelectedMP?.house || "Lok Sabha";
  const constituencyCode = user.constituency_code || (
    constituency.toLowerCase() === "varanasi" ? "UP-VAR-01" :
    constituency.toLowerCase() === "pune" ? "MH-PUN-01" :
    `HR-${constituency.slice(0, 3).toUpperCase()}-01`
  );
  const district = (activeSelectedMP as any)?.district || user.district || constituency;

  // Filtered Constituency Projects (Scoped strictly to MP's state & constituency)
  const constituencyWorks: WorkItem[] = useMemo(() => {
    const sLower = mpState.toLowerCase();
    const cLower = constituency.toLowerCase();
    const dLower = district.toLowerCase();

    if (liveProjects.length > 0) {
      const filtered = liveProjects.filter((p) => {
        const pState = (p.state || "").toLowerCase();
        const pDist = (p.district || "").toLowerCase();
        const stateMatches = !pState || pState === sLower || pState.includes(sLower) || sLower.includes(pState);
        if (!stateMatches) return false;
        return pDist.includes(cLower) || cLower.includes(pDist) || pDist.includes(dLower) || dLower.includes(pDist);
      });

      if (filtered.length > 0) {
        return filtered.slice(0, 60).map((p, idx) => ({
          id: p.project_id || p.id || `LIVE-MP-${idx}`,
          title: p.project_name || p.title || "MPLADS Infrastructure Work",
          house: mpHouse,
          state: p.state || mpState,
          district: p.district || district,
          constituency: constituency,
          constituency_code: constituencyCode,
          mpName: mpName,
          category: p.category || "Community Asset",
          sectorName: p.category || "Community Infrastructure",
          recommendedAmt: Number(p.sanctioned_amount || 1000000) / 10000000,
          sanctionedAmt: Number(p.sanctioned_amount || 1000000) / 10000000,
          expenditureAmt: Number(p.utilized_amount || 400000) / 10000000,
          physicalProgress: p.progress_percentage || (p.status === "Completed" ? 100 : 45),
          financialProgress: Math.round(
            ((Number(p.utilized_amount || 0)) / Math.max(1, Number(p.sanctioned_amount || 1))) * 100
          ) || 40,
          dateSanctioned: p.start_date || "2024-04-01",
          targetCompletion: p.expected_completion_date || "2025-06-30",
          status: (p.status || "Sanctioned") as any,
          agency: "Public Works Department",
          contractor: "Authorized Implementing Agency",
          rating: 4.8,
          reviewsCount: 1,
          attachments: [],
          reviews: []
        }));
      }
    }

    // Match from ALL_WORKS scoped strictly to mpState and constituency/district
    const matched = ALL_WORKS.filter((w) => {
      const wState = (w.state || "").toLowerCase();
      if (wState && wState !== sLower && !wState.includes(sLower) && !sLower.includes(wState)) {
        return false;
      }
      if (w.constituency_code && constituencyCode && w.constituency_code.toLowerCase() === constituencyCode.toLowerCase()) return true;
      if (w.constituency && (w.constituency.toLowerCase().includes(cLower) || cLower.includes(w.constituency.toLowerCase()))) return true;
      if (w.district && (w.district.toLowerCase().includes(dLower) || dLower.includes(w.district.toLowerCase()))) return true;
      return false;
    });

    if (matched.length > 0) return matched;

    // Scoped fallback only to state-level works
    const stateMatched = ALL_WORKS.filter((w) => (w.state || "").toLowerCase() === sLower);
    return stateMatched.length > 0 ? stateMatched : ALL_WORKS.filter(w => (w.state || "").toLowerCase() === "haryana");
  }, [liveProjects, constituencyCode, constituency, district, mpHouse, mpName, mpState]);

  // Dynamically load evidence statistics for all displayed constituency works
  useEffect(() => {
    let isMounted = true;

    async function loadAllEvidence() {
      const map: Record<string, {
        totalPhotos: number;
        contractorCount: number;
        citizenCount: number;
        samplePhoto?: string;
        hasGeoTag: boolean;
      }> = {};

      const allCitizens = getCitizenSubmissions();

      await Promise.all(
        constituencyWorks.map(async (work) => {
          let contractorPhotos: any[] = [];
          try {
            const subs = await districtContractorSync.getStageSubmissionsForWork(work.id);
            subs.forEach((s: any) => {
              if (s.files && Array.isArray(s.files)) {
                s.files.forEach((f: any) => {
                  if (f.url && (f.type?.includes("image") || f.url.startsWith("http") || f.url.startsWith("data:") || f.name?.match(/\.(jpg|jpeg|png|webp)/i))) {
                    contractorPhotos.push(f);
                  }
                });
              }
            });
          } catch (e) {
            // Ignore error
          }

          const citizenPhotos: any[] = [];
          allCitizens
            .filter((c) => c.linkedWorkId === work.id || c.mpRecommendationId === work.id)
            .forEach((c) => {
              if (c.photos && Array.isArray(c.photos)) {
                c.photos.forEach((p) => {
                  if (p.url) citizenPhotos.push(p);
                });
              }
            });

          const defaultAttachments = (work.attachments || []).filter(
            (a) => a.type === "image" || (a.type as any) === "photo" || a.url?.startsWith("http") || a.url?.startsWith("data:")
          );

          const totalPhotos = contractorPhotos.length + citizenPhotos.length + defaultAttachments.length;
          const samplePhoto = contractorPhotos[0]?.url || citizenPhotos[0]?.url || defaultAttachments[0]?.url || undefined;
          const hasGeoTag = contractorPhotos.some((f) => f.lat && f.lng) || citizenPhotos.some((p) => p.lat && p.lng);

          map[work.id] = {
            totalPhotos,
            contractorCount: contractorPhotos.length,
            citizenCount: citizenPhotos.length,
            samplePhoto,
            hasGeoTag,
          };
        })
      );

      if (isMounted) {
        setWorkEvidenceMap(map);
      }
    }

    loadAllEvidence();

    return () => {
      isMounted = false;
    };
  }, [constituencyWorks, citizenIssues]);

  // Filtered recommendations strictly for this MP and state
  const displayedRecommendations = useMemo(() => {
    const sLower = mpState.toLowerCase();
    const cLower = constituency.toLowerCase();
    const dLower = district.toLowerCase();

    const filtered = recommendations.filter((rec) => {
      const rState = (rec.state || "").toLowerCase();
      if (rState && rState !== sLower && !rState.includes(sLower) && !sLower.includes(rState)) {
        return false;
      }
      if (rec.constituency_code && constituencyCode && rec.constituency_code.toLowerCase() === constituencyCode.toLowerCase()) return true;
      if (rec.constituency && (rec.constituency.toLowerCase().includes(cLower) || cLower.includes(rec.constituency.toLowerCase()))) return true;
      if (rec.district && (rec.district.toLowerCase().includes(dLower) || dLower.includes(rec.district.toLowerCase()))) return true;
      return !rState || rState === sLower;
    });

    if (filtered.length > 0) return filtered;
    return INITIAL_MP_RECOMMENDATIONS.filter(r => (r.state || "").toLowerCase() === sLower || (r.district || "").toLowerCase() === dLower);
  }, [recommendations, constituencyCode, constituency, district, mpState]);

  // Filter citizen issues for the selected constituency from live list
  const filteredCitizenIssues = useMemo(() => {
    const sLower = mpState.toLowerCase();
    const cLower = constituency.toLowerCase();
    const dLower = district.toLowerCase();

    return citizenIssues.filter((issue) => {
      const iState = (issue.state || "").toLowerCase();
      if (iState && iState !== sLower && !iState.includes(sLower) && !sLower.includes(iState)) {
        return false;
      }
      if (issue.constituency && (issue.constituency.toLowerCase().includes(cLower) || cLower.includes(issue.constituency.toLowerCase()))) return true;
      if (issue.district && (issue.district.toLowerCase().includes(dLower) || dLower.includes(issue.district.toLowerCase()))) return true;
      return iState === sLower;
    });
  }, [citizenIssues, constituency, district, mpState]);

  // High Risk Projects
  const highRiskWorks = useMemo(() => {
    return constituencyWorks.filter((w) => w.status === "Delayed" || (w.financialProgress || 0) > (w.physicalProgress || 0) + 20);
  }, [constituencyWorks]);

  // Handlers
  const handleRecommendationSubmitted = async (newRec: MPRecommendation) => {
    const updated = await saveMPRecommendation(newRec);
    setRecommendations(updated);

    if (newRec.citizenRequestId) {
      const updatedIssues = updateCitizenSubmissionStatus(
        newRec.citizenRequestId,
        "RECOMMENDED_BY_MP",
        newRec.id,
        `Hon'ble MP ${mpName} has formally submitted recommendation proposal under MPLADS.`
      );
      setCitizenIssues(updatedIssues);
    }
  };

  const handleAdoptCitizenIssue = (issueId: string) => {
    setPrefilledCitizenId(issueId);
    setIsRecommendModalOpen(true);
  };

  // Convert an MP Recommendation into a WorkItem for the detail dossier modal
  const recommendationToWorkItem = (rec: MPRecommendation): WorkItem => {
    const isSanctioned = rec.status === "SANCTIONED";
    const sanctionedAmt = rec.sanctionedCost || (isSanctioned ? rec.estimatedCost : 0);
    const expenditureAmt = isSanctioned ? Number((sanctionedAmt * 0.4).toFixed(2)) : 0;
    const physicalProgress = isSanctioned ? 35 : 0;
    const financialProgress = isSanctioned ? 40 : 0;

    return {
      id: rec.id,
      title: rec.title,
      house: mpHouse,
      state: rec.state || mpState,
      district: rec.district || district,
      constituency: rec.constituency || constituency,
      constituency_code: rec.constituency_code || constituencyCode,
      mpName: rec.mpName || mpName,
      category: rec.category,
      sectorName: rec.category,
      recommendedAmt: rec.estimatedCost,
      sanctionedAmt,
      expenditureAmt,
      physicalProgress,
      financialProgress,
      dateSanctioned: rec.dateSanctioned || (isSanctioned ? rec.dateProposed : ""),
      targetCompletion: "2025-06-30",
      status: isSanctioned ? "Sanctioned" : "Recommended",
      agency: rec.districtNotes ? "District Authority / PWD" : "Awaiting Agency Allocation",
      contractor: isSanctioned ? "Authorized Project Executing Agency" : "Tender Pending",
      rating: 4.8,
      reviewsCount: rec.citizenRequestId ? 1 : 0,
      attachments: [],
      reviews: rec.citizenRequestId ? [
        {
          id: `rev-${rec.id}`,
          author: "Citizen Stakeholder Panel",
          rating: 5,
          date: rec.dateProposed,
          comment: `Public development work initiated from Citizen Grievance #${rec.citizenRequestId}. Public necessity: ${rec.justification}`,
          verified: true
        }
      ] : [],
      justification: rec.justification,
      districtNotes: rec.districtNotes,
      citizenRequestId: rec.citizenRequestId
    };
  };

  // Aggregated Constituency Financial Metrics
  const metrics = useMemo(() => {
    const totalEntitlement = 5.00; // ₹5.00 Cr annual allocation
    const tenureEntitlement = 25.00; // ₹25.00 Cr 5-year tenure cap
    const totalRecommendedAmt = displayedRecommendations.reduce((acc, r) => acc + (r.estimatedCost || 0), 0);
    const sanctionedRecs = displayedRecommendations.filter((r) => r.status === "SANCTIONED");
    const totalSanctionedAmt = sanctionedRecs.reduce((acc, r) => acc + (r.sanctionedCost || r.estimatedCost || 0), 0);
    const recommendedCount = displayedRecommendations.length;
    const sanctionedCount = sanctionedRecs.length;
    const ongoingCount = constituencyWorks.filter((w) => w.status === "Ongoing").length;
    const completedCount = constituencyWorks.filter((w) => w.status === "Completed").length;
    const totalExpenditure = Number(constituencyWorks.reduce((acc, w) => acc + (w.expenditureAmt || 0), 0).toFixed(2));
    const totalDisbursed = Number(constituencyWorks.reduce((acc, w) => {
      const base = (w.sanctionedAmt || 0.8) * 0.5;
      const prog = (w.physicalProgress || 0) >= 50 || w.status === "Completed" ? (w.sanctionedAmt || 0.8) * 0.5 : 0;
      return acc + base + prog;
    }, 0).toFixed(2));
    const unspentInSNA = Number(Math.max(0, totalDisbursed - totalExpenditure).toFixed(2));
    const uncommittedBalance = Number(Math.max(0, totalEntitlement - totalSanctionedAmt).toFixed(2));
    const utilizationRate = Math.min(100, Math.round((totalSanctionedAmt / totalEntitlement) * 100));

    return {
      totalEntitlement,
      tenureEntitlement,
      totalRecommendedAmt,
      totalSanctionedAmt,
      recommendedCount,
      sanctionedCount,
      ongoingCount,
      completedCount,
      totalExpenditure,
      totalDisbursed,
      unspentInSNA,
      uncommittedBalance,
      utilizationRate
    };
  }, [displayedRecommendations, constituencyWorks]);

  // Sector-wise financial distribution
  const sectorFundDistribution = useMemo(() => {
    const sectors = [
      "Health",
      "Renewable Energy",
      "Drinking Water",
      "Education",
      "Roads",
      "Community Assets",
      "Sports"
    ];
    return sectors.map((sec) => {
      const recsInSec = displayedRecommendations.filter((r) => r.category === sec);
      const worksInSec = constituencyWorks.filter((w) => w.category === sec || w.sectorName === sec);
      const recAmt = recsInSec.reduce((acc, r) => acc + (r.estimatedCost || 0), 0);
      const sancAmt = recsInSec.filter(r => r.status === "SANCTIONED").reduce((acc, r) => acc + (r.sanctionedCost || r.estimatedCost || 0), 0) +
        worksInSec.reduce((acc, w) => acc + (w.sanctionedAmt || 0), 0);
      const expAmt = worksInSec.reduce((acc, w) => acc + (w.expenditureAmt || 0), 0);
      const worksCount = recsInSec.length + worksInSec.length;
      return {
        sector: sec,
        worksCount,
        recAmt: Number(recAmt.toFixed(2)),
        sancAmt: Number(sancAmt.toFixed(2)),
        expAmt: Number(expAmt.toFixed(2)),
        pctOfTotal: metrics.totalSanctionedAmt > 0 ? Math.round((sancAmt / metrics.totalSanctionedAmt) * 100) : 0
      };
    }).filter(s => s.worksCount > 0 || s.recAmt > 0);
  }, [displayedRecommendations, constituencyWorks, metrics.totalSanctionedAmt]);

  // Disbursal & Installment Ledger line items
  const disbursalLedger = useMemo(() => {
    return constituencyWorks.map((work, idx) => {
      const tr1Amt = Number(((work.sanctionedAmt || 0.8) * 0.5).toFixed(2));
      const tr2Amt = work.status === "Completed" || (work.physicalProgress || 0) >= 50
        ? Number(((work.sanctionedAmt || 0.8) * 0.5).toFixed(2))
        : 0;
      const ucStatus = work.status === "Completed"
        ? "Audited & Verified (SNA)"
        : (work.physicalProgress || 0) >= 60
          ? "Submitted Under Review"
          : "Pending 80% Milestone";

      return {
        voucherNo: `AS/SNA/${constituencyCode}/${2024}-${(idx + 1).toString().padStart(3, "0")}`,
        workId: work.id,
        workTitle: work.title,
        agency: work.agency || "Public Works Department",
        sanctionDate: work.dateSanctioned || "2024-03-15",
        sanctionedAmt: work.sanctionedAmt,
        tranche1Amt: tr1Amt,
        tranche2Amt: tr2Amt,
        totalDisbursed: Number((tr1Amt + tr2Amt).toFixed(2)),
        expenditure: work.expenditureAmt,
        ucStatus,
        pfmsRef: `PFMS-E-ADV-${constituencyCode.slice(0, 4)}-${98234 + idx * 17}`,
        status: work.status,
        originalWork: work
      };
    });
  }, [constituencyWorks, constituencyCode]);

  // 1. Tab 1: Constituency Works Sort & Filter Logic
  const handleWorksSort = (field: string) => {
    if (worksSortBy === field) {
      setWorksSortOrder(worksSortOrder === "asc" ? "desc" : "asc");
    } else {
      setWorksSortBy(field);
      setWorksSortOrder(field === "title" || field === "category" ? "asc" : "desc");
    }
  };

  const constituencyCategories = useMemo(() => {
    const set = new Set<string>();
    constituencyWorks.forEach((w) => {
      if (w.category) set.add(w.category);
    });
    return Array.from(set).sort();
  }, [constituencyWorks]);

  const sortedAndFilteredWorks = useMemo(() => {
    let list = constituencyWorks.filter((w) => {
      if (worksCategoryFilter !== "all" && (w.category || "").toLowerCase() !== worksCategoryFilter.toLowerCase()) {
        return false;
      }
      if (worksStatusFilter !== "all" && (w.status || "").toLowerCase() !== worksStatusFilter.toLowerCase()) {
        return false;
      }
      if (worksSearchQuery.trim()) {
        const q = worksSearchQuery.toLowerCase();
        const matchTitle = (w.title || "").toLowerCase().includes(q);
        const matchDist = (w.district || "").toLowerCase().includes(q);
        const matchCat = (w.category || "").toLowerCase().includes(q);
        const matchAgency = (w.agency || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDist && !matchCat && !matchAgency) return false;
      }
      return true;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      switch (worksSortBy) {
        case "title":
          return worksSortOrder === "asc" ? (a.title || "").localeCompare(b.title || "") : (b.title || "").localeCompare(a.title || "");
        case "category":
          return worksSortOrder === "asc" ? (a.category || "").localeCompare(b.category || "") : (b.category || "").localeCompare(a.category || "");
        case "sanctionedAmt":
          valA = a.sanctionedAmt || 0;
          valB = b.sanctionedAmt || 0;
          break;
        case "expenditureAmt":
          valA = a.expenditureAmt || 0;
          valB = b.expenditureAmt || 0;
          break;
        case "physicalProgress":
          valA = a.physicalProgress || 0;
          valB = b.physicalProgress || 0;
          break;
        case "financialProgress":
          valA = a.financialProgress || 0;
          valB = b.financialProgress || 0;
          break;
        case "status":
          return worksSortOrder === "asc" ? (a.status || "").localeCompare(b.status || "") : (b.status || "").localeCompare(a.status || "");
        default:
          valA = a.sanctionedAmt || 0;
          valB = b.sanctionedAmt || 0;
          break;
      }
      return worksSortOrder === "asc" ? valA - valB : valB - valA;
    });
    return sorted;
  }, [constituencyWorks, worksCategoryFilter, worksStatusFilter, worksSearchQuery, worksSortBy, worksSortOrder]);

  // 2. Tab 2: Recommendations Sort & Filter Logic
  const handleRecSort = (field: string) => {
    if (recSortBy === field) {
      setRecSortOrder(recSortOrder === "asc" ? "desc" : "asc");
    } else {
      setRecSortBy(field);
      setRecSortOrder(field === "title" || field === "category" || field === "location" ? "asc" : "desc");
    }
  };

  const recommendationCategories = useMemo(() => {
    const set = new Set<string>();
    displayedRecommendations.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort();
  }, [displayedRecommendations]);

  const sortedAndFilteredRecommendations = useMemo(() => {
    let list = displayedRecommendations.filter((r) => {
      if (recCategoryFilter !== "all" && (r.category || "").toLowerCase() !== recCategoryFilter.toLowerCase()) return false;
      if (recStatusFilter !== "all" && (r.status || "").toLowerCase() !== recStatusFilter.toLowerCase()) return false;
      if (recSearchQuery.trim()) {
        const query = recSearchQuery.toLowerCase();
        const matchTitle = (r.title || "").toLowerCase().includes(query);
        const matchLoc = (r.location || "").toLowerCase().includes(query);
        const matchCat = (r.category || "").toLowerCase().includes(query);
        const matchJust = (r.justification || "").toLowerCase().includes(query);
        if (!matchTitle && !matchLoc && !matchCat && !matchJust) return false;
      }
      return true;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      switch (recSortBy) {
        case "title":
          return recSortOrder === "asc" ? (a.title || "").localeCompare(b.title || "") : (b.title || "").localeCompare(a.title || "");
        case "category":
          return recSortOrder === "asc" ? (a.category || "").localeCompare(b.category || "") : (b.category || "").localeCompare(a.category || "");
        case "estimatedCost":
          valA = a.estimatedCost || 0;
          valB = b.estimatedCost || 0;
          break;
        case "location":
          return recSortOrder === "asc" ? (a.location || "").localeCompare(b.location || "") : (b.location || "").localeCompare(a.location || "");
        case "dateProposed":
          return recSortOrder === "asc" ? (a.dateProposed || "").localeCompare(b.dateProposed || "") : (b.dateProposed || "").localeCompare(a.dateProposed || "");
        case "status":
          return recSortOrder === "asc" ? (a.status || "").localeCompare(b.status || "") : (b.status || "").localeCompare(a.status || "");
        default:
          return 0;
      }
      return recSortOrder === "asc" ? valA - valB : valB - valA;
    });
    return sorted;
  }, [displayedRecommendations, recCategoryFilter, recStatusFilter, recSearchQuery, recSortBy, recSortOrder]);

  // 3. Tab 3: Disbursal Ledger Sort & Filter Logic
  const handleLedgerSort = (field: string) => {
    if (ledgerSortBy === field) {
      setLedgerSortOrder(ledgerSortOrder === "asc" ? "desc" : "asc");
    } else {
      setLedgerSortBy(field);
      setLedgerSortOrder(field === "voucherNo" || field === "workTitle" || field === "ucStatus" ? "asc" : "desc");
    }
  };

  const sortedAndFilteredLedger = useMemo(() => {
    let list = disbursalLedger.filter((row) => {
      if (ledgerUcFilter !== "all" && !(row.ucStatus || "").toLowerCase().includes(ledgerUcFilter.toLowerCase())) {
        return false;
      }
      if (ledgerSearchQuery.trim()) {
        const q = ledgerSearchQuery.toLowerCase();
        const matchVoucher = (row.voucherNo || "").toLowerCase().includes(q);
        const matchTitle = (row.workTitle || "").toLowerCase().includes(q);
        const matchAgency = (row.agency || "").toLowerCase().includes(q);
        const matchPfms = (row.pfmsRef || "").toLowerCase().includes(q);
        if (!matchVoucher && !matchTitle && !matchAgency && !matchPfms) return false;
      }
      return true;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      switch (ledgerSortBy) {
        case "voucherNo":
          return ledgerSortOrder === "asc"
            ? (a.voucherNo || "").localeCompare(b.voucherNo || "")
            : (b.voucherNo || "").localeCompare(a.voucherNo || "");
        case "workTitle":
          return ledgerSortOrder === "asc"
            ? (a.workTitle || "").localeCompare(b.workTitle || "")
            : (b.workTitle || "").localeCompare(a.workTitle || "");
        case "sanctionedAmt":
          valA = a.sanctionedAmt || 0;
          valB = b.sanctionedAmt || 0;
          break;
        case "tranche1Amt":
          valA = a.tranche1Amt || 0;
          valB = b.tranche1Amt || 0;
          break;
        case "tranche2Amt":
          valA = a.tranche2Amt || 0;
          valB = b.tranche2Amt || 0;
          break;
        case "totalDisbursed":
          valA = a.totalDisbursed || 0;
          valB = b.totalDisbursed || 0;
          break;
        case "ucStatus":
          return ledgerSortOrder === "asc" ? a.ucStatus.localeCompare(b.ucStatus) : b.ucStatus.localeCompare(a.ucStatus);
        default:
          return 0;
      }
      return ledgerSortOrder === "asc" ? valA - valB : valB - valA;
    });
    return sorted;
  }, [disbursalLedger, ledgerUcFilter, ledgerSearchQuery, ledgerSortBy, ledgerSortOrder]);

  const filteredRecommendations = sortedAndFilteredRecommendations;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)" }}>
      {/* 1. Header Navigation */}
      <Header
        fontScale={fontScale}
        setFontScale={setFontScale}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        t={t}
      />

      <Navbar
        activeTab={activeTab === "constituency_works" ? "dashboard" : "home"}
        setActiveTab={() => setActiveTab("constituency_works")}
        onOpenPolicy={() => setIsPolicyOpen(true)}
        onOpenLogin={(role) => {
          setTargetLoginRole(role);
          setIsLoginOpen(true);
        }}
        t={t}
        flagCount={highRiskWorks.length}
      />

      <main className="mplads-main" style={{ flex: 1, padding: "2.5rem 0 5rem" }}>
        <div className="mplads-container" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Module Tabs Navigation Bar (Admin Reference Standard) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            borderBottom: "2px solid #e2e8f0",
            paddingBottom: "12px",
            marginBottom: "1.75rem",
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setActiveTab("constituency_works")}
              className={`gov-tab ${activeTab === "constituency_works" ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", fontSize: "0.875rem", fontWeight: 700, borderRadius: "8px" }}
            >
              <FileText size={16} />
              <span>{t.constituencyWorksTab || tr("Constituency Works Grid")}</span>
              <span style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                borderRadius: "9999px",
                background: activeTab === "constituency_works" ? "rgba(255,255,255,0.25)" : "#d1fae5",
                color: activeTab === "constituency_works" ? "#ffffff" : "#065f46",
                fontWeight: 700
              }}>
                {constituencyWorks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("my_recommendations")}
              className={`gov-tab ${activeTab === "my_recommendations" ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", fontSize: "0.875rem", fontWeight: 700, borderRadius: "8px" }}
            >
              <Landmark size={16} />
              <span>{t.recommendationsTab || tr("MP Recommendations")}</span>
              <span style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                borderRadius: "9999px",
                background: activeTab === "my_recommendations" ? "rgba(255,255,255,0.25)" : "#eff6ff",
                color: activeTab === "my_recommendations" ? "#ffffff" : "#1d4ed8",
                fontWeight: 700
              }}>
                {displayedRecommendations.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("fund_details")}
              className={`gov-tab ${activeTab === "fund_details" ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", fontSize: "0.875rem", fontWeight: 700, borderRadius: "8px" }}
            >
              <Wallet size={16} />
              <span>{t.fundLedgerTab || tr("Fund Flow & Ledger")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("citizen_reports")}
              className={`gov-tab ${activeTab === "citizen_reports" ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", fontSize: "0.875rem", fontWeight: 700, borderRadius: "8px" }}
            >
              <UserCheck size={16} />
              <span>{t.citizenReportsTab || tr("Citizen Reports")}</span>
              <span style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                borderRadius: "9999px",
                background: activeTab === "citizen_reports" ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                color: activeTab === "citizen_reports" ? "#ffffff" : "#64748b",
                fontWeight: 700
              }}>
                {filteredCitizenIssues.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("risk_alerts")}
              className={`gov-tab ${activeTab === "risk_alerts" ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", fontSize: "0.875rem", fontWeight: 700, borderRadius: "8px" }}
            >
              <ShieldAlert size={16} />
              <span>{t.riskAlertsTab || tr("High-Risk Alerts")}</span>
              <span style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                borderRadius: "9999px",
                background: activeTab === "risk_alerts" ? "rgba(255,255,255,0.25)" : "#fee2e2",
                color: activeTab === "risk_alerts" ? "#ffffff" : "#b91c1c",
                fontWeight: 700
              }}>
                {highRiskWorks.length}
              </span>
            </button>
          </div>

          {/* Right Status Badge (Admin Standard) */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "9999px",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                fontSize: "0.80rem",
                fontWeight: 700,
                color: "#065f46",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 6px #10b981",
                }}
              />
              <span>{constituencyWorks.length} {lang === 'hi' ? 'परियोजनाएँ निगरानी में' : 'Works Monitored'}</span>
            </div>
          </div>
        </div>

        {/* Header Title Section (Admin Reference Standard) */}
        <div className="dashboard-header" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "18px" }}>
          <div className="dashboard-title-section">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", background: "#e0f2fe", color: "#0369a1" }}>
                {tr(mpHouse)}
              </span>
            </div>
            <h1 style={{ fontSize: "1.95rem", fontWeight: 800, color: "var(--gov-primary, #0a2540)", margin: "0 0 8px 0", fontFamily: "Outfit, sans-serif" }}>
              {mpName} — {constituency} ({mpState})
            </h1>
            <p style={{ fontSize: "0.95rem", color: "#64748b", margin: 0, maxWidth: "800px", lineHeight: 1.5 }}>
              {lang === 'hi' 
                ? `${constituency} (${mpState}) में निर्वाचन क्षेत्र विकास परियोजनाओं की अनुशंसा करें, स्वीकृति ट्रैक करें एवं वास्तविक व्यय की निगरानी करें।`
                : `Recommend constituency development projects, track sanction approvals, and monitor live ground expenditure in ${constituency}.`}
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Button 
              variant="primary" 
              size="md" 
              onClick={() => { setPrefilledCitizenId(""); setIsRecommendModalOpen(true); }} 
              icon={<Plus size={16} />} 
              style={{ background: "#2563eb", borderColor: "#2563eb", fontWeight: 700, padding: "10px 20px" }}
            >
              {t.recommendNewWork || tr("Recommend New Work")}
            </Button>
          </div>
        </div>

        {/* Financial Cap & KPI Summary Grid (Admin Reference Hover-Only Top Accent) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
          
          <div className="metric-card metric-blue" style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: "0.74rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
              {t.fundsAllocated || tr("Annual Budget Cap")}
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#0f172a", fontFamily: "Outfit, sans-serif", marginTop: "6px" }}>
              ₹{metrics.totalEntitlement.toFixed(2)} Cr
            </div>
            <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "6px" }}>
              {tr("Sanctioned")}: <strong>₹{metrics.totalSanctionedAmt.toFixed(2)} Cr</strong> ({metrics.utilizationRate}%)
            </div>
          </div>

          <div className="metric-card metric-emerald" style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: "0.74rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
              {t.worksRecommended || tr("Works Recommended")}
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#059669", fontFamily: "Outfit, sans-serif", marginTop: "6px" }}>
              {metrics.recommendedCount} {lang === 'hi' ? 'कार्य' : 'Works'}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "6px" }}>
              {lang === 'hi' ? 'अनुशंसित राशि' : 'Outlay'}: <strong>₹{metrics.totalRecommendedAmt.toFixed(2)} Cr</strong>
            </div>
          </div>

          <div className="metric-card metric-sky" style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: "0.74rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
              {t.worksOngoing || tr("Sanctioned & Ongoing")}
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#0284c7", fontFamily: "Outfit, sans-serif", marginTop: "6px" }}>
              {metrics.ongoingCount} {lang === 'hi' ? 'सक्रिय' : 'Active'}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "6px" }}>
              {lang === 'hi' ? 'ज़िला स्वीकृत' : 'District Approved'}: <strong>{metrics.sanctionedCount}</strong>
            </div>
          </div>

          <div className="metric-card metric-green" style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: "0.74rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
              {t.worksCompleted || tr("Completed Works")}
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#16a34a", fontFamily: "Outfit, sans-serif", marginTop: "6px" }}>
              {metrics.completedCount} {lang === 'hi' ? 'परियोजनाएँ' : 'Projects'}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "6px" }}>
              {lang === 'hi' ? 'सत्यापित एवं हस्तांतरित' : 'Verified & Handed Over'}
            </div>
          </div>

          <div className="metric-card metric-rose" style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: "0.74rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
              High-Risk / Delayed
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: highRiskWorks.length > 0 ? "#e11d48" : "#16a34a", fontFamily: "Outfit, sans-serif", marginTop: "6px" }}>
              {highRiskWorks.length} Alerts
            </div>
            <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "6px" }}>
              Priority Field Verification
            </div>
          </div>

        </div>

        {/* Tab Views with Smooth Animated Transition */}
        <div key={activeTab} className="view-transition-container">
          {/* TAB 1: CONSTITUENCY WORKS GRID & TABLE */}
          {activeTab === "constituency_works" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              
              {/* General Filter & View Mode Controls Bar */}
              <div className="gov-card" style={{ padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Search size={15} color="var(--text-muted)" />
                    <input
                      type="text"
                      className="gov-input"
                      placeholder={lang === 'hi' ? 'कार्य आईडी, श्रेणी, एजेंसी खोजें...' : 'Search works, category, agency...'}
                      style={{ width: "240px", padding: "7px 12px", fontSize: "0.82rem" }}
                      value={worksSearchQuery}
                      onChange={(e) => setWorksSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="gov-select"
                    style={{ width: "170px", padding: "7px 12px", fontSize: "0.82rem" }}
                    value={worksCategoryFilter}
                    onChange={(e) => setWorksCategoryFilter(e.target.value)}
                  >
                    <option value="all">{lang === 'hi' ? `सभी श्रेणियाँ (${constituencyCategories.length})` : `All Categories (${constituencyCategories.length})`}</option>
                    {constituencyCategories.map((cat) => (
                      <option key={cat} value={cat.toLowerCase()}>
                        {tr(cat)}
                      </option>
                    ))}
                  </select>

                  <select
                    className="gov-select"
                    style={{ width: "150px", padding: "7px 12px", fontSize: "0.82rem" }}
                    value={worksStatusFilter}
                    onChange={(e) => setWorksStatusFilter(e.target.value)}
                  >
                    <option value="all">{lang === 'hi' ? 'सभी स्थितियाँ' : 'All Statuses'}</option>
                    <option value="ongoing">{lang === 'hi' ? 'प्रगतिरत' : 'Ongoing'}</option>
                    <option value="completed">{lang === 'hi' ? 'पूर्ण' : 'Completed'}</option>
                    <option value="delayed">{lang === 'hi' ? 'विलंबित' : 'Delayed'}</option>
                    <option value="sanctioned">{lang === 'hi' ? 'स्वीकृत' : 'Sanctioned'}</option>
                  </select>

                  {(worksSearchQuery || worksCategoryFilter !== "all" || worksStatusFilter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setWorksSearchQuery("");
                        setWorksCategoryFilter("all");
                        setWorksStatusFilter("all");
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        color: "#991b1b",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <span>{t.resetFilters || tr("Reset Filters")}</span>
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {lang === 'hi' 
                      ? <>दर्शाए गए <strong style={{ color: "#0f172a" }}>{sortedAndFilteredWorks.length}</strong> / <strong style={{ color: "#0f172a" }}>{constituencyWorks.length}</strong> कार्य</>
                      : <>Showing <strong style={{ color: "#0f172a" }}>{sortedAndFilteredWorks.length}</strong> of <strong style={{ color: "#0f172a" }}>{constituencyWorks.length}</strong> projects</>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <button
                        type="button"
                        onClick={() => setWorksViewMode("table")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 12px",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: worksViewMode === "table" ? 700 : 500,
                          border: "none",
                          background: worksViewMode === "table" ? "#ffffff" : "transparent",
                          color: worksViewMode === "table" ? "#0f172a" : "#64748b",
                          boxShadow: worksViewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <List size={13} />
                        <span>{t.tableView || tr("Table View")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorksViewMode("grid")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 12px",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: worksViewMode === "grid" ? 700 : 500,
                          border: "none",
                          background: worksViewMode === "grid" ? "#ffffff" : "transparent",
                          color: worksViewMode === "grid" ? "#0f172a" : "#64748b",
                          boxShadow: worksViewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <LayoutGrid size={13} />
                        <span>{t.cardGridView || tr("Card Grid")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div key={worksViewMode} className="view-transition-container">
                {worksViewMode === "grid" ? (
                  sortedAndFilteredWorks.length === 0 ? (
                    <div className="gov-card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
                      <p style={{ margin: "0 0 12px 0", fontSize: "0.95rem" }}>No sanctioned constituency works match your search or filter criteria.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setWorksSearchQuery("");
                          setWorksCategoryFilter("all");
                          setWorksStatusFilter("all");
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          cursor: "pointer",
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: "20px" }}>
                      {sortedAndFilteredWorks.map((work) => {
                        const evInfo = workEvidenceMap[work.id];
                        const totalPhotos = evInfo?.totalPhotos || (work.attachments?.length || 0);

                        return (
                        <div
                          key={work.id}
                          className="card-hover-accent accent-sky cursor-pointer"
                          onClick={() => setSelectedWorkForDetail(work)}
                          style={{
                            padding: "0",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            cursor: "pointer",
                            background: "var(--bg-surface)",
                            borderRadius: "12px",
                            border: "1px solid var(--border-light)",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
                          }}
                        >
                          {/* Evidence Photo Banner if photos exist */}
                          {evInfo?.samplePhoto ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedWorkForAttachments(work);
                              }}
                              style={{
                                position: "relative",
                                height: "130px",
                                width: "100%",
                                background: "#0f172a",
                                overflow: "hidden",
                                cursor: "pointer"
                              }}
                              title="Click to view all linked evidence photos & field inspections"
                            >
                              <img
                                src={evInfo.samplePhoto}
                                alt={work.title}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  opacity: 0.9,
                                  transition: "transform 0.3s ease"
                                }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  top: "10px",
                                  left: "10px",
                                  display: "flex",
                                  gap: "6px",
                                  alignItems: "center"
                                }}
                              >
                                <span
                                  style={{
                                    background: "rgba(15, 23, 42, 0.85)",
                                    color: "#38bdf8",
                                    padding: "3px 8px",
                                    borderRadius: "6px",
                                    fontSize: "0.70rem",
                                    fontWeight: 700,
                                    backdropFilter: "blur(4px)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    border: "1px solid rgba(56, 189, 248, 0.4)"
                                  }}
                                >
                                  <Camera size={11} />
                                  {totalPhotos} Linked Photo{totalPhotos > 1 ? "s" : ""}
                                </span>
                                {evInfo.hasGeoTag && (
                                  <span
                                    style={{
                                      background: "rgba(16, 185, 129, 0.9)",
                                      color: "#ffffff",
                                      padding: "3px 7px",
                                      borderRadius: "6px",
                                      fontSize: "0.68rem",
                                      fontWeight: 700,
                                      backdropFilter: "blur(4px)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "3px"
                                    }}
                                  >
                                    <MapPin size={10} />
                                    GPS Geotagged
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: "8px",
                                  right: "10px",
                                  background: "rgba(0, 0, 0, 0.65)",
                                  color: "#ffffff",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontSize: "0.68rem",
                                  fontWeight: 600
                                }}
                              >
                                {evInfo.contractorCount > 0 && `${evInfo.contractorCount} Contractor `}
                                {evInfo.citizenCount > 0 && `• ${evInfo.citizenCount} Citizen`}
                              </div>
                            </div>
                          ) : null}

                          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                              <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.72rem", fontWeight: 700 }}>
                                {work.category}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {totalPhotos > 0 && !evInfo?.samplePhoto && (
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedWorkForAttachments(work);
                                    }}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                      fontSize: "0.68rem",
                                      fontWeight: 700,
                                      color: "#047857",
                                      background: "#ecfdf5",
                                      border: "1px solid #a7f3d0",
                                      padding: "1px 6px",
                                      borderRadius: "4px"
                                    }}
                                    title="View evidence photos"
                                  >
                                    <Camera size={10} />
                                    {totalPhotos} Photos
                                  </span>
                                )}
                                <span className={`gov-badge ${work.status === "Completed" ? "gov-badge-success" : work.status === "Delayed" ? "gov-badge-danger" : "gov-badge-info"}`}>
                                  {work.status.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            <div>
                              <h4 style={{ fontSize: "0.96rem", fontWeight: 700, color: "var(--text-main)", margin: "0 0 5px 0", lineHeight: 1.4 }}>
                                {work.title}
                              </h4>
                              <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                                {work.district}, {work.state}
                              </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "var(--bg-surface-subtle)", padding: "10px 14px", borderRadius: "8px" }}>
                              <div>
                                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Sanctioned</div>
                                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>₹{work.sanctionedAmt.toFixed(2)} Cr</div>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Expenditure</div>
                                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#16a34a", marginTop: "2px" }}>₹{work.expenditureAmt.toFixed(2)} Cr</div>
                              </div>
                            </div>

                            {/* Progress Bars */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "3px", fontWeight: 600 }}>
                                  <span style={{ color: "var(--text-muted)" }}>Physical Progress</span>
                                  <span style={{ color: "#10b981", fontWeight: 700 }}>{work.physicalProgress}%</span>
                                </div>
                                <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ width: `${work.physicalProgress}%`, height: "100%", background: "#10b981" }} />
                                </div>
                              </div>

                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "3px", fontWeight: 600 }}>
                                  <span style={{ color: "var(--text-muted)" }}>Financial Progress</span>
                                  <span style={{ color: "#3b82f6", fontWeight: 700 }}>{work.financialProgress}%</span>
                                </div>
                                <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ width: `${work.financialProgress}%`, height: "100%", background: "#3b82f6" }} />
                                </div>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border-light)", marginTop: "auto" }} onClick={(e) => e.stopPropagation()}>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                Agency: {work.agency ? (work.agency.length > 18 ? work.agency.slice(0, 18) + "..." : work.agency) : "PWD"}
                              </span>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <Button variant="secondary" size="sm" onClick={() => setSelectedWorkForDetail(work)} icon={<Eye size={12} />}>
                                  Inspect
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => setSelectedWorkForAttachments(work)} icon={<Camera size={12} />}>
                                  Photos ({totalPhotos})
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )
                ) : (
                  <div className="gov-card" style={{ overflowX: "auto", borderRadius: "10px" }}>
                    <table className="gov-table" style={{ width: "100%", fontSize: "0.84rem", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                          <TableColumnHeader
                            title="Project Name & Details"
                            field="title"
                            currentSortField={worksSortBy}
                            currentSortDirection={worksSortOrder}
                            onSort={handleWorksSort}
                          />
                          <TableColumnHeader
                            title="Category"
                            field="category"
                            currentSortField={worksSortBy}
                            currentSortDirection={worksSortOrder}
                            onSort={handleWorksSort}
                            filterOptions={[
                              { label: "All Categories", value: "all" },
                              ...constituencyCategories.map((c) => ({ label: c, value: c.toLowerCase() })),
                            ]}
                            selectedFilter={worksCategoryFilter}
                            onFilterChange={setWorksCategoryFilter}
                          />
                          <TableColumnHeader
                            title="Sanction Cost"
                            field="sanctionedAmt"
                            currentSortField={worksSortBy}
                            currentSortDirection={worksSortOrder}
                            onSort={handleWorksSort}
                          />
                          <TableColumnHeader
                            title="Expenditure"
                            field="expenditureAmt"
                            currentSortField={worksSortBy}
                            currentSortDirection={worksSortOrder}
                            onSort={handleWorksSort}
                          />
                          <TableColumnHeader
                            title="Physical Progress"
                            field="physicalProgress"
                            currentSortField={worksSortBy}
                            currentSortDirection={worksSortOrder}
                            onSort={handleWorksSort}
                            style={{ minWidth: "140px" }}
                          />
                          <TableColumnHeader
                            title="Financial Progress"
                            field="financialProgress"
                            currentSortField={worksSortBy}
                            currentSortDirection={worksSortOrder}
                            onSort={handleWorksSort}
                            style={{ minWidth: "140px" }}
                          />
                          <TableColumnHeader
                            title="Status"
                            field="status"
                            currentSortField={worksSortBy}
                            currentSortDirection={worksSortOrder}
                            onSort={handleWorksSort}
                            filterOptions={[
                              { label: "All Statuses", value: "all" },
                              { label: "Ongoing", value: "ongoing" },
                              { label: "Completed", value: "completed" },
                              { label: "Delayed", value: "delayed" },
                              { label: "Sanctioned", value: "sanctioned" },
                            ]}
                            selectedFilter={worksStatusFilter}
                            onFilterChange={setWorksStatusFilter}
                          />
                          <th style={{ padding: "12px 16px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 700 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAndFilteredWorks.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                <span>No constituency works match your search or filter criteria.</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWorksSearchQuery("");
                                    setWorksCategoryFilter("all");
                                    setWorksStatusFilter("all");
                                  }}
                                  style={{
                                    padding: "6px 14px",
                                    borderRadius: "6px",
                                    background: "#eff6ff",
                                    color: "#2563eb",
                                    border: "1px solid #bfdbfe",
                                    fontWeight: 600,
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  Reset Works Filters
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          sortedAndFilteredWorks.map((work) => {
                            const evInfo = workEvidenceMap[work.id];
                            const totalPhotos = evInfo?.totalPhotos || (work.attachments?.length || 0);

                            return (
                            <tr 
                              key={work.id} 
                              onClick={() => setSelectedWorkForDetail(work)}
                              style={{ borderBottom: "1px solid var(--border-light)", cursor: "pointer", transition: "background 0.15s ease" }}
                              title="Click on project to view full official dossier and details"
                            >
                              <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span>{work.title}</span>
                                  <Eye size={13} color="var(--gov-primary)" style={{ opacity: 0.6 }} />
                                </div>
                                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 400, marginTop: "2px" }}>
                                  {work.district}, {work.state} | Agency: {work.agency}
                                </div>
                                {totalPhotos > 0 && (
                                  <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedWorkForAttachments(work);
                                      }}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "0.68rem",
                                        fontWeight: 700,
                                        color: "#047857",
                                        background: "#ecfdf5",
                                        border: "1px solid #a7f3d0",
                                        padding: "1px 6px",
                                        borderRadius: "4px",
                                        cursor: "pointer"
                                      }}
                                      title="Click to view all linked Contractor & Citizen photos"
                                    >
                                      <Camera size={10} />
                                      {totalPhotos} Photo{totalPhotos > 1 ? "s" : ""} Linked
                                      {evInfo?.hasGeoTag ? " • GPS Geotagged" : ""}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "14px 16px" }}>
                                <span className="gov-badge gov-badge-neutral">{work.category}</span>
                              </td>
                              <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--gov-primary)" }}>₹{work.sanctionedAmt.toFixed(2)} Cr</td>
                              <td style={{ padding: "14px 16px", fontWeight: 700, color: "#16a34a" }}>₹{work.expenditureAmt.toFixed(2)} Cr</td>
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ flex: 1, minWidth: "60px", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                    <div style={{ width: `${work.physicalProgress}%`, height: "100%", background: "#10b981" }} />
                                  </div>
                                  <span style={{ fontWeight: 600, fontSize: "0.78rem" }}>{work.physicalProgress}%</span>
                                </div>
                              </td>
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ flex: 1, minWidth: "60px", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                    <div style={{ width: `${work.financialProgress}%`, height: "100%", background: "#3b82f6" }} />
                                  </div>
                                  <span style={{ fontWeight: 600, fontSize: "0.78rem" }}>{work.financialProgress}%</span>
                                </div>
                              </td>
                              <td style={{ padding: "14px 16px" }}>
                                <span className={`gov-badge ${work.status === "Completed" ? "gov-badge-success" : work.status === "Delayed" ? "gov-badge-danger" : "gov-badge-info"}`}>
                                  {work.status.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: "14px 16px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                  <Button variant="secondary" size="sm" onClick={() => setSelectedWorkForDetail(work)} icon={<Eye size={12} />}>
                                    Inspect
                                  </Button>
                                  <Button variant="secondary" size="sm" onClick={() => setSelectedWorkForAttachments(work)} icon={<Camera size={12} />}>
                                    Photos ({totalPhotos})
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY RECOMMENDATIONS */}
          {activeTab === "my_recommendations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              
              {/* General Filter Bar */}
              <div className="gov-card" style={{ padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Search size={15} color="var(--text-muted)" />
                    <input
                      type="text"
                      className="gov-input"
                      placeholder="Search by title, location, category..."
                      style={{ width: "240px", padding: "7px 12px", fontSize: "0.82rem" }}
                      value={recSearchQuery}
                      onChange={(e) => setRecSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="gov-select"
                    style={{ width: "170px", padding: "7px 12px", fontSize: "0.82rem" }}
                    value={recCategoryFilter}
                    onChange={(e) => setRecCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories ({recommendationCategories.length})</option>
                    {recommendationCategories.map((cat) => (
                      <option key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    className="gov-select"
                    style={{ width: "160px", padding: "7px 12px", fontSize: "0.82rem" }}
                    value={recStatusFilter}
                    onChange={(e) => setRecStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="proposed">Proposed</option>
                    <option value="under_scrutiny">Under Scrutiny</option>
                    <option value="sanctioned">Sanctioned</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  {(recSearchQuery || recCategoryFilter !== "all" || recStatusFilter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setRecSearchQuery("");
                        setRecCategoryFilter("all");
                        setRecStatusFilter("all");
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        color: "#991b1b",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <span>Reset Filters</span>
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Showing <strong style={{ color: "#0f172a" }}>{sortedAndFilteredRecommendations.length}</strong> of <strong style={{ color: "#0f172a" }}>{displayedRecommendations.length}</strong> recommendations
                </div>
              </div>

              {/* Recommendations Table */}
              <div className="gov-card" style={{ overflowX: "auto", borderRadius: "10px" }}>
                <table className="gov-table" style={{ width: "100%", fontSize: "0.84rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                      <TableColumnHeader
                        title="Work Title & Description"
                        field="title"
                        currentSortField={recSortBy}
                        currentSortDirection={recSortOrder}
                        onSort={handleRecSort}
                      />
                      <TableColumnHeader
                        title="Category"
                        field="category"
                        currentSortField={recSortBy}
                        currentSortDirection={recSortOrder}
                        onSort={handleRecSort}
                        filterOptions={[
                          { label: "All Categories", value: "all" },
                          ...recommendationCategories.map((c) => ({ label: c, value: c.toLowerCase() })),
                        ]}
                        selectedFilter={recCategoryFilter}
                        onFilterChange={setRecCategoryFilter}
                      />
                      <TableColumnHeader
                        title="Estimated Outlay"
                        field="estimatedCost"
                        currentSortField={recSortBy}
                        currentSortDirection={recSortOrder}
                        onSort={handleRecSort}
                      />
                      <TableColumnHeader
                        title="Location"
                        field="location"
                        currentSortField={recSortBy}
                        currentSortDirection={recSortOrder}
                        onSort={handleRecSort}
                      />
                      <TableColumnHeader
                        title="Date Proposed"
                        field="dateProposed"
                        currentSortField={recSortBy}
                        currentSortDirection={recSortOrder}
                        onSort={handleRecSort}
                      />
                      <TableColumnHeader
                        title="Status"
                        field="status"
                        currentSortField={recSortBy}
                        currentSortDirection={recSortOrder}
                        onSort={handleRecSort}
                        filterOptions={[
                          { label: "All Statuses", value: "all" },
                          { label: "Proposed", value: "proposed" },
                          { label: "Under Scrutiny", value: "under_scrutiny" },
                          { label: "Sanctioned", value: "sanctioned" },
                          { label: "Rejected", value: "rejected" },
                        ]}
                        selectedFilter={recStatusFilter}
                        onFilterChange={setRecStatusFilter}
                      />
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 700 }}>District Status & Notes</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 700 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredRecommendations.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                            <span>No work recommendations found matching your search or filter criteria.</span>
                            <button
                              type="button"
                              onClick={() => {
                                setRecSearchQuery("");
                                setRecCategoryFilter("all");
                                setRecStatusFilter("all");
                              }}
                              style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                background: "#eff6ff",
                                color: "#2563eb",
                                border: "1px solid #bfdbfe",
                                fontWeight: 600,
                                fontSize: "0.82rem",
                                cursor: "pointer",
                              }}
                            >
                              Reset Recommendation Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedAndFilteredRecommendations.map((rec) => (
                        <tr 
                          key={rec.id} 
                          onClick={() => setSelectedWorkForDetail(recommendationToWorkItem(rec))}
                          style={{ borderBottom: "1px solid var(--border-light)", cursor: "pointer", transition: "background 0.15s ease" }}
                          title="Click to inspect all project details and dossier"
                        >
                          <td style={{ padding: "14px 16px", maxWidth: "320px" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                              <span>{rec.title}</span>
                              <Eye size={13} color="var(--gov-primary)" style={{ opacity: 0.6 }} />
                            </div>
                            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "3px", lineHeight: 1.35 }}>{rec.justification}</div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span className="gov-badge gov-badge-neutral">{rec.category}</span>
                          </td>
                          <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--gov-primary)" }}>
                            ₹{rec.estimatedCost.toFixed(2)} Cr
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "0.80rem" }}>
                            {rec.location}
                          </td>
                          <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                            {rec.dateProposed}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {rec.status === "SANCTIONED" && <span className="gov-badge gov-badge-success">SANCTIONED</span>}
                            {rec.status === "UNDER_SCRUTINY" && <span className="gov-badge gov-badge-warning">UNDER SCRUTINY</span>}
                            {rec.status === "PROPOSED" && <span className="gov-badge gov-badge-info">PROPOSED</span>}
                            {rec.status === "REJECTED" && <span className="gov-badge gov-badge-danger">REJECTED</span>}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "0.78rem", color: "var(--text-body)", maxWidth: "220px", lineHeight: 1.35 }}>
                            {rec.districtNotes || "Under review by District Administration"}
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => setSelectedWorkForDetail(recommendationToWorkItem(rec))} 
                              icon={<Eye size={12} />}
                            >
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* TAB 3: DETAILED FUND RELATED INFORMATION & DISBURSAL LEDGER */}
        {activeTab === "fund_details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Header / Context Banner */}
              <div className="card-hover-accent accent-navy" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#ffffff", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span className="gov-badge gov-badge-info">PRATYAKSH WEB-FUND FLOW</span>
                    <span style={{ fontSize: "0.8rem", fontFamily: "monospace", fontWeight: 700, color: "var(--gov-primary)" }}>
                      SNA-PFMS: {constituencyCode}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--gov-primary)", margin: "0 0 4px 0" }}>
                    Constituency Financial Ledger & Central Fund Flow Analytics
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                    Live financial tracking for <strong>{constituency}</strong> | Hon'ble MP: <strong>{mpName}</strong> | District: <strong>{district}</strong>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <Button variant="secondary" size="sm" onClick={() => window.print()} icon={<FileText size={13} />}>
                    Print Statement
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsPolicyOpen(true)} icon={<Landmark size={13} />}>
                    Pratyaksh Guidelines
                  </Button>
                </div>
              </div>

              {/* Financial Cap & KPI Breakdown Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                <div className="gov-card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Annual Entitlement (FY 24-25)
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
                    ₹{metrics.totalEntitlement.toFixed(2)} Cr
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    5-Yr Term Cap: <strong>₹{metrics.tenureEntitlement.toFixed(2)} Cr</strong>
                  </div>
                </div>

                <div className="gov-card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Total Proposed Outlay
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
                    ₹{metrics.totalRecommendedAmt.toFixed(2)} Cr
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {displayedRecommendations.length} Works Recommended by MP
                  </div>
                </div>

                <div className="gov-card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Administratively Sanctioned
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-info-text)", marginTop: "2px" }}>
                    ₹{metrics.totalSanctionedAmt.toFixed(2)} Cr
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Fund Utilization: <strong>{metrics.utilizationRate}%</strong> of annual cap
                  </div>
                </div>

                <div className="gov-card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Disbursed from SNA
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-info-text)", marginTop: "2px" }}>
                    ₹{metrics.totalDisbursed.toFixed(2)} Cr
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    PFMS Transferred to Executing Agencies
                  </div>
                </div>

                <div className="gov-card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Cumulative Ground Spend
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-success-text)", marginTop: "2px" }}>
                    ₹{metrics.totalExpenditure.toFixed(2)} Cr
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Vouched Ground Progress
                  </div>
                </div>

                <div className="gov-card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Committed SNA Balance
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
                    ₹{metrics.unspentInSNA.toFixed(2)} Cr
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Remaining in Tranche Pipeline
                  </div>
                </div>

                <div className="gov-card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Uncommitted Headroom
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: metrics.uncommittedBalance > 0 ? "var(--gov-primary)" : "var(--status-danger-text)", marginTop: "2px" }}>
                    ₹{metrics.uncommittedBalance.toFixed(2)} Cr
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Available to Sanction in FY 24-25
                  </div>
                </div>

                <div className="gov-card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Accrued Treasury Interest
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-muted)", marginTop: "2px" }}>
                    ₹0.18 Cr
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Remitted to CFI via Bharatkosh
                  </div>
                </div>
              </div>

              {/* Pratyaksh Web-Fund Flow 4-Stage Architecture Diagram */}
              <div className="gov-card" style={{ padding: "16px 20px" }}>
                <h4 style={{ fontSize: "0.96rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                  Pratyaksh Central-to-District Real-Time Web Fund Architecture
                </h4>
                <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                  Under revised guidelines effective 1st April 2023, physical checks are eliminated and funds flow electronically through PFMS Zero-Balance Virtual Accounts.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>

                  <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-main)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>STAGE 1</span>
                      <Landmark size={14} color="var(--gov-primary)" />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-main)" }}>Central Ministry (MoSPI)</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.35" }}>
                      Annual entitlement ₹5.00 Cr sanctioned and credited electronically into the State Nodal Account (SNA).
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-main)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>STAGE 2</span>
                      <Wallet size={14} color="var(--gov-primary)" />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-main)" }}>State Nodal Account (SNA)</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.35" }}>
                      Virtual PFMS sub-ledger maintained without idle parking; interest earned reconciled semi-annually.
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-main)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>STAGE 3</span>
                      <CheckCircle2 size={14} color="#10b981" />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-main)" }}>District Authority / Collector</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.35" }}>
                      Administrative sanction issued; 50% 1st Tranche advance released immediately to implementing agency.
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-main)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>STAGE 4</span>
                      <TrendingUp size={14} color="#10b981" />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-main)" }}>Agency & Vendor Settlement</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.35" }}>
                      2nd Tranche (50%) released upon 80% physical progress + verified Utilization Certificate (UC) upload.
                    </div>
                  </div>

                </div>
              </div>

              {/* Sector-wise Allocation & Ground Spend Breakdown */}
              <div className="gov-card" style={{ padding: "16px 20px" }}>
                <h4 style={{ fontSize: "0.96rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                  Sector-wise Fund Allocation & Expenditure Trajectory
                </h4>
                <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                  Analysis of MP priority areas across essential infrastructure sectors in {constituency}.
                </p>

                {/* Visual Recharts Bar Graph */}
                {sectorFundDistribution.length > 0 && (
                  <div style={{ height: "240px", width: "100%", marginBottom: "20px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sectorFundDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                          dataKey="sector" 
                          tick={{ fontSize: 11, fill: "#64748b" }} 
                          angle={-20} 
                          textAnchor="end" 
                          interval={0}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: "#64748b" }} 
                          tickFormatter={(val) => `₹${val}Cr`} 
                        />
                        <RechartsTooltip 
                          formatter={(val: any) => [`₹${Number(val).toFixed(2)} Cr`, ""]}
                          contentStyle={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.80rem" }}
                        />
                        <RechartsLegend wrapperStyle={{ fontSize: "0.78rem", paddingTop: "6px" }} />
                        <Bar dataKey="sancAmt" name="Sanctioned Outlay" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expAmt" name="Ground Spend" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div style={{ overflowX: "auto" }}>
                  <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                        <th style={{ padding: "10px 12px" }}>Development Sector</th>
                        <th style={{ padding: "10px 12px", textAlign: "center" }}>Works Count</th>
                        <th style={{ padding: "10px 12px" }}>Recommended Outlay</th>
                        <th style={{ padding: "10px 12px" }}>Sanctioned Cost</th>
                        <th style={{ padding: "10px 12px" }}>Ground Expenditure</th>
                        <th style={{ padding: "10px 12px", minWidth: "160px" }}>Budget Utilization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectorFundDistribution.map((item) => {
                        const utilPct = item.sancAmt > 0 ? Math.min(100, Math.round((item.expAmt / item.sancAmt) * 100)) : 0;
                        return (
                          <tr key={item.sector} style={{ borderBottom: "1px solid var(--border-light)" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                              <span className="gov-badge gov-badge-neutral">{item.sector}</span>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>
                              {item.worksCount}
                            </td>
                            <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--gov-primary)" }}>
                              ₹{item.recAmt.toFixed(2)} Cr
                            </td>
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--status-info-text)" }}>
                              ₹{item.sancAmt.toFixed(2)} Cr
                            </td>
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--status-success-text)" }}>
                              ₹{item.expAmt.toFixed(2)} Cr
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ width: `${utilPct}%`, height: "100%", background: utilPct >= 80 ? "#10b981" : "#3b82f6" }} />
                                </div>
                                <span style={{ fontSize: "0.74rem", fontWeight: 700 }}>{utilPct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Disbursal & Installment Ledger */}
              <div className="gov-card" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h4 style={{ fontSize: "0.96rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
                      Constituency Project Disbursal & Installment Ledger
                    </h4>
                    <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                      Showing {sortedAndFilteredLedger.length} of {disbursalLedger.length} active project sanction vouchers in {constituency}
                    </p>
                  </div>
                  <span className="gov-badge gov-badge-info">PFMS Direct Electronic Advice Verified</span>
                </div>

                {/* Ledger General Filters Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Search size={14} color="var(--text-muted)" />
                    <input
                      type="text"
                      className="gov-input"
                      placeholder="Search voucher, title, agency, PFMS..."
                      style={{ width: "260px", padding: "6px 12px", fontSize: "0.80rem" }}
                      value={ledgerSearchQuery}
                      onChange={(e) => setLedgerSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="gov-select"
                    style={{ width: "190px", padding: "6px 12px", fontSize: "0.80rem" }}
                    value={ledgerUcFilter}
                    onChange={(e) => setLedgerUcFilter(e.target.value)}
                  >
                    <option value="all">All UC Compliances</option>
                    <option value="Audited">Audited & Verified (SNA)</option>
                    <option value="Submitted">Submitted Under Review</option>
                    <option value="Pending">Pending Milestone</option>
                  </select>

                  {(ledgerSearchQuery || ledgerUcFilter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setLedgerSearchQuery("");
                        setLedgerUcFilter("all");
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        color: "#991b1b",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <span>Reset</span>
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                        <TableColumnHeader
                          title="Sanction Voucher No."
                          field="voucherNo"
                          currentSortField={ledgerSortBy}
                          currentSortDirection={ledgerSortOrder}
                          onSort={handleLedgerSort}
                        />
                        <TableColumnHeader
                          title="Project Name & Agency"
                          field="workTitle"
                          currentSortField={ledgerSortBy}
                          currentSortDirection={ledgerSortOrder}
                          onSort={handleLedgerSort}
                        />
                        <TableColumnHeader
                          title="Sanctioned Cost"
                          field="sanctionedAmt"
                          currentSortField={ledgerSortBy}
                          currentSortDirection={ledgerSortOrder}
                          onSort={handleLedgerSort}
                        />
                        <TableColumnHeader
                          title="Tranche 1 (50%)"
                          field="tranche1Amt"
                          currentSortField={ledgerSortBy}
                          currentSortDirection={ledgerSortOrder}
                          onSort={handleLedgerSort}
                        />
                        <TableColumnHeader
                          title="Tranche 2 (50%)"
                          field="tranche2Amt"
                          currentSortField={ledgerSortBy}
                          currentSortDirection={ledgerSortOrder}
                          onSort={handleLedgerSort}
                        />
                        <TableColumnHeader
                          title="Total Released"
                          field="totalDisbursed"
                          currentSortField={ledgerSortBy}
                          currentSortDirection={ledgerSortOrder}
                          onSort={handleLedgerSort}
                        />
                        <TableColumnHeader
                          title="UC Compliance"
                          field="ucStatus"
                          currentSortField={ledgerSortBy}
                          currentSortDirection={ledgerSortOrder}
                          onSort={handleLedgerSort}
                          filterOptions={[
                            { label: "All UC Compliances", value: "all" },
                            { label: "Audited & Verified (SNA)", value: "audited" },
                            { label: "Submitted Under Review", value: "submitted" },
                            { label: "Pending 80% Milestone", value: "pending" },
                          ]}
                          selectedFilter={ledgerUcFilter}
                          onFilterChange={setLedgerUcFilter}
                        />
                        <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 700 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAndFilteredLedger.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", padding: "36px 16px", color: "var(--text-muted)" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                              <span>No disbursal vouchers match your search or filter criteria.</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setLedgerSearchQuery("");
                                  setLedgerUcFilter("all");
                                }}
                                style={{
                                  padding: "5px 12px",
                                  borderRadius: "6px",
                                  background: "#eff6ff",
                                  color: "#2563eb",
                                  border: "1px solid #bfdbfe",
                                  fontWeight: 600,
                                  fontSize: "0.80rem",
                                  cursor: "pointer",
                                }}
                              >
                                Reset Ledger Filters
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        sortedAndFilteredLedger.map((row) => (
                          <tr
                            key={row.voucherNo}
                            onClick={() => setSelectedWorkForDetail(row.originalWork)}
                            style={{ borderBottom: "1px solid var(--border-light)", cursor: "pointer" }}
                            title="Click to inspect full project dossier"
                          >
                            <td style={{ padding: "10px 12px" }}>
                              <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.78rem", color: "var(--gov-primary)" }}>
                                {row.voucherNo}
                              </div>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                {row.pfmsRef}
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px", maxWidth: "260px" }}>
                              <div style={{ fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>{row.workTitle}</span>
                                <Eye size={13} color="var(--gov-primary)" style={{ opacity: 0.6 }} />
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                Agency: <strong>{row.agency}</strong> | Sanctioned: {row.sanctionDate}
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                              ₹{row.sanctionedAmt.toFixed(2)} Cr
                            </td>
                            <td style={{ padding: "10px 12px", color: "var(--status-info-text)", fontWeight: 600 }}>
                              ₹{row.tranche1Amt.toFixed(2)} Cr
                            </td>
                            <td style={{ padding: "10px 12px", color: row.tranche2Amt > 0 ? "var(--status-success-text)" : "var(--text-muted)", fontWeight: 600 }}>
                              {row.tranche2Amt > 0 ? `₹${row.tranche2Amt.toFixed(2)} Cr` : "Pending Milestone"}
                            </td>
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--gov-primary)" }}>
                              ₹{row.totalDisbursed.toFixed(2)} Cr
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <span className={`gov-badge ${row.ucStatus.includes("Audited")
                                  ? "gov-badge-success"
                                  : row.ucStatus.includes("Review")
                                    ? "gov-badge-warning"
                                    : "gov-badge-neutral"
                                }`}>
                                {row.ucStatus}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedWorkForDetail(row.originalWork)}
                                icon={<Eye size={12} />}
                              >
                                Inspect
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Statutory Treasury Guidelines Banner */}
              <div className="gov-card" style={{ padding: "16px 20px", background: "var(--bg-surface-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
                    Statutory Pratyaksh Treasury & Audit Rules Reference
                  </h4>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", fontSize: "0.78rem", color: "var(--text-body)", lineHeight: "1.45" }}>
                  <div>
                    <strong>• Non-Lapsable Fund Nature:</strong> MPLADS funds are non-lapsable. Unspent balances from FY 2024-25 carry over automatically to the subsequent financial year within the MP's tenure.
                  </div>
                  <div>
                    <strong>• 1-Year Execution Mandate:</strong> Works must be physically executed and completed within 12 calendar months of administrative sanction date as stipulated under Clause 4.2.
                  </div>
                  <div>
                    <strong>• Zero Balance Accounts (ZBA):</strong> Implementing agencies operate virtual sub-accounts under the State Nodal Account (SNA), ensuring no idle public funds remain unmonitored.
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: CITIZEN REPORTS */}
          {activeTab === "citizen_reports" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="gov-card" style={{ padding: "14px 16px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                  Public Citizen Infrastructure Demands & Grievance Submissions
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                  Review verified citizen requests from {constituency} constituency and adopt them into official MP MPLADS work recommendations.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {filteredCitizenIssues.map((issue) => (
                    <div
                      key={issue.id}
                      style={{
                        padding: "14px 16px",
                        border: "1px solid var(--border-main)",
                        borderRadius: "var(--radius-xs)",
                        background: "var(--bg-surface)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "12px"
                      }}
                    >
                      <div style={{ flex: 1, minWidth: "280px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span className="gov-badge gov-badge-neutral">{issue.category}</span>
                          <span className="gov-badge gov-badge-info">{issue.status}</span>
                        </div>

                        <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                          {issue.title}
                        </h4>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-body)", marginBottom: "6px", lineHeight: "1.4" }}>
                          {issue.description}
                        </p>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          Submitted by: <strong>{issue.submittedBy || "Resident Citizen"}</strong> | Location: <strong>{issue.locationName}</strong> | Submitted: <strong>{issue.dateSubmitted}</strong>
                        </div>

                        {/* Citizen Uploaded Evidence Photos Gallery */}
                        {issue.photos && issue.photos.length > 0 && (
                          <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                              <Camera size={12} color="#059669" />
                              <span>Citizen Ground Photos & Geotagged Proofs ({issue.photos.length}):</span>
                            </div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              {issue.photos.map((photo, pIdx) => (
                                <div
                                  key={photo.id || pIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewPhotoModal({
                                      url: photo.url,
                                      title: photo.caption || issue.title,
                                      metadata: `Uploaded by: ${issue.submittedBy || "Resident Citizen"} | Location: ${issue.locationName} | ${photo.lat && photo.lng ? `GPS: ${photo.lat.toFixed(5)}, ${photo.lng.toFixed(5)}` : "Geotagged"}`
                                    });
                                  }}
                                  style={{
                                    position: "relative",
                                    width: "90px",
                                    height: "64px",
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    border: "1px solid var(--border-light)",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
                                  }}
                                  title="Click to view full citizen photo evidence"
                                >
                                  <img src={photo.url} alt={photo.caption || "Citizen Proof"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: "0.6rem", padding: "1px 4px", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {photo.caption || "Ground Proof"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAdoptCitizenIssue(issue.id)}
                        icon={<Plus size={14} />}
                      >
                        Adopt as MP Recommendation
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RISK ALERTS */}
          {activeTab === "risk_alerts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Alert type="warning" title="Verification Priority Signal Notice">
                Note: Risk signals indicate high priority for field verification, NOT proof of fraud or non-compliance.
              </Alert>

              {highRiskWorks.map((work) => (
                <div
                  key={work.id}
                  className="card-hover-accent accent-rose"
                  onClick={() => setSelectedWorkForDetail(work)}
                  style={{ padding: "14px 16px", cursor: "pointer", background: "#ffffff", borderRadius: "12px", border: "1px solid var(--border-light)" }}
                  title="Click to inspect full AI anomaly dossier"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="gov-badge gov-badge-danger">HIGH RISK (PRIORITY 1)</span>
                        <span className="gov-badge gov-badge-neutral">{work.category}</span>
                      </div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "6px 0 2px 0" }}>{work.title}</h4>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Financial Progress: <strong>{work.financialProgress}%</strong> vs Physical Progress: <strong>{work.physicalProgress}%</strong>
                      </div>
                    </div>

                    <Button variant="secondary" size="sm" onClick={() => setSelectedWorkForDetail(work)} icon={<Eye size={13} />}>
                      Inspect Full AI Anomaly Dossier
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>

      {/* Modals */}
      <CreateRecommendationModal
        isOpen={isRecommendModalOpen}
        onClose={() => setIsRecommendModalOpen(false)}
        onSubmitted={handleRecommendationSubmitted}
        mpName={mpName}
        constituency={constituency}
        constituencyCode={constituencyCode}
        district={district}
        initialCitizenId={prefilledCitizenId}
      />

      <WorkDetailModal
        work={
          selectedWorkForDetail
            ? {
                ...selectedWorkForDetail,
                reviews: [
                  ...(localReviews[selectedWorkForDetail.id] || []),
                  ...(selectedWorkForDetail.reviews || []),
                ],
              }
            : null
        }
        onClose={() => setSelectedWorkForDetail(null)}
        onViewAttachments={(w) => { setSelectedWorkForDetail(null); setSelectedWorkForAttachments(w); }}
        onViewReviews={(w) => { setSelectedWorkForDetail(null); setSelectedWorkForReviews(w); }}
      />

      <AttachmentsModal
        work={selectedWorkForAttachments}
        onClose={() => setSelectedWorkForAttachments(null)}
      />

      <ReviewRatingModal
        work={
          selectedWorkForReviews
            ? {
                ...selectedWorkForReviews,
                reviews: [
                  ...(localReviews[selectedWorkForReviews.id] || []),
                  ...(selectedWorkForReviews.reviews || []),
                ],
              }
            : null
        }
        onClose={() => setSelectedWorkForReviews(null)}
        onAddReview={(workId, newReview) => {
          setLocalReviews((prev) => ({
            ...prev,
            [workId]: [newReview, ...(prev[workId] || [])],
          }));
        }}
      />

      <PolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => {
          setIsLoginOpen(false);
          setTargetLoginRole(undefined);
        }}
        initialRole={targetLoginRole}
      />

      {/* Fullscreen Photo Lightbox Modal */}
      {previewPhotoModal && (
        <div
          onClick={() => setPreviewPhotoModal(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            background: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "920px",
              width: "100%",
              maxHeight: "90vh",
              background: "#1e293b",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              border: "1px solid #334155",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "#0f172a", borderBottom: "1px solid #334155" }}>
              <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.95rem" }}>
                {previewPhotoModal.title}
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex"
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, maxHeight: "calc(90vh - 120px)", overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", padding: "12px" }}>
              <img
                src={previewPhotoModal.url}
                alt={previewPhotoModal.title}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "8px" }}
              />
            </div>
            {previewPhotoModal.metadata && (
              <div style={{ padding: "10px 20px", background: "#0f172a", color: "#94a3b8", fontSize: "0.78rem", borderTop: "1px solid #334155" }}>
                {previewPhotoModal.metadata}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer t={t} onOpenPolicy={() => setIsPolicyOpen(true)} />
    </div>
  );
};

export default MPDashboard;
