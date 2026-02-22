import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';
import { canEdit, canCreate, isPartner, isManager } from '@/ui/permissions-ui.js';

const TOAST = `window.showToast=(m,t='info')=>{let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.style.cssText='position:fixed;bottom:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem';document.body.appendChild(c)}const d=document.createElement('div');d.style.cssText='padding:10px 16px;border-radius:6px;font-size:0.82rem;font-weight:500;color:#fff;background:'+(t==='error'?'#c62828':t==='success'?'#2e7d32':'#1565c0');d.textContent=m;c.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},3000)};`;

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function statusBadge(status) {
  const map = { active: ['#2e7d32','#e8f5e9'], open: ['#2e7d32','#e8f5e9'], closed: ['#555','#f5f5f5'], archived: ['#6d4c41','#efebe9'], pending: ['#e65100','#fff3e0'] };
  const [color, bg] = map[status] || ['#555','#f5f5f5'];
  return `<span style="background:${bg};color:${color};padding:3px 10px;border-radius:10px;font-size:0.75rem;font-weight:700;border:1px solid ${color}44">${status||'-'}</span>`;
}

function highlightRow(h) {
  const resolved = h.resolved || h.status === 'resolved';
  return `<tr style="border-bottom:1px solid #f0f0f0" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
    <td style="padding:10px 12px;font-size:0.82rem;max-width:300px">${esc(h.text||h.content||h.comment||'Highlight')}</td>
    <td style="padding:10px 12px;font-size:0.8rem;color:#888">p.${h.page||h.page_number||'-'}</td>
    <td style="padding:10px 12px"><span style="background:${resolved?'#e8f5e9':'#fff3e0'};color:${resolved?'#2e7d32':'#e65100'};padding:2px 7px;border-radius:6px;font-size:0.7rem;font-weight:700">${resolved?'Resolved':'Open'}</span></td>
    <td style="padding:10px 12px;font-size:0.78rem;color:#888">${h.created_by_name||h.user_id||'-'}</td>
    <td style="padding:10px 12px">
      ${!resolved ? `<button onclick="resolveHighlight('${esc(h.id)}')" style="background:#e8f5e9;border:1px solid #a5d6a7;color:#2e7d32;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem">Resolve</button>` : ''}
    </td>
  </tr>`;
}

function collaboratorRow(c) {
  return `<tr style="border-bottom:1px solid #f0f0f0">
    <td style="padding:10px 12px;font-size:0.82rem">${esc(c.user_name||c.email||c.user_id||'-')}</td>
    <td style="padding:10px 12px"><span style="background:#e3f2fd;color:#1565c0;padding:2px 7px;border-radius:4px;font-size:0.72rem;font-weight:600">${esc(c.role||'viewer')}</span></td>
    <td style="padding:10px 12px;font-size:0.78rem;color:#888">${c.expires_at?new Date(typeof c.expires_at==='number'?c.expires_at*1000:c.expires_at).toLocaleDateString():'-'}</td>
    <td style="padding:10px 12px"><button onclick="removeCollaborator('${esc(c.id)}')" style="background:#fff0f0;border:1px solid #fca5a5;color:#c62828;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem">Remove</button></td>
  </tr>`;
}

function addCollaboratorDialog(reviewId) {
  return `<div id="collab-dialog" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center" onclick="if(event.target===this)this.style.display='none'">
    <div style="background:#fff;border-radius:8px;padding:24px;max-width:400px;width:90%">
      <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">Add Collaborator</h3>
      <div style="margin-bottom:12px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Email</label><input type="email" id="collab-email" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;box-sizing:border-box"/></div>
      <div style="margin-bottom:16px"><label style="font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:4px">Role</label><select id="collab-role" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem"><option value="viewer">Viewer</option><option value="commenter">Commenter</option><option value="editor">Editor</option></select></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="document.getElementById('collab-dialog').style.display='none'" style="padding:7px 16px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:0.85rem">Cancel</button>
        <button onclick="addCollaborator('${esc(reviewId)}')" style="padding:7px 16px;background:#1976d2;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600">Add</button>
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

  const tabBar = `<div style="display:flex;gap:0;border-bottom:2px solid #e0e0e0;margin-bottom:16px;background:#fff;border-radius:8px 8px 0 0;padding:0 16px;box-shadow:0 1px 4px rgba(0,0,0,0.08)">` +
    TABS.map((t, i) => `<button onclick="switchTab('${t.id}')" id="rvtab-${t.id}" style="padding:12px 16px;font-size:0.82rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:${i===0?'2px solid #1976d2;color:#1976d2':'2px solid transparent;color:#666'};margin-bottom:-2px;white-space:nowrap">${t.label}</button>`).join('') +
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
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0 0 16px">Review Details</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 24px">
          ${infoItems.map(([l,v]) => `<div><div style="font-size:0.72rem;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">${l}</div><div style="font-size:0.88rem;color:#222">${v}</div></div>`).join('')}
        </div>
        <div style="margin-top:20px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:0.78rem;font-weight:600;color:#555">Resolution Progress</span><span style="font-size:0.78rem;color:#888">${pct}%</span></div>
          <div style="background:#e0e0e0;border-radius:6px;height:8px"><div style="width:${pct}%;background:#2e7d32;height:8px;border-radius:6px"></div></div>
        </div>
      </div>
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0 0 16px">Quick Actions</h2>
        <div style="display:flex;flex-direction:column;gap:10px">
          <a href="/review/${esc(r.id)}/pdf" style="display:block;padding:10px 14px;background:#e3f2fd;color:#1565c0;border-radius:6px;text-decoration:none;font-size:0.85rem;font-weight:600">&#128196; View PDF &amp; Highlights</a>
          <a href="/review/${esc(r.id)}/highlights" style="display:block;padding:10px 14px;background:#f3e5f5;color:#6a1b9a;border-radius:6px;text-decoration:none;font-size:0.85rem;font-weight:600">&#128172; Highlight Threads</a>
          <a href="/review/${esc(r.id)}/sections" style="display:block;padding:10px 14px;background:#e8f5e9;color:#2e7d32;border-radius:6px;text-decoration:none;font-size:0.85rem;font-weight:600">&#128203; Section Report</a>
          <button onclick="exportPdf('${esc(r.id)}')" style="padding:10px 14px;background:#fff3e0;color:#e65100;border:none;border-radius:6px;font-size:0.85rem;font-weight:600;cursor:pointer;text-align:left">&#128229; Export PDF</button>
          ${resolvedH < totalH && canEditReview ? `<button onclick="bulkResolve('${esc(r.id)}')" style="padding:10px 14px;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;border-radius:6px;font-size:0.85rem;font-weight:600;cursor:pointer;text-align:left">&#10003; Bulk Resolve All</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;

  const hRows = highlights.map(h => highlightRow(h)).join('') ||
    `<tr><td colspan="5" style="padding:32px;text-align:center;color:#aaa;font-size:0.85rem">No highlights yet</td></tr>`;
  const highlightsPanel = `<div id="rvpanel-highlights" class="rv-panel" style="display:none">
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0">Highlights (${totalH})</h2>
        <div style="display:flex;gap:8px">
          <span style="font-size:0.82rem;color:#888">${resolvedH} resolved, ${totalH-resolvedH} open</span>
          <a href="/review/${esc(r.id)}/pdf" style="background:#1976d2;color:#fff;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">Open PDF</a>
        </div>
      </div>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0">
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">HIGHLIGHT</th>
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">PAGE</th>
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">STATUS</th>
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">BY</th>
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">ACTIONS</th>
        </tr></thead>
        <tbody>${hRows}</tbody>
      </table></div>
    </div>
  </div>`;

  const collabRows = collaborators.map(c => collaboratorRow(c)).join('') ||
    `<tr><td colspan="4" style="padding:32px;text-align:center;color:#aaa;font-size:0.85rem">No collaborators</td></tr>`;
  const collabPanel = `<div id="rvpanel-collaborators" class="rv-panel" style="display:none">
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0">Collaborators</h2>
        ${canEditReview ? `<button onclick="document.getElementById('collab-dialog').style.display='flex'" style="background:#1976d2;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:0.82rem;font-weight:600">+ Add</button>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0">
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">USER</th>
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">ROLE</th>
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">EXPIRES</th>
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">ACTIONS</th>
        </tr></thead>
        <tbody>${collabRows}</tbody>
      </table>
    </div>
  </div>`;

  const clRows = checklists.map(cl => `<tr style="border-bottom:1px solid #f0f0f0" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
    <td style="padding:10px 12px;font-size:0.82rem">${esc(cl.name||'-')}</td>
    <td style="padding:10px 12px;font-size:0.82rem;color:#888">${cl.total_items||0} items</td>
    <td style="padding:10px 12px;font-size:0.82rem">${cl.completed_items||0} / ${cl.total_items||0}</td>
    <td style="padding:10px 12px"><a href="/checklist/${esc(cl.id)}" style="color:#1976d2;font-size:0.82rem;text-decoration:none">View</a></td>
  </tr>`).join('') || `<tr><td colspan="4" style="padding:32px;text-align:center;color:#aaa;font-size:0.85rem">No checklists attached</td></tr>`;

  const checklistPanel = `<div id="rvpanel-checklists" class="rv-panel" style="display:none">
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
      <h2 style="font-size:0.95rem;font-weight:700;margin:0 0 16px">Checklists</h2>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0">
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">NAME</th>
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">ITEMS</th>
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">PROGRESS</th>
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600"></th>
        </tr></thead>
        <tbody>${clRows}</tbody>
      </table>
    </div>
  </div>`;

  const secRows = sections.map(s => `<tr style="border-bottom:1px solid #f0f0f0">
    <td style="padding:10px 12px;font-size:0.82rem">${esc(s.name||s.title||'-')}</td>
    <td style="padding:10px 12px;font-size:0.82rem;color:#888">${s.highlight_count||0}</td>
    <td style="padding:10px 12px;font-size:0.82rem;color:#888">${s.resolved_count||0}</td>
  </tr>`).join('') || `<tr><td colspan="3" style="padding:32px;text-align:center;color:#aaa;font-size:0.85rem">No sections</td></tr>`;

  const sectionsPanel = `<div id="rvpanel-sections" class="rv-panel" style="display:none">
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0">Sections</h2>
        <a href="/review/${esc(r.id)}/sections" style="color:#1976d2;font-size:0.82rem;text-decoration:none;font-weight:600">Full Report &#8594;</a>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0">
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">SECTION</th>
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">HIGHLIGHTS</th>
          <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600">RESOLVED</th>
        </tr></thead>
        <tbody>${secRows}</tbody>
      </table>
    </div>
  </div>`;

  const actionBtns = `<div style="display:flex;gap:8px">
    ${canEditReview ? `<a href="/review/${esc(r.id)}/edit" style="background:#f5f5f5;border:1px solid #ddd;color:#333;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">Edit</a>` : ''}
    <a href="/review/${esc(r.id)}/pdf" style="background:#1976d2;color:#fff;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">View PDF</a>
  </div>`;

  const content = `
    <div style="margin-bottom:16px"><a href="/reviews" style="color:#1976d2;text-decoration:none;font-size:0.85rem;font-weight:500">&#8592; Reviews</a></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:1.4rem;font-weight:700;margin:0 0 6px">${esc(r.name||r.title||'Review')}</h1>
        ${statusBadge(r.status)}
      </div>
      ${actionBtns}
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
  document.querySelectorAll('[id^="rvtab-"]').forEach(function(b){b.style.borderBottomColor='transparent';b.style.color='#666'});
  var btn=document.getElementById('rvtab-'+tab);if(btn){btn.style.borderBottomColor='#1976d2';btn.style.color='#1976d2'}
}
async function resolveHighlight(id){if(!confirm('Mark this highlight as resolved?'))return;try{var r=await fetch('/api/mwr/review/${esc(r.id)}/highlights/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({resolved:true,status:'resolved'})});if(r.ok){showToast('Resolved','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}
async function bulkResolve(reviewId){if(!confirm('Resolve all highlights?'))return;try{var r=await fetch('/api/mwr/review/'+reviewId+'/highlights/bulk-resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resolve_all:true})});if(r.ok){showToast('All resolved','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}
async function exportPdf(reviewId){showToast('Generating PDF...','info');try{var r=await fetch('/api/mwr/review/'+reviewId+'/export-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});if(r.ok){var b=await r.blob();var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='review-'+reviewId+'.pdf';a.click();showToast('PDF downloaded','success')}else showToast('Export failed','error')}catch(e){showToast('Error','error')}}
async function addCollaborator(reviewId){var email=document.getElementById('collab-email').value.trim();var role=document.getElementById('collab-role').value;if(!email){showToast('Email required','error');return}try{var r=await fetch('/api/mwr/review/'+reviewId+'/collaborators',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,role:role})});if(r.ok){showToast('Collaborator added','success');document.getElementById('collab-dialog').style.display='none';setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}
async function removeCollaborator(collabId){if(!confirm('Remove this collaborator?'))return;try{var r=await fetch('/api/mwr/review/${esc(r.id)}/collaborators/'+collabId,{method:'DELETE'});if(r.ok){showToast('Removed','success');setTimeout(function(){location.reload()},500)}else showToast('Failed','error')}catch(e){showToast('Error','error')}}`;

  const body = `<div style="min-height:100vh;background:#f7f8fa">${nav(user)}<main style="padding:24px 32px" id="main-content">${content}</main></div>`;
  return generateHtml(`${esc(r.name||'Review')} | MY FRIDAY`, body, [script]);
}
