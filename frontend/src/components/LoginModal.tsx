/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: LoginModal (Multi-Tier Stakeholder RBAC & Authentication Modal)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * Implements the role-based authentication and stakeholder perspective switching gateway
 * conforming to administrative governance tiers:
 * 
 * 1. Member of Parliament (`mp`):
 *    - Constituency level scope (propose works, inspect execution pace).
 * 2. District Authority (`district`):
 *    - District administrative sanctions, photo verification, milestone releases.
 * 3. State Nodal Department (`state_nodal`):
 *    - Statewide cross-district monitoring and 1-year compliance tracking.
 * 4. Ministry of Statistics & Programme Implementation (`ministry`):
 *    - Apex national overview, central AI anomaly review, and SHA-256 ledger auditing.
 * 
 * BACKEND INTEGRATION:
 * - Submits credentials to `POST /auth/login` to obtain an authorized JWT bearer token.
 * - Gracefully falls back to local authenticated state if backend is offline.
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Lock, KeyRound, ShieldAlert, CheckCircle2, UserCheck, User,
  Landmark, Building2, MapPin, Award, ArrowRight, RefreshCw, Shield 
} from 'lucide-react';
import { useRole, Role } from '../auth/roleContext';
import { useBodyScrollLock } from '../utils/scrollLock';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: Role;
}

const SEEDED_CREDENTIALS: Record<Role, { 
  email: string; 
  pass: string; 
  label: string; 
  scopeLabel: string;
  scopeDesc: string;
  icon: any;
}> = {
  citizen: {
    email: "citizen@sapphire.gov.in",
    pass: "Mplads@2026!",
    label: "Citizen Portal User",
    scopeLabel: "Public Citizen Scope",
    scopeDesc: "Submit local issues, track project status, and view constituency MP works.",
    icon: User
  },
  mp: {
    email: "mp@sapphire.gov.in",
    pass: "Mplads@2026!",
    label: "Hon'ble Member of Parliament",
    scopeLabel: "Constituency Scope (Andaman / Anantapur / Varanasi)",
    scopeDesc: "Recommend local area works, monitor physical execution & fund burn rate.",
    icon: Landmark
  },
  contractor: {
    email: "vendor@sapphire.gov.in",
    pass: "Mplads@2026!",
    label: "Contractor / Implementing Agency",
    scopeLabel: "Project Execution Scope",
    scopeDesc: "Update construction progress, upload evidence photos, and submit completion certificates.",
    icon: Building2
  },
  field_officer: {
    email: "fieldofficer@sapphire.gov.in",
    pass: "Mplads@2026!",
    label: "Field Inspection Officer",
    scopeLabel: "Ground Verification Scope",
    scopeDesc: "Conduct physical verification of high-risk projects, capture geotagged evidence, and submit verification reports.",
    icon: MapPin
  },
  district: {
    email: "district@sapphire.gov.in",
    pass: "Mplads@2026!",
    label: "District Authority / DM",
    scopeLabel: "District Implementation Scope",
    scopeDesc: "Issue administrative sanctions, verify geotagged milestone photos, release funds.",
    icon: Building2
  },
  state_nodal: {
    email: "statenodal@sapphire.gov.in",
    pass: "Mplads@2026!",
    label: "State Nodal Department",
    scopeLabel: "Statewide Governance Scope",
    scopeDesc: "Monitor cross-district progress, state fund utilization & 1-year compliance.",
    icon: MapPin
  },
  ministry: {
    email: "ministry@sapphire.gov.in",
    pass: "Mplads@2026!",
    label: "Ministry of Statistics (MoSPI)",
    scopeLabel: "Central Apex Scope & Cryptographic Audit",
    scopeDesc: "National scheme outlay, AI anomaly fraud detection & tamper-evident SHA-256 audit ledger.",
    icon: Award
  }
};

export function LoginModal({ isOpen, onClose, initialRole }: LoginModalProps) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const { user, login, setRole } = useRole();
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole || user.role);
  const [email, setEmail] = useState(SEEDED_CREDENTIALS[initialRole || user.role]?.email || 'mp@sapphire.gov.in');
  const [password, setPassword] = useState('Mplads@2026!');
  const [captchaCode, setCaptchaCode] = useState('k9x3b');
  const [captchaInput, setCaptchaInput] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateCaptcha = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput("");
  };

  useEffect(() => {
    if (isOpen) {
      generateCaptcha();
      const roleToUse = initialRole || user.role;
      setSelectedRole(roleToUse);
      if (SEEDED_CREDENTIALS[roleToUse]) {
        setEmail(SEEDED_CREDENTIALS[roleToUse].email);
        setPassword(SEEDED_CREDENTIALS[roleToUse].pass);
      }
    }
  }, [isOpen, initialRole]);

  useEffect(() => {
    if (SEEDED_CREDENTIALS[selectedRole]) {
      setEmail(SEEDED_CREDENTIALS[selectedRole].email);
      setPassword(SEEDED_CREDENTIALS[selectedRole].pass);
    }
    setErrorMsg('');
  }, [selectedRole]);

  const handleRoleSelect = (roleId: Role) => {
    setSelectedRole(roleId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!password || password.trim().length === 0) {
      setErrorMsg("Password is required. Please enter your departmental password.");
      return;
    }
    if (captchaInput.trim().toLowerCase() !== captchaCode.toLowerCase()) {
      setErrorMsg("Security CAPTCHA verification failed. Please check the characters and try again.");
      generateCaptcha();
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      setRole(selectedRole);
      setIsSuccess(true);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication failed. Invalid password or credentials for the selected role.");
      generateCaptcha();
      setIsLoading(false);
    }
  };

  return (
    <div className="gov-modal-backdrop" onClick={onClose}>
      <div
        className="gov-modal-content"
        style={{
          maxWidth: '540px',
          maxHeight: 'min(90vh, 720px)',
          padding: '0',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border-dark)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          overscrollBehavior: 'contain'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar with Official State Emblem of India */}
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--gov-header)',
          color: '#ffffff',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/assets/emblem_of_india.svg" 
              alt="State Emblem of India" 
              style={{ height: '38px', width: 'auto', display: 'block', objectFit: 'contain' }} 
            />
            <div>
              <div style={{ fontSize: '0.64rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Government of India | MoSPI
              </div>
              <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px', margin: 0 }}>
                Departmental Sign In & Role Authorization
              </h3>
              <p style={{ fontSize: '0.70rem', color: '#cbd5e1', margin: 0 }}>
                e-SAKSHI Decision Support & RBAC Verification Gateway
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              padding: '5px',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          className="gov-modal-body"
          style={{
            padding: '18px',
            background: 'var(--bg-surface)',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            overscrollBehavior: 'contain'
          }}
        >
          {isSuccess ? (
            <div style={{
              padding: '30px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                background: 'var(--status-success-bg)',
                border: '1px solid var(--status-success-border)',
                padding: '12px',
                borderRadius: '50%'
              }}>
                <CheckCircle2 size={36} color="var(--status-success-text)" />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Authentication Successful
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '320px' }}>
                Role permissions applied for <b>{SEEDED_CREDENTIALS[selectedRole].label}</b>. Dashboard scope updated.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Role Grid */}
              <div>
                <label style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: 'var(--gov-primary)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px'
                }}>
                  <UserCheck size={13} />
                  <span>Choose Stakeholder Perspective</span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '7px' }}>
                  {(Object.keys(SEEDED_CREDENTIALS) as Role[]).map((r) => {
                    const info = SEEDED_CREDENTIALS[r];
                    const isSelected = selectedRole === r;
                    const IconComponent = info.icon;

                    return (
                      <div
                        key={r}
                        onClick={() => handleRoleSelect(r)}
                        style={{
                          padding: '9px 12px',
                          borderRadius: 'var(--radius-xs)',
                          textAlign: 'left',
                          border: isSelected ? '2px solid var(--gov-primary)' : '1px solid var(--border-main)',
                          background: isSelected ? 'var(--gov-subtle)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            background: isSelected ? 'var(--gov-primary)' : 'var(--bg-surface-subtle)',
                            color: isSelected ? '#ffffff' : 'var(--text-muted)',
                            padding: '6px',
                            borderRadius: 'var(--radius-xs)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-light)'
                          }}>
                            <IconComponent size={15} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelected ? 'var(--gov-primary)' : 'var(--text-main)' }}>
                              {info.label}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                              {info.scopeDesc}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="gov-badge gov-badge-info" style={{ fontSize: '0.66rem', flexShrink: 0 }}>
                            Active
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Login Credentials Box */}
              <div style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-main)',
                padding: '12px',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-body)', textTransform: 'uppercase' }}>
                    Seeded Account Credentials
                  </span>
                  <span className="gov-badge gov-badge-neutral" style={{ fontSize: '0.64rem' }}>
                    Auto-Filled
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px', display: 'block' }}>
                      Official Email
                    </label>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-main)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.78rem',
                        color: 'var(--text-main)',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px', display: 'block' }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-main)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.78rem',
                        color: 'var(--text-main)',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Security CAPTCHA */}
              <div style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-main)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div>
                  <label style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-body)', display: 'block', marginBottom: '4px' }}>
                    Security CAPTCHA Verification
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div 
                      onClick={() => setCaptchaInput(captchaCode)}
                      title="Click to auto-fill CAPTCHA code"
                      style={{
                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                        color: '#38bdf8',
                        fontFamily: 'monospace',
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        letterSpacing: '5px',
                        padding: '5px 12px',
                        borderRadius: '4px',
                        userSelect: 'none',
                        textDecoration: 'line-through',
                        cursor: 'pointer'
                      }}
                    >
                      {captchaCode}
                    </div>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-light)',
                        padding: '5px 7px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: 'var(--text-muted)'
                      }}
                      title="Refresh CAPTCHA"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '130px' }}>
                  <label style={{ fontSize: '0.70rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Enter Code
                  </label>
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Enter characters"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-main)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.82rem',
                      color: 'var(--text-main)',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              {errorMsg && (
                <div style={{ color: 'var(--status-danger-text)', fontSize: '0.74rem', background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: '4px' }}>
                  {errorMsg}
                </div>
              )}

              {/* Notice */}
              <div style={{
                background: 'var(--bg-surface-subtle)',
                padding: '8px 10px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid var(--border-light)'
              }}>
                <ShieldAlert size={14} color="#92400e" style={{ flexShrink: 0 }} />
                <span>Submitting issues JWT token against <code>/auth/login</code> and scopes all API queries.</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="gov-btn gov-btn-primary"
                style={{
                  width: '100%',
                  padding: '9px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <KeyRound size={14} />
                <span>{isLoading ? 'Verifying Token...' : `Authenticate as ${SEEDED_CREDENTIALS[selectedRole].label.split(' ')[0]}`}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
export default LoginModal;
