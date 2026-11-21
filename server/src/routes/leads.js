const express = require('express');
const router = express.Router();
const { getLeads, getStats, getLeadById, createLead, updateLead, deleteLead } = require('../controllers/leadsController');
const { validate } = require('../middleware/validate');
const { leadSchema, updateLeadSchema } = require('../validators/leadValidator');

// Statistics route (must be before /:id)
router.get('/stats', getStats);

// CRUD routes
router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', validate(leadSchema), createLead);
router.put('/:id', validate(updateLeadSchema), updateLead);
router.delete('/:id', deleteLead);

module.exports = router;
