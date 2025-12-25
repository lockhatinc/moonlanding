#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.resolve(process.cwd(), 'data', 'app.db');
console.log(`Initializing database at: ${DB_PATH}`);

const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Create basic tables needed for testing
console.log('Creating tables...');

// Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'clerk',
    status TEXT DEFAULT 'active',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);
console.log('✓ Created users table');

// Client table
db.exec(`
  CREATE TABLE IF NOT EXISTS client (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);
console.log('✓ Created client table');

// Engagement table
db.exec(`
  CREATE TABLE IF NOT EXISTS engagement (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    stage TEXT DEFAULT 'info_gathering',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    created_by TEXT,
    FOREIGN KEY (client_id) REFERENCES client(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);
console.log('✓ Created engagement table');

// Review table
db.exec(`
  CREATE TABLE IF NOT EXISTS review (
    id TEXT PRIMARY KEY,
    engagement_id TEXT NOT NULL,
    name TEXT NOT NULL,
    pdf_url TEXT,
    status TEXT DEFAULT 'open',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    created_by TEXT,
    FOREIGN KEY (engagement_id) REFERENCES engagement(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);
console.log('✓ Created review table');

// Highlight table
db.exec(`
  CREATE TABLE IF NOT EXISTS highlight (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'unresolved',
    color TEXT DEFAULT 'grey',
    coordinates TEXT,
    is_high_priority INTEGER DEFAULT 0,
    is_active_focus INTEGER DEFAULT 0,
    archived INTEGER DEFAULT 0,
    archived_at INTEGER,
    archived_by TEXT,
    resolved_at INTEGER,
    resolved_by TEXT,
    resolution_notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    created_by TEXT,
    FOREIGN KEY (review_id) REFERENCES review(id),
    FOREIGN KEY (archived_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);
console.log('✓ Created highlight table');

// Activity log table
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    user_id TEXT,
    details TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);
console.log('✓ Created activity_log table');

// Highlight comment table
db.exec(`
  CREATE TABLE IF NOT EXISTS highlight_comment (
    id TEXT PRIMARY KEY,
    highlight_id TEXT NOT NULL,
    text TEXT NOT NULL,
    author_id TEXT,
    parent_comment_id TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (highlight_id) REFERENCES highlight(id),
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (parent_comment_id) REFERENCES highlight_comment(id)
  )
`);
console.log('✓ Created highlight_comment table');

// Verify tables were created
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(`\n✓ Database initialized. Tables created: ${tables.map(t => t.name).join(', ')}`);

db.close();
