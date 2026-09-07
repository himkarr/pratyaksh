import React from "react";
import { Landmark, TrendingUp, DollarSign, PieChart } from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { Card, CardHeader, CardBody } from "../ui";

export interface FinancialSummaryProps {
  project: WorkItem;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ project }) => {
  const formatCurrency = (valInCr: number | undefined | null) => `₹${Number(valInCr || 0).toFixed(2)} Cr`;

  const unspentAmt = Math.max(0, (project?.sanctionedAmt || 0) - (project?.expenditureAmt || 0));

  return (
    <Card>
      <CardHeader
        title="Financial Allocation & Disbursement Breakdown"
        icon={<Landmark size={16} />}
      />

      <CardBody>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          {/* Recommended Amount */}
          <div style={{ background: "var(--bg-surface-subtle)", padding: "12px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Recommended Amount</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "4px" }}>
              {formatCurrency(project.recommendedAmt)}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>MP Recommendation</div>
          </div>

          {/* Sanctioned Amount */}
          <div style={{ background: "var(--bg-surface-subtle)", padding: "12px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Sanctioned Amount</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "4px" }}>
              {formatCurrency(project.sanctionedAmt)}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>District Collector Sanction</div>
          </div>

          {/* Utilized / Disbursed Amount */}
          <div style={{ background: "var(--bg-surface-subtle)", padding: "12px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Cumulative Spent</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--status-success-text)", marginTop: "4px" }}>
              {formatCurrency(project.expenditureAmt)}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>Actual Disbursed</div>
          </div>

          {/* Balance Unspent */}
          <div style={{ background: "var(--bg-surface-subtle)", padding: "12px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Unspent Balance</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: unspentAmt > 1.0 ? "var(--status-warning-text)" : "var(--text-main)", marginTop: "4px" }}>
              {formatCurrency(unspentAmt)}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>Pending Milestone Release</div>
          </div>
        </div>

        {/* Progress Comparison */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", marginBottom: "6px", fontWeight: 600 }}>
            <span>Financial Utilization: {project.financialProgress}%</span>
            <span>Physical Execution: {project.physicalProgress}%</span>
          </div>

          <div style={{ width: "100%", background: "#e2e8f0", height: "10px", borderRadius: "5px", overflow: "hidden", display: "flex" }}>
            <div
              style={{
                width: `${project.financialProgress}%`,
                background: "var(--gov-accent)",
                height: "100%"
              }}
              title={`Financial: ${project.financialProgress}%`}
            />
          </div>

          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Contractor: <strong>{project.contractor}</strong> | Implementing Agency: <strong>{project.agency}</strong>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default FinancialSummary;
