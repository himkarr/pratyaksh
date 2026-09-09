import React, { useMemo, useState, useEffect } from "react";
import { Info } from "lucide-react";

interface CivicUtilizationGaugeProps {
  utilization: number;
  title?: string;
  cardHeader?: string;
  showInfoIcon?: boolean;
  infoTooltip?: string;
  size?: "sm" | "md" | "lg";
  hideCardWrap?: boolean;
}

/**
 * High-Fidelity SVG Semicircle Speedometer/Gauge matching Civic Reference Architecture:
 * - 5 Continuous Color Zones: Red (0-20%), Orange (20-40%), Yellow (40-60%), Amber (60-80%), Green (80-100%)
 * - 11 inner tick marks & labels: 0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%
 * - Smoothly animated tapered needle with dynamic sweep on load and update
 * - Prominent bold percentage below the needle
 * - Interactive hover effects and info tooltip
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
      return { width: 280, height: 180, cx: 140, cy: 135, r: 95, stroke: 16, needleLen: 70, fontSize: 28 };
    }
    if (size === "lg") {
      return { width: 420, height: 260, cx: 210, cy: 195, r: 145, stroke: 22, needleLen: 112, fontSize: 38 };
    }
    // md default
    return { width: 340, height: 220, cx: 170, cy: 160, r: 120, stroke: 18, needleLen: 92, fontSize: 34 };
  }, [size]);

  // Target needle angle (-180deg at 0% pointing Left to 0deg at 100% pointing Right)
  const targetAngle = -180 + (clampedVal / 100) * 180;
  const [currentAngle, setCurrentAngle] = useState<number>(-180);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentAngle(targetAngle);
    }, 60);
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

  // 5 continuous colored segments (0-20%, 20-40%, 40-60%, 60-80%, 80-100%)
  const segments = [
    { name: "Critical (0-20%)", start: 0, end: 36, color: "#ef4444", hoverColor: "#dc2626" },   // Red
    { name: "Low (20-40%)", start: 36, end: 72, color: "#f97316", hoverColor: "#ea580c" },       // Orange
    { name: "Moderate (40-60%)", start: 72, end: 108, color: "#eab308", hoverColor: "#ca8a04" },  // Yellow
    { name: "Steady (60-80%)", start: 108, end: 144, color: "#f59e0b", hoverColor: "#d97706" },  // Amber
    { name: "High (80-100%)", start: 144, end: 180, color: "#10b981", hoverColor: "#059669" },  // Green
  ];

  // 11 ticks from 0% to 100%
  const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const getStatusText = (val: number) => {
    if (val >= 80) return { label: "High Absorption (≥80%)", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" };
    if (val >= 60) return { label: "Consistent (60–79%)", color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" };
    if (val >= 40) return { label: "Moderate (40–59%)", color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
    return { label: "Low Absorption (<40%)", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
  };

  const status = getStatusText(clampedVal);

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
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
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
                    color: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Fund utilization explanation"
                >
                  <Info size={15} />
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
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "0.74rem",
                      lineHeight: "1.35",
                      width: "220px",
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

      {/* Subtitle / Title in Serif Header */}
      {title && (
        <h4
          style={{
            margin: "0 0 14px 0",
            fontSize: "1.1rem",
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

      {/* SVG Semicircle Speedometer */}
      <svg
        width={dims.width}
        height={dims.height}
        viewBox={`0 0 ${dims.width} ${dims.height}`}
        style={{
          overflow: "visible",
          transition: "transform 0.3s ease",
          transform: isHovered ? "scale(1.02)" : "scale(1)",
        }}
      >
        {/* Background Subtle Track */}
        <path
          d={describeArc(dims.cx, dims.cy, dims.r, 0, 180)}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={dims.stroke + 4}
          strokeLinecap="round"
        />

        {/* 5 Continuous Color Arc Segments with interactive hover glow */}
        {segments.map((seg, idx) => {
          const isSegActive = hoveredSegment === seg.name;
          return (
            <path
              key={idx}
              d={describeArc(dims.cx, dims.cy, dims.r, seg.start, seg.end)}
              fill="none"
              stroke={isSegActive ? seg.hoverColor : seg.color}
              strokeWidth={isSegActive ? dims.stroke + 3 : dims.stroke}
              strokeLinecap={idx === 0 || idx === segments.length - 1 ? "round" : "butt"}
              style={{
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                filter: isSegActive 
                  ? "drop-shadow(0 4px 8px rgba(0,0,0,0.22))" 
                  : isHovered 
                  ? "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" 
                  : "none",
              }}
              onMouseEnter={() => setHoveredSegment(seg.name)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <title>{seg.name}</title>
            </path>
          );
        })}

        {/* 11 Ticks & Percentage Labels: 0% (Left) to 100% (Right) */}
        {ticks.map((pct) => {
          const angleDeg = pct * 1.8;
          const rad = (angleDeg * Math.PI) / 180;
          const rInner = dims.r - dims.stroke / 2 - 4;
          const rOuter = dims.r - dims.stroke / 2 - 1;
          const rText = dims.r - dims.stroke - 13;

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
                stroke="#64748b"
                strokeWidth={pct % 20 === 0 ? 1.5 : 1}
                strokeOpacity={0.7}
              />
              <text
                x={tx}
                y={ty}
                fontSize={size === "sm" ? "8.5" : "10"}
                fontWeight="600"
                fill="#475569"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ userSelect: "none" }}
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Animated Needle Pointer */}
        <g
          style={{
            transform: `rotate(${currentAngle}deg)`,
            transformOrigin: `${dims.cx}px ${dims.cy}px`,
            transition: "transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
            filter: isHovered ? "drop-shadow(0 4px 6px rgba(0,0,0,0.35))" : "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
          }}
        >
          {/* Tapered Pointer Needle */}
          <polygon
            points={`${dims.cx},${dims.cy - 4} ${dims.cx + dims.needleLen},${dims.cy} ${dims.cx},${dims.cy + 4}`}
            fill="#0f172a"
            style={{
              filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
            }}
          />
          {/* Pivot Base Circles */}
          <circle cx={dims.cx} cy={dims.cy} r={size === "sm" ? 6 : 8} fill="#0f172a" />
          <circle cx={dims.cx} cy={dims.cy} r={size === "sm" ? 2.5 : 3} fill="#ffffff" />
        </g>

        {/* Big Bold Percentage Below Needle */}
        <text
          x={dims.cx}
          y={dims.cy + (size === "sm" ? 28 : 34)}
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

      {/* Interactive Status Pill */}
      <div
        style={{
          marginTop: "4px",
          padding: "5px 14px",
          borderRadius: "9999px",
          background: status.bg,
          color: status.color,
          border: `1px solid ${status.border}`,
          fontSize: "0.76rem",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.2s ease",
          boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: status.color,
            display: "inline-block",
          }}
        />
        <span>{status.label}</span>
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
        borderRadius: "14px",
        padding: "20px",
        boxShadow: isHovered ? "0 8px 24px -4px rgba(15,23,42,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
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
