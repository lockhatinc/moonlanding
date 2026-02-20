#!/usr/bin/env node

/**
 * Verify OAuth Configuration
 * Usage: node scripts/verify-oauth.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function verifyOAuth() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('✗ .env file not found');
    return false;
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  
  let clientId = '';
  let clientSecret = '';
  let redirectUri = '';
  
  for (const line of lines) {
    if (line.startsWith('GOOGLE_CLIENT_ID=')) {
      clientId = line.split('=')[1].trim();
    } else if (line.startsWith('GOOGLE_CLIENT_SECRET=')) {
      clientSecret = line.split('=')[1].trim();
    } else if (line.startsWith('GOOGLE_REDIRECT_URI=')) {
      redirectUri = line.split('=')[1].trim();
    }
  }
  
  console.log('OAuth Configuration Status:');
  console.log('═'.repeat(50));
  
  if (clientId && clientId !== '') {
    console.log('✓ GOOGLE_CLIENT_ID configured');
  } else {
    console.log('✗ GOOGLE_CLIENT_ID missing or empty');
  }
  
  if (clientSecret && clientSecret !== '') {
    console.log('✓ GOOGLE_CLIENT_SECRET configured');
  } else {
    console.log('✗ GOOGLE_CLIENT_SECRET missing or empty');
  }
  
  if (redirectUri === 'http://localhost:3000/api/auth/google/callback') {
    console.log('✓ GOOGLE_REDIRECT_URI correct: ' + redirectUri);
  } else {
    console.log('✗ GOOGLE_REDIRECT_URI incorrect: ' + redirectUri);
  }
  
  // Check service account
  const serviceAccountPath = path.join(__dirname, '..', 'config', 'service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
      console.log('✓ Service account found: ' + sa.client_email);
    } catch (e) {
      console.log('✗ Service account file invalid');
    }
  } else {
    console.log('✗ Service account file not found');
  }
  
  console.log('═'.repeat(50));
  
  const allConfigured = clientId && clientSecret;
  if (allConfigured) {
    console.log('\n✓ All OAuth credentials configured!');
    console.log('\nYou can now start the server:');
    console.log('  npm run dev');
  } else {
    console.log('\n✗ OAuth credentials incomplete. Please configure:');
    console.log('  1. Go to: https://console.cloud.google.com/apis/credentials?project=moonlanding-platform');
    console.log('  2. Create OAuth 2.0 Web Client credentials');
    console.log('  3. Run: node scripts/setup-oauth.js --client-id <ID> --client-secret <SECRET>');
  }
  
  return allConfigured;
}

verifyOAuth();
