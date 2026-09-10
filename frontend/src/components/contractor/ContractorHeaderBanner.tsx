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
      className="dashboard-header"
      style={{
        background: "#ffffff",
        padding: "20px 24px",
        borderRadius: "14px",
        border: "1px solid var(--border-light, #e2e8f0)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1, minWidth: "300px" }}>
        <div 
          style={{ 
            background: "#e0f2fe", 
            padding: "12px", 
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Building2 size={26} color="#0284c7" />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary, #0a2540)", margin: 0, fontFamily: "Outfit, sans-serif" }}>
              {profile.agencyName}
            </h2>
            <span 
              style={{ 
                background: "#eff6ff", 
                border: "1px solid #bfdbfe", 
                color: "#1d4ed8", 
                fontSize: "0.74rem", 
                fontWeight: 800, 
                padding: "2px 8px", 
                borderRadius: "4px",
                fontFamily: "monospace"
              }}
            >
              VENDOR ID: {profile.vendorId}
            </span>
            <span 
              style={{ 
                background: "#ecfdf5", 
                border: "1px solid #a7f3d0", 
                color: "#065f46", 
                fontSize: "0.74rem", 
                fontWeight: 800, 
                padding: "2px 8px", 
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
                background: "#f0fdf4",
                color: "#166534",
                border: "1px solid #bbf7d0",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "4px"
              }}
            >
              <Database size={11} />
              SUPABASE LIVE CONNECTED
            </span>
          </div>

          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <span>Circle: <strong>{profile.circle}</strong></span>
            <span>GSTIN: <strong style={{ fontFamily: "monospace" }}>{profile.gstin}</strong></span>
            <span>Nodal Contact: <strong>{profile.nodalOfficer}</strong></span>
          </div>

          {/* Interactive Contractor Selector Dropdown */}
          <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: 800, color: "#0284c7" }}>
              <UserCheck size={15} />
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
                fontWeight: 700,
                cursor: "pointer",
                minWidth: "300px",
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
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            color: "var(--gov-primary, #0a2540)",
            padding: "8px 14px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
          }}
          aria-label="Contractor Portal Notifications"
        >
          <Bell size={16} color="#0284c7" />
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
