import { canCreate, canEdit, canDelete } from '@/ui/permissions-ui.js';
import { page } from '@/ui/layout.js';
import { reviewZoneNav } from '@/ui/review-zone-nav.js';
import { reviewCreateDialog, reviewTemplateChoiceDialog, reviewContextMenu, reviewFlagsDialog, reviewTagsDialog, reviewValueDialog, reviewDeadlineDialog, reviewNotificationDialog } from '@/ui/review-dialogs.js';
import { SPACING } from '@/ui/spacing-system.js';

export { reviewCreateDialog, reviewTemplateChoiceDialog, reviewContextMenu, reviewFlagsDialog, reviewTagsDialog, reviewValueDialog, reviewDeadlineDialog, reviewNotificationDialog };

const TOAST_SCRIPT = `window.showToast=(m,t='info')=>{let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.className='toast-container';c.setAttribute('role','status');c.setAttribute('aria-live','polite');c.setAttribute('aria-atomic','true');document.body.appendChild(c)}const d=document.createElement('div');d.className='toast toast-'+t;d.textContent=m;c.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},3000)};`;

const TAB_DEFS = [
  { key: 'all', label: 'All', filter: () => true },
  { key: 'active', label: 'Active', filter: r => r.status === 'active' || r.status === 'open' || r.status === 'in_progress' },
  { key: 'priority', label: 'Priority', filter: r => r.is_priority || r.flagged || r.flags_count > 0 },
  { key: 'history', label: 'History', filter: r => r.status === 'completed' || r.status === 'closed' },
  { key: 'archive', label: 'Archive', filter: r => r.status === 'archived' || r.archived === 1 },
];

function fmtDate(ts) {
  if (!ts) return '-';
  const n = Number(ts);
  if (!isNaN(n) && n > 1e9 && n < 3e9) return new Date(n * 1000).toLocaleDateString();
  return String(ts);
}

function statusBadge(status) {
  const s = status || 'open';
  const map = { active:'pill pill-info', open:'pill pill-info', in_progress:'pill pill-info', completed:'pill pill-success', closed:'pill pill-success', archived:'pill pill-neutral' };
  const cls = map[s] || 'pill pill-warning';
  return '<span class="'+cls+'">'+s+'</span>';
}

function reviewRow(r) {
  return `<tr class="review-row hover cursor-pointer" data-status="${r.status||''}" data-flags="${r.flags_count||0}" data-highlights="${r.highlights_count||0}" data-archived="${r.archived||0}" data-priority="${(r.is_priority||r.flagged||(r.flags_count>0))?1:0}" data-stage="${r.stage||r.status||''}" onclick="window.location='/review/${r.id}'" oncontextmenu="showCtxMenu(event,'${r.id}')">
    <td class="font-medium max-w-52 truncate">${r.name || r.title || 'Untitled'}</td>
    <td class="text-sm text-base-content/60">${r.engagement_name || r.engagement_id_display || '-'}</td>
    <td>${statusBadge(r.status)}</td>
    <td class="text-center text-sm">${r.highlights_count !== undefined ? r.highlights_count : '-'}</td>
    <td class="text-sm">${fmtDate(r.deadline)}</td>
    <td class="text-sm text-base-content/50">${fmtDate(r.created_at)}</td>
  </tr>`;
}

export function renderReviewListTabbed(user, reviews) {
  const counts = {};
  TAB_DEFS.forEach(t => { counts[t.key] = reviews.filter(t.filter).length; });
  const tabBar = `<div class="tab-bar">${TAB_DEFS.map(t => `<button class="review-tab tab-btn ${t.key==='all'?'active':''}" data-tab="${t.key}" onclick="switchTab('${t.key}')">${t.label}<span class="tab-count">${counts[t.key]}</span></button>`).join('')}</div>`;

  const rows = reviews.map(reviewRow).join('');
  const createBtn = canCreate(user, 'review') ? `<button onclick="document.getElementById('review-create-dialog').style.display='flex'" class="btn btn-primary btn-sm">New Review</button>` : '';

  const emptyState = `<tr><td colspan="6" class="text-center py-16 text-base-content/40">
    <div class="text-4xl mb-3 opacity-30">&#128196;</div>
    <div class="font-semibold mb-1">No reviews yet</div>
    <div class="text-sm">Start a new review to get started.</div>
  </td></tr>`;

  const content = `<div class="page-header">
      <div><h1 class="page-title">Reviews</h1><p class="page-subtitle">${reviews.length} total</p></div>
      <div style="display:flex;gap:${SPACING.sm};align-items:center">${reviewSearchField()}${createBtn}</div>
    </div>
    ${tabBar}
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="table-search"><input id="search-input" type="text" placeholder="Search reviews..."></div>
        <span class="table-count" id="row-count">${reviews.length} items</span>
      </div>
      <table class="data-table">
        <thead><tr><th>Name</th><th>Engagement</th><th>Status</th><th style="text-align:center">Highlights</th><th>Deadline</th><th>Created</th></tr></thead>
        <tbody id="review-tbody">${rows || emptyState}</tbody>
      </table>
    </div>
    ${reviewContextMenu()}`;

  const tabScript = `window.switchTab=(key)=>{document.querySelectorAll('.review-tab').forEach(t=>{var isA=t.dataset.tab===key;t.classList.toggle('active',isA)});const rows=document.querySelectorAll('.review-row');var vis=0,tot=0;rows.forEach(r=>{const s=r.dataset.status,a=r.dataset.archived,p=r.dataset.priority;let show=true;if(key==='active')show=s==='active'||s==='open'||s==='in_progress';else if(key==='priority')show=p==='1';else if(key==='history')show=s==='completed'||s==='closed';else if(key==='archive')show=s==='archived'||a==='1';r.style.display=show?'':'none';tot++;if(show)vis++});var rc=document.getElementById('review-count');if(rc)rc.innerHTML='Showing <strong>'+vis+'</strong> of '+tot+' reviews'}`;
  const ctxScript = `let ctxId=null;window.showCtxMenu=(e,id)=>{e.preventDefault();ctxId=id;const m=document.getElementById('review-ctx-menu');m.style.display='block';m.style.left=e.pageX+'px';m.style.top=e.pageY+'px'};document.addEventListener('click',()=>{const m=document.getElementById('review-ctx-menu');if(m)m.style.display='none'});window.ctxAction=(action)=>{if(!ctxId)return;if(action==='view')window.location='/review/'+ctxId;else if(action==='edit')window.location='/review/'+ctxId+'/edit';else if(action==='duplicate')fetch('/api/review/'+ctxId).then(r=>r.json()).then(d=>{const b=d.data||d;delete b.id;fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(()=>{showToast('Duplicated','success');setTimeout(()=>location.reload(),500)})});else if(action==='archive')fetch('/api/review/'+ctxId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'archived'})}).then(()=>{showToast('Archived','success');setTimeout(()=>location.reload(),500)});else if(action==='delete'){if(confirm('Delete this review?'))fetch('/api/review/'+ctxId,{method:'DELETE'}).then(()=>{showToast('Deleted','success');setTimeout(()=>location.reload(),500)})}else if(action==='export')fetch('/api/mwr/review/'+ctxId+'/export-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})}).then(r=>r.blob()).then(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='review-'+ctxId+'.pdf';a.click()})}`;
  const hideScript = `(function(){const cb=document.getElementById('hide-empty-toggle');if(!cb)return;cb.checked=localStorage.getItem('hideEmptyReviews')==='true';function apply(){const hide=cb.checked;document.querySelectorAll('.review-row').forEach(r=>{if(hide&&r.dataset.highlights==='0')r.classList.add('review-hidden');else r.classList.remove('review-hidden')})}cb.addEventListener('change',()=>{localStorage.setItem('hideEmptyReviews',cb.checked);apply()});apply()})()`;
  const searchScript = `(function(){const si=document.getElementById('review-search');if(!si)return;let t;si.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>{const q=si.value.toLowerCase();document.querySelectorAll('.review-row').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q)?'':'none'})},300)})})()`;
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/review', label: 'Reviews' }];
  return page(user, 'Reviews', bc, content, [TOAST_SCRIPT, tabScript, ctxScript, hideScript, searchScript]);
}

export function reviewSearchField() {
  return `<label for="review-search" class="sr-only">Search reviews</label><input type="text" id="review-search" placeholder="Search reviews..." class="input input-solid" style="max-width:220px" aria-label="Search reviews"/>`;
}

export function hideEmptyReviewsToggle() {
  return `<label class="flex items-center gap-2 text-sm text-base-content/60 cursor-pointer" title="Hide reviews with 0 highlights"><input type="checkbox" id="hide-empty-toggle" class="checkbox checkbox-sm"/>Hide empty</label>`;
}

export function reviewGroupedList(reviews, groupBy) {
  const groups = {};
  reviews.forEach(r => {
    const key = r[groupBy] || r[`${groupBy}_name`] || r[`${groupBy}_id`] || 'Ungrouped';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  const sections = Object.entries(groups).map(([name, items]) =>
    `<div class="review-group"><div class="review-group-header" onclick="this.parentElement.classList.toggle('review-group-collapsed')"><span class="review-group-arrow">&#9660;</span><span class="font-medium">${name}</span><span class="badge badge-sm ml-2">${items.length}</span></div><div class="review-group-body">${items.map(r => `<div class="review-group-item cursor-pointer hover:bg-base-200 p-2 rounded" onclick="window.location='/review/${r.id}'">${r.name || r.title || 'Untitled'} ${r.status ? statusBadge(r.status) : ''}</div>`).join('')}</div></div>`
  ).join('');
  return `<div class="review-grouped-list">${sections}</div>`;
}

export function renderReviewSections(user, review, sections) {
  const totalHighlights = sections.reduce((s, sec) => s + (sec.highlights_count || 0), 0);
  const resolvedHighlights = sections.reduce((s, sec) => s + (sec.resolved_count || 0), 0);
  const pct = totalHighlights > 0 ? Math.round(resolvedHighlights / totalHighlights * 100) : 0;
  const sectionRows = sections.map((sec, i) => {
    const secPct = sec.highlights_count > 0 ? Math.round((sec.resolved_count || 0) / sec.highlights_count * 100) : 0;
    return `<div class="card-clean" style="margin-bottom:${SPACING.sm}">
      <div class="card-clean-body" style="padding:${SPACING.sm} 0">
        <div class="flex justify-between items-center">
          <span class="font-medium">${sec.name || `Section ${i + 1}`}</span>
          <span class="text-sm text-base-content/60">${sec.highlights_count || 0} highlights</span>
        </div>
        <progress class="progress progress-primary w-full" value="${secPct}" max="100"></progress>
        <div class="flex justify-between text-xs text-base-content/50 mt-1">
          <span>Resolved: ${sec.resolved_count || 0}</span>
          <span>Flagged: ${sec.flagged_count || 0}</span>
          <span>${secPct}%</span>
        </div>
      </div>
    </div>`;
  }).join('');

  const statsHtml = `<div class="stats shadow w-full mb-6 flex-wrap">
    <div class="stat"><div class="stat-title">Sections</div><div class="stat-value text-2xl">${sections.length}</div></div>
    <div class="stat"><div class="stat-title">Total Highlights</div><div class="stat-value text-2xl">${totalHighlights}</div></div>
    <div class="stat"><div class="stat-title">Resolved</div><div class="stat-value text-2xl text-success">${resolvedHighlights}</div></div>
    <div class="stat"><div class="stat-title">Progress</div><div class="stat-value text-2xl">${pct}%</div></div>
  </div>`;

  const content = `<div class="mb-4"><h1 class="text-2xl font-bold">Sections: ${review.name || 'Review'}</h1></div>${statsHtml}${sectionRows || '<div class="text-center py-8 text-base-content/40">No sections found</div>'}`;
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/review', label: 'Reviews' }, { href: `/review/${review.id}`, label: review.name || 'Review' }, { label: 'Sections' }];
  return page(user, `Sections - ${review.name || 'Review'}`, bc, content);
}

export function renderSectionReport(user, review, sections) {
  const total = sections.reduce((s, sec) => s + (sec.highlights_count || 0), 0);
  const resolved = sections.reduce((s, sec) => s + (sec.resolved_count || 0), 0);
  const flagged = sections.reduce((s, sec) => s + (sec.flagged_count || 0), 0);
  const tableRows = sections.map((sec, i) => {
    const pct = sec.highlights_count > 0 ? Math.round((sec.resolved_count || 0) / sec.highlights_count * 100) : 0;
    return `<tr class="hover"><td>${sec.name || `Section ${i + 1}`}</td><td class="text-center">${sec.highlights_count || 0}</td><td class="text-center">${sec.resolved_count || 0}</td><td class="text-center">${sec.flagged_count || 0}</td><td class="text-center"><progress class="progress progress-primary w-16" value="${pct}" max="100"></progress></td></tr>`;
  }).join('');
  const summaryRow = `<tr class="font-bold bg-base-200"><td>Total</td><td class="text-center">${total}</td><td class="text-center">${resolved}</td><td class="text-center">${flagged}</td><td class="text-center">${total > 0 ? Math.round(resolved / total * 100) : 0}%</td></tr>`;
  const content = `<div class="flex justify-between items-center mb-4 flex-wrap gap-3">
    <h1 class="text-2xl font-bold">Section Report: ${review.name || 'Review'}</h1>
    <div class="flex gap-2"><button class="btn btn-ghost btn-sm" onclick="window.print()">Print</button><button class="btn btn-primary btn-sm" onclick="exportSectionReport()">Export CSV</button></div>
  </div>
  <div class="card-clean"><div class="card-clean-body">
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Section</th><th class="text-center">Highlights</th><th class="text-center">Resolved</th><th class="text-center">Flagged</th><th class="text-center">Progress</th></tr></thead><tbody>${tableRows}${summaryRow}</tbody></table></div>
  </div></div>`;
  const bc = [{ href: '/', label: 'Home' }, { href: '/review', label: 'Reviews' }, { href: `/review/${review.id}`, label: review.name || 'Review' }, { label: 'Sections' }];
  const exportScript = `window.exportSectionReport=function(){var rows=[['Section','Highlights','Resolved','Flagged','Progress']];document.querySelectorAll('tbody tr').forEach(function(r){var cells=[];r.querySelectorAll('td').forEach(function(c){cells.push(c.textContent.trim())});if(cells.length)rows.push(cells)});var csv=rows.map(function(r){return r.join(',')}).join('\\n');var b=new Blob([csv],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='section-report.csv';a.click()}`;
  return page(user, `${review.name || 'Review'} | Sections`, bc, reviewZoneNav(review.id, 'sections') + content, [exportScript]);
}

export function renderMwrHome(user, stats) {
  const { myReviews = [], sharedReviews = [], recentActivity = [], totalReviews = 0, activeReviews = 0, flaggedReviews = 0, overdueReviews = 0 } = stats;

  const statsHtml = `<div class="stats shadow w-full mb-6 flex-wrap">
    <div class="stat"><div class="stat-title">Total Reviews</div><div class="stat-value text-2xl">${totalReviews}</div></div>
    <div class="stat"><div class="stat-title">Active</div><div class="stat-value text-2xl text-primary">${activeReviews}</div></div>
    <div class="stat"><div class="stat-title">Flagged</div><div class="stat-value text-2xl text-warning">${flaggedReviews}</div></div>
    <div class="stat"><div class="stat-title">Overdue</div><div class="stat-value text-2xl ${overdueReviews > 0 ? 'text-error' : ''}">${overdueReviews}</div></div>
  </div>`;

  const tabBar = `<div class="tabs tabs-boxed bg-base-200 mb-4 flex-wrap gap-1">
    <button class="tab tab-active" data-tab="my" onclick="switchHomeTab('my')">My Reviews<span class="badge badge-sm ml-1">${myReviews.length}</span></button>
    <button class="tab" data-tab="shared" onclick="switchHomeTab('shared')">Shared With Me<span class="badge badge-sm ml-1">${sharedReviews.length}</span></button>
    <button class="tab" data-tab="activity" onclick="switchHomeTab('activity')">Recent Activity<span class="badge badge-sm ml-1">${recentActivity.length}</span></button>
  </div>`;

  const myList = myReviews.length ? myReviews.map(r => `<div class="flex items-center justify-between p-3 border-b border-base-200 hover:bg-base-200 cursor-pointer" onclick="window.location='/review/${r.id}'"><span class="font-medium text-sm">${r.name || 'Untitled'}</span><div class="flex items-center gap-2">${statusBadge(r.status)}<span class="text-xs text-base-content/50">${fmtDate(r.updated_at || r.created_at)}</span></div></div>`).join('') : '<div class="text-center py-8 text-base-content/40 text-sm">No reviews yet</div>';
  const sharedList = sharedReviews.length ? sharedReviews.map(r => `<div class="flex items-center justify-between p-3 border-b border-base-200 hover:bg-base-200 cursor-pointer" onclick="window.location='/review/${r.id}'"><span class="font-medium text-sm">${r.name || 'Untitled'}</span><div class="flex items-center gap-2">${statusBadge(r.status)}<span class="text-xs text-base-content/50">${r.shared_by || ''}</span></div></div>`).join('') : '<div class="text-center py-8 text-base-content/40 text-sm">No shared reviews</div>';
  const actList = recentActivity.length ? recentActivity.slice(0, 20).map(a => `<div class="flex gap-3 p-3 border-b border-base-200"><span class="text-xs text-base-content/40">${fmtDate(a.created_at)}</span><span class="text-sm">${a.description || a.action || '-'}</span></div>`).join('') : '<div class="text-center py-8 text-base-content/40 text-sm">No recent activity</div>';

  const panels = `<div id="home-panel-my">${myList}</div><div id="home-panel-shared" style="display:none">${sharedList}</div><div id="home-panel-activity" style="display:none">${actList}</div>`;
  const content = `<div class="mb-4"><h1 class="text-2xl font-bold">MWR Home</h1><p class="text-base-content/60 text-sm">Welcome back, ${user?.name || 'User'}</p></div>${statsHtml}${tabBar}<div class="card-clean"><div class="card-clean-body" style="padding:0rem">${panels}</div></div>`;
  const script = `window.switchHomeTab=(key)=>{document.querySelectorAll('[data-tab]').forEach(t=>t.classList.toggle('tab-active',t.dataset.tab===key));document.querySelectorAll('[id^="home-panel-"]').forEach(p=>p.style.display='none');const el=document.getElementById('home-panel-'+key);if(el)el.style.display='block'}`;
  const bc = [{ href: '/', label: 'Dashboard' }, { label: 'MWR Home' }];
  return page(user, 'MWR Home', bc, content, [script]);
}
