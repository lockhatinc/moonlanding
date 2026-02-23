import { page } from '@/ui/layout.js';
import { canCreate } from '@/ui/permissions-ui.js';

const TOAST = `window.showToast=(m,t='info')=>{let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.className='toast-container';document.body.appendChild(c)}const d=document.createElement('div');d.className='toast toast-'+t;d.textContent=m;c.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},3000)};`;

function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

export function checklistTemplatesUI(user, templates = []) {
  const rows = templates.map(t => `<tr class="hover cursor-pointer" onclick="window.location='/admin/settings/checklists/${esc(t.id)}'">
    <td class="font-medium text-sm">${esc(t.name || 'Untitled')}</td>
    <td class="text-sm">${t.item_count || 0} items</td>
    <td>${t.active ? '<span class="badge badge-success badge-flat-success text-xs">Active</span>' : '<span class="badge badge-flat-secondary text-xs">Inactive</span>'}</td>
    <td class="text-sm text-base-content/50">${t.created_at ? new Date(typeof t.created_at === 'number' ? t.created_at * 1000 : t.created_at).toLocaleDateString() : '-'}</td>
  </tr>`).join('');
  const createBtn = canCreate(user, 'checklist') ? `<button class="btn btn-primary btn-sm" onclick="chtCreate()">+ New Template</button>` : '';
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'Checklists' }];
  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Checklist Templates</h1>${createBtn}</div>
    <div class="card bg-base-100 shadow-md"><div class="card-body p-0">
      <div class="table-container"><table class="table table-hover">
        <thead><tr><th>Name</th><th>Items</th><th>Status</th><th>Created</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="text-center py-8 text-base-content/40">No templates</td></tr>'}</tbody>
      </table></div>
    </div></div>`;
  const script = `${TOAST}window.chtCreate=async function(){var name=prompt('Template name:');if(!name)return;try{var r=await fetch('/api/checklist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,active:true})});if(r.ok){var d=await r.json();window.location='/admin/settings/checklists/'+(d.data?.id||d.id||'');}else showToast('Failed','error')}catch(e){showToast('Error','error')}}`;
  return page(user, 'Checklist Templates', bc, content, [script]);
}

export function checklistDialog(checklistId) {
  return `<div id="checklist-dialog" class="modal" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal-overlay" onclick="document.getElementById('checklist-dialog').style.display='none'"></div>
    <div class="modal-content rounded-box max-w-lg p-6">
      <h3 class="text-lg font-semibold mb-4" id="checklist-dialog-title">Checklist</h3>
      <div id="ckd-items" class="flex flex-col gap-2 mb-4"></div>
      <div class="flex gap-2">
        <input id="ckd-new" class="input input-solid flex-1" placeholder="New item..."/>
        <button class="btn btn-primary btn-sm" onclick="ckdAdd()">Add</button>
      </div>
      <div class="modal-action mt-4">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('checklist-dialog').style.display='none'">Close</button>
      </div>
    </div>
  </div>
  <script>
  window.openChecklist=function(id){var cid=id||'${checklistId}';document.getElementById('checklist-dialog').style.display='flex';fetch('/api/checklist_item?checklist_id='+cid).then(function(r){return r.json()}).then(function(d){var items=d.data||d||[];var el=document.getElementById('ckd-items');el.innerHTML=items.map(function(it){return'<label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm" '+(it.is_done?'checked':'')+' onchange="ckdToggle(\\''+it.id+'\\',this.checked)"/><span class="text-sm'+(it.is_done?' line-through text-base-content/40':'')+'">'+(it.name||it.title||'')+'</span></label>'}).join('')||'<div class="text-base-content/40 text-sm py-4 text-center">No items</div>'}).catch(function(){})};
  window.ckdToggle=async function(id,done){try{await fetch('/api/checklist_item/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_done:done})})}catch(e){}};
  window.ckdAdd=async function(){var name=document.getElementById('ckd-new').value.trim();if(!name)return;try{await fetch('/api/checklist_item',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({checklist_id:'${checklistId}',name:name})});document.getElementById('ckd-new').value='';openChecklist('${checklistId}')}catch(e){}};
  </script>`;
}

export function pushChecklistCrossRef(engagementId) {
  return `<script>
  window.pushChecklistCrossRef=async function(checklistId,targetEngId){try{var r=await fetch('/api/checklist/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({checklist_id:checklistId,source_engagement_id:'${engagementId}',target_engagement_id:targetEngId})});if(r.ok)showToast('Checklist pushed','success');else showToast('Push failed','error')}catch(e){showToast('Error','error')}};
  </script>`;
}

export function renderChecklistDetails(user, checklist, items = []) {
  const completed = items.filter(i => i.is_done).length;
  const pct = items.length > 0 ? Math.round(completed / items.length * 100) : 0;
  const itemRows = items.map(it => `<div class="flex items-center gap-3 p-3 border-b border-base-200">
    <label class="flex items-center gap-3 flex-1 cursor-pointer">
      <input type="checkbox" class="checkbox checkbox-sm" ${it.is_done ? 'checked' : ''} onchange="ckToggle('${esc(it.id)}',this.checked)"/>
      <span class="text-sm${it.is_done ? ' line-through text-base-content/40' : ''}">${esc(it.name || it.title || '')}</span>
    </label>
    <button class="btn btn-ghost btn-xs btn-error" onclick="ckDel('${esc(it.id)}')">&#x2715;</button>
  </div>`).join('');
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/checklist', label: 'Checklists' }, { label: checklist.name || 'Checklist' }];
  const content = `<div class="flex justify-between items-center mb-2">
    <h1 class="text-2xl font-bold">${esc(checklist.name || 'Checklist')}</h1>
    <span class="badge badge-flat-primary text-sm">${completed}/${items.length} (${pct}%)</span>
  </div>
  <progress class="progress progress-primary w-full mb-6" value="${completed}" max="${items.length || 1}"></progress>
  <div class="card bg-base-100 shadow-md"><div class="card-body p-0">
    ${itemRows || '<div class="text-base-content/40 text-center py-8">No items</div>'}
    <div class="flex gap-2 p-4 border-t border-base-200">
      <input id="ck-new" class="input input-solid flex-1" placeholder="New item"/>
      <button class="btn btn-primary btn-sm" onclick="ckAdd()">Add</button>
    </div>
  </div></div>`;
  const script = `window.ckToggle=async function(id,done){await fetch('/api/checklist_item/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_done:done})});location.reload()};window.ckDel=async function(id){if(!confirm('Delete?'))return;await fetch('/api/checklist_item/'+id,{method:'DELETE'});location.reload()};window.ckAdd=async function(){var n=document.getElementById('ck-new').value.trim();if(!n)return;await fetch('/api/checklist_item',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({checklist_id:'${esc(checklist.id)}',name:n})});location.reload()}`;
  return page(user, esc(checklist.name || 'Checklist'), bc, content, [script]);
}

export function renderChecklistsHome(user, checklists = []) {
  const rows = checklists.map(c => {
    const pct = c.total_items > 0 ? Math.round((c.completed_items || 0) / c.total_items * 100) : 0;
    return `<tr class="hover cursor-pointer" onclick="window.location='/checklist/${esc(c.id)}'">
      <td class="font-medium text-sm">${esc(c.name || 'Untitled')}</td>
      <td class="text-sm">${esc(c.engagement_name || '-')}</td>
      <td><progress class="progress progress-primary w-32" value="${c.completed_items || 0}" max="${c.total_items || 1}"></progress></td>
      <td class="text-sm text-base-content/60">${pct}%</td>
    </tr>`;
  }).join('');
  const bc = [{ href: '/', label: 'Dashboard' }, { label: 'Checklists' }];
  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Checklists</h1></div>
    <div class="card bg-base-100 shadow-md"><div class="card-body p-0">
      <div class="table-container"><table class="table table-hover">
        <thead><tr><th>Name</th><th>Engagement</th><th>Progress</th><th>%</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="text-center py-8 text-base-content/40">No checklists</td></tr>'}</tbody>
      </table></div>
    </div></div>`;
  return page(user, 'Checklists', bc, content);
}

export function renderChecklistsManagement(user, checklists = []) {
  const rows = checklists.map(c => `<tr>
    <td class="font-medium text-sm">${esc(c.name || 'Untitled')}</td>
    <td class="text-sm">${c.total_items || 0}</td>
    <td>${c.active ? '<span class="badge badge-success badge-flat-success text-xs">Active</span>' : '<span class="badge badge-flat-secondary text-xs">Inactive</span>'}</td>
    <td><div class="flex gap-1">
      <a href="/checklist/${esc(c.id)}" class="btn btn-ghost btn-xs">View</a>
      <button class="btn btn-ghost btn-xs" onclick="ckmToggle('${esc(c.id)}',${c.active ? 'false' : 'true'})">${c.active ? 'Deactivate' : 'Activate'}</button>
      <button class="btn btn-error btn-xs btn-outline" onclick="ckmDel('${esc(c.id)}')">Delete</button>
    </div></td>
  </tr>`).join('');
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'Manage Checklists' }];
  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Manage Checklists</h1></div>
    <div class="card bg-base-100 shadow-md"><div class="card-body p-0">
      <div class="table-container"><table class="table table-hover">
        <thead><tr><th>Name</th><th>Items</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="text-center py-8 text-base-content/40">No checklists</td></tr>'}</tbody>
      </table></div>
    </div></div>`;
  const script = `${TOAST}window.ckmToggle=async function(id,active){await fetch('/api/checklist/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:active})});location.reload()};window.ckmDel=async function(id){if(!confirm('Delete?'))return;await fetch('/api/checklist/'+id,{method:'DELETE'});location.reload()}`;
  return page(user, 'Manage Checklists', bc, content, [script]);
}
