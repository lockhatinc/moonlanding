
import { google } from 'googleapis';
import fs from 'fs';
import { GOOGLE_SCOPES } from '@/config/constants';
import { config } from '@/config/env';

let credentials = null;

export function getCredentials() {
  if (credentials) return credentials;
  const path = config.auth.google.credentialsPath;
  if (!fs.existsSync(path)) {
    console.warn('Service account file not found:', path);
    return null;
  }
  credentials = JSON.parse(fs.readFileSync(path, 'utf8'));
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
