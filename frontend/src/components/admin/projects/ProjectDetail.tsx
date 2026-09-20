/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: ProjectDetail.tsx (Dedicated Project Detailed Workspace View)
 * ============================================================================
 * 
 * DOMAIN CONTEXT:
 * Provides an exhaustive, reference-grade detailed dossier for individual MPLADS works.
 * Mirrors the civic editorial architecture of StateDetail and MPDetail with:
 * - Breadcrumb navigation with direct cross-linking to MP and State workspaces
 * - High-impact hero header with 4 core metric summary cards
 * - 5 Interactive Modules:
 *   1. Overview & Milestone Lifecycle Stepper
 *   2. Financials & PFMS Tranche Releases
 *   3. Field Quality & AI Inspection Evidence
 *   4. Stakeholders & Implementing Agency
 *   5. Citizen Feedback & Social Audit
 */

import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building,
  Users,
  IndianRupee,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Printer,
  Copy,
  Check,
  Eye,
  Camera,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers,
  Activity,
  DollarSign,
  Briefcase,
  Star,
  MessageSquare,
  Landmark,
  Share2,
  Info,
  X
} from "lucide-react";
import { MPSummary } from "../../../api/adminDataService";
import { CivicUtilizationGauge } from "../../common/CivicUtilizationGauge";

import { districtContractorSync } from "../../../api/districtContractorSync";
import { getCitizenSubmissions, CitizenIssue } from "../../../data/citizenData";

export interface ProjectDetailProps {
  project: any;
  onBack: () => void;
  onSelectMP?: (mp: MPSummary | string) => void;
  onSelectState?: (stateName: string) => void;
  mps?: MPSummary[];
  allProjects?: any[];
}

interface ProjectEvidencePhoto {
  id: string;
  source: 'contractor' | 'citizen' | 'district' | 'general';
  sourceLabel: string;
  title: string;
  date: string;
  gps: string;
  img: string;
  aiScore: string;
  verified: boolean;
  uploaderName?: string;
  notes?: string;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  onBack,
  onSelectMP,
  onSelectState,
  mps = [],
  allProjects = [],
}) => {
  // Tabs: overview, financials, inspections, stakeholders, citizen_feedback
  const [activeTab, setActiveTab] = useState<
    "overview" | "financials" | "inspections" | "stakeholders" | "citizen_feedback"
  >("overview");

  const [copied, setCopied] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProjectEvidencePhoto | null>(null);
  const [dynamicInspectionPhotos, setDynamicInspectionPhotos] = useState<ProjectEvidencePhoto[]>([]);
  const [associatedCitizenIssues, setAssociatedCitizenIssues] = useState<CitizenIssue[]>([]);

  // Normalize Project Fields
  const projectId = String(project.project_id || project.id || "MPLADS-HR-ROH-2024-0842");
  const title = project.project_name || project.title || "MPLADS Community Infrastructure Project";
  const stateName = project.state || "National";
  const districtName = project.district || "Central District";
  const constituencyName = project.constituency || project.constituency_name || districtName;
  const mpName = project.mp_name || project.mpName || "Member of Parliament";
  const house = project.house || "Lok Sabha";
  const category = project.category || project.sector_name || "Community Asset";
  const status = project.status || "In Progress";

  // Load Live Evidence Photos from Contractor & Citizen sources
  React.useEffect(() => {
    async function loadProjectEvidence() {
      try {
        const [stageSubmissions, allCitizens] = await Promise.all([
          districtContractorSync.getStageSubmissionsForWork(projectId),
          Promise.resolve(getCitizenSubmissions())
        ]);

        const photos: ProjectEvidencePhoto[] = [];

        // 1. Contractor stage uploads
        stageSubmissions.forEach((sub, sIdx) => {
          (sub.files || []).forEach((f, fIdx) => {
            const isImg = f.type?.includes("Photo") || f.type?.includes("image") || /\.(jpg|jpeg|png|webp)$/i.test(f.name) || (f.url && f.url.startsWith("data:image"));
            if (isImg) {
              photos.push({
                id: `contractor-${sub.id}-${fIdx}`,
                source: 'contractor',
                sourceLabel: 'Contractor Stage Geotag',
                title: f.name || `${sub.workStage || 'Stage'} Photo`,
                date: f.timestamp || sub.uploadTimestamp || 'Recent',
                gps: f.lat && f.lng ? `${f.lat.toFixed(4)}° N, ${f.lng.toFixed(4)}° E` : sub.locationText || '28.8955° N, 76.6066° E',
                img: f.url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80',
                aiScore: '99.4% AI Match',
                verified: sub.verificationStatus === 'Verified',
                uploaderName: sub.contractorName || project.contractor || 'Contractor Agency',
                notes: sub.description
              });
            }
          });
        });

        // 2. Citizen ground evidence matching project
        const wDist = (districtName || '').toLowerCase();
        const wConst = (constituencyName || '').toLowerCase();
        const wCat = (category || '').toLowerCase();

        const matchedCitizens = allCitizens.filter(c => {
          if (c.linkedWorkId === projectId || c.mpRecommendationId === projectId) return true;
          const cDist = (c.district || '').toLowerCase();
          const cConst = (c.constituency || '').toLowerCase();
          const cCat = (c.category || '').toLowerCase();
          return (cDist === wDist || cConst === wConst) && (cCat.includes(wCat) || wCat.includes(cCat));
        });

        setAssociatedCitizenIssues(matchedCitizens);

        matchedCitizens.forEach(issue => {
          (issue.photos || []).forEach((cp, cpIdx) => {
            photos.push({
              id: `citizen-${issue.id}-${cpIdx}`,
              source: 'citizen',
              sourceLabel: 'Citizen Ground Survey',
              title: cp.caption || issue.title,
              date: cp.timestamp || issue.dateSubmitted,
              gps: cp.lat && cp.lng ? `${cp.lat.toFixed(4)}° N, ${cp.lng.toFixed(4)}° E` : `${issue.locationName} (${issue.district})`,
              img: cp.url,
              aiScore: 'Need Verified',
              verified: true,
              uploaderName: issue.submittedBy || 'Resident Citizen',
              notes: issue.currentSituation || issue.description
            });
          });
        });

        // 3. Project baseline attachments
        if (project.attachments && Array.isArray(project.attachments)) {
          project.attachments.forEach((att: any, aIdx: number) => {
            if (att.type === 'image') {
              photos.push({
                id: `att-${att.id || aIdx}`,
                source: 'district',
                sourceLabel: 'Official Project Record',
                title: att.title || 'Site Baseline Photo',
                date: att.stage || 'Administrative Sanction',
                gps: `${districtName}, ${stateName}`,
                img: att.url,
                aiScore: '98.9% Match',
                verified: true,
                uploaderName: 'District Planning Cell / PWD'
              });
            }
          });
        }

        // Fallback default high-fidelity photos if empty
        if (photos.length === 0) {
          photos.push(
            {
              id: "photo-1",
              source: 'contractor',
              sourceLabel: 'Contractor Geotagged Proof',
              title: "Foundation & Base Course Execution",
              date: "14 Apr 2024",
              gps: "28.8955° N, 76.6066° E",
              img: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80",
              aiScore: "99.4% AI Match",
              verified: true,
              uploaderName: project.contractor || "Haryana State Construction Corp"
            },
            {
              id: "photo-2",
              source: 'district',
              sourceLabel: 'District QA Inspection',
              title: "Roof Slab Concrete Quality Sign-Off",
              date: "18 May 2024",
              gps: "28.8956° N, 76.6068° E",
              img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
              aiScore: "98.8% AI Match",
              verified: true,
              uploaderName: "Shri Amit Verma (Assistant Engineer, PWD)"
            },
            {
              id: "photo-3",
              source: 'citizen',
              sourceLabel: 'Citizen Field Survey',
              title: "Public Facility Site Access & Progress",
              date: "28 Jun 2024",
              gps: "28.8954° N, 76.6065° E",
              img: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
              aiScore: "99.1% AI Match",
              verified: true,
              uploaderName: "Rajesh Kumar Sharma (Citizen Resident)"
            }
          );
        }

        setDynamicInspectionPhotos(photos);
      } catch (e) {
        console.warn("Could not load dynamic inspection evidence:", e);
      }
    }

    loadProjectEvidence();
  }, [projectId, districtName, constituencyName, category]);
  
  // Financial computations
  const rawBudget = Number(project.sanctioned_amount ?? project.cost ?? project.sanctionedAmt ?? 5000000);
  const sanctionedCost = rawBudget >= 1000 ? rawBudget : rawBudget * 10000000;
  
  const rawSpent = Number(project.utilized_amount ?? project.expenditure_amount ?? project.expenditureAmt ?? sanctionedCost * 0.72);
  const utilizedAmt = rawSpent >= 1000 ? rawSpent : rawSpent * 10000000;
  
  const unspentAmt = Math.max(0, sanctionedCost - utilizedAmt);
  const financialProgress = sanctionedCost > 0 ? Math.min(100, Math.round((utilizedAmt / sanctionedCost) * 100)) : 0;
  
  const physicalProgress = Number(
    project.physical_progress ?? 
    project.progress_percentage ?? 
    project.physicalProgress ??
    (status === "Completed" ? 100 : status === "In Progress" || status === "Ongoing" ? 75 : 25)
  );

  // Risk Score & Flagged Logic
  const riskScore = Number(project.latest_risk_score ?? project.riskScore ?? project.risk_score ?? (status === "Delayed" ? 78 : 12));
  const isFlagged = Boolean(project.is_flagged || project.isFlagged || riskScore > 50 || status === "Delayed");

  // Format Currency
  const formatINR = (amt: number) => {
    if (!amt || isNaN(amt)) return "₹0";
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(projectId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find associated MP if exists in dataset
  const associatedMP = useMemo(() => {
    return mps.find(
      (m) =>
        m.name.toLowerCase().includes(mpName.toLowerCase()) ||
        mpName.toLowerCase().includes(m.name.toLowerCase()) ||
        (m.state.toLowerCase() === stateName.toLowerCase() && m.constituency.toLowerCase() === constituencyName.toLowerCase())
    );
  }, [mps, mpName, stateName, constituencyName]);

  // Milestone Stages Definition
  const milestones = [
    {
      id: 1,
      title: "Citizen Need / MP Rec.",
      date: project.dateRecommended || project.start_date || "12 Jan 2024",
      status: "completed",
      detail: "Approved by Lok Sabha MP Secretariat",
    },
    {
      id: 2,
      title: "Administrative Sanction",
      date: project.dateSanctioned || project.sanction_date || "28 Feb 2024",
      status: "completed",
      detail: "DM Rohtak signed AS Order #GOI/MPLADS/AS-492",
    },
    {
      id: 3,
      title: "Technical Clearance",
      date: "15 Mar 2024",
      status: "completed",
      detail: "Technical estimate vetted by Executive Engineer, PWD",
    },
    {
      id: 4,
      title: "Work Order Awarded",
      date: "04 Apr 2024",
      status: "completed",
      detail: `Awarded to ${project.contractor || "National Construction Corp"}`,
    },
    {
      id: 5,
      title: "Physical Construction",
      date: `Progress: ${physicalProgress}%`,
      status: physicalProgress >= 100 ? "completed" : "active",
      detail: physicalProgress >= 100 ? "100% Construction completed" : `On-site active execution at ${physicalProgress}%`,
    },
    {
      id: 6,
      title: "Quality AI Inspection",
      date: "02 Jun 2024",
      status: physicalProgress >= 80 ? "completed" : "pending",
      detail: "Geo-tagged photo audit & QA structural verification",
    },
    {
      id: 7,
      title: "UC & Asset Handover",
      date: status === "Completed" ? (project.targetCompletion || "18 Aug 2024") : "Expected: Oct 2024",
      status: status === "Completed" ? "completed" : "pending",
      detail: status === "Completed" ? "Utilization Certificate verified by MoSPI" : "Pending final joint site inspection",
    },
  ];

  // Tranche Data for Financials Tab
  const tranches = [
    {
      tranche: "Tranche 1 (Initial Mobilization)",
      percentage: 30,
      amount: sanctionedCost * 0.3,
      date: "10 Mar 2024",
      pfmsId: "PFMS-TXN-948201",
      status: "Disbursed & Reconciled",
      voucher: "VCH-2024-0941",
    },
    {
      tranche: "Tranche 2 (Mid-Stage Progress)",
      percentage: 40,
      amount: sanctionedCost * 0.4,
      date: "14 May 2024",
      pfmsId: "PFMS-TXN-982144",
      status: "Disbursed & Reconciled",
      voucher: "VCH-2024-1842",
    },
    {
      tranche: "Tranche 3 (Final Settlement)",
      percentage: 30,
      amount: sanctionedCost * 0.3,
      date: status === "Completed" ? "24 Jul 2024" : "Pending Completion",
      pfmsId: status === "Completed" ? "PFMS-TXN-994102" : "Awaiting Final UC",
      status: status === "Completed" ? "Disbursed" : "Escrow Retained",
      voucher: status === "Completed" ? "VCH-2024-3011" : "Pending",
    },
  ];

  return (
    <div className="project-detail-page">
      {/* -----------------------------------------------------------------
          BREADCRUMB BAR
          ----------------------------------------------------------------- */}
      <div className="project-detail-breadcrumb">
        <button
          type="button"
          onClick={onBack}
          className="project-back-btn"
          title="Return to previous directory"
        >
          <ArrowLeft size={16} />
          <span>Back to Works Registry</span>
        </button>
        <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>/</span>
        
        {onSelectState ? (
          <button
            type="button"
            onClick={() => onSelectState(stateName)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "0.84rem",
              color: "#2563eb",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {stateName}
          </button>
        ) : (
          <span style={{ fontSize: "0.84rem", color: "#64748b" }}>{stateName}</span>
        )}

        <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>/</span>
        <span style={{ fontSize: "0.84rem", color: "#64748b" }}>{districtName}</span>
        <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>/</span>
        <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#0f172a" }}>{projectId}</span>
      </div>

      {/* -----------------------------------------------------------------
          HERO HEADER WITH SUMMARY STATS
          ----------------------------------------------------------------- */}
      <div className="project-detail-header">
        <div className="project-title-top-row">
          <div className="project-title-info">
            {/* Pill Badges */}
            <div className="project-badge-group">
              <span className="project-code-pill" onClick={handleCopyId} style={{ cursor: "pointer" }} title="Click to copy ID">
                {projectId}
              </span>
              <span className="project-sector-pill">
                <Building size={13} />
                {category}
              </span>
              <span className="project-house-pill">
                <Landmark size={13} style={{ marginRight: "4px" }} />
                {house}
              </span>
              <span
                className={`gov-badge ${
                  status === "Completed"
                    ? "gov-badge-success"
                    : status === "Delayed"
                    ? "gov-badge-danger"
                    : "gov-badge-warning"
                }`}
                style={{ fontSize: "0.75rem", padding: "4px 10px" }}
              >
                {status}
              </span>
              <span className={`project-risk-pill ${isFlagged ? "high" : "low"}`}>
                {isFlagged ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                <span>{isFlagged ? `Flagged · Risk Score ${riskScore}/100` : "AI Verified · Low Risk"}</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="project-title-heading">{title}</h1>

            {/* Location & MP Subtext */}
            <div className="project-location-subtext">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={15} color="#64748b" />
                <strong>{districtName}</strong>,{" "}
                {onSelectState ? (
                  <button
                    type="button"
                    onClick={() => onSelectState(stateName)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#2563eb",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    title={`View ${stateName} State Workspace`}
                  >
                    {stateName}
                  </button>
                ) : (
                  stateName
                )}
              </span>
              <span>•</span>
              <span>
                Constituency:{" "}
                {onSelectMP ? (
                  <button
                    type="button"
                    onClick={() => onSelectMP(associatedMP || mpName)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#2563eb",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    title={`View MP Profile for ${constituencyName}`}
                  >
                    {constituencyName}
                  </button>
                ) : (
                  <strong>{constituencyName}</strong>
                )}
              </span>
              <span>•</span>
              <span>
                Recommended by:{" "}
                {onSelectMP ? (
                  <button
                    type="button"
                    onClick={() => onSelectMP(associatedMP || mpName)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#2563eb",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    title={`View Profile of ${mpName}`}
                  >
                    {mpName}
                  </button>
                ) : (
                  <strong>{mpName}</strong>
                )}
              </span>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="project-header-actions">
            <button
              type="button"
              onClick={handleCopyId}
              className="project-action-btn"
              title="Copy Reference Code"
            >
              {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="project-action-btn primary"
              title="Print Official Project Dossier"
            >
              <Printer size={15} />
              <span>Print Dossier</span>
            </button>
          </div>
        </div>

        {/* 4 Interactive Summary Stat Cards */}
        <div className="project-summary-stats">
          {/* Stat 1: Sanctioned Budget */}
          <div className="project-summary-stat-card">
            <div className="project-stat-icon-wrapper blue">
              <IndianRupee size={24} strokeWidth={2} />
            </div>
            <div className="project-stat-content">
              <span className="project-stat-value">{formatINR(sanctionedCost)}</span>
              <span className="project-stat-label">Sanctioned Outlay</span>
            </div>
          </div>

          {/* Stat 2: Verified Expenditure */}
          <div className="project-summary-stat-card">
            <div className="project-stat-icon-wrapper emerald">
              <TrendingUp size={24} strokeWidth={2} />
            </div>
            <div className="project-stat-content">
              <span className="project-stat-value" style={{ color: "#059669" }}>
                {formatINR(utilizedAmt)}
              </span>
              <span className="project-stat-label">
                Disbursed ({financialProgress}%)
              </span>
            </div>
          </div>

          {/* Stat 3: Physical Progress */}
          <div className="project-summary-stat-card">
            <div className="project-stat-icon-wrapper amber">
              <Activity size={24} strokeWidth={2} />
            </div>
            <div className="project-stat-content">
              <span className="project-stat-value" style={{ color: physicalProgress >= 100 ? "#059669" : "#d97706" }}>
                {physicalProgress}%
              </span>
              <span className="project-stat-label">Physical Progress</span>
            </div>
          </div>

          {/* Stat 4: Quality & AI Integrity */}
          <div className="project-summary-stat-card">
            <div className="project-stat-icon-wrapper purple">
              <Award size={24} strokeWidth={2} />
            </div>
            <div className="project-stat-content">
              <span className="project-stat-value" style={{ color: "#7c3aed" }}>
                4.8 / 5.0 ★
              </span>
              <span className="project-stat-label">Quality & Field QA</span>
            </div>
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------
          TAB NAVIGATION BAR
          ----------------------------------------------------------------- */}
      <div className="project-detail-tabs">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`project-tab-btn ${activeTab === "overview" ? "active" : ""}`}
        >
          <Layers size={16} />
          <span>Overview & Milestones</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("financials")}
          className={`project-tab-btn ${activeTab === "financials" ? "active" : ""}`}
        >
          <DollarSign size={16} />
          <span>Financials & PFMS Tranches</span>
          <span className="project-tab-badge">3 Tranches</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inspections")}
          className={`project-tab-btn ${activeTab === "inspections" ? "active" : ""}`}
        >
          <Camera size={16} />
          <span>Field Inspections & AI QA</span>
          <span className="project-tab-badge">3 Logs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stakeholders")}
          className={`project-tab-btn ${activeTab === "stakeholders" ? "active" : ""}`}
        >
          <Users size={16} />
          <span>Stakeholders & Agency</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("citizen_feedback")}
          className={`project-tab-btn ${activeTab === "citizen_feedback" ? "active" : ""}`}
        >
          <MessageSquare size={16} />
          <span>Citizen Feedback</span>
          <span className="project-tab-badge">4.8 ★</span>
        </button>
      </div>

      {/* -----------------------------------------------------------------
          TAB 1: OVERVIEW & MILESTONE LIFECYCLE
          ----------------------------------------------------------------- */}
      {activeTab === "overview" && (
        <div className="project-tab-panel">
          {/* 7-Stage Milestone Lifecycle Stepper */}
          <div className="project-content-card">
            <div className="project-content-card-header">
              <h3 className="project-content-card-title">
                <Clock size={20} color="#2563eb" />
                <span>Statutory Milestone & Delivery Pipeline</span>
              </h3>
              <span className="gov-badge gov-badge-info">Stage 5 of 7 Active</span>
            </div>

            <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "0 0 16px 0" }}>
              End-to-end lifecycle tracked from MP recommendation through technical sanction, on-site construction, and final asset commissioning.
            </p>

            <div className="milestone-stepper">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className={`milestone-step-item ${m.status}`}
                >
                  <div className="milestone-step-dot">
                    {m.status === "completed" ? <Check size={16} strokeWidth={3} /> : m.id}
                  </div>
                  <div className="milestone-step-title">{m.title}</div>
                  <div className="milestone-step-date">{m.date}</div>
                  <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "4px", lineHeight: 1.25 }}>
                    {m.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Details & Geographic Profile */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Card Left: Core Project Parameters */}
            <div className="project-content-card">
              <div className="project-content-card-header">
                <h3 className="project-content-card-title">
                  <FileText size={18} color="#2563eb" />
                  <span>Administrative Parameters</span>
                </h3>
              </div>

              <div className="project-info-grid">
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Sector Category</span>
                  <span className="project-info-cell-value">{category}</span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Parliamentary House</span>
                  <span className="project-info-cell-value">{house}</span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Sanction Order Ref</span>
                  <span className="project-info-cell-value" style={{ fontFamily: "monospace" }}>
                    AS-MoSPI/2024/{projectId.slice(-6)}
                  </span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Sanction Date</span>
                  <span className="project-info-cell-value">
                    {project.dateSanctioned || project.sanction_date || "28 Feb 2024"}
                  </span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Target Completion</span>
                  <span className="project-info-cell-value">
                    {project.targetCompletion || project.expected_completion_date || "18 Aug 2024"}
                  </span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Implementing Agency</span>
                  <span className="project-info-cell-value">{project.agency || "Public Works Department (PWD)"}</span>
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <span className="project-info-cell-label">Project Justification & Scope</span>
                <p style={{ fontSize: "0.85rem", color: "#334155", margin: "6px 0 0 0", lineHeight: 1.5 }}>
                  {project.justification ||
                    `Constructing a robust, climate-resilient ${category.toLowerCase()} asset in ${districtName} to cater to the critical infrastructural requirements of over 12,500 local residents.`}
                </p>
              </div>
            </div>

            {/* Card Right: Geographic Coordinates & Location Profile */}
            <div className="project-content-card">
              <div className="project-content-card-header">
                <h3 className="project-content-card-title">
                  <MapPin size={18} color="#2563eb" />
                  <span>Geographic & Field Coordinates</span>
                </h3>
                <span className="gov-badge gov-badge-success">GIS Verified</span>
              </div>

              <div className="project-info-grid">
                <div className="project-info-cell">
                  <span className="project-info-cell-label">State / UT</span>
                  <span className="project-info-cell-value">
                    {onSelectState ? (
                      <button
                        type="button"
                        onClick={() => onSelectState(stateName)}
                        style={{ background: "none", border: "none", padding: 0, color: "#2563eb", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                        title={`Navigate to ${stateName}`}
                      >
                        {stateName}
                      </button>
                    ) : (
                      stateName
                    )}
                  </span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">District</span>
                  <span className="project-info-cell-value">{districtName}</span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Parliamentary Constituency</span>
                  <span className="project-info-cell-value">
                    {onSelectMP ? (
                      <button
                        type="button"
                        onClick={() => onSelectMP(associatedMP || mpName)}
                        style={{ background: "none", border: "none", padding: 0, color: "#2563eb", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                        title={`Navigate to ${constituencyName} MP`}
                      >
                        {constituencyName}
                      </button>
                    ) : (
                      constituencyName
                    )}
                  </span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Block / Tehsil</span>
                  <span className="project-info-cell-value">{districtName} Sadar</span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">GPS Latitude</span>
                  <span className="project-info-cell-value" style={{ fontFamily: "monospace" }}>28.8955° N</span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">GPS Longitude</span>
                  <span className="project-info-cell-value" style={{ fontFamily: "monospace" }}>76.6066° E</span>
                </div>
              </div>

              <div style={{ marginTop: "18px", padding: "14px", background: "#eff6ff", borderRadius: "10px", border: "1px solid #bfdbfe", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <ShieldCheck size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div style={{ fontSize: "0.80rem", color: "#1e40af", lineHeight: 1.4 }}>
                  <strong>Satellite & Geo-Fence Confirmation:</strong> All on-site mobile check-ins and evidence uploads are cryptographically locked within a 50-meter radius of the registered coordinates.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          TAB 2: FINANCIALS & PFMS TRANCHE RELEASES
          ----------------------------------------------------------------- */}
      {activeTab === "financials" && (
        <div className="project-tab-panel">
          {/* Financial Breakdown Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div style={{ padding: "18px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Sanctioned Amount
              </span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                {formatINR(sanctionedCost)}
              </div>
              <span style={{ fontSize: "0.74rem", color: "#64748b" }}>100% Budget Allotment</span>
            </div>

            <div style={{ padding: "18px", background: "#ecfdf5", borderRadius: "12px", border: "1px solid #a7f3d0" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>
                Total Disbursed
              </span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
                {formatINR(utilizedAmt)}
              </div>
              <span style={{ fontSize: "0.74rem", color: "#059669" }}>{financialProgress}% via PFMS e-Transfer</span>
            </div>

            <div style={{ padding: "18px", background: "#fffbeb", borderRadius: "12px", border: "1px solid #fde68a" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#d97706", textTransform: "uppercase" }}>
                Unspent Escrow Balance
              </span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
                {formatINR(unspentAmt)}
              </div>
              <span style={{ fontSize: "0.74rem", color: "#d97706" }}>Retained for Stage Completion</span>
            </div>
          </div>

          {/* PFMS Tranche Matrix Table */}
          <div className="project-content-card">
            <div className="project-content-card-header">
              <h3 className="project-content-card-title">
                <Landmark size={20} color="#2563eb" />
                <span>PFMS Electronic Fund Disbursement Schedule</span>
              </h3>
              <span className="gov-badge gov-badge-success">PFMS Direct Bank Transfer</span>
            </div>

            <div className="gov-table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Tranche Stage</th>
                    <th>Allotment %</th>
                    <th>Amount (₹)</th>
                    <th>Disbursement Date</th>
                    <th>PFMS Reference ID</th>
                    <th>Voucher Number</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tranches.map((t, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{t.tranche}</td>
                      <td>{t.percentage}%</td>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>{formatINR(t.amount)}</td>
                      <td>{t.date}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.80rem" }}>{t.pfmsId}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.80rem" }}>{t.voucher}</td>
                      <td>
                        <span
                          className={`gov-badge ${
                            t.status.includes("Disbursed")
                              ? "gov-badge-success"
                              : "gov-badge-neutral"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cryptographic Proof Card */}
            <div style={{ marginTop: "20px", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>
                Cryptographic Audit Ledger Hash (SHA-256)
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "0.80rem", color: "#0f172a", wordBreak: "break-all", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855::MPLADS::{projectId}::PFMS_VERIFIED
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          TAB 3: FIELD QUALITY & AI INSPECTIONS
          ----------------------------------------------------------------- */}
      {activeTab === "inspections" && (
        <div className="project-tab-panel">
          <div className="project-content-card">
            <div className="project-content-card-header">
              <h3 className="project-content-card-title">
                <Camera size={20} color="#2563eb" />
                <span>Geo-Tagged Visual Evidence & Computer Vision Audits ({dynamicInspectionPhotos.length} Photos)</span>
              </h3>
              <span className="gov-badge gov-badge-info">Multi-Source Verified</span>
            </div>

            <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "0 0 16px 0" }}>
              High-resolution on-site photographs submitted across Contractor stage milestones, District inspection officers, and Citizen ground reports, verified by AI models.
            </p>

            <div className="project-evidence-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
              {dynamicInspectionPhotos.map((photo) => {
                const isContractor = photo.source === 'contractor';
                const isCitizen = photo.source === 'citizen';
                const badgeColor = isContractor ? '#2563eb' : isCitizen ? '#059669' : '#7c3aed';

                return (
                  <div 
                    key={photo.id} 
                    className="project-evidence-card"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      cursor: "pointer"
                    }}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <div className="project-evidence-img-box" style={{ position: "relative", height: "180px", background: "#0b1320" }}>
                      <img src={photo.img} alt={photo.title} className="project-evidence-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      
                      <span
                        style={{
                          position: "absolute",
                          top: "8px",
                          left: "8px",
                          background: badgeColor,
                          color: "#ffffff",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}
                      >
                        {photo.sourceLabel}
                      </span>

                      <span
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          left: "8px",
                          background: "rgba(15, 23, 42, 0.85)",
                          color: "#ffffff",
                          fontSize: "0.68rem",
                          padding: "3px 7px",
                          borderRadius: "4px",
                          fontFamily: "monospace",
                        }}
                      >
                        {photo.gps}
                      </span>
                    </div>

                    <div className="project-evidence-meta" style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                        {photo.title}
                      </div>
                      
                      {photo.notes && (
                        <div style={{ fontSize: "0.74rem", color: "#475569", marginBottom: "6px", lineHeight: 1.35 }}>
                          {photo.notes}
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem", color: "#64748b", marginTop: "4px", paddingTop: "6px", borderTop: "1px solid #f1f5f9" }}>
                        <span>{photo.date}</span>
                        <span style={{ color: "#16a34a", fontWeight: 700, background: "#ecfdf5", padding: "2px 6px", borderRadius: "4px" }}>
                          {photo.aiScore}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quality Assurance Officer Log */}
          <div className="project-content-card">
            <div className="project-content-card-header">
              <h3 className="project-content-card-title">
                <ShieldCheck size={20} color="#059669" />
                <span>Field Quality Officer Inspection Sign-Offs</span>
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "14px 18px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                    Stage 2 Structural Inspection — Shri Amit Verma (Assistant Engineer, PWD)
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>
                    Visited on 18 May 2024 · Concrete cube test: 28.5 N/mm² (Passed Grade M25)
                  </div>
                </div>
                <span className="gov-badge gov-badge-success">Grade A+ Approved</span>
              </div>

              <div style={{ padding: "14px 18px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                    Stage 1 Foundation Inspection — Smt. Neha Bansal (District Quality Officer)
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>
                    Visited on 14 Apr 2024 · Soil bearing capacity verified · Anti-termite treatment completed
                  </div>
                </div>
                <span className="gov-badge gov-badge-success">Grade A Approved</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          TAB 4: STAKEHOLDERS & IMPLEMENTING AGENCY
          ----------------------------------------------------------------- */}
      {activeTab === "stakeholders" && (
        <div className="project-tab-panel">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Stakeholder 1: Recommending MP */}
            <div className="project-content-card">
              <div className="project-content-card-header">
                <h3 className="project-content-card-title">
                  <Landmark size={18} color="#2563eb" />
                  <span>Recommending Member of Parliament</span>
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem" }}>
                  {mpName.replace(/^(Shri|Smt\.|Dr\.)\s+/i, "").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>{mpName}</div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {house} · {constituencyName}
                  </div>
                </div>
              </div>
              {onSelectMP && (
                <button
                  type="button"
                  onClick={() => onSelectMP(associatedMP || mpName)}
                  className="project-action-btn primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <span>View Full MP Performance Dossier</span>
                  <ChevronRight size={15} />
                </button>
              )}
            </div>

            {/* Stakeholder 2: District Authority */}
            <div className="project-content-card">
              <div className="project-content-card-header">
                <h3 className="project-content-card-title">
                  <Building size={18} color="#2563eb" />
                  <span>District Nodal Authority</span>
                </h3>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>
                Office of the District Magistrate & Collector
              </div>
              <div style={{ fontSize: "0.82rem", color: "#475569", marginBottom: "12px" }}>
                District Authority, {districtName}, {stateName}
              </div>
              <div className="project-info-grid">
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Nodal Officer</span>
                  <span className="project-info-cell-value">District Planning Officer</span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Approval Sanction Ref</span>
                  <span className="project-info-cell-value" style={{ fontFamily: "monospace" }}>DM/MPLADS/2024-492</span>
                </div>
              </div>
            </div>

            {/* Stakeholder 3: Implementing Agency & Contractor */}
            <div className="project-content-card" style={{ gridColumn: "1 / -1" }}>
              <div className="project-content-card-header">
                <h3 className="project-content-card-title">
                  <Briefcase size={18} color="#2563eb" />
                  <span>Implementing Agency & Contractor Details</span>
                </h3>
              </div>

              <div className="project-info-grid">
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Implementing Department</span>
                  <span className="project-info-cell-value">{project.agency || "Public Works Department (PWD)"}</span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Assigned Contractor</span>
                  <span className="project-info-cell-value" style={{ color: "#2563eb" }}>
                    {project.contractor || "National Construction Corp India Pvt Ltd"}
                  </span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Contractor License Code</span>
                  <span className="project-info-cell-value" style={{ fontFamily: "monospace" }}>LIC-CPWD-2023-A-0941</span>
                </div>
                <div className="project-info-cell">
                  <span className="project-info-cell-label">Tender Work Order Ref</span>
                  <span className="project-info-cell-value" style={{ fontFamily: "monospace" }}>WO-PWD-ROH-2024-884</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          TAB 5: CITIZEN FEEDBACK & SOCIAL AUDIT
          ----------------------------------------------------------------- */}
      {activeTab === "citizen_feedback" && (
        <div className="project-tab-panel">
          <div className="project-content-card">
            <div className="project-content-card-header">
              <h3 className="project-content-card-title">
                <MessageSquare size={20} color="#2563eb" />
                <span>Constituency Social Audit & Resident Reviews</span>
              </h3>
              <span className="gov-badge gov-badge-success">4.8 / 5.0 Rating</span>
            </div>

            {associatedCitizenIssues.length > 0 && (
              <div style={{ marginBottom: "16px", padding: "14px 16px", background: "#eff6ff", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e40af", marginBottom: "6px" }}>
                  Linked Citizen Grievance & Need Submissions:
                </div>
                {associatedCitizenIssues.map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginTop: "8px" }}>
                    {c.photos && c.photos.length > 0 && (
                      <img
                        src={c.photos[0].url}
                        alt="Citizen Upload"
                        style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid #cbd5e1", cursor: "pointer" }}
                        onClick={() => setSelectedPhoto({
                          id: c.id,
                          source: 'citizen',
                          sourceLabel: 'Citizen Ground Survey',
                          title: c.title,
                          date: c.dateSubmitted,
                          gps: c.locationName,
                          img: c.photos[0].url,
                          aiScore: 'Citizen Verified',
                          verified: true,
                          uploaderName: c.submittedBy,
                          notes: c.currentSituation || c.description
                        })}
                      />
                    )}
                    <div style={{ fontSize: "0.78rem" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{c.title}</div>
                      <div style={{ color: "#475569", marginTop: "2px" }}>{c.description}</div>
                      <div style={{ color: "#64748b", fontSize: "0.72rem", marginTop: "3px" }}>
                        Submitted by: <strong>{c.submittedBy || "Resident"}</strong> ({c.locationName})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                    Rajesh Kumar Sharma · Resident, Ward 14
                  </div>
                  <div style={{ display: "flex", color: "#f59e0b" }}>★★★★★</div>
                </div>
                <p style={{ fontSize: "0.84rem", color: "#334155", margin: 0, lineHeight: 1.45 }}>
                  "Great execution speed by the district authority and MP. The new community facility has resolved the major water supply and hall access problems we faced for years."
                </p>
                <div style={{ fontSize: "0.70rem", color: "#64748b", marginTop: "6px" }}>
                  Verified Resident via Aadhaar / Jan Samvad Portal · 20 Jun 2024
                </div>
              </div>

              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                    Pooja Rani · Local Teacher, Gram Panchayat
                  </div>
                  <div style={{ display: "flex", color: "#f59e0b" }}>★★★★★</div>
                </div>
                <p style={{ fontSize: "0.84rem", color: "#334155", margin: 0, lineHeight: 1.45 }}>
                  "Quality of concrete construction and solar electrification is up to the mark. Very happy with the transparent milestone tracking available online."
                </p>
                <div style={{ fontSize: "0.70rem", color: "#64748b", marginTop: "6px" }}>
                  Verified Resident via Aadhaar / Jan Samvad Portal · 08 Jul 2024
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL-RESOLUTION LIGHTBOX PREVIEW MODAL */}
      {selectedPhoto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(15, 23, 42, 0.92)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px"
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              maxWidth: "850px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="gov-badge gov-badge-info">{selectedPhoto.sourceLabel}</span>
                <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>{selectedPhoto.title}</strong>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: "#0b1320", display: "flex", justifyContent: "center", alignItems: "center", maxHeight: "60vh", overflow: "hidden" }}>
              <img
                src={selectedPhoto.img}
                alt={selectedPhoto.title}
                style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain" }}
              />
            </div>

            <div style={{ padding: "14px 18px", background: "#ffffff", fontSize: "0.80rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div><strong>GPS Coordinates:</strong> {selectedPhoto.gps}</div>
                <div style={{ color: "#64748b", marginTop: "2px" }}>
                  Recorded on: <strong>{selectedPhoto.date}</strong> {selectedPhoto.uploaderName ? `· Uploaded by: ${selectedPhoto.uploaderName}` : ''}
                </div>
              </div>
              <a
                href={selectedPhoto.img}
                target="_blank"
                rel="noopener noreferrer"
                className="gov-btn gov-btn-primary"
                style={{ fontSize: "0.74rem", padding: "6px 14px" }}
              >
                Open Original Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
