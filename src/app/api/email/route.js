import { badRequest, serverError, unauthorized, ok } from '@/lib/api-helpers';
import { requireUser } from '@/engine.server';
import * as gmail from '@/engine/gmail';

export async function POST(request) {
  try {
    const user = await requireUser();
    if (!['partner', 'manager'].includes(user.role)) return unauthorized();
    const body = await request.json();
    const { template, to, data, ...emailOptions } = body;
    let result;
    if (template) {
      result = await gmail.sendTemplatedEmail(template, data, to);
    } else {
      if (!to || !emailOptions.subject) {
        return badRequest('Missing required fields (to, subject)');
      }
      result = await gmail.sendEmail({ to, ...emailOptions });
    }
    return ok({ success: true, messageId: result.id });
  } catch (error) {
    console.error('[EMAIL] POST error:', error.message);
    return serverError(error.message);
  }
}

export async function PUT(request) {
  try {
    const user = await requireUser();
    if (user.role !== 'partner') return unauthorized();
    const body = await request.json();
    const { emails } = body;
    if (!emails || !Array.isArray(emails)) {
      return badRequest('emails array required');
    }
    const results = await gmail.sendBulkEmails(emails);
    return ok({ results });
  } catch (error) {
    console.error('[EMAIL] PUT error:', error.message);
    return serverError(error.message);
  }
}
