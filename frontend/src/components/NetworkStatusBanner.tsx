import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { NetworkState, pwaUtils } from "../utils/pwaUtils";

export const NetworkStatusBanner: React.FC = () => {
  const [networkState, setNetworkState] = useState<NetworkState>(
    navigator.onLine ? "ONLINE" : "OFFLINE"
  );
  const [queuedCount, setQueuedCount] = useState<number>(0);

  useEffect(() => {
    const handleOnline = () => {
      setNetworkState("SYNCING");
      setTimeout(() => {
        setNetworkState("ONLINE");
      }, 1500);
    };

    const handleOffline = () => {
      setNetworkState("OFFLINE");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check on queued offline items
    setQueuedCount(pwaUtils.getOfflineQueue().length);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getStatusBadge = () => {
    switch (networkState) {
      case "ONLINE":
        return {
          bg: "var(--status-success-bg)",
          border: "var(--status-success-border)",
          color: "var(--status-success-text)",
          icon: <Wifi size={13} />,
          text: "ONLINE — PWA Gateway Active"
        };
      case "OFFLINE":
        return {
          bg: "var(--status-warning-bg)",
          border: "var(--status-warning-border)",
          color: "var(--status-warning-text)",
          icon: <WifiOff size={13} />,
          text: `OFFLINE MODE — Local Draft Storage Active (${queuedCount} Queued)`
        };
      case "SYNCING":
        return {
          bg: "var(--status-info-bg)",
          border: "var(--status-info-border)",
          color: "var(--status-info-text)",
          icon: <RefreshCw size={13} className="spin" />,
          text: "SYNCING — Transmitting Queued Offline Drafts..."
        };
      case "SYNC_FAILED":
        return {
          bg: "var(--status-danger-bg)",
          border: "var(--status-danger-border)",
          color: "var(--status-danger-text)",
          icon: <AlertTriangle size={13} />,
          text: "SYNC FAILED — Click to Retry Transmission"
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div 
      style={{ 
        background: badge.bg, 
        borderBottom: `1px solid ${badge.border}`, 
        color: badge.color, 
        padding: "4px 16px", 
        fontSize: "0.72rem", 
        fontWeight: 700, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between" 
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {badge.icon}
        <span>{badge.text}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          type="button"
          onClick={() => {
            if (networkState === "ONLINE") setNetworkState("OFFLINE");
            else setNetworkState("ONLINE");
          }}
          style={{ 
            background: "none", 
            border: "none", 
            color: badge.color, 
            cursor: "pointer", 
            textDecoration: "underline",
            fontSize: "0.70rem"
          }}
        >
          Network Simulation Mode ({networkState === "ONLINE" ? "Simulate Offline" : "Restore Online"})
        </button>
      </div>
    </div>
  );
};
