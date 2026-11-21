const db = require('../database');

/**
 * GET /api/leads
 * Supports: search, status filter, sort, pagination
 */
function getLeads(req, res, next) {
  try {
    const {
      search = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    // Whitelist sortable columns to prevent SQL injection
    const allowedSortColumns = ['name', 'email', 'company', 'source', 'status', 'created_at', 'updated_at'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (search.trim()) {
      conditions.push(`(name LIKE ? OR email LIKE ? OR company LIKE ?)`);
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status.trim()) {
      conditions.push(`status = ?`);
      params.push(status.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM leads ${whereClause}`);
    const { total } = countStmt.get(...params);

    // Fetch paginated results
    const dataStmt = db.prepare(
      `SELECT * FROM leads ${whereClause} ORDER BY ${sortColumn} ${order} LIMIT ? OFFSET ?`
    );
    const leads = dataStmt.all(...params, limitNum, offset);

    res.json({
      data: leads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leads/stats
 * Returns dashboard statistics
 */
function getStats(req, res, next) {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;

    const statusCounts = db.prepare(
      `SELECT status, COUNT(*) as count FROM leads GROUP BY status`
    ).all();

    const sourceCounts = db.prepare(
      `SELECT source, COUNT(*) as count FROM leads GROUP BY source ORDER BY count DESC`
    ).all();

    res.json({
      total,
      byStatus: statusCounts.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      bySource: sourceCounts,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leads/:id
 */
function getLeadById(req, res, next) {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/leads
 */
function createLead(req, res, next) {
  try {
    const { name, email, phone, company, source, status, notes } = req.body;

    // Check for duplicate email
    const existing = db.prepare('SELECT id FROM leads WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'A lead with this email already exists' });
    }

    const stmt = db.prepare(`
      INSERT INTO leads (name, email, phone, company, source, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      email.trim().toLowerCase(),
      phone.trim(),
      company.trim(),
      source,
      status || 'New',
      notes?.trim() || null
    );

    const newLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newLead);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'A lead with this email already exists' });
    }
    next(err);
  }
}

/**
 * PUT /api/leads/:id
 */
function updateLead(req, res, next) {
  try {
    const { id } = req.params;
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const { name, email, phone, company, source, status, notes } = req.body;

    // Check for duplicate email (excluding current lead)
    if (email) {
      const existing = db.prepare('SELECT id FROM leads WHERE email = ? AND id != ?').get(
        email.trim().toLowerCase(),
        id
      );
      if (existing) {
        return res.status(409).json({ error: 'A lead with this email already exists' });
      }
    }

    const updated = {
      name: name?.trim() ?? lead.name,
      email: email?.trim().toLowerCase() ?? lead.email,
      phone: phone?.trim() ?? lead.phone,
      company: company?.trim() ?? lead.company,
      source: source ?? lead.source,
      status: status ?? lead.status,
      notes: notes !== undefined ? (notes?.trim() || null) : lead.notes,
    };

    db.prepare(`
      UPDATE leads
      SET name = ?, email = ?, phone = ?, company = ?, source = ?, status = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(updated.name, updated.email, updated.phone, updated.company, updated.source, updated.status, updated.notes, id);

    const updatedLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    res.json(updatedLead);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'A lead with this email already exists' });
    }
    next(err);
  }
}

/**
 * DELETE /api/leads/:id
 */
function deleteLead(req, res, next) {
  try {
    const { id } = req.params;
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLeads, getStats, getLeadById, createLead, updateLead, deleteLead };
