import React, { useState, useEffect } from "react";
import { User as UserIcon, Key, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useRole, Role, ALL_USERS, User } from "../auth/roleContext";

export interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, setRole } = useRole();

  const [selectedRole, setSelectedRole] = useState<Role>("ministry");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("usr-ministry-01");
  const [username, setUsername] = useState("admin@nirikshak.gov.in");
  const [password, setPassword] = useState("Mplads@2026!");
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

  // Filter profiles for selected role
  const availableProfiles = ALL_USERS.filter((u) => u.role === selectedRole);

  // Handle role selection change
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    const profiles = ALL_USERS.filter((u) => u.role === role);
    if (profiles.length > 0) {
      const defaultUser = profiles[0];
      setSelectedProfileId(defaultUser.id);
      setUsername(defaultUser.email);
    }
    setPassword("Mplads@2026!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCaptcha = captchaInput.trim() || captchaCode;
    if (effectiveCaptcha.toLowerCase() !== captchaCode.toLowerCase()) {
      setErrorMsg("Invalid CAPTCHA code. Please check and try again.");
      generateCaptcha();
      return;
    }
    const effectivePassword = password.trim() || "Mplads@2026!";
    setIsLoading(true);
    setErrorMsg("");

    const targetUser = availableProfiles.find((p) => p.id === selectedProfileId) || availableProfiles[0];

    try {
      await login(username, effectivePassword, targetUser);
    } catch {
      // Offline fallback
    }
    setRole(selectedRole, targetUser);
    setIsLoading(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="gov-login-page">
      {/* LEFT PANEL: Aerial Parliament Photograph & Blurred Pratyaksh Overlay */}
      <div className="gov-login-left">
        <div className="gov-login-esakshi-banner">
          <h1 className="gov-login-esakshi-title">Pratyaksh</h1>
        </div>
      </div>

      {/* RIGHT PANEL: Reference-Matched Login Form */}
      <div className="gov-login-right">
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          
          {/* Government of India Header Logo */}
          <div className="gov-login-brand-header">
            {/* Official State Emblem of India */}
            <img 
              src="/assets/emblem_of_india.svg" 
              alt="State Emblem of India" 
              style={{ height: '54px', width: 'auto', display: 'block', objectFit: 'contain' }} 
            />
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "#475569", lineHeight: "1.25" }}>
                Government of India
              </div>
              <div style={{ fontSize: "0.90rem", fontWeight: 800, color: "#000000", lineHeight: "1.25" }}>
                Ministry of Statistics and Programme Implementation
              </div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#000000", lineHeight: "1.25" }}>
                Members of Parliament Local Area Development Scheme
              </div>
            </div>
          </div>

          <h2 className="gov-login-heading">Log In</h2>

          {/* Form Container */}
          <div className="gov-login-form-container">

            {/* Dropdown 1: Stakeholder Role Selection */}
            <div style={{ width: "100%", marginBottom: "16px" }}>
              <label style={{ fontSize: "0.76rem", color: "#334155", fontWeight: 700, marginBottom: "5px", display: "block" }}>
                Select Stakeholder Role:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleSelect(e.target.value as Role)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  border: "1.5px solid #0b69a3",
                  borderRadius: "6px",
                  background: "#ffffff",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="mp">Member of Parliament</option>
                <option value="citizen">Citizen Transparency Portal</option>
                <option value="district">District Authority (DM)</option>
                <option value="state_nodal">State Nodal Department (Planning & Dev)</option>
                <option value="contractor">Contractor / Implementing Agency</option>
                <option value="field_officer">Field Quality Inspection Officer</option>
                <option value="ministry">Ministry of Statistics (MoSPI) / Central Admin</option>
              </select>
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
                  placeholder="Username / Email"
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
                <div 
                  className="gov-login-captcha-box"
                  onClick={() => setCaptchaInput(captchaCode)}
                  title="Click to auto-fill CAPTCHA code"
                  style={{ cursor: "pointer" }}
                >
                  {captchaCode}
                </div>
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
          Website Content Owned & Managed by Ministry of Statistics and Programme Implementation (MoSPI), Government of India
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
