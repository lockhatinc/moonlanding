#!/usr/bin/env node

import Database from 'better-sqlite3';

const db = new Database('/home/user/lexco/moonlanding/data/app.db');

const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();

console.log(`\n📊 Database Schema\n${'='.repeat(60)}\n`);

for (const table of tables) {
  const cols = db.prepare(`PRAGMA table_info(${table.name})`).all();
  console.log(`\n📋 ${table.name} (${cols.length} columns):`);
  cols.forEach(col => {
    console.log(`  - ${col.name} (${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PK' : ''})`);
  });
}

db.close();
