import { canCreate, canEdit, canDelete } from '@/ui/permissions-ui.js';
import { generateHtml } from '@/ui/renderer.js';

const TOAST_SCRIPT = `window.showToast=(m,t='info')=>{let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.className='toast-container';c.setAttribute('role','status');c.setAttribute('aria-live','polite');c.setAttribute('aria-atomic','true');document.body.appendChild(c)}const d=document.createElement('div');d.className='toast toast-'+t;d.textContent=m;c.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},3000)};`;

function nav(user) {
  const { getNavItems, getAdminItems } = require_perms();
  const navLinks = getNavItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  const adminLinks = getAdminItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  return `<nav class="navbar bg-white shadow-sm px-4" role="navigation" aria-label="Main navigation">
  <div class="navbar-start">
    <a href="/" class="font-bold text-lg" aria-label="Home">Platform</a>
    <div class="hidden md:flex gap-1 ml-6">${navLinks}${adminLinks}</div>
  </div>
  <div class="navbar-end">
    <div id="user-dropdown" class="dropdown dropdown-end">
      <button type="button" onclick="toggleUserMenu(event)" class="btn btn-ghost btn-circle avatar placeholder" aria-label="User menu for ${user?.name || 'user'}" aria-haspopup="menu" aria-expanded="false" style="cursor:pointer">
        <div class="bg-primary text-white rounded-full w-10 flex items-center justify-content-center" style="display:flex;align-items:center;justify-content:center;height:2.5rem">
          <span aria-hidden="true">${user?.name?.charAt(0) || 'U'}</span>
        </div>
      </button>
      <ul class="dropdown-menu mt-2 w-52" role="menu">
        <li class="dropdown-header" role="presentation">${user?.email || ''}<br/><small class="text-gray-500">${user?.role || ''}</small></li>
        <li role="menuitem"><a href="/api/auth/logout">Logout</a></li>
      </ul>
    </div>
  </div>
</nav>
<script>function toggleUserMenu(e){e.stopPropagation();var d=document.getElementById('user-dropdown');var isOpen=d.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',isOpen)}document.addEventListener('click',function(e){var d=document.getElementById('user-dropdown');if(d&&!d.contains(e.target)){d.classList.remove('open');var btn=d.querySelector('button');if(btn)btn.setAttribute('aria-expanded','false')}})</script>`;
}

function require_perms() {
  return { getNavItems: (await_import_cache || {}).getNavItems, getAdminItems: (await_import_cache || {}).getAdminItems };
}

let await_import_cache = null;
import { getNavItems, getAdminItems } from '@/ui/permissions-ui.js';
await_import_cache = { getNavItems, getAdminItems };

function breadcrumb(items) {
  if (!items?.length) return '';
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map((item, i) =>
    i === items.length - 1 ? `<span>${item.label}</span>` : `<a href="${item.href}">${item.label}</a><span class="breadcrumb-separator">/</span>`
  ).join('')}</nav>`;
}

function page(user, title, bc, content, scripts = []) {
  const body = `<div class="min-h-screen">${nav(user)}<main id="main-content" role="main"><div class="p-6">${breadcrumb(bc)}${content}</div></main></div>`;
  return generateHtml(title, body, scripts);
}

function settingsBack() {
  return `<a href="/admin/settings" class="settings-back">&#8592; Back to Settings</a>`;
}

const SETTINGS_CARDS = [
  { key: 'system', icon: '&#9881;', title: 'System Info', desc: 'Database, server, cache configuration', href: '/admin/settings/system' },
  { key: 'users', icon: '&#128100;', title: 'Users', desc: 'Manage user accounts and roles', href: '/admin/settings/users', countKey: 'users' },
  { key: 'teams', icon: '&#128101;', title: 'Teams', desc: 'Manage audit teams', href: '/admin/settings/teams', countKey: 'teams' },
  { key: 'rfi-sections', icon: '&#128193;', title: 'RFI Sections', desc: 'Manage RFI section categories and colors', href: '/admin/settings/rfi-sections', countKey: 'rfiSections' },
  { key: 'templates', icon: '&#128196;', title: 'Templates', desc: 'Review templates and sections', href: '/admin/settings/templates', countKey: 'templates' },
  { key: 'notifications', icon: '&#128276;', title: 'Notifications', desc: 'Configure alerts, reminders, and reports', href: '/admin/settings/notifications' },
  { key: 'integrations', icon: '&#128279;', title: 'Integrations', desc: 'Google Drive, Gmail, and external services', href: '/admin/settings/integrations' },
  { key: 'checklists', icon: '&#9745;', title: 'Checklists', desc: 'Manage checklist definitions', href: '/admin/settings/checklists', countKey: 'checklists' },
  { key: 'recreation', icon: '&#128203;', title: 'Recreation Logs', desc: 'Audit trail and recreation history', href: '/admin/settings/recreation', countKey: 'recreation' },
];

export function renderSettingsHome(user, config = {}, counts = {}) {
  const cards = SETTINGS_CARDS.map(c => {
    const countBadge = c.countKey && counts[c.countKey] !== undefined
      ? `<span class="settings-card-count">${counts[c.countKey]} items</span>` : '';
    return `<a href="${c.href}" class="settings-card">
      <div class="settings-card-icon">${c.icon}</div>
      <div class="settings-card-body">
        <div class="settings-card-title">${c.title}</div>
        <div class="settings-card-desc">${c.desc}</div>
        ${countBadge}
      </div>
    </a>`;
  }).join('');
  const content = `<h1 class="text-2xl font-bold mb-6">Settings</h1><div class="settings-grid">${cards}</div>`;
  return page(user, 'Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }], content);
}

export function renderSettingsSystem(user, config = {}) {
  const t = config.thresholds || {};
  const sections = [
    { title: 'System Information', items: [['Database Type', config.database?.type || 'SQLite'], ['Server Port', config.server?.port || 3004], ['Session TTL', (t.cache?.session_ttl_seconds || 3600) + 's'], ['Page Size (Default)', t.system?.default_page_size || 50], ['Page Size (Max)', t.system?.max_page_size || 500]] },
    { title: 'RFI Configuration', items: [['Max Days Outstanding', (t.rfi?.max_days_outstanding || 90) + ' days'], ['Escalation Delay', (t.rfi?.escalation_delay_hours || 24) + ' hours'], ['Notification Days', (t.rfi?.notification_days || [7, 3, 1, 0]).join(', ')]] },
    { title: 'Email Configuration', items: [['Batch Size', t.email?.send_batch_size || 10], ['Max Retries', t.email?.send_max_retries || 3], ['Rate Limit Delay', (t.email?.rate_limit_delay_ms || 6000) + 'ms']] },
    { title: 'Workflow Configuration', items: [['Stage Transition Lockout', (t.workflow?.stage_transition_lockout_minutes || 5) + ' minutes'], ['Collaborator Default Expiry', (t.collaborator?.default_expiry_days || 7) + ' days'], ['Collaborator Max Expiry', (t.collaborator?.max_expiry_days || 30) + ' days']] },
  ];
  const cards = sections.map(s => `<div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">${s.title}</h2><div class="space-y-4 mt-4">${s.items.map(([l, v]) => `<div class="flex justify-between py-2 border-b"><span class="text-gray-500">${l}</span><span class="font-medium">${v}</span></div>`).join('')}</div></div></div>`).join('');
  const content = `${settingsBack()}<h1 class="text-2xl font-bold mb-6">System Info</h1><div class="grid grid-cols-1 lg:grid-cols-2 gap-6">${cards}</div>`;
  return page(user, 'System Info - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/system', label: 'System Info' }], content);
}

export function renderSettingsUsers(user, users = []) {
  const rows = users.map(u => `<tr class="hover cursor-pointer" tabindex="0" role="link" onclick="window.location='/user/${u.id}'" onkeydown="if(event.key==='Enter'){window.location='/user/${u.id}'}">
    <td>${u.name || '-'}</td><td>${u.email || '-'}</td>
    <td><span class="badge-status" style="background:#dbeafe;color:#1e40af">${u.role || '-'}</span></td>
    <td><span class="badge-status" style="background:${u.status === 'active' ? '#d1fae5;color:#065f46' : '#fef3c7;color:#92400e'}">${u.status || '-'}</span></td>
    <td><a href="/user/${u.id}/edit" class="btn btn-xs btn-outline">Edit</a></td>
  </tr>`).join('');
  const empty = `<tr><td colspan="5" class="text-center py-8 text-gray-500">No users found</td></tr>`;
  const content = `${settingsBack()}<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Users</h1>
    <a href="/user/new" class="btn btn-primary btn-sm">Add User</a></div>
    <div class="card bg-white shadow" style="overflow-x:auto"><table class="table table-zebra w-full"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows || empty}</tbody></table></div>`;
  return page(user, 'Users - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/users', label: 'Users' }], content);
}

export function renderSettingsTeams(user, teams = []) {
  const rows = teams.map(t => `<tr class="hover cursor-pointer" tabindex="0" role="link" onclick="window.location='/team/${t.id}'" onkeydown="if(event.key==='Enter'){window.location='/team/${t.id}'}">
    <td>${t.name || '-'}</td><td>${t.member_count || 0}</td>
    <td><a href="/team/${t.id}/edit" class="btn btn-xs btn-outline">Edit</a></td>
  </tr>`).join('');
  const empty = `<tr><td colspan="3" class="text-center py-8 text-gray-500">No teams found</td></tr>`;
  const content = `${settingsBack()}<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Teams</h1>
    <a href="/team/new" class="btn btn-primary btn-sm">Add Team</a></div>
    <div class="card bg-white shadow" style="overflow-x:auto"><table class="table table-zebra w-full"><thead><tr><th>Name</th><th>Members</th><th>Actions</th></tr></thead><tbody>${rows || empty}</tbody></table></div>`;
  return page(user, 'Teams - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/teams', label: 'Teams' }], content);
}

const RFI_PALETTE = ['#B0B0B0', '#44BBA4', '#FF4141', '#7F7EFF', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export function renderSettingsRfiSections(user, sections = []) {
  const rows = sections.map((s, i) => `<tr data-id="${s.id}">
    <td><span class="color-swatch" style="background:${s.color || '#B0B0B0'}"></span></td>
    <td>${s.name || '-'}</td><td>${s.order ?? i}</td>
    <td class="flex gap-1">
      <button onclick="moveSection('${s.id}','up')" class="reorder-btn" ${i === 0 ? 'disabled' : ''}>&#9650;</button>
      <button onclick="moveSection('${s.id}','down')" class="reorder-btn" ${i === sections.length - 1 ? 'disabled' : ''}>&#9660;</button>
      <button onclick="editSection('${s.id}','${(s.name || '').replace(/'/g, "\\'")}','${s.color || '#B0B0B0'}')" class="btn btn-xs btn-outline">Edit</button>
      <button onclick="deleteSection('${s.id}')" class="btn btn-xs btn-error btn-outline">Delete</button>
    </td></tr>`).join('');
  const empty = `<tr><td colspan="4" class="text-center py-8 text-gray-500">No RFI sections. Add one below.</td></tr>`;
  const palette = RFI_PALETTE.map(c => `<div class="color-palette-item" data-color="${c}" style="background:${c}" role="option" tabindex="0" aria-label="Color ${c}" onclick="selectColor('${c}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectColor('${c}')}"></div>`).join('');
  const content = `${settingsBack()}<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">RFI Sections</h1>
    <button onclick="toggleAddForm()" class="btn btn-primary btn-sm" id="add-btn">Add Section</button></div>
    <div id="section-form" class="inline-form" style="display:none;margin-bottom:1rem">
      <div class="inline-form-row">
        <div class="inline-form-field"><label for="section-name">Name</label><input type="text"  id="section-name" class="input input-bordered input-sm" style="width:200px" placeholder="Section name"/></div>
        <div class="inline-form-field"><label>Color</label><div class="color-palette" id="color-palette">${palette}</div><input type="hidden" id="section-color" value="#B0B0B0"/></div>
        <div class="inline-form-field"><label>&nbsp;</label><div class="flex gap-2"><button onclick="saveSection()" class="btn btn-primary btn-sm">Save</button><button onclick="cancelForm()" class="btn btn-ghost btn-sm">Cancel</button></div></div>
      </div>
      <input type="hidden" id="edit-id" value=""/>
    </div>
    <div class="card bg-white shadow" style="overflow-x:auto"><table class="table table-zebra w-full"><thead><tr><th style="width:40px">Color</th><th>Name</th><th style="width:60px">Order</th><th>Actions</th></tr></thead><tbody id="sections-body">${rows || empty}</tbody></table></div>`;
  const script = `${TOAST_SCRIPT}
    let editingId='';
    function toggleAddForm(){document.getElementById('section-form').style.display='block';document.getElementById('edit-id').value='';document.getElementById('section-name').value='';selectColor('#B0B0B0')}
    function cancelForm(){document.getElementById('section-form').style.display='none';editingId=''}
    function selectColor(c){document.getElementById('section-color').value=c;document.querySelectorAll('.color-palette-item').forEach(el=>{el.classList.toggle('selected',el.dataset.color===c)})}
    function editSection(id,name,color){document.getElementById('section-form').style.display='block';document.getElementById('edit-id').value=id;document.getElementById('section-name').value=name;selectColor(color);editingId=id}
    async function saveSection(){const name=document.getElementById('section-name').value.trim();const color=document.getElementById('section-color').value;const id=document.getElementById('edit-id').value;if(!name){showToast('Name is required','error');return}
      const url=id?'/api/rfi_section/'+id:'/api/rfi_section';const method=id?'PUT':'POST';
      try{const res=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({name,color})});if(res.ok){showToast(id?'Updated':'Created','success');setTimeout(()=>location.reload(),500)}else{const d=await res.json().catch(()=>({}));showToast(d.error||'Failed','error')}}catch(e){showToast('Error: '+e.message,'error')}}
    async function deleteSection(id){if(!confirm('Delete this section?'))return;try{const res=await fetch('/api/rfi_section/'+id,{method:'DELETE'});if(res.ok){showToast('Deleted','success');setTimeout(()=>location.reload(),500)}else{showToast('Delete failed','error')}}catch(e){showToast('Error: '+e.message,'error')}}
    async function moveSection(id,dir){try{const res=await fetch('/api/rfi_section/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({reorder:dir})});if(res.ok){location.reload()}else{showToast('Reorder failed','error')}}catch(e){showToast('Error: '+e.message,'error')}}
    selectColor('#B0B0B0');`;
  return page(user, 'RFI Sections - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/rfi-sections', label: 'RFI Sections' }], content, [script]);
}

export function renderSettingsTemplates(user, templates = []) {
  const rows = templates.map(t => `<tr class="hover cursor-pointer" tabindex="0" role="link" onclick="window.location='/review_template/${t.id}'" onkeydown="if(event.key==='Enter'){window.location='/review_template/${t.id}'}">
    <td>${t.name || '-'}</td><td><span class="badge-status" style="background:#ede9fe;color:#5b21b6">${t.type || 'standard'}</span></td>
    <td>${t.is_active ? '<span style="color:#22c55e">Active</span>' : '<span style="color:#9ca3af">Inactive</span>'}</td>
    <td><a href="/review_template/${t.id}/edit" class="btn btn-xs btn-outline">Edit</a></td>
  </tr>`).join('');
  const empty = `<tr><td colspan="4" class="text-center py-8 text-gray-500">No templates found</td></tr>`;
  const content = `${settingsBack()}<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Templates</h1>
    <a href="/review_template/new" class="btn btn-primary btn-sm">Add Template</a></div>
    <div class="card bg-white shadow" style="overflow-x:auto"><table class="table table-zebra w-full"><thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows || empty}</tbody></table></div>`;
  return page(user, 'Templates - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/templates', label: 'Templates' }], content);
}

export function renderSettingsNotifications(user, config = {}) {
  const t = config.thresholds || {};
  const notif = t.notification || {};
  const rfi = t.rfi || {};
  const toggles = [
    { id: 'rfi_reminders', label: 'RFI Reminders', desc: 'Send reminders for outstanding RFIs', checked: true },
    { id: 'deadline_alerts', label: 'Deadline Alerts', desc: 'Alert when deadlines are approaching', checked: true },
    { id: 'stage_transitions', label: 'Stage Transitions', desc: 'Notify on engagement stage changes', checked: true },
    { id: 'new_messages', label: 'New Messages', desc: 'Notify when new messages are received', checked: true },
    { id: 'weekly_reports', label: 'Weekly Reports', desc: 'Send weekly summary reports', checked: true },
  ];
  const toggleHtml = toggles.map(tg => `<div class="toggle-wrap">
    <div><div class="toggle-label">${tg.label}</div><div class="toggle-desc">${tg.desc}</div></div>
    <label class="toggle-switch"><input type="checkbox" name="${tg.id}" ${tg.checked ? 'checked' : ''} aria-label="${tg.label}"/><span class="toggle-slider"></span></label>
  </div>`).join('');
  const content = `${settingsBack()}<h1 class="text-2xl font-bold mb-6">Notifications</h1>
    <form id="notif-form">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">Notification Toggles</h2><div class="mt-4">${toggleHtml}</div></div></div>
      <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">Configuration</h2><div class="space-y-4 mt-4">
        <div class="form-group"><label class="form-label">RFI Notification Days</label><input type="text" name="notification_days" class="input input-bordered w-full" value="${(rfi.notification_days || [7, 3, 1, 0]).join(', ')}" placeholder="7, 3, 1, 0"/><p class="text-xs text-gray-500 mt-1">Comma-separated days before deadline</p></div>
        <div class="form-group"><label class="form-label">Escalation Delay (hours)</label><input type="number" name="escalation_delay_hours" class="input input-bordered w-full" value="${rfi.escalation_delay_hours || 24}"/></div>
        <div class="form-group"><label class="form-label">Batch Size</label><input type="number" name="batch_size" class="input input-bordered w-full" value="${notif.batch_size || 50}"/></div>
        <div class="form-group"><label class="form-label">Consolidation Window (hours)</label><input type="number" name="consolidation_window_hours" class="input input-bordered w-full" value="${notif.consolidation_window_hours || 24}"/></div>
      </div></div></div>
    </div>
    <div class="mt-6"><button type="submit" class="btn btn-primary">Save Notification Settings</button></div>
    </form>`;
  const script = `${TOAST_SCRIPT}document.getElementById('notif-form').addEventListener('submit',async(e)=>{e.preventDefault();const fd=new FormData(e.target);const data={};for(const[k,v]of fd.entries())data[k]=v;document.querySelectorAll('#notif-form input[type=checkbox]').forEach(cb=>{data[cb.name]=cb.checked});try{const res=await fetch('/api/admin/settings/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(res.ok){showToast('Settings saved','success')}else{showToast('Save failed','error')}}catch(err){showToast('Error: '+err.message,'error')}})`;
  return page(user, 'Notifications - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/notifications', label: 'Notifications' }], content, [script]);
}

const INTEGRATIONS = [
  { id: 'google_drive', icon: '&#128194;', name: 'Google Drive', desc: 'Document storage and collaboration', connected: false, lastSync: null },
  { id: 'gmail', icon: '&#9993;', name: 'Gmail', desc: 'Email integration for notifications', connected: false, lastSync: null },
  { id: 'firebase', icon: '&#128293;', name: 'Firebase (Legacy)', desc: 'Legacy data source for migration', connected: false, lastSync: null },
];

export function renderSettingsIntegrations(user, integrations = {}) {
  const cards = INTEGRATIONS.map(integ => {
    const state = integrations[integ.id] || {};
    const connected = state.connected || integ.connected;
    const lastSync = state.lastSync || integ.lastSync;
    return `<div class="integration-card">
      <div class="integration-icon">${integ.icon}</div>
      <div class="integration-body">
        <div class="integration-name">${integ.name}</div>
        <div class="integration-meta">${integ.desc}</div>
        ${lastSync ? `<div class="integration-meta">Last sync: ${lastSync}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem">
        <span class="integration-status"><span class="integration-dot ${connected ? 'integration-dot-on' : 'integration-dot-off'}"></span>${connected ? 'Connected' : 'Disconnected'}</span>
        <button onclick="toggleConfig('${integ.id}')" class="btn btn-xs btn-outline">Configure</button>
      </div>
    </div>
    <div id="config-${integ.id}" class="inline-form" style="display:none">
      <div class="inline-form-row">
        <div class="inline-form-field" style="flex:1"><label for="key-${integ.id}">API Key / Credentials</label><input type="password"  id="key-${integ.id}" class="input input-bordered input-sm w-full" placeholder="Enter API key or credentials path"/></div>
        <div class="inline-form-field"><label>&nbsp;</label><div class="flex gap-2">
          <button onclick="saveIntegration('${integ.id}')" class="btn btn-primary btn-sm">Save</button>
          <button onclick="testIntegration('${integ.id}')" class="btn btn-outline btn-sm">Test</button>
        </div></div>
      </div>
    </div>`;
  }).join('');
  const content = `${settingsBack()}<h1 class="text-2xl font-bold mb-6">Integrations</h1><div class="space-y-4">${cards}</div>`;
  const script = `${TOAST_SCRIPT}
    function toggleConfig(id){const el=document.getElementById('config-'+id);el.style.display=el.style.display==='none'?'block':'none'}
    async function saveIntegration(id){const key=document.getElementById('key-'+id).value;if(!key){showToast('Enter credentials','error');return}showToast('Integration saved','success');toggleConfig(id)}
    async function testIntegration(id){showToast('Testing connection...','info');setTimeout(()=>showToast('Connection test complete','success'),1000)}`;
  return page(user, 'Integrations - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/integrations', label: 'Integrations' }], content, [script]);
}

export function renderSettingsChecklists(user, checklists = []) {
  const rows = checklists.map(c => `<tr class="hover cursor-pointer" tabindex="0" role="link" onclick="window.location='/checklist/${c.id}'" onkeydown="if(event.key==='Enter'){window.location='/checklist/${c.id}'}">
    <td>${c.name || '-'}</td><td>${c.type || '-'}</td>
    <td>${c.review_id || '-'}</td>
    <td><a href="/checklist/${c.id}/edit" class="btn btn-xs btn-outline">Edit</a></td>
  </tr>`).join('');
  const empty = `<tr><td colspan="4" class="text-center py-8 text-gray-500">No checklists found</td></tr>`;
  const content = `${settingsBack()}<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Checklists</h1>
    <a href="/checklist/new" class="btn btn-primary btn-sm">Add Checklist</a></div>
    <div class="card bg-white shadow" style="overflow-x:auto"><table class="table table-zebra w-full"><thead><tr><th>Name</th><th>Type</th><th>Review</th><th>Actions</th></tr></thead><tbody>${rows || empty}</tbody></table></div>`;
  return page(user, 'Checklists - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/checklists', label: 'Checklists' }], content);
}

export function renderSettingsRecreation(user, logs = [], users = []) {
  const userOpts = users.map(u => `<option value="${u.id}">${u.name || u.email || u.id}</option>`).join('');
  const rows = logs.map(l => {
    const ts = l.timestamp || l.created_at;
    const date = ts ? (typeof ts === 'number' && ts > 1000000000 ? new Date(ts * 1000).toLocaleString() : new Date(ts).toLocaleString()) : '-';
    return `<tr>
      <td class="text-sm">${date}</td>
      <td>${l.user_name || l.user_id || '-'}</td>
      <td><span class="badge-status" style="background:#dbeafe;color:#1e40af">${l.action || '-'}</span></td>
      <td>${l.entity_type || '-'}</td>
      <td class="text-xs">${l.entity_id || '-'}</td>
      <td class="text-xs text-gray-500">${l.reason || '-'}</td>
    </tr>`;
  }).join('');
  const empty = `<tr><td colspan="6" class="text-center py-8 text-gray-500">No recreation logs found</td></tr>`;
  const content = `${settingsBack()}<h1 class="text-2xl font-bold mb-6">Recreation Logs</h1>
    <div class="filter-bar">
      <div class="filter-field"><label for="filter-start">Start Date</label><input type="date"  id="filter-start" class="input input-bordered input-sm"/></div>
      <div class="filter-field"><label for="filter-end">End Date</label><input type="date"  id="filter-end" class="input input-bordered input-sm"/></div>
      <div class="filter-field"><label for="filter-user">User</label><select id="filter-user" class="select select-bordered select-sm"><option value="">All Users</option>${userOpts}</select></div>
      <div class="filter-field"><label>&nbsp;</label><button onclick="applyFilters()" class="btn btn-primary btn-sm">Filter</button></div>
    </div>
    <div class="card bg-white shadow" style="overflow-x:auto"><table class="table table-zebra w-full"><thead><tr><th>Date</th><th>User</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>Details</th></tr></thead><tbody id="log-body">${rows || empty}</tbody></table></div>`;
  const script = `function applyFilters(){const start=document.getElementById('filter-start').value;const end=document.getElementById('filter-end').value;const userId=document.getElementById('filter-user').value;const params=new URLSearchParams();if(start)params.set('start',start);if(end)params.set('end',end);if(userId)params.set('user_id',userId);window.location='/admin/settings/recreation'+(params.toString()?'?'+params:'');}`;
  return page(user, 'Recreation Logs - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/recreation', label: 'Recreation Logs' }], content, [script]);
}

export function renderSettingsReviewSettings(user, config = {}) {
  const review = config.review || {};
  const toggles = [
    { id: 'auto_save', label: 'Auto-save', desc: 'Automatically save review changes', checked: review.auto_save !== false },
    { id: 'highlight_notifications', label: 'Highlight Notifications', desc: 'Notify assignees when new highlights are added', checked: review.highlight_notifications !== false },
    { id: 'require_resolution', label: 'Require Resolution', desc: 'All highlights must be resolved before closing', checked: !!review.require_resolution },
    { id: 'allow_private', label: 'Allow Private Reviews', desc: 'Enable private review visibility option', checked: review.allow_private !== false },
    { id: 'enable_sections', label: 'Enable Sections', desc: 'Allow reviews to be organized into sections', checked: review.enable_sections !== false },
    { id: 'enable_wip_value', label: 'Enable WIP Value', desc: 'Track work-in-progress value for reviews', checked: !!review.enable_wip_value },
  ];
  const toggleHtml = toggles.map(tg => `<div class="toggle-wrap">
    <div><div class="toggle-label">${tg.label}</div><div class="toggle-desc">${tg.desc}</div></div>
    <label class="toggle-switch"><input type="checkbox" name="${tg.id}" ${tg.checked ? 'checked' : ''} aria-label="${tg.label}"/><span class="toggle-slider"></span></label>
  </div>`).join('');
  const content = `${settingsBack()}<h1 class="text-2xl font-bold mb-6">Review Settings</h1>
    <form id="review-settings-form">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">Review Options</h2><div class="mt-4">${toggleHtml}</div></div></div>
      <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">Defaults</h2><div class="space-y-4 mt-4">
        <div class="form-group"><label class="form-label">Default Status</label><select name="default_status" class="select select-bordered w-full"><option value="active" ${review.default_status === 'active' ? 'selected' : ''}>Active</option><option value="draft" ${review.default_status === 'draft' ? 'selected' : ''}>Draft</option></select></div>
        <div class="form-group"><label class="form-label">Max Highlights Per Review</label><input type="number" name="max_highlights" class="input input-bordered w-full" value="${review.max_highlights || 500}" min="1"/></div>
        <div class="form-group"><label class="form-label">Default Currency</label><select name="default_currency" class="select select-bordered w-full"><option value="ZAR" ${review.default_currency === 'ZAR' ? 'selected' : ''}>ZAR</option><option value="USD" ${review.default_currency === 'USD' ? 'selected' : ''}>USD</option><option value="EUR" ${review.default_currency === 'EUR' ? 'selected' : ''}>EUR</option><option value="GBP" ${review.default_currency === 'GBP' ? 'selected' : ''}>GBP</option></select></div>
      </div></div></div>
    </div>
    <div class="mt-6"><button type="submit" class="btn btn-primary">Save Review Settings</button></div>
    </form>`;
  const script = `${TOAST_SCRIPT}document.getElementById('review-settings-form').addEventListener('submit',async(e)=>{e.preventDefault();const fd=new FormData(e.target);const data={};for(const[k,v]of fd.entries())data[k]=v;document.querySelectorAll('#review-settings-form input[type=checkbox]').forEach(cb=>{data[cb.name]=cb.checked});document.querySelectorAll('#review-settings-form input[type=number]').forEach(n=>{if(data[n.name])data[n.name]=Number(data[n.name])});try{const res=await fetch('/api/admin/settings/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(res.ok){showToast('Settings saved','success')}else{showToast('Save failed','error')}}catch(err){showToast('Error: '+err.message,'error')}})`;
  return page(user, 'Review Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/review', label: 'Review Settings' }], content, [script]);
}

export function renderSettingsFileReview(user, config = {}) {
  const fileReview = config.fileReview || {};
  const toggles = [
    { id: 'auto_pdf_cache', label: 'Auto-cache PDFs', desc: 'Cache PDF files for faster loading', checked: fileReview.auto_pdf_cache !== false },
    { id: 'allow_annotations', label: 'Allow Annotations', desc: 'Enable PDF annotation tools', checked: fileReview.allow_annotations !== false },
    { id: 'mobile_resize', label: 'Mobile Resize', desc: 'Enable mobile-friendly resizable highlights', checked: fileReview.mobile_resize !== false },
    { id: 'coordinate_snap', label: 'Coordinate Snap', desc: 'Snap highlight coordinates to text boundaries', checked: !!fileReview.coordinate_snap },
  ];
  const toggleHtml = toggles.map(tg => `<div class="toggle-wrap">
    <div><div class="toggle-label">${tg.label}</div><div class="toggle-desc">${tg.desc}</div></div>
    <label class="toggle-switch"><input type="checkbox" name="${tg.id}" ${tg.checked ? 'checked' : ''} aria-label="${tg.label}"/><span class="toggle-slider"></span></label>
  </div>`).join('');
  const content = `${settingsBack()}<h1 class="text-2xl font-bold mb-6">File Review Settings</h1>
    <form id="file-review-settings-form">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">File Review Options</h2><div class="mt-4">${toggleHtml}</div></div></div>
      <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">File Limits</h2><div class="space-y-4 mt-4">
        <div class="form-group"><label class="form-label">Max File Size (MB)</label><input type="number" name="max_file_size_mb" class="input input-bordered w-full" value="${fileReview.max_file_size_mb || 50}" min="1"/></div>
        <div class="form-group"><label class="form-label">Max Files Per Review</label><input type="number" name="max_files_per_review" class="input input-bordered w-full" value="${fileReview.max_files_per_review || 20}" min="1"/></div>
        <div class="form-group"><label class="form-label">Allowed File Types</label><input type="text" name="allowed_types" class="input input-bordered w-full" value="${fileReview.allowed_types || 'pdf,doc,docx,xls,xlsx,png,jpg'}" placeholder="pdf,doc,docx,..."/><p class="text-xs text-gray-500 mt-1">Comma-separated file extensions</p></div>
        <div class="form-group"><label class="form-label">PDF Render Quality</label><select name="pdf_quality" class="select select-bordered w-full"><option value="low" ${fileReview.pdf_quality === 'low' ? 'selected' : ''}>Low (faster)</option><option value="medium" ${fileReview.pdf_quality === 'medium' || !fileReview.pdf_quality ? 'selected' : ''}>Medium</option><option value="high" ${fileReview.pdf_quality === 'high' ? 'selected' : ''}>High (slower)</option></select></div>
      </div></div></div>
    </div>
    <div class="mt-6"><button type="submit" class="btn btn-primary">Save File Review Settings</button></div>
    </form>`;
  const script = `${TOAST_SCRIPT}document.getElementById('file-review-settings-form').addEventListener('submit',async(e)=>{e.preventDefault();const fd=new FormData(e.target);const data={};for(const[k,v]of fd.entries())data[k]=v;document.querySelectorAll('#file-review-settings-form input[type=checkbox]').forEach(cb=>{data[cb.name]=cb.checked});document.querySelectorAll('#file-review-settings-form input[type=number]').forEach(n=>{if(data[n.name])data[n.name]=Number(data[n.name])});try{const res=await fetch('/api/admin/settings/file-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(res.ok){showToast('Settings saved','success')}else{showToast('Save failed','error')}}catch(err){showToast('Error: '+err.message,'error')}})`;
  return page(user, 'File Review Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/file-review', label: 'File Review Settings' }], content, [script]);
}

export function renderSettingsTemplateManage(user, template = {}, sections = []) {
  const sectionRows = sections.map((s, i) => `<tr data-id="${s.id}">
    <td><span class="color-swatch" style="background:${s.color || '#B0B0B0'}"></span></td>
    <td>${s.name || '-'}</td><td>${s.order ?? i}</td>
    <td class="flex gap-1">
      <button onclick="editTplSection('${s.id}','${(s.name || '').replace(/'/g, "\\'")}','${s.color || '#B0B0B0'}')" class="btn btn-xs btn-outline">Edit</button>
      <button onclick="deleteTplSection('${s.id}')" class="btn btn-xs btn-error btn-outline">Delete</button>
    </td></tr>`).join('');
  const empty = `<tr><td colspan="4" class="text-center py-8 text-gray-500">No sections defined</td></tr>`;
  const content = `${settingsBack()}<div class="mb-6"><h1 class="text-2xl font-bold">${template.name || 'Template'}</h1><p class="text-gray-500 text-sm">Manage template sections and configuration</p></div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">Template Info</h2><div class="space-y-4 mt-4">
        <div class="form-group"><label class="form-label" for="tpl-name">Name</label><input type="text"  id="tpl-name" class="input input-bordered w-full" value="${template.name || ''}"/></div>
        <div class="form-group"><label class="form-label" for="tpl-type">Type</label><select id="tpl-type" class="select select-bordered w-full"><option value="standard" ${template.type === 'standard' ? 'selected' : ''}>Standard</option><option value="checklist" ${template.type === 'checklist' ? 'selected' : ''}>Checklist</option><option value="audit" ${template.type === 'audit' ? 'selected' : ''}>Audit</option></select></div>
        <div class="form-group"><label class="flex items-center gap-2"><input type="checkbox" id="tpl-active" class="checkbox" ${template.is_active ? 'checked' : ''}/><span>Active</span></label></div>
        <button onclick="saveTplInfo()" class="btn btn-primary btn-sm">Save Template Info</button>
      </div></div></div>
      <div class="card bg-white shadow"><div class="card-body"><div class="flex justify-between items-center"><h2 class="card-title">Sections</h2><button onclick="addTplSection()" class="btn btn-primary btn-sm">Add Section</button></div>
        <div class="mt-4" style="overflow-x:auto"><table class="table table-zebra w-full"><thead><tr><th style="width:40px">Color</th><th>Name</th><th style="width:60px">Order</th><th>Actions</th></tr></thead><tbody id="tpl-sections-body">${sectionRows || empty}</tbody></table></div>
      </div></div>
    </div>
    <div id="tpl-section-form" class="inline-form" style="display:none;margin-top:1rem">
      <div class="inline-form-row">
        <div class="inline-form-field"><label for="tpl-sec-name">Name</label><input type="text"  id="tpl-sec-name" class="input input-bordered input-sm" placeholder="Section name"/></div>
        <div class="inline-form-field"><label for="tpl-sec-color">Color</label><input type="color"  id="tpl-sec-color" value="#B0B0B0"/></div>
        <div class="inline-form-field"><label>&nbsp;</label><div class="flex gap-2"><button onclick="saveTplSection()" class="btn btn-primary btn-sm">Save</button><button onclick="cancelTplSection()" class="btn btn-ghost btn-sm">Cancel</button></div></div>
      </div>
      <input type="hidden" id="tpl-sec-id" value=""/>
    </div>`;
  const script = `${TOAST_SCRIPT}
  var tplId='${template.id || ''}';
  window.saveTplInfo=async function(){var body={name:document.getElementById('tpl-name').value,type:document.getElementById('tpl-type').value,is_active:document.getElementById('tpl-active').checked?1:0};try{var res=await fetch('/api/review_template/'+tplId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(res.ok){showToast('Template updated','success')}else{showToast('Update failed','error')}}catch(e){showToast('Error','error')}};
  window.addTplSection=function(){document.getElementById('tpl-section-form').style.display='block';document.getElementById('tpl-sec-id').value='';document.getElementById('tpl-sec-name').value='';document.getElementById('tpl-sec-color').value='#B0B0B0'};
  window.editTplSection=function(id,name,color){document.getElementById('tpl-section-form').style.display='block';document.getElementById('tpl-sec-id').value=id;document.getElementById('tpl-sec-name').value=name;document.getElementById('tpl-sec-color').value=color};
  window.cancelTplSection=function(){document.getElementById('tpl-section-form').style.display='none'};
  window.saveTplSection=async function(){var id=document.getElementById('tpl-sec-id').value;var body={name:document.getElementById('tpl-sec-name').value,color:document.getElementById('tpl-sec-color').value,review_template_id:tplId};if(!body.name){showToast('Name required','error');return}var url=id?'/api/review_template_section/'+id:'/api/review_template_section';var method=id?'PUT':'POST';try{var res=await fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(res.ok){showToast(id?'Updated':'Created','success');setTimeout(function(){location.reload()},500)}else{showToast('Failed','error')}}catch(e){showToast('Error','error')}};
  window.deleteTplSection=async function(id){if(!confirm('Delete this section?'))return;try{var res=await fetch('/api/review_template_section/'+id,{method:'DELETE'});if(res.ok){showToast('Deleted','success');setTimeout(function(){location.reload()},500)}else{showToast('Delete failed','error')}}catch(e){showToast('Error','error')}};`;
  return page(user, `Manage Template - ${template.name || 'Template'}`, [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { href: '/admin/settings/templates', label: 'Templates' }, { label: template.name || 'Template' }], content, [script]);
}
