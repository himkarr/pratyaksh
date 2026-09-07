/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: ErrorBoundary (Graceful Fallback & Fault Tolerance Boundary)
 * ============================================================================
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Shield } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

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
    console.error("eSAKSHI Uncaught Exception:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleReturnToMinistry = () => {
    try {
      localStorage.removeItem("mplads_active_user");
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
            background: "var(--bg-page)",
            padding: "24px",
            fontFamily: "var(--font-primary)"
          }}
        >
          <div
            style={{
              maxWidth: "560px",
              width: "100%",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-main)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-elevated)",
              overflow: "hidden"
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "var(--gov-header)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: "#ffffff"
              }}
            >
              <img
                src="/assets/emblem_of_india.svg"
                alt="State Emblem of India"
                style={{ height: "40px", width: "auto" }}
              />
              <div>
                <div style={{ fontSize: "0.68rem", color: "#93c5fd", fontWeight: 700, textTransform: "uppercase" }}>
                  Government of India · MoSPI
                </div>
                <div style={{ fontSize: "0.94rem", fontWeight: 800 }}>
                  e-SAKSHI Decision Support System
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--status-danger-text)" }}>
                <AlertTriangle size={24} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
                  Dashboard Interface Error Recovered
                </h3>
              </div>

              <p style={{ fontSize: "0.84rem", color: "var(--text-body)", lineHeight: "1.5", margin: 0 }}>
                A runtime exception occurred while rendering this stakeholder perspective. The system has prevented a blank screen and preserved your session.
              </p>

              {this.state.error && (
                <div
                  style={{
                    background: "var(--bg-surface-subtle)",
                    border: "1px solid var(--border-light)",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-xs)",
                    fontSize: "0.76rem",
                    fontFamily: "monospace",
                    color: "var(--status-danger-text)",
                    maxHeight: "120px",
                    overflowY: "auto"
                  }}
                >
                  {this.state.error.toString()}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                <button
                  onClick={this.handleReset}
                  className="gov-btn gov-btn-primary"
                  style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <RefreshCw size={14} />
                  <span>Reload Perspective</span>
                </button>

                <button
                  onClick={this.handleReturnToMinistry}
                  className="gov-btn gov-btn-secondary"
                  style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Home size={14} />
                  <span>Return to Home</span>
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
