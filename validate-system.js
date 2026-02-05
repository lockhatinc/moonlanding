#!/usr/bin/env node

/**
 * SYSTEM VALIDATION SCRIPT
 *
 * Comprehensive system check without external dependencies (except node built-ins)
 * Validates server, database, and login flow
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3004;
const HOST = 'localhost';
const BASE_URL = `http://${HOST}:${PORT}`;

// Colors for output
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

// Logging functions
const log = {
  title: (msg) => console.log(`\n${c.cyan}${'='.repeat(80)}\n${msg}\n${'='.repeat(80)}${c.reset}`),
  header: (msg) => console.log(`\n${c.blue}${msg}${c.reset}`),
  success: (msg) => console.log(`${c.green}✓ ${msg}${c.reset}`),
  error: (msg) => console.log(`${c.red}✗ ${msg}${c.reset}`),
  warn: (msg) => console.log(`${c.yellow}⚠ ${msg}${c.reset}`),
  info: (msg) => console.log(`  ℹ ${msg}`),
  result: (msg) => console.log(`  ${msg}`),
};

// HTTP request helper
function httpGet(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${HOST}:${PORT}${pathname}`, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Check if server is running
async function checkServerRunning() {
  log.header('1. Server Connectivity');

  try {
    const result = await httpGet('/login');
    if (result.status === 200) {
      log.success('Server running on localhost:3004');
      log.result(`HTTP Status: ${result.status}`);
      log.result(`Content-Type: ${result.headers['content-type']}`);
      log.result(`Content-Length: ${result.headers['content-length'] || 'NOT SET'}`);
      return true;
    }
  } catch (err) {
    log.error(`Server not responding: ${err.message}`);
    log.info('Start server with: npm run dev');
    return false;
  }
}

// Check login page
async function checkLoginPage() {
  log.header('2. Login Page');

  try {
    const result = await httpGet('/login');

    if (!result.body || result.body.length === 0) {
      log.error('Response body is empty');
      return false;
    }

    log.success(`Login page loaded (${result.body.length} bytes)`);

    const checks = [
      ['<!DOCTYPE', 'DOCTYPE declaration'],
      ['<form', 'form element'],
      ['loginForm', 'form id'],
      ['type="email"', 'email input'],
      ['type="password"', 'password input'],
      ['type="submit"', 'submit button'],
    ];

    let allFound = true;
    for (const [pattern, name] of checks) {
      if (result.body.includes(pattern)) {
        log.result(`✓ Found: ${name}`);
      } else {
        log.warn(`Missing: ${name}`);
        allFound = false;
      }
    }

    return allFound;
  } catch (err) {
    log.error(`Login page check failed: ${err.message}`);
    return false;
  }
}

// Check database
function checkDatabase() {
  log.header('3. Database');

  const dbPath = path.join(__dirname, 'data/app.db');

  if (!fs.existsSync(dbPath)) {
    log.warn(`Database not found at ${dbPath}`);
    log.info('Database will be created on first server run');
    return null;
  }

  log.success(`Database found: ${dbPath}`);

  const stats = fs.statSync(dbPath);
  log.result(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
  log.result(`Last modified: ${stats.mtime.toISOString()}`);

  return true;
}

// Check configuration files
function checkConfiguration() {
  log.header('4. Configuration');

  const checks = [
    { path: 'server.js', name: 'Server' },
    { path: 'src/ui/standalone-login.js', name: 'Login page' },
    { path: 'src/app/api/auth/login/route.js', name: 'Auth API' },
    { path: 'package.json', name: 'Dependencies' },
  ];

  let allFound = true;
  for (const check of checks) {
    const fullPath = path.join(__dirname, check.path);
    if (fs.existsSync(fullPath)) {
      log.result(`✓ ${check.name}: ${check.path}`);
    } else {
      log.warn(`Missing: ${check.path}`);
      allFound = false;
    }
  }

  return allFound;
}

// Check server code for critical requirements
function checkServerCode() {
  log.header('5. Server Code Verification');

  try {
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf-8');

    const checks = [
      ['server.listen(PORT, \'0.0.0.0\')', 'Binds to 0.0.0.0 for external access'],
      ['Content-Length', 'Sets Content-Length header'],
      ['res.setHeader(\'Cache-Control\'', 'Sets Cache-Control header'],
      ['renderStandaloneLogin', 'Uses standalone login renderer'],
      ['res.setHeader(\'Content-Type\', \'text/html\'', 'Sets HTML content type'],
    ];

    let allFound = true;
    for (const [pattern, desc] of checks) {
      if (serverJs.includes(pattern)) {
        log.result(`✓ ${desc}`);
      } else {
        log.warn(`Missing: ${desc}`);
        allFound = false;
      }
    }

    return allFound;
  } catch (err) {
    log.error(`Could not read server.js: ${err.message}`);
    return false;
  }
}

// Check authentication code
function checkAuthCode() {
  log.header('6. Authentication Code');

  try {
    const authRoute = fs.readFileSync(path.join(__dirname, 'src/app/api/auth/login/route.js'), 'utf-8');

    const checks = [
      ['getBy(\'user\', \'email\'', 'Looks up user by email'],
      ['verifyPassword', 'Verifies password'],
      ['lucia.createSession', 'Creates session with Lucia'],
      ['Set-Cookie', 'Sets session cookie'],
      ['HttpOnly', 'HttpOnly flag for security'],
      ['SameSite=Lax', 'SameSite protection'],
    ];

    let allFound = true;
    for (const [pattern, desc] of checks) {
      if (authRoute.includes(pattern)) {
        log.result(`✓ ${desc}`);
      } else {
        log.warn(`Missing: ${desc}`);
        allFound = false;
      }
    }

    return allFound;
  } catch (err) {
    log.error(`Could not read auth route: ${err.message}`);
    return false;
  }
}

// Check dependencies
function checkDependencies() {
  log.header('7. Dependencies');

  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));

    const required = ['lucia', 'bcrypt', 'better-sqlite3', 'tsx'];

    let allFound = true;
    for (const dep of required) {
      if (pkg.dependencies[dep]) {
        log.result(`✓ ${dep}: ${pkg.dependencies[dep]}`);
      } else {
        log.warn(`Missing: ${dep}`);
        allFound = false;
      }
    }

    return allFound;
  } catch (err) {
    log.error(`Could not read package.json: ${err.message}`);
    return false;
  }
}

// Check environment
function checkEnvironment() {
  log.header('8. Environment');

  try {
    const nodeVersion = process.version;
    log.result(`Node.js: ${nodeVersion}`);

    const npmVersion = require('child_process').execSync('npm -v', { encoding: 'utf-8' }).trim();
    log.result(`npm: ${npmVersion}`);

    const platform = process.platform;
    log.result(`Platform: ${platform}`);

    log.success('Environment check passed');
    return true;
  } catch (err) {
    log.warn(`Could not check environment: ${err.message}`);
    return true; // Don't fail on this
  }
}

// Main execution
async function main() {
  log.title('MOONLANDING SYSTEM VALIDATION');

  const checks = [];

  // Run all checks
  try {
    checks.push({
      name: 'Server Running',
      result: await checkServerRunning(),
    });

    if (checks[0].result) {
      checks.push({
        name: 'Login Page',
        result: await checkLoginPage(),
      });
    }

    checks.push({
      name: 'Database',
      result: checkDatabase(),
    });

    checks.push({
      name: 'Configuration',
      result: checkConfiguration(),
    });

    checks.push({
      name: 'Server Code',
      result: checkServerCode(),
    });

    checks.push({
      name: 'Authentication Code',
      result: checkAuthCode(),
    });

    checks.push({
      name: 'Dependencies',
      result: checkDependencies(),
    });

    checks.push({
      name: 'Environment',
      result: checkEnvironment(),
    });

    // Summary
    log.title('VALIDATION SUMMARY');

    const passed = checks.filter((c) => c.result === true).length;
    const failed = checks.filter((c) => c.result === false).length;
    const skipped = checks.filter((c) => c.result === null).length;

    console.log(`\n${c.blue}Results:${c.reset}`);
    console.log(`  ${c.green}✓ Passed:${c.reset} ${passed}`);
    console.log(`  ${c.red}✗ Failed:${c.reset} ${failed}`);
    console.log(`  ${c.yellow}⊘ Skipped:${c.reset} ${skipped}`);

    log.info(`Total: ${checks.length} checks`);

    if (failed === 0) {
      log.success('All critical checks passed!');
      console.log(`\n${c.cyan}Next step: Run comprehensive test${c.reset}`);
      console.log(`  node test-login-workflow.js\n`);
      process.exit(0);
    } else {
      log.error(`${failed} check(s) failed - review output above`);
      process.exit(1);
    }
  } catch (err) {
    log.error(`Validation failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
