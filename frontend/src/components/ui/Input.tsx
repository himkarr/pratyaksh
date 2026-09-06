import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, required, error, hint, leftIcon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="gov-form-group">
        {label && (
          <label htmlFor={inputId} className="gov-label">
            {label}
            {required && <span className="gov-label-required" aria-hidden="true">*</span>}
          </label>
        )}
        <div style={{ position: "relative", width: "100%" }}>
          {leftIcon && (
            <span
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                color: "var(--text-muted)",
                pointerEvents: "none"
              }}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`gov-input ${error ? "gov-input-error" : ""} ${className}`}
            style={leftIcon ? { paddingLeft: "34px" } : undefined}
            {...props}
          />
        </div>
        {hint && !error && <span className="gov-form-hint">{hint}</span>}
        {error && <span className="gov-form-error-text" role="alert">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, required, error, hint, options, className = "", id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="gov-form-group">
        {label && (
          <label htmlFor={selectId} className="gov-label">
            {label}
            {required && <span className="gov-label-required" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`gov-select ${error ? "gov-input-error" : ""} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error && <span className="gov-form-hint">{hint}</span>}
        {error && <span className="gov-form-error-text" role="alert">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, required, error, hint, className = "", id, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="gov-form-group">
        {label && (
          <label htmlFor={textareaId} className="gov-label">
            {label}
            {required && <span className="gov-label-required" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`gov-textarea ${error ? "gov-input-error" : ""} ${className}`}
          {...props}
        />
        {hint && !error && <span className="gov-form-hint">{hint}</span>}
        {error && <span className="gov-form-error-text" role="alert">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
