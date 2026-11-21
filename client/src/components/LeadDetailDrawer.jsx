import { useState, useEffect, useCallback } from 'react';
import { StatusBadge } from './StatusBadge';
import {
  CloseIcon,
  EditIcon,
  TrashIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  CalendarIcon,
  CopyIcon,
  CheckIcon,
} from './Icons';
import { LEAD_STATUSES } from '../utils';

export function LeadDetailDrawer({
  lead,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = useCallback((text, field) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const handleQuickStatusChange = async (newStatus) => {
    if (!lead || lead.status === newStatus || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await onStatusChange(lead.id, newStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isOpen || !lead) return null;

  const formattedCreated = new Date(lead.created_at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedUpdated = lead.updated_at
    ? new Date(lead.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      className="drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-lead-name"
    >
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-header-content">
            <div className="drawer-avatar-wrap">
              <div className="drawer-avatar">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div className="drawer-identity">
                <h2 id="drawer-lead-name" className="drawer-title">{lead.name}</h2>
                <div className="drawer-subtitle">
                  <BuildingIcon size={13} className="drawer-sub-icon" />
                  <span>{lead.company}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            className="btn-drawer-close"
            onClick={onClose}
            aria-label="Close detail view"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Drawer Body with Apple HIG Cards */}
        <div className="drawer-body">
          {/* Section: Stage Pipeline Changer */}
          <div className="drawer-card stage-card">
            <div className="drawer-card-header">
              <span className="drawer-card-label">PIPELINE STATUS</span>
              <StatusBadge status={lead.status} />
            </div>
            <div className="quick-status-selector" role="radiogroup" aria-label="Change status">
              {LEAD_STATUSES.map((st) => {
                const isActive = lead.status === st;
                return (
                  <button
                    key={st}
                    className={`status-chip-btn ${isActive ? 'active ' + st.toLowerCase() : ''}`}
                    onClick={() => handleQuickStatusChange(st)}
                    disabled={updatingStatus}
                    role="radio"
                    aria-checked={isActive}
                    title={`Move to ${st}`}
                  >
                    {isActive && <CheckIcon size={12} className="chip-check" />}
                    <span>{st}</span>
                  </button>
                );
              })}
            </div>
            <p className="drawer-hint-text">
              Direct manipulation: click any stage above to update this lead instantly.
            </p>
          </div>

          {/* Section: Contact Information */}
          <div className="drawer-card">
            <div className="drawer-card-header">
              <span className="drawer-card-label">CONTACT INFORMATION</span>
            </div>
            <div className="drawer-info-list">
              {/* Email */}
              <div className="drawer-info-row">
                <div className="info-icon-badge">
                  <MailIcon size={15} />
                </div>
                <div className="info-content-wrap">
                  <span className="info-label">Email</span>
                  <a
                    href={`mailto:${lead.email}`}
                    className="info-value-link"
                    title="Send email"
                  >
                    {lead.email}
                  </a>
                </div>
                <button
                  className="btn-copy-item"
                  onClick={() => handleCopy(lead.email, 'email')}
                  title="Copy email to clipboard"
                  aria-label="Copy email"
                >
                  {copiedField === 'email' ? <CheckIcon size={13} className="text-emerald" /> : <CopyIcon size={13} />}
                </button>
              </div>

              {/* Phone */}
              <div className="drawer-info-row">
                <div className="info-icon-badge">
                  <PhoneIcon size={15} />
                </div>
                <div className="info-content-wrap">
                  <span className="info-label">Phone</span>
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="info-value-link"
                      title="Call phone number"
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="info-value-empty">Not provided</span>
                  )}
                </div>
                {lead.phone && (
                  <button
                    className="btn-copy-item"
                    onClick={() => handleCopy(lead.phone, 'phone')}
                    title="Copy phone to clipboard"
                    aria-label="Copy phone"
                  >
                    {copiedField === 'phone' ? <CheckIcon size={13} className="text-emerald" /> : <CopyIcon size={13} />}
                  </button>
                )}
              </div>

              {/* Company */}
              <div className="drawer-info-row">
                <div className="info-icon-badge">
                  <BuildingIcon size={15} />
                </div>
                <div className="info-content-wrap">
                  <span className="info-label">Company</span>
                  <span className="info-value-text">{lead.company}</span>
                </div>
              </div>

              {/* Acquisition Source */}
              <div className="drawer-info-row">
                <div className="info-icon-badge">
                  <span className="source-mini-badge">🌐</span>
                </div>
                <div className="info-content-wrap">
                  <span className="info-label">Acquisition Channel</span>
                  <span className="source-pill highlight">{lead.source}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Notes & Context */}
          <div className="drawer-card">
            <div className="drawer-card-header">
              <span className="drawer-card-label">NOTES & ACTIVITY CONTEXT</span>
            </div>
            {lead.notes ? (
              <div className="drawer-notes-block">
                <p className="drawer-notes-text">{lead.notes}</p>
              </div>
            ) : (
              <div className="drawer-notes-empty">
                <span className="empty-pen-icon">📝</span>
                <p>No meeting notes or context recorded yet.</p>
                <button className="btn-secondary-xs" onClick={() => onEdit(lead)}>
                  + Add Notes
                </button>
              </div>
            )}
          </div>

          {/* Section: Metadata Timestamps */}
          <div className="drawer-card meta-card">
            <div className="drawer-card-header">
              <span className="drawer-card-label">SYSTEM RECORD</span>
            </div>
            <div className="drawer-meta-list">
              <div className="meta-item">
                <CalendarIcon size={13} className="text-muted" />
                <span className="meta-label">Created:</span>
                <span className="meta-val">{formattedCreated}</span>
              </div>
              {formattedUpdated && (
                <div className="meta-item">
                  <CalendarIcon size={13} className="text-muted" />
                  <span className="meta-label">Last Modified:</span>
                  <span className="meta-val">{formattedUpdated}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="drawer-footer">
          <button
            className="btn-drawer-action delete"
            onClick={() => {
              onDelete(lead);
              onClose();
            }}
          >
            <TrashIcon size={14} />
            <span>Delete Lead</span>
          </button>
          <button
            className="btn-drawer-action edit"
            onClick={() => {
              onEdit(lead);
              onClose();
            }}
          >
            <EditIcon size={14} />
            <span>Edit Record</span>
          </button>
        </div>
      </div>
    </div>
  );
}
