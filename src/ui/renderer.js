import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '../..');

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

function formatValue(value, fieldKey, item = {}) {
  if (value === null || value === undefined) return '-';
  if (fieldKey?.includes('_at') || fieldKey === 'created_at' || fieldKey === 'updated_at') {
    const num = Number(value);
    if (!isNaN(num) && num > 1000000000 && num < 3000000000) {
      return new Date(num * 1000).toLocaleString();
    }
  }
  if (fieldKey === 'year') {
    const num = Number(value);
    if (!isNaN(num)) return String(Math.floor(num));
  }
  if (fieldKey === 'stage' && STAGE_COLORS[value]) {
    const s = STAGE_COLORS[value];
    return `<span class="badge-stage" style="background:${s.bg};color:${s.text}">${s.label}</span>`;
  }
  if (fieldKey === 'status' && STATUS_COLORS[value]) {
    const s = STATUS_COLORS[value];
    const label = value.charAt(0).toUpperCase() + value.slice(1);
    return `<span class="badge-status" style="background:${s.bg};color:${s.text}">${label}</span>`;
  }
  const displayKey = `${fieldKey}_display`;
  if (item[displayKey]) return item[displayKey];
  return String(value);
}

export function generateHtml(title, bodyContent, scripts = []) {
  const scriptTags = scripts.map(s =>
    typeof s === 'string'
      ? `<script type="module">${s}</script>`
      : `<script type="module" src="${s.src}"></script>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://cdn.jsdelivr.net/npm/rippleui@1.12.1/dist/css/styles.css" rel="stylesheet"/>
  <style>
    :root { --primary: #3b82f6; --primary-hover: #2563eb; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; min-height: 100vh; }
    .center-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .btn-primary { background-color: var(--primary) !important; color: white !important; border: none; }
    .btn-primary:hover { background-color: var(--primary-hover) !important; }
    .btn-error { background-color: #ef4444 !important; color: white !important; }
    .btn-outline { border: 1px solid currentColor; background: transparent; }
    .btn-ghost { background: transparent; }
    .btn-ghost:hover { background: rgba(0,0,0,0.05); }
    .btn-xs { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
    .card { max-width: 100%; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem 1rem; text-align: left; }
    thead { background: #f9fafb; }
    tbody tr:hover { background: #f3f4f6; }
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .gap-2 { gap: 0.5rem; }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    .flex { display: flex; }
    .flex-wrap { flex-wrap: wrap; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .justify-center { justify-content: center; }
    .hidden { display: none; }
    .p-6 { padding: 1.5rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .pt-4 { padding-top: 1rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .ml-6 { margin-left: 1.5rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    .w-full { width: 100%; }
    .w-10 { width: 2.5rem; }
    .w-12 { width: 3rem; }
    .w-52 { width: 13rem; }
    .w-96 { max-width: 24rem; width: 100%; }
    .max-w-2xl { max-width: 42rem; }
    .min-h-screen { min-height: 100vh; }
    .text-center { text-align: center; }
    .text-sm { font-size: 0.875rem; }
    .text-xs { font-size: 0.75rem; }
    .text-lg { font-size: 1.125rem; }
    .text-xl { font-size: 1.25rem; }
    .text-2xl { font-size: 1.5rem; }
    .font-bold { font-weight: 700; }
    .font-medium { font-weight: 500; }
    .text-gray-500 { color: #6b7280; }
    .text-white { color: white; }
    .bg-white { background-color: white; }
    .bg-primary { background-color: var(--primary); }
    .rounded-full { border-radius: 9999px; }
    .rounded-lg { border-radius: 0.5rem; }
    .border-b { border-bottom: 1px solid #e5e7eb; }
    .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .cursor-pointer { cursor: pointer; }
    .hover\\:underline:hover { text-decoration: underline; }
    @media (min-width: 768px) {
      .md\\:flex { display: flex; }
      .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
    @media (min-width: 1024px) {
      .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    .navbar { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; }
    .navbar-start { display: flex; align-items: center; }
    .navbar-end { display: flex; align-items: center; }
    .dropdown { position: relative; }
    .dropdown-end { position: relative; }
    .dropdown-menu { position: absolute; right: 0; top: 100%; z-index: 50; background: white; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); min-width: 10rem; display: none; }
    .dropdown.open .dropdown-menu { display: block; }
    .dropdown-header { padding: 0.5rem 1rem; font-size: 0.875rem; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    .dropdown-menu li a { display: block; padding: 0.5rem 1rem; color: #374151; }
    .dropdown-menu li a:hover { background: #f3f4f6; }
    .badge-stage, .badge-status { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .required-marker { color: #ef4444; margin-left: 2px; }
    .form-label { font-weight: 500; margin-bottom: 0.25rem; display: block; }
    .btn-loading { opacity: 0.7; pointer-events: none; }
    .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .confirm-dialog { background: white; border-radius: 0.5rem; padding: 1.5rem; max-width: 400px; width: 90%; }
    .confirm-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
    .confirm-message { color: #6b7280; margin-bottom: 1.5rem; }
    .confirm-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
  </style>
</head>
<body>
  <div id="app">${bodyContent}</div>
  <script type="importmap">
  {
    "imports": {
      "webjsx": "/lib/webjsx/index.js",
      "webjsx/jsx-runtime": "/lib/webjsx/jsx-runtime.js"
    }
  }
  </script>
  ${scriptTags}
</body>
</html>`;
}

export function renderLogin(error = null) {
  const errorHtml = error ? `<div class="alert alert-error mb-4">${error}</div>` : '';

  const body = `
    <div class="center-screen">
      <div class="card w-96 bg-white shadow-lg">
        <div class="card-body">
          <div class="text-center mb-6">
            <div class="avatar placeholder mb-2">
              <div class="bg-primary text-white rounded-lg w-12">
                <span class="text-xl font-bold">P</span>
              </div>
            </div>
            <h2 class="card-title justify-center">Welcome back</h2>
            <p class="text-gray-500 text-sm">Sign in to your account</p>
          </div>

          ${errorHtml}

          <form method="POST" action="/api/auth/login">
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input type="email" name="email" id="email" class="input input-bordered w-full" placeholder="Enter your email" required />
            </div>

            <div class="form-group mt-4">
              <label class="form-label" for="password">Password</label>
              <input type="password" name="password" id="password" class="input input-bordered w-full" placeholder="Enter your password" required />
            </div>

            <button type="submit" class="btn btn-primary w-full mt-6">Sign in</button>
          </form>

          <div class="text-center mt-4 text-sm text-gray-500">
            Demo: <code class="text-xs">admin@example.com / password</code>
          </div>
        </div>
      </div>
    </div>
  `;

  const script = `
    const form = document.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.classList.add('loading');
      btn.disabled = true;

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
          const errDiv = document.createElement('div');
          errDiv.className = 'alert alert-error mb-4';
          errDiv.textContent = data.error || 'Login failed';
          const existing = form.parentElement.querySelector('.alert');
          if (existing) existing.remove();
          form.parentElement.insertBefore(errDiv, form);
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    });
  `;

  return generateHtml('Login', body, [script]);
}

export function renderDashboard(user, stats = {}) {
  const isClerk = user?.role === 'clerk';
  const isManager = user?.role === 'manager';
  const isAdmin = user?.role === 'partner';

  const myRfisSection = (stats.myRfis && stats.myRfis.length > 0) ? `
    <div class="card bg-white shadow">
      <div class="card-body">
        <h2 class="card-title">My Assigned RFIs</h2>
        <div class="mt-4">
          <table class="table table-zebra w-full">
            <thead><tr><th>Title</th><th>Status</th><th>Due Date</th><th>Action</th></tr></thead>
            <tbody>
              ${stats.myRfis.map(r => `
                <tr>
                  <td>${r.title || 'Untitled'}</td>
                  <td><span class="badge badge-sm">${r.status || 'open'}</span></td>
                  <td>${r.due_date ? new Date(r.due_date * 1000).toLocaleDateString() : '-'}</td>
                  <td><a href="/rfi/${r.id}" class="btn btn-xs btn-primary">View</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ` : '';

  const overdueSection = (stats.overdueRfis && stats.overdueRfis.length > 0) ? `
    <div class="card bg-white shadow border-l-4 border-red-500">
      <div class="card-body">
        <h2 class="card-title text-red-600">Overdue Items</h2>
        <div class="mt-4">
          <table class="table table-zebra w-full">
            <thead><tr><th>Title</th><th>Days Overdue</th><th>Action</th></tr></thead>
            <tbody>
              ${stats.overdueRfis.map(r => `
                <tr class="text-red-600">
                  <td>${r.title || 'Untitled RFI'}</td>
                  <td>${r.daysOverdue || 0} days</td>
                  <td><a href="/rfi/${r.id}" class="btn btn-xs btn-error">View</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ` : '';

  const welcomeMsg = isClerk ? 'Here are your assigned tasks' : (isManager ? 'Team overview' : 'System overview');

  const body = `
    <div class="min-h-screen">
      ${renderNav(user)}

      <div class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold">Dashboard</h1>
          <p class="text-gray-500">Welcome back, ${user?.name || 'User'}. ${welcomeMsg}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">${isClerk ? 'My RFIs' : 'Engagements'}</h3>
              <p class="text-2xl font-bold">${isClerk ? (stats.myRfis?.length || 0) : (stats.engagements || 0)}</p>
            </div>
          </div>
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Clients</h3>
              <p class="text-2xl font-bold">${stats.clients || 0}</p>
            </div>
          </div>
          <div class="card bg-white shadow ${(stats.overdueRfis?.length > 0) ? 'border-l-4 border-red-500' : ''}">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">${(stats.overdueRfis?.length > 0) ? 'Overdue RFIs' : 'Open RFIs'}</h3>
              <p class="text-2xl font-bold ${(stats.overdueRfis?.length > 0) ? 'text-red-600' : ''}">${(stats.overdueRfis?.length > 0) ? stats.overdueRfis.length : (stats.rfis || 0)}</p>
            </div>
          </div>
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Reviews</h3>
              <p class="text-2xl font-bold">${stats.reviews || 0}</p>
            </div>
          </div>
        </div>

        ${overdueSection}
        ${myRfisSection}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div class="card bg-white shadow">
            <div class="card-body">
              <h2 class="card-title">Quick Actions</h2>
              <div class="flex flex-wrap gap-2 mt-4">
                ${isClerk ? `
                  <a href="/rfi" class="btn btn-primary btn-sm">View My RFIs</a>
                  <a href="/engagement" class="btn btn-outline btn-sm">View Engagements</a>
                ` : `
                  <a href="/engagement/new" class="btn btn-primary btn-sm">New Engagement</a>
                  <a href="/client/new" class="btn btn-outline btn-sm">New Client</a>
                  <a href="/review/new" class="btn btn-outline btn-sm">New Review</a>
                `}
              </div>
            </div>
          </div>
          <div class="card bg-white shadow">
            <div class="card-body">
              <h2 class="card-title">Navigation</h2>
              <div class="flex flex-wrap gap-2 mt-4">
                <a href="/engagement" class="btn btn-ghost btn-sm">Engagements</a>
                <a href="/client" class="btn btn-ghost btn-sm">Clients</a>
                <a href="/rfi" class="btn btn-ghost btn-sm">RFIs</a>
                <a href="/review" class="btn btn-ghost btn-sm">Reviews</a>
                ${isAdmin ? '<a href="/user" class="btn btn-ghost btn-sm">Users</a>' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return generateHtml('Dashboard', body, []);
}

export function renderEntityList(entityName, items, spec, user) {
  const label = spec?.labelPlural || spec?.label || entityName;
  const fields = spec?.fields || {};
  let listFields = Object.entries(fields).filter(([k, f]) => f.list).slice(0, 5);

  if (listFields.length === 0) {
    listFields = Object.entries(fields)
      .filter(([k]) => !['created_by', 'updated_by'].includes(k))
      .slice(0, 6);
  }

  if (listFields.length === 0 && items.length > 0) {
    listFields = Object.keys(items[0])
      .filter(k => !['created_by', 'updated_by'].includes(k))
      .slice(0, 5)
      .map(k => [k, { label: k }]);
  }

  const headers = listFields.map(([k, f]) => `<th>${f?.label || k}</th>`).join('');
  const emptyRow = items.length === 0 ? '<tr><td colspan="100" class="text-center py-8 text-gray-500">No items found. <a href="/' + entityName + '/new" class="text-primary hover:underline">Create your first ' + label.toLowerCase() + '</a></td></tr>' : '';

  const deleteScript = `
    let pendingDeleteId = null;
    window.confirmDelete = (id) => {
      pendingDeleteId = id;
      document.getElementById('confirm-dialog').style.display = 'flex';
    };
    window.cancelDelete = () => {
      pendingDeleteId = null;
      document.getElementById('confirm-dialog').style.display = 'none';
    };
    window.executeDelete = async () => {
      if (!pendingDeleteId) return;
      const btn = document.getElementById('confirm-delete-btn');
      btn.classList.add('btn-loading');
      btn.textContent = 'Deleting...';
      const res = await fetch('/api/${entityName}/' + pendingDeleteId, { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else { alert('Delete failed'); cancelDelete(); btn.classList.remove('btn-loading'); btn.textContent = 'Delete'; }
    };
  `;

  const searchScript = `
    const searchInput = document.getElementById('search-input');
    const tableBody = document.getElementById('table-body');
    const allRows = Array.from(tableBody.querySelectorAll('tr[data-searchable]'));

    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      allRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });
    });
  `;

  const rowsWithData = items.map(item => {
    const cells = listFields.map(([k]) => `<td>${formatValue(item[k], k, item)}</td>`).join('');
    const actions = `<td class="flex gap-1">
      <a href="/${entityName}/${item.id}" class="btn btn-xs btn-ghost">View</a>
      <a href="/${entityName}/${item.id}/edit" class="btn btn-xs btn-outline">Edit</a>
      <button onclick="event.stopPropagation(); confirmDelete('${item.id}')" class="btn btn-xs btn-error btn-outline">Delete</button>
    </td>`;
    return `<tr class="hover cursor-pointer" data-searchable onclick="window.location='/${entityName}/${item.id}'">${cells}${actions}</tr>`;
  }).join('');

  const body = `
    <div class="min-h-screen">
      ${renderNav(user)}
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">${label}</h1>
          <div class="flex gap-2">
            <input type="text" id="search-input" placeholder="Search..." class="input input-bordered input-sm" style="width: 200px" />
            <a href="/${entityName}/new" class="btn btn-primary btn-sm">Create New</a>
          </div>
        </div>

        <div class="card bg-white shadow" style="overflow-x:auto">
          <table class="table table-zebra w-full">
            <thead><tr>${headers}<th>Actions</th></tr></thead>
            <tbody id="table-body">${rowsWithData || emptyRow}</tbody>
          </table>
        </div>
      </div>
      <div id="confirm-dialog" class="confirm-overlay" style="display:none">
        <div class="confirm-dialog">
          <div class="confirm-title">Confirm Delete</div>
          <div class="confirm-message">Are you sure you want to delete this item? This action cannot be undone.</div>
          <div class="confirm-actions">
            <button onclick="cancelDelete()" class="btn btn-ghost">Cancel</button>
            <button id="confirm-delete-btn" onclick="executeDelete()" class="btn btn-error">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `;

  return generateHtml(label, body, [deleteScript, searchScript]);
}

export function renderEntityDetail(entityName, item, spec, user) {
  const label = spec?.label || entityName;
  const fields = spec?.fields || {};

  const fieldRows = Object.entries(fields)
    .filter(([k]) => k !== 'id' && item[k] !== undefined)
    .map(([k, f]) => `
      <div class="py-2 border-b">
        <span class="text-gray-500 text-sm">${f.label || k}</span>
        <p class="font-medium">${formatValue(item[k], k, item)}</p>
      </div>
    `).join('');

  const body = `
    <div class="min-h-screen">
      ${renderNav(user)}
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <a href="/${entityName}" class="text-sm text-primary hover:underline">&larr; Back to list</a>
            <h1 class="text-2xl font-bold">${item.name || label} #${item.id}</h1>
          </div>
          <div class="flex gap-2">
            <a href="/${entityName}/${item.id}/edit" class="btn btn-outline">Edit</a>
            <button onclick="showDeleteConfirm()" class="btn btn-error btn-outline">Delete</button>
          </div>
        </div>

        <div class="card bg-white shadow">
          <div class="card-body">
            ${fieldRows}
          </div>
        </div>
      </div>
      <div id="confirm-dialog" class="confirm-overlay" style="display:none">
        <div class="confirm-dialog">
          <div class="confirm-title">Confirm Delete</div>
          <div class="confirm-message">Are you sure you want to delete this item? This action cannot be undone.</div>
          <div class="confirm-actions">
            <button onclick="hideDeleteConfirm()" class="btn btn-ghost">Cancel</button>
            <button id="confirm-delete-btn" onclick="executeDelete()" class="btn btn-error">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const script = `
    window.showDeleteConfirm = () => {
      document.getElementById('confirm-dialog').style.display = 'flex';
    };
    window.hideDeleteConfirm = () => {
      document.getElementById('confirm-dialog').style.display = 'none';
    };
    window.executeDelete = async () => {
      const btn = document.getElementById('confirm-delete-btn');
      btn.classList.add('btn-loading');
      btn.textContent = 'Deleting...';
      const res = await fetch('/api/${entityName}/${item.id}', { method: 'DELETE' });
      if (res.ok) window.location = '/${entityName}';
      else { alert('Delete failed'); hideDeleteConfirm(); btn.classList.remove('btn-loading'); btn.textContent = 'Delete'; }
    };
  `;

  return generateHtml(`${label} Detail`, body, [script]);
}

export function renderEntityForm(entityName, item, spec, user, isNew = false) {
  const label = spec?.label || entityName;
  const fields = spec?.fields || {};

  const userRoleOptions = ['partner', 'manager', 'clerk', 'client_admin', 'client_user'];
  const userStatusOptions = ['active', 'inactive', 'pending'];

  const formFields = Object.entries(fields)
    .filter(([k, f]) => k !== 'id' && !f.auto && !f.readOnly && k !== 'password_hash')
    .map(([k, f]) => {
      const val = item?.[k] ?? f.default ?? '';
      const required = f.required ? 'required' : '';
      const reqMarker = f.required ? '<span class="required-marker">*</span>' : '';
      const type = f.type === 'number' || f.type === 'int' ? 'number'
                 : f.type === 'email' ? 'email'
                 : f.type === 'timestamp' || f.type === 'date' ? 'date'
                 : f.type === 'bool' ? 'checkbox'
                 : 'text';

      if (entityName === 'user' && k === 'role') {
        const opts = userRoleOptions.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o.charAt(0).toUpperCase() + o.slice(1).replace('_', ' ')}</option>`).join('');
        return `<div class="form-group"><label class="form-label">Role${reqMarker}</label><select name="role" class="select select-bordered w-full" ${required}>${opts}</select></div>`;
      }
      if (entityName === 'user' && k === 'status') {
        const opts = userStatusOptions.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o.charAt(0).toUpperCase() + o.slice(1)}</option>`).join('');
        return `<div class="form-group"><label class="form-label">Status</label><select name="status" class="select select-bordered w-full">${opts}</select></div>`;
      }
      if (f.type === 'textarea') {
        return `<div class="form-group"><label class="form-label">${f.label || k}${reqMarker}</label><textarea name="${k}" class="textarea textarea-bordered w-full" ${required}>${val}</textarea></div>`;
      }
      if (f.type === 'bool') {
        return `<div class="form-group"><label class="flex items-center gap-2"><input type="checkbox" name="${k}" class="checkbox" ${val ? 'checked' : ''}/><span>${f.label || k}</span></label></div>`;
      }
      if (f.type === 'enum' && f.options) {
        const opts = (Array.isArray(f.options) ? f.options : []).map(o => {
          const optVal = typeof o === 'string' ? o : o.value;
          const optLabel = typeof o === 'string' ? o : o.label;
          return `<option value="${optVal}" ${val === optVal ? 'selected' : ''}>${optLabel}</option>`;
        }).join('');
        return `<div class="form-group"><label class="form-label">${f.label || k}${reqMarker}</label><select name="${k}" class="select select-bordered w-full" ${required}><option value="">Select...</option>${opts}</select></div>`;
      }
      return `<div class="form-group"><label class="form-label">${f.label || k}${reqMarker}</label><input type="${type}" name="${k}" value="${val}" class="input input-bordered w-full" ${required}/></div>`;
    }).join('\n');

  const passwordField = entityName === 'user' ? `
    <div class="form-group">
      <label class="form-label">New Password <small class="text-gray-500">(leave blank to keep unchanged)</small></label>
      <input type="password" name="new_password" class="input input-bordered w-full" placeholder="Enter new password" autocomplete="new-password"/>
    </div>` : '';

  const body = `
    <div class="min-h-screen">
      ${renderNav(user)}
      <div class="p-6">
        <div class="mb-6">
          <a href="/${entityName}" class="text-sm text-primary hover:underline">&larr; Back to list</a>
          <h1 class="text-2xl font-bold">${isNew ? 'Create' : 'Edit'} ${label}</h1>
        </div>

        <div class="card bg-white shadow max-w-2xl">
          <div class="card-body">
            <form id="entity-form" class="space-y-4">
              ${formFields}
              ${passwordField}
              <div class="flex gap-2 pt-4">
                <button type="submit" id="submit-btn" class="btn btn-primary">Save</button>
                <a href="/${entityName}" class="btn btn-ghost">Cancel</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  const script = `
    const form = document.getElementById('entity-form');
    const submitBtn = document.getElementById('submit-btn');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.classList.add('btn-loading');
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;

      const fd = new FormData(form);
      const data = {};
      for (const [k, v] of fd.entries()) data[k] = v;
      form.querySelectorAll('input[type=checkbox]').forEach(cb => {
        data[cb.name] = cb.checked;
      });

      const url = ${isNew} ? '/api/${entityName}' : '/api/${entityName}/${item?.id}';
      const method = ${isNew} ? 'POST' : 'PUT';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
          const entityData = result.data || result;
          window.location = '/${entityName}/' + (entityData.id || '${item?.id}');
        } else {
          alert(result.message || result.error || 'Save failed');
          submitBtn.classList.remove('btn-loading');
          submitBtn.textContent = 'Save';
          submitBtn.disabled = false;
        }
      } catch (err) {
        alert('Error: ' + err.message);
        submitBtn.classList.remove('btn-loading');
        submitBtn.textContent = 'Save';
        submitBtn.disabled = false;
      }
    });
  `;

  return generateHtml(`${isNew ? 'Create' : 'Edit'} ${label}`, body, [script]);
}

export function renderSettings(user, config = {}) {
  const body = `
    <div class="min-h-screen">
      ${renderNav(user)}
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-6">System Settings</h1>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card bg-white shadow">
            <div class="card-body">
              <h2 class="card-title">System Information</h2>
              <div class="space-y-4 mt-4">
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Database Type</span>
                  <span class="font-medium">${config.database?.type || 'SQLite'}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Server Port</span>
                  <span class="font-medium">${config.server?.port || 3004}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Session TTL</span>
                  <span class="font-medium">${config.thresholds?.cache?.session_ttl_seconds || 3600}s</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Page Size (Default)</span>
                  <span class="font-medium">${config.thresholds?.system?.default_page_size || 50}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Page Size (Max)</span>
                  <span class="font-medium">${config.thresholds?.system?.max_page_size || 500}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card bg-white shadow">
            <div class="card-body">
              <h2 class="card-title">RFI Configuration</h2>
              <div class="space-y-4 mt-4">
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Max Days Outstanding</span>
                  <span class="font-medium">${config.thresholds?.rfi?.max_days_outstanding || 90} days</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Escalation Delay</span>
                  <span class="font-medium">${config.thresholds?.rfi?.escalation_delay_hours || 24} hours</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Notification Days</span>
                  <span class="font-medium">${(config.thresholds?.rfi?.notification_days || [7,3,1,0]).join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card bg-white shadow">
            <div class="card-body">
              <h2 class="card-title">Email Configuration</h2>
              <div class="space-y-4 mt-4">
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Batch Size</span>
                  <span class="font-medium">${config.thresholds?.email?.send_batch_size || 10}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Max Retries</span>
                  <span class="font-medium">${config.thresholds?.email?.send_max_retries || 3}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Rate Limit Delay</span>
                  <span class="font-medium">${config.thresholds?.email?.rate_limit_delay_ms || 6000}ms</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card bg-white shadow">
            <div class="card-body">
              <h2 class="card-title">Workflow Configuration</h2>
              <div class="space-y-4 mt-4">
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Stage Transition Lockout</span>
                  <span class="font-medium">${config.thresholds?.workflow?.stage_transition_lockout_minutes || 5} minutes</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Collaborator Default Expiry</span>
                  <span class="font-medium">${config.thresholds?.collaborator?.default_expiry_days || 7} days</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="text-gray-500">Collaborator Max Expiry</span>
                  <span class="font-medium">${config.thresholds?.collaborator?.max_expiry_days || 30} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  return generateHtml('System Settings', body, []);
}

export function renderAuditDashboard(user, auditData = {}) {
  const { summary = {}, recentActivity = [] } = auditData;

  const activityRows = recentActivity.slice(0, 20).map(a => `
    <tr>
      <td>${new Date((a.timestamp || a.created_at) * 1000).toLocaleString()}</td>
      <td><span class="badge badge-sm">${a.action || '-'}</span></td>
      <td>${a.entity_type || '-'}</td>
      <td class="text-xs">${a.entity_id || '-'}</td>
      <td>${a.user_name || a.user_id || '-'}</td>
      <td class="text-xs text-gray-500">${a.reason || '-'}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="text-center py-4 text-gray-500">No audit records found</td></tr>';

  const body = `
    <div class="min-h-screen">
      ${renderNav(user)}
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-6">Audit Dashboard</h1>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Total Actions (30d)</h3>
              <p class="text-2xl font-bold">${summary.total_actions || 0}</p>
            </div>
          </div>
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Permission Grants</h3>
              <p class="text-2xl font-bold text-green-600">${summary.grants || 0}</p>
            </div>
          </div>
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Permission Revokes</h3>
              <p class="text-2xl font-bold text-red-600">${summary.revokes || 0}</p>
            </div>
          </div>
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Role Changes</h3>
              <p class="text-2xl font-bold text-blue-600">${summary.role_changes || 0}</p>
            </div>
          </div>
        </div>

        <div class="card bg-white shadow">
          <div class="card-body">
            <div class="flex justify-between items-center mb-4">
              <h2 class="card-title">Recent Activity</h2>
              <a href="/permission_audit" class="btn btn-sm btn-outline">View All Records</a>
            </div>
            <div style="overflow-x:auto">
              <table class="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Entity Type</th>
                    <th>Entity ID</th>
                    <th>User</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>${activityRows}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  return generateHtml('Audit Dashboard', body, []);
}

export function renderSystemHealth(user, healthData = {}) {
  const { database = {}, server = {}, entities = {} } = healthData;

  const entityRows = Object.entries(entities).map(([name, count]) => `
    <tr>
      <td>${name}</td>
      <td class="text-right">${count}</td>
    </tr>
  `).join('') || '<tr><td colspan="2" class="text-center py-4">No data</td></tr>';

  const body = `
    <div class="min-h-screen">
      ${renderNav(user)}
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-6">System Health</h1>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Server Status</h3>
              <p class="text-2xl font-bold text-green-600">Online</p>
              <p class="text-xs text-gray-500 mt-2">Port: ${server.port || 3004}</p>
            </div>
          </div>
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Database</h3>
              <p class="text-2xl font-bold text-green-600">${database.status || 'Connected'}</p>
              <p class="text-xs text-gray-500 mt-2">Size: ${database.size || 'N/A'}</p>
            </div>
          </div>
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Uptime</h3>
              <p class="text-2xl font-bold">${server.uptime || 'N/A'}</p>
              <p class="text-xs text-gray-500 mt-2">Started: ${server.startTime || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div class="card bg-white shadow">
          <div class="card-body">
            <h2 class="card-title mb-4">Entity Counts</h2>
            <table class="table w-full">
              <thead>
                <tr><th>Entity</th><th class="text-right">Count</th></tr>
              </thead>
              <tbody>${entityRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  return generateHtml('System Health', body, []);
}

function renderNav(user) {
  const isAdmin = user?.role === 'partner';
  const isManager = user?.role === 'manager';
  const adminLinks = isAdmin ? `
    <a href="/user" class="btn btn-ghost btn-sm">Users</a>
    <a href="/team" class="btn btn-ghost btn-sm">Teams</a>
    <a href="/admin/audit" class="btn btn-ghost btn-sm">Audit</a>
    <a href="/admin/health" class="btn btn-ghost btn-sm">Health</a>
    <a href="/admin/settings" class="btn btn-ghost btn-sm">Settings</a>
  ` : (isManager ? `
    <a href="/admin/audit" class="btn btn-ghost btn-sm">Audit</a>
  ` : '');

  return `
    <nav class="navbar bg-white shadow-sm px-4">
      <div class="navbar-start">
        <a href="/" class="font-bold text-lg">Platform</a>
        <div class="hidden md:flex gap-1 ml-6">
          <a href="/engagement" class="btn btn-ghost btn-sm">Engagements</a>
          <a href="/client" class="btn btn-ghost btn-sm">Clients</a>
          <a href="/rfi" class="btn btn-ghost btn-sm">RFIs</a>
          <a href="/review" class="btn btn-ghost btn-sm">Reviews</a>
          ${adminLinks}
        </div>
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
    <script>
      function toggleUserMenu(e) {
        e.stopPropagation();
        document.getElementById('user-dropdown').classList.toggle('open');
      }
      document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown && !dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
    </script>
  `;
}
