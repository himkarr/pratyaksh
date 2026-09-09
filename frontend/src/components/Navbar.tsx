import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, 
  ChevronDown, 
  User, 
  Landmark, 
  Building2, 
  MapPin, 
  Award, 
  ShieldCheck
} from 'lucide-react';
import { TranslationDict } from '../data/translations';
import { useRole, Role } from '../auth/roleContext';
import { usePreferences } from '../context/PreferencesContext';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
  onOpenPolicy?: () => void;
  onOpenLogin?: (initialRole?: Role) => void;
  t?: TranslationDict;
  flagCount?: number;
  adminHouseFilter?: "both" | "Lok Sabha" | "Rajya Sabha";
  onAdminHouseFilterChange?: (filter: "both" | "Lok Sabha" | "Rajya Sabha") => void;
  selectedVendorId?: string;
  onSelectVendorId?: (vendorId: string) => void;
  selectedDistrict?: string;
  onSelectDistrict?: (district: string) => void;
  availableDistricts?: string[];
}

const ROLES_EN: { id: Role; label: string; desc: string; icon: any }[] = [
  { id: "citizen", label: "Citizen Portal", desc: "Report issues & track local works", icon: User },
  { id: "mp", label: "Member of Parliament", desc: "Constituency works & fund burn rate", icon: Landmark },
  { id: "contractor", label: "Contractor Agency", desc: "Update progress & milestone photos", icon: Building2 },
  { id: "field_officer", label: "Field Inspection Officer", desc: "Ground geotagged verification", icon: MapPin },
  { id: "district", label: "District Authority (DM)", desc: "Sanction works & release tranches", icon: Building2 },
  { id: "state_nodal", label: "State Nodal Dept", desc: "Statewide cross-district monitoring", icon: MapPin },
  { id: "ministry", label: "Ministry of Statistics (MoSPI)", desc: "Apex national oversight & AI audit", icon: Award }
];

const ROLES_HI: { id: Role; label: string; desc: string; icon: any }[] = [
  { id: "citizen", label: "नागरिक पोर्टल", desc: "शिकायत दर्ज करें एवं कार्य ट्रैक करें", icon: User },
  { id: "mp", label: "सांसद", desc: "निर्वाचन क्षेत्र कार्य एवं व्यय दर", icon: Landmark },
  { id: "contractor", label: "संविदा एजेंसी", desc: "कार्य प्रगति एवं फ़ोटो अपलोड", icon: Building2 },
  { id: "field_officer", label: "क्षेत्रीय निरीक्षण अधिकारी", desc: "भू-टैग सत्यापन एवं निरीक्षण", icon: MapPin },
  { id: "district", label: "ज़िला प्राधिकारी (डीएम)", desc: "कार्य स्वीकृति एवं किश्त जारी", icon: Building2 },
  { id: "state_nodal", label: "राज्य नोडल विभाग", desc: "राज्यव्यापी निगरानी", icon: MapPin },
  { id: "ministry", label: "सांख्यिकी मंत्रालय (MoSPI)", desc: "शीर्ष राष्ट्रीय पर्यवेक्षण", icon: Award }
];

export function Navbar({ activeTab, setActiveTab, t: propT }: NavbarProps) {
  const { user, logout } = useRole();
  const { t: prefT, lang } = usePreferences();
  const t = prefT || propT;
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const rolesList = lang === 'hi' ? ROLES_HI : ROLES_EN;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentRoleInfo = rolesList.find(r => r.id === user.role) || rolesList[0];
  const CurrentIcon = currentRoleInfo.icon;

  const getRoleDisplayName = () => {
    if (user.role === 'mp') {
      return user.name || "Member of Parliament";
    }
    if (user.role === 'citizen') {
      return user.name || "Citizen";
    }
    if (user.role === 'district') {
      return user.name || `District Authority (${user.district || 'Rohtak'})`;
    }
    if (user.role === 'state_nodal') {
      return user.name || `State Nodal Officer (${user.state || 'Haryana'})`;
    }
    if (user.role === 'contractor') {
      return user.name || `Contractor Agency (${user.district || 'Rohtak'})`;
    }
    return user.name || currentRoleInfo.label;
  };

  const getSubLabel = () => {
    if (user.role === 'mp') {
      return `${user.constituency || 'Rohtak'}, ${user.state || 'Haryana'}`;
    }
    if (user.role === 'citizen') {
      return `${user.district || user.constituency || 'Rohtak'}, ${user.state || 'Haryana'}`;
    }
    if (user.role === 'district') {
      return `District: ${user.district || 'Rohtak'}, ${user.state || 'Haryana'}`;
    }
    if (user.role === 'state_nodal') {
      return `State: ${user.state || 'Haryana'}`;
    }
    if (user.role === 'contractor') {
      return `${user.district || 'Rohtak'}, ${user.state || 'Haryana'}`;
    }
    return 'MoSPI Central Apex';
  };

  return (
    <nav 
      style={{
        background: 'var(--bg-surface, var(--text-white))',
        borderBottom: '1px solid var(--border-light, #e2e8f0)',
        padding: '8px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
      }} 
      className="no-print"
    >
      <div 
        className="container" 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Left Side: Ashoka Emblem & Official Ministry Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Official State Emblem of India */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img 
              src="/assets/emblem_of_india.svg" 
              alt="State Emblem of India" 
              style={{ height: '48px', width: 'auto', display: 'block', objectFit: 'contain' }} 
            />
          </div>

          {/* Official 3-Line Text Hierarchy */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 500, lineHeight: 1.25 }}>
              {lang === 'hi' ? 'भारत सरकार' : 'Government of India'}
            </div>
            <div style={{ fontSize: '0.90rem', fontWeight: 800, color: '#000000', lineHeight: 1.25 }}>
              {lang === 'hi' ? 'सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय' : 'Ministry of Statistics and Programme Implementation'}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#000000', lineHeight: 1.25 }}>
              {t?.portalTitle || (lang === 'hi' ? 'सांसद स्थानीय क्षेत्र विकास योजना' : 'Members of Parliament Local Area Development Scheme')}
            </div>
          </div>
        </div>

        {/* Right Side Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          {setActiveTab && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 600 }}>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                style={{
                  background: activeTab === 'dashboard' ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                  border: 'none',
                  color: activeTab === 'dashboard' ? 'var(--gov-accent, #0284c7)' : 'var(--text-body, #475569)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontWeight: activeTab === 'dashboard' ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {t?.dashboard || (lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard')}
              </button>
            </div>
          )}

          <div style={{ height: '24px', width: '1px', background: 'var(--border-light, #e2e8f0)' }} />

          {/* User Identity Profile Pill */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-surface, #ffffff)',
                border: '1px solid var(--border-main, #cbd5e1)',
                padding: '6px 12px',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)'
              }}
              title="Click to View Account Details"
            >
              <div style={{
                background: 'var(--gov-primary, #0f2942)',
                color: '#ffffff',
                padding: '5px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CurrentIcon size={13} />
              </div>

              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted, #64748b)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {currentRoleInfo.label}
                </div>
                <div style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', lineHeight: 1.1 }}>
                  {getRoleDisplayName()}
                </div>
              </div>

              <ChevronDown size={13} color="var(--text-main, #0f172a)" style={{ transform: isRoleDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', marginLeft: '3px' }} />
            </button>

            {/* Account & Profile Menu (No role switching, strictly user info and logout) */}
            {isRoleDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '280px',
                background: 'var(--bg-surface, #ffffff)',
                border: '1px solid var(--border-main, #cbd5e1)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
                padding: '14px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {/* User Identity Header */}
                <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--gov-primary, #0a2540)', lineHeight: 1.25 }}>
                    {getRoleDisplayName()}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                    {user.email || 'official@nirikshak.gov.in'}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.70rem', fontWeight: 600, color: 'var(--gov-accent, #155eef)', background: 'var(--status-info-bg, #eff6ff)', padding: '2px 8px', borderRadius: '4px', marginTop: '6px' }}>
                    <ShieldCheck size={12} /> {currentRoleInfo.label}
                  </div>
                </div>

                {/* Jurisdiction / Location Scope */}
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} color="var(--gov-accent, #155eef)" />
                  <span>Area: <strong>{getSubLabel()}</strong></span>
                </div>

                {/* Logout Button (No role switching dropdown in dashboard) */}
                <div style={{ borderTop: '1px solid var(--border-light, #e2e8f0)', paddingTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRoleDropdownOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--status-danger-border, #fecaca)',
                      background: 'var(--status-danger-bg, #fef2f2)',
                      color: 'var(--status-danger-text, #991b1b)',
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;
