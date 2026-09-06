import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = "", style }) => {
  return (
    <div className={`gov-card ${className}`} style={style}>
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  icon,
  actions,
  className = ""
}) => {
  return (
    <div className={`gov-card-header ${className}`}>
      <div className="gov-card-title">
        {icon && <span style={{ color: "var(--gov-primary)", display: "flex", alignItems: "center" }}>{icon}</span>}
        {title}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
};

export const CardBody: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children,
  className = "",
  style
}) => {
  return <div className={`gov-card-body ${className}`} style={style}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children,
  className = "",
  style
}) => {
  return <div className={`gov-card-footer ${className}`} style={style}>{children}</div>;
};

export default Card;

