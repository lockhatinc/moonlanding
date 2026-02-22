import { canCreate, canEdit, canDelete, getNavItems, getAdminItems } from '@/ui/permissions-ui.js';
import { statusLabel, linearProgress, userAvatar, teamAvatarGroup, generateHtml } from '@/ui/renderer.js';
import { nav as fridayNav } from '@/ui/layout.js';
import { reviewCreateDialog, reviewTemplateChoiceDialog, reviewContextMenu, reviewFlagsDialog, reviewTagsDialog, reviewValueDialog, reviewDeadlineDialog, reviewNotificationDialog } from '@/ui/review-dialogs.js';

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


function breadcrumb(items) {
  if (!items?.length) return '';
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map((item, i) => i === items.length - 1 ? `<span>${item.label}</span>` : `<a href="${item.href}">${item.label}</a><span class="breadcrumb-separator">/</span>`).join('')}</nav>`;
}

function page(user, title, bc, content, scripts = []) {
  const body = `<div style="min-height:100vh;background:#f7f8fa">${fridayNav(user)}<main id="main-content" style="padding:24px 32px">${breadcrumb(bc)}${content}</main></div>`;
  return generateHtml(title, body, scripts);
}

function reviewRow(r) {
  const status = r.status || 'open';
  const sc = status === 'active' || status === 'open' || status === 'in_progress' ? ['#1565c0','#e3f2fd'] : status === 'completed' || status === 'closed' ? ['#2e7d32','#e8f5e9'] : status === 'archived' ? ['#555','#f5f5f5'] : ['#e65100','#fff3e0'];
  const statusBadge = `<span style="background:${sc[1]};color:${sc[0]};padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:700;border:1px solid ${sc[0]}44">${status}</span>`;
  return `<tr class="review-row" data-searchable data-status="${r.status || ''}" data-flags="${r.flags_count || 0}" data-highlights="${r.highlights_count || 0}" data-archived="${r.archived || 0}" data-priority="${r.is_priority || r.flagged || (r.flags_count > 0) ? '1' : '0'}" data-stage="${r.stage || r.status || ''}" onclick="window.location='/review/${r.id}'" oncontextmenu="showCtxMenu(event,'${r.id}')" style="cursor:pointer;border-bottom:1px solid #f0f0f0" onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background=''">
    <td style="padding:10px 12px;font-weight:500;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.name || r.title || 'Untitled'}</td>
    <td style="padding:10px 12px;font-size:0.8rem;color:#555">${r.engagement_name || r.engagement_id_display || '-'}</td>
    <td style="padding:10px 12px">${statusBadge}</td>
    <td style="padding:10px 12px;text-align:center;font-size:0.82rem">${r.highlights_count !== undefined ? r.highlights_count : '-'}</td>
    <td style="padding:10px 12px;font-size:0.8rem">${fmtDate(r.deadline)}</td>
    <td style="padding:10px 12px;font-size:0.8rem;color:#888">${fmtDate(r.created_at)}</td>
  </tr>`;
}

export function renderReviewListTabbed(user, reviews) {
  const counts = {};
  TAB_DEFS.forEach(t => { counts[t.key] = reviews.filter(t.filter).length; });
  const tabBar = `<div style="display:flex;gap:0;border-bottom:2px solid #e0e0e0;margin-bottom:16px">` +
    TAB_DEFS.map(t => `<button class="review-tab${t.key === 'all' ? ' review-tab-active' : ''}" data-tab="${t.key}" onclick="switchTab('${t.key}')" style="padding:8px 20px;font-size:0.82rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:${t.key === 'all' ? '2px solid #1976d2;color:#1976d2' : '2px solid transparent;color:#666'};margin-bottom:-2px">${t.label}&nbsp;<span style="background:#e0e0e0;border-radius:10px;padding:1px 7px;font-size:0.7rem">${counts[t.key]}</span></button>`).join('') +
    `</div>`;
  const headers = '<th style="padding:10px 12px;font-size:0.78rem;color:#444;font-weight:600">NAME</th><th style="padding:10px 12px;font-size:0.78rem;color:#444;font-weight:600">ENGAGEMENT</th><th style="padding:10px 12px;font-size:0.78rem;color:#444;font-weight:600">STATUS</th><th style="padding:10px 12px;font-size:0.78rem;color:#444;font-weight:600;text-align:center">HIGHLIGHTS</th><th style="padding:10px 12px;font-size:0.78rem;color:#444;font-weight:600">DEADLINE</th><th style="padding:10px 12px;font-size:0.78rem;color:#444;font-weight:600">CREATED</th>';
  const rows = reviews.map(reviewRow).join('');
  const createBtn = canCreate(user, 'review') ? `<button onclick="document.getElementById('review-create-dialog').style.display='flex'" style="background:#1976d2;color:#fff;padding:7px 14px;border-radius:6px;font-size:0.82rem;font-weight:600;border:none;cursor:pointer">New Review</button>` : '';
  const table = `<div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.1);overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:0.82rem"><thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0">${headers}</tr></thead><tbody id="review-tbody">${rows || '<tr><td colspan="6" style="text-align:center;padding:48px;color:#aaa">No reviews found</td></tr>'}</tbody></table></div>`;
  const content = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h1 style="font-size:1.4rem;font-weight:700;margin:0;color:#1a1a1a">Reviews</h1><div style="display:flex;gap:8px;align-items:center">${reviewSearchField()}${hideEmptyReviewsToggle()}${createBtn}</div></div>${tabBar}${table}${reviewContextMenu()}`;
  const tabScript = `window.switchTab=(key)=>{document.querySelectorAll('.review-tab').forEach(t=>{var isA=t.dataset.tab===key;t.classList.toggle('review-tab-active',isA);t.style.borderBottomColor=isA?'#1976d2':'transparent';t.style.color=isA?'#1976d2':'#666'});const rows=document.querySelectorAll('.review-row');rows.forEach(r=>{const s=r.dataset.status,a=r.dataset.archived,p=r.dataset.priority;let show=true;if(key==='active')show=s==='active'||s==='open'||s==='in_progress';else if(key==='priority')show=p==='1';else if(key==='history')show=s==='completed'||s==='closed';else if(key==='archive')show=s==='archived'||a==='1';r.style.display=show?'':'none'})}`;
  const ctxScript = `let ctxId=null;window.showCtxMenu=(e,id)=>{e.preventDefault();ctxId=id;const m=document.getElementById('review-ctx-menu');m.style.display='block';m.style.left=e.pageX+'px';m.style.top=e.pageY+'px'};document.addEventListener('click',()=>{document.getElementById('review-ctx-menu').style.display='none'});window.ctxAction=(action)=>{if(!ctxId)return;if(action==='view')window.location='/review/'+ctxId;else if(action==='edit')window.location='/review/'+ctxId+'/edit';else if(action==='duplicate')fetch('/api/review/'+ctxId).then(r=>r.json()).then(d=>{const b=d.data||d;delete b.id;fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(()=>{showToast('Duplicated','success');setTimeout(()=>location.reload(),500)})});else if(action==='archive')fetch('/api/review/'+ctxId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'archived'})}).then(()=>{showToast('Archived','success');setTimeout(()=>location.reload(),500)});else if(action==='delete'){if(confirm('Delete this review?'))fetch('/api/review/'+ctxId,{method:'DELETE'}).then(()=>{showToast('Deleted','success');setTimeout(()=>location.reload(),500)})}else if(action==='export')fetch('/api/mwr/review/'+ctxId+'/export-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})}).then(r=>r.blob()).then(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='review-'+ctxId+'.pdf';a.click()})}`;
  const hideScript = `(function(){const cb=document.getElementById('hide-empty-toggle');if(!cb)return;cb.checked=localStorage.getItem('hideEmptyReviews')==='true';function apply(){const hide=cb.checked;document.querySelectorAll('.review-row').forEach(r=>{if(hide&&r.dataset.highlights==='0')r.classList.add('review-hidden');else r.classList.remove('review-hidden')})}cb.addEventListener('change',()=>{localStorage.setItem('hideEmptyReviews',cb.checked);apply()});apply()})()`;
  const searchScript = `(function(){const si=document.getElementById('review-search');if(!si)return;let t;si.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>{const q=si.value.toLowerCase();document.querySelectorAll('.review-row').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q)?'':'none'})},300)})})()`;
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/review', label: 'Reviews' }];
  return page(user, 'Reviews', bc, content, [TOAST_SCRIPT, tabScript, ctxScript, hideScript, searchScript]);
}

export function reviewSearchField() {
  return `<label for="review-search" class="sr-only">Search reviews</label><input type="text" id="review-search" placeholder="Search reviews..." class="input input-bordered input-sm" style="width:220px" aria-label="Search reviews"/>`;
}

export function hideEmptyReviewsToggle() {
  return `<label class="flex items-center gap-2 text-sm text-gray-500" title="Hide reviews with 0 highlights"><input type="checkbox" id="hide-empty-toggle" class="checkbox checkbox-sm"/>Hide empty</label>`;
}

export function reviewGroupedList(reviews, groupBy) {
  const groups = {};
  reviews.forEach(r => {
    const key = r[groupBy] || r[`${groupBy}_name`] || r[`${groupBy}_id`] || 'Ungrouped';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  const sections = Object.entries(groups).map(([name, items]) =>
    `<div class="review-group"><div class="review-group-header" onclick="this.parentElement.classList.toggle('review-group-collapsed')"><span class="review-group-arrow">&#9660;</span><span class="font-medium">${name}</span><span class="review-tab-count">${items.length}</span></div><div class="review-group-body">${items.map(r => `<div class="review-group-item" onclick="window.location='/review/${r.id}'">${r.name || r.title || 'Untitled'} ${r.status ? statusLabel(r.status) : ''}</div>`).join('')}</div></div>`
  ).join('');
  return `<div class="review-grouped-list">${sections}</div>`;
}

export function renderReviewSections(user, review, sections) {
  const totalHighlights = sections.reduce((s, sec) => s + (sec.highlights_count || 0), 0);
  const resolvedHighlights = sections.reduce((s, sec) => s + (sec.resolved_count || 0), 0);
  const sectionRows = sections.map((sec, i) => {
    const pct = sec.highlights_count > 0 ? Math.round((sec.resolved_count || 0) / sec.highlights_count * 100) : 0;
    return `<div class="review-section-row"><div class="review-section-header" onclick="this.parentElement.classList.toggle('review-section-expanded')"><span class="review-group-arrow">&#9660;</span><span class="font-medium">${sec.name || `Section ${i + 1}`}</span><span class="text-xs text-gray-500">${sec.highlights_count || 0} highlights</span>${linearProgress(sec.resolved_count || 0, sec.highlights_count || 1, '', 'thin')}</div><div class="review-section-body"><div class="review-section-stats"><div class="flex justify-between text-xs text-gray-500"><span>Total: ${sec.highlights_count || 0}</span><span>Resolved: ${sec.resolved_count || 0}</span><span>Flagged: ${sec.flagged_count || 0}</span></div></div></div></div>`;
  }).join('');
  const summaryCards = `<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"><div class="card bg-white shadow"><div class="card-body"><h3 class="text-gray-500 text-sm">Total Sections</h3><p class="text-2xl font-bold">${sections.length}</p></div></div><div class="card bg-white shadow"><div class="card-body"><h3 class="text-gray-500 text-sm">Total Highlights</h3><p class="text-2xl font-bold">${totalHighlights}</p></div></div><div class="card bg-white shadow"><div class="card-body"><h3 class="text-gray-500 text-sm">Resolved</h3><p class="text-2xl font-bold text-green-600">${resolvedHighlights}</p></div></div><div class="card bg-white shadow"><div class="card-body"><h3 class="text-gray-500 text-sm">Progress</h3><p class="text-2xl font-bold">${totalHighlights > 0 ? Math.round(resolvedHighlights / totalHighlights * 100) : 0}%</p></div></div></div>`;
  const content = `<div class="mb-6"><h1 class="text-2xl font-bold">Sections: ${review.name || 'Review'}</h1></div>${summaryCards}<div class="card bg-white shadow"><div class="card-body">${sectionRows || '<p class="text-gray-500 text-center py-4">No sections found</p>'}</div></div>`;
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/review', label: 'Reviews' }, { href: `/review/${review.id}`, label: review.name || 'Review' }, { label: 'Sections' }];
  const script = `document.querySelectorAll('.review-section-row').forEach(r=>r.classList.add('review-section-expanded'))`;
  return page(user, `Sections - ${review.name || 'Review'}`, bc, content, [script]);
}

export function renderSectionReport(user, review, sections) {
  const total = sections.reduce((s, sec) => s + (sec.highlights_count || 0), 0);
  const resolved = sections.reduce((s, sec) => s + (sec.resolved_count || 0), 0);
  const flagged = sections.reduce((s, sec) => s + (sec.flagged_count || 0), 0);
  const tableRows = sections.map((sec, i) => {
    const pct = sec.highlights_count > 0 ? Math.round((sec.resolved_count || 0) / sec.highlights_count * 100) : 0;
    return `<tr><td>${sec.name || `Section ${i + 1}`}</td><td class="text-center">${sec.highlights_count || 0}</td><td class="text-center">${sec.resolved_count || 0}</td><td class="text-center">${sec.flagged_count || 0}</td><td class="text-center">${pct}%</td></tr>`;
  }).join('');
  const summaryRow = `<tr class="font-bold"><td>Total</td><td class="text-center">${total}</td><td class="text-center">${resolved}</td><td class="text-center">${flagged}</td><td class="text-center">${total > 0 ? Math.round(resolved / total * 100) : 0}%</td></tr>`;
  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Section Report: ${review.name || 'Review'}</h1><div class="flex gap-2"><button class="btn btn-outline btn-sm" onclick="window.print()">Print</button><button class="btn btn-primary btn-sm" onclick="exportSectionReport()">Export CSV</button></div></div>
    <div class="card bg-white shadow mb-4"><div class="card-body"><table class="table table-zebra w-full"><thead><tr><th>Section</th><th class="text-center">Highlights</th><th class="text-center">Resolved</th><th class="text-center">Flagged</th><th class="text-center">Progress</th></tr></thead><tbody>${tableRows}${summaryRow}</tbody></table></div></div>`;
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/review', label: 'Reviews' }, { href: `/review/${review.id}`, label: review.name || 'Review' }, { label: 'Section Report' }];
  const exportScript = `window.exportSectionReport=function(){var rows=[['Section','Highlights','Resolved','Flagged','Progress']];document.querySelectorAll('tbody tr').forEach(function(r){var cells=[];r.querySelectorAll('td').forEach(function(c){cells.push(c.textContent)});if(cells.length)rows.push(cells)});var csv=rows.map(function(r){return r.join(',')}).join('\\n');var b=new Blob([csv],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='section-report.csv';a.click()}`;
  return page(user, `Section Report - ${review.name || 'Review'}`, bc, content, [exportScript]);
}

export function renderMwrHome(user, stats) {
  const { myReviews = [], sharedReviews = [], recentActivity = [], totalReviews = 0, activeReviews = 0, flaggedReviews = 0, overdueReviews = 0 } = stats;
  const cards = `<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"><div class="card bg-white shadow"><div class="card-body"><h3 class="text-gray-500 text-sm">Total Reviews</h3><p class="text-2xl font-bold">${totalReviews}</p></div></div><div class="card bg-white shadow"><div class="card-body"><h3 class="text-gray-500 text-sm">Active</h3><p class="text-2xl font-bold text-blue-600">${activeReviews}</p></div></div><div class="card bg-white shadow"><div class="card-body"><h3 class="text-gray-500 text-sm">Flagged</h3><p class="text-2xl font-bold text-orange-600">${flaggedReviews}</p></div></div><div class="card bg-white shadow"><div class="card-body"><h3 class="text-gray-500 text-sm">Overdue</h3><p class="text-2xl font-bold${overdueReviews > 0 ? ' text-red-600' : ''}">${overdueReviews}</p></div></div></div>`;
  const tabBar = `<div class="review-tab-bar"><button class="review-tab review-tab-active" data-tab="my" onclick="switchHomeTab('my')">My Reviews <span class="review-tab-count">${myReviews.length}</span></button><button class="review-tab" data-tab="shared" onclick="switchHomeTab('shared')">Shared With Me <span class="review-tab-count">${sharedReviews.length}</span></button><button class="review-tab" data-tab="activity" onclick="switchHomeTab('activity')">Recent Activity <span class="review-tab-count">${recentActivity.length}</span></button></div>`;
  const myList = myReviews.length ? myReviews.map(r => `<div class="review-group-item" onclick="window.location='/review/${r.id}'"><span class="font-medium">${r.name || 'Untitled'}</span> ${r.status ? statusLabel(r.status) : ''} <span class="text-xs text-gray-500">${fmtDate(r.updated_at || r.created_at)}</span></div>`).join('') : '<p class="text-gray-500 text-center py-4">No reviews yet</p>';
  const sharedList = sharedReviews.length ? sharedReviews.map(r => `<div class="review-group-item" onclick="window.location='/review/${r.id}'"><span class="font-medium">${r.name || 'Untitled'}</span> ${r.status ? statusLabel(r.status) : ''} <span class="text-xs text-gray-500">${r.shared_by || ''}</span></div>`).join('') : '<p class="text-gray-500 text-center py-4">No shared reviews</p>';
  const actList = recentActivity.length ? recentActivity.slice(0, 20).map(a => `<div class="review-group-item"><span class="text-xs text-gray-500">${fmtDate(a.created_at)}</span> <span>${a.description || a.action || '-'}</span></div>`).join('') : '<p class="text-gray-500 text-center py-4">No recent activity</p>';
  const panels = `<div id="home-panel-my" class="home-panel">${myList}</div><div id="home-panel-shared" class="home-panel" style="display:none">${sharedList}</div><div id="home-panel-activity" class="home-panel" style="display:none">${actList}</div>`;
  const content = `<div class="mb-6"><h1 class="text-2xl font-bold">MWR Home</h1><p class="text-gray-500">Welcome back, ${user?.name || 'User'}</p></div>${cards}${tabBar}<div class="card bg-white shadow"><div class="card-body">${panels}</div></div>`;
  const script = `window.switchHomeTab=(key)=>{document.querySelectorAll('.review-tab').forEach(t=>t.classList.toggle('review-tab-active',t.dataset.tab===key));document.querySelectorAll('.home-panel').forEach(p=>p.style.display='none');const el=document.getElementById('home-panel-'+key);if(el)el.style.display='block'}`;
  const bc = [{ href: '/', label: 'Dashboard' }, { label: 'MWR Home' }];
  return page(user, 'MWR Home', bc, content, [script]);
}
