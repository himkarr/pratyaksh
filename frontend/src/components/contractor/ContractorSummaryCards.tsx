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
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", 
        gap: "14px" 
      }}
    >
      {/* 1. Total Assigned Projects */}
      <div 
        className="gov-card" 
        style={{ 
          padding: "16px 18px", 
          display: "flex",
          flexDirection: "column",
          gap: "6px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
            Total Assigned Projects
          </span>
          <div style={{ background: "#fef3c7", padding: "6px", borderRadius: "8px", display: "flex" }}>
            <Building2 size={16} color="#d97706" />
          </div>
        </div>
        <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
          {totalAssigned}
        </div>
        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          Authority Assigned MPLADS Works
        </div>
      </div>

      {/* 2. Active Projects */}
      <div 
        className="gov-card" 
        style={{ 
          padding: "16px 18px", 
          display: "flex",
          flexDirection: "column",
          gap: "6px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
            Active Projects
          </span>
          <div style={{ background: "#e0f2fe", padding: "6px", borderRadius: "8px", display: "flex" }}>
            <Activity size={16} color="#0284c7" />
          </div>
        </div>
        <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#0369a1", marginTop: "2px" }}>
          {activeProjects}
        </div>
        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          In Execution / Field Work
        </div>
      </div>

      {/* 3. Projects On Track */}
      <div 
        className="gov-card" 
        style={{ 
          padding: "16px 18px", 
          display: "flex",
          flexDirection: "column",
          gap: "6px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
            Projects On Track
          </span>
          <div style={{ background: "#dcfce7", padding: "6px", borderRadius: "8px", display: "flex" }}>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
        </div>
        <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#15803d", marginTop: "2px" }}>
          {projectsOnTrack}
        </div>
        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          Meeting Authority Targets
        </div>
      </div>

      {/* 4. Projects Requiring Attention */}
      <div 
        className="gov-card" 
        style={{ 
          padding: "16px 18px", 
          display: "flex",
          flexDirection: "column",
          gap: "6px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
            Requiring Attention
          </span>
          <div style={{ background: "#fee2e2", padding: "6px", borderRadius: "8px", display: "flex" }}>
            <AlertTriangle size={16} color="#dc2626" />
          </div>
        </div>
        <div style={{ fontSize: "1.65rem", fontWeight: 800, color: projectsRequiringAttention > 0 ? "#b91c1c" : "var(--text-main)", marginTop: "2px" }}>
          {projectsRequiringAttention}
        </div>
        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          Delay Risk / Action Due
        </div>
      </div>

      {/* 5. Pending Evidence Submissions */}
      <div 
        className="gov-card" 
        style={{ 
          padding: "16px 18px", 
          display: "flex",
          flexDirection: "column",
          gap: "6px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
            Pending Evidence
          </span>
          <div style={{ background: "#fef3c7", padding: "6px", borderRadius: "8px", display: "flex" }}>
            <UploadCloud size={16} color="#d97706" />
          </div>
        </div>
        <div style={{ fontSize: "1.65rem", fontWeight: 800, color: pendingEvidence > 0 ? "#b45309" : "var(--text-main)", marginTop: "2px" }}>
          {pendingEvidence}
        </div>
        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          Checkpoint Actions Due
        </div>
      </div>
    </div>
  );
};
