import React from "react";
import { Building2, Bell, ShieldCheck, UserCheck, RefreshCw, Database } from "lucide-react";
import { ContractorProfile, ContractorNotification } from "../../data/contractorData";
import { REGISTERED_VENDORS } from "../../api/districtContractorSync";

interface ContractorHeaderBannerProps {
  profile: ContractorProfile;
  notifications: ContractorNotification[];
  onOpenNotifications: () => void;
  selectedVendorId: string;
  onSelectVendorId: (vendorId: string) => void;
  assignedProjectCount: number;
}

export const ContractorHeaderBanner: React.FC<ContractorHeaderBannerProps> = ({
  profile,
  notifications,
  onOpenNotifications,
  selectedVendorId,
  onSelectVendorId,
  assignedProjectCount
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div
      className="civic-card"
      style={{
        background: "linear-gradient(135deg, #0a2540 0%, #1e3a5f 100%)",
        color: "#ffffff",
        padding: "22px 26px",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "18px",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.12)"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1, minWidth: "300px" }}>
        <div 
          style={{ 
            background: "rgba(255, 255, 255, 0.12)", 
            padding: "12px", 
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Building2 size={26} color="#93c5fd" />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
              {profile.agencyName}
            </h2>
            <span 
              style={{ 
                background: "rgba(59, 130, 246, 0.3)", 
                border: "1px solid rgba(147, 197, 253, 0.5)",
                color: "#e0f2fe", 
                fontSize: "0.74rem", 
                fontWeight: 800, 
                padding: "3px 8px", 
                borderRadius: "4px",
                fontFamily: "monospace"
              }}
            >
              VENDOR ID: {profile.vendorId}
            </span>
            <span 
              style={{ 
                background: "rgba(16, 185, 129, 0.25)", 
                border: "1px solid rgba(110, 231, 183, 0.4)",
                color: "#d1fae5", 
                fontSize: "0.74rem", 
                fontWeight: 800, 
                padding: "3px 8px", 
                borderRadius: "4px"
              }}
            >
              {assignedProjectCount} ASSIGNED WORKS
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(16, 185, 129, 0.2)",
                color: "#34d399",
                border: "1px solid rgba(52, 211, 153, 0.3)",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "4px",
                letterSpacing: "0.4px"
              }}
            >
              <Database size={12} />
              SUPABASE LIVE • REPOSITORIES CONNECTED
            </span>
          </div>

          <div style={{ fontSize: "0.78rem", color: "#cbd5e1", marginTop: "4px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <span>Circle: <strong>{profile.circle}</strong></span>
            <span>GSTIN: <strong style={{ fontFamily: "monospace" }}>{profile.gstin}</strong></span>
            <span>Nodal Contact: <strong>{profile.nodalOfficer}</strong></span>
          </div>

          {/* Interactive Contractor Selector Dropdown inside Banner */}
          <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.15)", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: 800, color: "#38bdf8" }}>
              <UserCheck size={16} />
              <span>Switch Active Contractor Firm:</span>
            </div>

            <select
              value={selectedVendorId}
              onChange={(e) => onSelectVendorId(e.target.value)}
              style={{
                background: "#ffffff",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.82rem",
                fontWeight: 800,
                cursor: "pointer",
                minWidth: "320px",
                outline: "none"
              }}
            >
              {REGISTERED_VENDORS.map(v => (
                <option key={v.vendorId} value={v.vendorId}>
                  {v.firmName} ({v.vendorId} • {v.district})
                </option>
              ))}
            </select>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontStyle: "italic" }}>
              (Select contractor firm to view their specific authority-assigned works)
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={onOpenNotifications}
          style={{
            position: "relative",
            background: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
            padding: "8px 14px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer"
          }}
          aria-label="Contractor Portal Notifications"
        >
          <Bell size={16} />
          <span>Monitoring Alerts</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: "#ef4444",
                color: "#ffffff",
                fontSize: "0.7rem",
                fontWeight: 800,
                borderRadius: "999px",
                padding: "1px 6px",
                lineHeight: 1
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
