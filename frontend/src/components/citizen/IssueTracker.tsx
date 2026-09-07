import React, { useState } from "react";
import { 
  FileText, MapPin, Clock, CheckCircle2, AlertCircle, 
  MessageSquare, Plus, ChevronRight, ChevronDown, Check, 
  Image as ImageIcon, Calendar, X
} from "lucide-react";
import { CitizenIssue } from "../../data/citizenData";
import { Button, EmptyState } from "../ui";

export interface IssueTrackerProps {
  issues: CitizenIssue[];
  onOpenReportModal?: () => void;
  onSelectWork?: (workId: string) => void;
}

const TIMELINE_STEPS = [
  { id: "submitted", label: "Submitted" },
  { id: "received", label: "Received" },
  { id: "inspection_scheduled", label: "Inspection Scheduled" },
  { id: "action_taken", label: "Action Taken" },
  { id: "resolved", label: "Resolved" }
];

export const IssueTracker: React.FC<IssueTrackerProps> = ({
  issues,
  onOpenReportModal
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(issues[0]?.id || null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getStepIndex = (issue: CitizenIssue): number => {
    if (issue.status === "RESOLVED") return 4;
    if (issue.status === "INSPECTION_ASSIGNED") return 2;
    if (issue.status === "UNDER_REVIEW") return 1;
    if (issue.stage === "action_taken") return 3;
    if (issue.stage === "inspection_scheduled") return 2;
    if (issue.stage === "received") return 1;
    return 0; // submitted
  };

  const getStatusBadge = (issue: CitizenIssue) => {
    switch (issue.status) {
      case "RESOLVED":
        return <span className="gov-badge gov-badge-success">Resolved</span>;
      case "INSPECTION_ASSIGNED":
        return <span className="gov-badge gov-badge-warning">Inspection Scheduled</span>;
      case "UNDER_REVIEW":
        return <span className="gov-badge gov-badge-info">Received</span>;
      case "REJECTED":
        return <span className="gov-badge gov-badge-danger">Closed</span>;
      default:
        return <span className="gov-badge gov-badge-neutral">Submitted</span>;
    }
  };

  const getStepLabel = (stepIdx: number): string => {
    switch (stepIdx) {
      case 0: return "1/5: Submitted";
      case 1: return "2/5: Received";
      case 2: return "3/5: Inspection Scheduled";
      case 3: return "4/5: Action Taken";
      case 4: return "5/5: Resolved";
      default: return "Submitted";
    }
  };

  const filteredIssues = issues.filter((issue) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "resolved") return issue.status === "RESOLVED";
    if (filterStatus === "inspection") return issue.status === "INSPECTION_ASSIGNED";
    if (filterStatus === "under_review") return issue.status === "UNDER_REVIEW" || issue.status === "SUBMITTED";
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", boxSizing: "border-box" }}>
      <style>{`
        .citizen-tracker-header {
          background: var(--bg-surface);
          padding: 16px 18px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-main);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          box-sizing: border-box;
        }

        .citizen-tracker-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .citizen-tracker-item-row {
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          cursor: pointer;
          box-sizing: border-box;
        }

        .citizen-timeline-scroller {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow-x: auto;
          padding-bottom: 4px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .citizen-timeline-scroller::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 768px) {
          .citizen-tracker-header {
            padding: 12px 14px;
            gap: 10px;
          }
          .citizen-tracker-controls {
            width: 100%;
            justify-content: space-between;
          }
          .citizen-tracker-item-row {
            padding: 12px 12px;
          }
        }
      `}</style>

      {/* Top Header & Filter Bar */}
      <div className="citizen-tracker-header">
        <div>
          <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
            My Reports ({issues.length})
          </h3>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
            Click on any report to view its inspection progress and official updates
          </p>
        </div>

        <div className="citizen-tracker-controls">
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All" },
              { id: "under_review", label: "In Review" },
              { id: "inspection", label: "Inspection" },
              { id: "resolved", label: "Resolved" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.74rem",
                  fontWeight: filterStatus === f.id ? 700 : 500,
                  background: filterStatus === f.id ? "var(--gov-primary)" : "var(--bg-surface-subtle)",
                  color: filterStatus === f.id ? "var(--text-white)" : "var(--text-body)",
                  border: `1px solid ${filterStatus === f.id ? "var(--gov-primary)" : "var(--border-main)"}`,
                  cursor: "pointer"
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {onOpenReportModal && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenReportModal}
              icon={<Plus size={14} />}
              style={{ minHeight: "34px" }}
            >
              Report a Problem
            </Button>
          )}
        </div>
      </div>

      {/* Compact List of Reports */}
      {filteredIssues.length === 0 ? (
        <EmptyState
          title="No Reports Found"
          description={filterStatus === "all" ? "You have not submitted any reports yet." : "No reports match the selected status."}
          action={
            onOpenReportModal ? (
              <Button variant="primary" size="md" onClick={onOpenReportModal} icon={<Plus size={16} />}>
                Report a Problem
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredIssues.map((issue) => {
            const isExpanded = expandedIssueId === issue.id;
            const stepIdx = getStepIndex(issue);

            return (
              <div
                key={issue.id}
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${isExpanded ? "var(--gov-accent)" : "var(--border-main)"}`,
                  overflow: "hidden",
                  transition: "all 0.15s ease",
                  boxShadow: isExpanded ? "var(--shadow-card)" : "none",
                  boxSizing: "border-box"
                }}
              >
                {/* Compact Clickable Summary Row */}
                <div
                  onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                  className="citizen-tracker-item-row"
                  style={{
                    background: isExpanded ? "var(--bg-surface-subtle)" : "var(--bg-surface)"
                  }}
                >
                  <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--gov-primary)" }}>
                        #{issue.id}
                      </span>
                      {issue.category && (
                        <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.66rem" }}>
                          {issue.category}
                        </span>
                      )}
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        &bull; {issue.locationName}
                      </span>
                    </div>

                    <h4 style={{ fontSize: "0.94rem", fontWeight: 700, color: "var(--text-main)", margin: 0, wordBreak: "break-word" }}>
                      {issue.title}
                    </h4>
                  </div>

                  {/* Compact Status & Progress Indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: "0.70rem",
                        fontWeight: 700,
                        color: "var(--gov-accent)",
                        background: "var(--status-info-bg)",
                        padding: "3px 6px",
                        borderRadius: "var(--radius-full)",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px"
                      }}
                    >
                      <Clock size={10} />
                      <span>{getStepLabel(stepIdx)}</span>
                    </div>

                    {getStatusBadge(issue)}

                    {isExpanded ? (
                      <ChevronDown size={16} color="var(--gov-accent)" />
                    ) : (
                      <ChevronRight size={16} color="var(--text-muted)" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Section: Complete 5-Stage Timeline */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "14px 16px",
                      borderTop: "1px solid var(--border-light)",
                      background: "var(--bg-surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      boxSizing: "border-box"
                    }}
                  >
                    {/* Description */}
                    <div>
                      <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>
                        Problem Description
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-body)", margin: 0, lineHeight: 1.45, wordBreak: "break-word" }}>
                        {issue.description}
                      </p>
                    </div>

                    {/* Linked Work info if any */}
                    {issue.linkedWorkId && (
                      <div style={{ fontSize: "0.74rem", color: "var(--status-info-text)", background: "var(--status-info-bg)", padding: "6px 8px", borderRadius: "4px" }}>
                        Related Project: <strong>{issue.linkedWorkTitle || issue.linkedWorkId}</strong>
                      </div>
                    )}

                    {/* Complete 5-Stage Timeline Tracker */}
                    <div
                      style={{
                        background: "var(--bg-surface-subtle)",
                        padding: "12px 14px",
                        borderRadius: "var(--radius-xs)",
                        border: "1px solid var(--border-light)"
                      }}
                    >
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Progress Timeline
                      </div>

                      <div className="citizen-timeline-scroller">
                        {TIMELINE_STEPS.map((step, idx) => {
                          const isCompleted = idx < stepIdx;
                          const isCurrent = idx === stepIdx;

                          return (
                            <div
                              key={step.id}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                flex: 1,
                                minWidth: "75px",
                                position: "relative",
                                textAlign: "center"
                              }}
                            >
                              {/* Step Dot */}
                              <div
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "50%",
                                  background: isCompleted ? "var(--status-success-text)" : (isCurrent ? "var(--gov-accent)" : "var(--border-main)"),
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.66rem",
                                  fontWeight: "bold",
                                  marginBottom: "4px",
                                  zIndex: 2,
                                  boxShadow: isCurrent ? "0 0 0 3px rgba(21, 94, 239, 0.25)" : "none"
                                }}
                              >
                                {isCompleted ? <Check size={11} /> : idx + 1}
                              </div>

                              {/* Label */}
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: isCurrent ? 800 : (isCompleted ? 600 : 400),
                                  color: isCurrent ? "var(--gov-accent)" : (isCompleted ? "var(--text-main)" : "var(--text-muted)")
                                }}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Official Public Update Box */}
                    {issue.officialResponse && (
                      <div
                        style={{
                          padding: "10px 12px",
                          background: "var(--status-info-bg)",
                          borderLeft: "3px solid var(--gov-accent)",
                          borderRadius: "var(--radius-xs)",
                          fontSize: "0.78rem"
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "var(--gov-primary)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                          <MessageSquare size={13} /> Latest Update from Authority:
                        </div>
                        <div style={{ color: "var(--text-main)", lineHeight: 1.4, wordBreak: "break-word" }}>
                          {issue.officialResponse}
                        </div>
                      </div>
                    )}

                    {/* Attached Photo Preview */}
                    {issue.photos && issue.photos.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 600 }}>
                          Attached Photo:
                        </span>
                        {issue.photos.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedImage(p.url)}
                            style={{
                              border: "1px solid var(--border-main)",
                              borderRadius: "4px",
                              padding: "2px",
                              background: "none",
                              cursor: "pointer"
                            }}
                          >
                            <img
                              src={p.url}
                              alt="Evidence thumbnail"
                              style={{ width: "48px", height: "36px", objectFit: "cover", borderRadius: "3px" }}
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                      <span>Submitted: {issue.dateSubmitted}</span>
                      <span>Last updated: {issue.lastUpdated || issue.dateSubmitted}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Image Viewer */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Report Photo"
            style={{ maxWidth: "95%", maxHeight: "85vh", borderRadius: "6px" }}
          />
        </div>
      )}
    </div>
  );
};

export default IssueTracker;
