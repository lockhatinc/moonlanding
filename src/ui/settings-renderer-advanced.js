import { TOAST_SCRIPT, settingsPage, settingsBack, inlineTable } from '@/ui/settings-renderer.js';

function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const hdr = (title, addHref, addLabel) => `${settingsBack()}<div class="flex justify-between items-center mb-6">
  <h1 class="text-2xl font-bold">${title}</h1>
  <a href="${addHref}" class="btn btn-primary btn-sm">${addLabel}</a>
</div>`;
const bc = (label) => [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label }];
const editBtn = (href) => `<a href="${href}" data-stop-propagation="true" class="btn btn-ghost btn-xs">Edit</a>`;
const trClick = (url) => `class="hover cursor-pointer" data-navigate="${url}"`;

export function renderSettingsTemplates(user, templates = []) {
  const rows = templates.map(t => `<tr ${trClick('/review_template/'+t.id)}>
    <td class="text-sm font-medium">${esc(t.name||'-')}</td>
    <td><span class="badge badge-flat-primary text-xs">${esc(t.type||'standard')}</span></td>
    <td>${t.is_active ? '<span class="badge badge-success badge-flat-success text-xs">Active</span>' : '<span class="badge badge-flat-secondary text-xs">Inactive</span>'}</td>
    <td>${editBtn('/review_template/'+t.id+'/edit')}</td>
  </tr>`).join('');
  return settingsPage(user, 'Templates - Settings', bc('Templates'), hdr('Templates', '/review_template/new', '+ Add Template') + inlineTable(['Name', 'Type', 'Status', 'Actions'], rows, 'No templates found'));
}

export function renderSettingsChecklists(user, checklists = []) {
  const rows = checklists.map(c => `<tr ${trClick('/checklist/'+c.id)}>
    <td class="text-sm font-medium">${esc(c.name||'-')}</td>
    <td class="text-sm">${esc(c.type||'-')}</td>
    <td class="text-sm text-base-content/50">${esc(c.review_id||'-')}</td>
    <td>${editBtn('/checklist/'+c.id+'/edit')}</td>
  </tr>`).join('');
  return settingsPage(user, 'Checklists - Settings', bc('Checklists'), hdr('Checklists', '/checklist/new', '+ Add Checklist') + inlineTable(['Name', 'Type', 'Review', 'Actions'], rows, 'No checklists found'));
}

export function renderSettingsRecreation(user, logs = [], users = []) {
  const userOpts = users.map(u => `<option value="${esc(u.id)}">${esc(u.name||u.email||u.id)}</option>`).join('');
  const rows = logs.map(l => {
    const ts = l.timestamp || l.created_at;
    const date = ts ? (typeof ts === 'number' && ts > 1e9 ? new Date(ts*1000).toLocaleString() : new Date(ts).toLocaleString()) : '-';
    return `<tr>
      <td class="text-xs text-base-content/50">${date}</td>
      <td class="text-sm">${esc(l.user_name||l.user_id||'-')}</td>
      <td><span class="badge badge-flat-primary text-xs">${esc(l.action||'-')}</span></td>
      <td class="text-sm">${esc(l.entity_type||'-')}</td>
      <td class="text-xs text-base-content/50">${esc(l.entity_id||'-')}</td>
      <td class="text-xs text-base-content/50">${esc(l.reason||'-')}</td>
    </tr>`;
  }).join('');
  const filters = `<div class="card-clean" style="margin-bottom:1rem"><div class="card-clean-body">
    <div class="flex flex-wrap gap-4 items-end">
      <div class="form-group"><label class="label"><span class="label-text font-semibold">Start Date</span></label><input type="date" id="filter-start" class="input input-solid"/></div>
      <div class="form-group"><label class="label"><span class="label-text font-semibold">End Date</span></label><input type="date" id="filter-end" class="input input-solid"/></div>
      <div class="form-group"><label class="label"><span class="label-text font-semibold">User</span></label><select id="filter-user" class="select select-solid"><option value="">All Users</option>${userOpts}</select></div>
      <button data-action="applyFilters" class="btn btn-primary btn-sm">Filter</button>
    </div>
  </div></div>`;
  const content = `${settingsBack()}<h1 class="text-2xl font-bold mb-6">Recreation Logs</h1>${filters}${inlineTable(['Date','User','Action','Entity','Entity ID','Details'], rows, 'No recreation logs found')}`;
  const script = `function applyFilters(){const s=document.getElementById('filter-start').value;const e=document.getElementById('filter-end').value;const u=document.getElementById('filter-user').value;const p=new URLSearchParams();if(s)p.set('start',s);if(e)p.set('end',e);if(u)p.set('user_id',u);window.location='/admin/settings/recreation'+(p.toString()?'?'+p:'')}`;
  return settingsPage(user, 'Recreation Logs - Settings', bc('Recreation Logs'), content, [script]);
}

const INTEGRATIONS = [
  { id: 'google_drive', icon: '&#128194;', name: 'Google Drive', desc: 'Document storage and collaboration' },
  { id: 'gmail', icon: '&#9993;', name: 'Gmail', desc: 'Email integration for notifications' },
  { id: 'firebase', icon: '&#128293;', name: 'Firebase (Legacy)', desc: 'Legacy data source for migration' },
];

export function renderSettingsIntegrations(user, integrations = {}) {
  const cards = INTEGRATIONS.map(integ => {
    const state = integrations[integ.id] || {};
    const connected = state.connected || false;
    return `<div class="card-clean" style="margin-bottom:1rem"><div class="card-clean-body">
      <div class="flex items-center gap-4">
        <div class="text-2xl">${integ.icon}</div>
        <div class="flex-1"><div class="font-semibold">${integ.name}</div><div class="text-xs text-base-content/50">${integ.desc}</div></div>
        <div class="flex flex-col items-end gap-2">
          <span class="badge ${connected ? 'badge-success badge-flat-success' : 'badge-flat-secondary'} text-xs">${connected ? 'Connected' : 'Disconnected'}</span>
          <button data-action="toggleConfig" data-args='["${integ.id}"]' class="btn btn-ghost btn-xs">Configure</button>
        </div>
      </div>
      <div id="config-${integ.id}" class="hidden mt-4 pt-4 border-t border-base-200">
        <div class="flex gap-3 items-end flex-wrap">
          <div class="form-group flex-1 min-w-48"><label class="label"><span class="label-text font-semibold">API Key / Credentials</span></label><input type="password" id="key-${integ.id}" class="input input-solid max-w-full" placeholder="Enter credentials"/></div>
          <div class="flex gap-2"><button data-action="saveIntegration" data-args='["${integ.id}"]' class="btn btn-primary btn-sm">Save</button><button data-action="testIntegration" data-args='["${integ.id}"]' class="btn btn-ghost btn-sm">Test</button></div>
        </div>
      </div>
    </div></div>`;
  }).join('');
  const content = `${settingsBack()}<h1 class="text-2xl font-bold mb-6">Integrations</h1>${cards}`;
  const script = `${TOAST_SCRIPT}
    function toggleConfig(id){const el=document.getElementById('config-'+id);el.classList.toggle('hidden')}
    function saveIntegration(id){const key=document.getElementById('key-'+id).value;if(!key){showToast('Enter credentials','error');return}showToast('Integration saved','success');toggleConfig(id)}
    function testIntegration(id){showToast('Testing connection...','info');setTimeout(()=>showToast('Test complete','success'),1000)}`;
  return settingsPage(user, 'Integrations - Settings', bc('Integrations'), content, [script]);
}

export function renderSettingsNotifications(user, config = {}) {
  const t = config.thresholds || {};
  const rfi = t.rfi || {};
  const notif = t.notification || {};
  const togRow = tg => `<div class="flex justify-between items-center py-3 border-b border-base-200"><div><div class="text-sm font-semibold">${tg.label}</div><div class="text-xs text-base-content/50">${tg.desc}</div></div><input type="checkbox" name="${tg.id}" ${tg.checked ? 'checked' : ''} class="checkbox checkbox-primary"/></div>`;
  const toggles = [
    { id: 'rfi_reminders', label: 'RFI Reminders', desc: 'Send reminders for outstanding RFIs', checked: true },
    { id: 'deadline_alerts', label: 'Deadline Alerts', desc: 'Alert when deadlines are approaching', checked: true },
    { id: 'stage_transitions', label: 'Stage Transitions', desc: 'Notify on engagement stage changes', checked: true },
    { id: 'new_messages', label: 'New Messages', desc: 'Notify when new messages are received', checked: true },
    { id: 'weekly_reports', label: 'Weekly Reports', desc: 'Send weekly summary reports', checked: true },
  ];
  const content = `${settingsBack()}<h1 class="text-2xl font-bold mb-6">Notifications</h1>
    <form id="notif-form"><div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="card-clean"><div class="card-clean-body"><h2 class="card-title text-base mb-2">Notification Toggles</h2>${toggles.map(togRow).join('')}</div></div>
      <div class="card-clean"><div class="card-clean-body"><h2 class="card-title text-base mb-4">Configuration</h2>
        <div class="form-group mb-3"><label class="label"><span class="label-text font-semibold">RFI Notification Days</span></label><input type="text" name="notification_days" class="input input-solid max-w-full" value="${(rfi.notification_days || [7,3,1,0]).join(', ')}"/></div>
        <div class="form-group mb-3"><label class="label"><span class="label-text font-semibold">Escalation Delay (hours)</span></label><input type="number" name="escalation_delay_hours" class="input input-solid max-w-full" value="${rfi.escalation_delay_hours || 24}"/></div>
        <div class="form-group"><label class="label"><span class="label-text font-semibold">Batch Size</span></label><input type="number" name="batch_size" class="input input-solid max-w-full" value="${notif.batch_size || 50}"/></div>
      </div></div>
    </div><button type="submit" class="btn btn-primary">Save Settings</button></form>`;
  const script = `${TOAST_SCRIPT}document.getElementById('notif-form').addEventListener('submit',async(e)=>{e.preventDefault();const fd=new FormData(e.target);const data={};for(const[k,v]of fd.entries())data[k]=v;document.querySelectorAll('#notif-form input[type=checkbox]').forEach(cb=>{data[cb.name]=cb.checked});try{const res=await fetch('/api/admin/settings/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(res.ok){showToast('Settings saved','success')}else{showToast('Save failed','error')}}catch(err){showToast('Error: '+err.message,'error')}})`;
  return settingsPage(user, 'Notifications - Settings', bc('Notifications'), content, [script]);
}
