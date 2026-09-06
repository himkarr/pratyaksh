import React, { useState } from "react";
import { FileText, MapPin, Clock, CheckCircle2, AlertCircle, Eye, UserCheck, MessageSquare } from "lucide-react";
import { CitizenIssue } from "../../data/citizenData";
import { Card, CardHeader, CardBody, Badge, Button, EmptyState } from "../ui";

export interface IssueTrackerProps {
  issues: CitizenIssue[];
  onSelectIssue?: (issue: CitizenIssue) => void;
}

export const IssueTracker: React.FC<IssueTrackerProps> = ({ issues, onSelectIssue }) => {
  const [selectedIssue, setSelectedIssue] = useState<CitizenIssue | null>(null);

  const getStatusBadge = (status: CitizenIssue["status"]) => {
    switch (status) {
      case "RESOLVED":
        return <Badge variant="success">RESOLVED</Badge>;
      case "INSPECTION_ASSIGNED":
        return <Badge variant="warning">INSPECTION ASSIGNED</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="info">UNDER REVIEW</Badge>;
      case "REJECTED":
        return <Badge variant="danger">REJECTED</Badge>;
      default:
        return <Badge variant="neutral">SUBMITTED</Badge>;
    }
  };

  if (issues.length === 0) {
    return (
      <EmptyState
        title="No Citizen Issues Tracked"
        description="You have not submitted any local project issues or grievances yet."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {issues.map((issue) => (
        <Card key={issue.id}>
          <CardHeader
            title={`Grievance Ref: ${issue.id}`}
            icon={<FileText size={16} />}
            actions={getStatusBadge(issue.status)}
          />

          <CardBody>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <span className="gov-badge gov-badge-neutral" style={{ marginBottom: "4px" }}>
                  {issue.category}
                </span>
                <h4 style={{ fontSize: "0.96rem", fontWeight: 700, color: "var(--gov-primary)", margin: "2px 0 6px 0" }}>
                  {issue.title}
                </h4>
                <p style={{ fontSize: "0.82rem", color: "var(--text-body)", marginBottom: "8px", lineHeight: "1.4" }}>
                  {issue.description}
                </p>

                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={13} /> {issue.locationName} ({issue.district})
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={13} /> Submitted: {issue.dateSubmitted}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Response Box if Available */}
            {issue.officialResponse && (
              <div style={{ marginTop: "12px", padding: "10px 12px", background: "var(--bg-surface-subtle)", borderLeft: "3px solid var(--gov-primary)", borderRadius: "var(--radius-xs)", fontSize: "0.78rem" }}>
                <div style={{ fontWeight: 700, color: "var(--gov-primary)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <MessageSquare size={14} /> Official MoSPI / Nodal Officer Update:
                </div>
                <div style={{ color: "var(--text-main)" }}>{issue.officialResponse}</div>
                {issue.assignedOfficer && (
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <UserCheck size={12} /> Assigned Inspector: <strong>{issue.assignedOfficer}</strong>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

export default IssueTracker;
