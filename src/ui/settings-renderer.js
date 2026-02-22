import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';

export const TOAST_SCRIPT = `window.showToast=(m,t='info')=>{let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.style.cssText='position:fixed;bottom:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem';document.body.appendChild(c)}const d=document.createElement('div');d.style.cssText='padding:10px 16px;border-radius:6px;font-size:0.82rem;font-weight:500;color:#fff;background:'+(t==='error'?'#c62828':t==='success'?'#2e7d32':'#1565c0');d.textContent=m;c.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},3000)};`;

function breadcrumb(items) {
  if (!items?.length) return '';
  return `<div style="font-size:0.78rem;color:#888;margin-bottom:16px">${items.map((item, i) =>
    i === items.length - 1 ? `<span style="color:#333">${item.label}</span>` : `<a href="${item.href}" style="color:#1565c0;text-decoration:none">${item.label}</a><span style="margin:0 6px;color:#ccc">/</span>`
  ).join('')}</div>`;
}

export function settingsPage(user, title, bc, content, scripts = []) {
  const body = `<div style="min-height:100vh;background:#f7f8fa">${nav(user)}<main style="padding:24px 32px">${breadcrumb(bc)}${content}</main></div>`;
  return generateHtml(title, body, scripts);
}

export function settingsBack() {
  return `<a href="/admin/settings" style="display:inline-flex;align-items:center;gap:6px;color:#1565c0;text-decoration:none;font-size:0.82rem;font-weight:500;margin-bottom:20px">&#8592; Back to Settings</a>`;
}

export function inlineTable(headers, rows, emptyMsg) {
  const ths = headers.map(h => `<th style="padding:10px 12px;text-align:left;font-size:0.72rem;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e0e0e0;white-space:nowrap">${h}</th>`).join('');
  const empty = `<tr><td colspan="${headers.length}" style="padding:32px;text-align:center;color:#999;font-size:0.85rem">${emptyMsg}</td></tr>`;
  return `<div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr>${ths}</tr></thead><tbody>${rows || empty}</tbody></table></div>`;
}

const KNOWN_ROLES = { admin: ['#6a1b9a','#f3e5f5'], partner: ['#1565c0','#e3f2fd'], manager: ['#2e7d32','#e8f5e9'], clerk: ['#e65100','#fff3e0'], user: ['#555','#f5f5f5'], auditor: ['#283593','#e8eaf6'] };
function roleBadge(role) {
  const r = (role || '').toLowerCase();
  const [color, bg] = KNOWN_ROLES[r] || ['#c62828', '#fdecea'];
  const label = KNOWN_ROLES[r] ? r.charAt(0).toUpperCase() + r.slice(1) : 'Unknown';
  return `<span style="background:${bg};color:${color};padding:2px 8px;border-radius:4px;font-size:0.72rem;font-weight:600" title="${role}">${label}</span>`;
}

function statusBadge(status) {
  const active = status === 'active';
  return `<span style="background:${active ? '#d1fae5' : '#fef3c7'};color:${active ? '#065f46' : '#92400e'};padding:2px 8px;border-radius:4px;font-size:0.72rem;font-weight:600">${status || '-'}</span>`;
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
    const badge = c.countKey && counts[c.countKey] !== undefined ? `<span style="background:#e3f2fd;color:#1565c0;font-size:0.7rem;font-weight:600;padding:2px 8px;border-radius:10px;margin-top:6px;display:inline-block">${counts[c.countKey]} items</span>` : '';
    return `<a href="${c.href}" style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px;text-decoration:none;display:flex;align-items:flex-start;gap:14px;transition:box-shadow 0.15s" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.08)'">
      <div style="font-size:1.6rem">${c.icon}</div>
      <div><div style="font-weight:700;color:#1a1a1a;font-size:0.9rem">${c.title}</div><div style="font-size:0.78rem;color:#888;margin-top:2px">${c.desc}</div>${badge}</div>
    </a>`;
  }).join('');
  const content = `<h1 style="font-size:1.4rem;font-weight:700;color:#1a1a1a;margin:0 0 20px">Settings</h1><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">${cards}</div>`;
  return settingsPage(user, 'Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }], content);
}

export function renderSettingsSystem(user, config = {}) {
  const t = config.thresholds || {};
  const sections = [
    { title: 'System Information', items: [['Database Type', config.database?.type || 'SQLite'], ['Server Port', config.server?.port || 3004], ['Session TTL', (t.cache?.session_ttl_seconds || 3600) + 's'], ['Page Size (Default)', t.system?.default_page_size || 50], ['Page Size (Max)', t.system?.max_page_size || 500]] },
    { title: 'RFI Configuration', items: [['Max Days Outstanding', (t.rfi?.max_days_outstanding || 90) + ' days'], ['Escalation Delay', (t.rfi?.escalation_delay_hours || 24) + ' hours'], ['Notification Days', (t.rfi?.notification_days || [7, 3, 1, 0]).join(', ')]] },
    { title: 'Email Configuration', items: [['Batch Size', t.email?.send_batch_size || 10], ['Max Retries', t.email?.send_max_retries || 3], ['Rate Limit Delay', (t.email?.rate_limit_delay_ms || 6000) + 'ms']] },
    { title: 'Workflow Configuration', items: [['Stage Transition Lockout', (t.workflow?.stage_transition_lockout_minutes || 5) + ' min'], ['Collaborator Default Expiry', (t.collaborator?.default_expiry_days || 7) + ' days'], ['Collaborator Max Expiry', (t.collaborator?.max_expiry_days || 30) + ' days']] },
  ];
  const cards = sections.map(s => `<div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px"><div style="font-weight:700;color:#1a1a1a;font-size:0.9rem;margin-bottom:12px">${s.title}</div>${s.items.map(([l, v]) => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0"><span style="color:#666;font-size:0.82rem">${l}</span><span style="font-weight:600;font-size:0.82rem">${v}</span></div>`).join('')}</div>`).join('');
  const content = `${settingsBack()}<h1 style="font-size:1.4rem;font-weight:700;margin:0 0 20px">System Info</h1><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">${cards}</div>`;
  return settingsPage(user, 'System Info - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'System Info' }], content);
}

export function renderSettingsUsers(user, users = []) {
  const rows = users.map(u => `<tr style="cursor:pointer" onclick="window.location='/user/${u.id}'" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background=''">
    <td style="padding:10px 12px;font-size:0.82rem">${u.name || '-'}</td>
    <td style="padding:10px 12px;font-size:0.82rem;color:#555">${u.email || '-'}</td>
    <td style="padding:10px 12px">${roleBadge(u.role || '-')}</td>
    <td style="padding:10px 12px">${statusBadge(u.status)}</td>
    <td style="padding:10px 12px"><a href="/user/${u.id}/edit" onclick="event.stopPropagation()" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:4px 10px;border-radius:4px;text-decoration:none;font-size:0.75rem;font-weight:600">Edit</a></td>
  </tr>`).join('');
  const content = `${settingsBack()}<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <h1 style="font-size:1.4rem;font-weight:700;margin:0">Users</h1>
    <a href="/user/new" style="background:#04141f;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">Add User</a>
  </div>${inlineTable(['Name', 'Email', 'Role', 'Status', 'Actions'], rows, 'No users found')}`;
  return settingsPage(user, 'Users - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'Users' }], content);
}

export function renderSettingsTeams(user, teams = []) {
  const rows = teams.map(t => `<tr style="cursor:pointer" onclick="window.location='/team/${t.id}'" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background=''">
    <td style="padding:10px 12px;font-size:0.82rem">${t.name || '-'}</td>
    <td style="padding:10px 12px;font-size:0.82rem;color:#555">${t.member_count || 0}</td>
    <td style="padding:10px 12px"><a href="/team/${t.id}/edit" onclick="event.stopPropagation()" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:4px 10px;border-radius:4px;text-decoration:none;font-size:0.75rem;font-weight:600">Edit</a></td>
  </tr>`).join('');
  const content = `${settingsBack()}<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <h1 style="font-size:1.4rem;font-weight:700;margin:0">Teams</h1>
    <a href="/team/new" style="background:#04141f;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">Add Team</a>
  </div>${inlineTable(['Name', 'Members', 'Actions'], rows, 'No teams found')}`;
  return settingsPage(user, 'Teams - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'Teams' }], content);
}

const RFI_PALETTE = ['#B0B0B0', '#44BBA4', '#FF4141', '#7F7EFF', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export function renderSettingsRfiSections(user, sections = []) {
  const rows = sections.map((s, i) => `<tr data-id="${s.id}">
    <td style="padding:10px 12px"><span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:${s.color || '#B0B0B0'}"></span></td>
    <td style="padding:10px 12px;font-size:0.82rem">${s.name || '-'}</td>
    <td style="padding:10px 12px;font-size:0.82rem;color:#888">${s.order ?? i}</td>
    <td style="padding:10px 12px;display:flex;gap:6px">
      <button onclick="moveSection('${s.id}','up')" style="background:#f5f5f5;border:1px solid #ddd;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:0.75rem" ${i === 0 ? 'disabled' : ''}>&#9650;</button>
      <button onclick="moveSection('${s.id}','down')" style="background:#f5f5f5;border:1px solid #ddd;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:0.75rem" ${i === sections.length - 1 ? 'disabled' : ''}>&#9660;</button>
      <button onclick="editSection('${s.id}','${(s.name || '').replace(/'/g, "\\'")}','${s.color || '#B0B0B0'}')" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem;font-weight:600">Edit</button>
      <button onclick="deleteSection('${s.id}')" style="background:#fff0f0;border:1px solid #fca5a5;color:#c62828;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem;font-weight:600">Delete</button>
    </td></tr>`).join('');
  const palette = RFI_PALETTE.map(c => `<div data-color="${c}" style="width:24px;height:24px;border-radius:4px;background:${c};cursor:pointer;border:2px solid transparent" onclick="selectColor('${c}')" title="${c}"></div>`).join('');
  const formHtml = `<div id="section-form" style="display:none;background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:16px;margin-bottom:16px">
    <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end">
      <div><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Name</label><input type="text" id="section-name" style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;font-size:0.82rem;width:200px" placeholder="Section name"/></div>
      <div><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Color</label><div id="color-palette" style="display:flex;gap:6px;flex-wrap:wrap;max-width:240px">${palette}</div><input type="hidden" id="section-color" value="#B0B0B0"/></div>
      <div style="display:flex;gap:8px"><button onclick="saveSection()" style="background:#04141f;color:#fff;padding:7px 14px;border-radius:6px;border:none;cursor:pointer;font-size:0.82rem;font-weight:600">Save</button><button onclick="cancelForm()" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:0.82rem">Cancel</button></div>
    </div>
    <input type="hidden" id="edit-id" value=""/>
  </div>`;
  const content = `${settingsBack()}<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <h1 style="font-size:1.4rem;font-weight:700;margin:0">RFI Sections</h1>
    <button onclick="toggleAddForm()" style="background:#04141f;color:#fff;padding:8px 16px;border-radius:6px;border:none;cursor:pointer;font-size:0.82rem;font-weight:600">Add Section</button>
  </div>${formHtml}${inlineTable(['Color', 'Name', 'Order', 'Actions'], rows, 'No RFI sections. Add one below.')}`;
  const script = `${TOAST_SCRIPT}
    function toggleAddForm(){document.getElementById('section-form').style.display='block';document.getElementById('edit-id').value='';document.getElementById('section-name').value='';selectColor('#B0B0B0')}
    function cancelForm(){document.getElementById('section-form').style.display='none'}
    function selectColor(c){document.getElementById('section-color').value=c;document.querySelectorAll('#color-palette div').forEach(el=>{el.style.borderColor=el.dataset.color===c?'#1a1a1a':'transparent'})}
    function editSection(id,name,color){document.getElementById('section-form').style.display='block';document.getElementById('edit-id').value=id;document.getElementById('section-name').value=name;selectColor(color)}
    async function saveSection(){const name=document.getElementById('section-name').value.trim();const color=document.getElementById('section-color').value;const id=document.getElementById('edit-id').value;if(!name){showToast('Name is required','error');return}
      const url=id?'/api/rfi_section/'+id:'/api/rfi_section';const method=id?'PUT':'POST';
      try{const res=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({name,color})});if(res.ok){showToast(id?'Updated':'Created','success');setTimeout(()=>location.reload(),500)}else{showToast('Failed','error')}}catch(e){showToast('Error: '+e.message,'error')}}
    async function deleteSection(id){if(!confirm('Delete this section?'))return;try{const res=await fetch('/api/rfi_section/'+id,{method:'DELETE'});if(res.ok){showToast('Deleted','success');setTimeout(()=>location.reload(),500)}else{showToast('Delete failed','error')}}catch(e){showToast('Error','error')}}
    async function moveSection(id,dir){try{const res=await fetch('/api/rfi_section/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({reorder:dir})});if(res.ok){location.reload()}else{showToast('Reorder failed','error')}}catch(e){showToast('Error','error')}}
    selectColor('#B0B0B0');`;
  return settingsPage(user, 'RFI Sections - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'RFI Sections' }], content, [script]);
}
