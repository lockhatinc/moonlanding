import { generateHtml, statusLabel, linearProgress } from './renderer.js';
import { canCreate, canEdit, getNavItems, getAdminItems } from './permissions-ui.js';

function nav(user) {
  const navLinks = getNavItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  const adminLinks = getAdminItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  return `<nav class="navbar bg-white shadow-sm px-4"><div class="navbar-start"><a href="/" class="font-bold text-lg">Platform</a><div class="hidden md:flex gap-1 ml-6">${navLinks}${adminLinks}</div></div><div class="navbar-end"></div></nav>`;
}
function breadcrumb(items) {
  if (!items?.length) return '';
  return `<nav class="breadcrumb">${items.map((item, i) => i === items.length - 1 ? `<span>${item.label}</span>` : `<a href="${item.href}">${item.label}</a><span class="breadcrumb-separator">/</span>`).join('')}</nav>`;
}
function page(user, title, bc, content, scripts = []) {
  const body = `<div class="min-h-screen">${nav(user)}<div class="p-6">${breadcrumb(bc)}${content}</div></div>`;
  return generateHtml(title, body, scripts);
}

export function checklistTemplatesUI(user, templates = []) {
  const rows = templates.map(t => `<tr class="hover cursor-pointer" onclick="window.location='/admin/settings/checklists/${t.id}'"><td>${t.name || 'Untitled'}</td><td>${t.item_count || 0} items</td><td>${t.active ? statusLabel('active') : statusLabel('inactive')}</td><td class="text-xs text-gray-500">${t.created_at ? new Date(typeof t.created_at === 'number' ? t.created_at * 1000 : t.created_at).toLocaleDateString() : '-'}</td></tr>`).join('');
  const createBtn = canCreate(user, 'checklist') ? `<button class="btn btn-primary btn-sm" onclick="chtCreate()">New Template</button>` : '';
  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Checklist Templates</h1>${createBtn}</div><div class="card bg-white shadow"><div class="card-body"><table class="table table-zebra w-full"><thead><tr><th>Name</th><th>Items</th><th>Status</th><th>Created</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="text-center py-4 text-gray-500">No templates</td></tr>'}</tbody></table></div></div>`;
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'Checklists' }];
  const script = `window.chtCreate=async function(){var name=prompt('Template name:');if(!name)return;try{var r=await fetch('/api/checklist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,active:true})});if(r.ok){var d=await r.json();window.location='/admin/settings/checklists/'+(d.data?.id||d.id||'');}else alert('Failed')}catch(e){alert('Error')}}`;
  return page(user, 'Checklist Templates', bc, content, [script]);
}
export function checklistDialog(checklistId) {
  return `<div id="checklist-dialog" class="dialog-overlay" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="dialog-panel" style="max-width:640px"><div class="dialog-header"><span class="dialog-title">Checklist</span><button class="dialog-close" onclick="document.getElementById('checklist-dialog').style.display='none'">&times;</button></div>
      <div class="dialog-body"><div id="ckd-items" class="flex flex-col gap-2"></div><div class="flex gap-2 mt-3"><input id="ckd-new" class="input input-bordered input-sm flex-1" placeholder="New item..."/><button class="btn btn-primary btn-sm" onclick="ckdAdd()">Add</button></div></div>
      <div class="dialog-footer"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('checklist-dialog').style.display='none'">Close</button></div>
    </div></div>
  <script>
  window.openChecklist=function(id){var cid=id||'${checklistId}';document.getElementById('checklist-dialog').style.display='flex';fetch('/api/checklist_item?checklist_id='+cid).then(function(r){return r.json()}).then(function(d){var items=d.data||d||[];var el=document.getElementById('ckd-items');el.innerHTML=items.map(function(it){return'<label class="flex items-center gap-2"><input type="checkbox" class="checkbox checkbox-sm" '+(it.completed?'checked':'')+' onchange="ckdToggle(\\''+it.id+'\\',this.checked)"/><span class="text-sm'+(it.completed?' line-through text-gray-400':'')+'">'+(it.name||it.title||'')+'</span></label>'}).join('')||'<div class="text-gray-500 text-sm">No items</div>'}).catch(function(){})};
  window.ckdToggle=async function(id,done){try{await fetch('/api/checklist_item/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({completed:done})})}catch(e){}};
  window.ckdAdd=async function(){var name=document.getElementById('ckd-new').value.trim();if(!name)return;try{await fetch('/api/checklist_item',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({checklist_id:'${checklistId}',name:name})});document.getElementById('ckd-new').value='';openChecklist('${checklistId}')}catch(e){}};
  </script>`;
}
export function pushChecklistCrossRef(engagementId) {
  return `<script>
  window.pushChecklistCrossRef=async function(checklistId,targetEngId){try{var r=await fetch('/api/checklist/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({checklist_id:checklistId,source_engagement_id:'${engagementId}',target_engagement_id:targetEngId})});if(r.ok)showToast('Checklist pushed','success');else showToast('Push failed','error')}catch(e){showToast('Error','error')}};
  </script>`;
}
export function renderChecklistDetails(user, checklist, items = []) {
  const completed = items.filter(i => i.completed).length;
  const pct = items.length > 0 ? Math.round(completed / items.length * 100) : 0;
  const itemRows = items.map(it => `<div class="flex items-center gap-3 p-2 border-b"><input type="checkbox" class="checkbox" ${it.completed ? 'checked' : ''} onchange="ckToggle('${it.id}',this.checked)"/><span class="flex-1 text-sm${it.completed ? ' line-through text-gray-400' : ''}">${it.name || it.title || ''}</span><button class="btn btn-xs btn-ghost btn-error" onclick="ckDel('${it.id}')">x</button></div>`).join('');
  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">${checklist.name || 'Checklist'}</h1><span class="text-sm text-gray-500">${completed}/${items.length} (${pct}%)</span></div>${linearProgress(completed, items.length || 1)}<div class="card bg-white shadow mt-4"><div class="card-body">${itemRows || '<div class="text-gray-500 text-center py-4">No items</div>'}<div class="flex gap-2 mt-4"><input id="ck-new" class="input input-bordered input-sm flex-1" placeholder="New item"/><button class="btn btn-primary btn-sm" onclick="ckAdd()">Add</button></div></div></div>`;
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/checklist', label: 'Checklists' }, { label: checklist.name || 'Checklist' }];
  const script = `window.ckToggle=async function(id,done){await fetch('/api/checklist_item/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({completed:done})});location.reload()};window.ckDel=async function(id){if(!confirm('Delete?'))return;await fetch('/api/checklist_item/'+id,{method:'DELETE'});location.reload()};window.ckAdd=async function(){var n=document.getElementById('ck-new').value.trim();if(!n)return;await fetch('/api/checklist_item',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({checklist_id:'${checklist.id}',name:n})});location.reload()}`;
  return page(user, checklist.name || 'Checklist', bc, content, [script]);
}
export function renderChecklistsHome(user, checklists = []) {
  const rows = checklists.map(c => {
    const pct = c.total_items > 0 ? Math.round((c.completed_items || 0) / c.total_items * 100) : 0;
    return `<tr class="hover cursor-pointer" onclick="window.location='/checklist/${c.id}'"><td>${c.name || 'Untitled'}</td><td>${c.engagement_name || '-'}</td><td>${linearProgress(c.completed_items || 0, c.total_items || 1, '', 'thin')}</td><td>${pct}%</td></tr>`;
  }).join('');
  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Checklists</h1></div><div class="card bg-white shadow"><div class="card-body"><table class="table table-zebra w-full"><thead><tr><th>Name</th><th>Engagement</th><th>Progress</th><th>%</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="text-center py-4 text-gray-500">No checklists</td></tr>'}</tbody></table></div></div>`;
  const bc = [{ href: '/', label: 'Dashboard' }, { label: 'Checklists' }];
  return page(user, 'Checklists', bc, content);
}
export function renderChecklistsManagement(user, checklists = []) {
  const rows = checklists.map(c => `<tr><td>${c.name || 'Untitled'}</td><td>${c.total_items || 0}</td><td>${c.active ? statusLabel('active') : statusLabel('inactive')}</td><td><div class="flex gap-1"><a href="/checklist/${c.id}" class="btn btn-xs btn-ghost">View</a><button class="btn btn-xs btn-ghost" onclick="ckmToggle('${c.id}',${c.active ? 'false' : 'true'})">${c.active ? 'Deactivate' : 'Activate'}</button><button class="btn btn-xs btn-ghost btn-error" onclick="ckmDel('${c.id}')">Delete</button></div></td></tr>`).join('');
  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Manage Checklists</h1></div><div class="card bg-white shadow"><div class="card-body"><table class="table table-zebra w-full"><thead><tr><th>Name</th><th>Items</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="text-center py-4 text-gray-500">No checklists</td></tr>'}</tbody></table></div></div>`;
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'Manage Checklists' }];
  const script = `window.ckmToggle=async function(id,active){await fetch('/api/checklist/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:active})});location.reload()};window.ckmDel=async function(id){if(!confirm('Delete?'))return;await fetch('/api/checklist/'+id,{method:'DELETE'});location.reload()}`;
  return page(user, 'Manage Checklists', bc, content, [script]);
}
