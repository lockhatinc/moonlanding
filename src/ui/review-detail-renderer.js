import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';
import { canEdit, canCreate, isPartner, isManager } from '@/ui/permissions-ui.js';

const TOAST = `window.showToast=(m,t='info')=>{let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.className='toast-container';c.setAttribute('role','status');c.setAttribute('aria-live','polite');document.body.appendChild(c)}const d=document.createElement('div');d.className='toast toast-'+t;d.textContent=m;c.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},3000)};`;

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function statusBadge(status) {
  const s = status || 'open';
  const map = { active:'badge-flat-primary', open:'badge-flat-primary', in_progress:'badge-flat-primary', completed:'badge-success badge-flat-success', closed:'badge-success badge-flat-success', archived:'badge-flat-secondary' };
  const cls = map[s] || 'badge-warning badge-flat-warning';
  return `<span class="badge ${cls} text-xs">${s||'-'}</span>`;
}

function highlightRow(h) {
  const resolved = h.resolved || h.status === 'resolved';
  return `<tr class="hover">
    <td class="text-sm max-w-xs">${esc(h.text||h.content||h.comment||'Highlight')}</td>
    <td class="text-sm text-base-content/50">p.${h.page||h.page_number||'-'}</td>
    <td><span class="badge ${resolved?'badge-success badge-flat-success':'badge-warning badge-flat-warning'} text-xs">${resolved?'Resolved':'Open'}</span></td>
    <td class="text-sm text-base-content/50">${h.created_by_name||h.user_id||'-'}</td>
    <td>${!resolved ? `<button onclick="resolveHighlight('${esc(h.id)}')" class="btn btn-success btn-xs">Resolve</button>` : ''}</td>
  </tr>`;
}

function collaboratorRow(c) {
  return `<tr class="hover">
    <td class="text-sm">${esc(c.user_name||c.email||c.user_id||'-')}</td>
    <td><span class="badge badge-flat-primary text-xs">${esc(c.role||'viewer')}</span></td>
    <td class="text-sm text-base-content/50">${c.expires_at?new Date(typeof c.expires_at==='number'?c.expires_at*1000:c.expires_at).toLocaleDateString():'-'}</td>
    <td><button onclick="removeCollaborator('${esc(c.id)}')" class="btn btn-error btn-xs">Remove</button></td>
  </tr>`;
}

function addCollaboratorDialog(reviewId) {
  return `<div id="collab-dialog" class="modal" style="display:none" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal-overlay" onclick="document.getElementById('collab-dialog').style.display='none'"></div>
    <div class="modal-content rounded-box max-w-sm p-6">
      <h3 class="text-lg font-semibold mb-4">Add Collaborator</h3>
      <div class="form-group mb-3">
        <label class="label"><span class="label-text font-medium">Email</span></label>
        <input type="email" id="collab-email" class="input input-solid max-w-full" placeholder="collaborator@example.com"/>
      </div>
      <div class="form-group mb-4">
        <label class="label"><span class="label-text font-medium">Role</span></label>
        <select id="collab-role" class="select select-solid max-w-full">
          <option value="viewer">Viewer</option>
          <option value="commenter">Commenter</option>
          <option value="editor">Editor</option>
        </select>
      </div>
      <div class="modal-action">
        <button onclick="addCollaborator('${esc(reviewId)}')" class="btn btn-primary">Add</button>
        <button onclick="document.getElementById('collab-dialog').style.display='none'" class="btn btn-ghost">Cancel</button>
      </div>
    </div>
  </div>`;
}

export function renderReviewDetail(user, review, highlights = [], collaborators = [], checklists = [], sections = []) {
  const r = review || {};
  const canEditReview = canEdit(user, 'review');
  const totalH = highlights.length;
  const resolvedH = highlights.filter(h => h.resolved || h.status === 'resolved').length;
  const pct = totalH > 0 ? Math.round((resolvedH / totalH) * 100) : 0;

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'highlights', label: `Highlights (${totalH})` },
    { id: 'collaborators', label: `Collaborators (${collaborators.length})` },
    { id: 'checklists', label: `Checklists (${checklists.length})` },
    { id: 'sections', label: `Sections (${sections.length})` },
  ];

  const tabBar = `<div class="tabs tabs-boxed bg-base-200 mb-4 flex-wrap gap-1">` +
    TABS.map((t, i) => `<button onclick="switchTab('${t.id}')" id="rvtab-${t.id}" class="tab ${i===0?'tab-active':''}">${t.label}</button>`).join('') +
    `</div>`;

  const infoItems = [
    ['Name', esc(r.name||r.title||'-')],
    ['Status', statusBadge(r.status)],
    ['Type', esc(r.type||r.review_type||'-')],
    ['Template', esc(r.template||r.template_name||'-')],
    ['Created', r.created_at?new Date(typeof r.created_at==='number'?r.created_at*1000:r.created_at).toLocaleDateString():'-'],
    ['Highlights', `${resolvedH}/${totalH} resolved`],
  ];

  const overviewPanel = `<div id="rvpanel-overview" class="rv-panel">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <h2 class="card-title text-sm mb-4">Review Details</h2>
          <div class="grid grid-cols-2 gap-3">
            ${infoItems.map(([l,v]) => `<div><div class="text-xs text-base-content/50 font-semibold uppercase tracking-wider mb-1">${l}</div><div class="text-sm text-base-content">${v}</div></div>`).join('')}
          </div>
          <div class="mt-4">
            <div class="flex justify-between mb-1"><span class="text-sm font-semibold text-base-content/60">Resolution Progress</span><span class="text-sm text-base-content/50">${pct}%</span></div>
            <progress class="progress progress-success w-full" value="${pct}" max="100"></progress>
          </div>
        </div>
      </div>
      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <h2 class="card-title text-sm mb-4">Quick Actions</h2>
          <div class="flex flex-col gap-2">
            <a href="/review/${esc(r.id)}/pdf" class="btn btn-ghost btn-sm justify-start">&#128196; View PDF &amp; Highlights</a>
            <a href="/review/${esc(r.id)}/highlights" class="btn btn-ghost btn-sm justify-start">&#128172; Highlight Threads</a>
            <a href="/review/${esc(r.id)}/sections" class="btn btn-ghost btn-sm justify-start">&#128203; Section Report</a>
            <button onclick="exportPdf('${esc(r.id)}')" class="btn btn-ghost btn-sm justify-start">&#128229; Export PDF</button>
            ${resolvedH < totalH && canEditReview ? `<button onclick="bulkResolve('${esc(r.id)}')" class="btn btn-success btn-sm justify-start">&#10003; Bulk Resolve All</button>` : ''}
          </div>
        </div>
      </div>
    </div>
  </div>`;

  const hRows = highlights.map(h => highlightRow(h)).join('') ||
    `<tr><td colspan="5" class="text-center py-8 text-base-content/40 text-sm">No highlights yet</td></tr>`;
  const highlightsPanel = `<div id="rvpanel-highlights" class="rv-panel" style="display:none">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-sm">Highlights (${totalH})</h2>
          <div class="flex gap-3 items-center">
            <span class="text-sm text-base-content/50">${resolvedH} resolved, ${totalH-resolvedH} open</span>
            <a href="/review/${esc(r.id)}/pdf" class="btn btn-primary btn-sm">Open PDF</a>
          </div>
        </div>
        <div class="table-container">
          <table class="table table-hover"><thead><tr><th>Highlight</th><th>Page</th><th>Status</th><th>By</th><th>Actions</th></tr></thead><tbody>${hRows}</tbody></table>
        </div>
      </div>
    </div>
  </div>`;

  const collabRows = collaborators.map(c => collaboratorRow(c)).join('') ||
    `<tr><td colspan="4" class="text-center py-8 text-base-content/40 text-sm">No collaborators</td></tr>`;
  const collabPanel = `<div id="rvpanel-collaborators" class="rv-panel" style="display:none">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-sm">Collaborators</h2>
          ${canEditReview ? `<button onclick="document.getElementById('collab-dialog').style.display='flex'" class="btn btn-primary btn-sm">+ Add</button>` : ''}
        </div>
        <div class="table-container">
          <table class="table table-hover"><thead><tr><th>User</th><th>Role</th><th>Expires</th><th>Actions</th></tr></thead><tbody>${collabRows}</tbody></table>
        </div>
      </div>
    </div>
  </div>`;

  const clRows = checklists.map(cl => `<tr class="hover">
    <td class="text-sm">${esc(cl.name||'-')}</td>
    <td class="text-sm text-base-content/50">${cl.total_items||0} items</td>
    <td>
      <div class="flex items-center gap-2">
        <progress class="progress progress-primary w-16" value="${cl.total_items>0?Math.round((cl.completed_items||0)/cl.total_items*100):0}" max="100"></progress>
        <span class="text-xs text-base-content/50">${cl.completed_items||0}/${cl.total_items||0}</span>
      </div>
    </td>
    <td><a href="/checklist/${esc(cl.id)}" class="btn btn-ghost btn-xs">View</a></td>
  </tr>`).join('') || `<tr><td colspan="4" class="text-center py-8 text-base-content/40 text-sm">No checklists attached</td></tr>`;

  const checklistPanel = `<div id="rvpanel-checklists" class="rv-panel" style="display:none">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <h2 class="card-title text-sm mb-4">Checklists</h2>
        <div class="table-container">
          <table class="table table-hover"><thead><tr><th>Name</th><th>Items</th><th>Progress</th><th></th></tr></thead><tbody>${clRows}</tbody></table>
        </div>
      </div>
    </div>
  </div>`;

  const secRows = sections.map(s => `<tr class="hover">
    <td class="text-sm">${esc(s.name||s.title||'-')}</td>
    <td class="text-sm text-base-content/50">${s.highlight_count||0}</td>
    <td class="text-sm text-base-content/50">${s.resolved_count||0}</td>
  </tr>`).join('') || `<tr><td colspan="3" class="text-center py-8 text-base-content/40 text-sm">No sections</td></tr>`;

  const sectionsPanel = `<div id="rvpanel-sections" class="rv-panel" style="display:none">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-sm">Sections</h2>
          <a href="/review/${esc(r.id)}/sections" class="btn btn-ghost btn-sm">Full Report &#8594;</a>
        </div>
        <div class="table-container">
          <table class="table table-hover"><thead><tr><th>Section</th><th>Highlights</th><th>Resolved</th></tr></thead><tbody>${secRows}</tbody></table>
        </div>
      </div>
    </div>
  </div>`;

  const content = `
    <nav class="breadcrumbs text-sm mb-4">
      <ul><li><a href="/">Home</a></li><li><a href="/review">Reviews</a></li><li>${esc(r.name||'Review')}</li></ul>
    </nav>
    <div class="flex justify-between items-start mb-4 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-base-content mb-1">${esc(r.name||r.title||'Review')}</h1>
        ${statusBadge(r.status)}
      </div>
      <div class="flex gap-2">
        ${canEditReview ? `<a href="/review/${esc(r.id)}/edit" class="btn btn-ghost btn-sm">Edit</a>` : ''}
        <a href="/review/${esc(r.id)}/pdf" class="btn btn-primary btn-sm">View PDF</a>
      </div>
    </div>
    ${tabBar}
    ${overviewPanel}
    ${highlightsPanel}
    ${collabPanel}
    ${checklistPanel}
    ${sectionsPanel}
    ${addCollaboratorDialog(r.id)}
  `;

  const script = `${TOAST}
function switchTab(tab){
  document.querySelectorAll('.rv-panel').forEach(function(p){p.style.display='none'});
  var panel=document.getElementById('rvpanel-'+tab);if(panel)panel.style.display='';
  document.querySelectorAll('[id^="rvtab-"]').forEach(function(b){b.classList.remove('tab-active')});
  var btn=document.getElementById('rvtab-'+tab);if(btn)btn.classList.add('tab-active');
}
async function resolveHighlight(id){if(!confirm('Mark this highlight as resolved?'))return;try{var r=await fetch('/api/mwr/review/${esc(r.id)}/highlights/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({resolved:true,status:'resolved'})});if(r.ok){showToast('Resolved','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}
async function bulkResolve(reviewId){if(!confirm('Resolve all highlights?'))return;try{var r=await fetch('/api/mwr/review/'+reviewId+'/highlights/bulk-resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resolve_all:true})});if(r.ok){showToast('All resolved','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}
async function exportPdf(reviewId){showToast('Generating PDF...','info');try{var r=await fetch('/api/mwr/review/'+reviewId+'/export-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});if(r.ok){var b=await r.blob();var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='review-'+reviewId+'.pdf';a.click();showToast('PDF downloaded','success')}else showToast('Export failed','error')}catch(e){showToast('Error','error')}}
async function addCollaborator(reviewId){var email=document.getElementById('collab-email').value.trim();var role=document.getElementById('collab-role').value;if(!email){showToast('Email required','error');return}try{var r=await fetch('/api/mwr/review/'+reviewId+'/collaborators',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,role:role})});if(r.ok){showToast('Collaborator added','success');document.getElementById('collab-dialog').style.display='none';setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}
async function removeCollaborator(collabId){if(!confirm('Remove this collaborator?'))return;try{var r=await fetch('/api/mwr/review/${esc(r.id)}/collaborators/'+collabId,{method:'DELETE'});if(r.ok){showToast('Removed','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}`;

  const body = `<div class="min-h-screen bg-base-200">${nav(user)}<main class="p-4 md:p-6" id="main-content">${content}</main></div>`;
  return generateHtml(`${esc(r.name||'Review')} | MY FRIDAY`, body, [script]);
}
