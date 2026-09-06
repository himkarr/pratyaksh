/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: Navbar (Clean Government Portal Navigation & Header Masthead)
 * ============================================================================
 * 
 * Visually matches the official e-Governance portal masthead reference:
 * - Left: Official Ashoka Emblem logo & 3-line Ministry title hierarchy
 * - Center/Right: Clean navigation links (Home | Dashboard)
 * - Far Right: Bold Navy Login / Role Switcher Action
 */

import React from 'react';
import { LogIn, LogOut, UserCheck, BookOpen } from 'lucide-react';
import { TranslationDict } from '../data/translations';
import { useRole } from '../auth/roleContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onOpenPolicy: () => void;
  onOpenLogin: () => void;
  t: TranslationDict;
  flagCount: number;
}

export function Navbar({ activeTab, setActiveTab, onOpenPolicy, onOpenLogin, t: _t, flagCount: _flagCount }: NavbarProps) {
  const { user, logout, isAuthenticated } = useRole();

  const roleLabels: Record<string, string> = {
    citizen: "Citizen Portal",
    mp: "Hon'ble MP",
    contractor: "Contractor Agency",
    field_officer: "Field Officer",
    district: "District Authority",
    state_nodal: "State Nodal",
    ministry: "Ministry Admin (MoSPI)"
  };

  return (
    <nav 
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #cbd5e1',
        padding: '10px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(15, 23, 42, 0.04)'
      }} 
      className="no-print"
    >
      <div 
        className="container" 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Left Side: Ashoka Emblem & Official 3-Line Ministry Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Official Ashoka Emblem SVG */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="36" height="42" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2L15 9H25L20 2Z" fill="#1e3a5f"/>
              <path d="M12 10L7 16H17L14.5 10H12Z" fill="#0f2942"/>
              <path d="M28 10L25.5 10L23 16H33L28 10Z" fill="#0f2942"/>
              <circle cx="20" cy="22" r="6" stroke="#0a2540" strokeWidth="2"/>
              <path d="M20 18V26M16 22H24" stroke="#0a2540" strokeWidth="1.5"/>
              <path d="M10 32H30V34H10V32Z" fill="#155eef"/>
              <path d="M6 36H34V40H6V36Z" fill="#0a2540"/>
              <path d="M14 42H26V44H14V42Z" fill="#155eef"/>
            </svg>
          </div>

          {/* Official 3-Line Text Hierarchy */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, lineHeight: 1.25 }}>
              Government of India
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0a2540', lineHeight: 1.3 }}>
              Ministry of Statistics and Programme Implementation
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0a2540', lineHeight: 1.25 }}>
              Members of Parliament Local Area Development Scheme (MPLADS)
            </div>
          </div>
        </div>

        {/* Center / Right: Clean Navigation Links (Home | Dashboard | Guidelines) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.92rem', fontWeight: 600 }}>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'home' ? '#0284c7' : '#64748b',
                fontWeight: activeTab === 'home' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.92rem',
                transition: 'color 0.15s ease'
              }}
            >
              Home
            </button>

            <span style={{ color: '#cbd5e1', fontWeight: 400 }}>|</span>

            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'dashboard' ? '#0284c7' : '#64748b',
                fontWeight: activeTab === 'dashboard' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.92rem',
                transition: 'color 0.15s ease'
              }}
            >
              Dashboard
            </button>

            <span style={{ color: '#cbd5e1', fontWeight: 400 }}>|</span>

            <button
              type="button"
              onClick={onOpenPolicy}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '0.92rem',
                transition: 'color 0.15s ease'
              }}
            >
              Guidelines
            </button>
          </div>

          {/* Far Right Action: LOGIN / ROLE BADGE / LOGOUT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span 
                  className="gov-badge gov-badge-info" 
                  style={{ fontSize: '0.74rem', padding: '3px 8px', textTransform: 'none', fontWeight: 700 }}
                >
                  {roleLabels[user.role] || user.name}
                </span>

                <button
                  type="button"
                  onClick={onOpenLogin}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0a2540',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Switch User Role"
                >
                  <LogIn size={15} />
                  <span>SWITCH ROLE</span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--status-danger-text)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    marginLeft: '4px'
                  }}
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0a2540',
                  fontWeight: 800,
                  fontSize: '1rem',
                  letterSpacing: '0.5px',
                  cursor: 'pointer'
                }}
              >
                LOGIN
              </button>
            )}
          </div>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;
