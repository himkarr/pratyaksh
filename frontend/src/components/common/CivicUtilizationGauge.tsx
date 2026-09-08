import React, { useMemo } from "react";

interface CivicUtilizationGaugeProps {
  utilization: number;
  title?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Native SVG Semicircle Fund Utilization Gauge matching MoSPI civic design standards:
 * - 0% to 40%: Red zone (Under-utilized)
 * - 40% to 70%: Amber zone (Moderate absorption)
 * - 70% to 100%: Green zone (High absorption)
 * - Pointer needle & smooth vector rendering with no external heavy canvas dependencies.
 */
export const CivicUtilizationGauge: React.FC<CivicUtilizationGaugeProps> = ({
  utilization = 0,
  title = "Fund Utilization",
  size = "md",
}) => {
  const clampedVal = useMemo(() => {
    const val = Number.isFinite(utilization) ? utilization : 0;
    return Math.max(0, Math.min(100, Math.round(val * 10) / 10));
  }, [utilization]);

  // Dimensions based on size
  const dims = useMemo(() => {
    if (size === "sm") {
      return { width: 260, height: 160, cx: 130, cy: 135, r: 90, stroke: 16, needleLen: 65, fontSize: 26 };
    }
    if (size === "lg") {
      return { width: 380, height: 230, cx: 190, cy: 195, r: 135, stroke: 22, needleLen: 105, fontSize: 36 };
    }
    // md default
    return { width: 320, height: 195, cx: 160, cy: 165, r: 115, stroke: 18, needleLen: 88, fontSize: 32 };
  }, [size]);

  // Angle from -180 deg to 0 deg
  const needleAngle = -180 + (clampedVal / 100) * 180;

  // Arc path generator helper for semicircle
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
      return {
        x: centerX + r * Math.cos(angleInRadians),
        y: centerY + r * Math.sin(angleInRadians),
      };
    };

    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, arcSweep, 0, end.x, end.y
    ].join(" ");
  };

  const getStatusText = (val: number) => {
    if (val >= 70) return { label: "Optimal Absorption", color: "#059669", bg: "#dcfce7" };
    if (val >= 40) return { label: "Moderate Utilization", color: "#d97706", bg: "#fef3c7" };
    return { label: "Under-Utilized • Attention Needed", color: "#dc2626", bg: "#fee2e2" };
  };

  const status = getStatusText(clampedVal);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "8px 0" }}>
      {title && (
        <h4 style={{ margin: "0 0 12px 0", fontSize: "1rem", fontWeight: 700, color: "#1e293b", textAlign: "center" }}>
          {title}
        </h4>
      )}

      <svg width={dims.width} height={dims.height} viewBox={`0 0 ${dims.width} ${dims.height}`} style={{ overflow: "visible" }}>
        {/* Background Grey Track */}
        <path
          d={describeArc(dims.cx, dims.cy, dims.r, 0, 180)}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={dims.stroke}
          strokeLinecap="round"
        />

        {/* Red Zone (0% to 40%) -> 0 to 72 deg */}
        <path
          d={describeArc(dims.cx, dims.cy, dims.r, 0, 72)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={dims.stroke}
          strokeLinecap="round"
        />

        {/* Amber Zone (40% to 70%) -> 72 to 126 deg */}
        <path
          d={describeArc(dims.cx, dims.cy, dims.r, 72, 126)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={dims.stroke}
        />

        {/* Emerald Zone (70% to 100%) -> 126 to 180 deg */}
        <path
          d={describeArc(dims.cx, dims.cy, dims.r, 126, 180)}
          fill="none"
          stroke="#10b981"
          strokeWidth={dims.stroke}
          strokeLinecap="round"
        />

        {/* Tick Labels */}
        <text x={dims.cx - dims.r - 8} y={dims.cy + 18} fontSize="11" fill="#64748b" textAnchor="middle" fontWeight="600">0%</text>
        <text x={dims.cx - dims.r * 0.3} y={dims.cy - dims.r * 0.88} fontSize="11" fill="#64748b" textAnchor="middle" fontWeight="600">40%</text>
        <text x={dims.cx + dims.r * 0.3} y={dims.cy - dims.r * 0.88} fontSize="11" fill="#64748b" textAnchor="middle" fontWeight="600">70%</text>
        <text x={dims.cx + dims.r + 8} y={dims.cy + 18} fontSize="11" fill="#64748b" textAnchor="middle" fontWeight="600">100%</text>

        {/* Needle Pointer */}
        <g transform={`rotate(${needleAngle}, ${dims.cx}, ${dims.cy})`}>
          <polygon
            points={`${dims.cx},${dims.cy - 5} ${dims.cx + dims.needleLen},${dims.cy} ${dims.cx},${dims.cy + 5}`}
            fill="#1e293b"
          />
          <circle cx={dims.cx} cy={dims.cy} r="8" fill="#1e293b" />
          <circle cx={dims.cx} cy={dims.cy} r="3" fill="#ffffff" />
        </g>

        {/* Center Percentage */}
        <text
          x={dims.cx}
          y={dims.cy - 12}
          fontSize={dims.fontSize}
          fontWeight="800"
          fill="#0f172a"
          textAnchor="middle"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          {clampedVal.toFixed(1)}%
        </text>

        <text
          x={dims.cx}
          y={dims.cy + 12}
          fontSize="11"
          fontWeight="600"
          fill="#64748b"
          textAnchor="middle"
          letterSpacing="0.5"
          style={{ textTransform: "uppercase" }}
        >
          MoSPI Absorption
        </text>
      </svg>

      {/* Status Pill */}
      <div
        style={{
          marginTop: "6px",
          padding: "4px 14px",
          borderRadius: "9999px",
          background: status.bg,
          color: status.color,
          fontSize: "0.78rem",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          border: `1px solid ${status.color}30`,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.color }} />
        {status.label}
      </div>
    </div>
  );
};
