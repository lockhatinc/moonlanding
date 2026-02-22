import { h } from '@/ui/webjsx.js'
import { generateHtml } from '@/ui/layout.js'

export function renderLogin(error = null, hasGoogleAuth = false) {
  const errHtml = error ? `<div style="background:#fdecea;border:1px solid #f5c6cb;color:#c62828;padding:10px 14px;border-radius:6px;margin-bottom:16px;font-size:0.85rem">${String(error).replace(/</g,'&lt;')}</div>` : ''

  const googleBtn = hasGoogleAuth ? `
    <a href="/api/auth/google" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#333;font-size:0.88rem;font-weight:500;text-decoration:none;margin-bottom:16px;transition:background 0.15s" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='#fff'">
      <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"/></svg>
      Sign in with Google
    </a>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><div style="flex:1;height:1px;background:#e0e0e0"></div><span style="font-size:0.78rem;color:#aaa">or</span><div style="flex:1;height:1px;background:#e0e0e0"></div></div>` : ''

  const body = `
  <div style="min-height:100vh;background:#f0f2f5;display:flex;align-items:center;justify-content:center;padding:20px">
    <div style="width:100%;max-width:420px">
      <div style="text-align:center;margin-bottom:28px">
        <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:12px">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#04141f" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>
          <span style="font-size:1.4rem;font-weight:800;color:#04141f;letter-spacing:1px">MOONLANDING</span>
        </div>
        <p style="color:#666;font-size:0.9rem;margin:0">Sign in to your account</p>
      </div>
      <div style="background:#fff;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.1);padding:32px">
        ${errHtml}
        ${googleBtn}
        <form id="login-form" aria-label="Sign in">
          <div style="margin-bottom:16px">
            <label for="email" style="display:block;font-size:0.82rem;font-weight:600;color:#333;margin-bottom:6px">Email</label>
            <input type="email" name="email" id="email" placeholder="Enter your email" required autocomplete="email"
              style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:0.88rem;box-sizing:border-box;outline:none;transition:border-color 0.15s"
              onfocus="this.style.borderColor='#1976d2'" onblur="this.style.borderColor='#ddd'">
          </div>
          <div style="margin-bottom:8px">
            <label for="password" style="display:block;font-size:0.82rem;font-weight:600;color:#333;margin-bottom:6px">Password</label>
            <input type="password" name="password" id="password" placeholder="Enter your password" required autocomplete="current-password"
              style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:0.88rem;box-sizing:border-box;outline:none;transition:border-color 0.15s"
              onfocus="this.style.borderColor='#1976d2'" onblur="this.style.borderColor='#ddd'">
          </div>
          <div style="text-align:right;margin-bottom:20px">
            <a href="/password-reset" style="font-size:0.8rem;color:#1976d2;text-decoration:none">Forgot password?</a>
          </div>
          <button type="submit" id="login-btn" style="width:100%;padding:11px;background:#04141f;color:#fff;border:none;border-radius:6px;font-size:0.92rem;font-weight:600;cursor:pointer;transition:background 0.15s"
            onmouseover="this.style.background='#1976d2'" onmouseout="this.style.background='#04141f'">
            Sign In
          </button>
        </form>
      </div>
    </div>
  </div>`

  const script = `
var form = document.getElementById('login-form');
form.addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn = document.getElementById('login-btn');
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  var errEl = document.getElementById('login-err');
  if (errEl) errEl.remove();
  try {
    var res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email.value, password: form.password.value })
    });
    var data = await res.json().catch(function() { return {}; });
    if (res.ok) {
      window.location.href = data.redirect || '/';
    } else {
      var d = document.createElement('div');
      d.id = 'login-err';
      d.style = 'background:#fdecea;border:1px solid #f5c6cb;color:#c62828;padding:10px 14px;border-radius:6px;margin-bottom:16px;font-size:0.85rem';
      d.textContent = data.error || 'Login failed';
      form.parentElement.insertBefore(d, form);
    }
  } catch(err) {
    alert('Network error: ' + err.message);
  } finally {
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
});`

  return generateHtml('Sign In | MOONLANDING', body, [script])
}

export function renderPasswordReset() {
  const body = `<div class="center-screen"><div class="card w-96 bg-white shadow-lg"><div class="card-body">
    <div class="text-center mb-6"><h2 class="card-title justify-center">Reset Password</h2><p class="text-gray-500 text-sm">Enter your email to receive a reset link</p></div>
    <div id="reset-success" style="display:none" class="alert alert-success mb-4">If an account exists with that email, a password reset link has been sent.</div>
    <form id="reset-form" aria-label="Password reset request"><div class="form-group"><label class="form-label" for="email">Email</label><input type="email" name="email" id="email" class="input input-bordered w-full" placeholder="Enter your email" required/></div>
    <button type="submit" id="reset-btn" class="btn btn-primary w-full mt-6">Send Reset Link</button></form>
    <div class="text-center mt-4"><a href="/login" class="text-sm text-primary hover:underline">Back to login</a></div></div></div></div>`
  const script = `var form=document.getElementById('reset-form');form.addEventListener('submit',async function(e){e.preventDefault();var btn=document.getElementById('reset-btn');btn.classList.add('btn-loading');btn.disabled=true;try{var res=await fetch('/api/auth/password-reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email.value})});if(res.ok){form.style.display='none';document.getElementById('reset-success').style.display='block'}else{var d=await res.json().catch(function(){return{}});var el=document.createElement('div');el.className='alert alert-error mb-4';el.textContent=d.error||'Request failed';var old=form.parentElement.querySelector('.alert-error');if(old)old.remove();form.parentElement.insertBefore(el,form)}}catch(err){alert('Network error: '+err.message)}finally{btn.classList.remove('btn-loading');btn.disabled=false}})`
  return generateHtml('Reset Password', body, [script])
}

export function renderPasswordResetConfirm(token) {
  const body = `<div class="center-screen"><div class="card w-96 bg-white shadow-lg"><div class="card-body">
    <div class="text-center mb-6"><h2 class="card-title justify-center">Set New Password</h2><p class="text-gray-500 text-sm">Enter your new password below</p></div>
    <div id="confirm-success" style="display:none" class="alert alert-success mb-4">Password updated successfully. <a href="/login" class="text-primary underline">Sign in</a></div>
    <form id="confirm-form" aria-label="Set new password"><input type="hidden" name="token" value="${token}"/>
    <div class="form-group"><label class="form-label" for="password">New Password</label><input type="password" name="password" id="password" class="input input-bordered w-full" placeholder="Enter new password" minlength="8" required/></div>
    <div class="form-group mt-4"><label class="form-label" for="confirm_password">Confirm Password</label><input type="password" name="confirm_password" id="confirm_password" class="input input-bordered w-full" placeholder="Confirm new password" minlength="8" required/></div>
    <button type="submit" id="confirm-btn" class="btn btn-primary w-full mt-6">Update Password</button></form>
    <div class="text-center mt-4"><a href="/login" class="text-sm text-primary hover:underline">Back to login</a></div></div></div></div>`
  const script = `var form=document.getElementById('confirm-form');form.addEventListener('submit',async function(e){e.preventDefault();var pw=form.password.value,cpw=form.confirm_password.value;if(pw!==cpw){alert('Passwords do not match');return}var btn=document.getElementById('confirm-btn');btn.classList.add('btn-loading');btn.disabled=true;try{var res=await fetch('/api/auth/password-reset',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:form.token.value,password:pw})});var data=await res.json().catch(function(){return{}});if(res.ok){form.style.display='none';document.getElementById('confirm-success').style.display='block'}else{var el=document.createElement('div');el.className='alert alert-error mb-4';el.textContent=data.error||'Reset failed';var old=form.parentElement.querySelector('.alert-error');if(old)old.remove();form.parentElement.insertBefore(el,form)}}catch(err){alert('Network error: '+err.message)}finally{btn.classList.remove('btn-loading');btn.disabled=false}})`
  return generateHtml('Set New Password', body, [script])
}

export function renderAccessDenied(user, entityName, action) {
  const { nav } = await_layout()
  const txt = { list: 'view this list', view: 'view this item', create: 'create items here', edit: 'edit this item', delete: 'delete this item' }
  const body = `<div class="min-h-screen">${nav(user)}<div class="access-denied"><div class="access-denied-icon">&#128274;</div><h1>Access Denied</h1><p>You do not have permission to ${txt[action] || action} in ${entityName}.</p><a href="/" class="btn btn-primary">Return to Dashboard</a></div></div>`
  return generateHtml('Access Denied', body)
}

let _layoutRef = null
import { nav as navFn } from '@/ui/layout.js'
_layoutRef = { nav: navFn }
function await_layout() { return _layoutRef }
