const request = require('supertest');
const path = require('path');
const jwt = require('jsonwebtoken');

process.env.DB_PATH = path.join(__dirname, '../../data/test-auth.db');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-auth-unit-tests';

const app = require('../src/app');
const db = require('../src/database');

beforeEach(() => {
  db.exec('DELETE FROM leads');
  db.exec('DELETE FROM users');
});

afterAll(() => {
  db.close();
  const fs = require('fs');
  const testDbPath = path.join(__dirname, '../../data/test-auth.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('User Authentication & Authorization Suite', () => {
  const testUser = {
    name: 'Sarah Connor',
    email: 'sarah@skynet-defense.com',
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
  };

  describe('Registration (POST /api/auth/signup)', () => {
    it('successfully registers a new user with hashed password and sets auth cookie', async () => {
      const res = await request(app).post('/api/auth/signup').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe(testUser.name);
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.password_hash).toBeUndefined(); // Never expose password hash!
      expect(res.body.user.password).toBeUndefined();

      // Verify HTTP-only cookie is set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith('token='))).toBe(true);

      // Verify password in database is hashed with bcrypt, not plaintext
      const dbUser = db.prepare('SELECT * FROM users WHERE email = ?').get(testUser.email.toLowerCase());
      expect(dbUser).toBeDefined();
      expect(dbUser.password_hash).not.toBe(testUser.password);
      expect(dbUser.password_hash.startsWith('$2')).toBe(true); // bcrypt prefix
    });

    it('rejects duplicate email registrations with 409 Conflict', async () => {
      await request(app).post('/api/auth/signup').send(testUser);
      const res = await request(app).post('/api/auth/signup').send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('rejects invalid email formats', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        ...testUser,
        email: 'invalid-email-address',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('rejects mismatched confirm password', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        ...testUser,
        confirmPassword: 'DifferentPassword999!',
      });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => d.message === 'Passwords do not match')).toBe(true);
    });

    it('rejects passwords shorter than 6 characters', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        ...testUser,
        password: '123',
        confirmPassword: '123',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('Login (POST /api/auth/login)', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/signup').send(testUser);
    });

    it('logs in successfully with correct credentials and returns user and cookie', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('rejects incorrect password with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('rejects non-existent email with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@nowhere.com',
        password: testUser.password,
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });
  });

  describe('Session & Profile (GET /api/auth/me & POST /api/auth/logout)', () => {
    let authCookie;

    beforeEach(async () => {
      const signupRes = await request(app).post('/api/auth/signup').send(testUser);
      authCookie = signupRes.headers['set-cookie'];
    });

    it('GET /api/auth/me returns authenticated user when valid cookie is provided', async () => {
      const res = await request(app).get('/api/auth/me').set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.name).toBe(testUser.name);
    });

    it('GET /api/auth/me rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication required');
    });

    it('POST /api/auth/logout clears auth cookie', async () => {
      const res = await request(app).post('/api/auth/logout').set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
      // Cookie is cleared or expired
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });
  });

  describe('Multi-User Lead Data Isolation (Cross-User Protection)', () => {
    let user1Cookie;
    let user2Cookie;
    let user1Lead;

    beforeEach(async () => {
      // 1. Register User 1
      const u1Res = await request(app).post('/api/auth/signup').send({
        name: 'User One',
        email: 'user1@merucrm.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      user1Cookie = u1Res.headers['set-cookie'];

      // 2. Register User 2
      const u2Res = await request(app).post('/api/auth/signup').send({
        name: 'User Two',
        email: 'user2@merucrm.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      user2Cookie = u2Res.headers['set-cookie'];

      // 3. User 1 creates Lead 1
      const leadRes = await request(app)
        .post('/api/leads')
        .set('Cookie', user1Cookie)
        .send({
          name: 'Confidential Client A',
          email: 'client-a@exclusive.com',
          phone: '+1 555 0100',
          company: 'Secret Corp',
          source: 'Referral',
          status: 'Qualified',
        });
      user1Lead = leadRes.body;
    });

    it('User 2 cannot see User 1 leads in the list view (GET /api/leads)', async () => {
      const res = await request(app).get('/api/leads').set('Cookie', user2Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.pagination.total).toBe(0);
    });

    it('User 2 cannot retrieve User 1 lead by ID (GET /api/leads/:id)', async () => {
      const res = await request(app).get(`/api/leads/${user1Lead.id}`).set('Cookie', user2Cookie);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Lead not found');
    });

    it('User 2 cannot modify User 1 lead (PUT /api/leads/:id)', async () => {
      const res = await request(app)
        .put(`/api/leads/${user1Lead.id}`)
        .set('Cookie', user2Cookie)
        .send({
          name: 'Hacked Name',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');

      // Verify User 1 lead remains unchanged in database
      const check = db.prepare('SELECT name FROM leads WHERE id = ?').get(user1Lead.id);
      expect(check.name).toBe('Confidential Client A');
    });

    it('User 2 cannot delete User 1 lead (DELETE /api/leads/:id)', async () => {
      const res = await request(app)
        .delete(`/api/leads/${user1Lead.id}`)
        .set('Cookie', user2Cookie);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');

      // Verify lead still exists in database
      const check = db.prepare('SELECT id FROM leads WHERE id = ?').get(user1Lead.id);
      expect(check).toBeDefined();
    });

    it('Dashboard stats are isolated per user (GET /api/leads/stats)', async () => {
      const u1Stats = await request(app).get('/api/leads/stats').set('Cookie', user1Cookie);
      expect(u1Stats.body.total).toBe(1);
      expect(u1Stats.body.byStatus['Qualified']).toBe(1);

      const u2Stats = await request(app).get('/api/leads/stats').set('Cookie', user2Cookie);
      expect(u2Stats.body.total).toBe(0);
      expect(u2Stats.body.byStatus['Qualified']).toBeUndefined();
    });

    it('Rejects unauthenticated API access to /api/leads with 401', async () => {
      const res = await request(app).get('/api/leads');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication required');
    });
  });
});
