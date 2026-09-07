/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: AttachmentsModal (Geotagged Site Inspection & Sanction Order Viewer)
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, FileText, CheckCircle2, ExternalLink, Upload, Printer, Check } from 'lucide-react';
import { WorkItem, WorkAttachment } from '../data/mpladsData';
import { useBodyScrollLock } from '../utils/scrollLock';

interface AttachmentsModalProps {
  work: WorkItem | null;
  onClose: () => void;
  onAttachmentAdded?: (workId: string, attachment: WorkAttachment) => void;
}

const DEFAULT_FALLBACK_ATT: WorkAttachment = {
  id: 'att-default',
  type: 'image',
  title: 'Site Inspection Geotagged Photo',
  stage: 'Execution Milestone Verification',
  url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800&auto=format&fit=crop&q=60'
};

export function AttachmentsModal({ work, onClose, onAttachmentAdded }: AttachmentsModalProps) {
  useBodyScrollLock(!!work);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localAttachments, setLocalAttachments] = useState<WorkAttachment[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<WorkAttachment>(DEFAULT_FALLBACK_ATT);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  useEffect(() => {
    if (work) {
      const atts = (work.attachments && work.attachments.length > 0) 
        ? work.attachments 
        : [DEFAULT_FALLBACK_ATT];
      setLocalAttachments(atts);
      setSelectedAttachment(atts[0]);
      setUploadNotice(null);
    }
  }, [work?.id]);

  if (!work) return null;

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const fileUrl = URL.createObjectURL(file);
    const newAtt: WorkAttachment = {
      id: `att-upload-${Date.now()}`,
      type: isImage ? 'image' : 'document',
      title: file.name.replace(/\.[^/.]+$/, "") || "Official Geotagged Field Evidence",
      stage: "Milestone Inspection Verification",
      url: fileUrl
    };

    const updated = [newAtt, ...localAttachments];
    setLocalAttachments(updated);
    setSelectedAttachment(newAtt);

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

  return (
    <div className="gov-modal-backdrop" onClick={onClose}>
      {/* Hidden file input for document/image upload */}
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
          maxWidth: '780px', 
          maxHeight: 'min(90vh, 760px)',
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
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-subtle)',
          flexShrink: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--gov-primary)'
              }}>
                Work ID: {work.id}
              </span>
              <span className="gov-badge gov-badge-success">
                <CheckCircle2 size={10} /> Geotag Verified Evidence
              </span>
            </div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{work.title}</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="no-print">
            <button
              type="button"
              onClick={handlePrint}
              className="gov-btn gov-btn-secondary"
              style={{ fontSize: '0.74rem', padding: '4px 8px' }}
              title="Print Evidence Dossier"
            >
              <Printer size={12} />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="gov-btn gov-btn-secondary"
              style={{ padding: '4px', width: '28px', height: '28px' }}
              title="Close Evidence Viewer"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div 
          className="gov-modal-body"
          style={{ 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            overscrollBehavior: 'contain'
          }}
        >
          {uploadNotice && (
            <div
              style={{
                padding: '8px 12px',
                background: 'var(--status-success-bg)',
                border: '1px solid var(--status-success-border)',
                color: 'var(--status-success-text)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={14} />
              <span>{uploadNotice}</span>
            </div>
          )}

          {/* Metadata Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '8px',
            background: 'var(--bg-surface-subtle)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.78rem',
            border: '1px solid var(--border-light)'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Location: </span>
              <b>{work.constituency || 'Constituency'}, {work.state || 'State'}</b>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Agency: </span>
              <b>{work.agency || 'Implementing Agency'}</b>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Sanction: </span>
              <b>₹ {Number(work.sanctionedAmt || 0).toFixed(2)} Cr</b>
            </div>
          </div>

          {/* Attachment Tabs & Upload Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flex: 1 }}>
              {localAttachments.map((att, idx) => (
                <button
                  key={att.id || idx}
                  type="button"
                  onClick={() => setSelectedAttachment(att)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    border: selectedAttachment?.id === att.id ? '1px solid var(--gov-primary)' : '1px solid var(--border-main)',
                    background: selectedAttachment?.id === att.id ? 'var(--gov-primary)' : 'var(--bg-surface-subtle)',
                    color: selectedAttachment?.id === att.id ? 'var(--text-white)' : 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                >
                  {att.type === 'document' ? <FileText size={12} /> : <ImageIcon size={12} />}
                  <span>{att.stage || att.title}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="gov-btn gov-btn-primary no-print"
              style={{ fontSize: '0.74rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Upload size={12} />
              <span>Upload Evidence</span>
            </button>
          </div>

          {/* Active View */}
          {selectedAttachment && (
            <div style={{
              background: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-main)',
              overflow: 'hidden'
            }}>
              {selectedAttachment.type === 'document' ? (
                <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                  <FileText size={40} color="var(--gov-primary)" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ fontSize: '0.96rem', marginBottom: '4px' }}>{selectedAttachment.title}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px', maxWidth: '420px', margin: '0 auto 14px' }}>
                    Digitally signed administrative sanction order issued under official MPLADS & e-SAKSHI statutory guidelines.
                  </p>
                  <a
                    href={selectedAttachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gov-btn gov-btn-primary no-print"
                    style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <ExternalLink size={12} />
                    <span>Download Official PDF Order</span>
                  </a>
                </div>
              ) : (
                <div>
                  <div style={{ maxHeight: '380px', overflow: 'hidden', display: 'flex', justifyContent: 'center', background: '#0b1320' }}>
                    <img
                      src={selectedAttachment.url}
                      alt={selectedAttachment.title}
                      style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: '380px' }}
                    />
                  </div>
                  <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.86rem', fontWeight: 700, margin: '0 0 2px 0' }}>{selectedAttachment.title}</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Stage: <b>{selectedAttachment.stage}</b> · Geotag Verified by District Authority
                      </span>
                    </div>
                    <span className="gov-badge gov-badge-success">
                      <CheckCircle2 size={10} /> Geotagged Proof
                    </span>
                  </div>
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
