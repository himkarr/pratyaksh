/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: PolicyModal (Official Scheme Guidelines & Compliance Directives)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * Renders the statutory policy handbook based on official MoSPI circulars:
 * 
 * KEY POLICY DIRECTIVES:
 * 1. Statutory 1-Year Completion Ceiling:
 *    - All approved works must be completed within 365 calendar days from the sanction order.
 * 2. e-SAKSHI Web-Based Real-Time Fund Flow:
 *    - End-to-end digital lifecycle (Recommendation -> Sanction -> PFMS Disbursal).
 * 3. Mandatory Geotagged Milestone Verification:
 *    - GPS verification before 1st tranche and final payment release.
 * 4. Explainable AI & Cryptographic Auditability:
 *    - Decision-support signals with human-in-the-loop oversight and SHA-256 hash chains.
 */

import React from 'react';
import { X, BookOpen, CheckCircle2 } from 'lucide-react';
import { SCHEME_POLICIES } from '../data/mpladsData';
import { useBodyScrollLock } from '../utils/scrollLock';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PolicyModal({ isOpen, onClose }: PolicyModalProps) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="gov-modal-backdrop" onClick={onClose}>
      <div
        className="gov-modal-content"
        style={{ 
          maxWidth: '720px', 
          maxHeight: 'min(90vh, 720px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '0',
          overscrollBehavior: 'contain'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-subtle)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--gov-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <BookOpen size={15} />
            </div>
            <div>
              <span className="gov-badge gov-badge-info" style={{ fontSize: '0.66rem' }}>
                Operational Framework
              </span>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700 }}>MPLADS & e-SAKSHI Guidelines</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="gov-btn gov-btn-secondary"
            style={{ padding: '4px', width: '28px', height: '28px' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div 
          className="gov-modal-body"
          style={{ 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px', 
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            overscrollBehavior: 'contain'
          }}
        >
          <div style={{
            background: 'var(--bg-surface-subtle)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-main)',
            fontSize: '0.78rem',
            color: 'var(--text-main)',
            lineHeight: 1.45
          }}>
            <strong>Statutory Mandate: </strong>
            {SCHEME_POLICIES.title}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SCHEME_POLICIES.clauses.map((clause, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <h4 style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <CheckCircle2 size={13} color="var(--status-success-text)" />
                  <span>{clause.title}</span>
                </h4>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-body)', lineHeight: 1.4 }}>
                  {clause.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface-subtle)',
          fontSize: '0.74rem'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Ministry of Statistics & Programme Implementation, Government of India
          </span>
          <button onClick={onClose} className="gov-btn gov-btn-primary" style={{ fontSize: '0.76rem', padding: '5px 12px' }}>
            <span>Acknowledge</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export default PolicyModal;
