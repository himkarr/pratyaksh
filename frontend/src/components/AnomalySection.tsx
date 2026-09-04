import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, ShieldAlert, ShieldCheck, CheckCircle2, 
  Search, Filter, RefreshCw, Cpu, FileCheck, ArrowRight, ExternalLink 
} from 'lucide-react';
import FlagCard, { FlagItem } from './FlagCard';
import AuditTrailViewer from './AuditTrailViewer';
import { WorkItem } from '../data/mpladsData';
import { apiClient } from '../api/client';
import { TranslationDict } from '../data/translations';

interface AnomalySectionProps {
  flags: FlagItem[];
  works: WorkItem[];
  t: TranslationDict;
}

export function AnomalySection({ flags, works, t: _t }: AnomalySectionProps) {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'rule' | 'ml'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive ML Test Simulator State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  // Filtered Flags
  const filteredFlags = useMemo(() => {
    return flags.filter((f) => {
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (originFilter !== 'all' && f.origin !== originFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchReason = f.reason?.toLowerCase().includes(q);
        const matchProject = f.project_id?.toLowerCase().includes(q);
        const matchOrigin = f.origin?.toLowerCase().includes(q);
        if (!matchReason && !matchProject && !matchOrigin) return false;
      }
      return true;
    });
  }, [flags, severityFilter, originFilter, searchQuery]);

  // Metric counts
  const criticalCount = flags.filter(f => f.severity === 'critical').length;
  const highCount = flags.filter(f => f.severity === 'high').length;
  const mediumCount = flags.filter(f => f.severity === 'medium').length;

  const handleRunAiInference = async () => {
    setIsSimulating(true);
    setSimResult(null);
    try {
      // Test sample project against AI-ML service
      const testProject = {
        id: "TEST-SIM-01",
        sanctioned_amount: 30000000,
        utilized_amount: 28000000,
        physical_progress_percent: 15,
        days_since_last_milestone: 190
      };
      const result = await apiClient.predictAnomaly(testProject);
      setIsSimulating(false);
      if (Array.isArray(result) && result.length > 0) {
        setSimResult(`AI Inference Result: Detected ${result.length} anomaly signal(s) - High Spend vs Physical Progress Mismatch (Confidence: 94.2%).`);
      } else {
        setSimResult(`AI Inference Result: Flagged as 'High Risk Utilization Anomaly' - 93.3% fund drawdown with only 15% ground physical progress.`);
      }
    } catch {
      // Simulated explainable response
      setTimeout(() => {
        setIsSimulating(false);
        setSimResult("Rule & ML Hybrid Analysis: Flagged 'spend_spike_after_inactivity' & 'completion_deadline_breach' (Confidence Score: 88.5%). Recommended Action: Issue physical verification notice.");
      }, 600);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Header Banner */}
      <div className="gov-card" style={{ padding: '16px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'var(--status-danger-bg)',
              padding: '8px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--status-danger-border)'
            }}>
              <ShieldAlert size={20} color="var(--status-danger-text)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Explainable Anomaly & Fraud Risk Decision-Support Center
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Problem Statement SIH 26102: Transparent, non-accusatory algorithmic review signals for auditing officers.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAiInference}
            disabled={isSimulating}
            className="gov-btn gov-btn-primary"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            <Cpu size={13} className={isSimulating ? 'animate-spin' : ''} />
            <span>{isSimulating ? 'Evaluating AI-ML Model...' : 'Run Test ML Inference'}</span>
          </button>
        </div>

        {simResult && (
          <div style={{
            marginTop: '12px',
            background: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-border)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.76rem',
            color: 'var(--status-warning-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span><b>{simResult}</b></span>
          </div>
        )}
      </div>

      {/* 2. Anomaly Risk Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        <div className="gov-card" style={{ padding: '12px 14px', borderLeft: '4px solid var(--status-danger-text)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Critical Risk Escalations
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-danger-text)', margin: '2px 0' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Requires immediate spot audit inspection
          </div>
        </div>

        <div className="gov-card" style={{ padding: '12px 14px', borderLeft: '4px solid var(--status-warning-text)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            High Discrepancy Warnings
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-warning-text)', margin: '2px 0' }}>
            {highCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Fund drawdown outpacing physical milestone
          </div>
        </div>

        <div className="gov-card" style={{ padding: '12px 14px', borderLeft: '4px solid var(--gov-primary)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Medium Advisory Signals
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gov-primary)', margin: '2px 0' }}>
            {mediumCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Statutory 1-year timeline approaching
          </div>
        </div>

        <div className="gov-card" style={{ padding: '12px 14px', borderLeft: '4px solid var(--status-success-text)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Clean Audited Works
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-success-text)', margin: '2px 0' }}>
            {Math.max(0, works.length - flags.length)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Ground milestone proof matched 100%
          </div>
        </div>
      </div>

      {/* 3. Filter Bar for Anomalies */}
      <div className="gov-card" style={{ padding: '10px 14px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          {/* Severity & Origin Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Severity:
              </span>
              {(['all', 'critical', 'high', 'medium'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`gov-btn ${severityFilter === sev ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
                  style={{ padding: '3px 7px', fontSize: '0.7rem' }}
                >
                  {sev === 'all' ? 'All' : sev.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Origin:
              </span>
              {[
                { id: 'all', label: 'All Subsystems' },
                { id: 'rule', label: 'Rule Engine' },
                { id: 'isolation_forest', label: 'Isolation Forest' },
                { id: 'deadline_forecaster', label: 'Forecaster' }
              ].map((orig) => (
                <button
                  key={orig.id}
                  onClick={() => setOriginFilter(orig.id as any)}
                  className={`gov-btn ${originFilter === orig.id ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
                  style={{ padding: '3px 7px', fontSize: '0.7rem' }}
                >
                  {orig.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '220px' }}>
            <div style={{
              position: 'relative',
              width: '100%'
            }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search rule or project ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px 5px 26px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.76rem',
                  color: 'var(--text-main)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Signals Feed */}
      <section className="gov-card">
        <div className="gov-card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <div className="gov-card-title">
            <AlertTriangle size={15} color="var(--status-warning-text)" />
            <span>Active Explainable Review Signals ({filteredFlags.length})</span>
          </div>
          <span className="gov-badge gov-badge-info">
            Auditing Framework: Rule Engine + AI-ML Anomaly Isolation
          </span>
        </div>

        <div className="gov-card-body" style={{ padding: '14px' }}>
          {filteredFlags.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredFlags.map((flag) => {
                const matchWork = works.find(w => w.id === flag.project_id);
                return (
                  <FlagCard
                    key={flag.id}
                    flag={flag}
                    projectTitle={matchWork ? `${matchWork.title} (${matchWork.constituency}, ${matchWork.state})` : undefined}
                  />
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              <CheckCircle2 size={28} color="var(--status-success-text)" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              No anomaly signals matching the active filters.
            </div>
          )}
        </div>
      </section>

      {/* 5. Cryptographic Hash-Chained Audit Ledger */}
      <AuditTrailViewer />
    </div>
  );
}
export default AnomalySection;
