const sqlite3 = require('better-sqlite3');
const db = sqlite3('./data/app.db');

const tables = ['client', 'engagement', 'team', 'review', 'rfi', 'notification', 'user'];

for (const table of tables) {
  console.log(`\n=== ${table} ===`);
  const schema = db.prepare(`PRAGMA table_info(${table})`).all();
  schema.forEach(col => console.log(`  ${col.name}: ${col.type}`));
}

db.close();
