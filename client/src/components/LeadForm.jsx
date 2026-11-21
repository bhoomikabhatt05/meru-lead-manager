import { useState, useEffect } from 'react';
import { LEAD_SOURCES, LEAD_STATUSES, validateLeadForm } from '../utils';

const EMPTY_FORM = {
  name: '', email: '', phone: '', company: '',
  source: '', status: 'New', notes: '',
};

export function LeadForm({ lead, onSubmit, onClose, loading }) {
  const isEdit = Boolean(lead);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        source: lead.source || '',
        status: lead.status || 'New',
        notes: lead.notes || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setServerError('');
  }, [lead]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
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
      if (err.details?.length > 0) {
        // Map server validation errors to fields
        const fieldErrors = {};
        err.details.forEach(({ field, message }) => {
          if (field) fieldErrors[field] = message;
        });
        setErrors(fieldErrors);
      } else {
        setServerError(err.message || 'Something went wrong. Please try again.');
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Lead' : 'Add New Lead'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {serverError && (
              <div className="form-error-banner" role="alert">
                {serverError}
              </div>
            )}

            <div className="form-grid">
              {/* Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Name <span className="required">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  autoFocus={!isEdit}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@company.com"
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Phone <span className="required">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>

              {/* Company */}
              <div className="form-group">
                <label className="form-label" htmlFor="company">
                  Company <span className="required">*</span>
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  className={`form-input ${errors.company ? 'error' : ''}`}
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Acme Corporation"
                />
                {errors.company && <span className="form-error">{errors.company}</span>}
              </div>

              {/* Source */}
              <div className="form-group">
                <label className="form-label" htmlFor="source">
                  Source <span className="required">*</span>
                </label>
                <select
                  id="source"
                  name="source"
                  className={`form-select ${errors.source ? 'error' : ''}`}
                  value={form.source}
                  onChange={handleChange}
                >
                  <option value="">Select source…</option>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.source && <span className="form-error">{errors.source}</span>}
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label" htmlFor="status">
                  Status <span className="required">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  className={`form-select ${errors.status ? 'error' : ''}`}
                  value={form.status}
                  onChange={handleChange}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.status && <span className="form-error">{errors.status}</span>}
              </div>

              {/* Notes */}
              <div className="form-group full">
                <label className="form-label" htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  className="form-input form-textarea"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes…"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
