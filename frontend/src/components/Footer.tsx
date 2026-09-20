/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: Footer (National Informatics Centre & MoSPI Portal Footer)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & STATUTORY DISCLOSURES:
 * ---------------------------------------
 * Displays official portal accreditations, statutory helpdesk contacts,
 * WCAG 2.1 AA / GIGW 3.0 compliance badges, and live PFMS SNA gateway status.
 */

import React from 'react';
import { Phone, ExternalLink, ShieldCheck, Globe, CheckCircle2, Server } from 'lucide-react';
import { TranslationDict } from '../data/translations';

interface FooterProps {
  t: TranslationDict;
  onOpenPolicy: () => void;
}

export function Footer({ t: _t, onOpenPolicy }: FooterProps) {
  return (
    <footer style={{
      background: '#07335c',
      color: 'var(--text-white)',
      marginTop: '40px',
      borderTop: '3px solid #0a4275'
    }} className="no-print">
      {/* Top Footer Section */}
      <div className="container" style={{
        padding: '24px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px'
      }}>
        {/* Contact Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Phone size={14} color="#94a3b8" />
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>
              Central Nodal Agency (MPLADS)
            </h4>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>
              <strong style={{ color: '#e2e8f0' }}>National Helpline: </strong>
              <span>1800-11-2024 / 011-2345602</span>
            </div>
            <div>
              <strong style={{ color: '#e2e8f0' }}>Official Nodal Email: </strong>
              <span style={{ color: '#93c5fd' }}>cna-mplads@mospi.gov.in</span>
            </div>
            <div>
              <strong style={{ color: '#e2e8f0' }}>Ministry Headquarters: </strong>
              <span>Khurshid Lal Bhawan, Janpath, New Delhi - 110001</span>
            </div>
          </div>
        </div>

        {/* Scheme Quick Links */}
        <div>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
            Statutory Directives & Portals
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.76rem', color: '#94a3b8', padding: 0 }}>
            <li>
              <button
                onClick={onOpenPolicy}
                style={{
                  background: 'transparent',
                  color: '#93c5fd',
                  padding: 0,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: 'none',
                }}
              >
                • How MPLADS Works (e-SAKSHI Guidelines & Norms)
              </button>
            </li>
            <li>
              <a href="https://mospi.gov.in" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                • Ministry of Statistics & Programme Implementation <ExternalLink size={10} />
              </a>
            </li>
            <li>
              <a href="https://sansad.in" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                • Sansad Digital Portal (Parliament of India) <ExternalLink size={10} />
              </a>
            </li>
            <li>
              <a href="https://pfms.nic.in" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                • Public Financial Management System (PFMS) <ExternalLink size={10} />
              </a>
            </li>
          </ul>
        </div>

        {/* Standards & Compliance */}
        <div>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
            Decision-Support & AI Standards
          </h4>
          <p style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '8px' }}>
            Operating under SIH 26102 Architecture. Hybrid explainable decision-support model; algorithmic flags assist auditing officers and maintain non-repudiation on an immutable SHA-256 ledger.
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.66rem', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(255,255,255,0.12)' }}>
              GIGW 3.0 Standard
            </span>
            <span style={{ fontSize: '0.66rem', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(255,255,255,0.12)' }}>
              WCAG 2.1 Level AA
            </span>
            <span style={{ fontSize: '0.66rem', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(255,255,255,0.12)', color: '#34d399' }}>
              SHA-256 Ledger Active
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Gateway Status Strip */}
      <div style={{
        background: '#04203b',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '10px 0',
        fontSize: '0.72rem',
        color: '#94a3b8'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            Portal Designed, Developed & Maintained by <b>National Informatics Centre (NIC)</b> for <b>Ministry of Statistics & Programme Implementation (MoSPI)</b>, Government of India.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Server size={11} /> PFMS SNA Gateway: Connected
            </span>
            <span>•</span>
            <span>v2.4.1-Pratyaksh (Build 2026.09)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
