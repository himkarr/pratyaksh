/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: ErrorBoundary (Stakeholder Switch Portal & Fault Tolerance)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * Prevents blank screens and fatal runtime traps. If an exception occurs in any
 * dashboard or component, this ErrorBoundary catches it and presents the official
 * Stakeholder Switch Portal so the user can immediately switch to any
 * of the official government roles/personas without being blocked.
 */

import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  RotateCcw,
  User,
  Building2,
  Landmark,
  MapPin,
  Award
} from "lucide-react";
import { Role, User as UserType, ALL_ROLES_DEFAULT_USERS } from "../auth/roleContext";

interface Props {
  children: ReactNode;
  activeRole?: Role;
  onSelectRole?: (role: Role, user?: UserType) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface SwitchPortalFormProps {
  initialRole?: Role;
  onSwitch: (role: Role, user?: UserType) => void;
}

const StakeholderSwitchPortalView: React.FC<SwitchPortalFormProps> = ({ initialRole, onSwitch }) => {
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole || "ministry");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("••••••••••••");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Filter available personas for the selected role
  const availableProfiles = ALL_ROLES_DEFAULT_USERS.filter((u) => u.role === selectedRole);

  // Synchronize persona selection when role changes
  useEffect(() => {
    const profiles = ALL_ROLES_DEFAULT_USERS.filter((u) => u.role === selectedRole);
    if (profiles.length > 0) {
      setSelectedProfileId(profiles[0].id);
      setEmail(profiles[0].email);
    } else {
      setSelectedProfileId("");
      setEmail(`official.${selectedRole}@nirikshak.gov.in`);
    }
  }, [selectedRole]);

  const handleProfileChange = (profileId: string) => {
    setSelectedProfileId(profileId);
    const prof = availableProfiles.find((p) => p.id === profileId);
    if (prof) {
      setEmail(prof.email);
    }
  };

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = availableProfiles.find((p) => p.id === selectedProfileId) || availableProfiles[0];
    setIsSuccess(true);
    setTimeout(() => {
      onSwitch(selectedRole, targetUser);
    }, 450);
  };

  const selectedProfile = availableProfiles.find((p) => p.id === selectedProfileId) || availableProfiles[0];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(11, 19, 32, 0.78)",
        backdropFilter: "blur(6px)",
        padding: "20px 16px",
        fontFamily: "var(--font-primary, Outfit, system-ui, sans-serif)",
        boxSizing: "border-box"
      }}
    >
      <div
        className="gov-modal-content"
        style={{
          maxWidth: "470px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          padding: "0",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box"
        }}
      >
        {/* Tricolor Top Bar */}
        <div
          style={{
            height: "4px",
            width: "100%",
            background: "linear-gradient(90deg, #ff9933 0%, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%, #138808 100%)"
          }}
        />

        {/* Modal Inner Container */}
        <div style={{ padding: "26px 30px 28px 30px" }}>
          {isSuccess ? (
            <div
              style={{
                padding: "40px 16px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px"
              }}
            >
              <div
                style={{
                  background: "#ecfdf5",
                  border: "2px solid #059669",
                  padding: "16px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.2)"
                }}
              >
                <CheckCircle2 size={42} color="#059669" />
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "6px 0 0 0" }}>
                Switching Stakeholder Perspective
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#475569", margin: 0 }}>
                Loading workspace for <strong>{selectedProfile?.name || "Official User"}</strong>...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Ministry Branding Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "14px", borderBottom: "1.5px solid #f1f5f9" }}>
                <img 
                  src="/assets/emblem_of_india.svg" 
                  alt="State Emblem of India" 
                  style={{ height: "48px", width: "auto", flexShrink: 0 }}
                />
                <div>
                  <div style={{
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    color: "#64748b",
                    letterSpacing: "0.6px",
                    textTransform: "uppercase"
                  }}>
                    Ministry of Statistics & Programme Implementation
                  </div>
                  <h2 style={{
                    fontSize: "1.35rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "2px 0 0 0",
                    lineHeight: 1.2
                  }}>
                    Stakeholder Switch Portal
                  </h2>
                </div>
              </div>

              {/* Stakeholder Role Dropdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>
                  Select Stakeholder Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value as Role)}
                  className="gov-login-select"
                >
                  <option value="ministry">Ministry of Statistics (MoSPI) / Central Admin</option>
                  <option value="mp">Member of Parliament (Lok Sabha / Rajya Sabha)</option>
                  <option value="district">District Authority (DM / DC)</option>
                  <option value="state_nodal">State Nodal Department</option>
                  <option value="contractor">Contractor / Implementing Agency</option>
                  <option value="field_officer">Field Quality Inspection Officer</option>
                  <option value="citizen">Citizen Transparency Portal</option>
                </select>
              </div>

              {/* Account Persona Selector */}
              {availableProfiles.length > 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>
                    Select Official Persona
                  </label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="gov-login-select"
                    style={{ backgroundColor: "#f8fafc" }}
                  >
                    {availableProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.constituency ? `(${p.constituency}, ${p.state || ""})` : p.district ? `(${p.district}, ${p.state || ""})` : p.state ? `(${p.state})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Email Field */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>
                  Official Email / User ID
                </label>
                <div className="gov-login-input-wrapper">
                  <Mail size={18} className="gov-login-input-icon" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@nirikshak.gov.in"
                    required
                    className="gov-login-input"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>
                  Password
                </label>
                <div className="gov-login-input-wrapper">
                  <Lock size={18} className="gov-login-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="gov-login-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="gov-login-toggle-pw"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Session & Need Help */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.78rem",
                color: "#475569"
              }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: "#0284c7" }} />
                  <span>Remember session</span>
                </label>
                <a
                  href="#help"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("NIC Official Support: Toll-Free 1800-11-2024 / support-pratyaksh@nic.in");
                  }}
                  style={{ color: "#0284c7", fontWeight: 600, textDecoration: "none" }}
                >
                  Need help?
                </a>
              </div>

              {/* Sign In Submit Button */}
              <button
                type="submit"
                className="gov-login-submit"
                style={{
                  marginTop: "6px",
                  padding: "12px 18px",
                  borderRadius: "10px",
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
                  color: "#ffffff",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)",
                  cursor: "pointer"
                }}
              >
                <ShieldCheck size={18} />
                <span>Sign In to Dashboard</span>
              </button>

              {/* Official Security Disclaimer */}
              <div style={{
                marginTop: "4px",
                padding: "10px 14px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <div style={{ color: "#16a34a", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div style={{ fontSize: "0.72rem", color: "#166534", lineHeight: 1.35 }}>
                  Government System: Authorized stakeholder access only. Actions logged with timestamp and IP.
                </div>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

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
    console.error("Pratyaksh Handled Dashboard Fault:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.activeRole !== this.props.activeRole && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  private handleSwitchRole = (targetRole: Role, targetUser?: UserType) => {
    try {
      localStorage.setItem("mplads_active_role", targetRole);
      if (targetUser) {
        localStorage.setItem("mplads_active_user", JSON.stringify(targetUser));
      }
      localStorage.setItem("mplads_authenticated", "true");
    } catch {}

    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onSelectRole) {
      this.props.onSelectRole(targetRole, targetUser);
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <StakeholderSwitchPortalView
          initialRole={this.props.activeRole}
          onSwitch={this.handleSwitchRole}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
