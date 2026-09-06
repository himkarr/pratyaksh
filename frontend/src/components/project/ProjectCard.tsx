import React from "react";
import { Landmark, MapPin, Calendar, ArrowRight, FileText } from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { Card, CardHeader, CardBody, CardFooter, Badge, PriorityBadge, Button } from "../ui";

export interface ProjectCardProps {
  project: WorkItem;
  onSelect?: (project: WorkItem) => void;
  showRisk?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  showRisk = true
}) => {
  const formatCurrency = (valInCr: number) => `₹${valInCr.toFixed(2)} Cr`;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Completed": return "success";
      case "Ongoing": return "info";
      case "Delayed": return "danger";
      case "Sanctioned": return "warning";
      default: return "neutral";
    }
  };

  return (
    <Card className="gov-project-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        title={`ID: ${project.id}`}
        icon={<Landmark size={16} />}
        actions={
          <Badge variant={getStatusVariant(project.status)}>
            {project.status.toUpperCase()}
          </Badge>
        }
      />

      <CardBody style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Project Title & Sector */}
        <div>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            {project.sectorName}
          </span>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--gov-primary)", lineHeight: "1.3", margin: "2px 0 6px 0" }}>
            {project.title}
          </h3>
        </div>

        {/* Location & MP Info */}
        <div style={{ fontSize: "0.78rem", color: "var(--text-body)", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={14} color="var(--text-muted)" />
            <span><strong>{project.district}</strong>, {project.state} ({project.constituency})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FileText size={14} color="var(--text-muted)" />
            <span>MP: <strong>{project.mpName}</strong></span>
          </div>
        </div>

        {/* Financial Progress Bars */}
        <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", marginBottom: "4px" }}>
            <span style={{ color: "var(--text-muted)" }}>Sanctioned: <strong>{formatCurrency(project.sanctionedAmt)}</strong></span>
            <span style={{ color: "var(--gov-primary)", fontWeight: 700 }}>Utilized: {formatCurrency(project.expenditureAmt)}</span>
          </div>
          
          <div style={{ width: "100%", background: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.min(project.financialProgress, 100)}%`,
                background: project.financialProgress > 90 ? "var(--status-success-text)" : "var(--gov-accent)",
                height: "100%"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginTop: "4px", color: "var(--text-muted)" }}>
            <span>Physical: <strong>{project.physicalProgress}%</strong></span>
            <span>Financial: <strong>{project.financialProgress}%</strong></span>
          </div>
        </div>

        {/* Risk & Target Date */}
        {showRisk && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "8px" }}>
            <PriorityBadge priority={project.status === "Delayed" ? "PRIORITY_1" : (project.physicalProgress < 50 ? "PRIORITY_2" : "PRIORITY_3")} />
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.74rem", color: "var(--text-muted)" }}>
              <Calendar size={13} />
              <span>Target: {project.targetCompletion}</span>
            </div>
          </div>
        )}
      </CardBody>

      {onSelect && (
        <CardFooter style={{ justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Agency: {project.agency.slice(0, 24)}...</span>
          <Button variant="secondary" size="sm" onClick={() => onSelect(project)}>
            View Details <ArrowRight size={13} />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ProjectCard;
