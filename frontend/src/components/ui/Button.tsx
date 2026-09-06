import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  isLoading = false,
  className = "",
  disabled,
  ...props
}) => {
  const variantClass = {
    primary: "gov-btn-primary",
    secondary: "gov-btn-secondary",
    danger: "gov-btn-danger",
    outline: "gov-btn-outline"
  }[variant];

  const sizeClass = {
    sm: "gov-btn-sm",
    md: "",
    lg: "gov-btn-lg"
  }[size];

  return (
    <button
      className={`gov-btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="gov-spinner" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
};

export default Button;
