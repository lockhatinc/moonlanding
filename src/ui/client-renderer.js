import { canCreate, canEdit } from '@/ui/permissions-ui.js';
import { page } from '@/ui/layout.js';
import { esc, statusBadge, TOAST_SCRIPT, TABLE_SCRIPT } from '@/ui/render-helpers.js';

const RISK_LEVELS = [
  { value: 'low',      label: 'Low',      cls: 'badge-success badge-flat-success' },
  { value: 'medium',   label: 'Medium',   cls: 'badge-warning badge-flat-warning' },
  { value: 'high',     label: 'High',     cls: 'badge-error badge-flat-error' },
  { value: 'critical', label: 'Critical', cls: 'badge-error' },
];

export function renderClientList(user, clients) {
  const addBtn = canCreate(user, 'client')
    ? `<a href="/client/new" class="btn-primary-clean"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Client</a>`
    : '';
  const rows = (clients || []).map(c => {
    const sp = (c.status || 'active') === 'active' ? '<span class="pill pill-success">Active</span>' : '<span class="pill pill-neutral">Inactive</span>';
    return `<tr data-row onclick="location.href='/client/${esc(c.id)}'" style="cursor:pointer">
      <td data-col="code" style="font-weight:600;color:var(--color-info)">${esc(c.client_code || c.code || '-')}</td>
      <td data-col="name"><strong>${esc(c.name || '-')}</strong></td>
      <td data-col="type">${esc(c.entity_type || c.industry || '-')}</td>
      <td data-col="email">${esc(Array.isArray(c.master_emails) ? c.master_emails[0] : (c.email || '-'))}</td>
      <td data-col="status">${sp}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" style="text-align:center;padding:48px;color:var(--color-text-muted)">No clients found</td></tr>`;

  const content = `<div class="page-header">
      <div><h1 class="page-title">Clients</h1><p class="page-subtitle">${(clients||[]).length} clients</p></div>
      ${addBtn}
    </div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="table-search"><input id="search-input" type="text" placeholder="Search clients..."></div>
        <div class="table-filter"><select data-filter="status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <span class="table-count" id="row-count">${(clients||[]).length} items</span>
      </div>
      <table class="data-table">
        <thead><tr><th data-sort="code">Code</th><th data-sort="name">Name</th><th data-sort="type">Industry</th><th data-sort="email">Email</th><th data-sort="status">Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  return page(user, 'Clients | MOONLANDING', null, content, [TABLE_SCRIPT]);
}

export function renderClientDashboard(user, client, stats = {}) {
  const c = client || {};
  const riskCls = RISK_LEVELS.find(r => r.value === c.risk_level)?.cls || 'badge-flat-secondary';
  const riskBadge = c.risk_level ? `<span class="badge ${riskCls} ml-2">${(c.risk_level || '').charAt(0).toUpperCase() + (c.risk_level || '').slice(1)} Risk</span>` : '';

  const infoRows = [
    ['Name', c.name || '-'], ['Email', c.email || '-'], ['Phone', c.phone || '-'],
    ['Address', c.address || '-'], ['Status', statusBadge(c.status || 'active')],
    ['Created', c.created_at ? new Date(typeof c.created_at === 'number' ? c.created_at * 1000 : c.created_at).toLocaleDateString() : '-'],
  ].map(([l, v]) => `<div class="flex flex-col gap-1 py-2 border-b border-base-200 last:border-0">
    <span class="text-xs font-semibold uppercase tracking-wider text-base-content/50">${l}</span>
    <span class="text-sm text-base-content">${v}</span>
  </div>`).join('');

  const statsHtml = `<div class="stats-row">
    <div class="stat-card"><div class="stat-card-value">${stats.engagements||0}</div><div class="stat-card-label">Engagements</div></div>
    <div class="stat-card"><div class="stat-card-value">${stats.activeRfis||0}</div><div class="stat-card-label">Active RFIs</div></div>
    <div class="stat-card"><div class="stat-card-value">${stats.users||0}</div><div class="stat-card-label">Users</div></div>
    <div class="stat-card"><div class="stat-card-value">${stats.reviews||0}</div><div class="stat-card-label">Reviews</div></div>
  </div>`;

  const engRows = (stats.engagementList || []).map(e => `<tr class="hover cursor-pointer" onclick="window.location='/engagement/${e.id}'"><td class="text-sm">${e.name || '-'}</td><td>${statusBadge(e.stage)}</td><td>${statusBadge(e.status)}</td></tr>`).join('') || '<tr><td colspan="3" class="text-center py-6 text-base-content/40 text-sm">No engagements</td></tr>';

  const actions = canEdit(user, 'client') ? `<div class="flex gap-2 flex-wrap">
    <a href="/client/${c.id}/edit" class="btn btn-primary btn-sm">Edit</a>
    <button onclick="document.getElementById('risk-dialog').style.display='flex'" class="btn btn-ghost btn-sm" style="border:1px solid #e5e7eb">Risk Assessment</button>
    <button onclick="document.getElementById('test-email-dialog').style.display='flex'" class="btn btn-ghost btn-sm" style="border:1px solid #e5e7eb">Test Email</button>
  </div>` : '';

  const content = `
    <div class="flex justify-between items-start mb-6 flex-wrap gap-3">
      <div><h1 class="text-2xl font-bold text-base-content">${esc(c.name || 'Client')}</h1><div class="mt-1">${riskBadge}</div></div>
      ${actions}
    </div>
    ${statsHtml}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card bg-base-100 shadow-md"><div class="card-body"><h2 class="card-title text-sm mb-3">Client Info</h2><div>${infoRows}</div></div></div>
      <div class="card bg-base-100 shadow-md"><div class="card-body">
        <h2 class="card-title text-sm mb-3">Engagements</h2>
        <div class="table-container"><table class="table table-hover"><thead><tr><th>Name</th><th>Stage</th><th>Status</th></tr></thead><tbody>${engRows}</tbody></table></div>
      </div></div>
    </div>
    ${clientUserManagementDialog(c.id)}${clientRiskAssessmentDialog(c.id, c.risk_level)}${clientTestEmailDialog(c.id)}`;

  const bc = [{ href: '/', label: 'Home' }, { href: '/client', label: 'Clients' }, { label: c.name || 'Client' }];
  return page(user, `${c.name || 'Client'} - Dashboard`, bc, content, [TOAST_SCRIPT]);
}

export function clientUserManagementDialog(clientId) {
  return `<div id="client-user-dialog" class="modal" style="display:none" onclick="if(event.target===this)this.style.display='none'" role="dialog" aria-modal="true" aria-labelledby="client-user-dialog-title" aria-hidden="true">
    <div class="modal-overlay" onclick="document.getElementById('client-user-dialog').style.display='none'"></div>
    <div class="modal-content rounded-box max-w-lg p-6">
      <h3 class="text-lg font-semibold mb-4" id="client-user-dialog-title">Manage Client Users</h3>
      <div id="cud-list" class="flex flex-col gap-2 mb-4"></div>
      <div class="form-group"><div class="flex gap-2 items-end">
        <div class="flex-1"><label class="label"><span class="label-text font-medium">Email</span></label><input type="email" id="cud-email" class="input input-solid max-w-full" placeholder="user@example.com"/></div>
        <div><label class="label"><span class="label-text font-medium">Role</span></label><select id="cud-role" class="select select-solid"><option value="client_user">User</option><option value="client_admin">Admin</option></select></div>
        <button class="btn btn-primary btn-sm" onclick="cudAdd()">Add</button>
      </div></div>
      <div class="modal-action mt-4"><button class="btn btn-ghost" onclick="document.getElementById('client-user-dialog').style.display='none'">Close</button></div>
    </div>
  </div>
  <script>
  window.showClientUsers=function(){document.getElementById('client-user-dialog').style.display='flex';cudLoad()};
  async function cudLoad(){var c=document.getElementById('cud-list');c.innerHTML='<div class="text-center text-base-content/50 text-sm py-2">Loading...</div>';try{var res=await fetch('/api/user?client_id=${clientId}');var d=await res.json();var users=d.data||d||[];c.innerHTML='';if(!users.length){c.innerHTML='<div class="text-center text-base-content/50 text-sm py-2">No client users</div>';return}users.forEach(function(u){var div=document.createElement('div');div.className='flex items-center justify-between gap-2 py-2 border-b border-base-200';div.innerHTML='<div><div class="text-sm font-medium">'+(u.name||'Unknown')+'</div><div class="text-xs text-base-content/50">'+(u.email||'')+'</div></div><div class="flex gap-2"><span class="badge badge-flat-primary text-xs">'+(u.role||'-')+'</span><button class="btn btn-xs btn-error" onclick="cudRemove(\\''+u.id+'\\')">Remove</button></div>';c.appendChild(div)})}catch(e){c.innerHTML='<div class="text-center text-error text-sm">Error loading users</div>'}}
  window.cudAdd=async function(){var email=document.getElementById('cud-email').value.trim();var role=document.getElementById('cud-role').value;if(!email){showToast('Email required','error');return}try{var res=await fetch('/api/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,role:role,client_id:'${clientId}',name:email.split('@')[0],status:'active'})});if(res.ok){showToast('User added','success');document.getElementById('cud-email').value='';cudLoad()}else{var d=await res.json().catch(function(){return{}});showToast(d.error||'Failed','error')}}catch(e){showToast('Error','error')}};
  window.cudRemove=async function(uid){if(!confirm('Remove this user?'))return;try{var res=await fetch('/api/user/'+uid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_id:null,role:'client_user'})});if(res.ok){showToast('User removed','success');cudLoad()}else{showToast('Failed','error')}}catch(e){showToast('Error','error')}};
  </script>`;
}

export function clientUserReplaceDialog(clientId) {
  return `<div id="client-replace-dialog" class="modal" style="display:none" onclick="if(event.target===this)this.style.display='none'" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="modal-overlay" onclick="document.getElementById('client-replace-dialog').style.display='none'"></div>
    <div class="modal-content rounded-box max-w-md p-6">
      <h3 class="text-lg font-semibold mb-4">Replace Client User</h3>
      <div class="form-group mb-3"><label class="label"><span class="label-text font-medium">Current User</span></label><select id="crd-from" class="select select-solid max-w-full"><option value="">Select user to replace...</option></select></div>
      <div class="divider text-xs text-base-content/40">Replace with</div>
      <div class="form-group mb-3"><label class="label"><span class="label-text font-medium">New User</span></label><select id="crd-to" class="select select-solid max-w-full"><option value="">Select replacement user...</option></select></div>
      <div class="form-group mb-4"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="crd-transfer" class="checkbox" checked/><span class="label-text">Transfer all assignments</span></label></div>
      <div class="modal-action"><button class="btn btn-primary" onclick="crdConfirm()">Replace</button><button class="btn btn-ghost" onclick="document.getElementById('client-replace-dialog').style.display='none'">Cancel</button></div>
    </div>
  </div>
  <script>
  window.showClientReplace=function(){document.getElementById('client-replace-dialog').style.display='flex';fetch('/api/user?client_id=${clientId}').then(function(r){return r.json()}).then(function(d){var users=d.data||d||[];['crd-from','crd-to'].forEach(function(id){var sel=document.getElementById(id);while(sel.options.length>1)sel.remove(1);users.forEach(function(u){var o=document.createElement('option');o.value=u.id;o.textContent=(u.name||u.email||u.id);sel.appendChild(o)})})}).catch(function(){})};
  window.crdConfirm=async function(){var from=document.getElementById('crd-from').value;var to=document.getElementById('crd-to').value;if(!from||!to){showToast('Select both users','error');return}if(from===to){showToast('Cannot replace with same user','error');return}try{var res=await fetch('/api/user/'+from,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({replaced_by:to,status:'inactive'})});if(res.ok){showToast('User replaced','success');document.getElementById('client-replace-dialog').style.display='none';setTimeout(function(){location.reload()},500)}else{showToast('Failed','error')}}catch(e){showToast('Error','error')}};
  </script>`;
}

export function clientTestEmailDialog(clientId) {
  return `<div id="test-email-dialog" class="modal" style="display:none" onclick="if(event.target===this)this.style.display='none'" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="modal-overlay" onclick="document.getElementById('test-email-dialog').style.display='none'"></div>
    <div class="modal-content rounded-box max-w-md p-6">
      <h3 class="text-lg font-semibold mb-4">Send Test Email</h3>
      <div class="form-group mb-3"><label class="label"><span class="label-text font-medium">To</span></label><input type="email" id="ted-to" class="input input-solid max-w-full" placeholder="recipient@example.com"/></div>
      <div class="form-group mb-3"><label class="label"><span class="label-text font-medium">Subject</span></label><input type="text" id="ted-subject" class="input input-solid max-w-full" value="Test Email - Platform Notification"/></div>
      <div class="form-group mb-4"><label class="label"><span class="label-text font-medium">Message</span></label><textarea id="ted-body" class="textarea textarea-solid max-w-full" rows="4">This is a test email from the Platform to verify email delivery to client users.</textarea></div>
      <div class="modal-action"><button class="btn btn-primary" onclick="tedSend()">Send Test</button><button class="btn btn-ghost" onclick="document.getElementById('test-email-dialog').style.display='none'">Cancel</button></div>
    </div>
  </div>
  <script>
  window.tedSend=async function(){var to=document.getElementById('ted-to').value.trim();if(!to){showToast('Email required','error');return}try{var res=await fetch('/api/email/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:to,subject:document.getElementById('ted-subject').value,body:document.getElementById('ted-body').value,client_id:'${clientId}'})});if(res.ok){showToast('Test email sent','success');document.getElementById('test-email-dialog').style.display='none'}else{showToast('Send failed (email service may not be configured)','info');document.getElementById('test-email-dialog').style.display='none'}}catch(e){showToast('Email service not available','info');document.getElementById('test-email-dialog').style.display='none'}};
  </script>`;
}

export function clientRiskAssessmentDialog(clientId, currentRisk) {
  const options = RISK_LEVELS.map(r => `<label class="flex items-center gap-3 p-3 rounded-box border border-base-200 cursor-pointer hover:bg-base-200 transition-colors"><input type="radio" name="crad-risk" value="${r.value}" ${currentRisk === r.value ? 'checked' : ''} class="radio radio-primary"/><span class="badge ${r.cls}">${r.label}</span></label>`).join('');
  return `<div id="risk-dialog" class="modal" style="display:none" onclick="if(event.target===this)this.style.display='none'" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="modal-overlay" onclick="document.getElementById('risk-dialog').style.display='none'"></div>
    <div class="modal-content rounded-box max-w-md p-6">
      <h3 class="text-lg font-semibold mb-4">Risk Assessment</h3>
      <div class="flex flex-col gap-2 mb-4">${options}</div>
      <div class="form-group mb-4"><label class="label"><span class="label-text font-medium">Notes</span></label><textarea id="crad-notes" class="textarea textarea-solid max-w-full" rows="2" placeholder="Risk assessment notes..."></textarea></div>
      <div class="modal-action"><button class="btn btn-primary" onclick="cradSave()">Save</button><button class="btn btn-ghost" onclick="document.getElementById('risk-dialog').style.display='none'">Cancel</button></div>
    </div>
  </div>
  <script>
  window.cradSave=async function(){var sel=document.querySelector('input[name="crad-risk"]:checked');if(!sel){showToast('Select a risk level','error');return}try{var res=await fetch('/api/client/${clientId}',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({risk_level:sel.value,risk_notes:document.getElementById('crad-notes').value})});if(res.ok){showToast('Risk assessment saved','success');document.getElementById('risk-dialog').style.display='none';setTimeout(function(){location.reload()},500)}else{showToast('Failed','error')}}catch(e){showToast('Error','error')}};
  </script>`;
}

export function clientInfoCard(client) {
  const c = client || {};
  const infoRows = [
    ['Name', c.name], ['Email', c.email], ['Phone', c.phone],
    ['Industry', c.industry], ['Status', c.status ? statusBadge(c.status) : null],
    ['Risk', c.risk_level ? `<span class="badge badge-flat-secondary text-xs">${c.risk_level}</span>` : null],
  ].filter(([, v]) => v).map(([l, v]) => `<div class="flex flex-col gap-1 py-2 border-b border-base-200 last:border-0"><span class="text-xs font-semibold uppercase tracking-wider text-base-content/50">${l}</span><span class="text-sm">${v}</span></div>`).join('');
  return `<div class="card bg-base-100 shadow-md"><div class="card-body"><h2 class="card-title text-sm">Client Details</h2><div class="mt-3">${infoRows || '<div class="text-base-content/50 text-sm">No details available</div>'}</div></div></div>`;
}
