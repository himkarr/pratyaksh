import React from "react";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "md", label = "Loading...", className = "" }) => {
  const dimensions = {
    sm: "16px",
    md: "24px",
    lg: "36px"
  }[size];

  return (
    <div
      style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
      className={className}
      role="status"
    >
      <span
        className="gov-spinner"
        style={{ width: dimensions, height: dimensions }}
        aria-hidden="true"
      />
      {label && <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{label}</span>}
    </div>
  );
};

export interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "16px",
  className = "",
  style
}) => {
  return (
    <div
      className={`gov-skeleton ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
};

export default Spinner;
