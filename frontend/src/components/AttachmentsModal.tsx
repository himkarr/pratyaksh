/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: AttachmentsModal (Geotagged Site Inspection & Sanction Order Viewer)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * Under official MPLADS & e-SAKSHI guidelines, fund release milestones are strictly
 * contingent upon verifiable photographic evidence and digitally signed administrative orders:
 * 
 * 1. Mandatory Geotagging:
 *    - Implementing agencies must capture high-resolution, GPS-tagged photos before sanction,
 *      at 50% physical completion, and upon project handover.
 * 2. Administrative Sanction Orders:
 *    - Officers can inspect and download the official PDF sanction issued by the District Collector.
 */

import React, { useState } from 'react';
import { X, Image as ImageIcon, FileText, CheckCircle2, ExternalLink } from 'lucide-react';
import { WorkItem, WorkAttachment } from '../data/mpladsData';

interface AttachmentsModalProps {
  work: WorkItem | null;
  onClose: () => void;
}

export function AttachmentsModal({ work, onClose }: AttachmentsModalProps) {
  if (!work) return null;

  // Selected attachment active in preview pane (defaults to first photo or mock inspection photo)
  const [selectedAttachment, setSelectedAttachment] = useState<WorkAttachment>(work.attachments?.[0] || {
    id: 'att-default',
    type: 'image',
    title: 'Site Inspection Geotagged Photo',
    stage: 'Execution Phase',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800&auto=format&fit=crop&q=60'
  });

  return (
    <div className="gov-modal-backdrop" onClick={onClose}>
      <div
        className="gov-modal-content"
        style={{ maxWidth: '760px', padding: '0' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-subtle)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--gov-primary)'
              }}>
                Work ID: {work.id}
              </span>
              <span className="gov-badge gov-badge-success">
                <CheckCircle2 size={10} /> Geotag Verified Proof
              </span>
            </div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)' }}>{work.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="gov-btn gov-btn-secondary"
            style={{ padding: '4px', width: '28px', height: '28px' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              <b>{work.constituency}, {work.state}</b>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Agency: </span>
              <b>{work.agency}</b>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Sanction: </span>
              <b>₹ {work.sanctionedAmt.toFixed(2)} Cr</b>
            </div>
          </div>

          {/* Attachment Tabs */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {work.attachments?.map((att, idx) => (
              <button
                key={att.id || idx}
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
                  color: selectedAttachment?.id === att.id ? '#ffffff' : 'var(--text-main)'
                }}
              >
                {att.type === 'document' ? <FileText size={12} /> : <ImageIcon size={12} />}
                <span>{att.stage}</span>
              </button>
            ))}
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
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <FileText size={36} color="var(--gov-primary)" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '0.94rem', marginBottom: '4px' }}>{selectedAttachment.title}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px', maxWidth: '400px', margin: '0 auto 14px' }}>
                    Digitally signed administrative sanction order issued under MPLADS guidelines.
                  </p>
                  <button className="gov-btn gov-btn-primary" style={{ fontSize: '0.78rem' }}>
                    <ExternalLink size={12} />
                    <span>Download Official PDF Order</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ maxHeight: '360px', overflow: 'hidden', display: 'flex', justifyContent: 'center', background: '#0b1320' }}>
                    <img
                      src={selectedAttachment.url}
                      alt={selectedAttachment.title}
                      style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: '360px' }}
                    />
                  </div>
                  <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.84rem', fontWeight: 700 }}>{selectedAttachment.title}</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Stage: <b>{selectedAttachment.stage}</b> · Geotag Verified by District Authority
                      </span>
                    </div>
                    <span className="gov-badge gov-badge-success">
                      <CheckCircle2 size={10} /> Geotagged
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
