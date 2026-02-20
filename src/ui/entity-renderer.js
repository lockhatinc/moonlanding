import { h } from '@/ui/webjsx.js'
import { page, confirmDialog, dataTable } from '@/ui/layout.js'
import { fmtVal, TOAST_SCRIPT } from '@/ui/render-helpers.js'
import { canCreate, canEdit, canDelete } from '@/ui/permissions-ui.js'

export function renderEntityList(entityName, items, spec, user, options = {}) {
  const label = spec?.labelPlural || spec?.label || entityName
  const fields = spec?.fields || {}
  const { groupBy = null } = options
  let listFields = Object.entries(fields).filter(([k, f]) => f.list).slice(0, 5)
  if (!listFields.length) listFields = Object.entries(fields).filter(([k]) => !['created_by', 'updated_by'].includes(k)).slice(0, 6)
  if (!listFields.length && items.length > 0) listFields = Object.keys(items[0]).filter(k => !['created_by', 'updated_by'].includes(k)).slice(0, 5).map(k => [k, { label: k }])
  const headers = listFields.map(([k, f]) => `<th>${f?.label || k}</th>`).join('') + '<th>Actions</th>'
  const userCanEdit = canEdit(user, entityName)
  const userCanDelete = canDelete(user, entityName)
  const userCanCreate = canCreate(user, entityName)

  const buildRow = item => {
    const cells = listFields.map(([k]) => `<td>${fmtVal(item[k], k, item)}</td>`).join('')
    const editBtn = userCanEdit ? `<a href="/${entityName}/${item.id}/edit" class="btn btn-xs btn-outline">Edit</a>` : `<span class="btn btn-xs btn-outline btn-disabled tooltip" data-tip="No permission">Edit</span>`
    const delBtn = userCanDelete ? `<button onclick="event.stopPropagation();confirmDelete('${item.id}')" class="btn btn-xs btn-error btn-outline">Delete</button>` : `<span class="btn btn-xs btn-error btn-outline btn-disabled tooltip" data-tip="No permission">Delete</span>`
    return `<tr class="hover cursor-pointer" data-searchable tabindex="0" role="link" onclick="window.location='/${entityName}/${item.id}'" onkeydown="if(event.key==='Enter'){window.location='/${entityName}/${item.id}'}">${cells}<td class="flex gap-1"><a href="/${entityName}/${item.id}" class="btn btn-xs btn-ghost">View</a>${editBtn}${delBtn}</td></tr>`
  }

  let tableContent
  if (groupBy && items.length > 0) {
    const groups = {}
    items.forEach(item => { const key = String(item[groupBy] || '(No ' + groupBy + ')'); if (!groups[key]) groups[key] = []; groups[key].push(item) })
    const sortedKeys = Object.keys(groups).sort()
    const groupRows = sortedKeys.map(gkey => {
      const groupItems = groups[gkey]
      const groupId = `group-${gkey.replace(/\s+/g, '-').toLowerCase()}`
      const togglerId = `toggle-${gkey.replace(/\s+/g, '-').toLowerCase()}`
      const itemRows = groupItems.map(buildRow).join('')
      return `<tbody class="group-section" data-group="${gkey}"><tr class="group-header hover cursor-pointer" tabindex="0" onclick="document.getElementById('${togglerId}').checked=!document.getElementById('${togglerId}').checked"><td colspan="100" style="padding:12px"><div class="flex items-center gap-2"><input type="checkbox" id="${togglerId}" class="group-toggle" style="cursor:pointer" checked/><span class="font-semibold text-base">${gkey}</span><span class="badge badge-sm">${groupItems.length}</span></div></td></tr><tr class="group-content" id="${groupId}" style="display:contents"><td colspan="100"><table class="table table-sm w-full" style="background:transparent"><tbody>${itemRows}</tbody></table></td></tr></tbody>`
    }).join('')
    tableContent = `<div class="card bg-white shadow" style="overflow-x:auto"><table class="table w-full"><thead><tr>${headers}</tr></thead>${groupRows}</table></div>`
  } else {
    const rows = items.map(buildRow).join('')
    tableContent = dataTable(headers, rows, items.length === 0 ? (userCanCreate ? `No items found. <a href="/${entityName}/new" class="text-primary hover:underline">Create your first ${label.toLowerCase()}</a>` : 'No items found.') : '')
  }

  const createBtn = userCanCreate ? `<a href="/${entityName}/new" class="btn btn-primary btn-sm">Create New</a>` : ''
  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">${label}</h1><div class="flex gap-2"><input type="text" id="search-input" placeholder="Search..." class="input input-bordered input-sm" style="width:200px"/>${createBtn}</div></div>${tableContent}${userCanDelete ? confirmDialog(entityName) : ''}`

  const deleteScript = `let pendingDeleteId=null;window.confirmDelete=(id)=>{pendingDeleteId=id;document.getElementById('confirm-dialog').style.display='flex'};window.cancelDelete=()=>{pendingDeleteId=null;document.getElementById('confirm-dialog').style.display='none'};window.executeDelete=async()=>{if(!pendingDeleteId)return;const btn=document.getElementById('confirm-delete-btn');btn.classList.add('btn-loading');btn.textContent='Deleting...';try{const res=await fetch('/api/${entityName}/'+pendingDeleteId,{method:'DELETE'});if(res.ok){showToast('Deleted successfully','success');setTimeout(()=>window.location.reload(),500)}else{const d=await res.json().catch(()=>({}));showToast(d.message||d.error||'Delete failed','error');cancelDelete();btn.classList.remove('btn-loading');btn.textContent='Delete'}}catch(err){showToast('Error: '+err.message,'error');cancelDelete();btn.classList.remove('btn-loading');btn.textContent='Delete'}}`
  const searchScript = `function initSearch(){const si=document.getElementById('search-input');const tb=document.querySelectorAll('[data-searchable]');const groups=document.querySelectorAll('[data-group]');let visibleGroupCount=0;si.addEventListener('input',(e)=>{const query=e.target.value.toLowerCase().trim();const terms=query.length>0?query.split(/\\s+/):[],hasResults=terms.length>0;visibleGroupCount=0;groups.forEach(g=>{const rows=g.querySelectorAll('[data-searchable]');let visibleRows=0;rows.forEach(r=>{const text=r.textContent.toLowerCase();const matches=terms.every(t=>text.includes(t));r.style.display=matches?'':'none';if(matches)visibleRows++});const groupVisible=visibleRows>0;g.style.display=groupVisible?'':'none';if(groupVisible)visibleGroupCount++;const badge=g.querySelector('.badge');if(badge)badge.textContent=visibleRows});tb.forEach(r=>{if(!r.closest('[data-group]')){const text=r.textContent.toLowerCase();const matches=query.length===0||terms.every(t=>text.includes(t));r.style.display=matches?'':'none'}});const totalVisible=document.querySelectorAll('[data-searchable]:not([style*="display: none"])').length,noResults=hasResults&&totalVisible===0;let msg=document.getElementById('search-no-results');if(noResults&&!msg){msg=document.createElement('tr');msg.id='search-no-results';msg.innerHTML='<td colspan="100" class="text-center py-8 text-gray-500">No results found for "'+query+'"</td>';const tbody=document.getElementById('table-body')||document.querySelector('tbody');if(tbody)tbody.appendChild(msg)}else if(!noResults&&msg)msg.remove()});const toggles=document.querySelectorAll('.group-toggle');toggles.forEach(tog=>{tog.addEventListener('change',(e)=>{e.stopPropagation();const row=tog.closest('tr');const tbody=row.parentElement;const content=tbody.querySelector('.group-content');content.style.display=tog.checked?'contents':'none'})});if(si.value)si.dispatchEvent(new Event('input'))}document.addEventListener('DOMContentLoaded',initSearch)`
  return page(user, label, [{ href: '/', label: 'Dashboard' }, { href: `/${entityName}`, label }], content, [TOAST_SCRIPT, deleteScript, searchScript])
}

export function renderEntityDetail(entityName, item, spec, user) {
  const label = spec?.label || entityName
  const fields = spec?.fields || {}
  const userCanEdit = canEdit(user, entityName)
  const userCanDelete = canDelete(user, entityName)
  const fieldRows = Object.entries(fields).filter(([k]) => k !== 'id' && item[k] !== undefined).map(([k, f]) =>
    `<div class="py-2 border-b"><span class="text-gray-500 text-sm">${f.label || k}</span><p class="font-medium">${fmtVal(item[k], k, item)}</p></div>`
  ).join('')
  const editBtn = userCanEdit ? `<a href="/${entityName}/${item.id}/edit" class="btn btn-outline">Edit</a>` : `<span class="btn btn-outline btn-disabled tooltip" data-tip="No permission">Edit</span>`
  const delBtn = userCanDelete ? `<button onclick="showDeleteConfirm()" class="btn btn-error btn-outline">Delete</button>` : `<span class="btn btn-error btn-outline btn-disabled tooltip" data-tip="No permission">Delete</span>`
  const content = `<div class="flex justify-between items-center mb-6"><div><h1 class="text-2xl font-bold">${item.name || item.title || label}</h1><p class="text-gray-500 text-sm">ID: ${item.id}</p></div><div class="flex gap-2">${editBtn}${delBtn}</div></div>
    <div class="card bg-white shadow"><div class="card-body">${fieldRows}</div></div>${userCanDelete ? confirmDialog(entityName) : ''}`
  const script = `${TOAST_SCRIPT}window.showDeleteConfirm=()=>{document.getElementById('confirm-dialog').style.display='flex'};window.hideDeleteConfirm=()=>{document.getElementById('confirm-dialog').style.display='none'};window.executeDelete=async()=>{const btn=document.getElementById('confirm-delete-btn');btn.classList.add('btn-loading');btn.textContent='Deleting...';try{const res=await fetch('/api/${entityName}/${item.id}',{method:'DELETE'});if(res.ok){showToast('Deleted successfully','success');setTimeout(()=>{window.location='/${entityName}'},500)}else{const d=await res.json().catch(()=>({}));showToast(d.message||d.error||'Delete failed','error');hideDeleteConfirm();btn.classList.remove('btn-loading');btn.textContent='Delete'}}catch(err){showToast('Error: '+err.message,'error');hideDeleteConfirm();btn.classList.remove('btn-loading');btn.textContent='Delete'}}`
  const bc = [{ href: '/', label: 'Dashboard' }, { href: `/${entityName}`, label: spec?.labelPlural || label }, { href: `/${entityName}/${item.id}`, label: item.name || item.title || `#${item.id}` }]
  return page(user, `${label} Detail`, bc, content, [script])
}

export function renderEntityForm(entityName, item, spec, user, isNew = false, refOptions = {}) {
  const label = spec?.label || entityName
  const fields = spec?.fields || {}
  const formFields = Object.entries(fields).filter(([k, f]) => k !== 'id' && !f.auto && !f.readOnly && k !== 'password_hash').map(([k, f]) => {
    const val = item?.[k] ?? f.default ?? ''
    const req = f.required ? 'required' : ''
    const reqM = f.required ? '<span class="required-marker">*</span>' : ''
    const type = f.type === 'number' || f.type === 'int' ? 'number' : f.type === 'email' ? 'email' : f.type === 'timestamp' || f.type === 'date' ? 'date' : f.type === 'bool' ? 'checkbox' : 'text'
    if (entityName === 'user' && k === 'role') {
      const opts = ['partner','manager','clerk','client_admin','client_user'].map(o => `<option value="${o}" ${val===o?'selected':''}>${o.charAt(0).toUpperCase()+o.slice(1).replace('_',' ')}</option>`).join('')
      return `<div class="form-group"><label class="form-label">Role${reqM}</label><select name="role" class="select select-bordered w-full" ${req}>${opts}</select></div>`
    }
    if (entityName === 'user' && k === 'status') {
      const opts = ['active','inactive','pending'].map(o => `<option value="${o}" ${val===o?'selected':''}>${o.charAt(0).toUpperCase()+o.slice(1)}</option>`).join('')
      return `<div class="form-group"><label class="form-label">Status</label><select name="status" class="select select-bordered w-full">${opts}</select></div>`
    }
    if (f.type === 'ref' && refOptions[k]) {
      const opts = refOptions[k].map(o => `<option value="${o.value}" ${val===o.value?'selected':''}>${o.label}</option>`).join('')
      return `<div class="form-group"><label class="form-label">${f.label||k}${reqM}</label><select name="${k}" class="select select-bordered w-full" ${req}><option value="">Select...</option>${opts}</select></div>`
    }
    if (f.type === 'textarea') return `<div class="form-group"><label class="form-label">${f.label||k}${reqM}</label><textarea name="${k}" class="textarea textarea-bordered w-full" ${req}>${val}</textarea></div>`
    if (f.type === 'bool') return `<div class="form-group"><label class="flex items-center gap-2"><input type="checkbox" name="${k}" class="checkbox" ${val?'checked':''}/><span>${f.label||k}</span></label></div>`
    if (f.type === 'enum' && f.options) {
      const opts = (Array.isArray(f.options) ? f.options : []).map(o => { const ov = typeof o === 'string' ? o : o.value; const ol = typeof o === 'string' ? o : o.label; return `<option value="${ov}" ${val===ov?'selected':''}>${ol}</option>` }).join('')
      return `<div class="form-group"><label class="form-label">${f.label||k}${reqM}</label><select name="${k}" class="select select-bordered w-full" ${req}><option value="">Select...</option>${opts}</select></div>`
    }
    return `<div class="form-group"><label class="form-label">${f.label||k}${reqM}</label><input type="${type}" name="${k}" value="${val}" class="input input-bordered w-full" ${req}/></div>`
  }).join('\n')

  const pwField = entityName === 'user' ? `<div class="form-group"><label class="form-label">New Password <small class="text-gray-500">(leave blank to keep unchanged)</small></label><input type="password" name="new_password" class="input input-bordered w-full" placeholder="Enter new password" autocomplete="new-password"/></div>` : ''
  const bc = isNew
    ? [{ href: '/', label: 'Dashboard' }, { href: `/${entityName}`, label: spec?.labelPlural || label }, { label: 'Create' }]
    : [{ href: '/', label: 'Dashboard' }, { href: `/${entityName}`, label: spec?.labelPlural || label }, { href: `/${entityName}/${item?.id}`, label: item?.name || item?.title || `#${item?.id}` }, { label: 'Edit' }]
  const content = `<div class="mb-6"><h1 class="text-2xl font-bold">${isNew ? 'Create' : 'Edit'} ${label}</h1></div>
    <div class="card bg-white shadow max-w-2xl"><div class="card-body"><form id="entity-form" class="space-y-4">${formFields}${pwField}
    <div class="flex gap-2 pt-4"><button type="submit" id="submit-btn" class="btn btn-primary"><span class="btn-text">Save</span><span class="btn-loading-text" style="display:none">Saving...</span></button>
    <a href="/${entityName}${isNew ? '' : '/' + item?.id}" class="btn btn-ghost">Cancel</a></div></form></div></div>`
  const script = `${TOAST_SCRIPT}const form=document.getElementById('entity-form');const sb=document.getElementById('submit-btn');form.addEventListener('submit',async(e)=>{e.preventDefault();sb.classList.add('btn-loading');sb.querySelector('.btn-text').style.display='none';sb.querySelector('.btn-loading-text').style.display='inline';sb.disabled=true;const fd=new FormData(form);const data={};for(const[k,v]of fd.entries())data[k]=v;form.querySelectorAll('input[type=checkbox]').forEach(cb=>{data[cb.name]=cb.checked});form.querySelectorAll('input[type=number]').forEach(inp=>{if(inp.name&&data[inp.name]!==undefined&&data[inp.name]!=='')data[inp.name]=Number(data[inp.name])});const url=${isNew}?'/api/${entityName}':'/api/${entityName}/${item?.id}';const method=${isNew}?'POST':'PUT';try{const res=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await res.json();if(res.ok){showToast('${isNew?'Created':'Updated'} successfully!','success');const ed=result.data||result;setTimeout(()=>{window.location='/${entityName}/'+(ed.id||'${item?.id}')},500)}else{showToast(result.message||result.error||'Save failed','error');sb.classList.remove('btn-loading');sb.querySelector('.btn-text').style.display='inline';sb.querySelector('.btn-loading-text').style.display='none';sb.disabled=false}}catch(err){showToast('Error: '+err.message,'error');sb.classList.remove('btn-loading');sb.querySelector('.btn-text').style.display='inline';sb.querySelector('.btn-loading-text').style.display='none';sb.disabled=false}})`
  return page(user, `${isNew ? 'Create' : 'Edit'} ${label}`, bc, content, [script])
}

export function renderSettings(user, config = {}) {
  const t = config.thresholds || {}
  const sections = [
    { title: 'System Information', items: [['Database Type', config.database?.type || 'SQLite'], ['Server Port', config.server?.port || 3004], ['Session TTL', (t.cache?.session_ttl_seconds || 3600) + 's'], ['Page Size (Default)', t.system?.default_page_size || 50], ['Page Size (Max)', t.system?.max_page_size || 500]] },
    { title: 'RFI Configuration', items: [['Max Days Outstanding', (t.rfi?.max_days_outstanding || 90) + ' days'], ['Escalation Delay', (t.rfi?.escalation_delay_hours || 24) + ' hours'], ['Notification Days', (t.rfi?.notification_days || [7,3,1,0]).join(', ')]] },
    { title: 'Email Configuration', items: [['Batch Size', t.email?.send_batch_size || 10], ['Max Retries', t.email?.send_max_retries || 3], ['Rate Limit Delay', (t.email?.rate_limit_delay_ms || 6000) + 'ms']] },
    { title: 'Workflow Configuration', items: [['Stage Transition Lockout', (t.workflow?.stage_transition_lockout_minutes || 5) + ' minutes'], ['Collaborator Default Expiry', (t.collaborator?.default_expiry_days || 7) + ' days'], ['Collaborator Max Expiry', (t.collaborator?.max_expiry_days || 30) + ' days']] },
  ]
  const cards = sections.map(s => `<div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">${s.title}</h2><div class="space-y-4 mt-4">${s.items.map(([l, v]) => `<div class="flex justify-between py-2 border-b"><span class="text-gray-500">${l}</span><span class="font-medium">${v}</span></div>`).join('')}</div></div></div>`).join('')
  return page(user, 'System Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }],
    `<h1 class="text-2xl font-bold mb-6">System Settings</h1><div class="grid grid-cols-1 lg:grid-cols-2 gap-6">${cards}</div>`)
}
