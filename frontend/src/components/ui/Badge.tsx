import React from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  icon,
  className = ""
}) => {
  const variantClass = `gov-badge-${variant}`;

  return (
    <span className={`gov-badge ${variantClass} ${className}`}>
      {icon}
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: string; className?: string }> = ({
  priority,
  className = ""
}) => {
  let variant: BadgeVariant = "neutral";
  let label = priority;

  switch (priority.toUpperCase()) {
    case "PRIORITY_1":
    case "P1":
    case "HIGH":
      variant = "danger";
      label = priority === "P1" || priority === "PRIORITY_1" ? "PRIORITY 1" : "HIGH RISK";
      break;
    case "PRIORITY_2":
    case "P2":
    case "MEDIUM":
      variant = "warning";
      label = priority === "P2" || priority === "PRIORITY_2" ? "PRIORITY 2" : "MEDIUM RISK";
      break;
    case "PRIORITY_3":
    case "P3":
    case "LOW":
      variant = "success";
      label = priority === "P3" || priority === "PRIORITY_3" ? "PRIORITY 3" : "LOW RISK";
      break;
    default:
      variant = "neutral";
      break;
  }

  return <Badge variant={variant} className={className}>{label}</Badge>;
};

export default Badge;
