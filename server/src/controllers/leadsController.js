const db = require('../database');

/**
 * GET /api/leads
 * Scoped to authenticated user (req.user.id)
 * Supports: search, status filter, source filter, sort, pagination
 */
function getLeads(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      search = '',
      status = '',
      source = '',
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

    // Scoped strictly to the authenticated user
    const conditions = ['user_id = ?'];
    const params = [userId];

    if (search.trim()) {
      conditions.push(`(name LIKE ? OR email LIKE ? OR company LIKE ? OR phone LIKE ?)`);
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status.trim()) {
      conditions.push(`status = ?`);
      params.push(status.trim());
    }

    if (source.trim()) {
      conditions.push(`source = ?`);
      params.push(source.trim());
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Count total matching records for this user
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
 * Returns dashboard statistics scoped to authenticated user
 */
function getStats(req, res, next) {
  try {
    const userId = req.user.id;

    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM leads WHERE user_id = ?').get(userId);
    const total = totalStmt ? totalStmt.count : 0;

    const statusCounts = db.prepare(
      `SELECT status, COUNT(*) as count FROM leads WHERE user_id = ? GROUP BY status`
    ).all(userId);

    const sourceCounts = db.prepare(
      `SELECT source, COUNT(*) as count FROM leads WHERE user_id = ? GROUP BY source ORDER BY count DESC`
    ).all(userId);

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
 * Scoped to authenticated user
 */
function getLeadById(req, res, next) {
  try {
    const userId = req.user.id;
    const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').get(req.params.id, userId);

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
 * Scoped to authenticated user
 */
function createLead(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, email, phone, company, source, status, notes } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    // Check for duplicate email across leads
    const existing = db.prepare('SELECT id FROM leads WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'A lead with this email already exists' });
    }

    const stmt = db.prepare(`
      INSERT INTO leads (name, email, phone, company, source, status, notes, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      cleanEmail,
      phone.trim(),
      company.trim(),
      source,
      status || 'New',
      notes?.trim() || null,
      userId
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
 * Scoped to authenticated user
 */
function updateLead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Authorization check: User cannot update another user's lead
    if (lead.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to modify this lead.' });
    }

    const { name, email, phone, company, source, status, notes } = req.body;

    // Check for duplicate email (excluding current lead)
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const existing = db.prepare('SELECT id FROM leads WHERE email = ? AND id != ?').get(cleanEmail, id);
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
      WHERE id = ? AND user_id = ?
    `).run(
      updated.name,
      updated.email,
      updated.phone,
      updated.company,
      updated.source,
      updated.status,
      updated.notes,
      id,
      userId
    );

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
 * Scoped to authenticated user
 */
function deleteLead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Authorization check: User cannot delete another user's lead
    if (lead.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to delete this lead.' });
    }

    db.prepare('DELETE FROM leads WHERE id = ? AND user_id = ?').run(id, userId);
    res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLeads,
  getStats,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
};
