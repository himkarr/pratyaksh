import React, { useState, useEffect } from 'react';
import { 
  X, Landmark, Building2, MapPin, Calendar, CheckCircle2, Clock, 
  FileText, ShieldCheck, AlertTriangle, Printer, Download, Eye, Star, UserCheck,
  CreditCard, Layers, Receipt, ListChecks
} from 'lucide-react';
import { WorkItem, WorkAttachment } from '../data/mpladsData';
import { 
  ProjectTimeline, 
  FinancialSummary, 
  EvidenceSection, 
  RiskSection, 
  DeadlineSection 
} from './project';
import { ContractorInspectionPanel } from './district/ContractorInspectionPanel';
import { useBodyScrollLock } from '../utils/scrollLock';
import {
  adminDataService,
  InstallmentRecord,
  PaymentTransactionRecord,
  MilestoneRecord,
  RuleLogRecord,
} from '../api/adminDataService';

import { districtContractorSync } from '../api/districtContractorSync';

interface WorkDetailModalProps {
  work: WorkItem | null;
  onClose: () => void;
  onViewAttachments: (work: WorkItem) => void;
  onViewReviews: (work: WorkItem) => void;
  onAttachmentAdded?: (workId: string, attachment: WorkAttachment) => void;
}

export function WorkDetailModal({ work, onClose, onViewAttachments, onViewReviews, onAttachmentAdded }: WorkDetailModalProps) {
  useBodyScrollLock(!!work);

  const [activeModalTab, setActiveModalTab] = useState<"overview" | "installments" | "inspections" | "rules">("overview");
  const [installments, setInstallments] = useState<InstallmentRecord[]>([]);
  const [payments, setPayments] = useState<PaymentTransactionRecord[]>([]);
  const [dbMilestones, setDbMilestones] = useState<MilestoneRecord[]>([]);
  const [ruleLogs, setRuleLogs] = useState<RuleLogRecord[]>([]);
  const [contractorAttachments, setContractorAttachments] = useState<WorkAttachment[]>([]);
  const [loadingFinancials, setLoadingFinancials] = useState<boolean>(false);

  useEffect(() => {
    if (!work?.id) return;
    setLoadingFinancials(true);
    
    Promise.all([
      adminDataService.getProjectInstallments(work.id),
      adminDataService.getProjectPayments(work.id),
      adminDataService.getProjectMilestones(work.id),
      adminDataService.getProjectRuleLogs(work.id),
      districtContractorSync.getStageSubmissionsForWork(work.id)
    ])
      .then(([inst, pay, ms, rules, stageSubmissions]) => {
        setInstallments(inst);
        setPayments(pay);
        setDbMilestones(ms);
        setRuleLogs(rules);

        const loadedAtts: WorkAttachment[] = [];
        stageSubmissions.forEach(sub => {
          (sub.files || []).forEach((file, fIdx) => {
            const isImage = file.type?.includes("Photo") || file.type?.includes("image") || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name) || (file.url && (file.url.startsWith("http") || file.url.startsWith("data:")));
            loadedAtts.push({
              id: `contractor-ev-${sub.id}-${fIdx}`,
              type: isImage ? 'image' : 'document',
              title: `${sub.checkpointActionName || sub.workStage} — ${file.name}`,
              stage: `Uploaded by ${sub.contractorName || 'Contractor'} (${sub.verificationStatus || 'Submitted'})`,
              url: file.url || "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80"
            });
          });
        });
        setContractorAttachments(loadedAtts);
      })
      .catch((err) => console.warn("Failed to load project financials or evidence:", err))
      .finally(() => setLoadingFinancials(false));
  }, [work?.id]);

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
    <div className="gov-modal-backdrop" onClick={onClose} style={{ backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.65)' }}>
      <div
        className="gov-modal-content"
        style={{
          maxWidth: '880px',
          maxHeight: 'min(92vh, 880px)',
          padding: '0',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overscrollBehavior: 'contain',
          background: '#ffffff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={20} color="#2563eb" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Work Dossier & Project Inspection
                </h3>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1'
                }}>
                  {work.id}
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0 0' }}>
                e-SAKSHI Sanction Ref: AS/DRDA/{(work.state || "IN").slice(0, 2).toUpperCase()}/2024/{(work.id || "000").replace('MPLAD-', '')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="no-print">
            <button
              type="button"
              onClick={handlePrintDossier}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#334155',
                cursor: 'pointer'
              }}
              title="Print Dossier"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#f1f5f9',
                border: 'none',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close Dossier"
            >
              <X size={18} />
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

            {(work.justification || work.districtNotes || work.citizenRequestId) && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-main)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                {work.citizenRequestId && (
                  <div>
                    <span className="gov-badge gov-badge-info" style={{ marginRight: '6px' }}>Public Representation</span>
                    Linked Citizen Grievance ID: <b>#{work.citizenRequestId}</b>
                  </div>
                )}
                {work.justification && (
                  <div style={{ color: 'var(--text-body)' }}>
                    <b>Public Justification & Need:</b> {work.justification}
                  </div>
                )}
                {work.districtNotes && (
                  <div style={{ color: 'var(--text-muted)' }}>
                    <b>Nodal Authority Scrutiny Notes:</b> {work.districtNotes}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold overflow-x-auto no-print">
            <button
              type="button"
              onClick={() => setActiveModalTab("overview")}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeModalTab === "overview"
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText size={13} />
              Overview & Timeline
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab("installments")}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeModalTab === "installments"
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt size={13} />
              Installments & Payments ({installments.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab("inspections")}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeModalTab === "inspections"
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CreditCard size={13} />
              Contractor & Evidence
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab("rules")}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeModalTab === "rules"
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListChecks size={13} />
              Statutory Rules & AI Logs ({ruleLogs.length})
            </button>
          </div>

          {/* TAB 1: OVERVIEW & TIMELINE */}
          {activeModalTab === "overview" && (
            <>
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
            </>
          )}

          {/* TAB 2: FINANCIAL INSTALLMENTS & PAYMENTS */}
          {activeModalTab === "installments" && (
            <div className="space-y-4 text-xs">
              {/* Installment Tranches Table */}
              <div className="civic-card p-4">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Government Financial Installments & Tranche Releases
                </h4>
                {loadingFinancials ? (
                  <div className="py-6 text-center text-slate-400">Loading tranches from Supabase...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                          <th className="py-2 px-3">Tranche #</th>
                          <th className="py-2 px-3">Released Amount</th>
                          <th className="py-2 px-3">Utilized Amount</th>
                          <th className="py-2 px-3">Release Date</th>
                          <th className="py-2 px-3">Remaining Balance</th>
                          <th className="py-2 px-3">Official Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {installments.map((inst) => (
                          <tr key={inst.financial_id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-blue-700">Tranche #{inst.installment_no}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              ₹{inst.amount_released?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-emerald-700">
                              ₹{inst.amount_utilized?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{inst.release_date || 'N/A'}</td>
                            <td className="py-2.5 px-3 font-medium text-amber-700">
                              ₹{inst.balance?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={inst.remarks || ''}>
                              {inst.remarks || 'Standard release upon certification'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Direct Bank Disbursements */}
              <div className="civic-card p-4">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Bank Disbursement & UTR Payment Records
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                        <th className="py-2 px-3">UTR / Reference No</th>
                        <th className="py-2 px-3">Mode</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Disbursement Date</th>
                        <th className="py-2 px-3">Audit Anomaly</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.transaction_id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{p.cheque_or_utr_no}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                              {p.payment_mode}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-emerald-700">
                            ₹{p.amount?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{p.payment_date}</td>
                          <td className="py-2 px-3">
                            {p.anomaly_flag ? (
                              <span className="text-rose-600 font-bold flex items-center gap-1">
                                <AlertTriangle size={12} /> Flagged
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={12} /> Verified Clean
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTRACTOR & EVIDENCE */}
          {activeModalTab === "inspections" && (
            <>
              {/* Contractor Profile & Stage Submissions Inspection Section */}
              <ContractorInspectionPanel work={work} />

              {/* Geotagged Evidence Section with Direct Upload & Contractor Evidence */}
              <EvidenceSection
                attachments={[...contractorAttachments, ...(work.attachments || [])]}
                canUpload={false}
                onAttachmentAdded={handleAttachmentAdded}
              />
            </>
          )}

          {/* TAB 4: STATUTORY RULES & AI EVALUATION LOGS */}
          {activeModalTab === "rules" && (
            <div className="space-y-4 text-xs">
              <div className="civic-card p-4">
                <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-purple-600" />
                  Statutory Rule Engine Evaluations (MoSPI Guidelines 2023)
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Deterministic guidelines enforcement executed per project transaction.
                </p>

                <div className="space-y-2.5">
                  {ruleLogs.map((r) => (
                    <div
                      key={r.rule_log_id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{r.rule_name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700">
                            {r.rule_type}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{r.details}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Evaluated: {new Date(r.evaluated_at).toLocaleDateString()}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                          r.rule_result === "Pass"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {r.rule_result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones Verification Trail */}
              <div className="civic-card p-4">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Physical Milestones & Engineering Signoffs
                </h4>
                <div className="space-y-2">
                  {dbMilestones.map((m) => (
                    <div
                      key={m.milestone_id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {m.expected_percentage}%
                        </span>
                        <span className="font-semibold text-slate-800">{m.milestone_name}</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          m.verified ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {m.verified ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                        {m.verified ? "Certified Verified" : "Pending Signoff"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


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
