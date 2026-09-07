/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: ErrorBoundary (Stakeholder Perspective Recovery & Fault Tolerance)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * Prevents blank screens and fatal runtime traps. If an exception occurs in any
 * dashboard or component, this ErrorBoundary catches it and presents an interactive
 * Stakeholder Perspective Switcher so the user can immediately switch to any
 * of the 7 official government roles without being blocked or needing a page reload.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { 
  AlertTriangle, RefreshCw, Home, Shield, User, Landmark, 
  Building2, MapPin, Award, CheckCircle2, ArrowRight, RotateCcw 
} from "lucide-react";
import { Role } from "../auth/roleContext";

interface Props {
  children: ReactNode;
  activeRole?: Role;
  onSelectRole?: (role: Role) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const RECOVERY_ROLES: { id: Role; label: string; desc: string; icon: any }[] = [
  { 
    id: "ministry", 
    label: "Ministry of Statistics (MoSPI)", 
    desc: "National Apex Outlay, AI Anomaly Review & SHA-256 Audit Ledger", 
    icon: Award 
  },
  { 
    id: "mp", 
    label: "Hon'ble Member of Parliament", 
    desc: "Constituency Works, Recommendations & Expenditure Monitoring", 
    icon: Landmark 
  },
  { 
    id: "district", 
    label: "District Authority / DM", 
    desc: "District Sanctions, Geotagged Approvals & Milestone Disbursals", 
    icon: Building2 
  },
  { 
    id: "state_nodal", 
    label: "State Nodal Department", 
    desc: "Statewide Cross-District Compliance & 1-Year Statutory Tracking", 
    icon: MapPin 
  },
  { 
    id: "contractor", 
    label: "Contractor / Implementing Agency", 
    desc: "Construction Progress Updates, Photographic Evidence & MB Extracts", 
    icon: Building2 
  },
  { 
    id: "field_officer", 
    label: "Field Inspection Officer", 
    desc: "Ground Verification of Flagged High-Risk Projects & Evidence Audits", 
    icon: MapPin 
  },
  { 
    id: "citizen", 
    label: "Citizen Portal User", 
    desc: "Public Transparency, Constituency Project Search & Issue Grievances", 
    icon: User 
  }
];

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("eSAKSHI Uncaught Dashboard Exception:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleSwitchRole = (targetRole: Role) => {
    try {
      localStorage.setItem("mplads_active_role", targetRole);
      localStorage.setItem("mplads_authenticated", "true");
    } catch {}

    if (this.props.onSelectRole) {
      this.setState({ hasError: false, error: null, errorInfo: null });
      this.props.onSelectRole(targetRole);
    } else {
      this.setState({ hasError: false, error: null, errorInfo: null });
      window.location.reload();
    }
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleClearAndReload = () => {
    try {
      localStorage.removeItem("mplads_active_role");
      localStorage.removeItem("mplads_active_user");
      localStorage.setItem("mplads_authenticated", "true");
    } catch {}
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-page, #f8fafc)",
            padding: "24px 16px",
            fontFamily: "var(--font-primary, system-ui, sans-serif)"
          }}
        >
          <div
            style={{
              maxWidth: "680px",
              width: "100%",
              background: "var(--bg-surface, #ffffff)",
              border: "1px solid var(--border-main, #cbd5e1)",
              borderRadius: "var(--radius-sm, 8px)",
              boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.05)",
              overflow: "hidden"
            }}
          >
            {/* Official Header */}
            <div
              style={{
                background: "var(--gov-header, #0a2540)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                color: "var(--text-white, #ffffff)"
              }}
            >
              <img
                src="/assets/emblem_of_india.svg"
                alt="State Emblem of India"
                style={{ height: "42px", width: "auto", display: "block" }}
              />
              <div>
                <div style={{ fontSize: "0.68rem", color: "#93c5fd", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Government of India · MoSPI · e-SAKSHI
                </div>
                <div style={{ fontSize: "0.98rem", fontWeight: 800 }}>
                  Stakeholder Perspective Recovery Gateway
                </div>
              </div>
            </div>

            {/* Error Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                padding: "12px 14px",
                borderRadius: "6px",
                color: "#991b1b"
              }}>
                <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <h4 style={{ margin: "0 0 2px 0", fontSize: "0.92rem", fontWeight: 800 }}>
                    Perspective Interface Recovered
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#7f1d1d", lineHeight: 1.4 }}>
                    A rendering exception was prevented from crashing the application. Choose any stakeholder perspective below to switch immediately:
                  </p>
                </div>
              </div>

              {/* Stakeholder Role Switcher Grid */}
              <div>
                <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--gov-primary, #0a2540)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Shield size={13} />
                  <span>Select Stakeholder Role to Switch Between:</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "7px", maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
                  {RECOVERY_ROLES.map((r) => {
                    const Icon = r.icon;
                    const isCurrent = this.props.activeRole === r.id;

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => this.handleSwitchRole(r.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: "6px",
                          border: isCurrent ? "2px solid #155eef" : "1px solid var(--border-light, #e2e8f0)",
                          background: isCurrent ? "#eff6ff" : "var(--bg-surface-subtle, #f8fafc)",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                          gap: "10px"
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) e.currentTarget.style.background = "#f1f5f9";
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) e.currentTarget.style.background = "var(--bg-surface-subtle, #f8fafc)";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            background: isCurrent ? "var(--gov-primary, #0a2540)" : "#e2e8f0",
                            color: isCurrent ? "#ffffff" : "#475569",
                            padding: "6px",
                            borderRadius: "5px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "var(--text-main, #0f172a)" }}>
                              {r.label}
                            </div>
                            <div style={{ fontSize: "0.70rem", color: "var(--text-muted, #64748b)", marginTop: "1px" }}>
                              {r.desc}
                            </div>
                          </div>
                        </div>

                        <span style={{
                          fontSize: "0.70rem",
                          fontWeight: 700,
                          color: "#155eef",
                          background: "#ffffff",
                          border: "1px solid #bfdbfe",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          flexShrink: 0
                        }}>
                          <span>Switch</span>
                          <ArrowRight size={11} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons Strip */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", borderTop: "1px solid var(--border-light, #e2e8f0)", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="gov-btn gov-btn-primary"
                  style={{
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--gov-primary, #0a2540)",
                    color: "#ffffff",
                    border: "none",
                    padding: "7px 14px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 700
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Try Again</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleClearAndReload}
                  className="gov-btn gov-btn-secondary"
                  style={{
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--bg-surface-subtle, #f8fafc)",
                    color: "var(--text-body, #475569)",
                    border: "1px solid var(--border-main, #cbd5e1)",
                    padding: "7px 14px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Reset to Central MoSPI</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
