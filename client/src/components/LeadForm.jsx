import { useState, useEffect, useRef } from 'react';
import { LEAD_SOURCES, LEAD_STATUSES, validateLeadForm } from '../utils';
import { CloseIcon, BuildingIcon, MailIcon, PhoneIcon } from './Icons';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  company: '',
  source: '',
  status: 'New',
  notes: '',
};

export function LeadForm({ lead, onSubmit, onClose, loading }) {
  const isEdit = Boolean(lead);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const nameInputRef = useRef(null);

  useEffect(() => {
    const loadedData = lead
      ? {
          name: lead.name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          company: lead.company || '',
          source: lead.source || '',
          status: lead.status || 'New',
          notes: lead.notes || '',
        }
      : EMPTY_FORM;

    setForm(loadedData);
    setInitialForm(loadedData);
    setErrors({});
    setServerError('');
    setShowDiscardConfirm(false);

    // Auto-focus first input
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  }, [lead]);

  // Check if form is dirty
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  // Safe close handler that checks for unsaved changes
  const handleRequestClose = () => {
    if (loading) return;
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Handle ESC key to safely close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !loading) {
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else if (isDirty) {
          setShowDiscardConfirm(true);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, loading, isDirty, showDiscardConfirm]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');

    // Client-side validation
    const validationErrors = validateLeadForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        const fieldErrors = {};
        err.details.forEach(({ field, message }) => {
          if (field) fieldErrors[field] = message;
        });
        setErrors(fieldErrors);
      } else {
        setServerError(err.message || 'An error occurred while saving the lead.');
      }
    }
  }

  return (
    <div className="modal-backdrop-blur" onClick={handleRequestClose} role="dialog" aria-modal="true">
      <div className="lead-modal-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-top-bar">
          <div className="modal-title-wrap">
            <h2 className="modal-heading">{isEdit ? 'Edit Lead Record' : 'Create New Lead'}</h2>
            <p className="modal-subheading">
              {isEdit
                ? 'Update contact information, pipeline status, or meeting notes.'
                : 'Capture lead details to track throughout the sales pipeline.'}
            </p>
          </div>
          <button
            className="btn-modal-close"
            onClick={handleRequestClose}
            disabled={loading}
            aria-label="Close dialog"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} noValidate className="modal-form-body">
          {serverError && (
            <div className="form-alert-banner" role="alert">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">{serverError}</span>
            </div>
          )}

          <div className="form-sections-container">
            {/* Section 1: Contact Details */}
            <div className="form-section-card">
              <span className="section-label">CONTACT INFORMATION</span>
              <div className="form-row-grid">
                {/* Full Name */}
                <div className="form-field-group">
                  <label className="field-label" htmlFor="lead-name">
                    Full Name <span className="req-star">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    id="lead-name"
                    name="name"
                    type="text"
                    className={`text-input-field ${errors.name ? 'input-error' : ''}`}
                    placeholder="e.g. Maya Sharma"
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name && <span className="field-error-hint">{errors.name}</span>}
                </div>

                {/* Email Address */}
                <div className="form-field-group">
                  <label className="field-label" htmlFor="lead-email">
                    Work Email <span className="req-star">*</span>
                  </label>
                  <div className="input-with-icon-wrap">
                    <MailIcon size={14} className="input-leading-icon" />
                    <input
                      id="lead-email"
                      name="email"
                      type="email"
                      className={`text-input-field has-icon ${errors.email ? 'input-error' : ''}`}
                      placeholder="maya@company.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.email && <span className="field-error-hint">{errors.email}</span>}
                </div>
              </div>

              <div className="form-row-grid">
                {/* Phone */}
                <div className="form-field-group">
                  <label className="field-label" htmlFor="lead-phone">
                    Phone Number <span className="req-star">*</span>
                  </label>
                  <div className="input-with-icon-wrap">
                    <PhoneIcon size={14} className="input-leading-icon" />
                    <input
                      id="lead-phone"
                      name="phone"
                      type="tel"
                      className={`text-input-field has-icon ${errors.phone ? 'input-error' : ''}`}
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.phone && <span className="field-error-hint">{errors.phone}</span>}
                </div>

                {/* Company */}
                <div className="form-field-group">
                  <label className="field-label" htmlFor="lead-company">
                    Company Name <span className="req-star">*</span>
                  </label>
                  <div className="input-with-icon-wrap">
                    <BuildingIcon size={14} className="input-leading-icon" />
                    <input
                      id="lead-company"
                      name="company"
                      type="text"
                      className={`text-input-field has-icon ${errors.company ? 'input-error' : ''}`}
                      placeholder="Acme Corporation"
                      value={form.company}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.company && <span className="field-error-hint">{errors.company}</span>}
                </div>
              </div>
            </div>

            {/* Section 2: Pipeline & Classification */}
            <div className="form-section-card">
              <span className="section-label">PIPELINE & CLASSIFICATION</span>
              <div className="form-row-grid">
                {/* Source Dropdown */}
                <div className="form-field-group">
                  <label className="field-label" htmlFor="lead-source">
                    Acquisition Source <span className="req-star">*</span>
                  </label>
                  <select
                    id="lead-source"
                    name="source"
                    className={`select-input-field ${errors.source ? 'input-error' : ''}`}
                    value={form.source}
                    onChange={handleChange}
                  >
                    <option value="">Select lead channel…</option>
                    {LEAD_SOURCES.map((src) => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                  {errors.source && <span className="field-error-hint">{errors.source}</span>}
                </div>

                {/* Pipeline Status */}
                <div className="form-field-group">
                  <label className="field-label" htmlFor="lead-status">
                    Pipeline Status <span className="req-star">*</span>
                  </label>
                  <select
                    id="lead-status"
                    name="status"
                    className={`select-input-field ${errors.status ? 'input-error' : ''}`}
                    value={form.status}
                    onChange={handleChange}
                  >
                    {LEAD_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  {errors.status && <span className="field-error-hint">{errors.status}</span>}
                </div>
              </div>
            </div>

            {/* Section 3: Notes & Character Count */}
            <div className="form-section-card">
              <div className="section-header-flex">
                <span className="section-label">NOTES & CONTEXT</span>
                <span className="char-counter">{form.notes.length} / 500</span>
              </div>
              <div className="form-field-group">
                <label className="field-label" htmlFor="lead-notes">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="lead-notes"
                  name="notes"
                  className="textarea-input-field"
                  rows="3"
                  maxLength="500"
                  placeholder="Record discovery call notes, requirements, budget expectations, or follow-up timelines…"
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-bottom-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={handleRequestClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  <span>Saving…</span>
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Create Lead'
              )}
            </button>
          </div>
        </form>

        {/* Apple HIG Unsaved Changes Confirmation Sheet */}
        {showDiscardConfirm && (
          <div className="discard-prompt-overlay" onClick={() => setShowDiscardConfirm(false)}>
            <div className="discard-prompt-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="discard-title">Discard unsaved changes?</h3>
              <p className="discard-message">
                You have unsaved changes on this lead record. If you leave now, your edits will not be saved.
              </p>
              <div className="discard-actions">
                <button
                  type="button"
                  className="btn-discard-secondary"
                  onClick={() => setShowDiscardConfirm(false)}
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  className="btn-discard-danger"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    onClose();
                  }}
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
