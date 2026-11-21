/**
 * Returns the CSS class for a status badge
 */
export function getBadgeClass(status) {
  const map = {
    'New': 'badge-New',
    'Contacted': 'badge-Contacted',
    'Qualified': 'badge-Qualified',
    'Proposal': 'badge-Proposal',
    'Negotiation': 'badge-Negotiation',
    'Closed Won': 'badge-ClosedWon',
    'Closed Lost': 'badge-ClosedLost',
  };
  return map[status] || 'badge-New';
}

export const LEAD_SOURCES = ['Website', 'Referral', 'Social Media', 'Email Campaign', 'Cold Call', 'Other'];
export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

/**
 * Basic client-side validation (mirrors server Zod schema)
 */
export function validateLeadForm(data) {
  const errors = {};

  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!data.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Invalid email address';
  }

  if (!data.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^[+]?[\d\s\-().]{7,20}$/.test(data.phone.trim())) {
    errors.phone = 'Invalid phone number format';
  }

  if (!data.company?.trim()) {
    errors.company = 'Company is required';
  }

  if (!data.source) {
    errors.source = 'Source is required';
  }

  if (!data.status) {
    errors.status = 'Status is required';
  }

  return errors;
}
