import React, { useState } from "react";
import { 
  FileText, MapPin, Clock, CheckCircle2, AlertCircle, 
  MessageSquare, Plus, ChevronRight, ChevronDown, Check, 
  Image as ImageIcon, Calendar, X, Sparkles, Landmark,
  AlertTriangle, Eye, ShieldCheck
} from "lucide-react";
import { CitizenIssue } from "../../data/citizenData";
import { Button, EmptyState } from "../ui";

export interface IssueTrackerProps {
  issues: CitizenIssue[];
  onOpenReportModal?: () => void;
  onOpenRecommendModal?: () => void;
  onSelectWork?: (workId: string) => void;
}

const PROBLEM_STEPS = [
  { id: "submitted", label: "Submitted" },
  { id: "received", label: "Received by DRDA" },
  { id: "inspection_scheduled", label: "Inspection Assigned" },
  { id: "action_taken", label: "Action Taken" },
  { id: "resolved", label: "Resolved" }
];

const RECOMMENDATION_STEPS = [
  { id: "submitted", label: "Submitted by Citizen" },
  { id: "received", label: "Reviewed by MP Office" },
  { id: "inspection_scheduled", label: "Field Feasibility Check" },
  { id: "recommended", label: "Recommended by MP" },
  { id: "sanctioned", label: "Sanctioned under MPLADS" }
];

export const IssueTracker: React.FC<IssueTrackerProps> = ({
  issues,
  onOpenReportModal,
  onOpenRecommendModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"all" | "recommendations" | "reports">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(issues[0]?.id || null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getStepIndex = (issue: CitizenIssue): number => {
    if (issue.type === "work_recommendation") {
      if (issue.status === "RECOMMENDED_BY_MP") return 3;
      if (issue.status === "RESOLVED") return 4;
      if (issue.status === "INSPECTION_ASSIGNED") return 2;
      if (issue.status === "UNDER_REVIEW") return 1;
      return 0;
    }
    if (issue.status === "RESOLVED") return 4;
    if (issue.status === "INSPECTION_ASSIGNED") return 2;
    if (issue.status === "UNDER_REVIEW") return 1;
    if (issue.stage === "action_taken") return 3;
    if (issue.stage === "inspection_scheduled") return 2;
    if (issue.stage === "received") return 1;
    return 0; // submitted
  };

  const getStatusBadge = (issue: CitizenIssue) => {
    if (issue.type === "work_recommendation") {
      switch (issue.status) {
        case "RECOMMENDED_BY_MP":
          return <span className="gov-badge gov-badge-success" style={{ background: "rgba(5, 150, 105, 0.15)", color: "#047857", border: "1px solid #059669" }}>MP Recommended</span>;
        case "RESOLVED":
          return <span className="gov-badge gov-badge-success">Sanctioned</span>;
        case "INSPECTION_ASSIGNED":
          return <span className="gov-badge gov-badge-warning">Feasibility Study</span>;
        case "UNDER_REVIEW":
          return <span className="gov-badge gov-badge-info">MP Reviewing</span>;
        default:
          return <span className="gov-badge gov-badge-neutral">Submitted to MP</span>;
      }
    }
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

  const filteredIssues = issues.filter((issue) => {
    // Sub-tab filter
    if (activeSubTab === "recommendations" && issue.type !== "work_recommendation") return false;
    if (activeSubTab === "reports" && issue.type === "work_recommendation") return false;

    // Status filter
    if (filterStatus === "all") return true;
    if (filterStatus === "recommended") return issue.status === "RECOMMENDED_BY_MP";
    if (filterStatus === "resolved") return issue.status === "RESOLVED";
    if (filterStatus === "inspection") return issue.status === "INSPECTION_ASSIGNED";
    if (filterStatus === "under_review") return issue.status === "UNDER_REVIEW" || issue.status === "SUBMITTED";
    return true;
  });

  const recommendationCount = issues.filter(i => i.type === "work_recommendation").length;
  const reportCount = issues.filter(i => i.type !== "work_recommendation").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", boxSizing: "border-box" }}>
      <style>{`
        .citizen-tracker-header {
          background: var(--bg-surface);
          padding: 16px 18px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-main);
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-sizing: border-box;
        }

        .citizen-tracker-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
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
        <div className="citizen-tracker-top-row">
          <div>
            <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
              My Citizen Submissions & Recommendations ({issues.length})
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Track work recommendation requests submitted to your MP and local grievance reports
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {onOpenRecommendModal && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenRecommendModal}
                icon={<Sparkles size={14} />}
                style={{ background: "#059669", borderColor: "#047857", fontWeight: 700 }}
              >
                Propose Recommendation
              </Button>
            )}
            {onOpenReportModal && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenReportModal}
                icon={<Plus size={14} />}
              >
                Report Problem
              </Button>
            )}
          </div>
        </div>

        {/* Sub-Tabs: All / Recommendations / Reports */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderTop: "1px solid var(--border-light)", paddingTop: "10px" }}>
          <div style={{ display: "inline-flex", background: "var(--bg-surface-subtle)", padding: "3px", borderRadius: "6px", border: "1px solid var(--border-main)" }}>
            <button
              type="button"
              onClick={() => setActiveSubTab("all")}
              style={{
                padding: "4px 12px",
                borderRadius: "4px",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: activeSubTab === "all" ? 700 : 500,
                background: activeSubTab === "all" ? "var(--bg-surface)" : "transparent",
                color: activeSubTab === "all" ? "var(--gov-primary)" : "var(--text-muted)",
                boxShadow: activeSubTab === "all" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer"
              }}
            >
              All Submissions ({issues.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("recommendations")}
              style={{
                padding: "4px 12px",
                borderRadius: "4px",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: activeSubTab === "recommendations" ? 700 : 500,
                background: activeSubTab === "recommendations" ? "var(--bg-surface)" : "transparent",
                color: activeSubTab === "recommendations" ? "#059669" : "var(--text-muted)",
                boxShadow: activeSubTab === "recommendations" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer"
              }}
            >
              MP Work Proposals ({recommendationCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("reports")}
              style={{
                padding: "4px 12px",
                borderRadius: "4px",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: activeSubTab === "reports" ? 700 : 500,
                background: activeSubTab === "reports" ? "var(--bg-surface)" : "transparent",
                color: activeSubTab === "reports" ? "var(--gov-primary)" : "var(--text-muted)",
                boxShadow: activeSubTab === "reports" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer"
              }}
            >
              Problem Reports ({reportCount})
            </button>
          </div>

          {/* Status Filter Pills */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Status" },
              { id: "under_review", label: "In Review" },
              { id: "recommended", label: "MP Recommended" },
              { id: "inspection", label: "Inspection" },
              { id: "resolved", label: "Resolved / Sanctioned" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.72rem",
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
        </div>
      </div>

      {/* List of Submissions */}
      {filteredIssues.length === 0 ? (
        <EmptyState
          title="No Submissions Found"
          description={filterStatus === "all" ? "You have not submitted any proposals or reports yet." : "No submissions match the selected status."}
          action={
            onOpenRecommendModal ? (
              <Button variant="primary" size="md" onClick={onOpenRecommendModal} icon={<Sparkles size={16} />} style={{ background: "#059669", borderColor: "#047857" }}>
                Propose Work Recommendation
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredIssues.map((issue) => {
            const isExpanded = expandedIssueId === issue.id;
            const isRec = issue.type === "work_recommendation";
            const stepIdx = getStepIndex(issue);
            const timelineSteps = isRec ? RECOMMENDATION_STEPS : PROBLEM_STEPS;

            return (
              <div
                key={issue.id}
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${isExpanded ? (isRec ? "#059669" : "var(--gov-accent)") : "var(--border-main)"}`,
                  borderLeft: isRec ? "4px solid #059669" : "4px solid #d97706",
                  overflow: "hidden",
                  transition: "all 0.15s ease",
                  boxShadow: isExpanded ? "var(--shadow-card)" : "none",
                  boxSizing: "border-box"
                }}
              >
                {/* Summary Row */}
                <div
                  onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                  className="citizen-tracker-item-row"
                  style={{
                    background: isExpanded ? "var(--bg-surface-subtle)" : "var(--bg-surface)"
                  }}
                >
                  <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.74rem", fontWeight: 800, color: isRec ? "#059669" : "var(--gov-primary)", fontFamily: "monospace" }}>
                        #{issue.id}
                      </span>
                      {isRec ? (
                        <span className="gov-badge gov-badge-success" style={{ fontSize: "0.64rem", background: "rgba(5, 150, 105, 0.12)", color: "#047857" }}>
                          Work Recommendation to MP
                        </span>
                      ) : (
                        <span className="gov-badge gov-badge-warning" style={{ fontSize: "0.64rem" }}>
                          Problem Report
                        </span>
                      )}
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

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    {getStatusBadge(issue)}
                    {issue.photos && issue.photos.length > 0 && (
                      <span style={{ fontSize: "0.70rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                        <ImageIcon size={13} color="var(--gov-accent)" />
                        {issue.photos.length}
                      </span>
                    )}
                    {isExpanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Expanded Details Dossier */}
                {isExpanded && (
                  <div style={{ padding: "16px", borderTop: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: "16px" }}>
                    
                    {/* Progress Timeline */}
                    <div style={{ background: "var(--bg-surface-subtle)", padding: "14px", borderRadius: "6px", border: "1px solid var(--border-light)" }}>
                      <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--gov-primary)", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                        <span>Submission Lifecycle & Action Stage</span>
                        <span>Stage {stepIdx + 1} of {timelineSteps.length}</span>
                      </div>

                      <div className="citizen-timeline-scroller">
                        {timelineSteps.map((step, idx) => {
                          const isDone = idx <= stepIdx;
                          const isCurrent = idx === stepIdx;

                          return (
                            <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minWidth: "90px", flex: 1, position: "relative" }}>
                              <div
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "50%",
                                  background: isDone ? (isRec ? "#059669" : "var(--gov-primary)") : "var(--border-main)",
                                  color: "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  marginBottom: "4px",
                                  zIndex: 2,
                                  border: isCurrent ? `2px solid ${isRec ? "#34d399" : "var(--gov-accent)"}` : "none"
                                }}
                              >
                                {isDone ? <Check size={12} /> : idx + 1}
                              </div>
                              <span style={{ fontSize: "0.68rem", fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "var(--text-main)" : "var(--text-muted)", lineHeight: 1.2 }}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ground Situation vs Proposed Work Details */}
                    <div style={{ display: "grid", gridTemplateColumns: isRec ? "1fr 1fr" : "1fr", gap: "12px" }}>
                      <div style={{ background: "var(--bg-surface-subtle)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-light)" }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--status-danger-text)", marginBottom: "4px", textTransform: "uppercase" }}>
                          {isRec ? "Current Ground Situation & Damage" : "Issue Description"}
                        </div>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-body)", margin: 0, lineHeight: 1.45 }}>
                          {issue.currentSituation || issue.description}
                        </p>
                      </div>

                      {isRec && (
                        <div style={{ background: "rgba(5, 150, 105, 0.05)", padding: "12px", borderRadius: "6px", border: "1px solid rgba(5, 150, 105, 0.2)" }}>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#047857", marginBottom: "4px", textTransform: "uppercase" }}>
                            Work Requested from Hon'ble MP
                          </div>
                          <p style={{ fontSize: "0.82rem", color: "var(--text-body)", margin: 0, lineHeight: 1.45 }}>
                            {issue.proposedWork || issue.title}
                          </p>
                          {issue.estimatedBeneficiaries && (
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "6px" }}>
                              Beneficiaries: <strong>{issue.estimatedBeneficiaries}</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Attached Photo Evidence Gallery */}
                    {issue.photos && issue.photos.length > 0 && (
                      <div>
                        <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <ImageIcon size={14} color="var(--gov-accent)" />
                          <span>Attached Ground Reality Evidence ({issue.photos.length} Photo{issue.photos.length > 1 ? "s" : ""})</span>
                        </div>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {issue.photos.map((photo) => (
                            <div
                              key={photo.id}
                              onClick={() => setSelectedImage(photo.url)}
                              style={{
                                cursor: "pointer",
                                border: "1px solid var(--border-main)",
                                borderRadius: "6px",
                                overflow: "hidden",
                                width: "160px",
                                background: "var(--bg-surface-subtle)",
                                transition: "transform 0.15s ease"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                              <img
                                src={photo.url}
                                alt={photo.caption || "Evidence"}
                                style={{ width: "100%", height: "95px", objectFit: "cover" }}
                              />
                              <div style={{ padding: "4px 6px", fontSize: "0.68rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {photo.caption || "Site Photo"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Official Response / MP Action Update */}
                    {issue.officialResponse && (
                      <div style={{ background: "rgba(10, 37, 64, 0.05)", borderLeft: "3.5px solid var(--gov-primary)", padding: "10px 14px", borderRadius: "0 6px 6px 0" }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--gov-primary)", marginBottom: "3px" }}>
                          Official Response & Status Note:
                        </div>
                        <p style={{ fontSize: "0.80rem", color: "var(--text-main)", margin: 0, lineHeight: 1.4 }}>
                          {issue.officialResponse}
                        </p>
                        {issue.mpRecommendationId && (
                          <div style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 700, marginTop: "4px" }}>
                            Linked MP Recommendation ID: {issue.mpRecommendationId}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", paddingTop: "8px", borderTop: "1px dashed var(--border-light)" }}>
                      <span>Submitted: <strong>{issue.dateSubmitted}</strong></span>
                      <span>Last Updated: <strong>{issue.lastUpdated}</strong></span>
                      <span>Constituency: <strong>{issue.constituency} ({issue.state})</strong></span>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box"
          }}
        >
          <div style={{ position: "relative", maxWidth: "800px", width: "100%", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Full Evidence"
              style={{ width: "100%", height: "auto", maxHeight: "80vh", objectFit: "contain", borderRadius: "8px" }}
            />
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: "absolute",
                top: "-12px",
                right: "-12px",
                background: "#ffffff",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueTracker;
