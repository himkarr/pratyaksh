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
    <div
      className="gov-modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.70)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch"
      }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="gov-modal-content"
        style={{
          background: "var(--bg-surface, #ffffff)",
          border: "1px solid var(--border-main, #cbd5e1)",
          borderRadius: "12px",
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column",
          margin: "auto",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-light, #e2e8f0)",
            background: "var(--bg-surface-subtle, #f8fafc)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            borderTopLeftRadius: "11px",
            borderTopRightRadius: "11px"
          }}
        >
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--gov-primary, #0a2540)", margin: 0 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted, #64748b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
              borderRadius: "4px"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div 
          className="gov-modal-body"
          style={{ 
            padding: "20px",
            overflow: "visible",
            flex: "1 0 auto",
            minHeight: 0
          }}
        >
          {children}
        </div>

        {footerActions && (
          <div
            style={{
              position: "sticky",
              bottom: 0,
              zIndex: 30,
              padding: "12px 20px",
              borderTop: "1px solid var(--border-light, #e2e8f0)",
              background: "var(--bg-surface-subtle, #f8fafc)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "10px",
              flexShrink: 0,
              borderBottomLeftRadius: "11px",
              borderBottomRightRadius: "11px"
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
