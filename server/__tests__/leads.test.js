const request = require('supertest');
const path = require('path');

// Use isolated test database
process.env.DB_PATH = path.join(__dirname, '../../data/test.db');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-leads-unit-tests';

const app = require('../src/app');
const db = require('../src/database');

let authCookie = null;

// Clean database and authenticate test user before each test
beforeEach(async () => {
  db.exec('DELETE FROM leads');
  db.exec('DELETE FROM users');

  const signupRes = await request(app).post('/api/auth/signup').send({
    name: 'Test Agent',
    email: 'agent@test.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  });

  authCookie = signupRes.headers['set-cookie'];
});

// Close database after all tests
afterAll(() => {
  db.close();
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
    const res = await request(app).post('/api/leads').set('Cookie', authCookie).send(validLead);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(validLead.name);
    expect(res.body.email).toBe(validLead.email.toLowerCase());
    expect(res.body.status).toBe('New');
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/leads - supports all 4 valid statuses: New, Contacted, Qualified, Lost', async () => {
    const statuses = ['New', 'Contacted', 'Qualified', 'Lost'];
    for (const status of statuses) {
      const res = await request(app).post('/api/leads').set('Cookie', authCookie).send({
        ...validLead,
        email: `test-${status.toLowerCase()}@example.com`,
        status,
      });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe(status);
    }
  });

  it('POST /api/leads - rejects missing required fields', async () => {
    const res = await request(app).post('/api/leads').set('Cookie', authCookie).send({ name: 'Bob' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeInstanceOf(Array);
  });

  it('POST /api/leads - rejects invalid email', async () => {
    const res = await request(app).post('/api/leads').set('Cookie', authCookie).send({ ...validLead, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'email')).toBe(true);
  });

  it('POST /api/leads - rejects invalid or unsupported status', async () => {
    const invalidStatuses = ['InvalidStatus', 'Proposal', 'Negotiation', 'Closed Won'];
    for (const st of invalidStatuses) {
      const res = await request(app).post('/api/leads').set('Cookie', authCookie).send({ ...validLead, email: `test-${st}@ex.com`, status: st });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    }
  });

  it('POST /api/leads - rejects duplicate email', async () => {
    await request(app).post('/api/leads').set('Cookie', authCookie).send(validLead);
    const res = await request(app).post('/api/leads').set('Cookie', authCookie).send(validLead);
    expect(res.status).toBe(409);
  });

  it('GET /api/leads - returns list of leads', async () => {
    await request(app).post('/api/leads').set('Cookie', authCookie).send(validLead);
    const res = await request(app).get('/api/leads').set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe(validLead.name);
  });

  it('GET /api/leads - supports search by name, email, company, and phone', async () => {
    await request(app).post('/api/leads').set('Cookie', authCookie).send({
      name: 'Diana Prince',
      email: 'diana@themyscira.gov',
      phone: '+91-9988776655',
      company: 'Amazonian Exports',
      source: 'Referral',
      status: 'Qualified',
    });

    const searchByName = await request(app).get('/api/leads?search=Diana').set('Cookie', authCookie);
    expect(searchByName.body.data.length).toBe(1);

    const searchByEmail = await request(app).get('/api/leads?search=themyscira').set('Cookie', authCookie);
    expect(searchByEmail.body.data.length).toBe(1);

    const searchByCompany = await request(app).get('/api/leads?search=Exports').set('Cookie', authCookie);
    expect(searchByCompany.body.data.length).toBe(1);

    const searchByPhone = await request(app).get('/api/leads?search=9988776655').set('Cookie', authCookie);
    expect(searchByPhone.body.data.length).toBe(1);

    const searchNoMatch = await request(app).get('/api/leads?search=NonExistent').set('Cookie', authCookie);
    expect(searchNoMatch.body.data.length).toBe(0);
  });

  it('GET /api/leads - supports filter by status', async () => {
    await request(app).post('/api/leads').set('Cookie', authCookie).send({ ...validLead, email: 'lead1@ex.com', status: 'New' });
    await request(app).post('/api/leads').set('Cookie', authCookie).send({ ...validLead, email: 'lead2@ex.com', status: 'Lost' });

    const res = await request(app).get('/api/leads?status=Lost').set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('Lost');
  });

  it('GET /api/leads - supports filter by acquisition source', async () => {
    await request(app).post('/api/leads').set('Cookie', authCookie).send({ ...validLead, email: 'lead-web@ex.com', source: 'Website' });
    await request(app).post('/api/leads').set('Cookie', authCookie).send({ ...validLead, email: 'lead-ref@ex.com', source: 'Referral' });

    const res = await request(app).get('/api/leads?source=Referral').set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].source).toBe('Referral');
  });

  it('GET /api/leads/:id - returns single lead', async () => {
    const created = await request(app).post('/api/leads').set('Cookie', authCookie).send(validLead);
    const res = await request(app).get(`/api/leads/${created.body.id}`).set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.name).toBe(validLead.name);
  });

  it('GET /api/leads/:id - returns 404 for non-existent lead', async () => {
    const res = await request(app).get('/api/leads/99999').set('Cookie', authCookie);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Lead not found');
  });

  it('PUT /api/leads/:id - updates a lead status and details', async () => {
    const created = await request(app).post('/api/leads').set('Cookie', authCookie).send(validLead);
    const res = await request(app)
      .put(`/api/leads/${created.body.id}`)
      .set('Cookie', authCookie)
      .send({ status: 'Qualified', company: 'Updated Corp' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Qualified');
    expect(res.body.company).toBe('Updated Corp');
  });

  it('PUT /api/leads/:id - returns 404 for non-existent lead', async () => {
    const res = await request(app).put('/api/leads/99999').set('Cookie', authCookie).send({ status: 'Contacted' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/leads/:id - deletes a lead', async () => {
    const created = await request(app).post('/api/leads').set('Cookie', authCookie).send(validLead);
    const res = await request(app).delete(`/api/leads/${created.body.id}`).set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Lead deleted successfully');

    // Confirm it's gone
    const fetch = await request(app).get(`/api/leads/${created.body.id}`).set('Cookie', authCookie);
    expect(fetch.status).toBe(404);
  });

  it('DELETE /api/leads/:id - returns 404 for non-existent lead', async () => {
    const res = await request(app).delete('/api/leads/99999').set('Cookie', authCookie);
    expect(res.status).toBe(404);
  });
});

describe('Stats Endpoint', () => {
  it('GET /api/leads/stats - returns statistics for all 4 statuses', async () => {
    await request(app).post('/api/leads').set('Cookie', authCookie).send({
      name: 'Lead 1',
      email: 'l1@ex.com',
      phone: '+91-1111111111',
      company: 'Co 1',
      source: 'Website',
      status: 'New',
    });
    await request(app).post('/api/leads').set('Cookie', authCookie).send({
      name: 'Lead 2',
      email: 'l2@ex.com',
      phone: '+91-2222222222',
      company: 'Co 2',
      source: 'Referral',
      status: 'Contacted',
    });
    await request(app).post('/api/leads').set('Cookie', authCookie).send({
      name: 'Lead 3',
      email: 'l3@ex.com',
      phone: '+91-3333333333',
      company: 'Co 3',
      source: 'Website',
      status: 'Qualified',
    });
    await request(app).post('/api/leads').set('Cookie', authCookie).send({
      name: 'Lead 4',
      email: 'l4@ex.com',
      phone: '+91-4444444444',
      company: 'Co 4',
      source: 'Cold Call',
      status: 'Lost',
    });

    const res = await request(app).get('/api/leads/stats').set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(4);
    expect(res.body.byStatus['New']).toBe(1);
    expect(res.body.byStatus['Contacted']).toBe(1);
    expect(res.body.byStatus['Qualified']).toBe(1);
    expect(res.body.byStatus['Lost']).toBe(1);
    expect(res.body.bySource).toBeInstanceOf(Array);
  });
});

describe('Pagination', () => {
  it('GET /api/leads - supports pagination with limit and page offsets', async () => {
    for (let i = 1; i <= 15; i++) {
      await request(app).post('/api/leads').set('Cookie', authCookie).send({
        name: `Lead ${i}`,
        email: `lead${i}@pagination.com`,
        phone: `+91-90000000${i.toString().padStart(2, '0')}`,
        company: `Company ${i}`,
        source: 'Website',
        status: 'New',
      });
    }

    const page1 = await request(app).get('/api/leads?page=1&limit=10').set('Cookie', authCookie);
    expect(page1.status).toBe(200);
    expect(page1.body.data.length).toBe(10);
    expect(page1.body.pagination.total).toBe(15);
    expect(page1.body.pagination.page).toBe(1);
    expect(page1.body.pagination.totalPages).toBe(2);

    const page2 = await request(app).get('/api/leads?page=2&limit=10').set('Cookie', authCookie);
    expect(page2.status).toBe(200);
    expect(page2.body.data.length).toBe(5);
    expect(page2.body.pagination.page).toBe(2);
  });
});
