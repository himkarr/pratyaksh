/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: FilterBar (Hierarchical Administrative & Parliamentary Filter Bar)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * Provides multi-tier administrative and parliamentary filtering conforming to
 * the official Government of India administrative hierarchy:
 * 
 * HIERARCHICAL CASCADING FLOW:
 * 1. Parliamentary House (Lok Sabha [543 seats] vs. Rajya Sabha [245 seats])
 * 2. Parliamentary Tenure (e.g. 18th Lok Sabha 2024-Present vs. 17th Lok Sabha)
 * 3. State / Union Territory (e.g. Maharashtra, Uttar Pradesh, Delhi, Karnataka)
 * 4. Constituency & Assigned Member of Parliament (auto-cascaded from State selection)
 * 5. Sector Categories (Drinking Water, Healthcare, Education, Roads, Community Assets)
 * 6. Full-Text Search (Matches Work ID, Title, Implementing Agency, or Contractor GSTIN)
 */

import React, { useMemo } from 'react';
import { Search, RotateCcw, MapPin, User, Building, Layers, Calendar, Filter } from 'lucide-react';
import { SECTORS, TENURES, STATES_AND_CONSTITUENCIES, INITIAL_WORKS, WorkItem } from '../data/mpladsData';
import { TranslationDict } from '../data/translations';

interface FilterBarProps {
  works?: WorkItem[];
  house: string;
  setHouse: (house: string) => void;
  tenure: string;
  setTenure: (tenure: string) => void;
  selectedState: string;
  setSelectedState: (state: string) => void;
  selectedConstituency: string;
  setSelectedConstituency: (constituency: string) => void;
  selectedMp: string;
  setSelectedMp: (mp: string) => void;
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onReset: () => void;
  activeFilterCount: number;
  t: TranslationDict;
}

export function FilterBar({
  works,
  house,
  setHouse,
  tenure,
  setTenure,
  selectedState,
  setSelectedState,
  selectedConstituency,
  setSelectedConstituency,
  selectedMp,
  setSelectedMp,
  selectedSector,
  setSelectedSector,
  searchQuery,
  setSearchQuery,
  onReset,
  activeFilterCount,
  t
}: FilterBarProps) {
  const allWorks = works || INITIAL_WORKS;

  // Dynamically derived list of available States/UTs from dataset and catalog
  const availableStates = useMemo(() => {
    const statesFromWorks = allWorks.map(w => w.state).filter(Boolean);
    const statesFromCatalog = Object.keys(STATES_AND_CONSTITUENCIES);
    return Array.from(new Set([...statesFromWorks, ...statesFromCatalog])).sort();
  }, [allWorks]);

  // Dynamically derived constituencies scoped to selected State
  const availableConstituencies = useMemo(() => {
    const scopedWorks = selectedState 
      ? allWorks.filter(w => w.state?.toLowerCase() === selectedState.toLowerCase())
      : allWorks;
    const fromWorks = scopedWorks.map(w => w.constituency).filter(Boolean);
    const fromCatalog = selectedState && STATES_AND_CONSTITUENCIES[selectedState]
      ? (STATES_AND_CONSTITUENCIES[selectedState]["Lok Sabha"] || []).map(c => c.name)
      : [];
    return Array.from(new Set([...fromWorks, ...fromCatalog])).sort();
  }, [selectedState, allWorks]);

  // Dynamically derived Hon'ble MPs scoped to State and Constituency
  const availableMps = useMemo(() => {
    let scopedWorks = allWorks;
    if (selectedState) {
      scopedWorks = scopedWorks.filter(w => w.state?.toLowerCase() === selectedState.toLowerCase());
    }
    if (selectedConstituency) {
      scopedWorks = scopedWorks.filter(w => w.constituency?.toLowerCase() === selectedConstituency.toLowerCase());
    }
    const fromWorks = scopedWorks.map(w => w.mpName).filter(Boolean);
    const fromCatalog = selectedState && STATES_AND_CONSTITUENCIES[selectedState]
      ? (STATES_AND_CONSTITUENCIES[selectedState]["Lok Sabha"] || [])
          .filter(c => !selectedConstituency || c.name.toLowerCase() === selectedConstituency.toLowerCase())
          .map(c => c.mp)
      : [];
    return Array.from(new Set([...fromWorks, ...fromCatalog])).sort();
  }, [selectedState, selectedConstituency, allWorks]);

  // Filter tenures available for the currently chosen House (Lok Sabha vs Rajya Sabha)
  const filteredTenures = useMemo(() => {
    return TENURES.filter(tn => tn.house === house);
  }, [house]);

  return (
    <section className="gov-card no-print" style={{ margin: '16px 0' }}>
      <div className="gov-card-header" style={{ padding: '8px 16px' }}>
        <div className="gov-card-title" style={{ fontSize: '0.82rem' }}>
          <Filter size={14} color="var(--gov-primary)" />
          <span>{t.filterTitle}</span>
        </div>
        {activeFilterCount > 0 && (
          <span className="gov-badge gov-badge-info" style={{ fontSize: '0.68rem' }}>
            {activeFilterCount} Filters Applied
          </span>
        )}
      </div>

      <div className="gov-card-body" style={{ padding: '14px 16px' }}>
        {/* Top Controls Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px'
        }}>
          {/* House Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-main)',
            borderRadius: 'var(--radius-xs)',
            padding: '2px'
          }}>
            <button
              onClick={() => { setHouse('Lok Sabha'); setTenure('18-ls'); }}
              style={{
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '2px',
                background: house === 'Lok Sabha' ? 'var(--gov-primary)' : 'transparent',
                color: house === 'Lok Sabha' ? '#ffffff' : 'var(--text-body)'
              }}
            >
              Lok Sabha (543)
            </button>
            <button
              onClick={() => { setHouse('Rajya Sabha'); setTenure('rs-2024'); }}
              style={{
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '2px',
                background: house === 'Rajya Sabha' ? 'var(--gov-primary)' : 'transparent',
                color: house === 'Rajya Sabha' ? '#ffffff' : 'var(--text-body)'
              }}
            >
              Rajya Sabha (245)
            </button>
          </div>

          {/* Search Input */}
          <div style={{
            position: 'relative',
            flex: '1',
            maxWidth: '500px',
            minWidth: '240px'
          }}>
            <Search size={14} style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Reset Filters */}
          <button
            onClick={onReset}
            className="gov-btn gov-btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            title="Reset Filters"
          >
            <RotateCcw size={12} />
            <span>{t.reset}</span>
          </button>
        </div>

        {/* Cascading Dropdowns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-light)'
        }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <Calendar size={11} /> Parliamentary Tenure
            </label>
            <select
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-main)',
                fontSize: '0.8rem'
              }}
            >
              {filteredTenures.map(tn => (
                <option key={tn.id} value={tn.id}>{tn.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <MapPin size={11} /> State / UT
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedConstituency('');
                setSelectedMp('');
              }}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-main)',
                fontSize: '0.8rem'
              }}
            >
              <option value="">{t.allStates}</option>
              {availableStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <Building size={11} /> Constituency
            </label>
            <select
              value={selectedConstituency}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedConstituency(val);
                if (val) {
                  const match = allWorks.find(w => w.constituency?.toLowerCase() === val.toLowerCase());
                  if (match?.mpName) setSelectedMp(match.mpName);
                  if (match?.state && !selectedState) setSelectedState(match.state);
                }
              }}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-main)',
                fontSize: '0.8rem'
              }}
            >
              <option value="">{t.allConstituencies}</option>
              {availableConstituencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <User size={11} /> Hon'ble Member of Parliament
            </label>
            <select
              value={selectedMp}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMp(val);
                if (val) {
                  const match = allWorks.find(w => w.mpName?.toLowerCase() === val.toLowerCase());
                  if (match?.constituency && !selectedConstituency) setSelectedConstituency(match.constituency);
                  if (match?.state && !selectedState) setSelectedState(match.state);
                }
              }}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-main)',
                fontSize: '0.8rem'
              }}
            >
              <option value="">{t.allMPs}</option>
              {availableMps.map(mp => (
                <option key={mp} value={mp}>{mp}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sector Quick Filter Buttons */}
        <div style={{
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            marginRight: '2px'
          }}>
            <Layers size={11} /> Sector Filter:
          </span>
          {SECTORS.map((sec) => {
            const isSelected = selectedSector === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSector(sec.id)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  border: isSelected ? '1px solid var(--gov-primary)' : '1px solid var(--border-main)',
                  background: isSelected ? 'var(--gov-primary)' : 'var(--bg-surface-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--text-body)'
                }}
              >
                {sec.name}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
export default FilterBar;
