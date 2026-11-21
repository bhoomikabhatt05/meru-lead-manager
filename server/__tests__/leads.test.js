const request = require('supertest');
const path = require('path');

// Use in-memory test database
process.env.DB_PATH = path.join(__dirname, '../../data/test.db');
process.env.NODE_ENV = 'test';

const app = require('../src/app');
const db = require('../src/database');

// Clean database before each test
beforeEach(() => {
  db.exec('DELETE FROM leads');
});

// Close database after all tests
afterAll(() => {
  db.close();
  // Clean up test database file
  const fs = require('fs');
  const testDbPath = path.join(__dirname, '../../data/test.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('Health Check', () => {
  it('GET /api/health should return 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Lead CRUD Operations', () => {
  const validLead = {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '+91-9876543210',
    company: 'Acme Corp',
    source: 'Website',
    status: 'New',
  };

  it('POST /api/leads - creates a new lead', async () => {
    const res = await request(app).post('/api/leads').send(validLead);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(validLead.name);
    expect(res.body.email).toBe(validLead.email.toLowerCase());
    expect(res.body.status).toBe('New');
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/leads - supports all 4 valid statuses: New, Contacted, Qualified, Lost', async () => {
    const statuses = ['New', 'Contacted', 'Qualified', 'Lost'];
    for (const status of statuses) {
      const res = await request(app).post('/api/leads').send({
        ...validLead,
        email: `test-${status.toLowerCase()}@example.com`,
        status,
      });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe(status);
    }
  });

  it('POST /api/leads - rejects missing required fields', async () => {
    const res = await request(app).post('/api/leads').send({ name: 'Bob' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeInstanceOf(Array);
  });

  it('POST /api/leads - rejects invalid email', async () => {
    const res = await request(app).post('/api/leads').send({ ...validLead, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'email')).toBe(true);
  });

  it('POST /api/leads - rejects invalid or unsupported status', async () => {
    const invalidStatuses = ['InvalidStatus', 'Proposal', 'Negotiation', 'Closed Won'];
    for (const st of invalidStatuses) {
      const res = await request(app).post('/api/leads').send({ ...validLead, email: `test-${st}@ex.com`, status: st });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    }
  });

  it('POST /api/leads - rejects duplicate email', async () => {
    await request(app).post('/api/leads').send(validLead);
    const res = await request(app).post('/api/leads').send(validLead);
    expect(res.status).toBe(409);
  });

  it('GET /api/leads - returns list of leads', async () => {
    await request(app).post('/api/leads').send(validLead);
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it('GET /api/leads - supports search by name', async () => {
    await request(app).post('/api/leads').send(validLead);
    await request(app).post('/api/leads').send({ ...validLead, name: 'Bob Smith', email: 'bob@example.com' });

    const res = await request(app).get('/api/leads?search=alice');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Alice Johnson');
  });

  it('GET /api/leads - supports filter by status', async () => {
    await request(app).post('/api/leads').send(validLead);
    await request(app).post('/api/leads').send({ ...validLead, name: 'Bob', email: 'bob@ex.com', status: 'Lost' });

    const res = await request(app).get('/api/leads?status=Lost');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('Lost');
  });

  it('GET /api/leads/:id - returns single lead', async () => {
    const created = await request(app).post('/api/leads').send(validLead);
    const res = await request(app).get(`/api/leads/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('GET /api/leads/:id - returns 404 for non-existent lead', async () => {
    const res = await request(app).get('/api/leads/99999');
    expect(res.status).toBe(404);
  });

  it('PUT /api/leads/:id - updates a lead status and details', async () => {
    const created = await request(app).post('/api/leads').send(validLead);
    const res = await request(app)
      .put(`/api/leads/${created.body.id}`)
      .send({ status: 'Contacted', company: 'Updated Corp' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Contacted');
    expect(res.body.company).toBe('Updated Corp');
  });

  it('PUT /api/leads/:id - returns 404 for non-existent lead', async () => {
    const res = await request(app).put('/api/leads/99999').send({ status: 'Qualified' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/leads/:id - deletes a lead', async () => {
    const created = await request(app).post('/api/leads').send(validLead);
    const res = await request(app).delete(`/api/leads/${created.body.id}`);
    expect(res.status).toBe(200);

    const check = await request(app).get(`/api/leads/${created.body.id}`);
    expect(check.status).toBe(404);
  });

  it('DELETE /api/leads/:id - returns 404 for non-existent lead', async () => {
    const res = await request(app).delete('/api/leads/99999');
    expect(res.status).toBe(404);
  });
});

describe('Stats Endpoint', () => {
  it('GET /api/leads/stats - returns statistics for all 4 statuses', async () => {
    await request(app).post('/api/leads').send({
      name: 'Alice',
      email: 'alice@test.com',
      phone: '1234567890',
      company: 'Corp A',
      source: 'Website',
      status: 'New',
    });
    await request(app).post('/api/leads').send({
      name: 'Bob',
      email: 'bob@test.com',
      phone: '0987654321',
      company: 'Corp B',
      source: 'Referral',
      status: 'Qualified',
    });
    await request(app).post('/api/leads').send({
      name: 'Charlie',
      email: 'charlie@test.com',
      phone: '0987654322',
      company: 'Corp C',
      source: 'Social Media',
      status: 'Lost',
    });

    const res = await request(app).get('/api/leads/stats');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.byStatus.New).toBe(1);
    expect(res.body.byStatus.Qualified).toBe(1);
    expect(res.body.byStatus.Lost).toBe(1);
    expect(res.body.bySource).toBeDefined();
  });
});

describe('Pagination', () => {
  it('GET /api/leads - supports pagination with limit and page offsets', async () => {
    for (let i = 1; i <= 3; i++) {
      await request(app).post('/api/leads').send({
        name: `Lead ${i}`,
        email: `lead${i}@test.com`,
        phone: '1234567890',
        company: 'Test Corp',
        source: 'Website',
        status: 'New',
      });
    }

    const res = await request(app).get('/api/leads?page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.pagination.totalPages).toBe(2);
  });
});
