
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { GOOGLE_SCOPES } from '@/config/constants';

const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
  path.join(process.cwd(), 'config', 'service-account.json');

let credentials = null;

export function getCredentials() {
  if (credentials) return credentials;
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.warn('Service account file not found:', SERVICE_ACCOUNT_PATH);
    return null;
  }
  credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  return credentials;
}

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

export async function getDriveClient(userEmail = null) {
  const client = await getAuthClient(GOOGLE_SCOPES.drive, userEmail);
  if (!client) return null;
  return google.drive({ version: 'v3', auth: client });
}

export async function getGmailClient(userEmail) {
  if (!userEmail) {
    console.warn('No sender email configured');
    return null;
  }
  const client = await getAuthClient(GOOGLE_SCOPES.gmail, userEmail);
  if (!client) return null;
  return google.gmail({ version: 'v1', auth: client });
}

export async function getDocsClient(userEmail = null) {
  const client = await getAuthClient(GOOGLE_SCOPES.docs, userEmail);
  if (!client) return null;
  return google.docs({ version: 'v1', auth: client });
}
