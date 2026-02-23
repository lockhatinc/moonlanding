import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';
import { esc, statusPill, TABLE_SCRIPT } from '@/ui/render-helpers.js';

function deadlineCell(deadline) {
  if (!deadline) return '<span style="color:var(--color-text-light)">—</span>';
  const d = typeof deadline === 'number' ? new Date(deadline * 1000) : new Date(deadline);
  const isOverdue = d < new Date();
  const str = d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  return isOverdue ? `<span class="pill pill-danger">${str} !</span>` : `<span>${str}</span>`;
}

export function renderRfiList(user, rfis = [], engagements = []) {
  const engMap = Object.fromEntries(engagements.map(e => [e.id, e]));
  const statusCounts = rfis.reduce((acc, r) => { const s=(r.status||'draft').toLowerCase(); acc[s]=(acc[s]||0)+1; return acc; }, {});
  const TABS = ['all','active','draft','sent','responded','closed','overdue'];

  const tabBar = `<div class="tab-bar">${TABS.map(t => {
    const count = t === 'all' ? rfis.length : (statusCounts[t] || 0);
    const label = t === 'all' ? 'All RFIs' : t.charAt(0).toUpperCase()+t.slice(1);
    return `<button class="tab-btn${t==='all'?' active':''}" id="tab-${t}" onclick="filterTab('${t}')">${label}<span class="tab-count">${count}</span></button>`;
  }).join('')}</div>`;

  const overdueCount = rfis.filter(r => r.deadline && new Date(typeof r.deadline==='number'?r.deadline*1000:r.deadline) < new Date()).length;
  const alert = overdueCount > 0 ? `<div class="alert-strip alert-strip-danger"><span>${overdueCount} overdue RFI${overdueCount!==1?'s':''} require attention</span></div>` : '';

  const rows = rfis.map(r => {
    const eng = engMap[r.engagement_id] || {};
    const s = (r.status || 'draft').toLowerCase();
    const name = esc(r.display_name || r.name || r.title || 'RFI '+r.id.slice(0,6));
    const engLink = eng.name ? `<a href="/engagement/${eng.id}" onclick="event.stopPropagation()" style="color:var(--color-info)">${esc(eng.name)}</a>` : '<span style="color:var(--color-text-light)">—</span>';
    const created = r.created_at ? new Date(typeof r.created_at==='number'?r.created_at*1000:r.created_at).toLocaleDateString('en-ZA') : '—';
    return `<tr data-row data-status="${s}" onclick="window.location='/rfi/${r.id}'" style="cursor:pointer">
      <td data-col="name"><strong>${name}</strong></td>
      <td data-col="engagement">${engLink}</td>
      <td data-col="status">${statusPill(r.status)}</td>
      <td data-col="deadline">${deadlineCell(r.deadline)}</td>
      <td data-col="created">${created}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="5" style="text-align:center;padding:48px;color:var(--color-text-muted)">No RFIs found</td></tr>';

  const statusOpts = TABS.filter(t=>t!=='all').map(t=>`<option value="${t}">${t.charAt(0).toUpperCase()+t.slice(1)}</option>`).join('');

  const body = `<div style="min-height:100vh;background:var(--color-bg)">${nav(user)}<main class="page-shell" id="main-content"><div class="page-shell-inner">
    <div class="page-header">
      <div><h1 class="page-title">RFIs</h1><p class="page-subtitle">${rfis.length} total</p></div>
      <a href="/rfi/new" class="btn-primary-clean"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New RFI</a>
    </div>
    ${alert}
    ${tabBar}
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="table-search"><input id="search-input" type="text" placeholder="Search RFIs..."></div>
        <div class="table-filter"><select data-filter="status"><option value="">All statuses</option>${statusOpts}</select></div>
        <span class="table-count" id="row-count">${rfis.length} items</span>
      </div>
      <table class="data-table">
        <thead><tr>
          <th data-sort="name">Name</th><th data-sort="engagement">Engagement</th>
          <th data-sort="status">Status</th><th data-sort="deadline">Deadline</th><th data-sort="created">Created</th>
        </tr></thead>
        <tbody id="rfi-tbody">${rows}</tbody>
      </table>
    </div>
  </div></main></div>`;

  const tabScript = `var _activeTab='all';function filterTab(t){_activeTab=t;document.querySelectorAll('[id^="tab-"]').forEach(b=>b.classList.toggle('active',b.id==='tab-'+t));document.querySelectorAll('[data-filter="status"]').forEach(s=>{s.value=t==='all'?'':t});window.filterTable();}`;

  return generateHtml('RFIs | MOONLANDING', body, [TABLE_SCRIPT, tabScript]);
}
