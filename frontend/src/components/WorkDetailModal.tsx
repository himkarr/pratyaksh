import React from 'react';
import { 
  X, Landmark, Building2, MapPin, Calendar, CheckCircle2, Clock, 
  FileText, ShieldCheck, AlertTriangle, Printer, Download, Eye, Star, UserCheck 
} from 'lucide-react';
import { WorkItem, WorkAttachment } from '../data/mpladsData';
import { 
  ProjectTimeline, 
  FinancialSummary, 
  EvidenceSection, 
  RiskSection, 
  DeadlineSection 
} from './project';
import { useBodyScrollLock } from '../utils/scrollLock';

interface WorkDetailModalProps {
  work: WorkItem | null;
  onClose: () => void;
  onViewAttachments: (work: WorkItem) => void;
  onViewReviews: (work: WorkItem) => void;
  onAttachmentAdded?: (workId: string, attachment: WorkAttachment) => void;
}

export function WorkDetailModal({ work, onClose, onViewAttachments, onViewReviews, onAttachmentAdded }: WorkDetailModalProps) {
  useBodyScrollLock(!!work);

  if (!work) return null;

  const finPct = (work.sanctionedAmt || 0) > 0 
    ? Math.round(((work.expenditureAmt || 0) / work.sanctionedAmt) * 100) 
    : 0;
  const isDelayed = work.status === 'Delayed' || ((work.physicalProgress || 0) < 25 && finPct > 60);

  // 6-Stage Government Milestone Pipeline
  const milestones = [
    { title: "MP Recommendation", date: "Jan 2024", completed: true, actor: work.mpName || "Hon'ble MP" },
    { title: "Administrative Sanction", date: work.dateSanctioned || "2024-03-31", completed: true, actor: "District Magistrate" },
    { title: "1st Tranche Released (50%)", date: "Mar 2024", completed: (work.expenditureAmt || 0) > 0, actor: "DRDA Nodal Officer" },
    { title: "Mid-Term Geotag Inspection", date: "Jun 2024", completed: (work.physicalProgress || 0) >= 50, actor: "Assistant Engineer" },
    { title: "Social Audit & Rating", date: "Aug 2024", completed: (work.reviewsCount || 0) > 0, actor: "Citizen Panel" },
    { title: "Completion & Final UC", date: work.targetCompletion || "2025-03-31", completed: work.status === 'Completed', actor: "State Nodal Dept" }
  ];

  const handlePrintDossier = () => {
    window.print();
  };

  const handleAttachmentAdded = (newAtt: WorkAttachment) => {
    if (!work.attachments) {
      work.attachments = [];
    }
    work.attachments.unshift(newAtt);
    if (onAttachmentAdded) {
      onAttachmentAdded(work.id, newAtt);
    }
  };

  return (
    <div className="gov-modal-backdrop" onClick={onClose}>
      <div
        className="gov-modal-content"
        style={{
          maxWidth: '840px',
          maxHeight: 'min(92vh, 880px)',
          padding: '0',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border-dark)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overscrollBehavior: 'contain'
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          flexShrink: 0
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
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px', margin: 0 }}>
                  Official Work Dossier & Inspection Record
                </h3>
                <span className="gov-badge gov-badge-info" style={{ fontSize: '0.66rem' }}>
                  {work.id}
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#cbd5e1', margin: '2px 0 0 0' }}>
                e-SAKSHI Sanction Reference: AS/DRDA/{(work.state || "IN").slice(0, 2).toUpperCase()}/2024/{(work.id || "000").replace('MPLAD-', '')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="no-print">
            <button
              type="button"
              onClick={handlePrintDossier}
              className="gov-btn gov-btn-secondary no-print"
              style={{
                fontSize: '0.74rem',
                padding: '4px 8px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
              title="Print Dossier (Prints only this selected document)"
            >
              <Printer size={12} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="no-print"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                padding: '5px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer'
              }}
              title="Close Dossier"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div 
          className="gov-modal-body"
          style={{ 
            padding: '20px', 
            background: 'var(--bg-surface)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            overscrollBehavior: 'contain'
          }}
        >
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
                  {work.sectorName || work.category || 'Public Infrastructure'}
                </span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {work.title}
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <span><b>Constituency:</b> {work.constituency || 'N/A'} ({work.constituency_code || 'N/A'})</span>
                  <span><b>District:</b> {work.district || 'N/A'}, {work.state || 'N/A'}</span>
                  <span><b>Hon'ble MP:</b> {work.mpName || 'N/A'}</span>
                </div>
              </div>

              <span className={`gov-badge ${
                work.status === 'Completed' ? 'gov-badge-success' :
                work.status === 'Delayed' ? 'gov-badge-danger' : 'gov-badge-info'
              }`} style={{ fontSize: '0.76rem', padding: '4px 9px', fontWeight: 700 }}>
                Status: {(work.status || 'Ongoing').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Financial Breakdown Section */}
          <FinancialSummary project={work} />

          {/* Statutory 365-Day Timeline Section */}
          <ProjectTimeline
            project={work}
            predictedCompletionDate={work.status === 'Completed' ? (work.targetCompletion || '2024-12-31') : '2025-04-18'}
            elapsedDays={isDelayed ? 320 : 190}
            delayRatio={isDelayed ? 1.35 : 0.95}
          />

          {/* AI Risk & Anomaly Signals Section */}
          <RiskSection
            riskLevel={isDelayed ? "HIGH" : "LOW"}
            verificationPriority={isDelayed ? "PRIORITY_1" : "PRIORITY_3"}
            mlRiskScore={isDelayed ? 0.88 : 0.24}
            ruleRiskScore={isDelayed ? 0.80 : 0.15}
            combinedRiskScore={isDelayed ? 0.85 : 0.20}
            ruleFailures={isDelayed ? [
              "Rule R-03: Expenditure trajectory deviates from statutory 12-month burn rate benchmark",
              "Rule R-07: Mid-stage geotag photos pending field officer re-inspection"
            ] : ["Rule R-01: Compliant milestone execution velocity"]}
            riskReason={isDelayed ? "Unusual ML anomaly pattern; 1-year ceiling deadline risk require review" : "Standard progress pattern; routine monitoring"}
          />

          {/* Geotagged Evidence Section with Direct Upload */}
          <EvidenceSection
            attachments={work.attachments || []}
            canUpload={true}
            onAttachmentAdded={handleAttachmentAdded}
          />

          {/* Actions Bar */}
          <div 
            className="no-print"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-light)',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => { onClose(); onViewAttachments(work); }}
                className="gov-btn gov-btn-secondary"
                style={{ fontSize: '0.76rem', padding: '6px 12px' }}
              >
                <Eye size={13} />
                <span>Inspect Geotagged Photos ({work.attachments?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => { onClose(); onViewReviews(work); }}
                className="gov-btn gov-btn-secondary"
                style={{ fontSize: '0.76rem', padding: '6px 12px' }}
              >
                <Star size={13} />
                <span>Social Audit & Citizen Ratings ({work.rating || 4.2} ★)</span>
              </button>
            </div>

            <button
              type="button"
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
