import React, { useState, useEffect } from "react";
import { User as UserIcon, Key, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useRole, Role } from "../auth/roleContext";

export interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, setRole } = useRole();

  const [selectedRole, setSelectedRole] = useState<Role>("ministry");
  const [username, setUsername] = useState("admin.mospi@gov.in");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("er36x");
  const [captchaInput, setCaptchaInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic CAPTCHA Code Generator
  const generateCaptcha = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput("");
    setErrorMsg("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setRole(role);
    switch (role) {
      case "citizen":
        setUsername("citizen.pune@gmail.com");
        break;
      case "mp":
        setUsername("mp.pune@sansad.nic.in");
        break;
      case "contractor":
        setUsername("contractor.infra@agency.gov.in");
        break;
      case "field_officer":
        setUsername("field.pune@nic.in");
        break;
      case "district":
        setUsername("dm.pune@maharashtra.gov.in");
        break;
      case "state_nodal":
        setUsername("nodal.planning@maharashtra.gov.in");
        break;
      default:
        setUsername("admin.mospi@gov.in");
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaInput.trim().toLowerCase() !== captchaCode.toLowerCase()) {
      setErrorMsg("Invalid CAPTCHA code. Please check and try again.");
      generateCaptcha();
      return;
    }
    setIsLoading(true);
    setErrorMsg("");

    try {
      await login(username, password);
      if (onSuccess) onSuccess();
    } catch {
      setErrorMsg("Authentication failed. Please verify your official credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gov-login-page">
      {/* LEFT PANEL: Aerial Parliament Photograph & Blurred eSAKSHI Overlay */}
      <div className="gov-login-left">
        <div className="gov-login-esakshi-banner">
          <h1 className="gov-login-esakshi-title">eSAKSHI</h1>
          <p className="gov-login-esakshi-subtitle">
            SAnsad sadasya sthaniya KSHetra vikas yojana
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Reference-Matched Login Form */}
      <div className="gov-login-right">
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          
          {/* Government of India Header Logo */}
          <div className="gov-login-brand-header">
            {/* Navy Ashoka Emblem SVG */}
            <svg width="40" height="52" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C13.1 2 14 2.9 14 4V6H10V4C10 2.9 10.9 2 12 2Z" fill="#10355c" />
              <path d="M7 7H17V12H7V7Z" fill="#10355c" />
              <path d="M9 13H15V22H9V13Z" fill="#10355c" />
              <path d="M5 23H19V26H5V23Z" fill="#10355c" />
              <circle cx="12" cy="28.5" r="1.5" fill="#10355c" />
            </svg>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10355c", lineHeight: "1.25" }}>
                Government of India
              </div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#10355c", lineHeight: "1.25" }}>
                Ministry of Statistics and Programme Implementation
              </div>
              <div style={{ fontSize: "0.75rem", color: "#10355c", lineHeight: "1.25" }}>
                Members of Parliament Local Area Development Scheme
              </div>
            </div>
          </div>

          <h2 className="gov-login-heading">Log In</h2>

          {/* Form Container */}
          <div className="gov-login-form-container">

            {/* Quick Stakeholder Role Selector (For testing & role-based demo) */}
            <div style={{ width: "100%", marginBottom: "16px" }}>
              <div style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600, marginBottom: "4px", textAlign: "center" }}>
                Active Stakeholder Role:
              </div>
              <div style={{ display: "flex", gap: "4px", justifyContent: "center", flexWrap: "wrap" }}>
                {[
                  { id: "citizen" as Role, label: "Citizen" },
                  { id: "mp" as Role, label: "MP" },
                  { id: "contractor" as Role, label: "Contractor" },
                  { id: "field_officer" as Role, label: "Field Officer" },
                  { id: "district" as Role, label: "District Authority" },
                  { id: "state_nodal" as Role, label: "State Nodal" },
                  { id: "ministry" as Role, label: "Ministry / Admin" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleRoleSelect(item.id)}
                    style={{
                      fontSize: "0.72rem",
                      padding: "3px 8px",
                      borderRadius: "12px",
                      border: "1px solid",
                      borderColor: selectedRole === item.id ? "#10355c" : "#cbd5e1",
                      backgroundColor: selectedRole === item.id ? "#10355c" : "#f8fafc",
                      color: selectedRole === item.id ? "#ffffff" : "#475569",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div style={{ width: "100%", padding: "8px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "6px", fontSize: "0.78rem", marginBottom: "12px", textAlign: "center" }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              
              {/* Username Input Field */}
              <div className="gov-login-input-wrapper">
                <span className="gov-login-input-icon">
                  <UserIcon size={18} />
                </span>
                <input
                  type="text"
                  required
                  className="gov-login-input"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Password Input Field */}
              <div className="gov-login-input-wrapper" style={{ marginBottom: "6px" }}>
                <span className="gov-login-input-icon">
                  <Key size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="gov-login-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: "36px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center"
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <a
                href="#forgot-password"
                className="gov-login-forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Please contact MoSPI Nodal Helpdesk or System Administrator to reset credentials.");
                }}
              >
                Forgot Password?
              </a>

              {/* CAPTCHA Row */}
              <div className="gov-login-captcha-row">
                <div className="gov-login-captcha-box">{captchaCode}</div>
                <button
                  type="button"
                  className="gov-login-captcha-refresh"
                  onClick={generateCaptcha}
                  title="Refresh Captcha"
                  aria-label="Refresh Captcha"
                >
                  <RefreshCw size={20} />
                </button>
                <input
                  type="text"
                  required
                  className="gov-login-captcha-input"
                  placeholder="Captcha"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="gov-login-btn"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>

              {/* Red OTP Warning Notice */}
              <p className="gov-login-otp-note">
                If the OTP is not received via SMS, please check your registered email inbox for the OTP.
              </p>
            </form>
          </div>
        </div>

        {/* Footer Note */}
        <div className="gov-login-footer">
          Copyright ©2024 Tata Consultancy Services Limited. All Rights Reserved
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
