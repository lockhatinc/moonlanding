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
  const navLinks = getNavItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  const adminLinks = getAdminItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  return `<nav class="navbar bg-white shadow-sm px-4">
  <div class="navbar-start">
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
<script>function toggleUserMenu(e){e.stopPropagation();document.getElementById('user-dropdown').classList.toggle('open')}document.addEventListener('click',function(e){const d=document.getElementById('user-dropdown');if(d&&!d.contains(e.target))d.classList.remove('open')})</script>`;
}

function page(user, title, bc, content, scripts = []) {
  const body = `<div class="min-h-screen">${nav(user)}<div class="p-6">${breadcrumb(bc)}${content}</div></div>`;
  return generateHtml(title, body, scripts);
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
    <div class="text-center mt-4 text-sm text-gray-500">Demo: <code class="text-xs">admin@example.com / password</code></div></div></div></div>`;
  const script = `const form=document.querySelector('form');form.addEventListener('submit',async(e)=>{e.preventDefault();const btn=form.querySelector('button[type="submit"]');btn.classList.add('loading');btn.disabled=true;try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email.value,password:form.password.value})});const data=await res.json();if(res.ok){window.location.href=data.redirect||'/'}else{const d=document.createElement('div');d.className='alert alert-error mb-4';d.textContent=data.error||'Login failed';const x=form.parentElement.querySelector('.alert');if(x)x.remove();form.parentElement.insertBefore(d,form)}}catch(err){alert('Network error: '+err.message)}finally{btn.classList.remove('loading');btn.disabled=false}})`;
  return generateHtml('Login', body, [script]);
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
