const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH
  ? (path.isAbsolute(process.env.DB_PATH) ? process.env.DB_PATH : path.resolve(__dirname, '..', process.env.DB_PATH))
  : path.join(__dirname, '../data/leads.db');

// Ensure the data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better concurrency and durability
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// 1. Create the users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// 2. Create the leads table if it doesn't exist
db.exec(`
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
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// 3. Safe migration: Add user_id column if it doesn't exist yet
const columns = db.prepare("PRAGMA table_info(leads)").all();
const hasUserId = columns.some((col) => col.name === 'user_id');
if (!hasUserId) {
  db.exec('ALTER TABLE leads ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;');
}
db.exec('CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);');

// 4. Safe data migration: ensure any existing unassigned records belong to a default demo account
try {
  const unassigned = db.prepare('SELECT COUNT(*) as count FROM leads WHERE user_id IS NULL').get();
  if (unassigned && unassigned.count > 0) {
    let demoUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@merucrm.com');
    if (!demoUser) {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('Password123!', 10);
      const res = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
        .run('Demo User', 'demo@merucrm.com', hash);
      demoUser = { id: res.lastInsertRowid };
    }
    db.prepare('UPDATE leads SET user_id = ? WHERE user_id IS NULL').run(demoUser.id);
  }
} catch (e) {
  // Gracefully handle if users table is being created
}

module.exports = db;
