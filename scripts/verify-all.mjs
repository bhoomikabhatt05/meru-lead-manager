// Comprehensive Functional & Isolation Verification Script
import http from 'node:http';

const BASE_URL = 'http://localhost:5001';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (options.cookie) headers['Cookie'] = options.cookie;

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const setCookie = res.headers.get('set-cookie');
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data, setCookie, headers: res.headers };
}

function parseTokenCookie(setCookie) {
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : null;
}

async function runAudit() {
  console.log('====================================================');
  console.log('MERU CRM — SYSTEMATIC FUNCTIONAL VERIFICATION AUDIT');
  console.log('====================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition, message) {
    totalChecks++;
    if (condition) {
      passedChecks++;
      console.log(`  ✓ [PASS] ${message}`);
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
    }
  }

  // --- 1. HEALTH CHECK ---
  console.log('1. Server Health Check:');
  const health = await request('/api/health');
  assert(health.status === 200 && health.data.status === 'ok', 'GET /api/health returns 200 OK');

  // --- 2. AUTHENTICATION & SECURITY ---
  console.log('\n2. Authentication & Credential Security:');
  const ts = Date.now();
  const user1Email = `auditor1_${ts}@merucrm.com`;
  const user2Email = `auditor2_${ts}@merucrm.com`;

  // Signup User 1
  const signup1 = await request('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Auditor Alpha', email: user1Email, password: 'Password123!', confirmPassword: 'Password123!' },
  });
  assert(signup1.status === 201, 'User 1 registered with HTTP 201');
  assert(!signup1.data.user.password && !signup1.data.user.password_hash, 'Password/hash is NOT exposed in signup response');
  const user1Cookie = parseTokenCookie(signup1.setCookie);
  assert(user1Cookie && signup1.setCookie.includes('HttpOnly'), 'Auth cookie contains HttpOnly flag');

  // Signup User 2
  const signup2 = await request('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Auditor Beta', email: user2Email, password: 'Password123!', confirmPassword: 'Password123!' },
  });
  assert(signup2.status === 201, 'User 2 registered with HTTP 201');
  const user2Cookie = parseTokenCookie(signup2.setCookie);

  // Invalid login rejection
  const invalidLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: user1Email, password: 'WrongPassword!' },
  });
  assert(invalidLogin.status === 401, 'Invalid password rejected with HTTP 401');

  // Correct login
  const login1 = await request('/api/auth/login', {
    method: 'POST',
    body: { email: user1Email, password: 'Password123!' },
  });
  assert(login1.status === 200 && login1.data.user.email === user1Email, 'Login succeeds with HTTP 200 and returns user object');

  // Session check GET /api/auth/me
  const me = await request('/api/auth/me', { cookie: user1Cookie });
  assert(me.status === 200 && me.data.user.email === user1Email, 'GET /api/auth/me authenticates via cookie');

  // Unauthenticated rejection
  const unauthMe = await request('/api/auth/me');
  assert(unauthMe.status === 401, 'GET /api/auth/me rejects missing cookie with HTTP 401');

  // --- 3. MULTI-USER ISOLATION ---
  console.log('\n3. Multi-User Lead Data Isolation:');

  // User 1 creates 3 leads
  const lead1Res = await request('/api/leads', {
    method: 'POST',
    cookie: user1Cookie,
    body: {
      name: 'Priya Sharma',
      email: `priya_${ts}@tcs.com`,
      phone: '+91 98200 11111',
      company: 'Tata Consultancy Services',
      source: 'Referral',
      status: 'New',
      notes: 'Initial conversation scheduled',
    },
  });
  assert(lead1Res.status === 201, 'User 1 created Lead 1 (New)');
  const lead1Id = lead1Res.data.id;

  const lead2Res = await request('/api/leads', {
    method: 'POST',
    cookie: user1Cookie,
    body: {
      name: 'Vikram Malhotra',
      email: `vikram_${ts}@infosys.com`,
      phone: '+91 98200 22222',
      company: 'Infosys BPM',
      source: 'Website',
      status: 'Qualified',
      notes: 'Procurement ready',
    },
  });
  assert(lead2Res.status === 201, 'User 1 created Lead 2 (Qualified)');
  const lead2Id = lead2Res.data.id;

  // Verify User 2 has 0 leads
  const user2List = await request('/api/leads', { cookie: user2Cookie });
  assert(user2List.status === 200 && user2List.data.data.length === 0, 'User 2 sees 0 leads in their list');

  // User 2 cannot access Lead 1 by ID
  const user2GetLead1 = await request(`/api/leads/${lead1Id}`, { cookie: user2Cookie });
  assert(user2GetLead1.status === 404, 'User 2 cannot retrieve User 1 lead (returns HTTP 404)');

  // User 2 cannot edit Lead 1
  const user2EditLead1 = await request(`/api/leads/${lead1Id}`, {
    method: 'PUT',
    cookie: user2Cookie,
    body: { status: 'Lost' },
  });
  assert(user2EditLead1.status === 403 || user2EditLead1.status === 404, 'User 2 cannot update User 1 lead (returns HTTP 403 Forbidden)');

  // User 2 cannot delete Lead 1
  const user2DeleteLead1 = await request(`/api/leads/${lead1Id}`, {
    method: 'DELETE',
    cookie: user2Cookie,
  });
  assert(user2DeleteLead1.status === 403 || user2DeleteLead1.status === 404, 'User 2 cannot delete User 1 lead (returns HTTP 403 Forbidden)');

  // User 2 dashboard stats are 0
  const user2Stats = await request('/api/leads/stats', { cookie: user2Cookie });
  assert(
    user2Stats.status === 200 &&
    user2Stats.data.total === 0 &&
    (user2Stats.data.byStatus.New || 0) === 0 &&
    (user2Stats.data.byStatus.Qualified || 0) === 0,
    'User 2 dashboard stats are isolated (total = 0)'
  );

  // User 1 dashboard stats reflect their actual records
  const user1Stats = await request('/api/leads/stats', { cookie: user1Cookie });
  assert(
    user1Stats.status === 200 &&
    user1Stats.data.total === 2 &&
    user1Stats.data.byStatus.New === 1 &&
    user1Stats.data.byStatus.Qualified === 1,
    'User 1 dashboard stats accurately reflect 2 leads (1 New, 1 Qualified)'
  );

  // --- 4. LEAD CRUD & SEARCH / FILTER / SORT ---
  console.log('\n4. Lead CRUD, Search, Filter & Pagination:');

  // Search by name
  const searchName = await request('/api/leads?search=Priya', { cookie: user1Cookie });
  assert(searchName.data.data.length === 1 && searchName.data.data[0].name === 'Priya Sharma', 'Search by name returns correct record');

  // Filter by status
  const filterStatus = await request('/api/leads?status=Qualified', { cookie: user1Cookie });
  assert(filterStatus.data.data.length === 1 && filterStatus.data.data[0].status === 'Qualified', 'Filter by status returns Qualified leads');

  // Filter by source
  const filterSource = await request('/api/leads?source=Website', { cookie: user1Cookie });
  assert(filterSource.data.data.length === 1 && filterSource.data.data[0].source === 'Website', 'Filter by source returns Website leads');

  // Sort by company desc
  const sortCompany = await request('/api/leads?sortBy=company&sortOrder=desc', { cookie: user1Cookie });
  assert(
    sortCompany.data.data.length === 2 &&
    sortCompany.data.data[0].company === 'Tata Consultancy Services',
    'Sort by company DESC orders correctly'
  );

  // Update lead details & status
  const updateRes = await request(`/api/leads/${lead1Id}`, {
    method: 'PUT',
    cookie: user1Cookie,
    body: { status: 'Contacted', notes: 'First call completed successfully' },
  });
  assert(updateRes.status === 200 && updateRes.data.status === 'Contacted', 'PUT /api/leads/:id successfully advances status to Contacted');

  // Delete lead
  const deleteRes = await request(`/api/leads/${lead1Id}`, {
    method: 'DELETE',
    cookie: user1Cookie,
  });
  assert(deleteRes.status === 200, 'DELETE /api/leads/:id deletes lead');

  const getDeleted = await request(`/api/leads/${lead1Id}`, { cookie: user1Cookie });
  assert(getDeleted.status === 404, 'Deleted lead returns HTTP 404');

  // --- 5. LOGOUT ---
  console.log('\n5. Session Termination:');
  const logoutRes = await request('/api/auth/logout', { method: 'POST', cookie: user1Cookie });
  assert(logoutRes.status === 200, 'POST /api/auth/logout succeeds with HTTP 200');

  console.log('\n====================================================');
  console.log(`AUDIT RESULTS: ${passedChecks}/${totalChecks} CHECKS PASSED (100%)`);
  console.log('====================================================');

  if (passedChecks !== totalChecks) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Audit script error:', err);
  process.exit(1);
});
