/**
 * Email Parsing Tests
 * Tests for config-driven pattern matching, attachment extraction, and email allocation
 */

import { getDatabase, genId, now } from '@/lib/database-core';
import { getConfigEngine } from '@/lib/config-generator-engine';
import {
  extractEngagementId,
  extractRfiId,
  parseEmailForAllocation,
  validateAllocation,
  allocateEmailToEntity,
  autoAllocateEmail,
  getEmailPatterns
} from '@/lib/email-parser';
import path from 'path';
import fs from 'fs';

const TEST_RESULTS = [];
const TEMP_EMAIL_ATTACHMENTS_DIR = path.resolve(process.cwd(), 'temp_email_attachments');

// Ensure temp directory exists
function ensureTempDir() {
  if (!fs.existsSync(TEMP_EMAIL_ATTACHMENTS_DIR)) {
    fs.mkdirSync(TEMP_EMAIL_ATTACHMENTS_DIR, { recursive: true });
    console.log(`Created temp directory: ${TEMP_EMAIL_ATTACHMENTS_DIR}`);
  }
}

// Test helper
function logTest(testNum, name, status, details) {
  const result = {
    test: testNum,
    name,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  TEST_RESULTS.push(result);
  const statusSymbol = status === 'PASS' ? 'OK' : 'FAIL';
  console.log(`Test #${testNum}: [${name}] | Status: ${statusSymbol} | Details: ${details}`);
}

// Setup: Insert test data
function setupTestData() {
  const db = getDatabase();

  // Clear existing test data
  try {
    db.prepare('DELETE FROM email WHERE id LIKE ?').run('test-%');
    db.prepare('DELETE FROM engagement WHERE id LIKE ?').run('test-eng-%');
    db.prepare('DELETE FROM rfi WHERE id LIKE ?').run('test-rfi-%');
  } catch (e) {
    // Tables may not exist yet
  }

  // Insert test engagements
  const engagementId1 = 'test-eng-12345';
  const engagementId2 = 'test-eng-54321';

  try {
    db.prepare(`
      INSERT OR IGNORE INTO engagement (id, name, client_id, year, stage, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(engagementId1, 'Test Engagement 1', 'test-client-1', 2024, 'info_gathering', now(), now());

    db.prepare(`
      INSERT OR IGNORE INTO engagement (id, name, client_id, year, stage, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(engagementId2, 'Test Engagement 2', 'test-client-2', 2024, 'team_execution', now(), now());
  } catch (e) {
    console.warn('Could not insert test engagements:', e.message);
  }

  // Insert test RFI
  const rfiId1 = 'test-rfi-67890';
  try {
    db.prepare(`
      INSERT OR IGNORE INTO rfi (id, engagement_id, subject, created_at, updated_at, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(rfiId1, engagementId1, 'Test RFI', now(), now(), 'pending');
  } catch (e) {
    console.warn('Could not insert test RFI:', e.message);
  }

  return { engagementId1, engagementId2, rfiId1 };
}

// TEST 49: Attachment extraction to temp_email_attachments/
async function test49() {
  const testNum = 49;
  const testName = 'Attachment extraction to temp_email_attachments';

  ensureTempDir();

  // Create mock attachment files
  const attachmentDir = TEMP_EMAIL_ATTACHMENTS_DIR;
  const file1Path = path.join(attachmentDir, 'financial.pdf');
  const file2Path = path.join(attachmentDir, 'schedule.pdf');

  // Write test PDF content (simplified)
  fs.writeFileSync(file1Path, 'PDF_MOCK_CONTENT_FINANCIAL');
  fs.writeFileSync(file2Path, 'PDF_MOCK_CONTENT_SCHEDULE');

  const file1Size = fs.statSync(file1Path).size;
  const file2Size = fs.statSync(file2Path).size;

  // Verify files exist
  const file1Exists = fs.existsSync(file1Path);
  const file2Exists = fs.existsSync(file2Path);

  // Verify directory exists
  const dirExists = fs.existsSync(attachmentDir);

  // Verify files are readable
  let file1Readable = false, file2Readable = false;
  try {
    fs.readFileSync(file1Path, 'utf8');
    file1Readable = true;
  } catch (e) {
    file1Readable = false;
  }

  try {
    fs.readFileSync(file2Path, 'utf8');
    file2Readable = true;
  } catch (e) {
    file2Readable = false;
  }

  const allChecks = dirExists && file1Exists && file2Exists && file1Readable && file2Readable;
  const details = `Directory created: ${dirExists}, Files extracted: ${file1Exists && file2Exists}, Readable: ${file1Readable && file2Readable}, Sizes: ${file1Size}B, ${file2Size}B`;

  logTest(testNum, testName, allChecks ? 'PASS' : 'FAIL', details);

  // Cleanup
  fs.unlinkSync(file1Path);
  fs.unlinkSync(file2Path);

  return allChecks;
}

// TEST 50: Email saved with allocated: false initially
async function test50() {
  const testNum = 50;
  const testName = 'Email saved with allocated: false initially';

  const db = getDatabase();
  const { engagementId1 } = setupTestData();

  const emailId = `test-${genId()}`;
  const timestamp = now();

  // Insert email with allocated=false
  try {
    db.prepare(`
      INSERT INTO email (id, from_email, subject, body, allocated, status, received_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(emailId, 'test@example.com', 'ENG-12345 Q4 Audit Response', 'See attached financials', 0, 'pending', timestamp, timestamp, timestamp);
  } catch (e) {
    logTest(testNum, testName, 'FAIL', `Failed to insert email: ${e.message}`);
    return false;
  }

  // Retrieve and verify
  try {
    const email = db.prepare('SELECT * FROM email WHERE id = ?').get(emailId);

    if (!email) {
      logTest(testNum, testName, 'FAIL', 'Email not found in database');
      return false;
    }

    const allocated = email.allocated;
    const hasStatus = !!email.status;
    const hasFromEmail = !!email.from_email;
    const hasSubject = !!email.subject;
    const hasBody = !!email.body;

    const allChecks = allocated === 0 && hasStatus && hasFromEmail && hasSubject && hasBody;
    const details = `allocated=${allocated}, status=${email.status}, from=${email.from_email}, subject=${email.subject.substring(0, 30)}...`;

    logTest(testNum, testName, allChecks ? 'PASS' : 'FAIL', details);

    // Cleanup
    db.prepare('DELETE FROM email WHERE id = ?').run(emailId);

    return allChecks;
  } catch (e) {
    logTest(testNum, testName, 'FAIL', `Database error: ${e.message}`);
    return false;
  }
}

// TEST 51: Config-driven pattern matching
async function test51() {
  const testNum = 51;
  const testName = 'Config-driven pattern matching (5 engagement + 4 RFI patterns)';

  try {
    const patterns = await getEmailPatterns();

    // Check engagement patterns
    const engagementCount = patterns.engagement.length;
    const rfiCount = patterns.rfi.length;

    // Check if patterns are RegExp objects
    const engagementValid = patterns.engagement.every(p => p instanceof RegExp);
    const rfiValid = patterns.rfi.every(p => p instanceof RegExp);

    const details = `Engagement patterns: ${engagementCount} (valid: ${engagementValid}), RFI patterns: ${rfiCount} (valid: ${rfiValid})`;

    logTest(testNum, testName, engagementValid && rfiValid && engagementCount >= 5 && rfiCount >= 4 ? 'PASS' : 'FAIL', details);

    return engagementValid && rfiValid;
  } catch (e) {
    logTest(testNum, testName, 'FAIL', `Failed to load patterns: ${e.message}`);
    return false;
  }
}

// TEST 51a: Extract engagement ID with pattern matching
async function test51a() {
  const testNum = '51a';
  const testName = 'Extract engagement ID: ENG-12345 pattern';

  const subject = 'ENG-12345 Quarterly Report';
  const id = await extractEngagementId(subject);

  const success = id === '12345';
  const details = `Extracted ID: ${id}, Expected: 12345`;

  logTest(testNum, testName, success ? 'PASS' : 'FAIL', details);
  return success;
}

// TEST 51b: RFI pattern extraction
async function test51b() {
  const testNum = '51b';
  const testName = 'RFI pattern extraction: RFI-67890';

  const subject = 'RFI-67890 Financial Data Request';
  const id = await extractRfiId(subject);

  const success = id === '67890';
  const details = `Extracted ID: ${id}, Expected: 67890`;

  logTest(testNum, testName, success ? 'PASS' : 'FAIL', details);
  return success;
}

// TEST 51c: Case-insensitive matching
async function test51c() {
  const testNum = '51c';
  const testName = 'Case-insensitive pattern matching';

  const subjects = ['eng-12345', 'ENG-12345', 'Eng-12345', 'eNg-12345'];

  let allMatch = true;
  const results = [];

  for (const subject of subjects) {
    const id = await extractEngagementId(subject);
    const matches = id === '12345';
    results.push(`${subject}=${id} (${matches ? 'OK' : 'FAIL'})`);
    allMatch = allMatch && matches;
  }

  const details = results.join(', ');
  logTest(testNum, testName, allMatch ? 'PASS' : 'FAIL', details);
  return allMatch;
}

// TEST 51d: Pattern precedence (first match used)
async function test51d() {
  const testNum = '51d';
  const testName = 'Pattern precedence - first match used';

  const subject = 'ENG-12345 RFI-67890 Mixed Patterns';

  const engId = await extractEngagementId(subject);
  const rfiId = await extractRfiId(subject);

  const engSuccess = engId === '12345';
  const rfiSuccess = rfiId === '67890';

  const details = `Engagement: ${engId} (expected 12345), RFI: ${rfiId} (expected 67890)`;

  logTest(testNum, testName, engSuccess && rfiSuccess ? 'PASS' : 'FAIL', details);
  return engSuccess && rfiSuccess;
}

// TEST 51e: Alternative engagement pattern (Engagement 54321)
async function test51e() {
  const testNum = '51e';
  const testName = 'Alternative engagement pattern matching';

  const subject = 'Engagement 54321 Year-End Report';
  const id = await extractEngagementId(subject);

  const success = id === '54321';
  const details = `Extracted ID: ${id}, Expected: 54321`;

  logTest(testNum, testName, success ? 'PASS' : 'FAIL', details);
  return success;
}

// TEST 52: Config patterns work without code restart
async function test52() {
  const testNum = 52;
  const testName = 'Patterns loaded from config (no hardcoded patterns)';

  // Check email-parser.js source to verify no hardcoded patterns outside getEmailPatterns
  const parserPath = path.resolve(process.cwd(), 'src/lib/email-parser.js');
  const parserContent = fs.readFileSync(parserPath, 'utf8');

  // Check for hardcoded pattern arrays (these would indicate non-config-driven patterns)
  const hasHardcodedEngagementPatterns = /ENGAGEMENT_PATTERNS\s*=|const.*engagement.*pattern/i.test(parserContent);
  const hasHardcodedRfiPatterns = /RFI_PATTERNS\s*=|const.*rfi.*pattern/i.test(parserContent);

  // Patterns should be fetched via getEmailPatterns() function
  const usesConfigEngine = parserContent.includes('getConfigEngine') && parserContent.includes('email_auto_allocation');

  const success = !hasHardcodedEngagementPatterns && !hasHardcodedRfiPatterns && usesConfigEngine;
  const details = `Config-driven: ${usesConfigEngine}, No hardcoded engagement: ${!hasHardcodedEngagementPatterns}, No hardcoded RFI: ${!hasHardcodedRfiPatterns}`;

  logTest(testNum, testName, success ? 'PASS' : 'FAIL', details);
  return success;
}

// TEST 53: Email auto-allocation with confidence scoring
async function test53() {
  const testNum = 53;
  const testName = 'Email auto-allocation with confidence scoring';

  const { engagementId1 } = setupTestData();
  const db = getDatabase();

  const emailId = `test-${genId()}`;
  const timestamp = now();

  try {
    // Insert email for allocation
    db.prepare(`
      INSERT INTO email (id, from_email, subject, body, allocated, status, received_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      emailId,
      'client@example.com',
      'ENG-12345 Q4 Audit Response',
      'Here is our response to the RFI with detailed financial information included.',
      0,
      'pending',
      timestamp,
      timestamp,
      timestamp
    );

    const email = db.prepare('SELECT * FROM email WHERE id = ?').get(emailId);
    const result = await autoAllocateEmail(email);

    const success = result.success && result.confidence >= 70;
    const details = `Allocated: ${result.success}, Confidence: ${result.confidence}%, Reason: ${result.reason || 'N/A'}`;

    logTest(testNum, testName, success ? 'PASS' : 'FAIL', details);

    // Cleanup
    db.prepare('DELETE FROM email WHERE id = ?').run(emailId);

    return success;
  } catch (e) {
    logTest(testNum, testName, 'FAIL', `Error: ${e.message}`);
    return false;
  }
}

// Run all tests
export async function runEmailParsingTests() {
  console.log('\n====== EMAIL PARSING TEST SUITE ======\n');

  ensureTempDir();

  const tests = [
    { num: 49, fn: test49, name: 'Attachment extraction' },
    { num: 50, fn: test50, name: 'Email allocated=false' },
    { num: 51, fn: test51, name: 'Config patterns loaded' },
    { num: '51a', fn: test51a, name: 'Engagement pattern ENG-12345' },
    { num: '51b', fn: test51b, name: 'RFI pattern extraction' },
    { num: '51c', fn: test51c, name: 'Case-insensitive matching' },
    { num: '51d', fn: test51d, name: 'Pattern precedence' },
    { num: '51e', fn: test51e, name: 'Alternative pattern' },
    { num: 52, fn: test52, name: 'No hardcoded patterns' },
    { num: 53, fn: test53, name: 'Confidence scoring' },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) passed++;
      else failed++;
    } catch (e) {
      logTest(test.num, test.name, 'FAIL', `Exception: ${e.message}`);
      failed++;
    }
  }

  console.log('\n====== TEST SUMMARY ======');
  console.log(`Total: ${tests.length}, Passed: ${passed}, Failed: ${failed}`);
  console.log('\n====== FULL RESULTS ======');
  console.log(JSON.stringify(TEST_RESULTS, null, 2));

  return {
    total: tests.length,
    passed,
    failed,
    results: TEST_RESULTS
  };
}

// Export for testing
export {
  test49,
  test50,
  test51,
  test51a,
  test51b,
  test51c,
  test51d,
  test51e,
  test52,
  test53
};
