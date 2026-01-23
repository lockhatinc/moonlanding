import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '../..');

export const REDIRECT = Symbol('REDIRECT');

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
  const body = `
    <div class="min-h-screen">
      <nav class="navbar bg-white shadow-sm px-4">
        <div class="navbar-start">
          <span class="font-bold text-lg">Platform</span>
        </div>
        <div class="navbar-end">
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-ghost btn-circle avatar placeholder">
              <div class="bg-primary text-white rounded-full w-10">
                <span>${user.name?.charAt(0) || 'U'}</span>
              </div>
            </label>
            <ul tabindex="0" class="dropdown-menu dropdown-menu-bottom-left mt-2 w-52">
              <li class="dropdown-header">${user.email}</li>
              <li><a href="/api/auth/logout">Logout</a></li>
            </ul>
          </div>
        </div>
      </nav>

      <div class="p-6">
        <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Engagements</h3>
              <p class="text-2xl font-bold">${stats.engagements || 0}</p>
            </div>
          </div>
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Clients</h3>
              <p class="text-2xl font-bold">${stats.clients || 0}</p>
            </div>
          </div>
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Open RFIs</h3>
              <p class="text-2xl font-bold">${stats.rfis || 0}</p>
            </div>
          </div>
          <div class="card bg-white shadow">
            <div class="card-body">
              <h3 class="text-gray-500 text-sm">Reviews</h3>
              <p class="text-2xl font-bold">${stats.reviews || 0}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card bg-white shadow">
            <div class="card-body">
              <h2 class="card-title">Quick Actions</h2>
              <div class="flex flex-wrap gap-2 mt-4">
                <a href="/engagement/new" class="btn btn-primary btn-sm">New Engagement</a>
                <a href="/client/new" class="btn btn-outline btn-sm">New Client</a>
                <a href="/review/new" class="btn btn-outline btn-sm">New Review</a>
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
                <a href="/user" class="btn btn-ghost btn-sm">Users</a>
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
  const rows = items.map(item => {
    const cells = listFields.map(([k]) => `<td>${item[k] ?? ''}</td>`).join('');
    return `<tr class="hover cursor-pointer" onclick="window.location='/${entityName}/${item.id}'">${cells}</tr>`;
  }).join('');

  const body = `
    <div class="min-h-screen">
      ${renderNav(user)}
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">${label}</h1>
          <a href="/${entityName}/new" class="btn btn-primary">Create New</a>
        </div>

        <div class="card bg-white shadow">
          <div class="card-body p-0">
            <table class="table table-zebra">
              <thead><tr>${headers}<th>Actions</th></tr></thead>
              <tbody>${rows || '<tr><td colspan="100" class="text-center py-8 text-gray-500">No items found</td></tr>'}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  return generateHtml(label, body, []);
}

export function renderEntityDetail(entityName, item, spec, user) {
  const label = spec?.label || entityName;
  const fields = spec?.fields || {};

  const fieldRows = Object.entries(fields)
    .filter(([k]) => k !== 'id' && item[k] !== undefined)
    .map(([k, f]) => `
      <div class="py-2 border-b">
        <span class="text-gray-500 text-sm">${f.label || k}</span>
        <p class="font-medium">${item[k] ?? '-'}</p>
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
            <button onclick="deleteItem()" class="btn btn-error btn-outline">Delete</button>
          </div>
        </div>

        <div class="card bg-white shadow">
          <div class="card-body">
            ${fieldRows}
          </div>
        </div>
      </div>
    </div>
  `;

  const script = `
    window.deleteItem = async () => {
      if (!confirm('Delete this item?')) return;
      const res = await fetch('/api/${entityName}/${item.id}', { method: 'DELETE' });
      if (res.ok) window.location = '/${entityName}';
      else alert('Delete failed');
    };
  `;

  return generateHtml(`${label} Detail`, body, [script]);
}

export function renderEntityForm(entityName, item, spec, user, isNew = false) {
  const label = spec?.label || entityName;
  const fields = spec?.fields || {};

  const formFields = Object.entries(fields)
    .filter(([k, f]) => k !== 'id' && !f.auto && !f.readOnly)
    .map(([k, f]) => {
      const val = item?.[k] ?? f.default ?? '';
      const required = f.required ? 'required' : '';
      const type = f.type === 'number' || f.type === 'int' ? 'number'
                 : f.type === 'email' ? 'email'
                 : f.type === 'timestamp' || f.type === 'date' ? 'date'
                 : f.type === 'bool' ? 'checkbox'
                 : 'text';

      if (f.type === 'textarea') {
        return `<div class="form-group"><label class="form-label">${f.label || k}</label><textarea name="${k}" class="textarea textarea-bordered w-full" ${required}>${val}</textarea></div>`;
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
        return `<div class="form-group"><label class="form-label">${f.label || k}</label><select name="${k}" class="select select-bordered w-full" ${required}><option value="">Select...</option>${opts}</select></div>`;
      }
      return `<div class="form-group"><label class="form-label">${f.label || k}</label><input type="${type}" name="${k}" value="${val}" class="input input-bordered w-full" ${required}/></div>`;
    }).join('\n');

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
              <div class="flex gap-2 pt-4">
                <button type="submit" class="btn btn-primary">Save</button>
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
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
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
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  `;

  return generateHtml(`${isNew ? 'Create' : 'Edit'} ${label}`, body, [script]);
}

function renderNav(user) {
  return `
    <nav class="navbar bg-white shadow-sm px-4">
      <div class="navbar-start">
        <a href="/" class="font-bold text-lg">Platform</a>
        <div class="hidden md:flex gap-1 ml-6">
          <a href="/engagement" class="btn btn-ghost btn-sm">Engagements</a>
          <a href="/client" class="btn btn-ghost btn-sm">Clients</a>
          <a href="/rfi" class="btn btn-ghost btn-sm">RFIs</a>
          <a href="/review" class="btn btn-ghost btn-sm">Reviews</a>
        </div>
      </div>
      <div class="navbar-end">
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-ghost btn-circle avatar placeholder">
            <div class="bg-primary text-white rounded-full w-10">
              <span>${user?.name?.charAt(0) || 'U'}</span>
            </div>
          </label>
          <ul tabindex="0" class="dropdown-menu dropdown-menu-bottom-left mt-2 w-52">
            <li class="dropdown-header">${user?.email || ''}</li>
            <li><a href="/api/auth/logout">Logout</a></li>
          </ul>
        </div>
      </div>
    </nav>
  `;
}
