import React from "react";
import { DollarSign, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react";
import { ContractorProject } from "../../data/contractorData";

interface BudgetTrackerProps {
  project: ContractorProject;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ project }) => {
  const sanctionAmt = project.sanctionAmountRs;
  const recommendedAmt = project.recommendedAmountRs;
  const expenditure = project.utilizedAmountRs;
  const remaining = project.remainingAmountRs;

  const formatRs = (amt: number | null) => {
    if (amt === null || amt === undefined) return "Not available";
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    return `₹${(amt / 100000).toFixed(2)} Lakh`;
  };

  const utilizationPercent = (expenditure !== null && sanctionAmt > 0)
    ? Math.round((expenditure / sanctionAmt) * 100)
    : null;

  return (
    <div className="gov-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
          Budget & Expenditure Summary
        </h3>
        <span className="gov-badge gov-badge-info">
          UTILIZATION: {utilizationPercent !== null ? `${utilizationPercent}%` : "Not available"}
        </span>
      </div>

      {/* Financial Metrics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
        {/* Recommended Amount */}
        <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>RECOMMENDED AMOUNT</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
            {formatRs(recommendedAmt)}
          </div>
        </div>

        {/* Sanctioned Amount */}
        <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>SANCTION AMOUNT</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--status-success-text)", marginTop: "2px" }}>
            {formatRs(sanctionAmt)}
          </div>
        </div>

        {/* Expenditure to Date */}
        <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>CURRENT EXPENDITURE</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: expenditure !== null ? "var(--gov-primary)" : "var(--text-muted)", marginTop: "2px" }}>
            {formatRs(expenditure)}
          </div>
        </div>

        {/* Remaining Amount */}
        <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>AMOUNT REMAINING</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: remaining !== null ? "var(--text-main)" : "var(--text-muted)", marginTop: "2px" }}>
            {formatRs(remaining)}
          </div>
        </div>
      </div>
    </div>
  );
};
