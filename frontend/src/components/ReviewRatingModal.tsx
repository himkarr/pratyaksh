/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: ReviewRatingModal (Citizen Social Audit & Asset Quality Feedback)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * Social audits represent a pillar of transparent public infrastructure oversight.
 * This component empowers verified citizens, local resident associations, and independent
 * social auditors to submit qualitative feedback and star ratings on completed/ongoing assets:
 * 
 * 1. Community Validation:
 *    - Captures ground observations regarding asset durability, accessibility, and utility.
 * 2. Cross-Verification:
 *    - Social audit logs are indexed against the Work ID and referenced during central inspections.
 */

import React, { useState } from 'react';
import { X, Star, MessageSquare, Send, CheckCircle, UserCheck } from 'lucide-react';
import { WorkItem, WorkReview } from '../data/mpladsData';

interface ReviewRatingModalProps {
  work: WorkItem | null;
  onClose: () => void;
  onAddReview: (workId: string, review: WorkReview) => void;
}

export function ReviewRatingModal({ work, onClose, onAddReview }: ReviewRatingModalProps) {
  if (!work) return null;

  // Form input state
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) return;

    const newReview: WorkReview = {
      id: `rev-${Date.now()}`,
      author: userName.trim(),
      rating: userRating,
      date: new Date().toISOString().slice(0, 10),
      comment: comment.trim(),
      verified: true
    };

    onAddReview(work.id, newReview);
    setIsSubmitted(true);
    setUserName('');
    setComment('');
  };

  return (
    <div className="gov-modal-backdrop" onClick={onClose}>
      <div
        className="gov-modal-content"
        style={{ maxWidth: '650px', padding: '0' }}
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
              <span className="gov-badge gov-badge-info">
                <UserCheck size={10} /> Citizen Social Audit Log
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
          {/* Average Rating Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'var(--bg-surface-subtle)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                lineHeight: 1
              }}>
                {work.rating}
              </div>
              <div style={{ display: 'flex', gap: '2px', margin: '3px 0', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={12}
                    color="#b45309"
                    fill={star <= Math.round(work.rating) ? "#b45309" : "transparent"}
                  />
                ))}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {work.reviewsCount || work.reviews?.length || 0} Ratings Audited
              </div>
            </div>

            <div style={{ flex: 1, borderLeft: '1px solid var(--border-light)', paddingLeft: '14px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                Public Social Audit & Quality Feedback
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Verified local citizen reviews ensure asset quality and ground reality checks under MoSPI guidelines.
              </p>
            </div>
          </div>

          {/* Citizen Reviews List */}
          <div>
            <h4 style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MessageSquare size={13} color="var(--gov-primary)" />
              <span>Public Feedback History</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              {work.reviews && work.reviews.length > 0 ? (
                work.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      background: 'var(--bg-surface-subtle)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{rev.author}</span>
                        {rev.verified && (
                          <span className="gov-badge gov-badge-success" style={{ fontSize: '0.62rem', padding: '0 4px' }}>
                            <CheckCircle size={8} /> Verified
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{rev.date}</span>
                    </div>

                    <p style={{ fontSize: '0.76rem', color: 'var(--text-body)', lineHeight: 1.35 }}>
                      "{rev.comment}"
                    </p>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                  No citizen reviews logged yet for this work.
                </div>
              )}
            </div>
          </div>

          {/* Review Form */}
          <div style={{
            background: 'var(--bg-surface-subtle)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-main)'
          }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
              Log Public Feedback Entry
            </h4>

            {isSubmitted && (
              <div style={{
                background: 'var(--status-success-bg)',
                color: 'var(--status-success-text)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-xs)',
                marginBottom: '8px',
                fontSize: '0.76rem',
                border: '1px solid var(--status-success-border)'
              }}>
                Feedback entry recorded into the audit trail.
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-body)' }}>Rating:</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setUserRating(star)}
                      style={{ background: 'transparent', padding: '1px', cursor: 'pointer' }}
                    >
                      <Star
                        size={15}
                        color="#b45309"
                        fill={(hoverRating || userRating) >= star ? "#b45309" : "transparent"}
                      />
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#b45309' }}>
                  {userRating} / 5 Stars
                </span>
              </div>

              <input
                type="text"
                placeholder="Auditor / Resident Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem'
                }}
              />

              <textarea
                placeholder="Audit observation regarding utility, quality, or timeline..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                required
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem',
                  resize: 'vertical'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="gov-btn gov-btn-primary" style={{ fontSize: '0.76rem', padding: '5px 12px' }}>
                  <Send size={11} />
                  <span>Submit Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ReviewRatingModal;
