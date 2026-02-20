import { canCreate, canEdit, canDelete } from '@/ui/permissions-ui.js';
import { generateHtml, statusLabel, linearProgress, userAvatar, teamAvatarGroup } from '@/ui/renderer.js';

const TOAST_SCRIPT = `window.showToast=(m,t='info')=>{let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.className='toast-container';c.setAttribute('role','status');c.setAttribute('aria-live','polite');c.setAttribute('aria-atomic','true');document.body.appendChild(c)}const d=document.createElement('div');d.className='toast toast-'+t;d.textContent=m;c.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},3000)};`;

function nav(user) {
  const { getNavItems, getAdminItems } = require_perms();
  const navLinks = getNavItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  const adminLinks = getAdminItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  return `<nav class="navbar bg-white shadow-sm px-4" role="navigation" aria-label="Main navigation"><div class="navbar-start"><a href="/" class="font-bold text-lg" aria-label="Home">Platform</a><div class="hidden md:flex gap-1 ml-6">${navLinks}${adminLinks}</div></div><div class="navbar-end"><div id="user-dropdown" class="dropdown dropdown-end"><button type="button" onclick="toggleUserMenu(event)" class="btn btn-ghost btn-circle avatar placeholder" aria-label="User menu for ${user?.name || 'user'}" aria-haspopup="menu" aria-expanded="false" style="cursor:pointer"><div class="bg-primary text-white rounded-full w-10" style="display:flex;align-items:center;justify-content:center;height:2.5rem"><span aria-hidden="true">${user?.name?.charAt(0) || 'U'}</span></div></button><ul class="dropdown-menu mt-2 w-52" role="menu"><li class="dropdown-header" role="presentation">${user?.email || ''}<br/><small class="text-gray-500">${user?.role || ''}</small></li><li role="menuitem"><a href="/api/auth/logout">Logout</a></li></ul></div></div></nav><script>function toggleUserMenu(e){e.stopPropagation();var d=document.getElementById('user-dropdown');var isOpen=d.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',isOpen)}document.addEventListener('click',function(e){var d=document.getElementById('user-dropdown');if(d&&!d.contains(e.target)){d.classList.remove('open');var btn=d.querySelector('button');if(btn)btn.setAttribute('aria-expanded','false')}})</script>`;
}

let _permsCache = null;
import { getNavItems, getAdminItems } from '@/ui/permissions-ui.js';
_permsCache = { getNavItems, getAdminItems };
function require_perms() { return _permsCache; }

function breadcrumb(items) {
  if (!items?.length) return '';
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map((item, i) => i === items.length - 1 ? `<span>${item.label}</span>` : `<a href="${item.href}">${item.label}</a><span class="breadcrumb-separator">/</span>`).join('')}</nav>`;
}

function page(user, title, bc, content, scripts = []) {
  const body = `<div class="min-h-screen">${nav(user)}<main id="main-content" role="main"><div class="p-6">${breadcrumb(bc)}${content}</div></main></div>`;
  return generateHtml(title, body, scripts);
}

const RISK_LEVELS = [
  { value: 'low', label: 'Low', class: 'risk-low' },
  { value: 'medium', label: 'Medium', class: 'risk-medium' },
  { value: 'high', label: 'High', class: 'risk-high' },
  { value: 'critical', label: 'Critical', class: 'risk-critical' },
];

export function renderClientDashboard(user, client, stats = {}) {
  const c = client || {};
  const riskBadge = c.risk_level ? `<span class="risk-badge risk-${c.risk_level}">${(c.risk_level || '').charAt(0).toUpperCase() + (c.risk_level || '').slice(1)} Risk</span>` : '';
  const infoRows = [
    ['Name', c.name || '-'],
    ['Email', c.email || '-'],
    ['Phone', c.phone || '-'],
    ['Address', c.address || '-'],
    ['Status', c.status ? statusLabel(c.status) : '-'],
    ['Created', c.created_at ? new Date(typeof c.created_at === 'number' ? c.created_at * 1000 : c.created_at).toLocaleDateString() : '-'],
  ].map(([l, v]) => `<div class="client-info-row"><span class="client-info-label">${l}</span><span class="client-info-value">${v}</span></div>`).join('');
  const statCards = `<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div class="card bg-white shadow"><div class="card-body"><h3 class="text-gray-500 text-sm">Engagements</h3><p class="text-2xl font-bold">${stats.engagements || 0}</p></div></div>
    <div class="card bg-white shadow"><div class="card-body"><h3 class="text-gray-500 text-sm">Active RFIs</h3><p class="text-2xl font-bold text-blue-600">${stats.activeRfis || 0}</p></div></div>
    <div class="card bg-white shadow"><div class="card-body"><h3 class="text-gray-500 text-sm">Users</h3><p class="text-2xl font-bold">${stats.users || 0}</p></div></div>
    <div class="card bg-white shadow"><div class="card-body"><h3 class="text-gray-500 text-sm">Reviews</h3><p class="text-2xl font-bold">${stats.reviews || 0}</p></div></div></div>`;
  const engRows = (stats.engagementList || []).map(e => `<tr class="hover cursor-pointer" tabindex="0" role="link" onclick="window.location='/engagement/${e.id}'" onkeydown="if(event.key==='Enter'){window.location='/engagement/${e.id}'}"><td>${e.name || '-'}</td><td>${e.stage ? statusLabel(e.stage) : '-'}</td><td>${e.status ? statusLabel(e.status) : '-'}</td></tr>`).join('') || '<tr><td colspan="3" class="text-center py-4 text-gray-500">No engagements</td></tr>';
  const actions = canEdit(user, 'client') ? `<div class="flex gap-2"><a href="/client/${c.id}/edit" class="btn btn-outline btn-sm">Edit</a><button onclick="document.getElementById('risk-dialog').style.display='flex'" class="btn btn-outline btn-sm">Risk Assessment</button><button onclick="document.getElementById('test-email-dialog').style.display='flex'" class="btn btn-outline btn-sm">Test Email</button></div>` : '';
  const content = `<div class="flex justify-between items-center mb-6"><div><h1 class="text-2xl font-bold">${c.name || 'Client'}</h1>${riskBadge}</div>${actions}</div>
    ${statCards}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">Client Info</h2><div class="mt-4">${infoRows}</div></div></div>
      <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">Engagements</h2><div class="mt-4" style="overflow-x:auto"><table class="table table-zebra w-full"><thead><tr><th>Name</th><th>Stage</th><th>Status</th></tr></thead><tbody>${engRows}</tbody></table></div></div></div>
    </div>
    ${clientUserManagementDialog(c.id)}${clientRiskAssessmentDialog(c.id, c.risk_level)}${clientTestEmailDialog(c.id)}`;
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/client', label: 'Clients' }, { label: c.name || 'Client' }];
  return page(user, `${c.name || 'Client'} - Dashboard`, bc, content, [TOAST_SCRIPT]);
}

export function clientUserManagementDialog(clientId) {
  return `<div id="client-user-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'" onkeydown="if(event.key==='Escape')this.style.display='none'" role="dialog" aria-modal="true" aria-labelledby="client-user-dialog-title" aria-hidden="true">
    <div class="dialog-panel" style="max-width:560px">
      <div class="dialog-header"><span class="dialog-title" id="client-user-dialog-title">Manage Client Users</span><button class="dialog-close" onclick="document.getElementById('client-user-dialog').style.display='none'" aria-label="Close dialog">&times;</button></div>
      <div class="dialog-body">
        <div id="cud-list" class="flex flex-col gap-2"></div>
        <div class="inline-form" style="margin-top:1rem">
          <div class="inline-form-row">
            <div class="inline-form-field" style="flex:1"><label for="cud-email">Email</label><input type="email"  id="cud-email" class="input input-bordered input-sm w-full" placeholder="user@example.com"/></div>
            <div class="inline-form-field"><label for="cud-role">Role</label><select id="cud-role" class="select select-bordered select-sm"><option value="client_user">User</option><option value="client_admin">Admin</option></select></div>
            <div class="inline-form-field"><label>&nbsp;</label><button class="btn btn-primary btn-sm" onclick="cudAdd()">Add</button></div>
          </div>
        </div>
      </div>
      <div class="dialog-footer"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('client-user-dialog').style.display='none'">Close</button></div>
    </div></div>
  <script>
  window.showClientUsers=function(){document.getElementById('client-user-dialog').style.display='flex';cudLoad()};
  async function cudLoad(){var c=document.getElementById('cud-list');c.innerHTML='<div class="text-center text-gray-500 text-sm py-2">Loading...</div>';try{var res=await fetch('/api/user?client_id=${clientId}');var d=await res.json();var users=d.data||d||[];c.innerHTML='';if(!users.length){c.innerHTML='<div class="text-center text-gray-500 text-sm py-2">No client users</div>';return}users.forEach(function(u){var div=document.createElement('div');div.className='flex items-center justify-between gap-2';div.style.padding='0.5rem 0';div.style.borderBottom='1px solid #f3f4f6';div.innerHTML='<div><div class="text-sm font-medium">'+(u.name||'Unknown')+'</div><div class="text-xs text-gray-500">'+(u.email||'')+'</div></div><div class="flex gap-1"><span class="badge-status" style="background:#dbeafe;color:#1e40af">'+(u.role||'-')+'</span><button class="btn btn-xs btn-error btn-outline" onclick="cudRemove(\\''+u.id+'\\')">Remove</button></div>';c.appendChild(div)})}catch(e){c.innerHTML='<div class="text-center text-red-500 text-sm">Error loading users</div>'}}
  window.cudAdd=async function(){var email=document.getElementById('cud-email').value.trim();var role=document.getElementById('cud-role').value;if(!email){showToast('Email required','error');return}try{var res=await fetch('/api/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,role:role,client_id:'${clientId}',name:email.split('@')[0],status:'active'})});if(res.ok){showToast('User added','success');document.getElementById('cud-email').value='';cudLoad()}else{var d=await res.json().catch(function(){return{}});showToast(d.error||'Failed','error')}}catch(e){showToast('Error','error')}};
  window.cudRemove=async function(uid){if(!confirm('Remove this user?'))return;try{var res=await fetch('/api/user/'+uid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_id:null,role:'client_user'})});if(res.ok){showToast('User removed','success');cudLoad()}else{showToast('Failed','error')}}catch(e){showToast('Error','error')}};
  </script>`;
}

export function clientUserReplaceDialog(clientId) {
  return `<div id="client-replace-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'" onkeydown="if(event.key==='Escape')this.style.display='none'" role="dialog" aria-modal="true" aria-labelledby="client-replace-dialog-title" aria-hidden="true">
    <div class="dialog-panel">
      <div class="dialog-header"><span class="dialog-title" id="client-replace-dialog-title">Replace Client User</span><button class="dialog-close" onclick="document.getElementById('client-replace-dialog').style.display='none'" aria-label="Close dialog">&times;</button></div>
      <div class="dialog-body">
        <div class="modal-form-group"><label for="crd-from">Current User</label><select id="crd-from" class="select select-bordered w-full"><option value="">Select user to replace...</option></select></div>
        <div style="text-align:center;padding:0.5rem;color:#9ca3af">&#8595; Replace with &#8595;</div>
        <div class="modal-form-group"><label for="crd-to">New User</label><select id="crd-to" class="select select-bordered w-full"><option value="">Select replacement user...</option></select></div>
        <div class="modal-form-group"><label class="flex items-center gap-2"><input type="checkbox" id="crd-transfer" class="checkbox" checked/><span class="text-sm">Transfer all assignments</span></label></div>
      </div>
      <div class="dialog-footer"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('client-replace-dialog').style.display='none'">Cancel</button><button class="btn btn-primary btn-sm" onclick="crdConfirm()">Replace</button></div>
    </div></div>
  <script>
  window.showClientReplace=function(){document.getElementById('client-replace-dialog').style.display='flex';fetch('/api/user?client_id=${clientId}').then(function(r){return r.json()}).then(function(d){var users=d.data||d||[];['crd-from','crd-to'].forEach(function(id){var sel=document.getElementById(id);while(sel.options.length>1)sel.remove(1);users.forEach(function(u){var o=document.createElement('option');o.value=u.id;o.textContent=(u.name||u.email||u.id);sel.appendChild(o)})})}).catch(function(){})};
  window.crdConfirm=async function(){var from=document.getElementById('crd-from').value;var to=document.getElementById('crd-to').value;if(!from||!to){showToast('Select both users','error');return}if(from===to){showToast('Cannot replace with same user','error');return}try{var res=await fetch('/api/user/'+from,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({replaced_by:to,status:'inactive'})});if(res.ok){showToast('User replaced','success');document.getElementById('client-replace-dialog').style.display='none';setTimeout(function(){location.reload()},500)}else{showToast('Failed','error')}}catch(e){showToast('Error','error')}};
  </script>`;
}

export function clientTestEmailDialog(clientId) {
  return `<div id="test-email-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'" onkeydown="if(event.key==='Escape')this.style.display='none'" role="dialog" aria-modal="true" aria-labelledby="test-email-dialog-title" aria-hidden="true">
    <div class="dialog-panel">
      <div class="dialog-header"><span class="dialog-title" id="test-email-dialog-title">Send Test Email</span><button class="dialog-close" onclick="document.getElementById('test-email-dialog').style.display='none'" aria-label="Close dialog">&times;</button></div>
      <div class="dialog-body">
        <div class="modal-form-group"><label for="ted-to">To (email)</label><input type="email"  id="ted-to" class="input input-bordered w-full" placeholder="recipient@example.com"/></div>
        <div class="modal-form-group"><label for="ted-subject">Subject</label><input type="text"  id="ted-subject" class="input input-bordered w-full" value="Test Email - Platform Notification"/></div>
        <div class="modal-form-group"><label for="ted-body">Message</label><textarea id="ted-body" class="textarea textarea-bordered w-full" rows="4">This is a test email from the Platform to verify email delivery to client users.</textarea></div>
      </div>
      <div class="dialog-footer"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('test-email-dialog').style.display='none'">Cancel</button><button class="btn btn-primary btn-sm" onclick="tedSend()">Send Test</button></div>
    </div></div>
  <script>
  window.tedSend=async function(){var to=document.getElementById('ted-to').value.trim();if(!to){showToast('Email required','error');return}try{var res=await fetch('/api/email/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:to,subject:document.getElementById('ted-subject').value,body:document.getElementById('ted-body').value,client_id:'${clientId}'})});if(res.ok){showToast('Test email sent','success');document.getElementById('test-email-dialog').style.display='none'}else{showToast('Send failed (email service may not be configured)','info');document.getElementById('test-email-dialog').style.display='none'}}catch(e){showToast('Email service not available','info');document.getElementById('test-email-dialog').style.display='none'}};
  </script>`;
}

export function clientRiskAssessmentDialog(clientId, currentRisk) {
  const options = RISK_LEVELS.map(r => `<label class="choice-option"><input type="radio" name="crad-risk" value="${r.value}" ${currentRisk === r.value ? 'checked' : ''} onclick="cradSelect('${r.value}')"/><span class="choice-label"><span class="risk-badge ${r.class}">${r.label}</span></span></label>`).join('');
  return `<div id="risk-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'" onkeydown="if(event.key==='Escape')this.style.display='none'" role="dialog" aria-modal="true" aria-labelledby="risk-dialog-title" aria-hidden="true">
    <div class="dialog-panel">
      <div class="dialog-header"><span class="dialog-title" id="risk-dialog-title">Risk Assessment</span><button class="dialog-close" onclick="document.getElementById('risk-dialog').style.display='none'" aria-label="Close dialog">&times;</button></div>
      <div class="dialog-body">
        <div class="choice-group">${options}</div>
        <div class="modal-form-group" style="margin-top:1rem"><label for="crad-notes">Notes</label><textarea id="crad-notes" class="textarea textarea-bordered w-full" rows="2" placeholder="Risk assessment notes..."></textarea></div>
      </div>
      <div class="dialog-footer"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('risk-dialog').style.display='none'">Cancel</button><button class="btn btn-primary btn-sm" onclick="cradSave()">Save</button></div>
    </div></div>
  <script>
  window.cradSelect=function(v){document.querySelectorAll('input[name="crad-risk"]').forEach(function(r){r.checked=r.value===v})};
  window.cradSave=async function(){var sel=document.querySelector('input[name="crad-risk"]:checked');if(!sel){showToast('Select a risk level','error');return}try{var res=await fetch('/api/client/${clientId}',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({risk_level:sel.value,risk_notes:document.getElementById('crad-notes').value})});if(res.ok){showToast('Risk assessment saved','success');document.getElementById('risk-dialog').style.display='none';setTimeout(function(){location.reload()},500)}else{showToast('Failed','error')}}catch(e){showToast('Error','error')}};
  </script>`;
}

export function clientInfoCard(client) {
  const c = client || {};
  const infoRows = [
    ['Name', c.name], ['Email', c.email], ['Phone', c.phone],
    ['Industry', c.industry], ['Status', c.status ? statusLabel(c.status) : null],
    ['Risk', c.risk_level ? `<span class="risk-badge risk-${c.risk_level}">${c.risk_level}</span>` : null],
  ].filter(([, v]) => v).map(([l, v]) => `<div class="client-info-row"><span class="client-info-label">${l}</span><span class="client-info-value">${v}</span></div>`).join('');
  return `<div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">Client Details</h2><div class="mt-4">${infoRows || '<div class="text-gray-500 text-sm">No details available</div>'}</div></div></div>`;
}
