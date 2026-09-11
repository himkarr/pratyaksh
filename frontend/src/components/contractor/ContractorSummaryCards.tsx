import React from "react";
import { Building2, Activity, CheckCircle2, AlertTriangle, UploadCloud } from "lucide-react";
import { ContractorProject } from "../../data/contractorData";

interface ContractorSummaryCardsProps {
  projects: ContractorProject[];
}

export const ContractorSummaryCards: React.FC<ContractorSummaryCardsProps> = ({ projects }) => {
  const totalAssigned = projects.length;
  const activeProjects = projects.filter(p => p.currentWorkStatus === "InProgress" || p.currentWorkStatus === "Sanctioned").length;
  const projectsOnTrack = projects.filter(p => p.riskIndicator === "Low Risk" || p.currentWorkStatus === "Completed").length;
  const projectsRequiringAttention = projects.filter(p => 
    p.riskIndicator === "Delay Risk" || p.riskIndicator === "Critical Delay" || p.monitoringStatus === "Action Pending"
  ).length;
  const pendingEvidence = projects.filter(p => 
    p.checkpointActions && p.checkpointActions.some(a => a.submissionStatus === "Pending" || a.submissionStatus === "Overdue")
  ).length;

  return (
    <div 
      style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", 
        gap: "16px" 
      }}
    >
      {/* 1. Total Assigned Projects */}
      <div 
        className="metric-card metric-amber" 
        style={{ 
          padding: "18px 20px", 
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.4px" }}>
            Total Assigned Projects
          </span>
          <div style={{ background: "#fef3c7", padding: "6px 8px", borderRadius: "8px", display: "flex" }}>
            <Building2 size={16} color="#d97706" />
          </div>
        </div>
        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--gov-primary)", fontFamily: "var(--font-display, Outfit, sans-serif)", marginTop: "2px" }}>
          {totalAssigned}
        </div>
        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          Authority Assigned MPLADS Works
        </div>
      </div>

      {/* 2. Active Projects */}
      <div 
        className="metric-card metric-sky" 
        style={{ 
          padding: "18px 20px", 
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.4px" }}>
            Active Projects
          </span>
          <div style={{ background: "#e0f2fe", padding: "6px 8px", borderRadius: "8px", display: "flex" }}>
            <Activity size={16} color="#0284c7" />
          </div>
        </div>
        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0369a1", fontFamily: "var(--font-display, Outfit, sans-serif)", marginTop: "2px" }}>
          {activeProjects}
        </div>
        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          In Execution / Field Work
        </div>
      </div>

      {/* 3. Projects On Track */}
      <div 
        className="metric-card metric-green" 
        style={{ 
          padding: "18px 20px", 
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.4px" }}>
            Projects On Track
          </span>
          <div style={{ background: "#dcfce7", padding: "6px 8px", borderRadius: "8px", display: "flex" }}>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
        </div>
        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#15803d", fontFamily: "var(--font-display, Outfit, sans-serif)", marginTop: "2px" }}>
          {projectsOnTrack}
        </div>
        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          Meeting Authority Targets
        </div>
      </div>

      {/* 4. Projects Requiring Attention */}
      <div 
        className="metric-card metric-rose" 
        style={{ 
          padding: "18px 20px", 
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.4px" }}>
            Requiring Attention
          </span>
          <div style={{ background: "#fee2e2", padding: "6px 8px", borderRadius: "8px", display: "flex" }}>
            <AlertTriangle size={16} color="#dc2626" />
          </div>
        </div>
        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: projectsRequiringAttention > 0 ? "#b91c1c" : "var(--text-main)", fontFamily: "var(--font-display, Outfit, sans-serif)", marginTop: "2px" }}>
          {projectsRequiringAttention}
        </div>
        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          Delay Risk / Action Due
        </div>
      </div>

      {/* 5. Pending Evidence Submissions */}
      <div 
        className="metric-card metric-orange" 
        style={{ 
          padding: "18px 20px", 
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.4px" }}>
            Pending Evidence
          </span>
          <div style={{ background: "#ffedd5", padding: "6px 8px", borderRadius: "8px", display: "flex" }}>
            <UploadCloud size={16} color="#ea580c" />
          </div>
        </div>
        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: pendingEvidence > 0 ? "#c2410c" : "var(--text-main)", fontFamily: "var(--font-display, Outfit, sans-serif)", marginTop: "2px" }}>
          {pendingEvidence}
        </div>
        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          Checkpoint Actions Due
        </div>
      </div>
    </div>
  );
};
