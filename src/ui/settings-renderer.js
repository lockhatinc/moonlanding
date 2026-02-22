import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';

export const TOAST_SCRIPT = `window.showToast=(m,t='info')=>{let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.className='toast-container';c.setAttribute('role','status');c.setAttribute('aria-live','polite');document.body.appendChild(c)}const d=document.createElement('div');d.className='toast toast-'+t;d.textContent=m;c.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},3000)};`;

function breadcrumb(items) {
  if (!items?.length) return '';
  return `<nav class="breadcrumbs text-sm mb-4" aria-label="Breadcrumb"><ul>${items.map((item, i) => i === items.length - 1 ? `<li>${item.label}</li>` : `<li><a href="${item.href}">${item.label}</a></li>`).join('')}</ul></nav>`;
}

export function settingsPage(user, title, bc, content, scripts = []) {
  const body = `<div class="min-h-screen bg-base-200">${nav(user)}<main class="p-4 md:p-6">${breadcrumb(bc)}${content}</main></div>`;
  return generateHtml(title, body, scripts);
}

export function settingsBack() {
  return `<a href="/admin/settings" class="btn btn-ghost btn-sm gap-1 mb-4">&#8592; Back to Settings</a>`;
}

export function inlineTable(headers, rows, emptyMsg) {
  const ths = headers.map(h => `<th>${h}</th>`).join('');
  const empty = `<tr><td colspan="${headers.length}" class="text-center py-8 text-base-content/40 text-sm">${emptyMsg}</td></tr>`;
  return `<div class="table-container"><table class="table table-hover"><thead><tr>${ths}</tr></thead><tbody>${rows || empty}</tbody></table></div>`;
}

const KNOWN_ROLES = { admin:'badge-error', partner:'badge-flat-primary', manager:'badge-success badge-flat-success', clerk:'badge-warning badge-flat-warning', user:'badge-flat-secondary', auditor:'badge-flat-secondary' };

export function roleBadge(role) {
  const r = (role || '').toLowerCase();
  const cls = KNOWN_ROLES[r] || 'badge-flat-secondary';
  const label = r ? r.charAt(0).toUpperCase() + r.slice(1) : 'Staff';
  return `<span class="badge ${cls} text-xs" title="${role}">${label}</span>`;
}

function statusBadge(status) {
  const active = status === 'active';
  return `<span class="badge ${active ? 'badge-success badge-flat-success' : 'badge-warning badge-flat-warning'} text-xs">${status || '-'}</span>`;
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
    const badge = c.countKey && counts[c.countKey] !== undefined
      ? `<span class="badge badge-flat-primary text-xs mt-2">${counts[c.countKey]} items</span>` : '';
    return `<a href="${c.href}" class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow" style="text-decoration:none">
      <div class="card-body">
        <div class="flex items-start gap-3">
          <div class="text-2xl">${c.icon}</div>
          <div>
            <div class="font-bold text-base-content">${c.title}</div>
            <div class="text-sm text-base-content/60 mt-1">${c.desc}</div>
            ${badge}
          </div>
        </div>
      </div>
    </a>`;
  }).join('');
  const content = `<h1 class="text-2xl font-bold text-base-content mb-4">Settings</h1><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>`;
  return settingsPage(user, 'Settings', [{ href: '/', label: 'Dashboard' }, { label: 'Settings' }], content);
}

export function renderSettingsSystem(user, config = {}) {
  const t = config.thresholds || {};
  const sections = [
    { title: 'System Information', items: [['Database Type', config.database?.type || 'SQLite'], ['Server Port', config.server?.port || 3004], ['Session TTL', (t.cache?.session_ttl_seconds || 3600) + 's'], ['Page Size (Default)', t.system?.default_page_size || 50], ['Page Size (Max)', t.system?.max_page_size || 500]] },
    { title: 'RFI Configuration', items: [['Max Days Outstanding', (t.rfi?.max_days_outstanding || 90) + ' days'], ['Escalation Delay', (t.rfi?.escalation_delay_hours || 24) + ' hours'], ['Notification Days', (t.rfi?.notification_days || [7, 3, 1, 0]).join(', ')]] },
    { title: 'Email Configuration', items: [['Batch Size', t.email?.send_batch_size || 10], ['Max Retries', t.email?.send_max_retries || 3], ['Rate Limit Delay', (t.email?.rate_limit_delay_ms || 6000) + 'ms']] },
    { title: 'Workflow Configuration', items: [['Stage Transition Lockout', (t.workflow?.stage_transition_lockout_minutes || 5) + ' min'], ['Collaborator Default Expiry', (t.collaborator?.default_expiry_days || 7) + ' days'], ['Collaborator Max Expiry', (t.collaborator?.max_expiry_days || 30) + ' days']] },
  ];
  const cards = sections.map(s => `<div class="card bg-base-100 shadow-md">
    <div class="card-body">
      <h2 class="card-title text-sm mb-3">${s.title}</h2>
      ${s.items.map(([l, v]) => `<div class="flex justify-between py-2 border-b border-base-200 last:border-0"><span class="text-sm text-base-content/60">${l}</span><span class="text-sm font-semibold">${v}</span></div>`).join('')}
    </div>
  </div>`).join('');
  const content = `${settingsBack()}<h1 class="text-2xl font-bold mb-4">System Info</h1><div class="grid grid-cols-1 md:grid-cols-2 gap-4">${cards}</div>`;
  return settingsPage(user, 'System Info - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'System Info' }], content);
}

export function renderSettingsUsers(user, users = []) {
  const rows = users.map(u => `<tr class="hover cursor-pointer" onclick="window.location='/user/${u.id}'">
    <td>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">${(u.name||'?').charAt(0).toUpperCase()}</div>
        <span class="text-sm font-medium">${u.name || '-'}</span>
      </div>
    </td>
    <td class="text-sm text-base-content/60">${u.email || '-'}</td>
    <td>${roleBadge(u.role || '-')}</td>
    <td>${statusBadge(u.status)}</td>
    <td><a href="/user/${u.id}/edit" onclick="event.stopPropagation()" class="btn btn-ghost btn-xs">Edit</a></td>
  </tr>`).join('');

  const content = `${settingsBack()}
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">Users</h1>
    <a href="/user/new" class="btn btn-primary btn-sm gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add User</a>
  </div>
  <div class="card bg-base-100 shadow-md">
    <div class="card-body p-0">
      ${inlineTable(['User', 'Email', 'Role', 'Status', 'Actions'], rows, 'No users found')}
    </div>
  </div>`;
  return settingsPage(user, 'Users - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'Users' }], content);
}

export function renderSettingsTeams(user, teams = [], allUsers = []) {
  function parseMembers(t) {
    try {
      const u = t.users;
      if (!u) return [];
      const arr = Array.isArray(u) ? u : JSON.parse(u);
      if (!Array.isArray(arr)) return [];
      return arr.map(m => typeof m === 'object' ? (m.email || m.name || m.cloud_id || '') : String(m));
    } catch { return []; }
  }

  const editDialog = `<div id="team-dialog" class="modal" style="display:none" onclick="if(event.target===this)closeTeamDialog()">
    <div class="modal-overlay" onclick="closeTeamDialog()"></div>
    <div class="modal-content rounded-box max-w-md p-6">
      <h3 id="team-dialog-title" class="text-lg font-semibold mb-4">Edit Team</h3>
      <input type="hidden" id="team-edit-id"/>
      <div class="form-group mb-4">
        <label class="label"><span class="label-text font-medium">Team Name</span></label>
        <input id="team-name-input" type="text" class="input input-solid max-w-full" placeholder="Team name"/>
      </div>
      <div class="modal-action">
        <button onclick="saveTeam()" class="btn btn-primary">Save</button>
        <button onclick="closeTeamDialog()" class="btn btn-ghost">Cancel</button>
      </div>
    </div>
  </div>`;

  const rows = teams.map(t => {
    const members = parseMembers(t);
    const memberCount = members.length;
    const memberNames = members.slice(0, 3).map(m => String(m).split('@')[0]).join(', ');
    const moreCount = memberCount > 3 ? ` +${memberCount - 3} more` : '';
    const membersDisplay = memberCount > 0
      ? `<span class="text-sm text-base-content/60">${memberNames}${moreCount}</span>`
      : '<span class="text-base-content/30 text-sm">No members</span>';
    return `<tr class="hover">
      <td class="font-medium text-sm">${t.name || '-'}</td>
      <td>
        <span class="badge badge-flat-primary text-xs mr-2">${memberCount} member${memberCount !== 1 ? 's' : ''}</span>
        ${membersDisplay}
      </td>
      <td>
        <div class="flex gap-2">
          <button onclick="openEditTeam('${t.id}','${(t.name||'').replace(/'/g,"\\'")}')" class="btn btn-ghost btn-xs">Edit</button>
          <button onclick="deleteTeam('${t.id}')" class="btn btn-error btn-xs">Delete</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  const script = `${TOAST_SCRIPT}
function openEditTeam(id,name){document.getElementById('team-edit-id').value=id;document.getElementById('team-name-input').value=name;document.getElementById('team-dialog-title').textContent='Edit Team';document.getElementById('team-dialog').style.display='flex'}
function openAddTeam(){document.getElementById('team-edit-id').value='';document.getElementById('team-name-input').value='';document.getElementById('team-dialog-title').textContent='Add Team';document.getElementById('team-dialog').style.display='flex'}
function closeTeamDialog(){document.getElementById('team-dialog').style.display='none'}
async function saveTeam(){const id=document.getElementById('team-edit-id').value;const name=document.getElementById('team-name-input').value.trim();if(!name){showToast('Name is required','error');return}const url=id?'/api/team/'+id:'/api/team';const method=id?'PUT':'POST';try{const r=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});if(r.ok){showToast(id?'Team updated':'Team created','success');setTimeout(()=>location.reload(),500)}else{const d=await r.json();showToast(d.error||'Failed','error')}}catch(e){showToast('Error: '+e.message,'error')}}
async function deleteTeam(id){if(!confirm('Delete this team?'))return;try{const r=await fetch('/api/team/'+id,{method:'DELETE'});if(r.ok){showToast('Team deleted','success');setTimeout(()=>location.reload(),500)}else showToast('Delete failed','error')}catch(e){showToast('Error','error')}}`;

  const content = `${settingsBack()}${editDialog}
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Teams</h1>
      <button onclick="openAddTeam()" class="btn btn-primary btn-sm gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Team</button>
    </div>
    <div class="card bg-base-100 shadow-md">
      <div class="card-body p-0">
        ${inlineTable(['Name', 'Members', 'Actions'], rows, 'No teams found')}
      </div>
    </div>`;
  return settingsPage(user, 'Teams - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'Teams' }], content, [script]);
}

const RFI_PALETTE = ['#B0B0B0', '#44BBA4', '#FF4141', '#7F7EFF', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export function renderSettingsRfiSections(user, sections = []) {
  const rows = sections.map((s, i) => `<tr class="hover" data-id="${s.id}">
    <td><span class="inline-block w-5 h-5 rounded" style="background:${s.color || '#B0B0B0'}"></span></td>
    <td class="text-sm">${s.name || '-'}</td>
    <td class="text-sm text-base-content/50">${s.order ?? i}</td>
    <td>
      <div class="flex gap-1">
        <button onclick="moveSection('${s.id}','up')" class="btn btn-ghost btn-xs" ${i === 0 ? 'disabled' : ''}>&#9650;</button>
        <button onclick="moveSection('${s.id}','down')" class="btn btn-ghost btn-xs" ${i === sections.length - 1 ? 'disabled' : ''}>&#9660;</button>
        <button onclick="editSection('${s.id}','${(s.name || '').replace(/'/g, "\\'")}','${s.color || '#B0B0B0'}')" class="btn btn-ghost btn-xs">Edit</button>
        <button onclick="deleteSection('${s.id}')" class="btn btn-error btn-xs">Delete</button>
      </div>
    </td>
  </tr>`).join('');

  const palette = RFI_PALETTE.map(c => `<div data-color="${c}" class="w-6 h-6 rounded cursor-pointer border-2 border-transparent hover:border-base-content" style="background:${c}" onclick="selectColor('${c}')" title="${c}"></div>`).join('');
  const formHtml = `<div id="section-form" class="card bg-base-100 shadow-md mb-4" style="display:none">
    <div class="card-body">
      <div class="flex flex-wrap gap-4 items-end">
        <div class="form-group">
          <label class="label"><span class="label-text font-medium">Name</span></label>
          <input type="text" id="section-name" class="input input-solid" style="max-width:200px" placeholder="Section name"/>
        </div>
        <div>
          <label class="label"><span class="label-text font-medium">Color</span></label>
          <div id="color-palette" class="flex gap-2 flex-wrap">${palette}</div>
          <input type="hidden" id="section-color" value="#B0B0B0"/>
        </div>
        <div class="flex gap-2">
          <button onclick="saveSection()" class="btn btn-primary btn-sm">Save</button>
          <button onclick="cancelForm()" class="btn btn-ghost btn-sm">Cancel</button>
        </div>
      </div>
      <input type="hidden" id="edit-id" value=""/>
    </div>
  </div>`;

  const content = `${settingsBack()}
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">RFI Sections</h1>
      <button onclick="toggleAddForm()" class="btn btn-primary btn-sm">Add Section</button>
    </div>
    ${formHtml}
    <div class="card bg-base-100 shadow-md">
      <div class="card-body p-0">
        ${inlineTable(['Color', 'Name', 'Order', 'Actions'], rows, 'No RFI sections. Add one below.')}
      </div>
    </div>`;

  const script = `${TOAST_SCRIPT}
function toggleAddForm(){document.getElementById('section-form').style.display='block';document.getElementById('edit-id').value='';document.getElementById('section-name').value='';selectColor('#B0B0B0')}
function cancelForm(){document.getElementById('section-form').style.display='none'}
function selectColor(c){document.getElementById('section-color').value=c;document.querySelectorAll('#color-palette div').forEach(el=>{el.style.borderColor=el.dataset.color===c?'#1a1a1a':'transparent'})}
function editSection(id,name,color){document.getElementById('section-form').style.display='block';document.getElementById('edit-id').value=id;document.getElementById('section-name').value=name;selectColor(color)}
async function saveSection(){const name=document.getElementById('section-name').value.trim();const color=document.getElementById('section-color').value;const id=document.getElementById('edit-id').value;if(!name){showToast('Name is required','error');return}const url=id?'/api/rfi_section/'+id:'/api/rfi_section';const method=id?'PUT':'POST';try{const res=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({name,color})});if(res.ok){showToast(id?'Updated':'Created','success');setTimeout(()=>location.reload(),500)}else{showToast('Failed','error')}}catch(e){showToast('Error: '+e.message,'error')}}
async function deleteSection(id){if(!confirm('Delete this section?'))return;try{const res=await fetch('/api/rfi_section/'+id,{method:'DELETE'});if(res.ok){showToast('Deleted','success');setTimeout(()=>location.reload(),500)}else{showToast('Delete failed','error')}}catch(e){showToast('Error','error')}}
async function moveSection(id,dir){try{const res=await fetch('/api/rfi_section/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({reorder:dir})});if(res.ok){location.reload()}else{showToast('Reorder failed','error')}}catch(e){showToast('Error','error')}}
selectColor('#B0B0B0');`;

  return settingsPage(user, 'RFI Sections - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'RFI Sections' }], content, [script]);
}
