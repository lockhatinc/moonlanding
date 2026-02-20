export function renderPasswordResetPage(params = {}) {
  const token = params.token || '';
  const isConfirm = !!token;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
    .center-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
    h2 { color: #333; margin-bottom: 0.5rem; text-align: center; }
    .text-gray { color: #666; font-size: 0.875rem; text-align: center; margin-bottom: 1.5rem; }
    form { margin: 1.5rem 0; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; color: #333; font-weight: 500; margin-bottom: 0.5rem; font-size: 0.875rem; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
    input:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 2px rgba(0,123,255,0.1); }
    button { width: 100%; padding: 0.75rem; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 1rem; }
    button:hover { background: #0056b3; }
    button.loading { opacity: 0.6; cursor: not-allowed; }
    button.success { background: #28a745; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .alert { padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; border: 1px solid; }
    .alert-error { background: #f8d7da; color: #721c24; border-color: #f5c6cb; }
    .alert-success { background: #d4edda; color: #155724; border-color: #c3e6cb; }
    .alert-info { background: #d1ecf1; color: #0c5460; border-color: #bee5eb; }
    .link { color: #007bff; cursor: pointer; text-decoration: none; }
    .link:hover { text-decoration: underline; }
    .separator { text-align: center; margin: 1.5rem 0; color: #999; }
    .note { font-size: 0.875rem; color: #666; margin-top: 1rem; text-align: center; }
  </style>
</head>
<body>
  <div class="center-screen">
    <div class="card">
      ${isConfirm ? `
        <h2>Reset Your Password</h2>
        <p class="text-gray">Enter your new password below</p>
      ` : `
        <h2>Forgot Password</h2>
        <p class="text-gray">Enter your email to receive a password reset link</p>
      `}

      <div id="alertContainer"></div>

      <form id="resetForm" aria-label="Password reset">
        ${!isConfirm ? `
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" name="email" id="email" placeholder="your@email.com" required>
          </div>
          <button type="submit" id="submitBtn">Send Reset Link</button>
          <p class="note">
            Remember your password? <span class="link" onclick="window.location.href='/login'">Sign in</span>
          </p>
        ` : `
          <input type="hidden" name="token" value="${token}">
          <div class="form-group">
            <label for="password">New Password</label>
            <input type="password" name="password" id="password" placeholder="Minimum 8 characters" required minlength="8">
          </div>
          <div class="form-group">
            <label for="confirm">Confirm Password</label>
            <input type="password" name="confirm" id="confirm" placeholder="Confirm your password" required minlength="8">
          </div>
          <button type="submit" id="submitBtn">Update Password</button>
          <p class="note">
            <span class="link" onclick="window.location.href='/login'">Back to login</span>
          </p>
        `}
      </form>
    </div>
  </div>

  <script>
    const form = document.getElementById('resetForm');
    const submitBtn = document.getElementById('submitBtn');
    const alertContainer = document.getElementById('alertContainer');
    const isConfirm = ${isConfirm ? 'true' : 'false'};

    function showAlert(message, type = 'error') {
      const div = document.createElement('div');
      div.className = \`alert alert-\${type}\`;
      div.textContent = message;
      alertContainer.innerHTML = '';
      alertContainer.appendChild(div);
    }

    if (isConfirm && !form.token.value) {
      showAlert('Invalid or missing reset token', 'error');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        if (isConfirm && data.password !== data.confirm) {
          showAlert('Passwords do not match', 'error');
          submitBtn.classList.remove('loading');
          submitBtn.disabled = false;
          return;
        }

        const endpoint = isConfirm ? '/api/auth/password-reset' : '/api/auth/password-reset';
        const method = isConfirm ? 'PUT' : 'POST';
        const body = isConfirm
          ? { token: data.token, password: data.password }
          : { email: data.email };

        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const result = await res.json();

        if (res.ok) {
          showAlert(result.message, 'success');
          if (isConfirm) {
            submitBtn.textContent = 'Password Updated';
            submitBtn.classList.add('success');
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          } else {
            form.reset();
            showAlert('Check your email for the reset link', 'info');
          }
        } else {
          showAlert(result.error || 'An error occurred', 'error');
        }
      } catch (err) {
        showAlert('Network error: ' + err.message, 'error');
      } finally {
        if (!isConfirm || !form.closest('form').classList.contains('success')) {
          submitBtn.classList.remove('loading');
          submitBtn.disabled = false;
        }
      }
    });
  </script>
</body>
</html>`;
}
