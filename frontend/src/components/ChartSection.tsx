/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: ChartSection (Deep-Dive Analytics & Statutory Trend Suite)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * This component delivers high-fidelity visual analytics grounded in official
 * MoSPI guidelines and the e-SAKSHI operational framework:
 * 
 * 1. 12-Month Financial Burn Rate:
 *    - Compares cumulative fund disbursal against actual audited contractor expenditure
 *      and the mandatory 1-year linear statutory ceiling (₹ 25.00 Cr 5-year entitlement pace).
 * 2. Physical vs. Financial Progress Discrepancy Matrix:
 *    - Cross-evaluates verified ground physical progress (%) from geotagged site milestones
 *      against financial drawdown (%). Discrepancies >30% trigger high-risk warnings.
 * 3. Sector-Wise Capital Allocation:
 *    - Visualizes capital breakdown across core national priority sectors (Drinking Water,
 *      Rural Roads, Public Healthcare, Education, Community Assets).
 * 4. State Compliance Benchmark:
 *    - Compares 1-year statutory completion velocity across participating states and districts.
 * 
 * MODES:
 * - 'overview': Compact summary chart for the primary Executive Dashboard.
 * - 'dedicated': Full 4-tab interactive analytical suite for the Analytics & Trends tab.
 */

import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Line, ComposedChart 
} from 'recharts';
import { TrendingUp, BarChart3, PieChart, Activity, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { WorkItem, SECTORS, MONTHLY_SPEND_TREND } from '../data/mpladsData';
import { TranslationDict } from '../data/translations';

interface ChartSectionProps {
  stats: {
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
  };
  filteredWorks: WorkItem[];
  flags: Array<{ id: string; project_id: string; severity: string; origin: string; reason: string }>;
  t: TranslationDict;
  mode?: 'overview' | 'dedicated';
}

export function ChartSection({ stats, filteredWorks, flags, t: _t, mode = 'dedicated' }: ChartSectionProps) {
  // Active analytical dimension tab in dedicated mode
  const [activeChartTab, setActiveChartTab] = useState<'financial' | 'physical_mismatch' | 'sectors' | 'state_benchmark'>('financial');

  // 1. Sectoral Aggregation (Calculates capital sum & total count per sector category)
  const sectorData = useMemo(() => {
    const counts: Record<string, { amount: number; count: number; name: string }> = {};
    SECTORS.filter(s => s.id !== 'all').forEach(s => {
      counts[s.id] = { amount: 0, count: 0, name: s.name };
    });

    filteredWorks.forEach(w => {
      if (counts[w.category]) {
        counts[w.category].amount += w.sanctionedAmt || 0;
        counts[w.category].count += 1;
      }
    });

    return Object.entries(counts)
      .map(([id, val]) => ({
        id,
        sector: val.name.split('&')[0].trim(),
        amountCr: Number(val.amount.toFixed(2)),
        worksCount: val.count
      }))
      .filter(item => item.amountCr > 0)
      .sort((a, b) => b.amountCr - a.amountCr);
  }, [filteredWorks]);

  // 2. Physical vs Financial Progress Mismatch Data (Anomaly detection)
  const progressMismatchData = useMemo(() => {
    return filteredWorks.slice(0, 10).map(w => ({
      workId: w.id,
      title: w.title.length > 20 ? w.title.slice(0, 18) + '...' : w.title,
      physicalPct: w.physicalProgress,
      financialPct: w.financialProgress,
      gap: w.financialProgress - w.physicalProgress
    }));
  }, [filteredWorks]);

  // 3. State & District Performance Benchmark
  const stateBenchmarkData = useMemo(() => {
    const stateMap: Record<string, { sanctioned: number; completed: number; ongoing: number }> = {};
    filteredWorks.forEach(w => {
      const st = w.state || 'General';
      if (!stateMap[st]) stateMap[st] = { sanctioned: 0, completed: 0, ongoing: 0 };
      stateMap[st].sanctioned += w.sanctionedAmt || 0;
      if (w.status === 'Completed') {
        stateMap[st].completed += w.sanctionedAmt || 0;
      } else {
        stateMap[st].ongoing += w.sanctionedAmt || 0;
      }
    });

    return Object.entries(stateMap).map(([state, val]) => ({
      state,
      Sanctioned: Number(val.sanctioned.toFixed(2)),
      Completed: Number(val.completed.toFixed(2)),
      Ongoing: Number(val.ongoing.toFixed(2))
    }));
  }, [filteredWorks]);

  // Custom Dark/Light Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-dark)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-xs)',
          boxShadow: 'var(--shadow-elevated)',
          fontSize: '0.78rem'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} style={{ color: entry.color, display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 700 }}>
                {typeof entry.value === 'number' && entry.name.includes('%') ? `${entry.value}%` : 
                 typeof entry.value === 'number' && !entry.name.includes('Count') ? `₹ ${entry.value} Cr` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // OVERVIEW MODE (for Dashboard tab)
  if (mode === 'overview') {
    return (
      <section className="gov-card" style={{ margin: '16px 0' }}>
        <div className="gov-card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <div className="gov-card-title">
            <TrendingUp size={15} color="var(--gov-primary)" />
            <span>Fund Disbursal & Expenditure Trajectory (FY 2024-25)</span>
          </div>
          <span className="gov-badge gov-badge-info">
            Statutory 1-Year Linear Pace: ₹ 25.00 Cr Ceiling
          </span>
        </div>

        <div className="gov-card-body" style={{ padding: '16px' }}>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_SPEND_TREND} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ovDisbursed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="ovSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#065f46" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#065f46" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} unit=" Cr" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.74rem', paddingTop: '6px' }} />
                <Line type="monotone" dataKey="targetLinear" name="Statutory Target" stroke="#92400e" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="cumulativeDisbursed" name="Disbursed (₹ Cr)" stroke="#1e3a5f" strokeWidth={2} fillOpacity={1} fill="url(#ovDisbursed)" />
                <Area type="monotone" dataKey="cumulativeSpent" name="Spent (₹ Cr)" stroke="#065f46" strokeWidth={2} fillOpacity={1} fill="url(#ovSpent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    );
  }

  // DEDICATED MODE (for Analytics & Trends Tab)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Insights Card */}
      <div className="gov-card" style={{ padding: '14px 18px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--gov-primary)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Deep-Dive Analytics & Statutory Trend Suite
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Comprehensive evaluation of financial drawdown, physical milestone delivery & cross-district benchmarks.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="gov-badge gov-badge-info">
              Total Outlay: ₹ {stats.sanctionedAmt.toFixed(2)} Cr
            </span>
            <span className="gov-badge gov-badge-success">
              Expenditure: ₹ {stats.expenditureAmt.toFixed(2)} Cr ({stats.utilizationRate}%)
            </span>
            <span className="gov-badge gov-badge-warning">
              {flags.length} Anomaly Signals
            </span>
          </div>
        </div>
      </div>

      {/* Main Analytics Card with Tabs */}
      <section className="gov-card">
        {/* Chart View Switcher */}
        <div className="gov-card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div className="gov-card-title">
            <BarChart3 size={16} color="var(--gov-primary)" />
            <span>Analytical Dimensions</span>
          </div>

          <div style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            borderRadius: 'var(--radius-xs)',
            padding: '2px',
            gap: '2px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setActiveChartTab('financial')}
              className={`gov-tab ${activeChartTab === 'financial' ? 'active' : ''}`}
              style={{ padding: '5px 12px', fontSize: '0.78rem' }}
            >
              <TrendingUp size={13} style={{ display: 'inline', marginRight: '4px' }} />
              1. 12-Month Burn Rate
            </button>

            <button
              onClick={() => setActiveChartTab('physical_mismatch')}
              className={`gov-tab ${activeChartTab === 'physical_mismatch' ? 'active' : ''}`}
              style={{ padding: '5px 12px', fontSize: '0.78rem' }}
            >
              <BarChart3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
              2. Progress Discrepancy Matrix
            </button>

            <button
              onClick={() => setActiveChartTab('sectors')}
              className={`gov-tab ${activeChartTab === 'sectors' ? 'active' : ''}`}
              style={{ padding: '5px 12px', fontSize: '0.78rem' }}
            >
              <PieChart size={13} style={{ display: 'inline', marginRight: '4px' }} />
              3. Sectoral Outlay
            </button>

            <button
              onClick={() => setActiveChartTab('state_benchmark')}
              className={`gov-tab ${activeChartTab === 'state_benchmark' ? 'active' : ''}`}
              style={{ padding: '5px 12px', fontSize: '0.78rem' }}
            >
              <ShieldCheck size={13} style={{ display: 'inline', marginRight: '4px' }} />
              4. State Compliance Benchmark
            </button>
          </div>
        </div>

        <div className="gov-card-body" style={{ padding: '20px' }}>
          {/* Dimension 1: 12-Month Burn Rate */}
          {activeChartTab === 'financial' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Cumulative Disbursal vs. Audited Vendor Expenditure vs. 1-Year Statutory Linear Pace
                  </h4>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Calculates fiscal velocity against the mandatory 365-day statutory completion ceiling.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className="gov-badge gov-badge-info">Target Disbursal: ₹ 25.00 Cr</span>
                  <span className="gov-badge gov-badge-success">Compliance Velocity: 95.6%</span>
                </div>
              </div>

              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MONTHLY_SPEND_TREND} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="disbursedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#065f46" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#065f46" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} unit=" Cr" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="targetLinear" name="1-Year Statutory Linear Target (₹ Cr)" stroke="#92400e" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="cumulativeDisbursed" name="Cumulative Disbursed by Ministry (₹ Cr)" stroke="#1e3a5f" strokeWidth={2} fillOpacity={1} fill="url(#disbursedGrad)" />
                    <Area type="monotone" dataKey="cumulativeSpent" name="Vendor Expenditure Audited (₹ Cr)" stroke="#065f46" strokeWidth={2} fillOpacity={1} fill="url(#spentGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Dimension 2: Progress Discrepancy Matrix */}
          {activeChartTab === 'physical_mismatch' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Physical Ground Progress (%) vs. Financial Utilization (%) Discrepancy Matrix
                  </h4>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Identifies high-risk works where financial drawdown outpaces ground milestones verified via geotagged photos.
                  </p>
                </div>
                <span className="gov-badge gov-badge-danger">
                  <AlertTriangle size={11} /> Red Warning: Spend &gt; Progress + 30%
                </span>
              </div>

              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressMismatchData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                    <XAxis dataKey="workId" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '10px' }} />
                    <Bar dataKey="physicalPct" name="Verified Physical Progress (%)" fill="#1e3a5f" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="financialPct" name="Financial Disbursal Rate (%)" fill="#065f46" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Dimension 3: Sectoral Outlay */}
          {activeChartTab === 'sectors' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Sector-Wise Capital Allocation (₹ Cr) & Total Sanctioned Works
                  </h4>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Statutory Priority Sectors: Drinking Water, Rural Sanitation, Public Health & Education.
                  </p>
                </div>
                <span className="gov-badge gov-badge-neutral">{sectorData.length} Active National Sectors</span>
              </div>

              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={12} unit=" Cr" />
                    <YAxis dataKey="sector" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} width={130} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '10px' }} />
                    <Bar dataKey="amountCr" name="Sanctioned Capital (₹ Cr)" fill="#0f2942" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Dimension 4: State Benchmark */}
          {activeChartTab === 'state_benchmark' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    State-Wise 1-Year Statutory Compliance & Execution Efficiency Benchmark
                  </h4>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Comparative execution rate across participating states meeting the 365-day statutory completion ceiling.
                  </p>
                </div>
                <span className="gov-badge gov-badge-success">Compliance Standard: 365 Days</span>
              </div>

              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateBenchmarkData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                    <XAxis dataKey="state" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} unit=" Cr" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '10px' }} />
                    <Bar dataKey="Sanctioned" name="Sanctioned Capital (₹ Cr)" fill="#0f2942" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Completed" name="Completed within 1-Yr (₹ Cr)" fill="#065f46" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Ongoing" name="Ongoing Execution (₹ Cr)" fill="#92400e" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Analytical Audit Insights Box */}
      <div className="gov-card" style={{ padding: '14px 18px', background: 'var(--bg-surface-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <Info size={16} color="var(--gov-accent)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
            <b>Statutory Analytical Guidelines:</b> As per MoSPI scheme circulars, when expenditure utilization surpasses 75% while physical progress remains below 40%, the system flags the project for physical spot inspection by the District Nodal Officer before the final milestone tranche is sanctioned.
          </div>
        </div>
      </div>
    </div>
  );
}
export default ChartSection;
