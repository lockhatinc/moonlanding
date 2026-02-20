import { h } from '@/ui/webjsx.js'
import { generateHtml } from '@/ui/layout.js'

export function renderLogin(error = null) {
  const errHtml = error ? h('div', { className: 'alert alert-error mb-4' }, error) : ''
  const body = `<div class="center-screen"><div class="card w-96 bg-white shadow-lg"><div class="card-body">
    <div class="text-center mb-6"><div class="avatar placeholder mb-2"><div class="bg-primary text-white rounded-lg w-12"><span class="text-xl font-bold">P</span></div></div>
    <h2 class="card-title justify-center">Welcome back</h2><p class="text-gray-500 text-sm">Sign in to your account</p></div>${errHtml}
    <form method="POST" action="/api/auth/login" aria-label="Sign in"><div class="form-group"><label class="form-label" for="email">Email</label><input type="email" name="email" id="email" class="input input-bordered w-full" placeholder="Enter your email" required/></div>
    <div class="form-group mt-4"><label class="form-label" for="password">Password</label><input type="password" name="password" id="password" class="input input-bordered w-full" placeholder="Enter your password" required/></div>
    <button type="submit" class="btn btn-primary w-full mt-6">Sign in</button></form>
    <div class="text-center mt-4"><a href="/password-reset" class="text-sm text-primary hover:underline">Forgot password?</a></div>
    <div class="text-center mt-2 text-sm text-gray-500">Demo: <code class="text-xs">admin@example.com / password</code></div></div></div></div>`
  const script = `const form=document.querySelector('form');form.addEventListener('submit',async(e)=>{e.preventDefault();const btn=form.querySelector('button[type="submit"]');btn.classList.add('loading');btn.disabled=true;try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email.value,password:form.password.value})});const data=await res.json();if(res.ok){window.location.href=data.redirect||'/'}else{const d=document.createElement('div');d.className='alert alert-error mb-4';d.textContent=data.error||'Login failed';const x=form.parentElement.querySelector('.alert');if(x)x.remove();form.parentElement.insertBefore(d,form)}}catch(err){alert('Network error: '+err.message)}finally{btn.classList.remove('loading');btn.disabled=false}})`
  return generateHtml('Login', body, [script])
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
