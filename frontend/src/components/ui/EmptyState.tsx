import React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Records Found",
  description = "There are currently no items matching your criteria or scope.",
  icon,
  action,
  className = ""
}) => {
  return (
    <div
      style={{
        padding: "36px 20px",
        textAlign: "center",
        background: "var(--bg-surface-subtle)",
        border: "1px dashed var(--border-main)",
        borderRadius: "var(--radius-sm)",
        margin: "12px 0"
      }}
      className={className}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          color: "var(--text-muted)",
          marginBottom: "12px"
        }}
      >
        {icon || <FolderOpen size={24} aria-hidden="true" />}
      </div>
      <h4 style={{ fontSize: "0.94rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
        {title}
      </h4>
      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: "400px", margin: "0 auto 16px auto" }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
