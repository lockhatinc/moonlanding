import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const configPath = path.resolve(process.cwd(), 'src/config/master-config.yml');
const configContent = fs.readFileSync(configPath, 'utf-8');
const masterConfig = yaml.load(configContent);

console.log('=== GOOGLE WORKSPACE USER SYNC & DEFAULT ROLE ASSIGNMENT TESTS ===\n');

let passed = 0;
let failed = 0;
const testResults = [];

const test = (name, fn) => {
  try {
    fn();
    console.log('✓', name);
    passed++;
    testResults.push({ name, status: 'PASS' });
  } catch (e) {
    console.log('✗', name, '-', e.message);
    failed++;
    testResults.push({ name, status: 'FAIL', error: e.message });
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message || 'Assertion failed');
};

const assertEquals = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
};

const assertExists = (obj, message) => {
  if (!obj) throw new Error(message || 'Object does not exist');
};

const assertContains = (arr, value, message) => {
  if (!arr || !arr.includes(value)) {
    throw new Error(message || `Array does not contain ${value}`);
  }
};

const assertTrue = (value, message) => {
  if (value !== true) throw new Error(message || 'Expected true');
};

const assertFalse = (value, message) => {
  if (value !== false) throw new Error(message || 'Expected false');
};

// TEST 76: Daily user sync from Google Workspace (2 AM)
console.log('\n--- TEST 76: Daily user sync from Google Workspace (2 AM) ---\n');

test('User entity has has_google_sync enabled', () => {
  const userEntity = masterConfig.entities?.user;
  assertExists(userEntity, 'User entity not found');
  assertTrue(userEntity?.has_google_sync, 'has_google_sync should be true');
  console.log('  [INFO] Google Workspace sync enabled for user entity');
});

test('User sync job exists in automation.schedules', () => {
  const schedules = masterConfig.automation?.schedules;
  assertExists(schedules, 'automation.schedules not found');
  const userSyncJob = schedules.find(s => s.name === 'user_sync');
  assertExists(userSyncJob, 'user_sync job not found in automation.schedules');
  console.log('  [INFO] User sync job found:', userSyncJob.name);
});

test('User sync job has cron schedule "0 2 * * *" (2 AM daily UTC)', () => {
  const schedules = masterConfig.automation?.schedules;
  const userSyncJob = schedules.find(s => s.name === 'user_sync');
  assertEquals(userSyncJob.trigger, '0 2 * * *', 'User sync cron should be "0 2 * * *"');
  console.log('  [INFO] Cron schedule verified: 0 2 * * * (2:00 AM UTC daily)');
});

test('User sync job is enabled', () => {
  const schedules = masterConfig.automation?.schedules;
  const userSyncJob = schedules.find(s => s.name === 'user_sync');
  assertEquals(userSyncJob.enabled, true, 'User sync job should be enabled');
  console.log('  [INFO] User sync job is enabled');
});

test('User sync job targets user entity', () => {
  const schedules = masterConfig.automation?.schedules;
  const userSyncJob = schedules.find(s => s.name === 'user_sync');
  assertEquals(userSyncJob.entity, 'user', 'User sync job should target user entity');
  console.log('  [INFO] Job targets user entity');
});

test('User sync job uses Google Workspace integration', () => {
  const schedules = masterConfig.automation?.schedules;
  const userSyncJob = schedules.find(s => s.name === 'user_sync');
  assertEquals(userSyncJob.integration, 'google_workspace', 'Job should use google_workspace integration');
  console.log('  [INFO] Integration set to google_workspace');
});

test('User sync job has action sync_users_from_google_workspace', () => {
  const schedules = masterConfig.automation?.schedules;
  const userSyncJob = schedules.find(s => s.name === 'user_sync');
  assertEquals(userSyncJob.action, 'sync_users_from_google_workspace', 'Action should be sync_users_from_google_workspace');
  console.log('  [INFO] Action is sync_users_from_google_workspace');
});

test('User sync job has rule filtering auditor users', () => {
  const schedules = masterConfig.automation?.schedules;
  const userSyncJob = schedules.find(s => s.name === 'user_sync');
  const rule = userSyncJob.rule;
  assert(rule && rule.includes('auditor'), 'Rule should filter for auditor type users');
  console.log('  [INFO] Rule filters for auditor type');
});

test('Google Workspace integration is configured in integrations', () => {
  const integration = masterConfig.integrations?.google_workspace;
  assertExists(integration, 'google_workspace integration not found');
  assertEquals(integration.enabled, true, 'Google Workspace integration should be enabled');
  console.log('  [INFO] Google Workspace integration enabled');
});

test('Google Workspace integration has correct scopes', () => {
  const integration = masterConfig.integrations?.google_workspace;
  const scopes = integration?.scopes;
  assertExists(scopes, 'Scopes not found');
  assert(scopes.includes('https://www.googleapis.com/auth/admin.directory.user.readonly'),
    'Should have admin.directory.user.readonly scope');
  console.log('  [INFO] Scopes include admin.directory.user.readonly');
});

test('Google Workspace integration has rate limits configured', () => {
  const integration = masterConfig.integrations?.google_workspace;
  const rateLimits = integration?.rate_limits;
  assertExists(rateLimits, 'Rate limits not found');
  assert(rateLimits.requests_per_minute, 'Should have requests_per_minute limit');
  assert(rateLimits.requests_per_day, 'Should have requests_per_day limit');
  assertEquals(rateLimits.requests_per_minute, 300, 'requests_per_minute should be 300');
  assertEquals(rateLimits.requests_per_day, 10000, 'requests_per_day should be 10000');
  console.log('  [INFO] Rate limits configured: 300 req/min, 10000 req/day');
});

test('Google Workspace integration has required env variables', () => {
  const integration = masterConfig.integrations?.google_workspace;
  const envVars = integration?.env_vars;
  assertExists(envVars, 'env_vars not found');
  assertContains(envVars, 'USER_SYNC_SCRIPT_URL', 'Should require USER_SYNC_SCRIPT_URL');
  assertContains(envVars, 'USER_SYNC_KEY', 'Should require USER_SYNC_KEY');
  console.log('  [INFO] Required env vars: USER_SYNC_SCRIPT_URL, USER_SYNC_KEY');
});

test('User sync feature is enabled globally', () => {
  const userSyncFeature = masterConfig.features?.user_sync;
  assertExists(userSyncFeature, 'user_sync feature not found');
  assertEquals(userSyncFeature.enabled, true, 'user_sync feature should be enabled');
  assertEquals(userSyncFeature.integration, 'google_workspace', 'Integration should be google_workspace');
  console.log('  [INFO] User sync feature enabled');
});

// TEST 77: New users default to Clerk role, removed users deleted from teams
console.log('\n--- TEST 77: New users default to Clerk role, removed users deleted from teams ---\n');

test('User role field has default value "clerk"', () => {
  const userEntity = masterConfig.entities?.user;
  const roleField = userEntity?.field_overrides?.role;
  assertExists(roleField, 'role field not found in user entity');
  assertEquals(roleField.default, 'clerk', 'Default role should be "clerk"');
  console.log('  [INFO] Default role is "clerk"');
});

test('User role field is required', () => {
  const userEntity = masterConfig.entities?.user;
  const roleField = userEntity?.field_overrides?.role;
  assertEquals(roleField.required, true, 'role field should be required');
  console.log('  [INFO] Role field is required');
});

test('User status field has default value "active"', () => {
  const userEntity = masterConfig.entities?.user;
  const statusField = userEntity?.field_overrides?.status;
  assertExists(statusField, 'status field not found in user entity');
  assertEquals(statusField.default, 'active', 'Default status should be "active"');
  console.log('  [INFO] Default status is "active"');
});

test('User email field is required and unique', () => {
  const userEntity = masterConfig.entities?.user;
  const emailField = userEntity?.field_overrides?.email;
  assertEquals(emailField.required, true, 'email should be required');
  assertEquals(emailField.unique, true, 'email should be unique');
  console.log('  [INFO] Email field is required and unique');
});

test('User name field is required', () => {
  const userEntity = masterConfig.entities?.user;
  const nameField = userEntity?.field_overrides?.name;
  assertEquals(nameField.required, true, 'name should be required');
  console.log('  [INFO] Name field is required');
});

test('User entity supports multiple roles', () => {
  const userEntity = masterConfig.entities?.user;
  const roles = userEntity?.roles;
  assertExists(roles, 'roles not found for user entity');
  assertContains(roles, 'partner', 'Should include partner role');
  assertContains(roles, 'manager', 'Should include manager role');
  assertContains(roles, 'clerk', 'Should include clerk role');
  console.log('  [INFO] User entity supports partner, manager, and clerk roles');
});

test('Clerk role is defined in roles configuration', () => {
  const clerkRole = masterConfig.roles?.clerk;
  assertExists(clerkRole, 'clerk role not found');
  assertEquals(clerkRole.label, 'Clerk', 'Clerk label should be "Clerk"');
  assertEquals(clerkRole.hierarchy, 2, 'Clerk hierarchy should be 2');
  assertEquals(clerkRole.type, 'auditor', 'Clerk type should be "auditor"');
  assertEquals(clerkRole.permissions_scope, 'assigned', 'Clerk permissions_scope should be "assigned"');
  console.log('  [INFO] Clerk role properly configured');
});

test('User status enum has active and inactive states', () => {
  const userStatus = masterConfig.status_enums?.user_status;
  assertExists(userStatus, 'user_status enum not found');
  assert(userStatus.active, 'Should have active status');
  assert(userStatus.inactive, 'Should have inactive status');
  assertEquals(userStatus.active.label, 'Active', 'Active status label should be "Active"');
  assertEquals(userStatus.inactive.label, 'Inactive', 'Inactive status label should be "Inactive"');
  console.log('  [INFO] User status enum includes active and inactive');
});

test('Team entity exists and is related to user', () => {
  const teamEntity = masterConfig.entities?.team;
  assertExists(teamEntity, 'team entity not found');
  const teamChildren = teamEntity?.children;
  assertContains(teamChildren, 'user', 'Team should have user as child');
  console.log('  [INFO] Team entity configured with user as child');
});

test('User entity has user_types for auditor classification', () => {
  const userEntity = masterConfig.entities?.user;
  const userTypes = userEntity?.user_types;
  assertExists(userTypes, 'user_types not found');
  assertContains(userTypes, 'auditor', 'Should include auditor user type');
  console.log('  [INFO] User entity supports auditor type');
});

// TEST SUMMARY
console.log('\n=== TEST SUMMARY ===\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}\n`);

if (failed === 0) {
  console.log('✓ All tests passed!\n');
  process.exit(0);
} else {
  console.log('✗ Some tests failed\n');
  console.log('Failed tests:');
  testResults.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
  process.exit(1);
}
