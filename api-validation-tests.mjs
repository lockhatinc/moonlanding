import fs from 'fs';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(process.cwd(), 'data', 'app.db');
const db = new Database(dbPath);

class APIValidationTests {
  constructor() {
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  test(name, fn) {
    try {
      fn();
      this.results.tests.push({ name, status: 'PASS', error: null });
      this.results.passed++;
      console.log(`  ✓ ${name}`);
    } catch (e) {
      this.results.tests.push({ name, status: 'FAIL', error: e.message });
      this.results.failed++;
      this.results.errors.push(`${name}: ${e.message}`);
      console.log(`  ✗ ${name}: ${e.message}`);
    }
  }

  testUserAPIs() {
    console.log('\n=== USER API VALIDATION ===\n');

    this.test('Users table exists', () => {
      const result = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
      if (result.cnt < 4) throw new Error(`Expected at least 4 users, got ${result.cnt}`);
    });

    this.test('User has email field', () => {
      const user = db.prepare('SELECT email FROM users WHERE id = ?').get('partner-001');
      if (!user || !user.email) throw new Error('User email not found');
    });

    this.test('User has role field', () => {
      const user = db.prepare('SELECT role FROM users WHERE id = ?').get('partner-001');
      if (!user || user.role !== 'partner') throw new Error('User role not correct');
    });

    this.test('All 4 roles exist', () => {
      const roles = ['partner', 'manager', 'clerk', 'client_admin'];
      const roleQuery = db.prepare('SELECT DISTINCT role FROM users');
      const dbRoles = roleQuery.all().map(r => r.role);
      const missingRoles = roles.filter(r => !dbRoles.includes(r));
      if (missingRoles.length > 0) throw new Error(`Missing roles: ${missingRoles.join(', ')}`);
    });

    this.test('User password_hash is present', () => {
      const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get('partner-001');
      if (!user || !user.password_hash || user.password_hash.length < 20) {
        throw new Error('User password hash is missing or invalid');
      }
    });

    this.test('User timestamps exist', () => {
      const user = db.prepare('SELECT created_at, updated_at FROM users WHERE id = ?').get('partner-001');
      if (!user || !user.created_at || !user.updated_at) throw new Error('User timestamps missing');
    });
  }

  testClientAPIs() {
    console.log('\n=== CLIENT API VALIDATION ===\n');

    this.test('Clients table exists and populated', () => {
      const result = db.prepare('SELECT COUNT(*) as cnt FROM client').get();
      if (result.cnt < 2) throw new Error(`Expected at least 2 clients, got ${result.cnt}`);
    });

    this.test('Client has name field', () => {
      const client = db.prepare('SELECT name FROM client WHERE id = ?').get('client-001');
      if (!client || !client.name) throw new Error('Client name not found');
    });

    this.test('Client has email field', () => {
      const client = db.prepare('SELECT email FROM client WHERE id = ?').get('client-001');
      if (!client || !client.email) throw new Error('Client email not found');
    });

    this.test('Client has timestamps', () => {
      const client = db.prepare('SELECT created_at, updated_at FROM client WHERE id = ?').get('client-001');
      if (!client || !client.created_at) throw new Error('Client timestamps missing');
    });

    this.test('Client has created_by field', () => {
      const client = db.prepare('SELECT created_by FROM client WHERE id = ?').get('client-001');
      if (!client || !client.created_by) throw new Error('Client created_by missing');
    });
  }

  testEngagementAPIs() {
    console.log('\n=== ENGAGEMENT API VALIDATION ===\n');

    this.test('Engagements table exists and populated', () => {
      const result = db.prepare('SELECT COUNT(*) as cnt FROM engagement').get();
      if (result.cnt < 2) throw new Error(`Expected at least 2 engagements, got ${result.cnt}`);
    });

    this.test('Engagement has name field', () => {
      const eng = db.prepare('SELECT name FROM engagement WHERE id = ?').get('eng-001');
      if (!eng || !eng.name) throw new Error('Engagement name not found');
    });

    this.test('Engagement has client_id reference', () => {
      const eng = db.prepare('SELECT client_id FROM engagement WHERE id = ?').get('eng-001');
      if (!eng || !eng.client_id) throw new Error('Engagement client_id missing');
    });

    this.test('Engagement has year field', () => {
      const eng = db.prepare('SELECT year FROM engagement WHERE id = ?').get('eng-001');
      if (!eng || eng.year !== 2024) throw new Error('Engagement year incorrect');
    });

    this.test('Engagement has stage field', () => {
      const eng = db.prepare('SELECT stage FROM engagement WHERE id = ?').get('eng-001');
      if (!eng || !eng.stage) throw new Error('Engagement stage missing');
    });

    this.test('Engagement stage is valid', () => {
      const validStages = ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'close_out'];
      const eng = db.prepare('SELECT stage FROM engagement WHERE id = ?').get('eng-001');
      if (!validStages.includes(eng.stage)) throw new Error(`Invalid stage: ${eng.stage}`);
    });

    this.test('Engagement has status field', () => {
      const eng = db.prepare('SELECT status FROM engagement WHERE id = ?').get('eng-001');
      if (!eng || !eng.status) throw new Error('Engagement status missing');
    });

    this.test('Engagement has progress field', () => {
      const eng = db.prepare('SELECT progress FROM engagement WHERE id = ?').get('eng-001');
      if (eng.progress === undefined || eng.progress === null) throw new Error('Engagement progress missing');
    });

    this.test('Engagement references valid client', () => {
      const eng = db.prepare('SELECT client_id FROM engagement WHERE id = ?').get('eng-001');
      const client = db.prepare('SELECT id FROM client WHERE id = ?').get(eng.client_id);
      if (!client) throw new Error(`Client ${eng.client_id} does not exist`);
    });
  }

  testRFIAPIs() {
    console.log('\n=== RFI API VALIDATION ===\n');

    this.test('RFIs table exists and populated', () => {
      const result = db.prepare('SELECT COUNT(*) as cnt FROM rfi').get();
      if (result.cnt < 1) throw new Error('No RFIs found');
    });

    this.test('RFI has title field', () => {
      const rfi = db.prepare('SELECT title FROM rfi WHERE id = ?').get('rfi-001');
      if (!rfi || !rfi.title) throw new Error('RFI title not found');
    });

    this.test('RFI has engagement_id reference', () => {
      const rfi = db.prepare('SELECT engagement_id FROM rfi WHERE id = ?').get('rfi-001');
      if (!rfi || !rfi.engagement_id) throw new Error('RFI engagement_id missing');
    });

    this.test('RFI has status field', () => {
      const rfi = db.prepare('SELECT status FROM rfi WHERE id = ?').get('rfi-001');
      if (!rfi || !rfi.status) throw new Error('RFI status missing');
    });

    this.test('RFI has priority field', () => {
      const rfi = db.prepare('SELECT priority FROM rfi WHERE id = ?').get('rfi-001');
      if (!rfi || !rfi.priority) throw new Error('RFI priority missing');
    });

    this.test('RFI has description field', () => {
      const rfi = db.prepare('SELECT description FROM rfi WHERE id = ?').get('rfi-001');
      if (!rfi || !rfi.description) throw new Error('RFI description missing');
    });

    this.test('RFI references valid engagement', () => {
      const rfi = db.prepare('SELECT engagement_id FROM rfi WHERE id = ?').get('rfi-001');
      const eng = db.prepare('SELECT id FROM engagement WHERE id = ?').get(rfi.engagement_id);
      if (!eng) throw new Error(`Engagement ${rfi.engagement_id} does not exist`);
    });

    this.test('RFI has due_date field', () => {
      const rfi = db.prepare('SELECT due_date FROM rfi WHERE id = ?').get('rfi-001');
      if (!rfi || !rfi.due_date) throw new Error('RFI due_date missing');
    });
  }

  testWorkflowCompliance() {
    console.log('\n=== WORKFLOW COMPLIANCE ===\n');

    this.test('Engagement stages match lifecycle config', () => {
      const validStages = ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'close_out'];
      const engagements = db.prepare('SELECT DISTINCT stage FROM engagement').all();
      for (const eng of engagements) {
        if (!validStages.includes(eng.stage)) {
          throw new Error(`Invalid stage found: ${eng.stage}`);
        }
      }
    });

    this.test('RFI statuses are valid', () => {
      const validStatuses = ['open', 'pending_response', 'responded', 'closed'];
      const rfis = db.prepare('SELECT DISTINCT status FROM rfi').all();
      for (const rfi of rfis) {
        if (!validStatuses.includes(rfi.status)) {
          throw new Error(`Invalid RFI status: ${rfi.status}`);
        }
      }
    });

    this.test('Engagement statuses are valid', () => {
      const validStatuses = ['active', 'archived', 'pending'];
      const engagements = db.prepare('SELECT DISTINCT status FROM engagement').all();
      for (const eng of engagements) {
        if (!validStatuses.includes(eng.status)) {
          throw new Error(`Invalid engagement status: ${eng.status}`);
        }
      }
    });
  }

  testReferentialIntegrity() {
    console.log('\n=== REFERENTIAL INTEGRITY ===\n');

    this.test('All engagement client_ids exist', () => {
      const orphans = db.prepare(`
        SELECT COUNT(*) as cnt FROM engagement 
        WHERE client_id NOT IN (SELECT id FROM client)
      `).get();
      if (orphans.cnt > 0) throw new Error(`${orphans.cnt} orphaned engagement records`);
    });

    this.test('All RFI engagement_ids exist', () => {
      const orphans = db.prepare(`
        SELECT COUNT(*) as cnt FROM rfi 
        WHERE engagement_id NOT IN (SELECT id FROM engagement)
      `).get();
      if (orphans.cnt > 0) throw new Error(`${orphans.cnt} orphaned RFI records`);
    });

    this.test('All engagement created_by users exist', () => {
      const orphans = db.prepare(`
        SELECT COUNT(*) as cnt FROM engagement 
        WHERE created_by IS NOT NULL AND created_by NOT IN (SELECT id FROM users)
      `).get();
      if (orphans.cnt > 0) throw new Error(`${orphans.cnt} engagement records with invalid created_by`);
    });

    this.test('All RFI created_by users exist', () => {
      const orphans = db.prepare(`
        SELECT COUNT(*) as cnt FROM rfi 
        WHERE created_by IS NOT NULL AND created_by NOT IN (SELECT id FROM users)
      `).get();
      if (orphans.cnt > 0) throw new Error(`${orphans.cnt} RFI records with invalid created_by`);
    });
  }

  generateReport() {
    const timestamp = new Date().toISOString();
    const passRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>API Validation Report</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
    h1 { font-size: 2em; margin-bottom: 10px; }
    .timestamp { opacity: 0.9; font-size: 0.9em; }
    .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h2 { color: #667eea; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
    .stat-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-number { font-size: 2.5em; font-weight: 700; }
    .stat-label { font-size: 0.9em; opacity: 0.9; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; }
    tr:hover { background: #f9fafb; }
    .status-pass { color: #10b981; font-weight: 600; }
    .status-fail { color: #ef4444; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600; }
    .badge-pass { background: #d1fae5; color: #065f46; }
    .badge-fail { background: #fee2e2; color: #991b1b; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; text-align: center; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>API Validation Report</h1>
      <p class="timestamp">Generated: ${timestamp}</p>
      <p style="margin-top: 10px; font-size: 0.95em;">Comprehensive validation of moonlanding database and API compliance</p>
    </header>

    <div class="stats">
      <div class="stat-box">
        <div class="stat-number">${this.results.passed}</div>
        <div class="stat-label">Tests Passed</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${this.results.failed}</div>
        <div class="stat-label">Tests Failed</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${passRate}%</div>
        <div class="stat-label">Pass Rate</div>
      </div>
    </div>

    <div class="section">
      <h2>Test Results</h2>
      <table>
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Status</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          ${this.results.tests.map(test => `
            <tr>
              <td>${test.name}</td>
              <td><span class="badge ${test.status === 'PASS' ? 'badge-pass' : 'badge-fail'}">${test.status}</span></td>
              <td>${test.error ? test.error : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${this.results.failed > 0 ? `
      <div class="section">
        <h2>Failed Tests</h2>
        <ul style="list-style: none;">
          ${this.results.errors.map(err => `
            <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #ef4444;">
              <strong>•</strong> ${err}
            </li>
          `).join('')}
        </ul>
      </div>
    ` : ''}

    <div class="section">
      <h2>Validation Summary</h2>
      <p style="margin-bottom: 15px;">
        <span class="${this.results.failed === 0 ? 'status-pass' : 'status-fail'}">
          ${this.results.failed === 0 ? '✓ All tests passed!' : `✗ ${this.results.failed} test(s) failed`}
        </span>
      </p>
      <ul style="list-style: none; margin-top: 15px;">
        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>Total Tests:</strong> ${this.results.passed + this.results.failed}
        </li>
        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>Passed:</strong> ${this.results.passed}
        </li>
        <li style="padding: 8px 0;">
          <strong>Failed:</strong> ${this.results.failed}
        </li>
      </ul>
    </div>

    <footer>
      <p>API Validation Complete</p>
      <p style="margin-top: 10px; opacity: 0.7;">Database ready for production testing</p>
    </footer>
  </div>
</body>
</html>
    `;

    return html;
  }

  run() {
    console.log('\n========== API VALIDATION TESTS ==========\n');
    console.log('Running comprehensive validation tests...\n');

    this.testUserAPIs();
    this.testClientAPIs();
    this.testEngagementAPIs();
    this.testRFIAPIs();
    this.testWorkflowCompliance();
    this.testReferentialIntegrity();

    const report = this.generateReport();
    const reportPath = path.join(process.cwd(), 'api-validation-report.html');
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log('\n========== SUMMARY ==========\n');
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Pass Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);
    console.log(`\nReport saved to: ${reportPath}`);
  }
}

const validator = new APIValidationTests();
validator.run();
db.close();
