import { generateToken } from '@/lib/csrf-protection';
import { ok } from '@/lib/response-formatter';
import { withErrorHandler } from '@/lib/with-error-handler';
import { requireAuth } from '@/lib/auth-middleware';

export const GET = withErrorHandler(async (request) => {
  await requireAuth();
  const token = generateToken();
  return ok({ csrfToken: token });
}, 'CSRF:GetToken');
