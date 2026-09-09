import React from "react";
import {
  Landmark,
  TrendingUp,
  CheckCircle2,
  Target,
  Users,
  Info,
  Building,
  ShieldCheck,
  Clock,
  Check,
} from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { CivicUtilizationGauge } from "../common/CivicUtilizationGauge";

export interface FinancialSummaryProps {
  project: WorkItem;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ project }) => {
  const formatCurrency = (valInCr: number | undefined | null) =>
    `₹${Number(valInCr || 0).toFixed(2)} Cr`;

  const unspentAmt = Math.max(0, (project?.sanctionedAmt || 0) - (project?.expenditureAmt || 0));

  const finUtilization = (project?.sanctionedAmt || 0) > 0
    ? Math.min(100, Math.round(((project?.expenditureAmt || 0) / project.sanctionedAmt) * 100))
    : project?.financialProgress || 0;

  const physicalProgress = project?.physicalProgress || 0;
  const projectTitleUpper = (project?.title || "Constituency Project").toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Row: Fund Utilization Gauge & Delivery Overview Cards (Matching Reference Architecture) */}
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

        {/* Right: 2x2 Colored Overview Cards */}
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
            {/* Recommended Outlay (Soft Green #dcfce7) */}
            <div
              style={{
                background: "#dcfce7",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 8px 18px -4px rgba(5, 150, 105, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "#059669",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#065f46", display: "block", lineHeight: 1.1 }}>
                  {formatCurrency(project.recommendedAmt)}
                </span>
                <span style={{ fontSize: "0.74rem", color: "#047857", fontWeight: 600, display: "block", marginTop: "2px" }}>
                  Recommended Outlay
                </span>
              </div>
            </div>

            {/* Sanctioned Amount (Soft Yellow #fef9c3) */}
            <div
              style={{
                background: "#fef9c3",
                border: "1px solid #fef08a",
                borderRadius: "10px",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 8px 18px -4px rgba(217, 119, 6, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "#d97706",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={18} />
              </div>
              <div>
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#92400e", display: "block", lineHeight: 1.1 }}>
                  {formatCurrency(project.sanctionedAmt)}
                </span>
                <span style={{ fontSize: "0.74rem", color: "#b45309", fontWeight: 600, display: "block", marginTop: "2px" }}>
                  Sanctioned Amount
                </span>
              </div>
            </div>

            {/* Recorded Expenditure (Soft Blue #e0f2fe) */}
            <div
              style={{
                background: "#e0f2fe",
                border: "1px solid #bae6fd",
                borderRadius: "10px",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 8px 18px -4px rgba(2, 132, 199, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "#0284c7",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Target size={18} />
              </div>
              <div>
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0369a1", display: "block", lineHeight: 1.1 }}>
                  {formatCurrency(project.expenditureAmt)}
                </span>
                <span style={{ fontSize: "0.74rem", color: "#0284c7", fontWeight: 600, display: "block", marginTop: "2px" }}>
                  Recorded Expenditure
                </span>
              </div>
            </div>

            {/* Remaining Balance (Soft Slate #f1f5f9) */}
            <div
              style={{
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 8px 18px -4px rgba(100, 116, 139, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "#475569",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e293b", display: "block", lineHeight: 1.1 }}>
                  {formatCurrency(unspentAmt)}
                </span>
                <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600, display: "block", marginTop: "2px" }}>
                  Remaining Balance
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary (Matching Reference Architecture 2-Column Breakdown) */}
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
          {/* Financial Performance Column */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px",
              transition: "all 0.2s ease",
            }}
          >
            <h5 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: "0 0 14px 0" }}>
              Financial Performance
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Allocated Amount:</span>
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.92rem" }}>{formatCurrency(project.sanctionedAmt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Recorded Expenditure:</span>
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.92rem" }}>{formatCurrency(project.expenditureAmt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Remaining Balance:</span>
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.92rem" }}>{formatCurrency(unspentAmt)}</span>
              </div>

              {/* Highlight row for Fund Utilization */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  margin: "4px 0",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: 600, fontSize: "0.86rem" }}>
                  Fund Utilization
                  <Info size={14} color="#16a34a" />
                </span>
                <span style={{ fontWeight: 800, color: "#16a34a", fontSize: "1.05rem" }}>
                  {finUtilization.toFixed(1)}%
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Works Status:</span>
                <span style={{ fontWeight: 800, color: project.status === "Completed" ? "#059669" : "#d97706", fontSize: "0.9rem" }}>
                  {project.status || "In Progress"}
                </span>
              </div>
            </div>
          </div>

          {/* Project Delivery Column */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px",
              transition: "all 0.2s ease",
            }}
          >
            <h5 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: "0 0 14px 0" }}>
              Project Delivery
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Assigned Contractor:</span>
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.88rem", maxWidth: "180px", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={project.contractor}>
                  {project.contractor || "Assigned Agency"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Implementing Agency:</span>
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.88rem", maxWidth: "180px", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={project.agency}>
                  {project.agency || "District DRDA"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#475569", fontSize: "0.84rem" }}>Physical Progress:</span>
                <span style={{ fontWeight: 800, color: physicalProgress >= 70 ? "#059669" : "#d97706", fontSize: "0.92rem" }}>
                  {physicalProgress}%
                </span>
              </div>

              {/* Highlight row for Completion Rate */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: physicalProgress >= 50 ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${physicalProgress >= 50 ? "#bbf7d0" : "#fecaca"}`,
                  padding: "10px 14px",
                  borderRadius: "8px",
                  margin: "4px 0",
                }}
              >
                <span style={{ color: physicalProgress >= 50 ? "#166534" : "#991b1b", fontWeight: 600, fontSize: "0.86rem" }}>
                  Completion Rate:
                </span>
                <span style={{ fontWeight: 800, color: physicalProgress >= 50 ? "#16a34a" : "#dc2626", fontSize: "1.05rem" }}>
                  {physicalProgress.toFixed(1)}%
                </span>
              </div>

              {/* Highlight row for Fund Utilization */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  margin: "4px 0",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: 600, fontSize: "0.86rem" }}>
                  Fund Utilization
                  <Info size={14} color="#16a34a" />
                </span>
                <span style={{ fontWeight: 800, color: "#16a34a", fontSize: "1.05rem" }}>
                  {finUtilization.toFixed(1)}%
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
