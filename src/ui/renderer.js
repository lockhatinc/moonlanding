import { canCreate, canEdit, canDelete, getNavItems, getAdminItems, getQuickActions } from './permissions-ui.js';

export const REDIRECT = Symbol('REDIRECT');

const STAGE_COLORS = {
  info_gathering: { bg: '#dbeafe', text: '#1e40af', label: 'Info Gathering' },
  commencement: { bg: '#dbeafe', text: '#1e40af', label: 'Commencement' },
  team_execution: { bg: '#fef3c7', text: '#92400e', label: 'Team Execution' },
  partner_review: { bg: '#fef3c7', text: '#92400e', label: 'Partner Review' },
  finalization: { bg: '#d1fae5', text: '#065f46', label: 'Finalization' },
  closeout: { bg: '#d1fae5', text: '#065f46', label: 'Close Out' },
};

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  active: { bg: '#dbeafe', text: '#1e40af' },
  completed: { bg: '#d1fae5', text: '#065f46' },
  archived: { bg: '#f3f4f6', text: '#4b5563' },
  open: { bg: '#fef3c7', text: '#92400e' },
  closed: { bg: '#d1fae5', text: '#065f46' },
  draft: { bg: '#f3f4f6', text: '#6b7280' },
  in_progress: { bg: '#dbeafe', text: '#1e40af' },
  review: { bg: '#ede9fe', text: '#5b21b6' },
  approved: { bg: '#d1fae5', text: '#065f46' },
  rejected: { bg: '#fee2e2', text: '#991b1b' },
  overdue: { bg: '#fee2e2', text: '#991b1b' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280' },
  on_hold: { bg: '#fef3c7', text: '#92400e' },
  resolved: { bg: '#d1fae5', text: '#065f46' },
  unresolved: { bg: '#fee2e2', text: '#991b1b' },
  flagged: { bg: '#fce7f3', text: '#9d174d' },
  responded: { bg: '#dbeafe', text: '#1e40af' },
  expired: { bg: '#f3f4f6', text: '#6b7280' },
  private: { bg: '#ede9fe', text: '#5b21b6' },
  public: { bg: '#dbeafe', text: '#1e40af' },
};

function fmtVal(value, fieldKey, item = {}) {
  if (value === null || value === undefined) return '-';
  if (fieldKey?.includes('_at') || fieldKey === 'created_at' || fieldKey === 'updated_at') {
    const num = Number(value);
    if (!isNaN(num) && num > 1000000000 && num < 3000000000) return new Date(num * 1000).toLocaleString();
  }
  if (fieldKey === 'year') { const n = Number(value); if (!isNaN(n)) return String(Math.floor(n)); }
  if (fieldKey === 'stage' && STAGE_COLORS[value]) {
    const s = STAGE_COLORS[value];
    return `<span class="badge-stage" style="background:${s.bg};color:${s.text}">${s.label}</span>`;
  }
  if (fieldKey === 'status' && STATUS_COLORS[value]) {
    const s = STATUS_COLORS[value];
    return `<span class="badge-status" style="background:${s.bg};color:${s.text}">${value.charAt(0).toUpperCase() + value.slice(1)}</span>`;
  }
  if (item[`${fieldKey}_display`]) return item[`${fieldKey}_display`];
  return String(value);
}

export function generateHtml(title, bodyContent, scripts = []) {
  const scriptTags = scripts.map(s =>
    typeof s === 'string' ? `<script type="module">${s}</script>` : `<script type="module" src="${s.src}"></script>`
  ).join('\n');
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://cdn.jsdelivr.net/npm/rippleui@1.12.1/dist/css/styles.css" rel="stylesheet"/>
  <link href="/ui/styles.css" rel="stylesheet"/>
</head>
<body>
  <div id="app">${bodyContent}</div>
  <script type="importmap">
  { "imports": { "webjsx": "/lib/webjsx/index.js", "webjsx/jsx-runtime": "/lib/webjsx/jsx-runtime.js" } }
  </script>
  ${scriptTags}
</body>
</html>`;
}

function breadcrumb(items) {
  if (!items?.length) return '';
  return `<nav class="breadcrumb">${items.map((item, i) =>
    i === items.length - 1 ? `<span>${item.label}</span>` : `<a href="${item.href}">${item.label}</a><span class="breadcrumb-separator">/</span>`
  ).join('')}</nav>`;
}

const TOAST_SCRIPT = `window.showToast=(m,t='info')=>{let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.className='toast-container';document.body.appendChild(c)}const d=document.createElement('div');d.className='toast toast-'+t;d.textContent=m;c.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},3000)};`;

function nav(user) {
  const navItemsList = getNavItems(user);
  const adminItemsList = getAdminItems(user);
  const navLinks = navItemsList.map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  const adminLinks = adminItemsList.map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  const mobileItems = [...navItemsList, ...adminItemsList].map(n => `<a href="${n.href}" class="mobile-nav-item">${n.label}</a>`).join('');
  return `<nav class="navbar bg-white shadow-sm px-4">
  <div class="navbar-start">
    <button id="mobile-menu-btn" class="btn btn-ghost btn-sm mobile-menu-toggle" onclick="toggleMobileMenu()">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <a href="/" class="font-bold text-lg">Platform</a>
    <div class="hidden md:flex gap-1 ml-6">${navLinks}${adminLinks}</div>
  </div>
  <div class="navbar-end">
    <div id="user-dropdown" class="dropdown dropdown-end">
      <button type="button" onclick="toggleUserMenu(event)" class="btn btn-ghost btn-circle avatar placeholder" style="cursor:pointer">
        <div class="bg-primary text-white rounded-full w-10 flex items-center justify-content-center" style="display:flex;align-items:center;justify-content:center;height:2.5rem">
          <span>${user?.name?.charAt(0) || 'U'}</span>
        </div>
      </button>
      <ul class="dropdown-menu mt-2 w-52">
        <li class="dropdown-header">${user?.email || ''}<br/><small class="text-gray-500">${user?.role || ''}</small></li>
        <li><a href="/api/auth/logout">Logout</a></li>
      </ul>
    </div>
  </div>
</nav>
<div id="mobile-nav-overlay" class="mobile-nav-overlay" onclick="closeMobileMenu()"></div>
<div id="mobile-nav-drawer" class="mobile-nav-drawer">
  <div class="mobile-nav-header">
    <span class="font-bold text-lg">Platform</span>
    <button class="btn btn-ghost btn-sm" onclick="closeMobileMenu()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="mobile-nav-items">${mobileItems}</div>
  <div class="mobile-nav-footer">
    <div class="text-sm text-gray-500">${user?.email || ''}</div>
    <a href="/api/auth/logout" class="btn btn-ghost btn-sm w-full mt-2">Logout</a>
  </div>
</div>
<div id="idle-warning-dialog" class="confirm-overlay" style="display:none">
  <div class="confirm-dialog">
    <div class="confirm-title">Session Expiring</div>
    <div class="confirm-message">Your session will expire due to inactivity. You will be logged out in <span id="idle-countdown">5:00</span>.</div>
    <div class="confirm-actions"><button onclick="stayLoggedIn()" class="btn btn-primary">Stay Logged In</button></div>
  </div>
</div>
<script>
function toggleUserMenu(e){e.stopPropagation();document.getElementById('user-dropdown').classList.toggle('open')}
document.addEventListener('click',function(e){var d=document.getElementById('user-dropdown');if(d&&!d.contains(e.target))d.classList.remove('open')});
function toggleMobileMenu(){document.getElementById('mobile-nav-drawer').classList.toggle('open');document.getElementById('mobile-nav-overlay').classList.toggle('open')}
function closeMobileMenu(){document.getElementById('mobile-nav-drawer').classList.remove('open');document.getElementById('mobile-nav-overlay').classList.remove('open')}
(function(){var WARN_MS=25*60*1000,LOGOUT_MS=30*60*1000,last=Date.now(),warnTimer=null,logoutTimer=null,countdownId=null;
function reset(){last=Date.now();hideWarning();clearTimers();schedule()}
function schedule(){warnTimer=setTimeout(showWarning,WARN_MS);logoutTimer=setTimeout(doLogout,LOGOUT_MS)}
function clearTimers(){if(warnTimer){clearTimeout(warnTimer);warnTimer=null}if(logoutTimer){clearTimeout(logoutTimer);logoutTimer=null}if(countdownId){clearInterval(countdownId);countdownId=null}}
function showWarning(){var dlg=document.getElementById('idle-warning-dialog');if(dlg)dlg.style.display='flex';var remaining=LOGOUT_MS-(Date.now()-last);countdownId=setInterval(function(){remaining-=1000;if(remaining<=0){clearInterval(countdownId);doLogout();return}var m=Math.floor(remaining/60000),s=Math.floor((remaining%60000)/1000);var el=document.getElementById('idle-countdown');if(el)el.textContent=m+':'+(s<10?'0':'')+s},1000)}
function hideWarning(){var dlg=document.getElementById('idle-warning-dialog');if(dlg)dlg.style.display='none'}
function doLogout(){clearTimers();window.location.href='/api/auth/logout'}
window.stayLoggedIn=function(){fetch('/api/auth/me',{credentials:'same-origin'}).catch(function(){});reset()};
['mousemove','keypress','click','scroll','touchstart'].forEach(function(evt){document.addEventListener(evt,function(){var now=Date.now();if(now-last>60000){last=now;clearTimers();schedule()}else{last=now}},true)});
schedule()})();
</script>`;
}

function page(user, title, bc, content, scripts = []) {
  const authData = user ? JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }) : 'null';
  const authScript = `window.__AUTH__=${authData};`;
  const body = `<div class="min-h-screen">${nav(user)}<div class="p-6">${breadcrumb(bc)}${content}</div></div>`;
  return generateHtml(title, body, [authScript, ...scripts]);
}

function statCards(cards) {
  return `<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">${cards.map(c =>
    `<div class="card bg-white shadow${c.border || ''}"><div class="card-body"><h3 class="text-gray-500 text-sm">${c.label}</h3><p class="text-2xl font-bold${c.textClass || ''}">${c.value}</p>${c.sub ? `<p class="text-xs text-gray-500 mt-2">${c.sub}</p>` : ''}</div></div>`
  ).join('')}</div>`;
}

function confirmDialog(entityName) {
  return `<div id="confirm-dialog" class="confirm-overlay" style="display:none">
    <div class="confirm-dialog"><div class="confirm-title">Confirm Delete</div>
    <div class="confirm-message">Are you sure you want to delete this item? This action cannot be undone.</div>
    <div class="confirm-actions"><button onclick="cancelDelete()" class="btn btn-ghost">Cancel</button>
    <button id="confirm-delete-btn" onclick="executeDelete()" class="btn btn-error">Delete</button></div></div></div>`;
}

function dataTable(headers, rows, emptyMsg) {
  return `<div class="card bg-white shadow" style="overflow-x:auto"><table class="table table-zebra w-full"><thead><tr>${headers}</tr></thead><tbody id="table-body">${rows || `<tr><td colspan="100" class="text-center py-8 text-gray-500">${emptyMsg}</td></tr>`}</tbody></table></div>`;
}

export function renderAccessDenied(user, entityName, action) {
  const txt = { list: 'view this list', view: 'view this item', create: 'create items here', edit: 'edit this item', delete: 'delete this item' };
  const body = `<div class="min-h-screen">${nav(user)}<div class="access-denied"><div class="access-denied-icon">&#128274;</div><h1>Access Denied</h1><p>You do not have permission to ${txt[action] || action} in ${entityName}.</p><a href="/" class="btn btn-primary">Return to Dashboard</a></div></div>`;
  return generateHtml('Access Denied', body);
}

export function renderLogin(error = null) {
  const errHtml = error ? `<div class="alert alert-error mb-4">${error}</div>` : '';
  const body = `<div class="center-screen"><div class="card w-96 bg-white shadow-lg"><div class="card-body">
    <div class="text-center mb-6"><div class="avatar placeholder mb-2"><div class="bg-primary text-white rounded-lg w-12"><span class="text-xl font-bold">P</span></div></div>
    <h2 class="card-title justify-center">Welcome back</h2><p class="text-gray-500 text-sm">Sign in to your account</p></div>${errHtml}
    <form method="POST" action="/api/auth/login"><div class="form-group"><label class="form-label" for="email">Email</label><input type="email" name="email" id="email" class="input input-bordered w-full" placeholder="Enter your email" required/></div>
    <div class="form-group mt-4"><label class="form-label" for="password">Password</label><input type="password" name="password" id="password" class="input input-bordered w-full" placeholder="Enter your password" required/></div>
    <button type="submit" class="btn btn-primary w-full mt-6">Sign in</button></form>
    <div class="text-center mt-4"><a href="/password-reset" class="text-sm text-primary hover:underline">Forgot password?</a></div>
    <div class="text-center mt-2 text-sm text-gray-500">Demo: <code class="text-xs">admin@example.com / password</code></div></div></div></div>`;
  const script = `const form=document.querySelector('form');form.addEventListener('submit',async(e)=>{e.preventDefault();const btn=form.querySelector('button[type="submit"]');btn.classList.add('loading');btn.disabled=true;try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email.value,password:form.password.value})});const data=await res.json();if(res.ok){window.location.href=data.redirect||'/'}else{const d=document.createElement('div');d.className='alert alert-error mb-4';d.textContent=data.error||'Login failed';const x=form.parentElement.querySelector('.alert');if(x)x.remove();form.parentElement.insertBefore(d,form)}}catch(err){alert('Network error: '+err.message)}finally{btn.classList.remove('loading');btn.disabled=false}})`;
  return generateHtml('Login', body, [script]);
}

export function renderPasswordReset() {
  const body = `<div class="center-screen"><div class="card w-96 bg-white shadow-lg"><div class="card-body">
    <div class="text-center mb-6"><h2 class="card-title justify-center">Reset Password</h2><p class="text-gray-500 text-sm">Enter your email to receive a reset link</p></div>
    <div id="reset-success" style="display:none" class="alert alert-success mb-4">If an account exists with that email, a password reset link has been sent.</div>
    <form id="reset-form"><div class="form-group"><label class="form-label" for="email">Email</label><input type="email" name="email" id="email" class="input input-bordered w-full" placeholder="Enter your email" required/></div>
    <button type="submit" id="reset-btn" class="btn btn-primary w-full mt-6">Send Reset Link</button></form>
    <div class="text-center mt-4"><a href="/login" class="text-sm text-primary hover:underline">Back to login</a></div></div></div></div>`;
  const script = `var form=document.getElementById('reset-form');form.addEventListener('submit',async function(e){e.preventDefault();var btn=document.getElementById('reset-btn');btn.classList.add('btn-loading');btn.disabled=true;try{var res=await fetch('/api/auth/password-reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email.value})});if(res.ok){form.style.display='none';document.getElementById('reset-success').style.display='block'}else{var d=await res.json().catch(function(){return{}});var el=document.createElement('div');el.className='alert alert-error mb-4';el.textContent=d.error||'Request failed';var old=form.parentElement.querySelector('.alert-error');if(old)old.remove();form.parentElement.insertBefore(el,form)}}catch(err){alert('Network error: '+err.message)}finally{btn.classList.remove('btn-loading');btn.disabled=false}})`;
  return generateHtml('Reset Password', body, [script]);
}

export function renderPasswordResetConfirm(token) {
  const body = `<div class="center-screen"><div class="card w-96 bg-white shadow-lg"><div class="card-body">
    <div class="text-center mb-6"><h2 class="card-title justify-center">Set New Password</h2><p class="text-gray-500 text-sm">Enter your new password below</p></div>
    <div id="confirm-success" style="display:none" class="alert alert-success mb-4">Password updated successfully. <a href="/login" class="text-primary underline">Sign in</a></div>
    <form id="confirm-form"><input type="hidden" name="token" value="${token}"/>
    <div class="form-group"><label class="form-label" for="password">New Password</label><input type="password" name="password" id="password" class="input input-bordered w-full" placeholder="Enter new password" minlength="8" required/></div>
    <div class="form-group mt-4"><label class="form-label" for="confirm_password">Confirm Password</label><input type="password" name="confirm_password" id="confirm_password" class="input input-bordered w-full" placeholder="Confirm new password" minlength="8" required/></div>
    <button type="submit" id="confirm-btn" class="btn btn-primary w-full mt-6">Update Password</button></form>
    <div class="text-center mt-4"><a href="/login" class="text-sm text-primary hover:underline">Back to login</a></div></div></div></div>`;
  const script = `var form=document.getElementById('confirm-form');form.addEventListener('submit',async function(e){e.preventDefault();var pw=form.password.value,cpw=form.confirm_password.value;if(pw!==cpw){alert('Passwords do not match');return}var btn=document.getElementById('confirm-btn');btn.classList.add('btn-loading');btn.disabled=true;try{var res=await fetch('/api/auth/password-reset',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:form.token.value,password:pw})});var data=await res.json().catch(function(){return{}});if(res.ok){form.style.display='none';document.getElementById('confirm-success').style.display='block'}else{var el=document.createElement('div');el.className='alert alert-error mb-4';el.textContent=data.error||'Reset failed';var old=form.parentElement.querySelector('.alert-error');if(old)old.remove();form.parentElement.insertBefore(el,form)}}catch(err){alert('Network error: '+err.message)}finally{btn.classList.remove('btn-loading');btn.disabled=false}})`;
  return generateHtml('Set New Password', body, [script]);
}

export function renderDashboard(user, stats = {}) {
  const isClerk = user?.role === 'clerk';
  const welcomeMsg = isClerk ? 'Here are your assigned tasks' : (user?.role === 'manager' ? 'Team overview' : 'System overview');
  const myRfis = (stats.myRfis?.length > 0) ? `<div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">My Assigned RFIs</h2><div class="mt-4">${dataTable('<th>Title</th><th>Status</th><th>Due Date</th><th>Action</th>',
    stats.myRfis.map(r => `<tr><td>${r.title || 'Untitled'}</td><td><span class="badge badge-sm">${r.status || 'open'}</span></td><td>${r.due_date ? new Date(r.due_date * 1000).toLocaleDateString() : '-'}</td><td><a href="/rfi/${r.id}" class="btn btn-xs btn-primary">View</a></td></tr>`).join(''), '')}</div></div>` : '';
  const overdue = (stats.overdueRfis?.length > 0) ? `<div class="card bg-white shadow border-l-4 border-red-500"><div class="card-body"><h2 class="card-title text-red-600">Overdue Items</h2><div class="mt-4">${dataTable('<th>Title</th><th>Days Overdue</th><th>Action</th>',
    stats.overdueRfis.map(r => `<tr class="text-red-600"><td>${r.title || 'Untitled RFI'}</td><td>${r.daysOverdue || 0} days</td><td><a href="/rfi/${r.id}" class="btn btn-xs btn-error">View</a></td></tr>`).join(''), '')}</div></div>` : '';
  const cards = statCards([
    { label: isClerk ? 'My RFIs' : 'Engagements', value: isClerk ? (stats.myRfis?.length || 0) : (stats.engagements || 0) },
    { label: 'Clients', value: stats.clients || 0 },
    { label: (stats.overdueRfis?.length > 0) ? 'Overdue RFIs' : 'Open RFIs', value: (stats.overdueRfis?.length > 0) ? stats.overdueRfis.length : (stats.rfis || 0), border: (stats.overdueRfis?.length > 0) ? ' border-l-4 border-red-500' : '', textClass: (stats.overdueRfis?.length > 0) ? ' text-red-600' : '' },
    { label: 'Reviews', value: stats.reviews || 0 },
  ]);
  const actions = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">Quick Actions</h2><div class="flex flex-wrap gap-2 mt-4">${getQuickActions(user).map(a => `<a href="${a.href}" class="btn ${a.primary ? 'btn-primary' : 'btn-outline'} btn-sm">${a.label}</a>`).join('')}</div></div></div>
    <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">Navigation</h2><div class="flex flex-wrap gap-2 mt-4">${getNavItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('')}</div></div></div></div>`;
  const content = `<div class="mb-6"><h1 class="text-2xl font-bold">Dashboard</h1><p class="text-gray-500">Welcome back, ${user?.name || 'User'}. ${welcomeMsg}</p></div>${cards}${overdue}${myRfis}${actions}`;
  return page(user, 'Dashboard', [{ href: '/', label: 'Dashboard' }], content);
}

export function renderEntityList(entityName, items, spec, user) {
  const label = spec?.labelPlural || spec?.label || entityName;
  const fields = spec?.fields || {};
  let listFields = Object.entries(fields).filter(([k, f]) => f.list).slice(0, 5);
  if (!listFields.length) listFields = Object.entries(fields).filter(([k]) => !['created_by', 'updated_by'].includes(k)).slice(0, 6);
  if (!listFields.length && items.length > 0) listFields = Object.keys(items[0]).filter(k => !['created_by', 'updated_by'].includes(k)).slice(0, 5).map(k => [k, { label: k }]);
  const headers = listFields.map(([k, f]) => `<th>${f?.label || k}</th>`).join('') + '<th>Actions</th>';
  const userCanEdit = canEdit(user, entityName);
  const userCanDelete = canDelete(user, entityName);
  const userCanCreate = canCreate(user, entityName);
  const rows = items.map(item => {
    const cells = listFields.map(([k]) => `<td>${fmtVal(item[k], k, item)}</td>`).join('');
    const editBtn = userCanEdit ? `<a href="/${entityName}/${item.id}/edit" class="btn btn-xs btn-outline">Edit</a>` : `<span class="btn btn-xs btn-outline btn-disabled tooltip" data-tip="No permission">Edit</span>`;
    const delBtn = userCanDelete ? `<button onclick="event.stopPropagation();confirmDelete('${item.id}')" class="btn btn-xs btn-error btn-outline">Delete</button>` : `<span class="btn btn-xs btn-error btn-outline btn-disabled tooltip" data-tip="No permission">Delete</span>`;
    return `<tr class="hover cursor-pointer" data-searchable onclick="window.location='/${entityName}/${item.id}'">${cells}<td class="flex gap-1"><a href="/${entityName}/${item.id}" class="btn btn-xs btn-ghost">View</a>${editBtn}${delBtn}</td></tr>`;
  }).join('');
  const emptyMsg = userCanCreate ? `No items found. <a href="/${entityName}/new" class="text-primary hover:underline">Create your first ${label.toLowerCase()}</a>` : 'No items found.';
  const createBtn = userCanCreate ? `<a href="/${entityName}/new" class="btn btn-primary btn-sm">Create New</a>` : '';
  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">${label}</h1><div class="flex gap-2"><input type="text" id="search-input" placeholder="Search..." class="input input-bordered input-sm" style="width:200px"/>${createBtn}</div></div>
    ${dataTable(headers, rows, emptyMsg)}${userCanDelete ? confirmDialog(entityName) : ''}`;
  const deleteScript = `let pendingDeleteId=null;window.confirmDelete=(id)=>{pendingDeleteId=id;document.getElementById('confirm-dialog').style.display='flex'};window.cancelDelete=()=>{pendingDeleteId=null;document.getElementById('confirm-dialog').style.display='none'};window.executeDelete=async()=>{if(!pendingDeleteId)return;const btn=document.getElementById('confirm-delete-btn');btn.classList.add('btn-loading');btn.textContent='Deleting...';try{const res=await fetch('/api/${entityName}/'+pendingDeleteId,{method:'DELETE'});if(res.ok){showToast('Deleted successfully','success');setTimeout(()=>window.location.reload(),500)}else{const d=await res.json().catch(()=>({}));showToast(d.message||d.error||'Delete failed','error');cancelDelete();btn.classList.remove('btn-loading');btn.textContent='Delete'}}catch(err){showToast('Error: '+err.message,'error');cancelDelete();btn.classList.remove('btn-loading');btn.textContent='Delete'}}`;
  const searchScript = `const si=document.getElementById('search-input');const tb=document.getElementById('table-body');const rows=Array.from(tb.querySelectorAll('tr[data-searchable]'));si.addEventListener('input',(e)=>{const t=e.target.value.toLowerCase();rows.forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(t)?'':'none'})})`;
  return page(user, label, [{ href: '/', label: 'Dashboard' }, { href: `/${entityName}`, label }], content, [TOAST_SCRIPT, deleteScript, searchScript]);
}

export function renderEntityDetail(entityName, item, spec, user) {
  const label = spec?.label || entityName;
  const fields = spec?.fields || {};
  const userCanEdit = canEdit(user, entityName);
  const userCanDelete = canDelete(user, entityName);
  const fieldRows = Object.entries(fields).filter(([k]) => k !== 'id' && item[k] !== undefined).map(([k, f]) =>
    `<div class="py-2 border-b"><span class="text-gray-500 text-sm">${f.label || k}</span><p class="font-medium">${fmtVal(item[k], k, item)}</p></div>`
  ).join('');
  const editBtn = userCanEdit ? `<a href="/${entityName}/${item.id}/edit" class="btn btn-outline">Edit</a>` : `<span class="btn btn-outline btn-disabled tooltip" data-tip="No permission">Edit</span>`;
  const delBtn = userCanDelete ? `<button onclick="showDeleteConfirm()" class="btn btn-error btn-outline">Delete</button>` : `<span class="btn btn-error btn-outline btn-disabled tooltip" data-tip="No permission">Delete</span>`;
  const content = `<div class="flex justify-between items-center mb-6"><div><h1 class="text-2xl font-bold">${item.name || item.title || label}</h1><p class="text-gray-500 text-sm">ID: ${item.id}</p></div><div class="flex gap-2">${editBtn}${delBtn}</div></div>
    <div class="card bg-white shadow"><div class="card-body">${fieldRows}</div></div>${userCanDelete ? confirmDialog(entityName) : ''}`;
  const script = `${TOAST_SCRIPT}window.showDeleteConfirm=()=>{document.getElementById('confirm-dialog').style.display='flex'};window.hideDeleteConfirm=()=>{document.getElementById('confirm-dialog').style.display='none'};window.executeDelete=async()=>{const btn=document.getElementById('confirm-delete-btn');btn.classList.add('btn-loading');btn.textContent='Deleting...';try{const res=await fetch('/api/${entityName}/${item.id}',{method:'DELETE'});if(res.ok){showToast('Deleted successfully','success');setTimeout(()=>{window.location='/${entityName}'},500)}else{const d=await res.json().catch(()=>({}));showToast(d.message||d.error||'Delete failed','error');hideDeleteConfirm();btn.classList.remove('btn-loading');btn.textContent='Delete'}}catch(err){showToast('Error: '+err.message,'error');hideDeleteConfirm();btn.classList.remove('btn-loading');btn.textContent='Delete'}}`;
  const bc = [{ href: '/', label: 'Dashboard' }, { href: `/${entityName}`, label: spec?.labelPlural || label }, { href: `/${entityName}/${item.id}`, label: item.name || item.title || `#${item.id}` }];
  return page(user, `${label} Detail`, bc, content, [script]);
}

export function renderEntityForm(entityName, item, spec, user, isNew = false, refOptions = {}) {
  const label = spec?.label || entityName;
  const fields = spec?.fields || {};
  const formFields = Object.entries(fields).filter(([k, f]) => k !== 'id' && !f.auto && !f.readOnly && k !== 'password_hash').map(([k, f]) => {
    const val = item?.[k] ?? f.default ?? '';
    const req = f.required ? 'required' : '';
    const reqM = f.required ? '<span class="required-marker">*</span>' : '';
    const type = f.type === 'number' || f.type === 'int' ? 'number' : f.type === 'email' ? 'email' : f.type === 'timestamp' || f.type === 'date' ? 'date' : f.type === 'bool' ? 'checkbox' : 'text';
    if (entityName === 'user' && k === 'role') {
      const opts = ['partner','manager','clerk','client_admin','client_user'].map(o => `<option value="${o}" ${val===o?'selected':''}>${o.charAt(0).toUpperCase()+o.slice(1).replace('_',' ')}</option>`).join('');
      return `<div class="form-group"><label class="form-label">Role${reqM}</label><select name="role" class="select select-bordered w-full" ${req}>${opts}</select></div>`;
    }
    if (entityName === 'user' && k === 'status') {
      const opts = ['active','inactive','pending'].map(o => `<option value="${o}" ${val===o?'selected':''}>${o.charAt(0).toUpperCase()+o.slice(1)}</option>`).join('');
      return `<div class="form-group"><label class="form-label">Status</label><select name="status" class="select select-bordered w-full">${opts}</select></div>`;
    }
    if (f.type === 'ref' && refOptions[k]) {
      const opts = refOptions[k].map(o => `<option value="${o.value}" ${val===o.value?'selected':''}>${o.label}</option>`).join('');
      return `<div class="form-group"><label class="form-label">${f.label||k}${reqM}</label><select name="${k}" class="select select-bordered w-full" ${req}><option value="">Select...</option>${opts}</select></div>`;
    }
    if (f.type === 'textarea') return `<div class="form-group"><label class="form-label">${f.label||k}${reqM}</label><textarea name="${k}" class="textarea textarea-bordered w-full" ${req}>${val}</textarea></div>`;
    if (f.type === 'bool') return `<div class="form-group"><label class="flex items-center gap-2"><input type="checkbox" name="${k}" class="checkbox" ${val?'checked':''}/><span>${f.label||k}</span></label></div>`;
    if (f.type === 'enum' && f.options) {
      const opts = (Array.isArray(f.options) ? f.options : []).map(o => { const ov = typeof o === 'string' ? o : o.value; const ol = typeof o === 'string' ? o : o.label; return `<option value="${ov}" ${val===ov?'selected':''}>${ol}</option>`; }).join('');
      return `<div class="form-group"><label class="form-label">${f.label||k}${reqM}</label><select name="${k}" class="select select-bordered w-full" ${req}><option value="">Select...</option>${opts}</select></div>`;
    }
    return `<div class="form-group"><label class="form-label">${f.label||k}${reqM}</label><input type="${type}" name="${k}" value="${val}" class="input input-bordered w-full" ${req}/></div>`;
  }).join('\n');
  const pwField = entityName === 'user' ? `<div class="form-group"><label class="form-label">New Password <small class="text-gray-500">(leave blank to keep unchanged)</small></label><input type="password" name="new_password" class="input input-bordered w-full" placeholder="Enter new password" autocomplete="new-password"/></div>` : '';
  const bc = isNew
    ? [{ href: '/', label: 'Dashboard' }, { href: `/${entityName}`, label: spec?.labelPlural || label }, { label: 'Create' }]
    : [{ href: '/', label: 'Dashboard' }, { href: `/${entityName}`, label: spec?.labelPlural || label }, { href: `/${entityName}/${item?.id}`, label: item?.name || item?.title || `#${item?.id}` }, { label: 'Edit' }];
  const content = `<div class="mb-6"><h1 class="text-2xl font-bold">${isNew ? 'Create' : 'Edit'} ${label}</h1></div>
    <div class="card bg-white shadow max-w-2xl"><div class="card-body"><form id="entity-form" class="space-y-4">${formFields}${pwField}
    <div class="flex gap-2 pt-4"><button type="submit" id="submit-btn" class="btn btn-primary"><span class="btn-text">Save</span><span class="btn-loading-text" style="display:none">Saving...</span></button>
    <a href="/${entityName}${isNew ? '' : '/' + item?.id}" class="btn btn-ghost">Cancel</a></div></form></div></div>`;
  const script = `${TOAST_SCRIPT}const form=document.getElementById('entity-form');const sb=document.getElementById('submit-btn');form.addEventListener('submit',async(e)=>{e.preventDefault();sb.classList.add('btn-loading');sb.querySelector('.btn-text').style.display='none';sb.querySelector('.btn-loading-text').style.display='inline';sb.disabled=true;const fd=new FormData(form);const data={};for(const[k,v]of fd.entries())data[k]=v;form.querySelectorAll('input[type=checkbox]').forEach(cb=>{data[cb.name]=cb.checked});form.querySelectorAll('input[type=number]').forEach(inp=>{if(inp.name&&data[inp.name]!==undefined&&data[inp.name]!=='')data[inp.name]=Number(data[inp.name])});const url=${isNew}?'/api/${entityName}':'/api/${entityName}/${item?.id}';const method=${isNew}?'POST':'PUT';try{const res=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await res.json();if(res.ok){showToast('${isNew?'Created':'Updated'} successfully!','success');const ed=result.data||result;setTimeout(()=>{window.location='/${entityName}/'+(ed.id||'${item?.id}')},500)}else{showToast(result.message||result.error||'Save failed','error');sb.classList.remove('btn-loading');sb.querySelector('.btn-text').style.display='inline';sb.querySelector('.btn-loading-text').style.display='none';sb.disabled=false}}catch(err){showToast('Error: '+err.message,'error');sb.classList.remove('btn-loading');sb.querySelector('.btn-text').style.display='inline';sb.querySelector('.btn-loading-text').style.display='none';sb.disabled=false}})`;
  return page(user, `${isNew ? 'Create' : 'Edit'} ${label}`, bc, content, [script]);
}

export function renderSettings(user, config = {}) {
  const t = config.thresholds || {};
  const sections = [
    { title: 'System Information', items: [['Database Type', config.database?.type || 'SQLite'], ['Server Port', config.server?.port || 3004], ['Session TTL', (t.cache?.session_ttl_seconds || 3600) + 's'], ['Page Size (Default)', t.system?.default_page_size || 50], ['Page Size (Max)', t.system?.max_page_size || 500]] },
    { title: 'RFI Configuration', items: [['Max Days Outstanding', (t.rfi?.max_days_outstanding || 90) + ' days'], ['Escalation Delay', (t.rfi?.escalation_delay_hours || 24) + ' hours'], ['Notification Days', (t.rfi?.notification_days || [7,3,1,0]).join(', ')]] },
    { title: 'Email Configuration', items: [['Batch Size', t.email?.send_batch_size || 10], ['Max Retries', t.email?.send_max_retries || 3], ['Rate Limit Delay', (t.email?.rate_limit_delay_ms || 6000) + 'ms']] },
    { title: 'Workflow Configuration', items: [['Stage Transition Lockout', (t.workflow?.stage_transition_lockout_minutes || 5) + ' minutes'], ['Collaborator Default Expiry', (t.collaborator?.default_expiry_days || 7) + ' days'], ['Collaborator Max Expiry', (t.collaborator?.max_expiry_days || 30) + ' days']] },
  ];
  const cards = sections.map(s => `<div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">${s.title}</h2><div class="space-y-4 mt-4">${s.items.map(([l, v]) => `<div class="flex justify-between py-2 border-b"><span class="text-gray-500">${l}</span><span class="font-medium">${v}</span></div>`).join('')}</div></div></div>`).join('');
  return page(user, 'System Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }],
    `<h1 class="text-2xl font-bold mb-6">System Settings</h1><div class="grid grid-cols-1 lg:grid-cols-2 gap-6">${cards}</div>`);
}

export function renderAuditDashboard(user, auditData = {}) {
  const { summary = {}, recentActivity = [] } = auditData;
  const actRows = recentActivity.slice(0, 20).map(a => `<tr><td>${new Date((a.timestamp||a.created_at)*1000).toLocaleString()}</td><td><span class="badge badge-sm">${a.action||'-'}</span></td><td>${a.entity_type||'-'}</td><td class="text-xs">${a.entity_id||'-'}</td><td>${a.user_name||a.user_id||'-'}</td><td class="text-xs text-gray-500">${a.reason||'-'}</td></tr>`).join('') || '<tr><td colspan="6" class="text-center py-4 text-gray-500">No audit records found</td></tr>';
  const cards = statCards([
    { label: 'Total Actions (30d)', value: summary.total_actions || 0 },
    { label: 'Permission Grants', value: summary.grants || 0, textClass: ' text-green-600' },
    { label: 'Permission Revokes', value: summary.revokes || 0, textClass: ' text-red-600' },
    { label: 'Role Changes', value: summary.role_changes || 0, textClass: ' text-blue-600' },
  ]);
  const content = `<h1 class="text-2xl font-bold mb-6">Audit Dashboard</h1>${cards}
    <div class="card bg-white shadow"><div class="card-body"><div class="flex justify-between items-center mb-4"><h2 class="card-title">Recent Activity</h2><a href="/permission_audit" class="btn btn-sm btn-outline">View All Records</a></div>
    <div style="overflow-x:auto">${dataTable('<th>Time</th><th>Action</th><th>Entity Type</th><th>Entity ID</th><th>User</th><th>Reason</th>', actRows, 'No audit records')}</div></div></div>`;
  return page(user, 'Audit Dashboard', [{ href: '/', label: 'Dashboard' }, { href: '/admin/audit', label: 'Audit' }], content);
}

export function renderSystemHealth(user, healthData = {}) {
  const { database = {}, server: srv = {}, entities = {} } = healthData;
  const entRows = Object.entries(entities).map(([n, c]) => `<tr><td>${n}</td><td class="text-right">${c}</td></tr>`).join('') || '<tr><td colspan="2" class="text-center py-4">No data</td></tr>';
  const cards = statCards([
    { label: 'Server Status', value: 'Online', textClass: ' text-green-600', sub: `Port: ${srv.port || 3004}` },
    { label: 'Database', value: database.status || 'Connected', textClass: ' text-green-600', sub: `Size: ${database.size || 'N/A'}` },
    { label: 'Uptime', value: srv.uptime || 'N/A', sub: `Started: ${srv.startTime || 'N/A'}` },
  ]);
  const content = `<h1 class="text-2xl font-bold mb-6">System Health</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">${cards.replace('md:grid-cols-4', 'md:grid-cols-3')}</div>
    <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title mb-4">Entity Counts</h2><table class="table w-full"><thead><tr><th>Entity</th><th class="text-right">Count</th></tr></thead><tbody>${entRows}</tbody></table></div></div>`;
  return page(user, 'System Health', [{ href: '/', label: 'Dashboard' }, { href: '/admin/health', label: 'Health' }], content);
}

export function linearProgress(value = 0, max = 100, label = '', variant = 'medium') {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const h = variant === 'thin' ? '4px' : variant === 'thick' ? '16px' : '8px';
  const color = pct < 30 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#22c55e';
  return `<div class="linear-progress-wrap">
    ${label ? `<span class="progress-label">${label}</span>` : ''}
    <div class="linear-progress" style="height:${h}">
      <div class="linear-progress-bar" style="width:${pct}%;height:100%;background:${color}"></div>
    </div>
    <span class="progress-pct" style="color:${color}">${pct}%</span>
  </div>`;
}

export function circularProgress(value = 0, max = 100, label = '') {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = pct < 30 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#22c55e';
  const r = 40, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ;
  return `<div class="circular-progress" style="width:100px;height:100px">
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="8"/>
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="8"
        stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
    </svg>
    <div class="circular-progress-text">
      <span class="circular-progress-pct">${pct}%</span>
      ${label ? `<span class="circular-progress-label">${label}</span>` : ''}
    </div>
  </div>`;
}

export function engagementProgress(stage, stages = null) {
  const stageKeys = stages || Object.keys(STAGE_COLORS);
  const activeIdx = stageKeys.indexOf(stage);
  const pills = stageKeys.map((key, i) => {
    const s = STAGE_COLORS[key] || { bg: '#f3f4f6', text: '#4b5563', label: key };
    const cls = i === activeIdx ? 'stage-active' : i < activeIdx ? 'stage-completed' : '';
    return `<div class="stage-pill ${cls}" style="background:${s.bg};color:${s.text}">${s.label}</div>`;
  }).join('');
  return `<div class="engagement-pipeline">${pills}</div>`;
}

export function emptyState(icon = '', title = '', message = '', actionHref = '', actionLabel = '') {
  const btn = actionHref && actionLabel ? `<a href="${actionHref}" class="btn btn-primary btn-sm">${actionLabel}</a>` : '';
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <div class="empty-state-title">${title}</div>
    <div class="empty-state-msg">${message}</div>
    ${btn}
  </div>`;
}

export function sortableList(items = [], containerId = 'sortable') {
  const lis = items.map((item, i) =>
    `<li class="sortable-item" draggable="true" data-index="${i}"><span class="sortable-handle">&#9776;</span><span>${typeof item === 'string' ? item : item.label || item.name || ''}</span></li>`
  ).join('');
  const script = `(function(){const c=document.getElementById('${containerId}');let dragged=null;
c.addEventListener('dragstart',e=>{dragged=e.target.closest('.sortable-item');e.dataTransfer.effectAllowed='move'});
c.addEventListener('dragover',e=>{e.preventDefault();const t=e.target.closest('.sortable-item');if(t&&t!==dragged)t.classList.add('drag-over')});
c.addEventListener('dragleave',e=>{const t=e.target.closest('.sortable-item');if(t)t.classList.remove('drag-over')});
c.addEventListener('drop',e=>{e.preventDefault();const t=e.target.closest('.sortable-item');if(t&&t!==dragged){t.classList.remove('drag-over');c.insertBefore(dragged,t.nextSibling);
const order=[...c.querySelectorAll('.sortable-item')].map(el=>+el.dataset.index);
c.dispatchEvent(new CustomEvent('sortable-reorder',{detail:{order}}))}});})();`;
  return `<ul id="${containerId}" class="sortable-list">${lis}</ul><script>${script}</script>`;
}

export function responseChoiceBox(name, options = [], selected = null, type = 'radio') {
  const sel = Array.isArray(selected) ? selected : (selected != null ? [selected] : []);
  const items = options.map((opt) => {
    const val = typeof opt === 'string' ? opt : opt.value || opt;
    const lbl = typeof opt === 'string' ? opt : opt.label || opt.value || opt;
    const checked = sel.includes(val) ? 'checked' : '';
    return `<label class="choice-option"><input type="${type}" name="${name}" value="${val}" ${checked}/><span class="choice-label">${lbl}</span></label>`;
  }).join('');
  return `<div class="choice-group">${items}</div>`;
}

export function responseAttachment(file = {}) {
  const name = file.name || file.filename || 'Unnamed';
  const size = file.size ? (file.size < 1024 ? file.size + ' B' : file.size < 1048576 ? (file.size / 1024).toFixed(1) + ' KB' : (file.size / 1048576).toFixed(1) + ' MB') : '';
  const href = file.url || file.path || '#';
  const ext = name.split('.').pop().toLowerCase();
  const isImg = ['png','jpg','jpeg','gif','webp','svg'].includes(ext);
  const isPdf = ext === 'pdf';
  const icon = isImg ? '&#128444;' : isPdf ? '&#128196;' : '&#128206;';
  const preview = isImg ? `<img src="${href}" alt="${name}" class="attachment-preview"/>` : isPdf ? `<iframe src="${href}" class="attachment-preview" style="width:100%;height:200px;border:none"></iframe>` : '';
  return `<div class="attachment-card">
    <span class="attachment-icon">${icon}</span>
    <div class="attachment-info">
      <div class="attachment-name">${name}</div>
      ${size ? `<div class="attachment-size">${size}</div>` : ''}
      ${preview}
    </div>
    <a href="${href}" download class="btn btn-ghost btn-xs">Download</a>
  </div>`;
}

const AVATAR_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1','#14b8a6','#e11d48'];
const AVATAR_SIZES = { sm: 24, md: 32, lg: 40, xl: 48 };

function nameHash(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

export function getUserAvatarUrl(user) {
  const name = user?.name || user?.email || 'User';
  const initials = getInitials(name);
  const color = AVATAR_COLORS[nameHash(name) % AVATAR_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" rx="24" fill="${color}"/><text x="24" y="24" dy=".35em" text-anchor="middle" fill="white" font-family="sans-serif" font-size="18" font-weight="600">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function userAvatar(user, size = 'md', showStatus = false) {
  const px = AVATAR_SIZES[size] || AVATAR_SIZES.md;
  const name = user?.name || user?.email || 'User';
  const initials = getInitials(name);
  const color = AVATAR_COLORS[nameHash(name) % AVATAR_COLORS.length];
  const fontSize = Math.round(px * 0.4);
  const statusDot = showStatus ? `<span class="avatar-status avatar-status-${user?.status === 'active' || user?.online ? 'online' : 'offline'}" style="width:${Math.round(px * 0.3)}px;height:${Math.round(px * 0.3)}px"></span>` : '';
  return `<span class="user-avatar user-avatar-${size}" style="width:${px}px;height:${px}px;background:${color};font-size:${fontSize}px" title="${name}">${initials}${statusDot}</span>`;
}

export function teamAvatarGroup(users = [], maxShow = 3) {
  if (!users.length) return '';
  const shown = users.slice(0, maxShow);
  const overflow = users.length - maxShow;
  const avatars = shown.map((u, i) => `<span class="avatar-group-item" style="z-index:${maxShow - i}">${userAvatar(u, 'sm')}</span>`).join('');
  const badge = overflow > 0 ? `<span class="avatar-group-overflow">+${overflow}</span>` : '';
  return `<span class="avatar-group">${avatars}${badge}</span>`;
}

export function statusLabel(status, entityType) {
  if (!status) return '';
  const key = status.toLowerCase().replace(/\s+/g, '_');
  const s = STATUS_COLORS[key] || { bg: '#f3f4f6', text: '#6b7280' };
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  return `<span class="status-label" style="background:${s.bg};color:${s.text}">${label}</span>`;
}

export function infoBubble(text, position = 'top') {
  return `<span class="info-bubble info-bubble-${position}" data-tooltip="${text.replace(/"/g, '&quot;')}"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><text x="8" y="12" text-anchor="middle" fill="currentColor" font-size="10" font-weight="600">i</text></svg></span>`;
}

export function engagementCard(engagement, user) {
  const e = engagement || {};
  const stage = e.stage ? (STAGE_COLORS[e.stage] || { bg: '#f3f4f6', text: '#6b7280', label: e.stage }) : null;
  const stageBadge = stage ? `<span class="badge-stage" style="background:${stage.bg};color:${stage.text}">${stage.label || e.stage}</span>` : '';
  const sts = e.status ? statusLabel(e.status) : '';
  const progress = typeof e.progress === 'number' ? `<div class="engagement-card-progress"><div class="engagement-card-progress-bar" style="width:${Math.min(100, Math.max(0, e.progress))}%"></div></div>` : '';
  const team = e.team?.length ? `<div class="engagement-card-team">${teamAvatarGroup(e.team, 3)}</div>` : '';
  const dueDate = e.due_date ? `<span class="text-xs text-gray-500">${typeof e.due_date === 'number' ? new Date(e.due_date * 1000).toLocaleDateString() : e.due_date}</span>` : '';
  const clientName = e.client_name || e.client?.name || '';
  return `<div class="engagement-card card bg-white shadow" onclick="window.location='/engagement/${e.id}'" style="cursor:pointer">
    <div class="card-body">
      <div class="flex justify-between items-center mb-2">${clientName ? `<span class="text-xs text-gray-500">${clientName}</span>` : '<span></span>'}${sts}</div>
      <h3 class="font-medium mb-2">${e.name || e.title || 'Untitled'}</h3>
      <div class="flex items-center gap-2 mb-2">${stageBadge}${dueDate}</div>
      ${progress}
      <div class="flex justify-between items-center mt-2">${team}<div class="flex gap-1"><a href="/engagement/${e.id}" class="btn btn-xs btn-ghost" onclick="event.stopPropagation()">View</a>${canEdit(user, 'engagement') ? `<a href="/engagement/${e.id}/edit" class="btn btn-xs btn-outline" onclick="event.stopPropagation()">Edit</a>` : ''}</div></div>
    </div></div>`;
}

export function mobileReviewCard(review) {
  const r = review || {};
  const sts = r.status ? statusLabel(r.status) : '';
  const date = r.created_at ? `<span class="text-xs text-gray-500">${typeof r.created_at === 'number' ? new Date(r.created_at * 1000).toLocaleDateString() : r.created_at}</span>` : '';
  return `<div class="mobile-card mobile-review-card card bg-white shadow">
    <div class="card-body">
      <div class="flex justify-between items-center mb-2"><h3 class="font-medium text-sm">${r.name || r.title || 'Untitled Review'}</h3>${sts}</div>
      <div class="flex items-center gap-2 text-xs text-gray-500 mb-2">${r.engagement_name ? `<span>${r.engagement_name}</span>` : ''}${date}</div>
      ${r.highlights_count !== undefined ? `<div class="text-xs text-gray-500">${r.highlights_count} highlight${r.highlights_count !== 1 ? 's' : ''}</div>` : ''}
      <div class="flex gap-1 mt-2"><a href="/review/${r.id}" class="btn btn-xs btn-primary">View</a><a href="/review/${r.id}/edit" class="btn btn-xs btn-outline">Edit</a></div>
    </div></div>`;
}

export function mobileEngagementCard(engagement) {
  const e = engagement || {};
  const stage = e.stage ? (STAGE_COLORS[e.stage] || { bg: '#f3f4f6', text: '#6b7280', label: e.stage }) : null;
  const stageBadge = stage ? `<span class="badge-stage" style="background:${stage.bg};color:${stage.text};font-size:0.65rem;padding:0.15rem 0.5rem">${stage.label || e.stage}</span>` : '';
  const sts = e.status ? statusLabel(e.status) : '';
  return `<div class="mobile-card mobile-engagement-card card bg-white shadow">
    <div class="card-body">
      <div class="flex justify-between items-center mb-2"><h3 class="font-medium text-sm">${e.name || e.title || 'Untitled'}</h3>${sts}</div>
      ${e.client_name ? `<div class="text-xs text-gray-500 mb-1">${e.client_name}</div>` : ''}
      <div class="flex items-center gap-2 mb-2">${stageBadge}${e.due_date ? `<span class="text-xs text-gray-500">${typeof e.due_date === 'number' ? new Date(e.due_date * 1000).toLocaleDateString() : e.due_date}</span>` : ''}</div>
      <div class="flex gap-1 mt-2"><a href="/engagement/${e.id}" class="btn btn-xs btn-primary">View</a><a href="/engagement/${e.id}/edit" class="btn btn-xs btn-outline">Edit</a></div>
    </div></div>`;
}

export function sidebarReviewDetails(review) {
  const r = review || {};
  const sts = r.status ? statusLabel(r.status) : '';
  const meta = [
    r.created_at ? ['Created', typeof r.created_at === 'number' ? new Date(r.created_at * 1000).toLocaleDateString() : r.created_at] : null,
    r.updated_at ? ['Updated', typeof r.updated_at === 'number' ? new Date(r.updated_at * 1000).toLocaleDateString() : r.updated_at] : null,
    r.creator_name ? ['Creator', r.creator_name] : null,
    r.manager_name ? ['Manager', r.manager_name] : null,
  ].filter(Boolean).map(([l, v]) => `<div class="sidebar-meta-row"><span class="text-gray-500 text-xs">${l}</span><span class="text-sm font-medium">${v}</span></div>`).join('');
  const highlights = r.highlights_count !== undefined ? `<div class="sidebar-section"><span class="text-xs text-gray-500">Highlights</span><span class="font-medium">${r.highlights_count}</span></div>` : '';
  const collaborators = r.collaborators?.length ? `<div class="sidebar-section"><span class="text-xs text-gray-500 mb-1">Collaborators</span>${teamAvatarGroup(r.collaborators, 5)}</div>` : '';
  const checklists = r.checklists_total !== undefined ? `<div class="sidebar-section"><span class="text-xs text-gray-500">Checklists</span><span class="font-medium">${r.checklists_completed || 0}/${r.checklists_total}</span></div>` : '';
  return `<aside class="sidebar-review-panel" id="sidebar-review-panel">
    <div class="sidebar-header"><h3 class="font-medium">Review Details</h3><button class="btn btn-ghost btn-xs sidebar-toggle" onclick="document.getElementById('sidebar-review-panel').classList.toggle('sidebar-collapsed')" aria-label="Toggle sidebar">&times;</button></div>
    <div class="sidebar-body">
      <div class="sidebar-section"><h4 class="font-medium text-sm mb-1">${r.name || r.title || 'Untitled Review'}</h4>${sts}</div>
      ${meta ? `<div class="sidebar-section">${meta}</div>` : ''}
      ${highlights}${collaborators}${checklists}
    </div></aside>`;
}

export function dataGridAdvanced(config) {
  const { columns = [], data = [], groupBy = null, sortable = true, filterable = true, expandable = false, detailRenderer = null } = config;
  const gridId = 'dg-' + Math.random().toString(36).slice(2, 8);
  const colHeaders = columns.map((col, i) => {
    const sortAttr = sortable ? ` data-dg-sort="${col.field}" onclick="dgSort('${gridId}','${col.field}',${i},event)"` : '';
    const filterHtml = filterable ? `<div class="dg-filter"><input type="text" data-dg-filter="${col.field}" placeholder="Filter..." class="dg-filter-input" oninput="dgFilter('${gridId}')"/></div>` : '';
    return `<th${sortAttr} class="${sortable ? 'dg-sortable' : ''}">${col.label || col.field}<span class="dg-sort-indicator" data-dg-indicator="${col.field}"></span>${filterHtml}</th>`;
  }).join('');
  const expandCol = expandable ? '<th class="dg-expand-col"></th>' : '';
  const renderRow = (item, rowId, groupId) => {
    const memberAttr = groupId ? ` data-dg-member="${groupId}"` : '';
    const expandBtn = expandable ? `<td class="dg-expand-col"><button class="dg-expand-btn" data-dg-row="${rowId}" onclick="dgToggleDetail('${gridId}',this)">&#9654;</button></td>` : '';
    const cells = columns.map(col => `<td>${item[col.field] ?? '-'}</td>`).join('');
    const detailRow = expandable ? `<tr class="dg-detail-row"${memberAttr} data-dg-detail="${rowId}" style="display:none"><td colspan="${columns.length + 1}"><div class="dg-detail-panel">${detailRenderer ? detailRenderer(item) : ''}</div></td></tr>` : '';
    return `<tr class="dg-data-row"${memberAttr} data-dg-values='${JSON.stringify(columns.map(c => String(item[c.field] ?? '')))}'>${expandBtn}${cells}</tr>${detailRow}`;
  };
  let bodyHtml = '';
  if (groupBy) {
    const groups = {};
    data.forEach(item => { const key = String(item[groupBy] ?? 'Ungrouped'); if (!groups[key]) groups[key] = []; groups[key].push(item); });
    bodyHtml = Object.entries(groups).map(([key, items]) => {
      const gid = `${gridId}-g-${key.replace(/\W/g, '_')}`;
      const rows = items.map((item, i) => renderRow(item, `${gid}-r${i}`, gid)).join('');
      return `<tr class="dg-group-header" data-dg-group="${gid}" onclick="dgToggleGroup('${gid}')"><td colspan="${columns.length + (expandable ? 1 : 0)}"><span class="dg-group-arrow">&#9660;</span> <strong>${key}</strong> <span class="dg-group-count">(${items.length})</span></td></tr>${rows}`;
    }).join('');
  } else {
    bodyHtml = data.map((item, i) => renderRow(item, `${gridId}-r${i}`, null)).join('');
  }
  const script = `(function(){var sorts={};window.dgSort=function(gid,field,ci,evt){if(!sorts[gid])sorts[gid]=[];if(!evt.shiftKey)sorts[gid]=[];var ex=sorts[gid].find(function(s){return s.field===field});if(ex){ex.dir=ex.dir==='asc'?'desc':'asc'}else{sorts[gid].push({field:field,col:ci,dir:'asc'})}var t=document.getElementById(gid);t.querySelectorAll('[data-dg-indicator]').forEach(function(el){el.textContent=''});sorts[gid].forEach(function(s){var ind=t.querySelector('[data-dg-indicator="'+s.field+'"]');if(ind)ind.textContent=s.dir==='asc'?' \\u25B2':' \\u25BC'});var rows=Array.from(t.querySelectorAll('.dg-data-row'));var tb=t.querySelector('tbody');rows.sort(function(a,b){var va=JSON.parse(a.dataset.dgValues);var vb=JSON.parse(b.dataset.dgValues);for(var i=0;i<sorts[gid].length;i++){var s=sorts[gid][i];var cmp=va[s.col].localeCompare(vb[s.col],undefined,{numeric:true});if(cmp!==0)return s.dir==='asc'?cmp:-cmp}return 0});rows.forEach(function(r){var d=t.querySelector('[data-dg-detail="'+r.querySelector('.dg-expand-btn')?.dataset?.dgRow+'"]');tb.appendChild(r);if(d)tb.appendChild(d)})};window.dgFilter=function(gid){var t=document.getElementById(gid);var fs=Array.from(t.querySelectorAll('[data-dg-filter]'));var vals=fs.map(function(f){return f.value.toLowerCase()});t.querySelectorAll('.dg-data-row').forEach(function(r){var d=JSON.parse(r.dataset.dgValues||'[]');var show=vals.every(function(v,i){return !v||d[i].toLowerCase().indexOf(v)!==-1});r.style.display=show?'':'none';var det=t.querySelector('[data-dg-detail="'+(r.querySelector('.dg-expand-btn')||{}).dataset?.dgRow+'"]');if(det&&!show)det.style.display='none'})};window.dgToggleGroup=function(gid){var ms=document.querySelectorAll('[data-dg-member="'+gid+'"]');var h=document.querySelector('[data-dg-group="'+gid+'"]');var a=h.querySelector('.dg-group-arrow');var hidden=ms[0]&&ms[0].style.display==='none';ms.forEach(function(m){m.style.display=hidden?'':'none'});a.textContent=hidden?'\\u25BC':'\\u25B6'};window.dgToggleDetail=function(gid,btn){var rid=btn.dataset.dgRow;var det=document.querySelector('[data-dg-detail="'+rid+'"]');if(!det)return;var shown=det.style.display!=='none';det.style.display=shown?'none':'';btn.textContent=shown?'\\u25B6':'\\u25BC';btn.classList.toggle('dg-expand-open',!shown)}})();`;
  return `<div class="dg-wrapper"><table id="${gridId}" class="dg-table"><thead><tr>${expandCol}${colHeaders}</tr></thead><tbody>${bodyHtml}</tbody></table></div><script>${script}</script>`;
}

export function collapsibleSidebar(sections, currentPath) {
  const sidebarId = 'sidebar-' + Math.random().toString(36).slice(2, 8);
  const sectionHtml = sections.map(section => {
    const links = (section.items || []).map(item => {
      const active = currentPath === item.href;
      return `<a href="${item.href}" class="sidebar-link${active ? ' sidebar-link-active' : ''}">${item.label}</a>`;
    }).join('');
    return `<div class="sidebar-section"><div class="sidebar-section-header" onclick="sidebarToggleSection(this)">${section.title}<span class="sidebar-section-arrow">&#9660;</span></div><div class="sidebar-section-body">${links}</div></div>`;
  }).join('');
  const script = `(function(){var sb=document.getElementById('${sidebarId}');var saved=localStorage.getItem('sidebar-width');if(saved)sb.style.width=saved+'px';var collapsed=localStorage.getItem('sidebar-collapsed')==='true';if(collapsed)sb.classList.add('sidebar-collapsed');window.sidebarToggleSection=function(el){el.parentElement.classList.toggle('sidebar-section-closed')};window.sidebarToggleCollapse=function(){sb.classList.toggle('sidebar-collapsed');localStorage.setItem('sidebar-collapsed',sb.classList.contains('sidebar-collapsed'))};var handle=sb.querySelector('.sidebar-resize-handle');var startX,startW;handle.addEventListener('mousedown',function(e){startX=e.clientX;startW=sb.offsetWidth;function onMove(ev){var w=startW+(ev.clientX-startX);if(w>48&&w<400){sb.style.width=w+'px';localStorage.setItem('sidebar-width',w)}}function onUp(){document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp)}document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp)})})();`;
  return `<aside id="${sidebarId}" class="sidebar-collapsible"><div class="sidebar-inner"><button class="sidebar-collapse-btn" onclick="sidebarToggleCollapse()" title="Toggle sidebar">&#9776;</button>${sectionHtml}</div><div class="sidebar-resize-handle"></div></aside><script>${script}</script>`;
}

export function splashScreen(domain) {
  const isFriday = domain === 'friday';
  const name = isFriday ? 'Friday' : 'MyWorkReview';
  const color = isFriday ? '#3b82f6' : '#8b5cf6';
  const initial = isFriday ? 'F' : 'M';
  return `<div id="splash-screen" class="splash-screen" style="--splash-color:${color}"><div class="splash-content"><div class="splash-logo" style="background:${color}">${initial}</div><div class="splash-name">${name}</div><div class="splash-spinner"><div class="splash-spinner-ring"></div></div></div></div><script>(function(){window.addEventListener('load',function(){var s=document.getElementById('splash-screen');if(s){setTimeout(function(){s.classList.add('splash-hide');setTimeout(function(){s.remove()},400)},600)}})})()</script>`;
}

export function swUpdateBanner() {
  return `<div id="sw-update-banner" class="sw-banner" style="display:none"><span class="sw-banner-text">A new version is available.</span><button class="btn btn-sm btn-primary sw-banner-btn" onclick="swDoUpdate()">Update</button><button class="btn btn-sm btn-ghost sw-banner-btn" onclick="swDismiss()">Dismiss</button></div><script>(function(){function show(){document.getElementById('sw-update-banner').style.display='flex'}window.swDoUpdate=function(){window.location.reload()};window.swDismiss=function(){document.getElementById('sw-update-banner').style.display='none'};if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('controllerchange',show);navigator.serviceWorker.getRegistration().then(function(reg){if(reg)reg.addEventListener('updatefound',function(){var nw=reg.installing;if(nw)nw.addEventListener('statechange',function(){if(nw.state==='installed'&&navigator.serviceWorker.controller)show()})})})}})()</script>`;
}

export function reviewCalcFields(review, highlights) {
  const hl = highlights || [];
  const total = hl.length;
  const resolved = hl.filter(h => h.resolved || h.status === 'resolved').length;
  const unresolved = total - resolved;
  const resolutionPct = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const flagged = hl.filter(h => h.flagged || h.flag).length;
  const byColor = {};
  hl.forEach(h => { const c = h.color || 'none'; byColor[c] = (byColor[c] || 0) + 1; });
  return { total, resolved, unresolved, resolutionPct, flagged, byColor };
}

export function responsiveClass(breakpoint) {
  const bp = { sm: 640, md: 768, lg: 1024, xl: 1280 };
  if (!bp[breakpoint]) return '';
  return `resp-${breakpoint}`;
}

export function accordion(items) {
  if (!items?.length) return '';
  return `<div class="accordion">${items.map(item =>
    `<details class="accordion-item"><summary class="accordion-summary">${item.title}</summary><div class="accordion-content">${item.content}</div></details>`
  ).join('')}</div>`;
}

export function divider(label) {
  if (!label) return '<hr class="divider"/>';
  return `<div class="divider-labeled"><hr class="divider-line"/><span class="divider-text">${label}</span><hr class="divider-line"/></div>`;
}

const DIALOG_COLORS = ['#B0B0B0','#44BBA4','#FF4141','#7F7EFF','#3b82f6','#f59e0b','#ec4899','#8b5cf6','#ef4444','#22c55e','#06b6d4','#f97316','#84cc16','#e11d48','#14b8a6','#6366f1'];

export function colorPickerDialog(id = 'cpd', selected = '#B0B0B0', onSelect = '') {
  const swatches = DIALOG_COLORS.map(c =>
    `<div class="cpd-swatch${c === selected ? ' cpd-selected' : ''}" style="background:${c}" data-color="${c}" onclick="cpdSelect('${id}','${c}',${onSelect ? 'true' : 'false'})"></div>`
  ).join('');
  return `<div id="${id}-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="dialog-panel" style="max-width:360px">
      <div class="dialog-header"><span class="dialog-title">Choose Color</span><button class="dialog-close" onclick="document.getElementById('${id}-dialog').style.display='none'">&times;</button></div>
      <div class="dialog-body"><div class="color-picker-grid">${swatches}</div>
        <div style="margin-top:0.75rem;display:flex;align-items:center;gap:0.75rem"><label class="text-sm text-gray-500">Custom:</label><input type="color" id="${id}-custom" value="${selected}" onchange="cpdSelect('${id}',this.value,true)" style="width:40px;height:32px;border:none;cursor:pointer"/><span id="${id}-val" class="text-sm font-medium">${selected}</span></div>
      </div>
      <div class="dialog-footer"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('${id}-dialog').style.display='none'">Cancel</button><button class="btn btn-primary btn-sm" onclick="cpdConfirm('${id}')">Select</button></div>
    </div></div>
  <script>window._cpd=window._cpd||{};window._cpd['${id}']='${selected}';
  window.cpdSelect=function(id,c){window._cpd[id]=c;document.getElementById(id+'-val').textContent=c;document.getElementById(id+'-custom').value=c;document.querySelectorAll('#'+id+'-dialog .cpd-swatch').forEach(function(el){el.classList.toggle('cpd-selected',el.dataset.color===c)})};
  window.cpdConfirm=function(id){var c=window._cpd[id];document.getElementById(id+'-dialog').style.display='none';if(window._cpdCallback)window._cpdCallback(c)};
  window.showColorPicker=function(id,current,cb){window._cpdCallback=cb;if(current)cpdSelect(id,current);document.getElementById(id+'-dialog').style.display='flex'};</script>`;
}

export function dateChoiceDialog(id = 'dcd') {
  const presets = [
    { label: 'Today', days: 0 }, { label: 'Tomorrow', days: 1 }, { label: '+3 Days', days: 3 },
    { label: '+1 Week', days: 7 }, { label: '+2 Weeks', days: 14 }, { label: '+1 Month', days: 30 },
    { label: '+3 Months', days: 90 }, { label: 'End of Month', days: 'eom' }, { label: 'End of Quarter', days: 'eoq' },
  ];
  const presetBtns = presets.map(p => `<button class="date-preset-btn" onclick="dcdPreset('${id}',${typeof p.days === 'number' ? p.days : "'" + p.days + "'"})">${p.label}</button>`).join('');
  return `<div id="${id}-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="dialog-panel" style="max-width:380px">
      <div class="dialog-header"><span class="dialog-title">Choose Date</span><button class="dialog-close" onclick="document.getElementById('${id}-dialog').style.display='none'">&times;</button></div>
      <div class="dialog-body">
        <div class="modal-form-group"><label>Date</label><input type="date" id="${id}-input" class="input input-bordered w-full"/></div>
        <div class="date-presets">${presetBtns}</div>
      </div>
      <div class="dialog-footer"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('${id}-dialog').style.display='none'">Cancel</button><button class="btn btn-error btn-outline btn-sm" onclick="dcdClear('${id}')">Clear</button><button class="btn btn-primary btn-sm" onclick="dcdConfirm('${id}')">Select</button></div>
    </div></div>
  <script>window.dcdPreset=function(id,days){var d=new Date();if(days==='eom'){d=new Date(d.getFullYear(),d.getMonth()+1,0)}else if(days==='eoq'){var q=Math.floor(d.getMonth()/3);d=new Date(d.getFullYear(),(q+1)*3,0)}else{d.setDate(d.getDate()+days)}document.getElementById(id+'-input').value=d.toISOString().split('T')[0]};
  window.dcdConfirm=function(id){var v=document.getElementById(id+'-input').value;document.getElementById(id+'-dialog').style.display='none';if(window._dcdCallback)window._dcdCallback(v||null)};
  window.dcdClear=function(id){document.getElementById(id+'-input').value='';document.getElementById(id+'-dialog').style.display='none';if(window._dcdCallback)window._dcdCallback(null)};
  window.showDateChoice=function(id,current,cb){window._dcdCallback=cb;if(current)document.getElementById(id+'-input').value=current;document.getElementById(id+'-dialog').style.display='flex'};</script>`;
}

export function stageTransitionDialog(stages = null) {
  const stageKeys = stages || Object.keys(STAGE_COLORS);
  return `<div id="stage-trans-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="dialog-panel">
      <div class="dialog-header"><span class="dialog-title">Transition Stage</span><button class="dialog-close" onclick="document.getElementById('stage-trans-dialog').style.display='none'">&times;</button></div>
      <div class="dialog-body">
        <div id="std-from" class="stage-trans-block stage-trans-current"></div>
        <div class="stage-trans-arrow"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></div>
        <div id="std-to" class="stage-trans-block stage-trans-next"></div>
        <div class="modal-form-group" style="margin-top:1rem"><label class="form-label">Reason (optional)</label><textarea id="std-reason" class="textarea textarea-bordered w-full" rows="2" placeholder="Why is this stage being changed?"></textarea></div>
      </div>
      <div class="dialog-footer"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('stage-trans-dialog').style.display='none'">Cancel</button><button class="btn btn-primary btn-sm" onclick="stdConfirm()">Confirm Transition</button></div>
    </div></div>
  <script>${TOAST_SCRIPT}
  window._stdData={};
  window.showStageTransition=function(entityId,entityType,fromStage,toStage,cb){window._stdData={entityId:entityId,entityType:entityType,from:fromStage,to:toStage,cb:cb};document.getElementById('stage-trans-dialog').style.display='flex';var sc=${JSON.stringify(Object.fromEntries(stageKeys.map(k => [k, STAGE_COLORS[k] || { bg: '#f3f4f6', text: '#4b5563', label: k }])))};var from=sc[fromStage]||{bg:'#f3f4f6',text:'#4b5563',label:fromStage};var to=sc[toStage]||{bg:'#f3f4f6',text:'#4b5563',label:toStage};document.getElementById('std-from').innerHTML='<div class="stage-trans-dot" style="background:'+from.text+'"></div><div><div class="text-xs text-gray-500">Current</div><div class="font-medium" style="color:'+from.text+'">'+from.label+'</div></div>';document.getElementById('std-to').innerHTML='<div class="stage-trans-dot" style="background:'+to.text+'"></div><div><div class="text-xs text-gray-500">Next</div><div class="font-medium" style="color:'+to.text+'">'+to.label+'</div></div>'};
  window.stdConfirm=async function(){var d=window._stdData;var reason=document.getElementById('std-reason').value;try{var res=await fetch('/api/'+d.entityType+'/'+d.entityId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({stage:d.to,stage_reason:reason})});if(res.ok){showToast('Stage updated','success');document.getElementById('stage-trans-dialog').style.display='none';if(d.cb)d.cb();else setTimeout(function(){location.reload()},500)}else{showToast('Transition failed','error')}}catch(e){showToast('Error: '+e.message,'error')}};</script>`;
}

export function stagePipeline(currentStage, stages = null, clickable = false, onClickFn = '') {
  const stageKeys = stages || Object.keys(STAGE_COLORS);
  const activeIdx = stageKeys.indexOf(currentStage);
  const pills = stageKeys.map((key, i) => {
    const s = STAGE_COLORS[key] || { bg: '#f3f4f6', text: '#4b5563', label: key };
    const cls = i === activeIdx ? 'spl-current' : i < activeIdx ? 'spl-past' : 'spl-future';
    const click = clickable ? ` spl-clickable" onclick="${onClickFn}('${key}')"` : '"';
    return `<div class="spl-pill ${cls}${click} style="background:${s.bg};color:${s.text}">${s.label}</div>`;
  }).join('');
  return `<div class="stage-pipeline">${pills}</div>`;
}

export function activityTimeline(activities = [], showAll = false) {
  const maxItems = showAll ? activities.length : 10;
  const items = activities.slice(0, maxItems);
  const iconMap = { created: '&#43;', updated: '&#9998;', status_changed: '&#9679;', commented: '&#128172;', assigned: '&#128100;', uploaded: '&#128206;' };
  const timelineItems = items.map(a => {
    const action = a.action || 'updated';
    const icon = iconMap[action] || '&#9679;';
    const ts = a.timestamp || a.created_at;
    const timeStr = ts ? (typeof ts === 'number' && ts > 1e9 ? new Date(ts * 1000).toLocaleString() : new Date(ts).toLocaleString()) : '';
    return `<div class="act-tl-item"><div class="act-tl-icon act-tl-${action}">${icon}</div><div class="act-tl-content"><div class="act-tl-header"><span class="act-tl-desc">${a.description || a.action || ''}</span></div><div class="act-tl-time">${timeStr}${a.user_name ? ' by ' + a.user_name : ''}</div></div></div>`;
  }).join('');
  const moreBtn = !showAll && activities.length > maxItems ? `<div class="act-tl-more"><button class="btn btn-ghost btn-sm" onclick="showAllActivity()">Show ${activities.length - maxItems} more</button></div>` : '';
  return `<div class="act-timeline">${timelineItems}</div>${moreBtn}`;
}

export function teamAssignmentDialog(id = 'tad') {
  return `<div id="${id}-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="dialog-panel">
      <div class="dialog-header"><span class="dialog-title">Assign Team Members</span><button class="dialog-close" onclick="document.getElementById('${id}-dialog').style.display='none'">&times;</button></div>
      <div class="dialog-body">
        <input type="text" id="${id}-search" class="tad-search" placeholder="Search by name or email..." oninput="tadFilter('${id}')"/>
        <div id="${id}-list" class="tad-list"></div>
      </div>
      <div class="dialog-footer"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('${id}-dialog').style.display='none'">Cancel</button><button class="btn btn-primary btn-sm" onclick="tadConfirm('${id}')">Assign</button></div>
    </div></div>
  <script>${TOAST_SCRIPT}
  window._tad=window._tad||{};
  window.showTeamAssignment=function(id,users,selected,cb){window._tad[id]={users:users,selected:new Set(selected||[]),cb:cb};document.getElementById(id+'-dialog').style.display='flex';tadRender(id)};
  function tadRender(id){var d=window._tad[id];var c=document.getElementById(id+'-list');c.innerHTML='';d.users.forEach(function(u){var row=document.createElement('div');row.className='tad-row';row.dataset.name=(u.name||'').toLowerCase();row.dataset.email=(u.email||'').toLowerCase();var checked=d.selected.has(u.id)?'checked':'';row.innerHTML='<input type="checkbox" '+checked+' onchange="tadToggle(\\''+id+'\\',\\''+u.id+'\\')">'+'<div><div class="tad-name">'+(u.name||'Unknown')+'</div><div class="tad-email">'+(u.email||'')+'</div></div>';c.appendChild(row)})}
  window.tadFilter=function(id){var q=document.getElementById(id+'-search').value.toLowerCase();document.querySelectorAll('#'+id+'-list .tad-row').forEach(function(r){r.style.display=(r.dataset.name.includes(q)||r.dataset.email.includes(q))?'':'none'})};
  window.tadToggle=function(id,uid){var d=window._tad[id];if(d.selected.has(uid))d.selected.delete(uid);else d.selected.add(uid)};
  window.tadConfirm=function(id){var d=window._tad[id];document.getElementById(id+'-dialog').style.display='none';if(d.cb)d.cb(Array.from(d.selected))};</script>`;
}

export function teamSelector(id = 'ts', teams = []) {
  const items = teams.map(t =>
    `<div class="tad-row" data-name="${(t.name || '').toLowerCase()}" onclick="tsSelect('${id}','${t.id}','${(t.name || '').replace(/'/g, "\\'")}')"><div class="tad-name">${t.name || 'Unknown'}</div><div class="tad-email">${t.member_count || 0} members</div></div>`
  ).join('');
  return `<div class="ts-wrap" id="${id}-wrap">
    <div id="${id}-badges" class="ts-badges"></div>
    <input type="text" id="${id}-search" class="tad-search" placeholder="Search teams..." oninput="tsFilter('${id}')" onfocus="document.getElementById('${id}-dropdown').classList.add('ts-open')" />
    <div id="${id}-dropdown" class="ts-dropdown">${items}</div>
    <input type="hidden" id="${id}-value" name="team_id" value=""/>
  </div>
  <script>window._ts=window._ts||{};window._ts['${id}']=[];
  window.tsFilter=function(id){var q=document.getElementById(id+'-search').value.toLowerCase();document.querySelectorAll('#'+id+'-dropdown .tad-row').forEach(function(r){r.style.display=r.dataset.name.includes(q)?'':'none'})};
  window.tsSelect=function(id,tid,name){window._ts[id].push({id:tid,name:name});tsRender(id);document.getElementById(id+'-dropdown').classList.remove('ts-open');document.getElementById(id+'-search').value=''};
  function tsRender(id){var b=document.getElementById(id+'-badges');b.innerHTML='';window._ts[id].forEach(function(t,i){b.innerHTML+='<span class="ts-badge">'+t.name+' <span class="ts-badge-x" onclick="tsRemove(\\''+id+'\\','+i+')">&times;</span></span>'});document.getElementById(id+'-value').value=window._ts[id].map(function(t){return t.id}).join(',')}
  window.tsRemove=function(id,idx){window._ts[id].splice(idx,1);tsRender(id)};
  document.addEventListener('click',function(e){if(!document.getElementById('${id}-wrap').contains(e.target))document.getElementById('${id}-dropdown').classList.remove('ts-open')});</script>`;
}

export function archiveReviewDialog() {
  return `<div id="archive-review-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="dialog-panel">
      <div class="dialog-header"><span class="dialog-title">Archive Review</span><button class="dialog-close" onclick="document.getElementById('archive-review-dialog').style.display='none'">&times;</button></div>
      <div class="dialog-body">
        <div class="archive-ctx">This action will archive the review. Archived reviews are hidden from active lists but can be restored.</div>
        <div class="modal-form-group"><label class="form-label">Type ARCHIVE to confirm</label><input type="text" id="ard-confirm" class="archive-type-input" placeholder="Type ARCHIVE"/></div>
      </div>
      <div class="dialog-footer"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('archive-review-dialog').style.display='none'">Cancel</button><button class="btn btn-error btn-sm" id="ard-btn" onclick="ardConfirm()">Archive</button></div>
    </div></div>
  <script>${TOAST_SCRIPT}
  window._ardId=null;
  window.showArchiveDialog=function(reviewId){window._ardId=reviewId;document.getElementById('archive-review-dialog').style.display='flex';document.getElementById('ard-confirm').value=''};
  window.ardConfirm=async function(){if(document.getElementById('ard-confirm').value!=='ARCHIVE'){showToast('Type ARCHIVE to confirm','error');return}try{var res=await fetch('/api/review/'+window._ardId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'archived'})});if(res.ok){showToast('Review archived','success');document.getElementById('archive-review-dialog').style.display='none';setTimeout(function(){location.reload()},500)}else{showToast('Archive failed','error')}}catch(e){showToast('Error','error')}};</script>`;
}

export function reviewOpenCloseToggle(reviewId, isOpen) {
  const on = isOpen ? 'rvw-on rvw-green' : '';
  return `<div class="rvw-toggle">
    <div class="rvw-toggle-track ${on}" id="rvw-oc-track" onclick="rvwToggleOC('${reviewId}')"><div class="rvw-toggle-knob"></div></div>
    <span class="rvw-toggle-label">${isOpen ? 'Open' : 'Closed'}</span>
  </div>
  <script>${TOAST_SCRIPT}
  window.rvwToggleOC=async function(id){var t=document.getElementById('rvw-oc-track');var isOn=t.classList.contains('rvw-on');var newStatus=isOn?'closed':'open';try{var res=await fetch('/api/review/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:newStatus})});if(res.ok){t.classList.toggle('rvw-on');t.classList.toggle('rvw-green');t.nextElementSibling.textContent=isOn?'Closed':'Open';showToast('Review '+(isOn?'closed':'opened'),'success')}else{showToast('Failed','error')}}catch(e){showToast('Error','error')}};</script>`;
}

export function reviewPrivateToggle(reviewId, isPrivate) {
  const on = isPrivate ? 'rvw-on rvw-purple' : '';
  return `<div class="rvw-toggle">
    <div class="rvw-toggle-track ${on}" id="rvw-priv-track" onclick="rvwTogglePriv('${reviewId}')"><div class="rvw-toggle-knob"></div></div>
    <span class="rvw-toggle-label"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="${isPrivate ? 'M8 1a4 4 0 014 4v2h1a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1h1V5a4 4 0 014-4zm2 6V5a2 2 0 10-4 0v2h4z' : 'M12 7h1a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1h7V5a2 2 0 10-4 0v1H4V5a4 4 0 018 0v2z'}"/></svg>${isPrivate ? 'Private' : 'Public'}</span>
  </div>
  <script>${TOAST_SCRIPT}
  window.rvwTogglePriv=async function(id){var t=document.getElementById('rvw-priv-track');var isOn=t.classList.contains('rvw-on');try{var res=await fetch('/api/review/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_private:isOn?0:1})});if(res.ok){t.classList.toggle('rvw-on');t.classList.toggle('rvw-purple');showToast(isOn?'Made public':'Made private','success');setTimeout(function(){location.reload()},500)}else{showToast('Failed','error')}}catch(e){showToast('Error','error')}};</script>`;
}

export function markAllHighlightsResolved(reviewId, unresolvedCount = 0) {
  return `<div id="bulk-resolve-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="dialog-panel" style="max-width:380px">
      <div class="dialog-header"><span class="dialog-title">Resolve All Highlights</span><button class="dialog-close" onclick="document.getElementById('bulk-resolve-dialog').style.display='none'">&times;</button></div>
      <div class="dialog-body">
        <div class="bulk-resolve-count" id="brc-count">${unresolvedCount}</div>
        <div class="bulk-resolve-label">unresolved highlights will be marked as resolved</div>
      </div>
      <div class="dialog-footer"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('bulk-resolve-dialog').style.display='none'">Cancel</button><button class="btn btn-primary btn-sm" onclick="bulkResolve('${reviewId}')">Resolve All</button></div>
    </div></div>
  <script>${TOAST_SCRIPT}
  window.showBulkResolve=function(reviewId,count){document.getElementById('brc-count').textContent=count;document.getElementById('bulk-resolve-dialog').style.display='flex'};
  window.bulkResolve=async function(id){try{var res=await fetch('/api/review/'+id+'/resolve-all',{method:'POST',headers:{'Content-Type':'application/json'}});if(res.ok){showToast('All highlights resolved','success');document.getElementById('bulk-resolve-dialog').style.display='none';setTimeout(function(){location.reload()},500)}else{var alt=await fetch('/api/highlight?review_id='+id);var hl=await alt.json();var highlights=(hl.data||hl||[]).filter(function(h){return !h.resolved&&h.status!=='resolved'});var resolved=0;for(var h of highlights){var r2=await fetch('/api/highlight/'+h.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({resolved:1,status:'resolved'})});if(r2.ok)resolved++}showToast(resolved+' highlights resolved','success');document.getElementById('bulk-resolve-dialog').style.display='none';setTimeout(function(){location.reload()},500)}}catch(e){showToast('Error: '+e.message,'error')}};</script>`;
}
