/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: Navbar (Primary Scheme Navigation & Stakeholder Status Bar)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * Provides high-contrast, accessible navigation across the 4 primary scheme modules:
 * 1. Overview Dashboard (`dashboard`)
 * 2. Analytics & Trends (`analytics`)
 * 3. Master Works Directory (`works`)
 * 4. Audit & Anomaly Intelligence (`flags` / `audit`)
 * 
 * Also displays the active authenticated perspective badge and direct trigger for
 * the role-switch authentication dialog.
 */

import React from 'react';
import { 
  Landmark, HelpCircle, LogIn, BarChart3, LayoutDashboard, 
  FileText, AlertTriangle, ShieldCheck, BookOpen 
} from 'lucide-react';
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

export function Navbar({ activeTab, setActiveTab, onOpenPolicy, onOpenLogin, t, flagCount }: NavbarProps) {
  const { user } = useRole();

  const roleNames: Record<string, string> = {
    mp: "Hon'ble MP",
    district: "District Authority",
    state_nodal: "State Nodal Authority",
    ministry: "Ministry of Statistics (MoSPI)"
  };

  return (
    <nav style={{
      background: 'var(--bg-surface)',
      borderBottom: '2px solid var(--gov-primary)',
      padding: '8px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-card)'
    }} className="no-print">
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Brand Logo & Scheme Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--gov-primary)',
            color: '#fff',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-dark)'
          }}>
            <Landmark size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '-0.3px',
                color: 'var(--gov-primary)'
              }}>
                MPLADS <span style={{ color: 'var(--gov-accent)' }}>e-SAKSHI Aqua</span>
              </span>
              <span className="gov-badge gov-badge-info" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                National Portal
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Decision-Support, Anomaly & Statutory 1-Year Compliance System
            </p>
          </div>
        </div>

        {/* 4 Core Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          borderBottom: '1px solid var(--border-light)',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`gov-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <LayoutDashboard size={13} />
            <span>{t.dashboard}</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`gov-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <BarChart3 size={13} />
            <span>{t.analytics}</span>
          </button>

          <button
            onClick={() => setActiveTab('works')}
            className={`gov-tab ${activeTab === 'works' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <FileText size={13} />
            <span>{t.worksGrid}</span>
          </button>

          <button
            onClick={() => setActiveTab('flags')}
            className={`gov-tab ${activeTab === 'flags' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <AlertTriangle size={13} color={activeTab === 'flags' ? 'var(--gov-primary)' : 'var(--status-warning-text)'} />
            <span>{t.anomalyFlags}</span>
            {flagCount > 0 && (
              <span className="gov-badge gov-badge-danger" style={{ fontSize: '0.64rem', padding: '1px 4px' }}>
                {flagCount}
              </span>
            )}
          </button>

          {user.role === 'ministry' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`gov-tab ${activeTab === 'audit' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <ShieldCheck size={13} color={activeTab === 'audit' ? 'var(--gov-primary)' : 'var(--status-success-text)'} />
              <span>{t.auditTrail}</span>
            </button>
          )}
        </div>

        {/* Stakeholder Perspective, Guidelines Modal Button & Switch Role Modal Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            paddingRight: '4px',
            fontSize: '0.72rem'
          }}>
            <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
              Perspective
            </span>
            <span style={{ fontWeight: 700, color: 'var(--gov-primary)' }}>
              {roleNames[user.role] || user.name}
            </span>
          </div>

          <button
            onClick={onOpenPolicy}
            className="gov-btn gov-btn-secondary"
            style={{ fontSize: '0.76rem', padding: '5px 10px' }}
            title="Operational Scheme Rules & Statutory Guidelines"
          >
            <BookOpen size={13} />
            <span>Guidelines</span>
          </button>

          <button
            onClick={onOpenLogin}
            className="gov-btn gov-btn-primary"
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
            title="Switch User Role or Authenticate"
          >
            <LogIn size={13} />
            <span>Switch Role</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
