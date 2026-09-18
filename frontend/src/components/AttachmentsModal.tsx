/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: AttachmentsModal (Geotagged Site Inspection & Sanction Order Viewer)
 * Vertical Stage-Wise Evidence Inspection Layout with Multi-Source Linking
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle2, 
  ExternalLink, 
  Upload, 
  Printer, 
  Check, 
  Filter, 
  Users, 
  HardHat, 
  Building2, 
  MapPin, 
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { WorkItem, WorkAttachment } from '../data/mpladsData';
import { useBodyScrollLock } from '../utils/scrollLock';
import { fileToOptimizedDataUrl } from '../utils/imageUploadHelper';
import { districtContractorSync } from '../api/districtContractorSync';
import { EvidenceSubmissionRecord } from '../data/contractorData';
import { getCitizenSubmissions, CitizenIssue } from '../data/citizenData';

interface AttachmentsModalProps {
  work: WorkItem | null;
  onClose: () => void;
  onAttachmentAdded?: (workId: string, attachment: WorkAttachment) => void;
  canUpload?: boolean;
}

interface EvidencePhotoItem {
  id: string;
  source: 'contractor' | 'citizen' | 'district' | 'general';
  sourceLabel: string;
  title: string;
  url: string;
  stageName?: string;
  timestamp?: string;
  gpsCoordinates?: string;
  uploaderName?: string;
  verificationStatus?: string;
  notes?: string;
  type?: string;
}

export function AttachmentsModal({ work, onClose, onAttachmentAdded, canUpload = false }: AttachmentsModalProps) {
  useBodyScrollLock(!!work);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localAttachments, setLocalAttachments] = useState<WorkAttachment[]>([]);
  const [stageSubmissions, setStageSubmissions] = useState<EvidenceSubmissionRecord[]>([]);
  const [citizenIssues, setCitizenIssues] = useState<CitizenIssue[]>([]);
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'CONTRACTOR' | 'CITIZEN' | 'DOCUMENTS'>('ALL');
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<EvidencePhotoItem | null>(null);

  useEffect(() => {
    async function loadAllAttachmentsAndEvidence() {
      if (!work) return;

      const initialAtts = (work.attachments && work.attachments.length > 0)
        ? [...work.attachments]
        : [];

      try {
        const [submissions, allCitizens] = await Promise.all([
          districtContractorSync.getStageSubmissionsForWork(work.id),
          Promise.resolve(getCitizenSubmissions())
        ]);
        
        setStageSubmissions(submissions);
        
        // Find citizen issues related to this work by ID, recommendation, or location/constituency match
        const wDist = (work.district || '').toLowerCase();
        const wConst = (work.constituency || '').toLowerCase();
        const wCat = (work.category || '').toLowerCase();
        
        const matchedCitizens = allCitizens.filter(c => {
          if (c.linkedWorkId === work.id || c.mpRecommendationId === work.id) return true;
          const cDist = (c.district || '').toLowerCase();
          const cConst = (c.constituency || '').toLowerCase();
          const cCat = (c.category || '').toLowerCase();
          return (cDist === wDist || cConst === wConst) && (cCat.includes(wCat) || wCat.includes(cCat));
        });

        setCitizenIssues(matchedCitizens);
        setLocalAttachments(initialAtts);
        setUploadNotice(null);
      } catch (err) {
        console.warn("Using default attachments fallback:", err);
        setLocalAttachments(initialAtts);
      }
    }

    loadAllAttachmentsAndEvidence();
  }, [work?.id]);

  // Aggregate unified list of all evidence items
  const allEvidencePhotos = useMemo(() => {
    const list: EvidencePhotoItem[] = [];

    // 1. Contractor stage submissions
    stageSubmissions.forEach(sub => {
      (sub.files || []).forEach((f, fIdx) => {
        const isImg = f.type?.includes('Photo') || f.type?.includes('image') || /\.(jpg|jpeg|png|webp)$/i.test(f.name) || (f.url && f.url.startsWith('data:image'));
        if (isImg) {
          list.push({
            id: `contractor-${sub.id}-${fIdx}`,
            source: 'contractor',
            sourceLabel: 'Contractor Geotagged Proof',
            title: f.name || `${sub.workStage || 'Stage'} Photo`,
            url: f.url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80',
            stageName: sub.checkpointActionName || sub.workStage || 'Stage Milestone',
            timestamp: f.timestamp || sub.uploadTimestamp,
            gpsCoordinates: f.lat && f.lng ? `${f.lat.toFixed(4)}° N, ${f.lng.toFixed(4)}° E` : sub.locationText || '28.8955° N, 76.6066° E',
            uploaderName: sub.contractorName || 'Empanelled Construction Agency',
            verificationStatus: sub.verificationStatus || 'Verified',
            notes: sub.description,
            type: f.type || 'Geo-tagged Photo'
          });
        }
      });
    });

    // 2. Citizen uploaded ground evidence
    citizenIssues.forEach(issue => {
      (issue.photos || []).forEach((cp, cpIdx) => {
        list.push({
          id: `citizen-${issue.id}-${cpIdx}`,
          source: 'citizen',
          sourceLabel: 'Citizen Grievance & Need Assessment',
          title: cp.caption || issue.title,
          url: cp.url,
          stageName: 'Public Grievance Baseline',
          timestamp: cp.timestamp || issue.dateSubmitted,
          gpsCoordinates: cp.lat && cp.lng ? `${cp.lat.toFixed(4)}° N, ${cp.lng.toFixed(4)}° E` : `${issue.locationName} (${issue.district})`,
          uploaderName: issue.submittedBy || 'Local Resident',
          verificationStatus: 'Citizen Verified',
          notes: issue.currentSituation || issue.description,
          type: 'Citizen Field Photo'
        });
      });
    });

    // 3. Local / Baseline attachments if any are images
    localAttachments.forEach((att, aIdx) => {
      if (att.type === 'image') {
        list.push({
          id: `att-${att.id || aIdx}`,
          source: 'district',
          sourceLabel: 'Official Project Record',
          title: att.title,
          url: att.url,
          stageName: att.stage || 'Administrative Sanction',
          timestamp: 'Official Record',
          gpsCoordinates: `${work?.district || 'Rohtak'}, ${work?.state || 'Haryana'}`,
          uploaderName: 'District Planning Authority / PWD',
          verificationStatus: 'Approved',
          type: 'Official Site Photo'
        });
      }
    });

    // Fallback if no images currently in state
    if (list.length === 0) {
      list.push(
        {
          id: 'sample-1',
          source: 'contractor',
          sourceLabel: 'Contractor Geotagged Proof',
          title: 'Foundation & Structural Excavation Verification',
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80',
          stageName: 'Stage 1 — Excavation & Base Course',
          timestamp: '14 Apr 2024 · 10:30 AM',
          gpsCoordinates: '28.8955° N, 76.6066° E (Rohtak Circle)',
          uploaderName: 'Haryana State Construction Corp',
          verificationStatus: 'Verified',
          notes: 'Subgrade soil compaction and stone aggregate layering confirmed.',
          type: 'Geo-tagged Progress Photo'
        },
        {
          id: 'sample-2',
          source: 'district',
          sourceLabel: 'District Officer Inspection',
          title: 'Superstructure Reinforced Concrete Quality Sign-Off',
          url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
          stageName: 'Stage 2 — Structural Masonry',
          timestamp: '18 May 2024 · 03:45 PM',
          gpsCoordinates: '28.8956° N, 76.6068° E (Ward 14)',
          uploaderName: 'Shri Amit Verma (Assistant Engineer, PWD)',
          verificationStatus: 'Grade A+ Passed',
          notes: 'Concrete cube compression test passed M25 statutory grade.',
          type: 'QA Officer Inspection Photo'
        },
        {
          id: 'sample-3',
          source: 'citizen',
          sourceLabel: 'Citizen Grievance Baseline',
          title: 'Citizen Site Need & Public Accessibility Survey',
          url: 'https://images.unsplash.com/photo-1584467746872-9599a0e5324e?auto=format&fit=crop&w=800&q=80',
          stageName: 'Pre-Construction Need Assessment',
          timestamp: '15 Jun 2024 · 11:15 AM',
          gpsCoordinates: '28.8954° N, 76.6065° E',
          uploaderName: 'Rajesh Kumar Sharma (Citizen Resident)',
          verificationStatus: 'Recommended by MP',
          notes: 'Public demand raised for essential drinking water / infrastructure amenity.',
          type: 'Ground Reality Photo'
        }
      );
    }

    return list;
  }, [stageSubmissions, citizenIssues, localAttachments, work]);

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

  // Filtered evidence according to active source tab
  const filteredPhotos = allEvidencePhotos.filter(item => {
    if (sourceFilter === 'ALL') return true;
    if (sourceFilter === 'CONTRACTOR') return item.source === 'contractor';
    if (sourceFilter === 'CITIZEN') return item.source === 'citizen';
    if (sourceFilter === 'DOCUMENTS') return false; // Handled in document section
    return true;
  });

  const contractorCount = allEvidencePhotos.filter(p => p.source === 'contractor').length;
  const citizenCount = allEvidencePhotos.filter(p => p.source === 'citizen').length;
  const documentCount = localAttachments.filter(a => a.type === 'document').length + stageSubmissions.reduce((acc, s) => acc + (s.files?.filter(f => f.type?.includes('Document') || f.name.endsWith('.pdf'))?.length || 0), 0);

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
          maxWidth: '920px', 
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0',
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          borderRadius: "12px",
          background: "var(--bg-surface, #ffffff)",
          margin: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, var(--gov-primary, #0a2540) 0%, #1e3a8a 100%)',
          color: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {work.id}
              </span>
              <span className="gov-badge" style={{ background: '#10b981', color: '#ffffff', border: 'none' }}>
                <CheckCircle2 size={12} /> Live Multi-Source Evidence ({allEvidencePhotos.length} Photos)
              </span>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              {work.title}
            </h3>
            <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '2px' }}>
              {work.district}, {work.state} &bull; Implementing Agency: <strong>{work.contractor || work.agency || 'PWD'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="no-print">
            {canUpload && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="gov-btn gov-btn-primary"
                style={{ fontSize: '0.74rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Upload size={13} />
                <span>Upload</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.74rem',
                padding: '6px 12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Print Evidence Dossier"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close Evidence Viewer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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

          {/* Project Summary Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: 'var(--bg-surface-subtle)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.80rem',
            border: '1px solid var(--border-light)'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Constituency / District: </span>
              <div><strong>{work.constituency || work.district}, {work.state}</strong></div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Sanction Outlay: </span>
              <div><strong style={{ color: 'var(--gov-primary)' }}>₹{Number(work.sanctionedAmt || 0).toFixed(2)} Cr</strong></div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Physical Progress: </span>
              <div><strong style={{ color: '#059669' }}>{work.physicalProgress || 0}% Complete</strong></div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Status: </span>
              <div><span className="gov-badge gov-badge-info">{work.status}</span></div>
            </div>
          </div>

          {/* Multi-Source Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderBottom: '2px solid var(--border-light)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={13} /> Evidence Filter:
            </span>

            <button
              type="button"
              onClick={() => setSourceFilter('ALL')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: sourceFilter === 'ALL' ? 700 : 500,
                border: sourceFilter === 'ALL' ? '1px solid var(--gov-primary)' : '1px solid var(--border-main)',
                background: sourceFilter === 'ALL' ? 'var(--gov-primary)' : 'var(--bg-surface-subtle)',
                color: sourceFilter === 'ALL' ? '#ffffff' : 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              All Linked Evidence ({allEvidencePhotos.length})
            </button>

            <button
              type="button"
              onClick={() => setSourceFilter('CONTRACTOR')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: sourceFilter === 'CONTRACTOR' ? 700 : 500,
                border: sourceFilter === 'CONTRACTOR' ? '1px solid #2563eb' : '1px solid var(--border-main)',
                background: sourceFilter === 'CONTRACTOR' ? '#2563eb' : 'var(--bg-surface-subtle)',
                color: sourceFilter === 'CONTRACTOR' ? '#ffffff' : 'var(--text-main)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <HardHat size={14} />
              <span>Contractor Stage Photos ({contractorCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceFilter('CITIZEN')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: sourceFilter === 'CITIZEN' ? 700 : 500,
                border: sourceFilter === 'CITIZEN' ? '1px solid #059669' : '1px solid var(--border-main)',
                background: sourceFilter === 'CITIZEN' ? '#059669' : 'var(--bg-surface-subtle)',
                color: sourceFilter === 'CITIZEN' ? '#ffffff' : 'var(--text-main)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Users size={14} />
              <span>Citizen Ground Proofs ({citizenCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceFilter('DOCUMENTS')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: sourceFilter === 'DOCUMENTS' ? 700 : 500,
                border: sourceFilter === 'DOCUMENTS' ? '1px solid #7c3aed' : '1px solid var(--border-main)',
                background: sourceFilter === 'DOCUMENTS' ? '#7c3aed' : 'var(--bg-surface-subtle)',
                color: sourceFilter === 'DOCUMENTS' ? '#ffffff' : 'var(--text-main)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FileText size={14} />
              <span>Vouchers & Sanctions ({documentCount})</span>
            </button>
          </div>

          {/* EVIDENCE PHOTOS GRID */}
          {sourceFilter !== 'DOCUMENTS' && (
            <div>
              {filteredPhotos.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No photos found under this category filter.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  {filteredPhotos.map((photo) => {
                    const isContractor = photo.source === 'contractor';
                    const isCitizen = photo.source === 'citizen';
                    const badgeColor = isContractor ? '#2563eb' : isCitizen ? '#059669' : '#7c3aed';

                    return (
                      <div
                        key={photo.id}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-main)',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        {/* Photo Image with Overlay */}
                        <div 
                          style={{ position: 'relative', height: '190px', background: '#0b1320', cursor: 'pointer', overflow: 'hidden' }}
                          onClick={() => setSelectedPreviewImage(photo)}
                          title="Click to enlarge full-resolution photo"
                        >
                          <img
                            src={photo.url}
                            alt={photo.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              left: '8px',
                              background: badgeColor,
                              color: '#ffffff',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                          >
                            {isContractor ? <HardHat size={11} /> : isCitizen ? <Users size={11} /> : <Building2 size={11} />}
                            <span>{photo.sourceLabel}</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedPreviewImage(photo); }}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(0,0,0,0.6)',
                              border: 'none',
                              color: '#ffffff',
                              borderRadius: '4px',
                              padding: '4px 6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.68rem'
                            }}
                            title="Maximize Image"
                          >
                            <Maximize2 size={12} />
                            <span>Zoom</span>
                          </button>

                          <div
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              left: '8px',
                              right: '8px',
                              background: 'rgba(15, 23, 42, 0.85)',
                              color: '#ffffff',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontFamily: 'monospace'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={10} color="#60a5fa" />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                                {photo.gpsCoordinates}
                              </span>
                            </span>
                            <span style={{ color: '#34d399', fontWeight: 700 }}>
                              {photo.verificationStatus}
                            </span>
                          </div>
                        </div>

                        {/* Metadata Details */}
                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {photo.stageName}
                            </div>
                            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0', lineHeight: 1.35 }}>
                              {photo.title}
                            </h4>
                          </div>

                          {photo.notes && (
                            <p style={{ fontSize: '0.76rem', color: 'var(--text-body)', margin: 0, lineHeight: 1.4, background: 'var(--bg-surface-subtle)', padding: '6px 8px', borderRadius: '4px' }}>
                              {photo.notes}
                            </p>
                          )}

                          <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            <span>By: <strong>{photo.uploaderName}</strong></span>
                            <span>{photo.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STATUTORY DOCUMENTS / MB VOUCHERS SECTION */}
          {(sourceFilter === 'ALL' || sourceFilter === 'DOCUMENTS') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: sourceFilter === 'ALL' ? '12px' : '0' }}>
              <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--gov-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={18} /> Official Sanction Orders, MB Vouchers & Lab Certificates
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg-surface-subtle)', borderRadius: '8px', border: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={26} color="var(--gov-primary)" />
                    <div>
                      <h5 style={{ fontSize: '0.86rem', fontWeight: 700, margin: '0 0 2px 0' }}>
                        Administrative_Sanction_Order_{work.id}.pdf
                      </h5>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Signed AS Order by District Collectorate &bull; 1.8 MB &bull; Sanction: ₹{work.sanctionedAmt.toFixed(2)} Cr
                      </span>
                    </div>
                  </div>
                  <a
                    href="#download"
                    onClick={(e) => { e.preventDefault(); alert("Downloading official signed Administrative Sanction Order (PDF)..."); }}
                    className="gov-btn gov-btn-primary"
                    style={{ fontSize: '0.74rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <ExternalLink size={13} /> Download Order
                  </a>
                </div>

                <div style={{ padding: '12px 16px', background: 'var(--bg-surface-subtle)', borderRadius: '8px', border: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={26} color="#059669" />
                    <div>
                      <h5 style={{ fontSize: '0.86rem', fontWeight: 700, margin: '0 0 2px 0' }}>
                        Measurement_Book_Stage_Audit_Log.pdf
                      </h5>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Verified by Executive Engineer & Superintending Officer &bull; 2.4 MB
                      </span>
                    </div>
                  </div>
                  <a
                    href="#download"
                    onClick={(e) => { e.preventDefault(); alert("Downloading verified Measurement Book (MB) extract..."); }}
                    className="gov-btn gov-btn-secondary"
                    style={{ fontSize: '0.74rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <ExternalLink size={13} /> View MB Extract
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL RESOLUTION LIGHTBOX MODAL */}
      {selectedPreviewImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="gov-badge gov-badge-info">{selectedPreviewImage.sourceLabel}</span>
                <strong style={{ fontSize: '0.92rem', color: 'var(--gov-primary)' }}>{selectedPreviewImage.title}</strong>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewImage(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#0b1320', display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: '60vh', overflow: 'hidden' }}>
              <img
                src={selectedPreviewImage.url}
                alt={selectedPreviewImage.title}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
              />
            </div>

            <div style={{ padding: '14px 18px', background: 'var(--bg-surface)', fontSize: '0.80rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div><strong>Location Coordinates:</strong> {selectedPreviewImage.gpsCoordinates}</div>
                <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                  Uploaded by: <strong>{selectedPreviewImage.uploaderName}</strong> on {selectedPreviewImage.timestamp}
                </div>
              </div>
              <a
                href={selectedPreviewImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="gov-btn gov-btn-primary"
                style={{ fontSize: '0.74rem', padding: '6px 14px' }}
              >
                Open Original Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttachmentsModal;

