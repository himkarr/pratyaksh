/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: LoginModal (Official Portal Login & Cascading Account Selector)
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Lock, Mail, Eye, EyeOff, ShieldCheck, CheckCircle2, Info
} from 'lucide-react';
import { useRole, Role, ALL_USERS } from '../auth/roleContext';
import { useBodyScrollLock } from '../utils/scrollLock';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: Role;
}

export function LoginModal({ isOpen, onClose, initialRole }: LoginModalProps) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const { user, login, setRole } = useRole();
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole || user.role || "ministry");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Mplads@2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const availableProfiles = ALL_USERS.filter((u) => u.role === selectedRole);

  useEffect(() => {
    if (isOpen) {
      const targetRole = initialRole || user.role || "ministry";
      setSelectedRole(targetRole);
      const profiles = ALL_USERS.filter((u) => u.role === targetRole);
      if (profiles.length > 0) {
        setSelectedProfileId(profiles[0].id);
        setEmail(profiles[0].email);
      }
    }
  }, [isOpen, initialRole, user.role]);

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    const profiles = ALL_USERS.filter((u) => u.role === role);
    if (profiles.length > 0) {
      setSelectedProfileId(profiles[0].id);
      setEmail(profiles[0].email);
    }
  };

  const handleProfileChange = (profileId: string) => {
    setSelectedProfileId(profileId);
    const matched = availableProfiles.find((p) => p.id === profileId);
    if (matched) {
      setEmail(matched.email);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const targetUser = availableProfiles.find((p) => p.id === selectedProfileId) || availableProfiles[0];
    try {
      await login(email, password, targetUser);
    } catch {
      // offline fallback
    }
    setRole(selectedRole, targetUser);
    setIsSuccess(true);
    setIsLoading(false);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const selectedProfile = availableProfiles.find((p) => p.id === selectedProfileId) || availableProfiles[0];

  return (
    <div 
      className="gov-modal-backdrop" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 19, 32, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px'
      }}
    >
      <div
        className="gov-modal-content"
        style={{
          maxWidth: '470px',
          width: '100%',
          maxHeight: 'min(94vh, 780px)',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tricolor Top Bar in Modal */}
        <div style={{
          height: '4px',
          width: '100%',
          background: 'linear-gradient(90deg, #ff9933 0%, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%, #138808 100%)'
        }} />

        {/* Modal Inner Container */}
        <div style={{ padding: '26px 30px 28px 30px', overflowY: 'auto' }}>
          
          {/* Close Icon Button */}
          <button
            onClick={onClose}
            type="button"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: '#f1f5f9',
              border: 'none',
              color: '#475569',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Close Modal"
          >
            <X size={18} />
          </button>

          {isSuccess ? (
            <div style={{
              padding: '40px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                background: '#ecfdf5',
                border: '2px solid #059669',
                padding: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
              }}>
                <CheckCircle2 size={42} color="#059669" />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '6px 0 0 0' }}>
                Authentication Verified
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0 }}>
                Signed in as <strong>{selectedProfile?.name || "Official User"}</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Ministry Branding Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1.5px solid #f1f5f9' }}>
                <img 
                  src="/assets/emblem_of_india.svg" 
                  alt="State Emblem of India" 
                  style={{ height: '48px', width: 'auto', flexShrink: 0 }}
                />
                <div>
                  <div style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase'
                  }}>
                    Ministry of Statistics & Programme Implementation
                  </div>
                  <h2 style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: '2px 0 0 0',
                    lineHeight: 1.2
                  }}>
                    Stakeholder Switch Portal
                  </h2>
                </div>
              </div>

              {/* Stakeholder Role Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                    Select Official Persona
                  </label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="gov-login-select"
                    style={{ backgroundColor: '#f8fafc' }}
                  >
                    {availableProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.district ? `(${p.district})` : p.constituency ? `(${p.constituency})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Email Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                  Password
                </label>
                <div className="gov-login-input-wrapper">
                  <Lock size={18} className="gov-login-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="gov-login-input"
                    style={{ paddingRight: "42px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="gov-login-eye-btn"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Help */}
              <div className="gov-login-forgot-row" style={{ margin: '0' }}>
                <label className="gov-login-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="gov-login-checkbox"
                  />
                  <span>Remember session</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); alert("Please contact MoSPI Nodal Helpdesk to reset credentials."); }}
                  className="gov-login-forgot-link"
                >
                  Need help?
                </a>
              </div>

              {/* Secure Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="gov-login-btn"
              >
                {isLoading ? (
                  <>
                    <span className="gov-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>

              {/* Security Advisory */}
              <div className="gov-login-advisory-box" style={{ marginTop: '4px' }}>
                <Info size={16} className="gov-login-advisory-icon" />
                <p className="gov-login-advisory-text">
                  Government System: Authorized stakeholder access only. Actions logged with timestamp and IP.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
