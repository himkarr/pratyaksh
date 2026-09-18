import React from 'react';
import { useBodyScrollLock } from '../utils/scrollLock';
import { ProjectDetail } from './admin/projects/ProjectDetail';
import { WorkItem, WorkAttachment } from '../data/mpladsData';
import { X } from 'lucide-react';

export interface WorkDetailModalProps {
  work: WorkItem | any | null;
  onClose: () => void;
  onViewAttachments?: (work: WorkItem) => void;
  onViewReviews?: (work: WorkItem) => void;
  onAttachmentAdded?: (workId: string, attachment: WorkAttachment) => void;
  onSelectMP?: (mp: any) => void;
  onSelectState?: (stateName: string) => void;
  mps?: any[];
  allProjects?: any[];
}

export const WorkDetailModal: React.FC<WorkDetailModalProps> = ({
  work,
  onClose,
  onViewAttachments,
  onViewReviews,
  onAttachmentAdded,
  onSelectMP,
  onSelectState,
  mps = [],
  allProjects = []
}) => {
  useBodyScrollLock(!!work);

  if (!work) return null;

  return (
    <div
      className="gov-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        overflowY: 'auto'
      }}
    >
      <div
        className="gov-modal-content"
        style={{
          width: '100%',
          maxWidth: '1240px',
          maxHeight: 'min(94vh, 960px)',
          background: 'var(--bg-page, #f8fafc)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          overflowY: 'auto',
          padding: '24px 28px 40px',
          position: 'relative',
          border: '1px solid #cbd5e1',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '20px',
            zIndex: 10,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.15s ease'
          }}
          title="Close Project Details (Esc)"
        >
          <X size={18} />
        </button>

        <ProjectDetail
          project={work}
          onBack={onClose}
          onSelectMP={onSelectMP}
          onSelectState={onSelectState}
          mps={mps}
          allProjects={allProjects}
        />
      </div>
    </div>
  );
};

export default WorkDetailModal;

