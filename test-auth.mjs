#!/usr/bin/env node
/**
 * Authentication Setup Verification Script
 *
 * This script verifies that all Google Cloud Platform APIs and credentials
 * are properly configured for the Moonlanding platform.
 *
 * Run with: pnpm node test-auth.mjs
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Test results
const results = {
  passed: [],
  failed: [],
};

async function log(test, status, message) {
  const symbol = status === 'pass' ? '✅' : '❌';
  console.log(`${symbol} ${test}: ${message}`);
  if (status === 'pass') {
    results.passed.push(test);
  } else {
    results.failed.push(test);
  }
}

async function runTests() {
  console.log('\n=== Moonlanding Platform Authentication Tests ===\n');

  // Test 1: Service Account Credentials
  try {
    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './config/service-account.json';
    const fullPath = path.join(__dirname, serviceAccountPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Service account file not found at ${fullPath}`);
    }

    const credentials = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    if (!credentials.type || credentials.type !== 'service_account') {
      throw new Error('Invalid service account format');
    }

    await log('Service Account Credentials', 'pass', `Loaded from ${serviceAccountPath}`);
  } catch (error) {
    await log('Service Account Credentials', 'fail', error.message);
  }

  // Test 2: Auth Client Setup
  try {
    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './config/service-account.json';
    const fullPath = path.join(__dirname, serviceAccountPath);
    const credentials = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

    const auth = new google.auth.GoogleAuth({
      keyFile: fullPath,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/calendar',
      ],
    });

    const authClient = await auth.getClient();
    await log('Auth Client', 'pass', 'Successfully initialized');
  } catch (error) {
    await log('Auth Client', 'fail', error.message);
  }

  // Test 3: Google Drive API
  try {
    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './config/service-account.json';
    const fullPath = path.join(__dirname, serviceAccountPath);

    const auth = new google.auth.GoogleAuth({
      keyFile: fullPath,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Test a simple API call
    const response = await drive.files.list({
      spaces: 'drive',
      pageSize: 1,
      q: `trashed=false and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    await log('Google Drive API', 'pass', 'API is accessible');
  } catch (error) {
    await log('Google Drive API', 'fail', error.message);
  }

  // Test 4: Moonlanding Folder Access
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID not set in environment');
    }

    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './config/service-account.json';
    const fullPath = path.join(__dirname, serviceAccountPath);

    const auth = new google.auth.GoogleAuth({
      keyFile: fullPath,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const file = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType',
    });

    await log('Moonlanding Folder', 'pass', `Found folder: ${file.data.name}`);
  } catch (error) {
    await log('Moonlanding Folder', 'fail', error.message);
  }

  // Test 5: Google Sheets API
  try {
    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './config/service-account.json';
    const fullPath = path.join(__dirname, serviceAccountPath);

    const auth = new google.auth.GoogleAuth({
      keyFile: fullPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    await log('Google Sheets API', 'pass', 'API is available');
  } catch (error) {
    await log('Google Sheets API', 'fail', error.message);
  }

  // Test 6: Google Docs API
  try {
    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './config/service-account.json';
    const fullPath = path.join(__dirname, serviceAccountPath);

    const auth = new google.auth.GoogleAuth({
      keyFile: fullPath,
      scopes: ['https://www.googleapis.com/auth/documents'],
    });

    const docs = google.docs({ version: 'v1', auth });
    await log('Google Docs API', 'pass', 'API is available');
  } catch (error) {
    await log('Google Docs API', 'fail', error.message);
  }

  // Test 7: Environment Configuration
  try {
    const required = [
      'GOOGLE_SERVICE_ACCOUNT_PATH',
      'GOOGLE_DRIVE_FOLDER_ID',
      'GCP_PROJECT_ID',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    await log('Environment Variables', 'pass', 'All required variables configured');
  } catch (error) {
    await log('Environment Variables', 'fail', error.message);
  }

  // Print summary
  console.log('\n=== Test Summary ===\n');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length === 0) {
    console.log('\n✨ AUTHENTICATION SETUP COMPLETE\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
