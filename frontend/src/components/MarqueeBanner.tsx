import React, { useState } from 'react';
import { Megaphone, Pause, Play, BookOpen } from 'lucide-react';
import { TranslationDict } from '../data/translations';

interface MarqueeBannerProps {
  t?: TranslationDict;
  onOpenPolicy: () => void;
}

const DIRECTIVES = [
  {
    id: "dir-1",
    tag: "STATUTORY DIRECTIVE",
    text: "Mandatory 1-Year Work Completion Ceiling: All works sanctioned under MPLADS must be completed within 365 calendar days from administrative sanction date (MoSPI Scheme Circular No. 12/2024)."
  },
  {
    id: "dir-2",
    tag: "PRATYAKSH MANDATE",
    text: "End-to-End Online Fund Flow: Recommendations, administrative sanctions, and milestone expenditure releases are processed exclusively on the Pratyaksh digital platform."
  },
  {
    id: "dir-3",
    tag: "GEOTAGGED VERIFICATION",
    text: "Mandatory Milestone Photos: Implementing agencies must upload geotagged, timestamped site photos (Pre-work, Mid-stage, and Post-completion) prior to payment tranche approvals."
  },
  {
    id: "dir-4",
    tag: "AI DECISION SUPPORT",
    text: "Explainable Anomaly Detection: Algorithmic flags serve as transparent review signals for audit officers and are cryptographically recorded to an immutable SHA-256 ledger."
  }
];

export function MarqueeBanner({ onOpenPolicy }: MarqueeBannerProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Render continuous list duplicated once for seamless infinite loop with zero whitespace
  const items = [...DIRECTIVES, ...DIRECTIVES];

  return (
    <div
      className="marquee-banner no-print"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        background: 'var(--gov-subtle)',
        borderBottom: '1px solid var(--border-main)',
        padding: '5px 0',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        {/* Static Badge on the left */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--gov-primary)',
          color: 'var(--text-white)',
          padding: '3px 8px',
          borderRadius: 'var(--radius-xs)',
          fontSize: '0.68rem',
          fontWeight: 800,
          letterSpacing: '0.4px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          zIndex: 2,
          boxShadow: 'var(--shadow-card)'
        }}>
          <Megaphone size={12} color="#fbbf24" />
          <span>DIRECTIVES</span>
        </div>

        {/* Seamless Continuous Scrolling Track - Zero Whitespace */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={onOpenPolicy}
          title="Click to view full scheme guidelines circular"
        >
          <div
            className="gov-marquee-track"
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '24px'
            }}
          >
            {items.map((d, index) => (
              <span key={`${d.id}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span className="gov-badge gov-badge-info" style={{ fontSize: '0.64rem', padding: '1px 5px', fontWeight: 800 }}>
                  {d.tag}
                </span>
                <span>{d.text}</span>
                <span style={{ color: 'var(--gov-accent)', fontWeight: 800 }}>•</span>
              </span>
            ))}
          </div>
        </div>

        {/* Directive Ticker Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, zIndex: 2 }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="gov-btn gov-btn-secondary"
            style={{ padding: '2px 6px', fontSize: '0.68rem', height: '22px' }}
            title={isPaused ? "Resume Ticker Scroll" : "Pause Ticker Scroll"}
          >
            {isPaused ? <Play size={10} color="var(--gov-primary)" /> : <Pause size={10} />}
          </button>

          <button
            onClick={onOpenPolicy}
            className="gov-btn gov-btn-secondary"
            style={{
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--gov-accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              height: '22px'
            }}
          >
            <BookOpen size={11} />
            <span>Guidelines</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export default MarqueeBanner;
