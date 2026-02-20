#!/usr/bin/env node

/**
 * Setup OAuth Credentials
 * Usage: node scripts/setup-oauth.js --client-id <ID> --client-secret <SECRET>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    result[key] = value;
  }
  
  return result;
}

function updateEnv(clientId, clientSecret) {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found');
    process.exit(1);
  }
  
  let content = fs.readFileSync(envPath, 'utf-8');
  
  // Update or add GOOGLE_CLIENT_ID
  if (content.includes('GOOGLE_CLIENT_ID=')) {
    content = content.replace(/GOOGLE_CLIENT_ID=.*/, `GOOGLE_CLIENT_ID=${clientId}`);
  } else {
    content = content.replace(/^GOOGLE_REDIRECT_URI/m, `GOOGLE_CLIENT_ID=${clientId}\nGOOGLE_REDIRECT_URI`);
  }
  
  // Update or add GOOGLE_CLIENT_SECRET
  if (content.includes('GOOGLE_CLIENT_SECRET=')) {
    content = content.replace(/GOOGLE_CLIENT_SECRET=.*/, `GOOGLE_CLIENT_SECRET=${clientSecret}`);
  } else {
    content = content.replace(/^GOOGLE_CLIENT_ID/m, `GOOGLE_CLIENT_ID=${clientId}\nGOOGLE_CLIENT_SECRET=${clientSecret}`);
  }
  
  fs.writeFileSync(envPath, content);
  console.log('✓ .env file updated with OAuth credentials');
  console.log('  GOOGLE_CLIENT_ID: ' + clientId.substring(0, 20) + '...');
  console.log('  GOOGLE_CLIENT_SECRET: ' + clientSecret.substring(0, 20) + '...');
}

const args = parseArgs();

if (!args['client-id'] || !args['client-secret']) {
  console.error('Usage: node scripts/setup-oauth.js --client-id <ID> --client-secret <SECRET>');
  process.exit(1);
}

try {
  updateEnv(args['client-id'], args['client-secret']);
  console.log('\n✓ OAuth credentials configured successfully!');
  console.log('\nNext steps:');
  console.log('  1. Restart the server: npm run dev');
  console.log('  2. Visit http://localhost:3000');
  console.log('  3. Click "Sign in with Google"');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
