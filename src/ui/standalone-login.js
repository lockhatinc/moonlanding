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
    .demo-text { text-align: center; margin-top: 1rem; color: #666; font-size: 0.875rem; }
    .demo-code { background: #f5f5f5; padding: 0.5rem; border-radius: 4px; font-family: monospace; font-size: 0.75rem; }
    .alert { padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
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

      <div class="demo-text">
        Demo: <span class="demo-code">admin@example.com / password</span>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');

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
