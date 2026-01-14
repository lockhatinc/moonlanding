import { getBy, verifyPassword, migrate } from '@/engine';
import { initializeSystemConfig } from '@/config/system-config-loader';
import { ok } from '@/lib/response-formatter';
import { withErrorHandler } from '@/lib/with-error-handler';
import { lucia } from '@/engine.server';

let initialized = false;

export const POST = withErrorHandler(async (request) => {
  // Initialize system
  if (!initialized) {
    initialized = true;
    try {
      await initializeSystemConfig();
      migrate();
    } catch (e) {
      console.error('[Login] Init failed:', e.message);
      return new Response(JSON.stringify({ error: 'System init failed' }), { status: 500 });
    }
  }

  try {
    // Parse request body - request.body is already parsed by server.js
    let email, password;

    const body = request.body;

    if (typeof body === 'object' && body !== null) {
      email = body.email;
      password = body.password;
    } else if (typeof body === 'string') {
      // Handle URL-encoded form data
      const params = new URLSearchParams(body);
      email = params.get('email');
      password = params.get('password');
    } else {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), { status: 400 });
    }

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 });
    }

    // Get user
    const user = getBy('user', 'email', email);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
    }

    // Verify password
    if (user.password_hash) {
      const passwordValid = await verifyPassword(password, user.password_hash);
      if (!passwordValid) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
      }
    }

    // Create session using Lucia
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Create response with session cookie header
    const cookieHeader = `${sessionCookie.name}=${sessionCookie.value}; Path=/; HttpOnly; SameSite=Lax${sessionCookie.attributes.secure ? '; Secure' : ''}`;

    console.log('[Login] Session created:', session.id);
    console.log('[Login] Cookie header:', cookieHeader.slice(0, 50) + '...');

    // Return response with session cookie header
    const responseBody = JSON.stringify({
      status: 'success',
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    return new Response(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader
      }
    });
  } catch (err) {
    console.error('[Login] Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}, 'Auth:Login');
