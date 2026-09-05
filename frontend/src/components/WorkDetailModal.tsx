import React from 'react';
import { 
  X, Landmark, Building2, MapPin, Calendar, CheckCircle2, Clock, 
  FileText, ShieldCheck, AlertTriangle, Printer, Download, Eye, Star, UserCheck 
} from 'lucide-react';
import { WorkItem } from '../data/mpladsData';

interface WorkDetailModalProps {
  work: WorkItem | null;
  onClose: () => void;
  onViewAttachments: (work: WorkItem) => void;
  onViewReviews: (work: WorkItem) => void;
}

export function WorkDetailModal({ work, onClose, onViewAttachments, onViewReviews }: WorkDetailModalProps) {
  if (!work) return null;

  const finPct = work.sanctionedAmt > 0 ? Math.round((work.expenditureAmt / work.sanctionedAmt) * 100) : 0;
  const isDelayed = work.status === 'Delayed' || (work.physicalProgress < 25 && finPct > 60);

  // 6-Stage Government Milestone Pipeline
  const milestones = [
    { title: "MP Recommendation", date: "Jan 2024", completed: true, actor: work.mpName },
    { title: "Administrative Sanction", date: work.dateSanctioned, completed: true, actor: "District Magistrate" },
    { title: "1st Tranche Released (50%)", date: "Mar 2024", completed: work.expenditureAmt > 0, actor: "DRDA Nodal Officer" },
    { title: "Mid-Term Geotag Inspection", date: "Jun 2024", completed: work.physicalProgress >= 50, actor: "Assistant Engineer" },
    { title: "Social Audit & Rating", date: "Aug 2024", completed: work.reviewsCount > 0, actor: "Citizen Panel" },
    { title: "Completion & Final UC", date: work.targetCompletion, completed: work.status === 'Completed', actor: "State Nodal Dept" }
  ];

  return (
    <div className="gov-modal-backdrop" onClick={onClose}>
      <div
        className="gov-modal-content"
        style={{
          maxWidth: '780px',
          padding: '0',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          border: '1px solid var(--border-dark)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          background: 'var(--gov-header)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              padding: '6px',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>
                  Official Work Dossier & Inspection Record
                </h3>
                <span className="gov-badge gov-badge-info" style={{ fontSize: '0.66rem' }}>
                  {work.id}
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                e-SAKSHI Sanction Reference: AS/DRDA/{work.state.slice(0, 2).toUpperCase()}/2024/{work.id.replace('MPLAD-', '')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => window.print()}
              className="gov-btn gov-btn-secondary"
              style={{
                fontSize: '0.74rem',
                padding: '4px 8px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
              title="Print Dossier"
            >
              <Printer size={12} />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                padding: '5px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Work Title & Location Summary */}
          <div style={{
            background: 'var(--bg-surface-subtle)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-main)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <span className="gov-badge gov-badge-neutral" style={{ marginBottom: '6px' }}>
                  {work.sectorName}
                </span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {work.title}
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <span><b>Constituency:</b> {work.constituency} ({work.constituency_code})</span>
                  <span><b>District:</b> {work.district}, {work.state}</span>
                  <span><b>Hon'ble MP:</b> {work.mpName}</span>
                </div>
              </div>

              <span className={`gov-badge ${
                work.status === 'Completed' ? 'gov-badge-success' :
                work.status === 'Delayed' ? 'gov-badge-danger' : 'gov-badge-info'
              }`} style={{ fontSize: '0.76rem', padding: '4px 9px', fontWeight: 700 }}>
                Status: {work.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Key Financial & Physical Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div className="gov-card" style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Sanctioned Amount
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                ₹ {work.sanctionedAmt.toFixed(2)} Cr
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Admin Sanctioned</div>
            </div>

            <div className="gov-card" style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Audited Expenditure
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gov-primary)', marginTop: '2px' }}>
                ₹ {work.expenditureAmt.toFixed(2)} Cr
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{finPct}% Drawdown</div>
            </div>

            <div className="gov-card" style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Physical Progress
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: work.physicalProgress === 100 ? 'var(--status-success-text)' : 'var(--text-main)', marginTop: '2px' }}>
                {work.physicalProgress}%
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Site Verified</div>
            </div>

            <div className="gov-card" style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                1-Year Statutory Rule
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isDelayed ? 'var(--status-danger-text)' : 'var(--status-success-text)', marginTop: '4px' }}>
                {isDelayed ? 'Overdue (>365d)' : 'Compliant (<365d)'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Target: {work.targetCompletion}</div>
            </div>
          </div>

          {/* 6-Stage Milestone Progress Tracker */}
          <div className="gov-card" style={{ padding: '14px 16px' }}>
            <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>
              Statutory 6-Stage Milestone Execution Pipeline
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
              {milestones.map((m, idx) => (
                <div key={idx} style={{
                  background: m.completed ? 'var(--status-success-bg)' : 'var(--bg-surface-subtle)',
                  border: `1px solid ${m.completed ? 'var(--status-success-border)' : 'var(--border-main)'}`,
                  padding: '8px',
                  borderRadius: 'var(--radius-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {m.completed ? (
                      <CheckCircle2 size={12} color="var(--status-success-text)" />
                    ) : (
                      <Clock size={12} color="var(--text-muted)" />
                    )}
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: m.completed ? 'var(--status-success-text)' : 'var(--text-muted)' }}>
                      Stage {idx + 1}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                    {m.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Implementing Agency & Contractor Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="gov-card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Building2 size={14} color="var(--gov-primary)" />
                <h6 style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase' }}>Implementing Agency</h6>
              </div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {work.agency}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                District Project Execution Division · PFMS SNA Account: <b>SNA-PFMS-IN-00982</b>
              </p>
            </div>

            <div className="gov-card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <UserCheck size={14} color="var(--gov-primary)" />
                <h6 style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase' }}>Authorized Vendor / Contractor</h6>
              </div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {work.contractor}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                GSTIN: <b>27AAACI1234F1Z5</b> · Verification Status: <b>KYC Approved</b>
              </p>
            </div>
          </div>

          {/* Actions Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-light)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { onClose(); onViewAttachments(work); }}
                className="gov-btn gov-btn-secondary"
                style={{ fontSize: '0.76rem', padding: '6px 12px' }}
              >
                <Eye size={13} />
                <span>Inspect Geotagged Photos ({work.attachments?.length || 2})</span>
              </button>

              <button
                onClick={() => { onClose(); onViewReviews(work); }}
                className="gov-btn gov-btn-secondary"
                style={{ fontSize: '0.76rem', padding: '6px 12px' }}
              >
                <Star size={13} />
                <span>Social Audit & Citizen Ratings ({work.rating} ★)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="gov-btn gov-btn-primary"
              style={{ fontSize: '0.76rem', padding: '6px 14px' }}
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default WorkDetailModal;
