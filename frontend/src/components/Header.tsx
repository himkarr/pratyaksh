/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: Header (National Government Portal Masthead & GIGW Controls)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & ACCESSIBILITY:
 * --------------------------------
 * Adheres strictly to GIGW 3.0 (Guidelines for Indian Government Websites) and
 * WCAG 2.1 AA accessibility standards:
 * 
 * 1. National Emblem & Bilingual Ministry Branding:
 *    - Ministry of Statistics & Programme Implementation (MoSPI) / सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय.
 * 2. Live IST Timestamp:
 *    - Real-time digital clock synchronized to Indian Standard Time (IST).
 * 3. GIGW Accessibility Bar:
 *    - Text resizing (A- / A / A+) with root font scaling.
 *    - High-contrast Dark / Light theme toggle.
 *    - Bilingual Language Switcher (English / हिन्दी).
 */

import React from 'react';
import { Sun, Moon, Globe, Clock, ShieldCheck } from 'lucide-react';
import { TranslationDict } from '../data/translations';

interface HeaderProps {
  fontScale: 'sm' | 'base' | 'lg';
  setFontScale: (scale: 'sm' | 'base' | 'lg') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  lang: 'en' | 'hi';
  setLang: (lang: 'en' | 'hi') => void;
  t: TranslationDict;
}

export function Header({ fontScale, setFontScale, theme, setTheme, lang, setLang, t: _t }: HeaderProps) {
  const currentTime = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header style={{
      background: 'var(--gov-header)',
      color: '#ffffff',
      borderBottom: '1px solid rgba(255, 255, 255, 0.14)',
      fontSize: '0.78rem',
      padding: '6px 0'
    }} className="no-print">
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Authentic National Emblem & Ministry Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* National Emblem SVG Icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-xs)',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            flexShrink: 0
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L9 7H15L12 2Z" fill="#fbbf24"/>
              <path d="M7 8L4 12H10L8.5 8H7Z" fill="#f59e0b"/>
              <path d="M17 8L15.5 8L14 12H20L17 8Z" fill="#f59e0b"/>
              <circle cx="12" cy="15" r="4" stroke="#ffffff" strokeWidth="1.5"/>
              <path d="M12 13V17M10 15H14" stroke="#ffffff" strokeWidth="1.2"/>
              <path d="M5 20H19V22H5V20Z" fill="#10b981"/>
            </svg>
          </div>

          {/* Bilingual Government Title */}
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                color: '#ffffff',
                textTransform: 'uppercase'
              }}>
                {lang === 'hi' ? 'भारत सरकार' : 'GOVERNMENT OF INDIA'}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.7rem' }}>•</span>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: '#93c5fd'
              }}>
                {lang === 'hi' ? 'सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय' : 'Ministry of Statistics & Programme Implementation (MoSPI)'}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>
              e-SAKSHI Portal · Member of Parliament Local Area Development Scheme
            </div>
          </div>
        </div>

        {/* Accessibility, Language & Utility Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1', fontSize: '0.72rem' }}>
            <Clock size={12} color="#94a3b8" />
            <span>IST: {currentTime}</span>
          </div>

          <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>|</span>

          {/* Text Size Resizer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-xs)',
            padding: '1px 3px',
            gap: '2px',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <button
              onClick={() => setFontScale('sm')}
              style={{
                background: fontScale === 'sm' ? 'rgba(255,255,255,0.25)' : 'transparent',
                color: '#fff',
                padding: '2px 5px',
                borderRadius: '2px',
                fontSize: '0.7rem',
                fontWeight: 600
              }}
              title="Decrease Font Size (A-)"
            >
              A-
            </button>
            <button
              onClick={() => setFontScale('base')}
              style={{
                background: fontScale === 'base' ? 'rgba(255,255,255,0.25)' : 'transparent',
                color: '#fff',
                padding: '2px 5px',
                borderRadius: '2px',
                fontSize: '0.74rem',
                fontWeight: 600
              }}
              title="Standard Font Size (A)"
            >
              A
            </button>
            <button
              onClick={() => setFontScale('lg')}
              style={{
                background: fontScale === 'lg' ? 'rgba(255,255,255,0.25)' : 'transparent',
                color: '#fff',
                padding: '2px 5px',
                borderRadius: '2px',
                fontSize: '0.78rem',
                fontWeight: 700
              }}
              title="Increase Font Size (A+)"
            >
              A+
            </button>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.72rem',
              fontWeight: 700,
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
            title="Switch Language"
          >
            <Globe size={11} />
            <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              padding: '3px 6px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
            title="Toggle High Contrast Theme"
          >
            {theme === 'light' ? <Moon size={12} /> : <Sun size={12} color="#fbbf24" />}
          </button>
        </div>
      </div>
    </header>
  );
}
export default Header;
