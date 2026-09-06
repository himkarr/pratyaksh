/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: Header (Top Dark Accessibility & Language Bar)
 * ============================================================================
 */

import React from 'react';
import { Sun, Moon, Globe, Clock } from 'lucide-react';
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
    <header 
      style={{
        background: '#071224',
        color: '#ffffff',
        fontSize: '0.72rem',
        padding: '3px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
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
          gap: '8px'
        }}
      >
        {/* Left: IST Clock & Language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '0.70rem' }}>
            <Clock size={11} color="#94a3b8" />
            <span>IST: {currentTime}</span>
          </div>

          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              color: '#cbd5e1',
              border: 'none',
              fontSize: '0.70rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Switch Language"
          >
            <Globe size={11} />
            <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
          </button>
        </div>

        {/* Right: GIGW Accessibility Text Size (A- | A | A+) & Theme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontWeight: 600 }}>
            <button
              onClick={() => setFontScale('sm')}
              style={{
                background: 'none',
                border: 'none',
                color: fontScale === 'sm' ? '#38bdf8' : '#ffffff',
                fontSize: '0.74rem',
                fontWeight: fontScale === 'sm' ? 800 : 500,
                cursor: 'pointer'
              }}
              title="Decrease Text Size"
            >
              A-
            </button>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.70rem' }}>|</span>
            <button
              onClick={() => setFontScale('base')}
              style={{
                background: 'none',
                border: 'none',
                color: fontScale === 'base' ? '#38bdf8' : '#ffffff',
                fontSize: '0.78rem',
                fontWeight: fontScale === 'base' ? 800 : 500,
                cursor: 'pointer'
              }}
              title="Normal Text Size"
            >
              A
            </button>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.70rem' }}>|</span>
            <button
              onClick={() => setFontScale('lg')}
              style={{
                background: 'none',
                border: 'none',
                color: fontScale === 'lg' ? '#38bdf8' : '#ffffff',
                fontSize: '0.82rem',
                fontWeight: fontScale === 'lg' ? 800 : 500,
                cursor: 'pointer'
              }}
              title="Increase Text Size"
            >
              A+
            </button>
          </div>

          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
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
