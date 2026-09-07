import React from "react";
import { Landmark, HelpCircle, Phone, ShieldCheck, Eye, BookOpen } from "lucide-react";

export interface CitizenFooterProps {
  onOpenPolicy?: () => void;
}

export const CitizenFooter: React.FC<CitizenFooterProps> = ({ onOpenPolicy }) => {
  return (
    <footer
      style={{
        background: "var(--gov-primary)",
        color: "var(--text-white)",
        borderTop: "3px solid var(--gov-accent)",
        marginTop: "auto",
        padding: "28px 0 20px 0"
      }}
      className="no-print citizen-footer"
    >
      <style>{`
        .citizen-footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          box-sizing: border-box;
        }
        .citizen-footer-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }
        .citizen-footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          font-size: 0.82rem;
        }
        .citizen-footer-bottom {
          padding-top: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 0.72rem;
          color: #94a3b8;
        }
        @media (max-width: 768px) {
          .citizen-footer-container {
            padding: 0 16px;
          }
          .citizen-footer-top {
            flex-direction: column;
            gap: 16px;
          }
          .citizen-footer-links {
            gap: 12px;
          }
          .citizen-footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .citizen-footer-divider {
            display: none;
          }
        }
      `}</style>

      <div className="citizen-footer-container">
        
        {/* Top Footer Row */}
        <div className="citizen-footer-top">
          {/* Official Emblem & Portal Title */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", maxWidth: "420px" }}>
            <img
              src="/assets/emblem_of_india.svg"
              alt="Government of India Emblem"
              style={{ height: "40px", width: "auto", filter: "brightness(0) invert(1)" }}
            />
            <div>
              <div style={{ fontSize: "0.74rem", color: "#94a3b8", fontWeight: 600 }}>
                Government of India
              </div>
              <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#ffffff", lineHeight: 1.25 }}>
                MPLADS Citizen Public Portal
              </div>
              <div style={{ fontSize: "0.72rem", color: "#cbd5e1", marginTop: "2px" }}>
                Ministry of Statistics and Programme Implementation (MoSPI)
              </div>
            </div>
          </div>

          {/* Useful Citizen Links */}
          <div className="citizen-footer-links">
            <button
              type="button"
              onClick={onOpenPolicy}
              style={{
                background: "none",
                border: "none",
                color: "#cbd5e1",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.82rem"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
            >
              <BookOpen size={14} />
              <span>MPLADS Guidelines</span>
            </button>

            <span className="citizen-footer-divider" style={{ color: "#475569" }}>&bull;</span>

            <a
              href="#help"
              onClick={(e) => { e.preventDefault(); alert("Citizen Helpdesk: Toll Free 1800-11-2024 / Email: support-sakshi@nic.in"); }}
              style={{ color: "#cbd5e1", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
            >
              <HelpCircle size={14} />
              <span>Help & FAQs</span>
            </a>

            <span className="citizen-footer-divider" style={{ color: "#475569" }}>&bull;</span>

            <a
              href="#contact"
              onClick={(e) => { e.preventDefault(); alert("Contact: MoSPI, Khurshid Lal Bhawan, Janpath, New Delhi - 110001"); }}
              style={{ color: "#cbd5e1", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
            >
              <Phone size={14} />
              <span>Contact Us</span>
            </a>

            <span className="citizen-footer-divider" style={{ color: "#475569" }}>&bull;</span>

            <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "5px" }}>
              <ShieldCheck size={14} />
              <span>Privacy & Terms</span>
            </span>

            <span className="citizen-footer-divider" style={{ color: "#475569" }}>&bull;</span>

            <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "5px" }}>
              <Eye size={14} />
              <span>Accessibility</span>
            </span>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer Row */}
        <div className="citizen-footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} Ministry of Statistics and Programme Implementation, Government of India. All Rights Reserved.
          </div>
          <div>
            Official portal for public transparency of Member of Parliament Local Area Development Scheme.
          </div>
        </div>

      </div>
    </footer>
  );
};

export default CitizenFooter;
