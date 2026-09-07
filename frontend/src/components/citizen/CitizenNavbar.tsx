import React, { useState, useRef, useEffect } from "react";
import { User as UserIcon, Bell, LayoutDashboard, LogOut, ChevronDown, ShieldCheck, Mail, MapPin } from "lucide-react";
import { usePreferences } from "../../context/PreferencesContext";
import { useRole } from "../../auth/roleContext";

export interface CitizenNavbarProps {
  activeTab: string;
  onSelectTab: (tab: "home" | "find_works" | "my_reports" | "notifications") => void;
  unreadCount?: number;
  onOpenLogin?: () => void;
  currentConstituency?: string;
}

export const CitizenNavbar: React.FC<CitizenNavbarProps> = ({
  activeTab,
  onSelectTab,
  unreadCount = 2,
  currentConstituency = "Pune"
}) => {
  const { lang } = usePreferences();
  const { user, logout } = useRole();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute clean display name
  const rawName = user?.name || "";
  const cleanName = rawName
    ? (rawName.includes("(") ? rawName.split("(")[0].trim() : rawName)
    : (lang === "hi" ? "नागरिक" : "Citizen");

  return (
    <nav
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-light)",
        padding: "8px 0",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)"
      }}
      className="no-print citizen-navbar"
    >
      <style>{`
        .citizen-nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          box-sizing: border-box;
        }

        .citizen-nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }

        .citizen-nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: nowrap;
        }

        .citizen-nav-btn-dash,
        .citizen-nav-btn-notif,
        .citizen-nav-btn-account {
          box-sizing: border-box;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s ease;
          border-radius: var(--radius-full, 9999px);
          white-space: nowrap;
        }

        .citizen-account-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          width: 260px;
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-main, #cbd5e1);
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
          padding: 10px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: citizenFadeIn 0.12s ease-out;
        }

        @keyframes citizenFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .citizen-nav-container {
            padding: 8px 16px;
            gap: 8px;
            flex-direction: column;
            align-items: stretch;
          }
          .citizen-nav-brand {
            gap: 10px;
          }
          .citizen-nav-brand img {
            height: 36px !important;
          }
          .citizen-nav-brand-title {
            font-size: 0.80rem !important;
          }
          .citizen-nav-right {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 6px !important;
            width: 100% !important;
            flex-wrap: nowrap !important;
          }
          .citizen-nav-btn-dash,
          .citizen-nav-btn-notif,
          .citizen-nav-account-wrap,
          .citizen-nav-btn-account {
            width: 100% !important;
            min-width: 0 !important;
            height: 34px !important;
            padding: 0 6px !important;
            font-size: 0.74rem !important;
            gap: 4px !important;
          }
          .citizen-nav-btn-dash span,
          .citizen-nav-btn-notif span,
          .citizen-nav-btn-account span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .citizen-account-dropdown {
            right: 0;
            width: 260px;
            max-width: calc(100vw - 32px);
          }
        }
      `}</style>

      <div className="citizen-nav-container">
        {/* Left Side: National Emblem & Official MoSPI Title */}
        <div className="citizen-nav-brand">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <img
              src="/assets/emblem_of_india.svg"
              alt="State Emblem of India"
              style={{ height: "42px", width: "auto", display: "block", objectFit: "contain" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontWeight: 600, lineHeight: 1.2 }}>
              {lang === "hi" ? "भारत सरकार" : "Government of India"}
            </div>
            <div className="citizen-nav-brand-title" style={{ fontSize: "0.86rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.25 }}>
              {lang === "hi" ? "सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय" : "Ministry of Statistics and Programme Implementation"}
            </div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--gov-accent)", lineHeight: 1.2 }}>
              {lang === "hi" ? "एमपीलैड्स नागरिक पोर्टल (e-SAKSHI)" : "MPLADS Citizen Portal (e-SAKSHI)"}
            </div>
          </div>
        </div>

        {/* Right Side: Dashboard, Notifications & User Account Menu */}
        <div className="citizen-nav-right">
          {/* Dashboard Tab Button */}
          <button
            type="button"
            className="citizen-nav-btn-dash"
            onClick={() => onSelectTab("home")}
            style={{
              background: activeTab === "home" ? "rgba(2, 132, 199, 0.12)" : "var(--bg-surface-subtle)",
              border: `1px solid ${activeTab === "home" ? "var(--gov-accent)" : "var(--border-main)"}`,
              color: activeTab === "home" ? "var(--gov-accent)" : "var(--text-body)",
              padding: "6px 14px",
              fontWeight: activeTab === "home" ? 700 : 600,
              cursor: "pointer",
              fontSize: "0.82rem"
            }}
          >
            <LayoutDashboard size={14} style={{ flexShrink: 0 }} />
            <span>{lang === "hi" ? "डैशबोर्ड" : "Dashboard"}</span>
          </button>

          {/* Notifications Button with Active Badge */}
          <button
            type="button"
            className="citizen-nav-btn-notif"
            onClick={() => onSelectTab("notifications")}
            style={{
              background: activeTab === "notifications" ? "rgba(2, 132, 199, 0.12)" : "var(--bg-surface-subtle)",
              border: `1px solid ${activeTab === "notifications" ? "var(--gov-accent)" : "var(--border-main)"}`,
              color: activeTab === "notifications" ? "var(--gov-accent)" : "var(--text-main)",
              padding: "6px 12px",
              fontWeight: activeTab === "notifications" ? 700 : 600,
              cursor: "pointer",
              fontSize: "0.80rem",
              position: "relative"
            }}
            title="View Notifications"
          >
            <Bell size={14} style={{ flexShrink: 0 }} color={activeTab === "notifications" ? "var(--gov-accent)" : "var(--text-muted)"} />
            <span>{lang === "hi" ? "सूचनाएं" : "Notifications"}</span>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "1px 5px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--gov-accent)",
                  color: "#ffffff",
                  fontWeight: 800,
                  marginLeft: "2px",
                  flexShrink: 0
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Account Button with Dropdown (Standard Government Portal Style) */}
          <div className="citizen-nav-account-wrap" style={{ position: "relative" }} ref={accountMenuRef}>
            <button
              type="button"
              className="citizen-nav-btn-account"
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              style={{
                background: isAccountMenuOpen ? "rgba(2, 132, 199, 0.12)" : "var(--status-info-bg)",
                border: "1px solid var(--status-info-border)",
                padding: "5px 12px",
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--gov-accent)",
                cursor: "pointer",
                width: "100%"
              }}
              title="Account Menu"
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "var(--gov-accent)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.68rem",
                  fontWeight: "bold",
                  flexShrink: 0
                }}
              >
                {cleanName.charAt(0).toUpperCase()}
              </div>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {cleanName}
              </span>
              <ChevronDown
                size={13}
                style={{
                  transform: isAccountMenuOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.15s ease",
                  flexShrink: 0
                }}
              />
            </button>

            {/* Dropdown Menu */}
            {isAccountMenuOpen && (
              <div className="citizen-account-dropdown">
                {/* User Identity Header */}
                <div style={{ padding: "4px 6px 8px 6px", borderBottom: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "var(--gov-primary)", lineHeight: 1.25 }}>
                    {cleanName}
                  </div>
                  <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {user?.email || "citizen@sapphire.gov.in"}
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.68rem", fontWeight: 600, color: "var(--gov-accent)", background: "var(--status-info-bg)", padding: "1px 6px", borderRadius: "4px", marginTop: "4px" }}>
                    <ShieldCheck size={11} /> Citizen Public Account
                  </div>
                </div>

                {/* Constituency Details */}
                <div style={{ padding: "4px 6px", fontSize: "0.74rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                  <MapPin size={12} color="var(--gov-accent)" />
                  <span>Area: <strong>{currentConstituency}</strong></span>
                </div>

                {/* Logout Button */}
                <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      logout();
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "7px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--status-danger-border, #fecaca)",
                      background: "var(--status-danger-bg, #fef2f2)",
                      color: "var(--status-danger-text, #991b1b)",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "background 0.12s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--status-danger-bg, #fef2f2)")}
                  >
                    <LogOut size={13} />
                    <span>{lang === "hi" ? "लॉगआउट" : "Logout"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CitizenNavbar;
