/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: KpiSection (Executive Financial & Physical KPI Cards)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * This component renders the 6 core executive financial and execution performance
 * indicators required for transparent MPLADS scheme governance:
 * 
 * 1. Funds Allocated (₹ Cr): Cumulative statutory entitlement for participating MPs.
 * 2. Works Recommended (₹ Cr / Count): Total project proposals recommended by MPs.
 * 3. Works Sanctioned (₹ Cr / Count): Proposals granted administrative sanction by DMs.
 * 4. Works Completed (₹ Cr / Count): Projects physically finished within the 365-day statutory window.
 * 5. Works Ongoing (₹ Cr / Count): Projects actively under execution by implementing agencies.
 * 6. Total Expenditure (₹ Cr / %): Audited contractor disbursements and fund utilization rate.
 * 
 * INTERACTIVE FILTERING:
 * - Clicking any status card (Recommended, Sanctioned, Completed, Ongoing) dynamically
 *   filters the Master Works Directory to that status subset.
 */

import React from 'react';
import { Wallet, Layers, FileCheck, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { TranslationDict } from '../data/translations';

interface KpiStats {
  totalSeats: number;
  allocatedLimit: number;
  recommendedAmt: number;
  sanctionedAmt: number;
  completedAmt: number;
  ongoingAmt: number;
  expenditureAmt: number;
  recommendedCount: number;
  sanctionedCount: number;
  completedCount: number;
  ongoingCount: number;
  utilizationRate: number;
}

interface KpiSectionProps {
  stats: KpiStats;
  selectedStatusFilter: string;
  setSelectedStatusFilter: (status: string) => void;
  t: TranslationDict;
}

export function KpiSection({ stats, selectedStatusFilter, setSelectedStatusFilter, t }: KpiSectionProps) {
  // Configuration array for the 6 primary executive indicators
  const kpis = [
    {
      id: 'allocated',
      title: t.fundsAllocated,
      amount: stats.allocatedLimit,
      count: stats.totalSeats,
      countLabel: 'Entitlement (MPs)',
      icon: Wallet,
      filterKey: 'all',
      accent: 'var(--gov-primary)'
    },
    {
      id: 'recommended',
      title: t.worksRecommended,
      amount: stats.recommendedAmt,
      count: stats.recommendedCount,
      countLabel: 'Works Count',
      icon: Layers,
      filterKey: 'Recommended',
      accent: '#4c1d95'
    },
    {
      id: 'sanctioned',
      title: t.worksSanctioned,
      amount: stats.sanctionedAmt,
      count: stats.sanctionedCount,
      countLabel: 'Works Approved',
      icon: FileCheck,
      filterKey: 'Sanctioned',
      accent: '#1e3a5f'
    },
    {
      id: 'completed',
      title: t.worksCompleted,
      amount: stats.completedAmt,
      count: stats.completedCount,
      countLabel: 'Within 365 Days',
      icon: CheckCircle2,
      filterKey: 'Completed',
      accent: '#065f46'
    },
    {
      id: 'ongoing',
      title: t.worksOngoing,
      amount: stats.ongoingAmt,
      count: stats.ongoingCount,
      countLabel: 'Under Execution',
      icon: Clock,
      filterKey: 'Ongoing',
      accent: '#92400e'
    },
    {
      id: 'expenditure',
      title: t.totalExp,
      amount: stats.expenditureAmt,
      count: `${stats.utilizationRate}%`,
      countLabel: 'Utilisation Rate',
      icon: TrendingUp,
      filterKey: 'all',
      accent: '#0e7490'
    }
  ];

  return (
    <section style={{ margin: '16px 0' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isActive = selectedStatusFilter === kpi.filterKey && kpi.filterKey !== 'all';

          return (
            <div
              key={kpi.id}
              onClick={() => {
                if (kpi.filterKey !== 'all') {
                  setSelectedStatusFilter(selectedStatusFilter === kpi.filterKey ? 'all' : kpi.filterKey);
                }
              }}
              className="gov-card"
              style={{
                padding: '14px 16px',
                cursor: kpi.filterKey !== 'all' ? 'pointer' : 'default',
                borderLeft: `4px solid ${kpi.accent}`,
                background: isActive ? 'var(--bg-hover)' : 'var(--bg-surface)',
                outline: isActive ? `2px solid ${kpi.accent}` : 'none'
              }}
            >
              {/* Header Title & Icon */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}>
                  {kpi.title}
                </span>
                <div style={{ color: kpi.accent }}>
                  <Icon size={16} />
                </div>
              </div>

              {/* Big Metric Value */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '4px',
                marginBottom: '6px'
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  lineHeight: 1.1
                }}>
                  ₹ {kpi.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)'
                }}>
                  Cr
                </span>
              </div>

              {/* Sub-label & Count */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-light)'
              }}>
                <span>{kpi.countLabel}</span>
                <span style={{
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  background: 'var(--bg-surface-subtle)',
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)'
                }}>
                  {kpi.count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
export default KpiSection;
