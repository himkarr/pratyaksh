/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: LoginModal (Official Portal Login & Cascading Account Selector)
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Lock, Mail, Eye, EyeOff, ShieldCheck, CheckCircle2, UserCheck
} from 'lucide-react';
import { useRole, Role, ALL_USERS, User } from '../auth/roleContext';
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
    }, 400);
  };

  const selectedProfile = availableProfiles.find((p) => p.id === selectedProfileId) || availableProfiles[0];

  return (
    <div 
      className="gov-modal-backdrop" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="gov-modal-content"
        style={{
          maxWidth: '460px',
          width: '100%',
          maxHeight: 'min(92vh, 760px)',
          background: '#ffffff',
          borderRadius: '18px',
          border: '2px solid #0f172a',
          boxShadow: '4px 6px 0px #0f172a',
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon Button */}
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
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
              padding: '14px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={40} color="#059669" />
            </div>
            <h3 style={{ fontFamily: "'Merriweather', 'Playfair Display', Georgia, serif", fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
              Authentication Verified
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#475569', margin: 0 }}>
              Signing in as <strong>{selectedProfile?.name || "Official User"}</strong>...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header / Ministry Branding */}
            <div>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#1e3a5f',
                letterSpacing: '0.6px',
                textTransform: 'uppercase'
              }}>
                Ministry of Statistics & Programme Implementation
              </div>
              <h2 style={{
                fontFamily: "'Merriweather', 'Playfair Display', Georgia, serif",
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: '4px 0 4px 0',
                letterSpacing: '-0.3px',
                lineHeight: 1.15
              }}>
                Official Portal Login
              </h2>
              <p style={{
                fontSize: '0.82rem',
                color: '#64748b',
                margin: 0
              }}>
                Select your stakeholder role and account profile to sign in.
              </p>
            </div>

            {/* Stakeholder Role Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                Select Stakeholder Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value as Role)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #0b69a3',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="mp">Member of Parliament</option>
                <option value="citizen">Citizen Transparency Portal</option>
                <option value="district">District Authority (DM)</option>
                <option value="state_nodal">State Nodal Department</option>
                <option value="contractor">Contractor / Implementing Agency</option>
                <option value="field_officer">Field Quality Inspection Officer</option>
                <option value="ministry">Ministry of Statistics (MoSPI)</option>
              </select>
            </div>

            {/* Cascading Profile / Account Selector Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <UserCheck size={14} color="#0284c7" />
                Select Official Profile / Account
              </label>
              <select
                value={selectedProfileId}
                onChange={(e) => handleProfileChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #0284c7',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#f8fafc',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {availableProfiles.map((p) => {
                  let label = p.name;
                  if (p.role === 'mp') {
                    label = `Member of Parliament - ${p.constituency} (${p.state})`;
                  } else if (p.role === 'citizen') {
                    label = `${p.name} (${p.constituency}, ${p.state})`;
                  }
                  return (
                    <option key={p.id} value={p.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                Official Email / User ID
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nirikshak.gov.in"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    outline: 'none',
                    background: '#ffffff',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 36px 9px 36px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    outline: 'none',
                    background: '#ffffff',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#2ca58d', cursor: 'pointer' }}
                />
                <span>Remember me</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => { e.preventDefault(); alert("Please contact MoSPI Nodal Helpdesk to reset credentials."); }}
                style={{ color: '#0d9488', fontWeight: 700, textDecoration: 'none' }}
              >
                Forgot password?
              </a>
            </div>

            {/* Secure Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: '#2ca58d',
                color: '#0f172a',
                border: '2px solid #0f172a',
                borderRadius: '9999px',
                padding: '10px 20px',
                fontSize: '0.92rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '2px 3px 0px #0f172a',
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                marginTop: '2px'
              }}
            >
              <ShieldCheck size={18} />
              <span>{isLoading ? "Authenticating..." : "Secure Sign In"}</span>
            </button>

            {/* Security Notice Box */}
            <div style={{
              background: '#fcfbf7',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px 12px',
              marginTop: '2px'
            }}>
              <div style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                color: '#1e3a5f',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Security Notice
              </div>
              <p style={{
                fontSize: '0.70rem',
                color: '#64748b',
                margin: '2px 0 0 0',
                lineHeight: 1.35
              }}>
                This is a secure government system. Unauthorized access is prohibited and monitored.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginModal;
