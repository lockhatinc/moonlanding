// Completely standalone login page - no external dependencies
export function renderStandaloneLogin() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
    .center-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); width: 100%; max-width: 384px; }
    .text-center { text-align: center; margin-bottom: 1.5rem; }
    .avatar { width: 48px; height: 48px; border-radius: 8px; background: #007bff; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 1rem; }
    h2 { color: #333; margin-bottom: 0.5rem; }
    .text-gray { color: #666; font-size: 0.875rem; }
    form { margin: 1.5rem 0; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; color: #333; font-weight: 500; margin-bottom: 0.5rem; font-size: 0.875rem; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
    input:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 2px rgba(0,123,255,0.1); }
    button { width: 100%; padding: 0.75rem; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 1rem; }
    button:hover { background: #0056b3; }
    button.loading { opacity: 0.6; cursor: not-allowed; }
    .oauth-button { background: white; border: 1px solid #ddd; color: #333; margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .oauth-button:hover { background: #f8f8f8; border-color: #999; }
    .oauth-button svg { width: 18px; height: 18px; }
    .divider { text-align: center; margin: 1.5rem 0; color: #999; font-size: 0.875rem; }
    .divider::before { content: ''; display: inline-block; width: 45%; height: 1px; background: #ddd; vertical-align: middle; margin-right: 0.5rem; }
    .divider::after { content: ''; display: inline-block; width: 45%; height: 1px; background: #ddd; vertical-align: middle; margin-left: 0.5rem; }
    .demo-text { text-align: center; margin-top: 1rem; color: #666; font-size: 0.875rem; }
    .demo-code { background: #f5f5f5; padding: 0.5rem; border-radius: 4px; font-family: monospace; font-size: 0.75rem; }
    .alert { padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
  </style>
</head>
<body>
  <div class="center-screen">
    <div class="card">
      <div class="text-center">
        <div class="avatar">P</div>
        <h2>Welcome back</h2>
        <p class="text-gray">Sign in to your account</p>
      </div>

      <div id="googleAlert" class="alert warning" style="display: none;">
        Google Sign-in not configured. See admin for setup.
      </div>

      <form id="loginForm" aria-label="Sign in">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" name="email" id="email" placeholder="Enter your email" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" name="password" id="password" placeholder="Enter your password" required>
        </div>
        <button type="submit" id="submitBtn">Sign in</button>
      </form>

      <div id="oauthContainer" style="display: none;">
        <div class="divider">or</div>
        <a href="/api/auth/google" class="oauth-button" id="googleBtn">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.745 12.27c0-.79-.07-1.54-.187-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.85c2.27-2.09 3.575-5.17 3.575-8.81z" fill="#4285F4"/>
            <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.85-3c-1.08.72-2.45 1.13-4.08 1.13-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.05 21.3 7.31 24 12 24z" fill="#34A853"/>
            <path d="M5.27 14.27C5.02 13.45 4.9 12.58 4.9 11.5s.12-1.95.37-2.77V5.64h-3.98A11.93 11.93 0 000 11.5c0 1.92.44 3.75 1.22 5.36l3.98-3.09z" fill="#FBBC05"/>
            <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.46-3.46C17.95 1.27 15.24 0 12 0 7.31 0 3.05 2.7 1.22 6.64l3.98 3.09c.95-2.85 3.6-4.98 6.8-4.98z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </a>
      </div>

      <div class="demo-text">
        Demo: <span class="demo-code">admin@example.com / password</span>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const googleBtn = document.getElementById('googleBtn');
    const oauthContainer = document.getElementById('oauthContainer');
    const googleAlert = document.getElementById('googleAlert');

    // Check if Google auth is configured
    fetch('/api/auth/google', { method: 'HEAD' })
      .then(() => {
        oauthContainer.style.display = 'block';
        googleAlert.style.display = 'none';
      })
      .catch(() => {
        googleAlert.style.display = 'block';
      });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email.value,
            password: form.password.value
          })
        });

        const data = await res.json();

        if (res.ok) {
          window.location.href = data.redirect || '/';
        } else {
          // Show error
          const errDiv = document.createElement('div');
          errDiv.className = 'alert';
          errDiv.textContent = data.error || 'Login failed';
          form.parentElement.insertBefore(errDiv, form);
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}
