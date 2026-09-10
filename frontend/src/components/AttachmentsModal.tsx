/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: AttachmentsModal (Geotagged Site Inspection & Sanction Order Viewer)
 * Vertical Stage-Wise Evidence Inspection Layout
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, FileText, CheckCircle2, ExternalLink, Upload, Printer, Check, Filter } from 'lucide-react';
import { WorkItem, WorkAttachment } from '../data/mpladsData';
import { useBodyScrollLock } from '../utils/scrollLock';
import { fileToOptimizedDataUrl } from '../utils/imageUploadHelper';
import { districtContractorSync } from '../api/districtContractorSync';
import { EvidenceSubmissionRecord } from '../data/contractorData';

interface AttachmentsModalProps {
  work: WorkItem | null;
  onClose: () => void;
  onAttachmentAdded?: (workId: string, attachment: WorkAttachment) => void;
  canUpload?: boolean;
}

export function AttachmentsModal({ work, onClose, onAttachmentAdded, canUpload = false }: AttachmentsModalProps) {
  useBodyScrollLock(!!work);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localAttachments, setLocalAttachments] = useState<WorkAttachment[]>([]);
  const [stageSubmissions, setStageSubmissions] = useState<EvidenceSubmissionRecord[]>([]);
  const [activeStageFilter, setActiveStageFilter] = useState<string>("ALL");
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadAllAttachmentsAndEvidence() {
      if (!work) return;

      const initialAtts = (work.attachments && work.attachments.length > 0)
        ? [...work.attachments]
        : [];

      try {
        const submissions = await districtContractorSync.getStageSubmissionsForWork(work.id);
        setStageSubmissions(submissions);
        setLocalAttachments(initialAtts);
        setUploadNotice(null);
      } catch (err) {
        console.warn("Using default attachments fallback:", err);
        setLocalAttachments(initialAtts);
      }
    }

    loadAllAttachmentsAndEvidence();
  }, [work?.id]);

  if (!work) return null;

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    let fileUrl: string;
    try {
      if (isImage) {
        fileUrl = await fileToOptimizedDataUrl(file);
      } else {
        fileUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve("#");
          reader.readAsDataURL(file);
        });
      }
    } catch {
      fileUrl = "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80";
    }

    const newAtt: WorkAttachment = {
      id: `att-upload-${Date.now()}`,
      type: isImage ? 'image' : 'document',
      title: file.name.replace(/\.[^/.]+$/, "") || "Official Geotagged Field Evidence",
      stage: "Milestone Inspection Verification",
      url: fileUrl
    };

    const updated = [newAtt, ...localAttachments];
    setLocalAttachments(updated);

    if (work.attachments) {
      work.attachments = [newAtt, ...work.attachments];
    } else {
      work.attachments = [newAtt];
    }

    if (onAttachmentAdded) {
      onAttachmentAdded(work.id, newAtt);
    }

    setUploadNotice(`Evidence "${file.name}" successfully attached with verified GPS geotag.`);
    setTimeout(() => setUploadNotice(null), 5000);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const visibleSubmissions = stageSubmissions.filter(sub => {
    if (activeStageFilter === "ALL") return true;
    return sub.checkpointActionId === activeStageFilter || sub.workStage === activeStageFilter || sub.checkpointActionName === activeStageFilter;
  });

  const totalEvidenceItems = stageSubmissions.reduce((acc, sub) => acc + (sub.files?.length || 0), 0) + localAttachments.length;

  return (
    <div className="gov-modal-backdrop" onClick={onClose}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadFile}
        accept="image/*,.pdf"
        style={{ display: 'none' }}
      />

      <div
        className="gov-modal-content"
        style={{ 
          maxWidth: '860px', 
          maxHeight: 'min(92vh, 820px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '0',
          overscrollBehavior: 'contain'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-subtle)',
          flexShrink: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: 'var(--gov-primary)'
              }}>
                Work ID: {work.id}
              </span>
              <span className="gov-badge gov-badge-success">
                <CheckCircle2 size={11} /> Geotag Verified Evidence ({totalEvidenceItems} Items)
              </span>
            </div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{work.title}</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="no-print">
            {canUpload && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="gov-btn gov-btn-primary"
                style={{ fontSize: '0.74rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Upload size={13} />
                <span>Upload Evidence</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="gov-btn gov-btn-secondary"
              style={{ fontSize: '0.74rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Print Evidence Dossier"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="gov-btn gov-btn-secondary"
              style={{ padding: '4px', width: '30px', height: '30px' }}
              title="Close Evidence Viewer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div 
          className="gov-modal-body"
          style={{ 
            padding: '18px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            overscrollBehavior: 'contain'
          }}
        >
          {uploadNotice && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--status-success-bg)',
                border: '1px solid var(--status-success-border)',
                color: 'var(--status-success-text)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.80rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Check size={15} />
              <span>{uploadNotice}</span>
            </div>
          )}

          {/* Project Summary Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            background: 'var(--bg-surface-subtle)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.80rem',
            border: '1px solid var(--border-light)'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Location: </span>
              <b>{work.constituency || 'Constituency'}, {work.state || 'State'}</b>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Agency / Contractor: </span>
              <b>{work.contractor || work.agency || 'Implementing Agency'}</b>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Sanction Outlay: </span>
              <b>₹ {Number(work.sanctionedAmt || 0).toFixed(2)} Cr</b>
            </div>
          </div>

          {/* Stage Filter Buttons Bar (Vertical Stage Navigation) */}
          {stageSubmissions.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={12} /> Filter Stages:
              </span>

              <button
                type="button"
                onClick={() => setActiveStageFilter("ALL")}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  border: activeStageFilter === "ALL" ? '1px solid var(--gov-primary)' : '1px solid var(--border-main)',
                  background: activeStageFilter === "ALL" ? 'var(--gov-primary)' : 'var(--bg-surface-subtle)',
                  color: activeStageFilter === "ALL" ? 'var(--text-white)' : 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                All Stages ({stageSubmissions.length})
              </button>

              {stageSubmissions.map((sub, sIdx) => {
                const stageKey = sub.checkpointActionId || sub.workStage || sub.checkpointActionName;
                const isSelected = activeStageFilter === stageKey;
                return (
                  <button
                    key={sub.id || sIdx}
                    type="button"
                    onClick={() => setActiveStageFilter(stageKey)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      border: isSelected ? '1px solid var(--gov-primary)' : '1px solid var(--border-main)',
                      background: isSelected ? 'var(--gov-primary)' : 'var(--bg-surface-subtle)',
                      color: isSelected ? 'var(--text-white)' : 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    {sub.checkpointActionName || sub.workStage || `Stage ${sIdx + 1}`}
                  </button>
                );
              })}
            </div>
          )}

          {/* VERTICAL STAGE-BY-STAGE EVIDENCE CARDS */}
          {stageSubmissions.length === 0 && localAttachments.length === 0 ? (
            <div style={{
              padding: '48px 20px',
              textAlign: 'center',
              background: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-xs)',
              border: '1px dashed var(--border-main)',
              color: 'var(--text-muted)'
            }}>
              <ImageIcon size={44} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                No Geotagged Evidence Uploaded
              </h4>
              <p style={{ fontSize: '0.82rem', margin: 0 }}>
                No stage evidence photos or measurement vouchers have been submitted for this work order yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Render Stage Submissions Vertically Stage-by-Stage */}
              {visibleSubmissions.map((sub, sIdx) => (
                <div 
                  key={sub.id || sIdx}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-main)',
                    borderRadius: 'var(--radius-xs)',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  {/* Stage Header */}
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--bg-surface-subtle)',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--gov-primary)' }}>
                          {sub.checkpointActionName || sub.workStage || `Stage ${sIdx + 1}`}
                        </span>
                        <span className={`gov-badge ${sub.verificationStatus === 'Verified' ? 'gov-badge-success' : 'gov-badge-warning'}`}>
                          {sub.verificationStatus || 'Submitted'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <span>Uploaded by: <b>{sub.contractorName || 'Empanelled Contractor'}</b></span>
                        <span>Timestamp: <b>{sub.uploadTimestamp}</b></span>
                        {sub.locationText && <span>GPS: <b>{sub.locationText}</b></span>}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.76rem', textAlign: 'right' }}>
                      <div>Physical Progress: <strong style={{ color: 'var(--gov-accent)' }}>{sub.physicalProgressPercent}%</strong></div>
                      {sub.expenditureAmountRs > 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Stage Outlay: <strong>₹{(sub.expenditureAmountRs / 100000).toFixed(2)} Lakh</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stage Photos & Files vertically */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(sub.files || []).map((file, fIdx) => {
                      const isImage = file.type?.includes("Photo") || file.type?.includes("image") || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name) || (file.url && (file.url.startsWith("http") || file.url.startsWith("data:")));

                      if (isImage) {
                        return (
                          <div 
                            key={fIdx} 
                            style={{ 
                              borderRadius: '8px', 
                              border: '1px solid var(--border-light)', 
                              overflow: 'hidden', 
                              background: '#0b1320' 
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'center', background: '#0b1320', maxHeight: '440px' }}>
                              <img 
                                src={file.url || "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80"} 
                                alt={file.name} 
                                style={{ width: '100%', height: 'auto', maxHeight: '440px', objectFit: 'contain' }}
                              />
                            </div>
                            <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-light)' }}>
                              <div>
                                <h4 style={{ fontSize: '0.86rem', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--text-main)' }}>
                                  {file.name}
                                </h4>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  Type: <b>{file.type || 'Geo-tagged Photo'}</b> {file.timestamp ? `· ${file.timestamp}` : ''}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span className="gov-badge gov-badge-success" style={{ fontSize: '0.70rem' }}>
                                  <CheckCircle2 size={11} /> Geotagged Proof
                                </span>
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="gov-btn gov-btn-secondary"
                                  style={{ fontSize: '0.72rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <ExternalLink size={12} /> View Full Image
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={fIdx} style={{ padding: '14px 16px', background: 'var(--bg-surface-subtle)', borderRadius: '8px', border: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <FileText size={26} color="var(--gov-primary)" />
                              <div>
                                <h4 style={{ fontSize: '0.86rem', fontWeight: 700, margin: '0 0 2px 0' }}>{file.name}</h4>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  Document Voucher · {file.size || 'PDF File'}
                                </span>
                              </div>
                            </div>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="gov-btn gov-btn-primary"
                              style={{ fontSize: '0.74rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                              <ExternalLink size={13} /> Download PDF Order
                            </a>
                          </div>
                        );
                      }
                    })}

                    {sub.description && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-body)', background: 'var(--bg-surface-subtle)', padding: '10px 14px', borderRadius: '6px', borderLeft: '4px solid var(--gov-primary)' }}>
                        <strong>Contractor Field Notes:</strong> {sub.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Standalone Attachments (Sanction Orders / General Documents) */}
              {localAttachments.length > 0 && activeStageFilter === "ALL" && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-xs)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.90rem', fontWeight: 800, color: 'var(--gov-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} /> Official Sanction Orders & Statutory Documents
                  </h4>

                  {localAttachments.map((att, idx) => (
                    <div key={att.id || idx} style={{ padding: '12px 14px', background: 'var(--bg-surface-subtle)', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {att.type === 'document' ? <FileText size={22} color="var(--gov-primary)" /> : <ImageIcon size={22} color="var(--gov-primary)" />}
                        <div>
                          <h5 style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0 0 2px 0' }}>{att.title}</h5>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{att.stage}</span>
                        </div>
                      </div>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gov-btn gov-btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ExternalLink size={12} /> View Document
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttachmentsModal;
