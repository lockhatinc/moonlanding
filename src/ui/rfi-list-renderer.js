import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';

function statusBadge(status) {
  const s = (status || 'draft').toLowerCase();
  const map = { draft:'badge-flat-secondary', active:'badge-flat-primary', sent:'badge-warning badge-flat-warning', responded:'badge-success badge-flat-success', closed:'badge-flat-secondary', overdue:'badge-error badge-flat-error' };
  const cls = map[s] || 'badge-flat-secondary';
  return `<span class="badge ${cls} text-xs uppercase">${s}</span>`;
}

function deadlineBadge(deadline) {
  if (!deadline) return '<span class="text-base-content/30">—</span>';
  const d = typeof deadline === 'number' ? new Date(deadline * 1000) : new Date(deadline);
  const isOverdue = d < new Date();
  const str = d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  return isOverdue
    ? `<span class="badge badge-error badge-flat-error text-xs">${str} !</span>`
    : `<span class="text-sm">${str}</span>`;
}

export function renderRfiList(user, rfis = [], engagements = []) {
  const engMap = Object.fromEntries(engagements.map(e => [e.id, e]));
  const statusCounts = rfis.reduce((acc, r) => { const s = (r.status||'draft').toLowerCase(); acc[s]=(acc[s]||0)+1; return acc; }, {});
  const tabs = ['all','active','draft','sent','responded','closed','overdue'];
  const tabBar = `<div class="tabs tabs-boxed bg-base-200 mb-4 flex-wrap gap-1">` +
    tabs.map(t => {
      const count = t === 'all' ? rfis.length : (statusCounts[t] || 0);
      return `<button onclick="filterTab('${t}')" id="tab-${t}" class="tab ${t==='all'?'tab-active':''}">${t==='all'?'All RFIs':t.charAt(0).toUpperCase()+t.slice(1)}<span class="badge badge-sm ml-1">${count}</span></button>`;
    }).join('') + `</div>`;

  const rows = rfis.map(r => {
    const eng = engMap[r.engagement_id] || {};
    const s = (r.status || 'draft').toLowerCase();
    return `<tr class="rfi-row hover cursor-pointer" data-status="${s}" onclick="window.location='/rfi/${r.id}'">
      <td class="font-medium text-sm">${r.display_name || r.name || r.title || 'RFI ' + r.id.slice(0,6)}</td>
      <td>${eng.name ? `<a href="/engagement/${eng.id}" onclick="event.stopPropagation()" class="text-primary text-sm">${eng.name}</a>` : '<span class="text-base-content/30">—</span>'}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${deadlineBadge(r.deadline)}</td>
      <td class="text-sm text-base-content/50">${r.created_at ? new Date(typeof r.created_at==='number'?r.created_at*1000:r.created_at).toLocaleDateString('en-ZA') : '—'}</td>
    </tr>`;
  }).join('');

  const empty = `<tr><td colspan="5" class="text-center py-16 text-base-content/40">
    <div class="text-4xl mb-3 opacity-30">&#128196;</div>
    <div class="font-semibold mb-1">No RFIs found</div>
    <div class="text-sm">Create an RFI from an engagement to get started.</div>
  </td></tr>`;

  const overdueCount = rfis.filter(r => r.deadline && new Date(typeof r.deadline==='number'?r.deadline*1000:r.deadline) < new Date()).length;
  const alert = overdueCount > 0 ? `<div class="alert alert-error mb-4 flex justify-between items-center">
    <span>${overdueCount} overdue RFI${overdueCount!==1?'s':''} require attention</span>
  </div>` : '';

  const content = `
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-base-content">RFIs</h1>
      <a href="/rfi/new" class="btn btn-primary btn-sm gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New RFI</a>
    </div>
    ${alert}
    ${tabBar}
    <div class="card bg-base-100 shadow-md">
      <div class="card-body p-0">
        <div class="flex items-center px-4 py-3 border-b border-base-200">
          <span id="rfi-count" class="text-sm text-base-content/60">Showing <strong>${rfis.length}</strong> RFIs</span>
        </div>
        <div class="table-container">
          <table class="table table-hover">
            <thead><tr><th>Name</th><th>Engagement</th><th>Status</th><th>Deadline</th><th>Created</th></tr></thead>
            <tbody id="rfi-tbody">${rows || empty}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  const script = `var currentTab='all';
function filterTab(t){
  currentTab=t;
  document.querySelectorAll('[id^=tab-]').forEach(b=>b.classList.toggle('tab-active',b.id==='tab-'+t));
  var vis=0,tot=0;
  document.querySelectorAll('.rfi-row').forEach(row=>{
    if(!row.dataset)return;
    tot++;
    var show=(t==='all'||row.dataset.status===t);
    row.style.display=show?'':'none';
    if(show)vis++;
  });
  var c=document.getElementById('rfi-count');
  if(c)c.innerHTML='Showing <strong>'+vis+'</strong> of '+tot+' RFIs';
}
filterTab('all');`;

  const body = `<div class="min-h-screen bg-base-200">${nav(user)}<main class="p-4 md:p-6" id="main-content">${content}</main></div>`;
  return generateHtml('RFIs | MY FRIDAY', body, [script]);
}
