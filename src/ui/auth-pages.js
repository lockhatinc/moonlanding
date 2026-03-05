import { generateHtml } from '@/ui/layout.js'
import { nav as navFn } from '@/ui/layout.js'

const loginPageStyle = `
  <style>
    .auth-shell{min-height:100vh;background:var(--color-bg,#f1f5f9);display:flex;align-items:center;justify-content:center;padding:16px}
    .auth-wrap{width:100%;max-width:400px}
    .auth-logo{text-align:center;margin-bottom:32px}
    .auth-logo-mark{display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;background:#04141f;border-radius:14px;margin-bottom:14px;box-shadow:0 4px 12px rgba(4,20,31,0.25)}
    .auth-logo-name{font-size:1.35rem;font-weight:800;color:var(--color-text,#0f172a);letter-spacing:0.5px;display:block;margin-bottom:4px}
    .auth-logo-sub{color:var(--color-text-muted,#64748b);font-size:0.875rem}
    .auth-card{background:var(--color-surface,#fff);border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,0.09);padding:32px;border:1px solid var(--color-border,#e2e8f0)}
    .auth-google-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:11px;border:1px solid var(--color-border,#e2e8f0);border-radius:8px;background:var(--color-surface,#fff);color:var(--color-text,#0f172a);font-size:0.875rem;font-weight:500;text-decoration:none;margin-bottom:20px;transition:all 0.15s;cursor:pointer;min-height:44px}
    .auth-google-btn:hover{background:var(--color-bg,#f1f5f9);border-color:#94a3b8}
    .auth-google-btn:focus-visible{outline:2px solid #2563eb;outline-offset:2px}
    .auth-divider{display:flex;align-items:center;gap:12px;margin-bottom:20px}
    .auth-divider-line{flex:1;height:1px;background:var(--color-border,#e2e8f0)}
    .auth-divider-text{font-size:0.75rem;color:var(--color-text-muted,#64748b);font-weight:500;text-transform:uppercase;letter-spacing:0.5px}
    .auth-field{margin-bottom:18px}
    .auth-label{display:block;font-size:0.8125rem;font-weight:600;color:var(--color-text,#0f172a);margin-bottom:6px}
    .auth-input{width:100%;padding:10px 13px;border:1.5px solid var(--color-border,#e2e8f0);border-radius:8px;font-size:0.9rem;outline:none;transition:border-color 0.15s,box-shadow 0.15s;background:var(--color-surface,#fff);color:var(--color-text,#0f172a);min-height:44px;box-sizing:border-box}
    .auth-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,0.12)}
    .auth-forgot{text-align:right;margin-bottom:22px}
    .auth-forgot a{font-size:0.8125rem;color:#2563eb;text-decoration:none;font-weight:500}
    .auth-forgot a:hover{text-decoration:underline}
    .auth-submit{width:100%;padding:12px;background:#04141f;color:#fff;border:none;border-radius:8px;font-size:0.9375rem;font-weight:600;cursor:pointer;transition:all 0.15s;min-height:46px}
    .auth-submit:hover:not(:disabled){background:#0a2535;box-shadow:0 4px 12px rgba(4,20,31,0.2)}
    .auth-submit:disabled{opacity:0.65;cursor:not-allowed}
    .auth-submit:focus-visible{outline:2px solid #2563eb;outline-offset:2px}
    .auth-err{background:#fee2e2;border:1px solid #fca5a5;color:#b91c1c;padding:11px 14px;border-radius:8px;margin-bottom:18px;font-size:0.875rem;display:flex;align-items:flex-start;gap:8px;line-height:1.4}
    .auth-success{background:#dcfce7;border:1px solid #86efac;color:#15803d;padding:12px 14px;border-radius:8px;margin-bottom:18px;font-size:0.875rem}
    .auth-back{text-align:center;margin-top:16px;font-size:0.875rem;color:var(--color-text-muted,#64748b)}
    .auth-back a{color:#2563eb;text-decoration:none;font-weight:500}
    .auth-back a:hover{text-decoration:underline}
    @media(prefers-color-scheme:dark){
      .auth-logo-mark{background:#1e3a5f}
      .auth-card{background:#1a1a1a;border-color:#334155;box-shadow:0 4px 24px rgba(0,0,0,0.4)}
      .auth-google-btn{background:#1a1a1a;border-color:#334155;color:#f1f5f9}
      .auth-google-btn:hover{background:#2d2d2d}
      .auth-input{background:#1a1a1a;border-color:#334155;color:#f1f5f9}
      .auth-submit{background:#1e3a5f}
      .auth-submit:hover:not(:disabled){background:#1e293b}
    }
  </style>`

const GOOGLE_SVG = `<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"/></svg>`
const WARN_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
const LOGO_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>`

export function renderLogin(error = null, hasGoogleAuth = false) {
  const errHtml = error
    ? `<div class="auth-err" role="alert">${WARN_SVG}${String(error).replace(/</g, '&lt;')}</div>`
    : ''

  const googleBtn = hasGoogleAuth
    ? `<a href="/api/auth/google" class="auth-google-btn" aria-label="Continue with Google">${GOOGLE_SVG}Continue with Google</a>
       <div class="auth-divider"><div class="auth-divider-line"></div><span class="auth-divider-text">or</span><div class="auth-divider-line"></div></div>`
    : ''

  const body = `${loginPageStyle}
  <div class="auth-shell">
    <div class="auth-wrap">
      <div class="auth-logo">
        <div class="auth-logo-mark">${LOGO_SVG}</div>
        <span class="auth-logo-name">MOONLANDING</span>
        <div class="auth-logo-sub">Sign in to your account</div>
      </div>
      <div class="auth-card">
        <div id="login-err-area" role="alert" aria-live="assertive">${errHtml}</div>
        ${googleBtn}
        <form id="login-form" aria-label="Sign in" novalidate>
          <div class="auth-field">
            <label class="auth-label" for="email">Email address</label>
            <input type="email" name="email" id="email" class="auth-input" placeholder="you@example.com" required autocomplete="email" autofocus>
          </div>
          <div class="auth-field">
            <label class="auth-label" for="password">Password</label>
            <input type="password" name="password" id="password" class="auth-input" placeholder="Your password" required autocomplete="current-password">
          </div>
          <div class="auth-forgot"><a href="/password-reset">Forgot password?</a></div>
          <button type="submit" id="login-btn" class="auth-submit">Sign In</button>
        </form>
      </div>
    </div>
  </div>`

  const script = `
var form = document.getElementById('login-form');
form.addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn = document.getElementById('login-btn');
  var errArea = document.getElementById('login-err-area');
  btn.textContent = 'Signing in\u2026';
  btn.disabled = true;
  errArea.innerHTML = '';
  try {
    var res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email.value, password: form.password.value })
    });
    var data = await res.json().catch(function() { return {}; });
    if (res.ok) {
      btn.textContent = 'Redirecting\u2026';
      window.location.href = data.redirect || '/';
    } else {
      errArea.innerHTML = '<div class="auth-err" role="alert">' + (data.error || 'Login failed. Please check your credentials.') + '</div>';
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  } catch(err) {
    errArea.innerHTML = '<div class="auth-err" role="alert">Network error. Please try again.</div>';
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
});`

  return generateHtml('Sign In | MOONLANDING', body, [script])
}

export function renderPasswordReset() {
  const body = `${loginPageStyle}
  <div class="auth-shell">
    <div class="auth-wrap">
      <div class="auth-logo">
        <div class="auth-logo-mark">${LOGO_SVG}</div>
        <span class="auth-logo-name">MOONLANDING</span>
        <div class="auth-logo-sub">Reset your password</div>
      </div>
      <div class="auth-card">
        <div id="reset-success" class="auth-success" style="display:none" role="alert">
          If an account exists with that email, a reset link has been sent. Check your inbox.
        </div>
        <form id="reset-form" aria-label="Password reset request" novalidate>
          <div class="auth-field">
            <label class="auth-label" for="email">Email address</label>
            <input type="email" name="email" id="email" class="auth-input" placeholder="you@example.com" required autocomplete="email" autofocus>
          </div>
          <div id="reset-err-area" role="alert" aria-live="assertive"></div>
          <button type="submit" id="reset-btn" class="auth-submit">Send Reset Link</button>
        </form>
        <div class="auth-back"><a href="/login">Back to sign in</a></div>
      </div>
    </div>
  </div>`

  const script = `
var form = document.getElementById('reset-form');
form.addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn = document.getElementById('reset-btn');
  var errArea = document.getElementById('reset-err-area');
  btn.textContent = 'Sending\u2026';
  btn.disabled = true;
  errArea.innerHTML = '';
  try {
    var res = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email.value })
    });
    if (res.ok) {
      form.style.display = 'none';
      document.getElementById('reset-success').style.display = 'block';
    } else {
      var d = await res.json().catch(function() { return {}; });
      errArea.innerHTML = '<div class="auth-err" role="alert">' + (d.error || 'Request failed. Please try again.') + '</div>';
      btn.textContent = 'Send Reset Link';
      btn.disabled = false;
    }
  } catch(err) {
    errArea.innerHTML = '<div class="auth-err" role="alert">Network error. Please try again.</div>';
    btn.textContent = 'Send Reset Link';
    btn.disabled = false;
  }
});`

  return generateHtml('Reset Password | MOONLANDING', body, [script])
}

export function renderPasswordResetConfirm(token) {
  const body = `${loginPageStyle}
  <div class="auth-shell">
    <div class="auth-wrap">
      <div class="auth-logo">
        <div class="auth-logo-mark">${LOGO_SVG}</div>
        <span class="auth-logo-name">MOONLANDING</span>
        <div class="auth-logo-sub">Set a new password</div>
      </div>
      <div class="auth-card">
        <div id="confirm-success" class="auth-success" style="display:none" role="alert">
          Password updated. <a href="/login" style="color:#15803d;text-decoration:underline;font-weight:600">Sign in now</a>
        </div>
        <form id="confirm-form" aria-label="Set new password" novalidate>
          <input type="hidden" name="token" value="${token}">
          <div class="auth-field">
            <label class="auth-label" for="password">New password</label>
            <input type="password" name="password" id="password" class="auth-input" placeholder="At least 8 characters" minlength="8" required autocomplete="new-password" autofocus>
          </div>
          <div class="auth-field">
            <label class="auth-label" for="confirm_password">Confirm new password</label>
            <input type="password" name="confirm_password" id="confirm_password" class="auth-input" placeholder="Same password again" minlength="8" required autocomplete="new-password">
          </div>
          <div id="confirm-err-area" role="alert" aria-live="assertive"></div>
          <button type="submit" id="confirm-btn" class="auth-submit">Update Password</button>
        </form>
        <div class="auth-back"><a href="/login">Back to sign in</a></div>
      </div>
    </div>
  </div>`

  const script = `
var form = document.getElementById('confirm-form');
form.addEventListener('submit', async function(e) {
  e.preventDefault();
  var pw = form.password.value, cpw = form.confirm_password.value;
  var errArea = document.getElementById('confirm-err-area');
  errArea.innerHTML = '';
  if (pw !== cpw) {
    errArea.innerHTML = '<div class="auth-err" role="alert">Passwords do not match.</div>';
    return;
  }
  var btn = document.getElementById('confirm-btn');
  btn.textContent = 'Updating\u2026';
  btn.disabled = true;
  try {
    var res = await fetch('/api/auth/password-reset', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: form.token.value, password: pw })
    });
    var data = await res.json().catch(function() { return {}; });
    if (res.ok) {
      form.style.display = 'none';
      document.getElementById('confirm-success').style.display = 'block';
    } else {
      errArea.innerHTML = '<div class="auth-err" role="alert">' + (data.error || 'Reset failed. Please try again.') + '</div>';
      btn.textContent = 'Update Password';
      btn.disabled = false;
    }
  } catch(err) {
    errArea.innerHTML = '<div class="auth-err" role="alert">Network error. Please try again.</div>';
    btn.textContent = 'Update Password';
    btn.disabled = false;
  }
});`

  return generateHtml('Set New Password | MOONLANDING', body, [script])
}

export function renderAccessDenied(user, entityName, action) {
  const txt = { list: 'view this list', view: 'view this item', create: 'create items here', edit: 'edit this item', delete: 'delete this item' }
  const body = `<div class="min-h-screen">${navFn(user)}<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:40px 20px">
    <div style="font-size:48px;margin-bottom:16px" aria-hidden="true">&#128274;</div>
    <h1 style="font-size:24px;font-weight:700;color:var(--color-text,#0f172a);margin:0 0 8px">Access Denied</h1>
    <p style="color:var(--color-text-muted,#64748b);margin:0 0 24px;max-width:400px">You do not have permission to ${txt[action] || action} in ${entityName}.</p>
    <a href="/" class="btn-primary-clean">Return to Dashboard</a>
  </div></div>`
  return generateHtml('Access Denied | MOONLANDING', body)
}
