import React, { useState } from "react";
import { 
  Bell, CheckCircle2, Clock, AlertCircle, 
  CheckCheck, MapPin, UserCheck
} from "lucide-react";
import { Button, EmptyState } from "../ui";

export interface CitizenNotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "inspection_scheduled" | "work_completed" | "work_delayed" | "action_taken" | "announcement";
  read?: boolean;
  location?: string;
}

export const INITIAL_NOTIFICATIONS: CitizenNotificationItem[] = [
  {
    id: "notif-01",
    title: "Site Inspection Scheduled for Report #ISSUE-MH-2024-001",
    message: "District Office has scheduled a physical site inspection for Shivajinagar Drinking Water Pipeline on 14th June.",
    timestamp: "Today, 10:30 AM",
    type: "inspection_scheduled",
    read: false,
    location: "Shivajinagar, Pune"
  },
  {
    id: "notif-02",
    title: "Development Work Completed in Your Area",
    message: "Rooftop Solar PV Installation across 15 Zilla Parishad Schools in Pune has been marked 100% physically completed.",
    timestamp: "Yesterday, 03:45 PM",
    type: "work_completed",
    read: false,
    location: "Pune, Maharashtra"
  },
  {
    id: "notif-03",
    title: "Action Taken on Street Lighting Grievance",
    message: "Contractor has replaced faulty LED luminaires along Kothrud Health Center approach road.",
    timestamp: "3 days ago",
    type: "action_taken",
    read: true,
    location: "Kothrud, Pune"
  },
  {
    id: "notif-04",
    title: "Project Progress Update: Water Supply Upgrade",
    message: "Pipeline trenching phase is 45% complete. Excavation work is proceeding toward the main reservoir.",
    timestamp: "5 days ago",
    type: "announcement",
    read: true,
    location: "Varanasi / Pune"
  }
];

export const CitizenNotifications: React.FC<{
  notifications?: CitizenNotificationItem[];
}> = ({
  notifications: initialList = INITIAL_NOTIFICATIONS
}) => {
  const [items, setItems] = useState<CitizenNotificationItem[]>(initialList);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = items.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setItems(items.map((n) => ({ ...n, read: true })));
  };

  const handleItemClick = (id: string) => {
    setItems(items.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const filteredItems = items.filter((n) => (filter === "unread" ? !n.read : true));

  const getTypeIcon = (type: CitizenNotificationItem["type"]) => {
    switch (type) {
      case "inspection_scheduled":
        return <UserCheck size={15} color="var(--gov-accent)" />;
      case "work_completed":
        return <CheckCircle2 size={15} color="var(--status-success-text)" />;
      case "work_delayed":
        return <AlertCircle size={15} color="var(--status-danger-text)" />;
      case "action_taken":
        return <CheckCircle2 size={15} color="var(--status-success-text)" />;
      default:
        return <Bell size={15} color="var(--gov-accent)" />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Compact Notifications Header */}
      <div
        style={{
          background: "var(--bg-surface)",
          padding: "16px 18px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-main)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}
      >
        <div>
          <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Bell size={18} color="var(--gov-accent)" />
            Notifications & Updates
            {unreadCount > 0 && (
              <span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>
                {unreadCount} New
              </span>
            )}
          </h3>
          <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
            Public updates on work inspections, progress, and problem resolutions
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.74rem",
                fontWeight: filter === "all" ? 700 : 500,
                background: filter === "all" ? "var(--gov-primary)" : "var(--bg-surface-subtle)",
                color: filter === "all" ? "var(--text-white)" : "var(--text-body)",
                border: `1px solid ${filter === "all" ? "var(--gov-primary)" : "var(--border-main)"}`,
                cursor: "pointer"
              }}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.74rem",
                fontWeight: filter === "unread" ? 700 : 500,
                background: filter === "unread" ? "var(--gov-primary)" : "var(--bg-surface-subtle)",
                color: filter === "unread" ? "var(--text-white)" : "var(--text-body)",
                border: `1px solid ${filter === "unread" ? "var(--gov-primary)" : "var(--border-main)"}`,
                cursor: "pointer"
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={handleMarkAllRead} icon={<CheckCheck size={13} />}>
              Mark read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List (Simple & Compact) */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No Notifications"
          description={filter === "unread" ? "You have read all your notifications." : "No notifications available at this time."}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredItems.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif.id)}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-xs)",
                border: `1px solid ${notif.read ? "var(--border-light)" : "var(--border-main)"}`,
                background: notif.read ? "var(--bg-surface)" : "var(--status-info-bg)",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                cursor: "pointer",
                transition: "background 0.15s ease"
              }}
            >
              <div
                style={{
                  background: notif.read ? "var(--bg-surface-subtle)" : "#fff",
                  padding: "6px",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                {getTypeIcon(notif.type)}
              </div>

              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "2px" }}>
                  <h4 style={{ fontSize: "0.88rem", fontWeight: notif.read ? 600 : 700, color: "var(--gov-primary)", margin: 0 }}>
                    {notif.title}
                  </h4>
                  <span style={{ fontSize: "0.70rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                    <Clock size={11} /> {notif.timestamp}
                  </span>
                </div>

                <p style={{ fontSize: "0.78rem", color: "var(--text-body)", margin: "0 0 4px 0", lineHeight: 1.4 }}>
                  {notif.message}
                </p>

                {notif.location && (
                  <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={11} color="var(--gov-accent)" />
                    {notif.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitizenNotifications;
