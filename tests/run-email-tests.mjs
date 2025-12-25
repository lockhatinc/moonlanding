#!/usr/bin/env node

/**
 * Email Parsing Test Runner
 * Run tests for config-driven pattern matching and email allocation
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Update module path resolution
process.env.NODE_PATH = path.join(projectRoot, 'src');

// Simple test results tracking
const TEST_RESULTS = [];
let testsPassed = 0;
let testsFailed = 0;

// Helper to add paths for module resolution
function resolveModule(modulePath) {
  // Try to resolve relative to src directory
  const srcPath = path.join(projectRoot, 'src', modulePath.replace('@/', ''));
  if (fs.existsSync(srcPath + '.js')) {
    return srcPath + '.js';
  }
  return modulePath;
}

// Test logger
function logTest(testNum, name, status, details) {
  const result = {
    test: testNum,
    name,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  TEST_RESULTS.push(result);

  const statusSymbol = status === 'PASS' ? '✓' : '✗';
  const padding = String(testNum).length === 1 ? ' ' : '';
  console.log(`  Test #${testNum}${padding}: ${name.padEnd(50)} | ${statusSymbol} ${status} | ${details}`);

  if (status === 'PASS') testsPassed++;
  else testsFailed++;
}

// Test 1: Check config file exists and has automation.schedules
function test_configExists() {
  const configPath = path.join(projectRoot, 'src/config/master-config.yml');
  const exists = fs.existsSync(configPath);

  if (!exists) {
    logTest(0, 'master-config.yml exists', 'FAIL', 'Config file not found');
    return false;
  }

  const content = fs.readFileSync(configPath, 'utf8');
  const hasAutomation = content.includes('automation:');
  const hasSchedules = content.includes('schedules:');

  logTest(0, 'master-config.yml structure', hasAutomation && hasSchedules ? 'PASS' : 'FAIL',
    `Has automation: ${hasAutomation}, Has schedules: ${hasSchedules}`);

  return hasAutomation && hasSchedules;
}

// Test 2: Check email_auto_allocation schedule exists
function test_emailAutoAllocationSchedule() {
  const configPath = path.join(projectRoot, 'src/config/master-config.yml');
  const content = fs.readFileSync(configPath, 'utf8');

  const hasEmailAutoAllocation = content.includes('email_auto_allocation');
  const hasPatterns = content.includes('patterns:');

  logTest(1, 'email_auto_allocation schedule exists', hasEmailAutoAllocation && hasPatterns ? 'PASS' : 'FAIL',
    `Has schedule: ${hasEmailAutoAllocation}, Has patterns: ${hasPatterns}`);

  return hasEmailAutoAllocation && hasPatterns;
}

// Test 3: Check engagement patterns in config
function test_engagementPatterns() {
  const configPath = path.join(projectRoot, 'src/config/master-config.yml');
  const content = fs.readFileSync(configPath, 'utf8');

  // Find the engagement patterns section (YAML format with dashes)
  const match = content.match(/patterns:\s+engagement:\s+([\s\S]*?)rfi:/);
  if (!match) {
    logTest(2, 'Engagement patterns configured (5+)', 'FAIL', 'Could not find engagement patterns');
    return false;
  }

  const patternsText = match[1];
  // Match YAML list items (lines starting with -)
  const patterns = patternsText.match(/^\s*-\s+(.+)$/gm) || [];
  const count = patterns.length;

  logTest(2, 'Engagement patterns configured (5+)', count >= 5 ? 'PASS' : 'FAIL',
    `Found ${count} patterns: ${patterns.slice(0, 3).map(p => p.trim().substring(0, 30)).join(', ')}...`);

  return count >= 5;
}

// Test 4: Check RFI patterns in config
function test_rfiPatterns() {
  const configPath = path.join(projectRoot, 'src/config/master-config.yml');
  const content = fs.readFileSync(configPath, 'utf8');

  // Find the RFI patterns section (YAML format with dashes)
  const match = content.match(/rfi:\s+([\s\S]*?)(?=^[a-z_]+:|notifications:)/m);
  if (!match) {
    logTest(3, 'RFI patterns configured (4+)', 'FAIL', 'Could not find RFI patterns');
    return false;
  }

  const patternsText = match[1];
  // Match YAML list items (lines starting with -)
  const patterns = patternsText.match(/^\s*-\s+(.+)$/gm) || [];
  const count = patterns.length;

  logTest(3, 'RFI patterns configured (4+)', count >= 4 ? 'PASS' : 'FAIL',
    `Found ${count} patterns: ${patterns.slice(0, 3).map(p => p.trim().substring(0, 30)).join(', ')}...`);

  return count >= 4;
}

// Test 5: Check email-parser.js uses config patterns
function test_emailParserUsesConfig() {
  const parserPath = path.join(projectRoot, 'src/lib/email-parser.js');
  const content = fs.readFileSync(parserPath, 'utf8');

  const usesConfigEngine = content.includes('getConfigEngine');
  const usesEmailPatterns = content.includes('getEmailPatterns');
  const hasAutoAllocationRef = content.includes('email_auto_allocation');

  const allChecks = usesConfigEngine && usesEmailPatterns;

  logTest(4, 'email-parser.js loads patterns from config', allChecks ? 'PASS' : 'FAIL',
    `Uses ConfigEngine: ${usesConfigEngine}, Has getEmailPatterns: ${usesEmailPatterns}, Refs schedule: ${hasAutoAllocationRef}`);

  return allChecks;
}

// Test 6: Check no hardcoded patterns
function test_noHardcodedPatterns() {
  const parserPath = path.join(projectRoot, 'src/lib/email-parser.js');
  const content = fs.readFileSync(parserPath, 'utf8');

  // Check for hardcoded pattern arrays outside of defaults
  const lines = content.split('\n');
  let hasHardcodedOutsideDefaults = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for hardcoded patterns outside the catch block (fallback defaults)
    if (line.includes('ENGAGEMENT_PATTERNS') || line.includes('RFI_PATTERNS')) {
      // Check if we're inside a catch block (fallback)
      let inCatch = false;
      for (let j = Math.max(0, i - 10); j < i; j++) {
        if (lines[j].includes('catch')) inCatch = true;
      }
      if (!inCatch) {
        hasHardcodedOutsideDefaults = true;
      }
    }
  }

  const success = !hasHardcodedOutsideDefaults;
  logTest(5, 'No hardcoded patterns outside defaults', success ? 'PASS' : 'FAIL',
    `Hardcoded patterns found: ${hasHardcodedOutsideDefaults}`);

  return success;
}

// Test 7: Check temp_email_attachments directory support
function test_tempAttachmentsDir() {
  const tempDir = path.join(projectRoot, 'temp_email_attachments');
  const dirExists = fs.existsSync(tempDir);

  // Try to create if doesn't exist
  if (!dirExists) {
    try {
      fs.mkdirSync(tempDir, { recursive: true });
      logTest(6, 'temp_email_attachments directory', 'PASS', 'Directory created successfully');
      return true;
    } catch (e) {
      logTest(6, 'temp_email_attachments directory', 'FAIL', `Failed to create: ${e.message}`);
      return false;
    }
  }

  logTest(6, 'temp_email_attachments directory', 'PASS', 'Directory exists');
  return true;
}

// Test 8: Check jobs.js uses autoAllocateEmail
function test_jobsUseAutoAllocate() {
  const jobsPath = path.join(projectRoot, 'src/config/jobs.js');
  const content = fs.readFileSync(jobsPath, 'utf8');

  const importsAutoAllocate = content.includes('autoAllocateEmail');
  const hasHourlyEmailAllocation = content.includes('hourly_email_allocation');
  const callsAutoAllocate = content.includes('await autoAllocateEmail');

  const success = importsAutoAllocate && hasHourlyEmailAllocation && callsAutoAllocate;

  logTest(7, 'jobs.js integrates email allocation', success ? 'PASS' : 'FAIL',
    `Imports: ${importsAutoAllocate}, Has schedule: ${hasHourlyEmailAllocation}, Calls function: ${callsAutoAllocate}`);

  return success;
}

// Test 9: Check email entity has allocated field
function test_emailEntityHasAllocated() {
  const configPath = path.join(projectRoot, 'src/config/master-config.yml');
  const content = fs.readFileSync(configPath, 'utf8');

  // Find email entity definition
  const emailMatch = content.match(/email:\s+label: Email([\s\S]*?)(?=\n  [a-z_]+:|$)/);
  if (!emailMatch) {
    logTest(8, 'email entity has allocated field', 'FAIL', 'Could not find email entity definition');
    return false;
  }

  const emailDef = emailMatch[1];
  const hasAllocated = emailDef.includes('allocated:');
  const hasBoolType = emailDef.includes('type: bool');

  logTest(8, 'email entity has allocated field', hasAllocated && hasBoolType ? 'PASS' : 'FAIL',
    `Has allocated field: ${hasAllocated}, Type bool: ${hasBoolType}`);

  return hasAllocated && hasBoolType;
}

// Test 10: Check status field in email entity
function test_emailEntityHasStatus() {
  const configPath = path.join(projectRoot, 'src/config/master-config.yml');
  const content = fs.readFileSync(configPath, 'utf8');

  // Find email entity definition
  const emailMatch = content.match(/email:\s+label: Email([\s\S]*?)(?=\n  [a-z_]+:|$)/);
  if (!emailMatch) {
    logTest(9, 'email entity has status field', 'FAIL', 'Could not find email entity definition');
    return false;
  }

  const emailDef = emailMatch[1];
  const hasStatus = emailDef.includes('status:');
  // Status can be enum or text type
  const hasType = emailDef.includes('type:') && (emailDef.includes('enum') || emailDef.includes('text'));

  logTest(9, 'email entity has status field', hasStatus && hasType ? 'PASS' : 'FAIL',
    `Has status field: ${hasStatus}, Has type definition: ${hasType}`);

  return hasStatus && hasType;
}

// Test 11: Pattern regex validation
function test_patternRegexValid() {
  const configPath = path.join(projectRoot, 'src/config/master-config.yml');
  const content = fs.readFileSync(configPath, 'utf8');

  // Extract all patterns (YAML format)
  const engagementMatch = content.match(/patterns:\s+engagement:\s+([\s\S]*?)rfi:/);
  const rfiMatch = content.match(/rfi:\s+([\s\S]*?)(?=\n  [a-z_]+:|notifications:)/m);

  if (!engagementMatch || !rfiMatch) {
    logTest(10, 'Pattern regexes are valid', 'FAIL', 'Could not extract patterns');
    return false;
  }

  let invalidCount = 0;
  // Extract lines that start with - (YAML list items)
  const engagementPatterns = engagementMatch[1].match(/^\s*-\s+(.+)$/gm) || [];
  const rfiPatterns = rfiMatch[1].match(/^\s*-\s+(.+)$/gm) || [];
  const allPatterns = [...engagementPatterns, ...rfiPatterns];

  for (const p of allPatterns) {
    const regex = p.trim().substring(2).trim(); // Remove the "- " prefix
    try {
      new RegExp(regex, 'i');
    } catch (e) {
      invalidCount++;
      console.warn(`Invalid regex: ${regex}`);
    }
  }

  const success = invalidCount === 0 && allPatterns.length > 0;
  logTest(10, 'Pattern regexes are valid', success ? 'PASS' : 'FAIL',
    `Total patterns: ${allPatterns.length}, Invalid: ${invalidCount}`);

  return success;
}

// Main test runner
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         EMAIL PARSING CONFIGURATION TEST SUITE                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const tests = [
    { fn: test_configExists, name: 'Config exists' },
    { fn: test_emailAutoAllocationSchedule, name: 'Email schedule' },
    { fn: test_engagementPatterns, name: 'Engagement patterns' },
    { fn: test_rfiPatterns, name: 'RFI patterns' },
    { fn: test_emailParserUsesConfig, name: 'Parser uses config' },
    { fn: test_noHardcodedPatterns, name: 'No hardcoded patterns' },
    { fn: test_tempAttachmentsDir, name: 'Temp directory' },
    { fn: test_jobsUseAutoAllocate, name: 'Jobs integration' },
    { fn: test_emailEntityHasAllocated, name: 'Email allocated field' },
    { fn: test_emailEntityHasStatus, name: 'Email status field' },
    { fn: test_patternRegexValid, name: 'Pattern validation' },
  ];

  for (const test of tests) {
    try {
      test.fn();
    } catch (e) {
      logTest(-1, test.name, 'FAIL', `Exception: ${e.message}`);
    }
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                              ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Total:  ${String(tests.length).padEnd(49)} ║`);
  console.log(`║  Passed: ${String(testsPassed).padEnd(49)} ║`);
  console.log(`║  Failed: ${String(testsFailed).padEnd(49)} ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (testsFailed === 0) {
    console.log('✓ All configuration tests passed!\n');
    return 0;
  } else {
    console.log(`✗ ${testsFailed} test(s) failed\n`);
    return 1;
  }
}

// Run tests
runTests().then(exitCode => {
  process.exit(exitCode);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
