import React from "react";
import { Bell, CheckCircle2, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardBody, Badge } from "../ui";

export interface CitizenNotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "status_update" | "inspection_assigned" | "resolution" | "announcement";
  read?: boolean;
}

export const INITIAL_NOTIFICATIONS: CitizenNotificationItem[] = [
  {
    id: "notif-01",
    title: "Field Officer Assigned to Grievance #ISSUE-MH-2024-001",
    message: "District Collectorate Pune has assigned Officer Suresh Patil for physical site inspection of Shivajinagar water pipeline.",
    timestamp: "Today, 11:30 AM",
    type: "inspection_assigned",
    read: false
  },
  {
    id: "notif-02",
    title: "New MPLADS Sanctioned Work in Pune Constituency",
    message: "Hon'ble MP Murlidhar Mohol has recommended ₹1.25 Cr for Solar Power Assets across rural schools in Kothrud.",
    timestamp: "Yesterday, 04:15 PM",
    type: "announcement",
    read: true
  }
];

export const CitizenNotifications: React.FC<{ notifications?: CitizenNotificationItem[] }> = ({
  notifications = INITIAL_NOTIFICATIONS
}) => {
  return (
    <Card>
      <CardHeader title="Citizen Portal Notifications & Updates" icon={<Bell size={16} />} />

      <CardBody>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                padding: "12px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--border-light)",
                background: notif.read ? "var(--bg-surface)" : "var(--status-info-bg)",
                borderLeft: `4px solid ${notif.type === "inspection_assigned" ? "var(--gov-accent)" : "var(--status-success-text)"}`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--gov-primary)" }}>
                  {notif.title}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{notif.timestamp}</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-body)", lineHeight: "1.4" }}>
                {notif.message}
              </p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default CitizenNotifications;
