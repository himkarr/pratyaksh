import React, { useMemo, useState, useEffect } from "react";
import { Info } from "lucide-react";

export interface CivicUtilizationGaugeProps {
  utilization: number;
  title?: string;
  cardHeader?: string;
  showInfoIcon?: boolean;
  infoTooltip?: string;
  size?: "sm" | "md" | "lg";
  hideCardWrap?: boolean;
  variant?: "minimal" | "standard";
}

/**
 * Minimalist Civic Utilization Speedometer / Gauge:
 * - Clean, understated track with sophisticated single-gradient progress arc
 * - Avoids loud rainbow color segments in favor of refined civic editorial aesthetic
 * - 5 delicate tick marks & percentage markers (0%, 25%, 50%, 75%, 100%)
 * - Smoothly animated precision needle pointer
 * - Prominent, crisp percentage display and subtle minimalist status pill
 */
export const CivicUtilizationGauge: React.FC<CivicUtilizationGaugeProps> = ({
  utilization = 0,
  title = "Fund Utilization",
  cardHeader = "Fund Utilization",
  showInfoIcon = true,
  infoTooltip = "Ratio of certified expenditure to sanctioned allocation under statutory MPLADS guidelines.",
  size = "md",
  hideCardWrap = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Clamped percentage
  const clampedVal = useMemo(() => {
    const val = Number.isFinite(utilization) ? utilization : 0;
    return Math.max(0, Math.min(100, Math.round(val * 10) / 10));
  }, [utilization]);

  // Dimensions based on size
  const dims = useMemo(() => {
    if (size === "sm") {
      return { width: 260, height: 165, cx: 130, cy: 125, r: 88, stroke: 12, needleLen: 66, fontSize: 26 };
    }
    if (size === "lg") {
      return { width: 380, height: 235, cx: 190, cy: 175, r: 132, stroke: 16, needleLen: 102, fontSize: 34 };
    }
    // md default
    return { width: 310, height: 195, cx: 155, cy: 145, r: 108, stroke: 14, needleLen: 82, fontSize: 30 };
  }, [size]);

  // Target needle angle (-180deg at 0% pointing Left to 0deg at 100% pointing Right)
  const targetAngle = -180 + (clampedVal / 100) * 180;
  const [currentAngle, setCurrentAngle] = useState<number>(-180);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentAngle(targetAngle);
    }, 50);
    return () => clearTimeout(timer);
  }, [targetAngle]);

  // Arc path generator helper for semicircle from Left (0 deg) over Top (90 deg) to Right (180 deg)
  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleDeg: number) => {
      const rad = (angleDeg * Math.PI) / 180;
      return {
        x: centerX - radius * Math.cos(rad),
        y: centerY - radius * Math.sin(rad),
      };
    };

    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", start.x, start.y,
      "A", r, r, 0, largeArcFlag, 1, end.x, end.y,
    ].join(" ");
  };

  // 5 delicate ticks from 0% to 100%
  const ticks = [0, 25, 50, 75, 100];

  // Subtle tone for progress arc & badge
  const getMinimalTheme = (val: number) => {
    if (val >= 75) {
      return {
        label: "High Absorption (≥75%)",
        dotColor: "#059669",
        gradientStart: "#0f766e",
        gradientEnd: "#10b981",
        badgeBg: "#f0fdf4",
        badgeBorder: "#bbf7d0",
        badgeText: "#166534",
      };
    }
    if (val >= 50) {
      return {
        label: "Consistent (50–74%)",
        dotColor: "#0284c7",
        gradientStart: "#1e3a8a",
        gradientEnd: "#0ea5e9",
        badgeBg: "#f0f9ff",
        badgeBorder: "#bae6fd",
        badgeText: "#0369a1",
      };
    }
    if (val >= 35) {
      return {
        label: "Moderate (35–49%)",
        dotColor: "#d97706",
        gradientStart: "#78350f",
        gradientEnd: "#f59e0b",
        badgeBg: "#fffbeb",
        badgeBorder: "#fde68a",
        badgeText: "#92400e",
      };
    }
    return {
      label: "Needs Acceleration (<35%)",
      dotColor: "#dc2626",
      gradientStart: "#450a0a",
      gradientEnd: "#ef4444",
      badgeBg: "#fef2f2",
      badgeBorder: "#fecaca",
      badgeText: "#991b1b",
    };
  };

  const theme = getMinimalTheme(clampedVal);
  const gradId = `minimal-gauge-grad-${dims.width}-${Math.round(clampedVal)}`;

  const gaugeContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        position: "relative",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Optional Card Top Header with Info Icon */}
      {!hideCardWrap && cardHeader && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginBottom: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155", letterSpacing: "0.01em" }}>
              {cardHeader}
            </span>
            {showInfoIcon && (
              <div style={{ position: "relative", display: "inline-flex" }}>
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip((p) => !p)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Fund utilization explanation"
                >
                  <Info size={14} />
                </button>
                {showTooltip && (
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: "100%",
                      transform: "translateX(-50%)",
                      marginBottom: "8px",
                      background: "#0f172a",
                      color: "#f8fafc",
                      padding: "7px 11px",
                      borderRadius: "6px",
                      fontSize: "0.72rem",
                      lineHeight: "1.35",
                      width: "210px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.25)",
                      zIndex: 50,
                      pointerEvents: "none",
                      textAlign: "center",
                    }}
                  >
                    {infoTooltip}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtitle / Title in Clean Header */}
      {title && (
        <h4
          style={{
            margin: "0 0 10px 0",
            fontSize: size === "sm" ? "0.92rem" : "1.02rem",
            fontWeight: 700,
            color: "#1e293b",
            textAlign: "center",
            fontFamily: "var(--font-serif, 'Cormorant Garamond', Georgia, serif)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h4>
      )}

      {/* Minimalist SVG Semicircle Speedometer */}
      <svg
        width={dims.width}
        height={dims.height}
        viewBox={`0 0 ${dims.width} ${dims.height}`}
        style={{
          overflow: "visible",
          transition: "transform 0.25s ease",
          transform: isHovered ? "scale(1.015)" : "scale(1)",
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.gradientStart} />
            <stop offset="100%" stopColor={theme.gradientEnd} />
          </linearGradient>
        </defs>

        {/* Background Minimal Track */}
        <path
          d={describeArc(dims.cx, dims.cy, dims.r, 0, 180)}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={dims.stroke}
          strokeLinecap="round"
        />

        {/* Sleek Filled Progress Arc (0 to clampedVal%) */}
        {clampedVal > 0 && (
          <path
            d={describeArc(dims.cx, dims.cy, dims.r, 0, (clampedVal / 100) * 180)}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={dims.stroke}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1s ease",
              filter: isHovered ? "drop-shadow(0 2px 5px rgba(0,0,0,0.15))" : "none",
            }}
          />
        )}

        {/* Minimal Ticks & Labels (0, 25, 50, 75, 100) */}
        {ticks.map((pct) => {
          const angleDeg = pct * 1.8;
          const rad = (angleDeg * Math.PI) / 180;
          const rInner = dims.r - dims.stroke / 2 - 3;
          const rOuter = dims.r - dims.stroke / 2 - 1;
          const rText = dims.r - dims.stroke - 12;

          const x1 = dims.cx - rInner * Math.cos(rad);
          const y1 = dims.cy - rInner * Math.sin(rad);
          const x2 = dims.cx - rOuter * Math.cos(rad);
          const y2 = dims.cy - rOuter * Math.sin(rad);

          const tx = dims.cx - rText * Math.cos(rad);
          const ty = dims.cy - rText * Math.sin(rad);

          return (
            <g key={pct} style={{ pointerEvents: "none" }}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#94a3b8"
                strokeWidth={pct === 0 || pct === 50 || pct === 100 ? 1.5 : 1}
                strokeOpacity={0.7}
              />
              <text
                x={tx}
                y={ty}
                fontSize={size === "sm" ? "8" : "9.5"}
                fontWeight="500"
                fill="#64748b"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ userSelect: "none" }}
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Slender Minimalist Needle Pointer */}
        <g
          style={{
            transform: `rotate(${currentAngle}deg)`,
            transformOrigin: `${dims.cx}px ${dims.cy}px`,
            transition: "transform 1.1s cubic-bezier(0.34, 1.35, 0.64, 1)",
          }}
        >
          {/* Slender Needle Polygon */}
          <polygon
            points={`${dims.cx},${dims.cy - 2.5} ${dims.cx + dims.needleLen},${dims.cy} ${dims.cx},${dims.cy + 2.5}`}
            fill="#0f172a"
            style={{
              filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
            }}
          />
          {/* Subtle Pivot Base */}
          <circle cx={dims.cx} cy={dims.cy} r={size === "sm" ? 5 : 6} fill="#0f172a" />
          <circle cx={dims.cx} cy={dims.cy} r={size === "sm" ? 2 : 2.5} fill="#ffffff" />
        </g>

        {/* Crisp Bold Percentage Below Needle */}
        <text
          x={dims.cx}
          y={dims.cy + (size === "sm" ? 24 : 28)}
          fontSize={dims.fontSize}
          fontWeight="800"
          fill="#0f172a"
          textAnchor="middle"
          style={{
            fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          {clampedVal.toFixed(1)}%
        </text>
      </svg>

      {/* Understated Minimalist Status Pill */}
      <div
        style={{
          marginTop: "2px",
          padding: "4px 12px",
          borderRadius: "9999px",
          background: theme.badgeBg,
          color: theme.badgeText,
          border: `1px solid ${theme.badgeBorder}`,
          fontSize: "0.74rem",
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.2s ease",
          boxShadow: isHovered ? "0 2px 6px rgba(0,0,0,0.04)" : "none",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: theme.dotColor,
            display: "inline-block",
          }}
        />
        <span>{theme.label}</span>
      </div>
    </div>
  );

  if (hideCardWrap) {
    return gaugeContent;
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: isHovered ? "0 6px 18px -3px rgba(15,23,42,0.06)" : "0 1px 3px rgba(0,0,0,0.03)",
        transition: "all 0.25s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {gaugeContent}
    </div>
  );
};
export default CivicUtilizationGauge;
