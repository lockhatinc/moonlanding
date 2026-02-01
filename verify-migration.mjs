import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'app.db');
const db = new Database(dbPath);

console.log('=== DATABASE VERIFICATION ===\n');

try {
  const users = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  console.log(`Users: ${users.cnt}`);
  const userList = db.prepare('SELECT id, email, role FROM users').all();
  userList.forEach(u => console.log(`  - ${u.id}: ${u.email} (${u.role})`));

  console.log('');
  const clients = db.prepare('SELECT COUNT(*) as cnt FROM client').get();
  console.log(`Clients: ${clients.cnt}`);
  const clientList = db.prepare('SELECT id, name, email FROM client').all();
  clientList.forEach(c => console.log(`  - ${c.id}: ${c.name} (${c.email})`));

  console.log('');
  const engagements = db.prepare('SELECT COUNT(*) as cnt FROM engagement').get();
  console.log(`Engagements: ${engagements.cnt}`);
  const engList = db.prepare('SELECT id, name, client_id, stage FROM engagement').all();
  engList.forEach(e => console.log(`  - ${e.id}: ${e.name} [${e.stage}] (client: ${e.client_id})`));

  console.log('');
  const rfis = db.prepare('SELECT COUNT(*) as cnt FROM rfi').get();
  console.log(`RFIs: ${rfis.cnt}`);
  const rfiList = db.prepare('SELECT id, title, engagement_id, status FROM rfi').all();
  rfiList.forEach(r => console.log(`  - ${r.id}: ${r.title} [${r.status}] (eng: ${r.engagement_id})`));

  console.log('\n=== REFERENTIAL INTEGRITY ===\n');
  
  const engWithoutClients = db.prepare(`
    SELECT COUNT(*) as cnt FROM engagement 
    WHERE client_id NOT IN (SELECT id FROM client)
  `).get();
  console.log(`Engagements without clients: ${engWithoutClients.cnt}`);

  const rfisWithoutEngs = db.prepare(`
    SELECT COUNT(*) as cnt FROM rfi 
    WHERE engagement_id NOT IN (SELECT id FROM engagement)
  `).get();
  console.log(`RFIs without engagements: ${rfisWithoutEngs.cnt}`);

  console.log('\n✓ Verification complete');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  db.close();
}
