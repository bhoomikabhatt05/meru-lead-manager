const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH
  ? (path.isAbsolute(process.env.DB_PATH) ? process.env.DB_PATH : path.resolve(__dirname, '..', process.env.DB_PATH))
  : path.join(__dirname, '../data/leads.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Ensure users and leads tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    company TEXT NOT NULL,
    source TEXT NOT NULL CHECK(source IN ('Website', 'Referral', 'Social Media', 'Email Campaign', 'Cold Call', 'Other')),
    status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New', 'Contacted', 'Qualified', 'Lost')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Ensure demo user exists
let demoUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@merucrm.com');
if (!demoUser) {
  const hash = bcrypt.hashSync('Password123!', 10);
  const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run('Demo Admin', 'demo@merucrm.com', hash);
  demoUser = { id: Number(result.lastInsertRowid) };
}

const DEMO_LEADS = [
  {
    name: 'Aarav Mehta',
    email: 'aarav.mehta@stripe.com',
    phone: '+91 98201 45678',
    company: 'Stripe India',
    source: 'Website',
    status: 'Qualified',
    notes: 'Evaluating CRM integration for APAC merchant expansion. High intent.',
  },
  {
    name: 'Elena Rostova',
    email: 'elena@notion.so',
    phone: '+1 415 890 2341',
    company: 'Notion Labs',
    source: 'Referral',
    status: 'Contacted',
    notes: 'Intro from venture partner. Followed up with product architecture overview.',
  },
  {
    name: 'Kavita Sundaram',
    email: 'kavita@razorpay.com',
    phone: '+91 98450 11223',
    company: 'Razorpay',
    source: 'Social Media',
    status: 'Qualified',
    notes: 'Interested in pipeline automation and automated lead scoring API.',
  },
  {
    name: 'Marcus Vance',
    email: 'marcus.v@figma.com',
    phone: '+1 650 334 9912',
    company: 'Figma',
    source: 'Website',
    status: 'New',
    notes: 'Downloaded whitepaper from marketing campaign landing page.',
  },
  {
    name: 'Priya Nambiar',
    email: 'priya@freshworks.com',
    phone: '+91 97112 34567',
    company: 'Freshworks',
    source: 'Email Campaign',
    status: 'Contacted',
    notes: 'Discussed webhook delivery SLAs and SQLite multi-region replication.',
  },
  {
    name: 'Liam Chen',
    email: 'liam@vercel.com',
    phone: '+1 206 555 0192',
    company: 'Vercel Inc.',
    source: 'Website',
    status: 'New',
    notes: 'Inbound trial request for enterprise deployment on edge network.',
  },
  {
    name: 'Rohan Deshmukh',
    email: 'rohan.d@zomato.com',
    phone: '+91 99887 66554',
    company: 'Zomato Limited',
    source: 'Cold Call',
    status: 'Lost',
    notes: 'Decided to renew existing internal tool suite for next fiscal year.',
  },
  {
    name: 'Sophia Sterling',
    email: 'sophia@linear.app',
    phone: '+44 20 7946 0912',
    company: 'Linear Orbit',
    source: 'Referral',
    status: 'Qualified',
    notes: 'Reviewed technical requirements. Scheduling final contract review.',
  },
  {
    name: 'Vikramaditya Bose',
    email: 'vikram@postman.com',
    phone: '+91 98199 87654',
    company: 'Postman Labs',
    source: 'Other',
    status: 'Contacted',
    notes: 'Connected during Bangalore SaaS summit. Requested product trial walkthrough.',
  },
  {
    name: 'Claire Dupont',
    email: 'claire@datadoghq.com',
    phone: '+33 1 42 68 55 00',
    company: 'Datadog',
    source: 'Social Media',
    status: 'Lost',
    notes: 'Currently locked into a multi-year vendor contract until Q4.',
  },
  {
    name: 'Aditya Kulkarni',
    email: 'aditya.k@zepto.in',
    phone: '+91 91678 23456',
    company: 'Zepto Quick Comm',
    source: 'Website',
    status: 'New',
    notes: 'Looking to organize quick merchant onboarding leads into a centralized view.',
  },
];

console.log(`Clearing existing demo leads from ${DB_PATH}...`);
db.prepare('DELETE FROM leads WHERE user_id = ?').run(demoUser.id);

const insertStmt = db.prepare(`
  INSERT INTO leads (name, email, phone, company, source, status, notes, user_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

let count = 0;
for (const lead of DEMO_LEADS) {
  insertStmt.run(
    lead.name,
    lead.email,
    lead.phone,
    lead.company,
    lead.source,
    lead.status,
    lead.notes,
    demoUser.id
  );
  count++;
}

console.log(`Successfully seeded ${count} demonstration leads for user demo@merucrm.com (ID: ${demoUser.id}).`);
db.close();
