// Shared Google API authentication using Domain-Wide Delegation
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Service account credentials path
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
  path.join(process.cwd(), 'config', 'service-account.json');

// Cached credentials
let credentials = null;

/**
 * Get service account credentials
 * @returns {Object|null} Credentials or null if not found
 */
export function getCredentials() {
  if (credentials) return credentials;
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.warn('Service account file not found:', SERVICE_ACCOUNT_PATH);
    return null;
  }
  credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  return credentials;
}

/**
 * Get authenticated Google client
 * @param {string[]} scopes - OAuth scopes
 * @param {string} userEmail - Email to impersonate (optional)
 * @returns {Object|null} Auth client or null if unavailable
 */
export async function getAuthClient(scopes, userEmail = null) {
  const creds = getCredentials();
  if (!creds) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes,
    clientOptions: userEmail ? { subject: userEmail } : undefined,
  });

  return auth.getClient();
}

/**
 * Get Drive client with authentication
 * @param {string} userEmail - Email to impersonate (optional)
 */
export async function getDriveClient(userEmail = null) {
  const client = await getAuthClient([
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
  ], userEmail);
  if (!client) return null;
  return google.drive({ version: 'v3', auth: client });
}

/**
 * Get Gmail client with authentication
 * @param {string} userEmail - Email to impersonate (sender)
 */
export async function getGmailClient(userEmail) {
  if (!userEmail) {
    console.warn('No sender email configured');
    return null;
  }
  const client = await getAuthClient([
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
  ], userEmail);
  if (!client) return null;
  return google.gmail({ version: 'v1', auth: client });
}

/**
 * Get Docs client with authentication (for template processing)
 * @param {string} userEmail - Email to impersonate (optional)
 */
export async function getDocsClient(userEmail = null) {
  const client = await getAuthClient([
    'https://www.googleapis.com/auth/documents',
  ], userEmail);
  if (!client) return null;
  return google.docs({ version: 'v1', auth: client });
}
