export function renderStandaloneLogin() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In | MY FRIDAY</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f2f5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .wrap{width:100%;max-width:420px}
    .logo{text-align:center;margin-bottom:28px}
    .logo-row{display:inline-flex;align-items:center;gap:10px;margin-bottom:8px}
    .logo-text{font-size:1.4rem;font-weight:800;color:#04141f;letter-spacing:1px}
    .logo-sub{color:#666;font-size:0.9rem}
    .card{background:#fff;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.1);padding:32px}
    .google-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#333;font-size:0.88rem;font-weight:500;text-decoration:none;margin-bottom:16px;transition:background 0.15s;cursor:pointer}
    .google-btn:hover{background:#f5f5f5}
    .divider{display:flex;align-items:center;gap:10px;margin-bottom:16px}
    .divider-line{flex:1;height:1px;background:#e0e0e0}
    .divider-text{font-size:0.78rem;color:#aaa}
    label{display:block;font-size:0.82rem;font-weight:600;color:#333;margin-bottom:6px}
    .field{margin-bottom:16px}
    input[type=email],input[type=password]{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:0.88rem;outline:none;transition:border-color 0.15s}
    input:focus{border-color:#1976d2}
    .forgot{text-align:right;margin-bottom:20px}
    .forgot a{font-size:0.8rem;color:#1976d2;text-decoration:none}
    .submit-btn{width:100%;padding:11px;background:#04141f;color:#fff;border:none;border-radius:6px;font-size:0.92rem;font-weight:600;cursor:pointer;transition:background 0.15s}
    .submit-btn:hover{background:#1976d2}
    .submit-btn:disabled{opacity:0.6;cursor:not-allowed}
    .err{background:#fdecea;border:1px solid #f5c6cb;color:#c62828;padding:10px 14px;border-radius:6px;margin-bottom:16px;font-size:0.85rem}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo">
      <div class="logo-row">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#04141f" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>
        <span class="logo-text">MY FRIDAY</span>
      </div>
      <div class="logo-sub">Sign in to your account</div>
    </div>
    <div class="card">
      <div id="err-area"></div>
      <div id="google-area" style="display:none">
        <a href="/api/auth/google" class="google-btn">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"/></svg>
          Sign in with Google
        </a>
        <div class="divider"><div class="divider-line"></div><span class="divider-text">or</span><div class="divider-line"></div></div>
      </div>
      <form id="loginForm">
        <div class="field">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" placeholder="Enter your email" required autocomplete="email">
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Enter your password" required autocomplete="current-password">
        </div>
        <div class="forgot"><a href="/password-reset">Forgot password?</a></div>
        <button type="submit" id="submitBtn" class="submit-btn">Sign In</button>
      </form>
    </div>
  </div>
  <script>
    fetch('/api/friday/features').then(r => r.json()).then(d => {
      if (d && d.googleAuth) document.getElementById('google-area').style.display = 'block';
    }).catch(() => {});

    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = document.getElementById('submitBtn');
      btn.textContent = 'Signing in...';
      btn.disabled = true;
      var errArea = document.getElementById('err-area');
      errArea.innerHTML = '';
      try {
        var res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: e.target.email.value, password: e.target.password.value })
        });
        var data = await res.json().catch(function() { return {}; });
        if (res.ok) {
          window.location.href = data.redirect || '/';
        } else {
          errArea.innerHTML = '<div class="err">' + (data.error || 'Login failed') + '</div>';
        }
      } catch(err) {
        errArea.innerHTML = '<div class="err">Network error: ' + err.message + '</div>';
      } finally {
        btn.textContent = 'Sign In';
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}
