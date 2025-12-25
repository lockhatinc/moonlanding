#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.resolve(process.cwd(), 'data', 'app.db');
const db = new Database(DB_PATH);

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in database:');
tables.forEach(t => console.log(`  - ${t.name}`));

// Check highlight table structure
if (tables.some(t => t.name === 'highlight')) {
  console.log('\nHighlight table schema:');
  const schema = db.prepare("PRAGMA table_info(highlight)").all();
  schema.forEach(col => {
    console.log(`  ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
  });

  // Check record count
  const count = db.prepare('SELECT COUNT(*) as cnt FROM highlight').get();
  console.log(`\nHighlight records: ${count.cnt}`);
}

// Check if review table exists
if (tables.some(t => t.name === 'review')) {
  console.log('\nReview table schema:');
  const schema = db.prepare("PRAGMA table_info(review)").all();
  schema.forEach(col => {
    console.log(`  ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
  });
}

// Check if users table exists
if (tables.some(t => t.name === 'users')) {
  console.log('\nUsers table schema:');
  const schema = db.prepare("PRAGMA table_info(users)").all();
  schema.forEach(col => {
    console.log(`  ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
  });
}

db.close();
