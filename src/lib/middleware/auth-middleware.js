import { getUser } from '@/engine.server';

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.code = 'AUTH_REQUIRED';
  }
}

export async function authRequired(req) {
  const user = await getUser();
  if (!user) {
    throw new AuthenticationError('You must be logged in to access this');
  }
  return user;
}

export async function authOptional(req) {
  const user = await getUser();
  return user || null;
}

export function createAuthMiddleware(required = true) {
  return async (req) => {
    if (required) {
      return await authRequired(req);
    } else {
      return await authOptional(req);
    }
  };
}
