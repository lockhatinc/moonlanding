import { settingsPage, settingsBack, inlineTable, TOAST_SCRIPT } from '@/ui/settings-renderer.js';

const bc = (label, extra = []) => [
  { href: '/', label: 'Dashboard' },
  { href: '/admin/settings', label: 'Settings' },
  ...extra,
  { label },
];

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const ROLES = ['partner','manager','clerk','client_admin','client_user','admin','user'];
const ROLE_COLORS = { partner:'#1565c0', manager:'#2e7d32', clerk:'#e65100', client_admin:'#6a1b9a', client_user:'#455a64', admin:'#c62828', user:'#555' };

function roleBadge(role) {
  const color = ROLE_COLORS[role] || '#555';
  return role ? `<span style="background:${color}22;color:${color};padding:2px 8px;border-radius:4px;font-size:0.72rem;font-weight:600">${role}</span>` : '-';
}

function field(label, id, type = 'text', value = '', extra = '') {
  return `<div style="margin-bottom:14px">
    <label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">${label}</label>
    <input type="${type}" id="${id}" value="${esc(value)}" ${extra} style="width:100%;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;box-sizing:border-box"/>
  </div>`;
}

function selectField(label, id, options, selected = '') {
  const opts = options.map(o => {
    const val = typeof o === 'string' ? o : o.value;
    const lbl = typeof o === 'string' ? o.charAt(0).toUpperCase() + o.slice(1) : o.label;
    return `<option value="${esc(val)}" ${val === selected ? 'selected' : ''}>${lbl}</option>`;
  }).join('');
  return `<div style="margin-bottom:14px">
    <label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">${label}</label>
    <select id="${id}" style="width:100%;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;box-sizing:border-box">${opts}</select>
  </div>`;
}

export function renderSettingsUserDetail(user, targetUser = {}, teams = []) {
  const isNew = !targetUser.id;
  const title = isNew ? 'Add User' : `User: ${targetUser.name || targetUser.email || '-'}`;
  const teamOpts = [{ value: '', label: 'No team' }, ...teams.map(t => ({ value: t.id, label: t.name || t.id }))];

  const form = `<form id="user-form" style="max-width:520px">
    ${field('Full Name', 'u-name', 'text', targetUser.name || '')}
    ${field('Email', 'u-email', 'email', targetUser.email || '', isNew ? '' : 'readonly style="background:#f5f5f5"')}
    ${selectField('Role', 'u-role', ROLES, targetUser.role || 'clerk')}
    ${selectField('Team', 'u-team', teamOpts, targetUser.team_id || '')}
    ${selectField('Status', 'u-status', ['active','inactive','deleted'], targetUser.status || 'active')}
    ${isNew ? field('Password', 'u-password', 'password', '') : ''}
    <div style="display:flex;gap:8px;margin-top:20px">
      <button type="button" onclick="saveUser('${esc(targetUser.id || '')}')" style="background:#04141f;color:#fff;padding:8px 20px;border-radius:6px;border:none;cursor:pointer;font-size:0.85rem;font-weight:600">${isNew ? 'Create User' : 'Save Changes'}</button>
      ${!isNew ? `<button type="button" onclick="resetPassword('${esc(targetUser.id)}')" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:0.85rem">Reset Password</button>` : ''}
      ${!isNew && targetUser.status !== 'deleted' ? `<button type="button" onclick="deactivateUser('${esc(targetUser.id)}')" style="background:#fff0f0;border:1px solid #fca5a5;color:#c62828;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:0.85rem">Deactivate</button>` : ''}
    </div>
  </form>`;

  const content = `${settingsBack()}<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
    <a href="/admin/settings/users" style="color:#1565c0;text-decoration:none;font-size:0.85rem">&#8592; Users</a>
    <h1 style="font-size:1.3rem;font-weight:700;margin:0">${esc(title)}</h1>
    ${targetUser.role ? roleBadge(targetUser.role) : ''}
  </div>
  <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:24px">${form}</div>`;

  const script = `${TOAST_SCRIPT}
async function saveUser(id){
  const data={name:document.getElementById('u-name').value.trim(),role:document.getElementById('u-role').value,team_id:document.getElementById('u-team').value||null,status:document.getElementById('u-status').value};
  ${isNew ? "data.email=document.getElementById('u-email').value.trim();data.password=document.getElementById('u-password').value;" : ''}
  if(!data.name){showToast('Name required','error');return}
  ${isNew ? "if(!data.email){showToast('Email required','error');return}" : ''}
  try{const url=id?'/api/user/'+id:'/api/user';const r=await fetch(url,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  if(r.ok){showToast(id?'User updated':'User created','success');setTimeout(()=>window.location='/admin/settings/users',800)}else{const d=await r.json();showToast(d.error||'Failed','error')}}catch(e){showToast('Error','error')}
}
async function resetPassword(id){const pw=prompt('Enter new password (min 8 chars):');if(!pw||pw.length<8){showToast('Password too short','error');return}try{const r=await fetch('/api/user/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});if(r.ok)showToast('Password reset','success');else showToast('Failed','error')}catch(e){showToast('Error','error')}}
async function deactivateUser(id){if(!confirm('Deactivate this user?'))return;try{const r=await fetch('/api/user/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'inactive'})});if(r.ok){showToast('User deactivated','success');setTimeout(()=>location.reload(),600)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}`;

  return settingsPage(user, title + ' - Settings', bc(title, [{ href: '/admin/settings/users', label: 'Users' }]), content, [script]);
}

export function renderSettingsTeamDetail(user, team = {}, allUsers = []) {
  const isNew = !team.id;
  const title = isNew ? 'Add Team' : `Team: ${team.name || '-'}`;
  const memberIds = Array.isArray(team.users) ? team.users.map(u => typeof u === 'string' ? u : u.id || u.cloud_id) : [];
  const members = allUsers.filter(u => memberIds.includes(u.id));
  const available = allUsers.filter(u => !memberIds.includes(u.id) && u.status !== 'deleted');

  const memberRows = members.map(m => `<tr><td style="padding:8px 12px;font-size:0.82rem">${esc(m.name||'-')}</td><td style="padding:8px 12px;font-size:0.82rem;color:#555">${esc(m.email||'-')}</td><td style="padding:8px 12px;font-size:0.8rem;color:#888">${esc(m.role||'-')}</td><td style="padding:8px 12px"><button onclick="removeMember('${esc(team.id||'')}','${esc(m.id)}')" style="background:#fff0f0;border:1px solid #fca5a5;color:#c62828;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem">Remove</button></td></tr>`).join('') || `<tr><td colspan="4" style="padding:24px;text-align:center;color:#aaa;font-size:0.82rem">No members yet</td></tr>`;

  const availOpts = available.map(u => `<option value="${esc(u.id)}">${esc(u.name||u.email||u.id)}</option>`).join('');

  const form = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
      <h2 style="font-size:0.95rem;font-weight:700;margin:0 0 16px">Team Details</h2>
      ${field('Team Name', 't-name', 'text', team.name || '')}
      ${selectField('Context', 't-context', ['general','engagement_team','review_team'], team.context || 'general')}
      <button onclick="saveTeam('${esc(team.id||'')}')" style="background:#04141f;color:#fff;padding:8px 20px;border-radius:6px;border:none;cursor:pointer;font-size:0.85rem;font-weight:600">${isNew ? 'Create Team' : 'Save Changes'}</button>
    </div>
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0">Members (${members.length})</h2>
        ${!isNew ? `<div style="display:flex;gap:8px"><select id="add-member-select" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:0.82rem"><option value="">Select user...</option>${availOpts}</select><button onclick="addMember('${esc(team.id||'')}')" style="background:#1976d2;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:0.82rem">Add</button></div>` : '<span style="font-size:0.78rem;color:#aaa">Save team first to add members</span>'}
      </div>
      ${inlineTable(['Name','Email','Role',''], memberRows, 'No members')}
    </div>
  </div>`;

  const content = `${settingsBack()}<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
    <a href="/admin/settings/teams" style="color:#1565c0;text-decoration:none;font-size:0.85rem">&#8592; Teams</a>
    <h1 style="font-size:1.3rem;font-weight:700;margin:0">${esc(title)}</h1>
  </div>${form}`;

  const script = `${TOAST_SCRIPT}
async function saveTeam(id){
  const data={name:document.getElementById('t-name').value.trim(),context:document.getElementById('t-context').value};
  if(!data.name){showToast('Name required','error');return}
  try{const url=id?'/api/team/'+id:'/api/team';const r=await fetch(url,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  if(r.ok){const d=await r.json();const newId=(d.data||d).id||id;showToast(id?'Team updated':'Team created','success');setTimeout(()=>window.location='/admin/settings/teams/'+newId,800)}else{const d=await r.json();showToast(d.error||'Failed','error')}}catch(e){showToast('Error','error')}
}
async function addMember(teamId){const uid=document.getElementById('add-member-select').value;if(!uid){showToast('Select a user','error');return}try{const r=await fetch('/api/friday/team/user-removal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({team_id:teamId,user_id:uid,action:'add'})});if(r.ok){showToast('Member added','success');setTimeout(()=>location.reload(),600)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}
async function removeMember(teamId,uid){if(!confirm('Remove this member?'))return;try{const r=await fetch('/api/friday/team/user-removal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({team_id:teamId,user_id:uid,action:'remove'})});if(r.ok){showToast('Member removed','success');setTimeout(()=>location.reload(),600)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}`;

  return settingsPage(user, title + ' - Settings', bc(title, [{ href: '/admin/settings/teams', label: 'Teams' }]), content, [script]);
}
