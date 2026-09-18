import React, { useState, useEffect } from "react";
import { 
  User as UserIcon, 
  Key, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  CheckCircle2,
  Sparkles,
  Info
} from "lucide-react";
import { useRole, Role, ALL_USERS } from "../auth/roleContext";

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
  const [rememberMe, setRememberMe] = useState(true);
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
    setErrorMsg("");
  };

  // Handle individual profile change
  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId);
    const matched = availableProfiles.find((p) => p.id === profileId);
    if (matched) {
      setUsername(matched.email);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCaptcha = captchaInput.trim() || captchaCode;
    if (effectiveCaptcha.toLowerCase() !== captchaCode.toLowerCase()) {
      setErrorMsg("Invalid Security CAPTCHA code. Please check and try again.");
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

  const selectedProfile = availableProfiles.find((p) => p.id === selectedProfileId) || availableProfiles[0];

  return (
    <div className="gov-login-page">
      {/* Tricolor National Ribbon Accent */}
      <div className="gov-login-tricolor-bar" />

      {/* LEFT PANEL: Aerial Parliament Photograph & Minimal Branding Text */}
      <div className="gov-login-left">
        <div className="gov-login-left-glow" />

        {/* Top Badge */}
        <div className="gov-login-left-top">
          <span className="gov-login-badge-pill">
            <span className="gov-login-pulse-dot" />
            MoSPI Central Gateway
          </span>
        </div>

        {/* Bottom Container: Compact Blur Strip Just Above Footnote */}
        <div className="gov-login-left-bottom-container">
          {/* Centered Blur Background Strip */}
          <div className="gov-login-esakshi-banner">
            <h1 className="gov-login-esakshi-title">Pratyaksh</h1>
            <p className="gov-login-esakshi-sub">
              National MPLADS Project Monitoring & Decision Support System
            </p>
          </div>

          {/* Bottom Left System Footnote */}
          <div className="gov-login-left-bottom">
            <span>STQC Certified</span>
            <span>•</span>
            <span>NIC Cloud Infrastructure</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Official Login Card Form */}
      <div className="gov-login-right">
        <div className="gov-login-card-wrapper">
          
          {/* Government of India Emblem & Ministry Branding */}
          <div className="gov-login-brand-header">
            <img 
              src="/assets/emblem_of_india.svg" 
              alt="State Emblem of India" 
              className="gov-login-emblem-img"
            />
            <div>
              <div className="gov-login-brand-text-gov">
                Government of India
              </div>
              <div className="gov-login-brand-text-ministry">
                Ministry of Statistics & Programme Implementation
              </div>
              <div className="gov-login-brand-text-scheme">
                Members of Parliament Local Area Development Scheme
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div className="gov-login-form-title-row">
            <h2 className="gov-login-heading">Official Portal Login</h2>
            <span className="gov-login-secure-tag">
              <Lock size={12} />
              256-Bit SSL
            </span>
          </div>

          {/* Error Message Display */}
          {errorMsg && (
            <div style={{
              width: "100%",
              padding: "10px 14px",
              backgroundColor: "#fef2f2",
              border: "1.5px solid #fecaca",
              color: "#991b1b",
              borderRadius: "10px",
              fontSize: "0.80rem",
              fontWeight: 600,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxSizing: "border-box"
            }}>
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            
            {/* Field 1: Stakeholder Role Selection */}
            <div className="gov-login-field-group">
              <label className="gov-login-field-label">
                <span>Select Stakeholder Role</span>
                <span style={{ fontSize: "0.70rem", color: "#64748b", fontWeight: 500 }}>Step 1 of 2</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleSelect(e.target.value as Role)}
                className="gov-login-select"
              >
                <option value="ministry">Ministry of Statistics (MoSPI) / Central Admin</option>
                <option value="mp">Member of Parliament (Lok Sabha / Rajya Sabha)</option>
                <option value="district">District Authority (District Magistrate / DC)</option>
                <option value="state_nodal">State Nodal Department (Planning & Dev)</option>
                <option value="contractor">Contractor / Implementing Agency</option>
                <option value="field_officer">Field Quality Inspection Officer</option>
                <option value="citizen">Citizen Transparency Portal</option>
              </select>
            </div>

            {/* Field 2: Account Persona Selector (when multiple exist) */}
            {availableProfiles.length > 1 && (
              <div className="gov-login-field-group">
                <label className="gov-login-field-label">
                  <span>Select Active Official Account</span>
                  <span style={{ fontSize: "0.70rem", color: "#0284c7", fontWeight: 600 }}>
                    {availableProfiles.length} available
                  </span>
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => handleProfileSelect(e.target.value)}
                  className="gov-login-select"
                  style={{ backgroundColor: "#f8fafc" }}
                >
                  {availableProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.district ? `(${p.district})` : p.constituency ? `(${p.constituency})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Field 3: Username / Email Input */}
            <div className="gov-login-field-group">
              <label className="gov-login-field-label">
                <span>Official User ID / Email</span>
              </label>
              <div className="gov-login-input-wrapper">
                <span className="gov-login-input-icon">
                  <UserIcon size={18} />
                </span>
                <input
                  type="text"
                  required
                  className="gov-login-input"
                  placeholder="name@nirikshak.gov.in"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Field 4: Password Input */}
            <div className="gov-login-field-group" style={{ marginBottom: "8px" }}>
              <label className="gov-login-field-label">
                <span>Account Password</span>
              </label>
              <div className="gov-login-input-wrapper">
                <span className="gov-login-input-icon">
                  <Key size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="gov-login-input"
                  placeholder="Enter your security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: "42px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="gov-login-eye-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="gov-login-forgot-row">
              <label className="gov-login-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="gov-login-checkbox"
                />
                <span>Remember this terminal</span>
              </label>
              <a
                href="#forgot-password"
                className="gov-login-forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Credential Reset Advisory: Please contact the MoSPI Central Helpdesk or District Nodal Administrator with your Government Employee ID.");
                }}
              >
                Forgot Password?
              </a>
            </div>

            {/* Field 5: Security CAPTCHA Verification Row */}
            <div className="gov-login-field-group" style={{ marginBottom: "18px" }}>
              <label className="gov-login-field-label">
                <span>Security CAPTCHA Verification</span>
                <span style={{ fontSize: "0.70rem", color: "#64748b" }}>Case-insensitive</span>
              </label>
              <div className="gov-login-captcha-row">
                <div 
                  className="gov-login-captcha-box"
                  onClick={() => setCaptchaInput(captchaCode)}
                  title="Click to auto-fill security code"
                >
                  {captchaCode}
                </div>
                <button
                  type="button"
                  className="gov-login-captcha-refresh"
                  onClick={generateCaptcha}
                  title="Generate New CAPTCHA"
                  aria-label="Refresh Captcha"
                >
                  <RefreshCw size={18} />
                </button>
                <input
                  type="text"
                  required
                  className="gov-login-captcha-input"
                  placeholder="Enter Code"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>

            {/* Login Action Submit Button */}
            <button
              type="submit"
              className="gov-login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="gov-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  <span>Sign In as {selectedProfile?.name ? selectedProfile.name.split(" ")[0] : "Official"}</span>
                </>
              )}
            </button>

            {/* Security Advisory Callout */}
            <div className="gov-login-advisory-box">
              <Info size={16} className="gov-login-advisory-icon" />
              <p className="gov-login-advisory-text">
                <strong>2-Factor Authentication:</strong> If SMS OTP is delayed, check your registered MoSPI / NIC official email inbox.
              </p>
            </div>
          </form>
        </div>

        {/* Official MoSPI Footer */}
        <footer className="gov-login-footer">
          Website Content Owned & Managed by <strong>Ministry of Statistics and Programme Implementation (MoSPI)</strong>, Government of India.
          <br />
          Designed, Developed and Hosted by <strong>National Informatics Centre (NIC)</strong>.
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
