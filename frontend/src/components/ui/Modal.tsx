import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useBodyScrollLock } from "../../utils/scrollLock";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerActions,
  maxWidth = "600px"
}) => {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="gov-modal-backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div
        className="gov-modal-content"
        style={{ 
          maxWidth,
          maxHeight: "min(90vh, 820px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          overscrollBehavior: "contain"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--border-light)",
            background: "var(--bg-surface-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0
          }}
        >
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--gov-primary)", margin: 0 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
              borderRadius: "var(--radius-xs)"
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div 
          className="gov-modal-body"
          style={{ 
            padding: "18px",
            overflowY: "auto",
            flex: "1 1 auto",
            minHeight: 0,
            overscrollBehavior: "contain"
          }}
        >
          {children}
        </div>

        {footerActions && (
          <div
            style={{
              padding: "12px 18px",
              borderTop: "1px solid var(--border-light)",
              background: "var(--bg-surface-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "10px",
              flexShrink: 0
            }}
          >
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
