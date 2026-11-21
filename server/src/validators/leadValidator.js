const { z } = require('zod');

const LEAD_SOURCES = ['Website', 'Referral', 'Social Media', 'Email Campaign', 'Cold Call', 'Other'];
const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const leadSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  phone: z.string()
    .trim()
    .regex(/^[+]?[\d\s\-().]{7,20}$/, 'Invalid phone number format'),
  company: z.string()
    .trim()
    .min(1, 'Company name is required')
    .max(150, 'Company name cannot exceed 150 characters'),
  source: z.enum(LEAD_SOURCES, {
    errorMap: () => ({ message: `Source must be one of: ${LEAD_SOURCES.join(', ')}` }),
  }),
  status: z.enum(LEAD_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${LEAD_STATUSES.join(', ')}` }),
  }).default('New'),
  notes: z.string()
    .trim()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
    .nullable(),
});

const updateLeadSchema = leadSchema.partial().extend({
  // All fields optional on update, but if provided must be valid
});

module.exports = { leadSchema, updateLeadSchema, LEAD_SOURCES, LEAD_STATUSES };
