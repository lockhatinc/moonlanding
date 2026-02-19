import { getDatabase, now, genId } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { hashPassword } from '@/engine';
import { logAction } from '@/lib/audit-logger';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

const AUDITOR_TYPES = ['partner', 'manager', 'clerk'];
const MANAGER_ROLES = ['partner', 'manager'];

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  if (!MANAGER_ROLES.includes(user.role)) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Only partners and managers can add client users' }),
      { status: HTTP.FORBIDDEN, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();
  const { email, name, client_id, role } = body;

  if (!email || !name || !client_id) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'email, name, and client_id required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const emailLower = email.toLowerCase().trim();
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_REGEX.test(emailLower)) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Invalid email format' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();

  const existingAuditor = db.prepare(
    'SELECT id, type FROM users WHERE LOWER(email) = ? AND type IN (?, ?, ?)'
  ).get(emailLower, ...AUDITOR_TYPES);

  if (existingAuditor) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'This email belongs to an auditor account and cannot be used for a client user', code: 601 }),
      { status: HTTP.CONFLICT, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const existingClient = db.prepare(
    'SELECT id FROM users WHERE LOWER(email) = ? AND client_id = ?'
  ).get(emailLower, client_id);

  if (existingClient) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'A user with this email already exists for this client' }),
      { status: HTTP.CONFLICT, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const client = db.prepare('SELECT id, name FROM client WHERE id = ?').get(client_id);
  if (!client) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Client not found' }),
      { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const userId = genId();
  const tempPassword = genId().slice(0, 12);
  const hashedPassword = await hashPassword(tempPassword);
  const timestamp = now();
  const userRole = role || 'client_user';

  db.prepare(`
    INSERT INTO users (id, email, name, type, role, client_id, hashed_password, status, created_at, updated_at, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, emailLower, name, 'client', userRole, client_id, hashedPassword, 'active', timestamp, timestamp, user.id, user.id);

  const emailId = genId();
  db.prepare(`
    INSERT INTO email (id, recipient_email, sender_email, subject, body, html_body, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    emailId,
    emailLower,
    process.env.EMAIL_FROM || 'noreply@bidwise.app',
    `Welcome to ${client.name} on Moonlanding`,
    `You have been added as a ${userRole} for ${client.name}. Please reset your password to get started.`,
    `<p>Welcome! You have been added as a <b>${userRole}</b> for <b>${client.name}</b>.</p><p>Please use the password reset link to set your password.</p>`,
    'pending',
    timestamp
  );

  logAction('users', userId, 'create_client_user', user.id, null, { email: emailLower, client_id, role: userRole });

  return new Response(
    JSON.stringify({
      status: 'success',
      data: { id: userId, email: emailLower, name, client_id, role: userRole }
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'add-client-user');
