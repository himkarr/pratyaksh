import React from "react";
import {
  TrendingUp,
  CheckCircle2,
  Target,
  Users,
  Info,
  Building,
  ShieldCheck,
  Clock,
  AlertCircle,
  FileCheck2,
  HardHat,
  Activity,
} from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { ContractorProject, EvidenceSubmissionRecord } from "../../data/contractorData";
import { CivicUtilizationGauge } from "../common/CivicUtilizationGauge";

export interface FinancialSummaryProps {
  project: WorkItem;
  contractorProject?: ContractorProject | null;
  stageSubmissions?: EvidenceSubmissionRecord[];
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  project,
  contractorProject,
  stageSubmissions = [],
}) => {
  const formatCurrency = (valInCr: number | undefined | null) =>
    `₹${Number(valInCr || 0).toFixed(2)} Cr`;

  // 1. Sanctioned Amount in Cr
  const sanctionedAmtCr = (project?.sanctionedAmt || 0) > 0
    ? project.sanctionedAmt
    : (contractorProject?.sanctionAmountRs ? contractorProject.sanctionAmountRs / 10000000 : 0.10);

  // 2. Recommended Amount in Cr
  const recommendedAmtCr = (project?.recommendedAmt || 0) > 0
    ? project.recommendedAmt
    : (contractorProject?.recommendedAmountRs ? contractorProject.recommendedAmountRs / 10000000 : sanctionedAmtCr);

  // 3. Recorded Expenditure in Cr (synced with actual contractor uploads & project overrides)
  const expenditureAmtCr = contractorProject?.utilizedAmountRs !== undefined && contractorProject?.utilizedAmountRs !== null
    ? contractorProject.utilizedAmountRs / 10000000
    : (project?.expenditureAmt || 0);

  // 4. Unspent Allocation in Cr
  const unspentAmtCr = Math.max(0, sanctionedAmtCr - expenditureAmtCr);

  // 5. Financial Utilization %
  const finUtilization = sanctionedAmtCr > 0
    ? Math.min(100, Math.round((expenditureAmtCr / sanctionedAmtCr) * 100))
    : (project?.financialProgress || 0);

  // 6. Physical Progress % (prioritizing contractor's actual uploaded progress)
  const physicalProgress = contractorProject?.physicalProgress ?? project?.physicalProgress ?? 0;

  // 7. Contractor & Agency details
  const contractorName = contractorProject?.contractorName || project?.contractor || "Gurugram Metropolitan Development Authority (GMDA)";
  const agencyName = contractorProject?.implementingAuthority || project?.agency || "Office of District Magistrate & Collector (IDA)";

  // 8. Contractor stage evidence records
  const submissionsList = contractorProject?.submissionRecords || stageSubmissions;
  const submissionCount = submissionsList.length;
  const latestSubmission = submissionCount > 0 ? submissionsList[0] : null;

  const projectTitleUpper = (project?.title || "Constituency Project").toUpperCase();
  const isAnomaly = expenditureAmtCr > sanctionedAmtCr;
  const worksStatus = project?.status || (physicalProgress >= 100 ? "Completed" : "InProgress");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Row: Fund Utilization Gauge & Delivery Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
          gap: "20px",
          alignItems: "stretch",
        }}
      >
        {/* Left: Speedometer Gauge */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "18px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <CivicUtilizationGauge
            utilization={finUtilization}
            title={`${projectTitleUpper.slice(0, 36)} Fund Utilization`}
            cardHeader="Fund Utilization"
            showInfoIcon={true}
            size="sm"
            hideCardWrap={true}
          />
        </div>

        {/* Right: 2x2 Overview Cards */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <h4
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "#1e293b",
              margin: "0 0 14px 0",
              fontFamily: "var(--font-serif, 'Cormorant Garamond', Georgia, serif)",
            }}
          >
            Projects Overview
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", flexGrow: 1 }}>
            {/* Recommended Outlay */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderLeft: "4px solid #10b981",
                borderRadius: "10px",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "#ecfdf5",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", display: "block", lineHeight: 1.1 }}>
                  {formatCurrency(recommendedAmtCr)}
                </span>
                <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600, display: "block", marginTop: "2px" }}>
                  Recommended Outlay
                </span>
              </div>
            </div>

            {/* Sanctioned Amount */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderLeft: "4px solid #f59e0b",
                borderRadius: "10px",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "#fffbeb",
                  color: "#d97706",
                  border: "1px solid #fde68a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={18} />
              </div>
              <div>
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", display: "block", lineHeight: 1.1 }}>
                  {formatCurrency(sanctionedAmtCr)}
                </span>
                <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600, display: "block", marginTop: "2px" }}>
                  Sanctioned Amount
                </span>
              </div>
            </div>

            {/* Recorded Expenditure (Contractor Synced) */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderLeft: `4px solid ${isAnomaly ? "#ef4444" : "#0284c7"}`,
                borderRadius: "10px",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: isAnomaly ? "#fef2f2" : "#f0f9ff",
                  color: isAnomaly ? "#dc2626" : "#0284c7",
                  border: `1px solid ${isAnomaly ? "#fecaca" : "#bae6fd"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Target size={18} />
              </div>
              <div>
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", display: "block", lineHeight: 1.1 }}>
                  {formatCurrency(expenditureAmtCr)}
                </span>
                <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600, display: "block", marginTop: "2px" }}>
                  Recorded Expenditure
                </span>
              </div>
            </div>

            {/* Unspent Allocation */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderLeft: "4px solid #64748b",
                borderRadius: "10px",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", display: "block", lineHeight: 1.1 }}>
                  {formatCurrency(unspentAmtCr)}
                </span>
                <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600, display: "block", marginTop: "2px" }}>
                  Unspent Allocation
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary (Clean Non-Redundant 2-Column Breakdown) */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          padding: "22px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <h4
          style={{
            fontFamily: "var(--font-serif, 'Cormorant Garamond', Georgia, serif)",
            fontSize: "1.2rem",
            fontWeight: 700,
            color: "#1e293b",
            margin: "0 0 18px 0",
          }}
        >
          Performance Summary
        </h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "20px",
          }}
        >
          {/* Column 1: Financial Performance */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px",
            }}
          >
            <h5 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: "0 0 14px 0" }}>
              Financial Performance
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Financial Progress Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.84rem" }}>
                  <span style={{ color: "#475569", fontWeight: 600 }}>Financial Disbursement Rate:</span>
                  <span style={{ fontWeight: 800, color: isAnomaly ? "#dc2626" : "#0f172a" }}>
                    {finUtilization.toFixed(1)}% ({formatCurrency(expenditureAmtCr)} / {formatCurrency(sanctionedAmtCr)})
                  </span>
                </div>
                <div style={{ width: "100%", background: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(100, finUtilization)}%`,
                      background: isAnomaly ? "#ef4444" : "#10b981",
                      height: "100%",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Burn Rate Trajectory */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Burn Rate Trajectory:</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: isAnomaly ? "#dc2626" : "#166534", background: isAnomaly ? "#fef2f2" : "#f0fdf4", padding: "2px 8px", borderRadius: "6px", border: `1px solid ${isAnomaly ? "#fecaca" : "#bbf7d0"}` }}>
                  {isAnomaly ? "Expenditure Anomaly (Over Budget)" : "Compliant MoSPI Benchmark"}
                </span>
              </div>

              {/* Statutory Tranche Release Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Statutory Tranche Status:</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0369a1" }}>
                  {expenditureAmtCr > 0 ? "1st Tranche Disbursed (50%)" : "Sanctioned & Awaiting Release"}
                </span>
              </div>

              {/* Works Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Works Administrative Status:</span>
                <span style={{ fontWeight: 800, color: worksStatus === "Completed" ? "#059669" : "#d97706", fontSize: "0.88rem" }}>
                  {worksStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Project Delivery (Contractor Synced) */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px",
            }}
          >
            <h5 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: "0 0 14px 0" }}>
              Project Delivery (Contractor Data)
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Assigned Contractor */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Assigned Contractor:</span>
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.86rem", maxWidth: "200px", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={contractorName}>
                  {contractorName}
                </span>
              </div>

              {/* Implementing Nodal Agency */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Implementing Agency:</span>
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.86rem", maxWidth: "200px", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={agencyName}>
                  {agencyName}
                </span>
              </div>

              {/* Physical Execution Progress */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.84rem" }}>
                  <span style={{ color: "#475569", fontWeight: 600 }}>Physical Execution Progress:</span>
                  <span style={{ fontWeight: 800, color: physicalProgress >= 70 ? "#059669" : "#d97706" }}>
                    {physicalProgress}%
                  </span>
                </div>
                <div style={{ width: "100%", background: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(100, physicalProgress)}%`,
                      background: physicalProgress >= 70 ? "#10b981" : (physicalProgress >= 40 ? "#f59e0b" : "#ef4444"),
                      height: "100%",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Contractor Stage Evidence Submissions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Contractor Stage Submissions:</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: submissionCount > 0 ? "#166534" : "#64748b", background: submissionCount > 0 ? "#f0fdf4" : "#f1f5f9", padding: "2px 8px", borderRadius: "6px", border: `1px solid ${submissionCount > 0 ? "#bbf7d0" : "#e2e8f0"}` }}>
                  {submissionCount > 0
                    ? `${submissionCount} Uploaded (${latestSubmission?.checkpointActionName || latestSubmission?.workStage || 'Stage Active'})`
                    : "No Uploads Yet"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;
