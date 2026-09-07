/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: Header (Top Dark Accessibility & Language Bar)
 * ============================================================================
 */

import React from 'react';
import { Sun, Moon, Globe, Clock } from 'lucide-react';
import { TranslationDict } from '../data/translations';
import { usePreferences, FontScale, ThemeMode, Language } from '../context/PreferencesContext';

interface HeaderProps {
  fontScale?: FontScale;
  setFontScale?: (scale: FontScale) => void;
  theme?: ThemeMode;
  setTheme?: (theme: ThemeMode) => void;
  lang?: Language;
  setLang?: (lang: Language) => void;
  t?: TranslationDict;
}

export function Header(props: HeaderProps) {
  const prefs = usePreferences();
  
  const fontScale = props.fontScale || prefs.fontScale;
  const setFontScale = (scale: FontScale) => {
    prefs.setFontScale(scale);
    if (props.setFontScale) props.setFontScale(scale);
  };

  const theme = props.theme || prefs.theme;
  const setTheme = (mode: ThemeMode) => {
    prefs.setTheme(mode);
    if (props.setTheme) props.setTheme(mode);
  };

  const lang = props.lang || prefs.lang;
  const setLang = (newLang: Language) => {
    prefs.setLang(newLang);
    if (props.setLang) props.setLang(newLang);
  };

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
        background: 'var(--gov-header)',
        color: 'var(--text-white)',
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
            type="button"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-white)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.70rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
          >
            <Globe size={11} color="#38bdf8" />
            <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
          </button>
        </div>

        {/* Right: GIGW Accessibility Text Size (A- | A | A+) & Theme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-white)', fontWeight: 600 }}>
            <button
              type="button"
              onClick={() => setFontScale('sm')}
              style={{
                background: fontScale === 'sm' ? 'rgba(56, 189, 248, 0.2)' : 'none',
                border: fontScale === 'sm' ? '1px solid #38bdf8' : '1px solid transparent',
                borderRadius: '3px',
                padding: '1px 5px',
                color: fontScale === 'sm' ? '#38bdf8' : 'var(--text-white)',
                fontSize: '0.74rem',
                fontWeight: fontScale === 'sm' ? 800 : 500,
                cursor: 'pointer'
              }}
              title="Decrease Text Size (A-)"
            >
              A-
            </button>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.70rem' }}>|</span>
            <button
              type="button"
              onClick={() => setFontScale('base')}
              style={{
                background: fontScale === 'base' ? 'rgba(56, 189, 248, 0.2)' : 'none',
                border: fontScale === 'base' ? '1px solid #38bdf8' : '1px solid transparent',
                borderRadius: '3px',
                padding: '1px 5px',
                color: fontScale === 'base' ? '#38bdf8' : 'var(--text-white)',
                fontSize: '0.78rem',
                fontWeight: fontScale === 'base' ? 800 : 500,
                cursor: 'pointer'
              }}
              title="Standard Text Size (A)"
            >
              A
            </button>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.70rem' }}>|</span>
            <button
              type="button"
              onClick={() => setFontScale('lg')}
              style={{
                background: fontScale === 'lg' ? 'rgba(56, 189, 248, 0.2)' : 'none',
                border: fontScale === 'lg' ? '1px solid #38bdf8' : '1px solid transparent',
                borderRadius: '3px',
                padding: '1px 5px',
                color: fontScale === 'lg' ? '#38bdf8' : 'var(--text-white)',
                fontSize: '0.82rem',
                fontWeight: fontScale === 'lg' ? 800 : 500,
                cursor: 'pointer'
              }}
              title="Increase Text Size (A+)"
            >
              A+
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              padding: '3px 7px',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.70rem',
              fontWeight: 600
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <>
                <Moon size={12} />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun size={12} color="#fbbf24" />
                <span style={{ color: '#fbbf24' }}>Light</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
