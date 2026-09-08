import React from "react";
import { Bell, AlertTriangle, Info, CheckCircle2, Clock, X } from "lucide-react";
import { ContractorNotification } from "../../data/contractorData";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface ContractorNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: ContractorNotification[];
  onMarkAllRead: () => void;
  onSelectProject?: (workId: string) => void;
}

export const ContractorNotificationsModal: React.FC<ContractorNotificationsProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectProject
}) => {
  if (!isOpen) return null;

  const getIcon = (type: ContractorNotification['type']) => {
    switch (type) {
      case 'urgent':
      case 'warning':
        return <AlertTriangle size={16} color="var(--status-danger-text)" />;
      case 'success':
        return <CheckCircle2 size={16} color="var(--status-success-text)" />;
      case 'info':
      default:
        return <Info size={16} color="var(--status-info-text)" />;
    }
  };

  const getBadgeClass = (type: ContractorNotification['type']) => {
    switch (type) {
      case 'urgent':
      case 'warning':
        return "gov-badge-danger";
      case 'success':
        return "gov-badge-success";
      case 'info':
      default:
        return "gov-badge-info";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contractor Portal — Monitoring Alerts & Notifications"
      maxWidth="680px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: "8px" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Showing <strong>{notifications.length}</strong> official monitoring notifications
          </div>
          <Button variant="secondary" size="sm" onClick={onMarkAllRead}>
            Mark All as Read
          </Button>
        </div>

        {notifications.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
            <CheckCircle2 size={36} color="var(--status-success-text)" style={{ margin: "0 auto 8px auto" }} />
            <div style={{ fontWeight: 700 }}>No active notifications</div>
            <div style={{ fontSize: "0.78rem" }}>All monitoring updates are up to date.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "420px", overflowY: "auto" }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-xs)",
                  border: `1px solid ${notif.read ? "var(--border-light)" : "var(--status-info-border)"}`,
                  background: notif.read ? "var(--bg-surface-subtle)" : "var(--status-info-bg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {getIcon(notif.type)}
                    <span style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--text-main)" }}>
                      {notif.title}
                    </span>
                    <span className={`gov-badge ${getBadgeClass(notif.type)}`}>
                      {notif.workId}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} />
                    {notif.date}
                  </span>
                </div>

                <p style={{ fontSize: "0.8rem", color: "var(--text-body)", margin: 0, lineHeight: 1.4 }}>
                  {notif.message}
                </p>

                {onSelectProject && notif.workId && (
                  <div style={{ alignSelf: "flex-end", marginTop: "2px" }}>
                    <button
                      onClick={() => {
                        onClose();
                        onSelectProject(notif.workId);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--gov-accent)",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline"
                      }}
                    >
                      Go to Project →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
