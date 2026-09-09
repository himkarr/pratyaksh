/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: LoginModal (Official Portal Login & Demo Accounts Switcher)
 * ============================================================================
 * 
 * DOMAIN CONTEXT:
 * Re-architected to match official e-SAKSHI & Nirikshak portal aesthetic:
 * - Stately serif typography for official portal login header
 * - Quick Demo Accounts grid (Admin, MoSPI National, UP Nodal, Jabalpur DA, MP, Field, AI, Citizen)
 * - Emerald-teal button with crisp border & shadow
 * - Full backward-compatible role switching and API login
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Lock, Mail, Eye, EyeOff, ShieldCheck, CheckCircle2, 
  ChevronUp, ChevronDown 
} from 'lucide-react';
import { useRole, Role } from '../auth/roleContext';
import { useBodyScrollLock } from '../utils/scrollLock';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: Role;
}

interface DemoAccount {
  id: string;
  name: string;
  role: Role;
  email: string;
  subtext?: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: "admin", name: "Admin (NIC MoSPI)", role: "ministry", email: "admin@nirikshak.gov.in" },
  { id: "mospi_officer", name: "MoSPI National Officer", role: "ministry", email: "national.officer@nirikshak.gov.in" },
  { id: "state_nodal_up", name: "State Nodal Officer (UP)", role: "state_nodal", email: "state.up@nirikshak.gov.in" },
  { id: "district_gurugram", name: "District Authority (Gurugram)", role: "district", email: "district.gurugram@nirikshak.gov.in" },
  { id: "district_rohtak", name: "District Authority (Rohtak)", role: "district", email: "district.rohtak@nirikshak.gov.in" },
  { id: "mp_varanasi", name: "Hon'ble MP (Varanasi)", role: "mp", email: "mp.varanasi@nirikshak.gov.in" },
  { id: "field_inspector", name: "Field Quality Inspector", role: "field_officer", email: "field.inspector@nirikshak.gov.in" },
  { id: "ai_analyst", name: "AI Forensic Analyst", role: "ministry", email: "ai.forensics@nirikshak.gov.in" },
  { id: "citizen_portal", name: "Citizen Transparency Portal", role: "citizen", email: "citizen@nirikshak.gov.in" }
];

export function LoginModal({ isOpen, onClose, initialRole }: LoginModalProps) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const { user, login, setRole } = useRole();
  const [selectedDemoId, setSelectedDemoId] = useState<string>(() => {
    if (initialRole) {
      const match = DEMO_ACCOUNTS.find(d => d.role === initialRole);
      if (match) return match.id;
    }
    const cur = DEMO_ACCOUNTS.find(d => d.role === user.role);
    return cur ? cur.id : "district_gurugram";
  });

  const selectedDemo = DEMO_ACCOUNTS.find(d => d.id === selectedDemoId) || DEMO_ACCOUNTS[3];
  const [email, setEmail] = useState(selectedDemo.email);
  const [password, setPassword] = useState("Mplads@2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isDemoAccordionOpen, setIsDemoAccordionOpen] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const targetRole = initialRole || user.role;
      const match = DEMO_ACCOUNTS.find(d => d.role === targetRole);
      if (match) {
        setSelectedDemoId(match.id);
        setEmail(match.email);
        setPassword("Mplads@2026!");
      }
    }
  }, [isOpen, initialRole, user.role]);

  const handleSelectDemo = (demo: DemoAccount) => {
    setSelectedDemoId(demo.id);
    setEmail(demo.email);
    setPassword("Mplads@2026!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
    } catch {
      // offline fallback
    }
    setRole(selectedDemo.role);
    setIsSuccess(true);
    setIsLoading(false);
    setTimeout(() => {
      onClose();
    }, 400);
  };

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
              Signing in as <strong>{selectedDemo.name}</strong>...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: '4px 0 4px 0',
                letterSpacing: '-0.3px',
                lineHeight: 1.15
              }}>
                Official Portal Login
              </h2>
              <p style={{
                fontSize: '0.84rem',
                color: '#64748b',
                margin: 0
              }}>
                Securely sign in to the MPLADS Risk Intelligence System.
              </p>
            </div>

            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.80rem', fontWeight: 700, color: '#1e293b' }}>
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
                    padding: '10px 14px 10px 36px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.86rem',
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
              <label style={{ fontSize: '0.80rem', fontWeight: 700, color: '#1e293b' }}>
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
                    padding: '10px 36px 10px 36px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.86rem',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.80rem' }}>
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
                onClick={(e) => { e.preventDefault(); alert("For demo access, choose any demo account below."); }}
                style={{ color: '#0d9488', fontWeight: 700, textDecoration: 'none' }}
              >
                Forgot password?
              </a>
            </div>

            {/* Secure Sign In Button (Screenshot 1 Style) */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: '#2ca58d',
                color: '#0f172a',
                border: '2px solid #0f172a',
                borderRadius: '9999px',
                padding: '11px 20px',
                fontSize: '0.94rem',
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
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translate(1px, 2px)';
                e.currentTarget.style.boxShadow = '1px 1px 0px #0f172a';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '2px 3px 0px #0f172a';
              }}
            >
              <ShieldCheck size={18} />
              <span>{isLoading ? "Authenticating..." : "Secure Sign In"}</span>
            </button>

            {/* Demo Accounts (Quick Login) Section */}
            <div style={{ marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsDemoAccordionOpen(!isDemoAccordionOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {isDemoAccordionOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                <span>Demo Accounts (Quick Login)</span>
              </button>

              {isDemoAccordionOpen && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {DEMO_ACCOUNTS.map((demo) => {
                    const isSelected = selectedDemoId === demo.id;
                    return (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => handleSelectDemo(demo)}
                        style={{
                          background: isSelected ? '#2ca58d' : '#f8f7f2',
                          color: isSelected ? '#0f172a' : '#1e293b',
                          border: isSelected ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'center',
                          boxShadow: isSelected ? '1px 2px 0px #0f172a' : 'none',
                          transition: 'all 0.12s ease',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={demo.name}
                      >
                        {demo.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Security Notice Box */}
            <div style={{
              background: '#fcfbf7',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px 14px',
              marginTop: '2px'
            }}>
              <div style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: '#1e3a5f',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Security Notice
              </div>
              <p style={{
                fontSize: '0.72rem',
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
