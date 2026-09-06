import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

export type AlertType = "info" | "warning" | "danger" | "success";

export interface AlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  children,
  icon,
  className = "",
  style,
  onClose
}) => {
  const getDefaultIcon = () => {
    switch (type) {
      case "danger":
        return <AlertCircle size={16} aria-hidden="true" />;
      case "warning":
        return <AlertTriangle size={16} aria-hidden="true" />;
      case "success":
        return <CheckCircle size={16} aria-hidden="true" />;
      default:
        return <Info size={16} aria-hidden="true" />;
    }
  };

  return (
    <div className={`gov-alert gov-alert-${type} ${className}`} style={style} role="alert">

      <span style={{ flexShrink: 0, marginTop: "1px" }}>{icon || getDefaultIcon()}</span>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 700, marginBottom: "2px" }}>{title}</div>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0 4px" }}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
};

export const RiskDisclaimerAlert: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <Alert type="info" className={className}>
      <strong>IMPORTANT:</strong> Risk level means <strong>verification priority</strong>, NOT proof of fraud or non-compliance.
    </Alert>
  );
};

export default Alert;
