import { page } from '@/ui/layout.js';
import { canEdit } from '@/ui/permissions-ui.js';
import { esc, statusBadge, TOAST_SCRIPT } from '@/ui/render-helpers.js';
import { reviewDetailScript } from '@/ui/review-detail-script.js';
import { highlightRow, collaboratorRow, addCollaboratorDialog } from '@/ui/review-detail-panels.js';

function fmtDate(ts) {
  if (!ts) return '-';
  const n = Number(ts);
  if (!isNaN(n) && n > 1e9 && n < 3e9) return new Date(n * 1000).toLocaleDateString();
  try { return new Date(ts).toLocaleDateString(); } catch { return String(ts); }
}

export function reviewZoneNav(reviewId, active) {
  const links = [
    { href: `/review/${reviewId}`, label: 'Overview', key: 'overview' },
    { href: `/review/${reviewId}/pdf`, label: 'PDF', key: 'pdf' },
    { href: `/review/${reviewId}/highlights`, label: 'Highlights', key: 'highlights' },
    { href: `/review/${reviewId}/sections`, label: 'Sections', key: 'sections' },
    { href: `/review/${reviewId}/resolution`, label: 'Resolution', key: 'resolution' },
  ];
  return `<nav class="tab-bar" style="margin-bottom:1.25rem;overflow-x:auto;scrollbar-width:none">
    ${links.map(l => `<a href="${l.href}" class="tab-btn${l.key===active?' active':''}">${l.label}</a>`).join('')}
  </nav>`;
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

  const tabBar = `<div class="tab-bar">${TABS.map((t, i) => `<button onclick="switchTab('${t.id}')" id="rvtab-${t.id}" class="tab-btn${i===0?' active':''}">${t.label}</button>`).join('')}</div>`;

  const infoItems = [
    ['Name', esc(r.name||r.title||'-')],
    ['Status', statusBadge(r.status)],
    ['Type', esc(r.review_type||r.type||'-')],
    ['Financial Year', esc(r.financial_year||'-')],
    ['Deadline', fmtDate(r.deadline)],
    ['Created', fmtDate(r.created_at)],
    ['Highlights', totalH > 0 ? `${resolvedH}/${totalH} resolved` : '<span class="text-base-content/40">None yet</span>'],
  ];

  const infoGrid = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">${infoItems.map(([l,v]) => `<div><div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-muted);margin-bottom:4px">${l}</div><div style="font-size:0.875rem;color:var(--color-text)">${v}</div></div>`).join('')}</div>`;

  const overviewPanel = `<div id="rvpanel-overview" class="rv-panel">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card-clean"><div class="card-clean-body">
        <h2 style="font-size:0.875rem;font-weight:600;margin-bottom:16px">Review Details</h2>
        ${infoGrid}
        ${totalH > 0 ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--color-border)"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:0.8rem;font-weight:600;color:var(--color-text-muted)">Resolution Progress</span><span style="font-size:0.8rem;color:var(--color-text-light)">${pct}%</span></div><progress class="progress progress-success w-full" value="${pct}" max="100"></progress></div>` : ''}
      </div></div>
      <div class="card-clean"><div class="card-clean-body">
        <h2 style="font-size:0.875rem;font-weight:600;margin-bottom:16px">Quick Actions</h2>
        <div style="display:flex;flex-direction:column;gap:6px">
          <a href="/review/${esc(r.id)}/pdf" class="btn btn-ghost btn-sm" style="justify-content:flex-start">View PDF &amp; Highlights</a>
          <a href="/review/${esc(r.id)}/highlights" class="btn btn-ghost btn-sm" style="justify-content:flex-start">Highlight Threads</a>
          <a href="/review/${esc(r.id)}/sections" class="btn btn-ghost btn-sm" style="justify-content:flex-start">Section Report</a>
          <a href="/review/${esc(r.id)}/resolution" class="btn btn-ghost btn-sm" style="justify-content:flex-start">Resolution Tracker</a>
          <button onclick="exportPdf('${esc(r.id)}')" class="btn btn-ghost btn-sm" style="justify-content:flex-start">Export PDF</button>
          ${resolvedH < totalH && canEditReview ? `<button onclick="bulkResolve('${esc(r.id)}')" class="btn btn-success btn-sm" style="justify-content:flex-start">Bulk Resolve All</button>` : ''}
        </div>
      </div></div>
    </div>
  </div>`;

  function tablePanel(id, heading, countBadge, extraBtn, cols, bodyRows, emptyMsg) {
    return `<div id="rvpanel-${id}" class="rv-panel" style="display:none">
      <div class="card-clean"><div class="card-clean-body">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h2 style="font-size:0.875rem;font-weight:600">${heading}${countBadge ? ' (' + countBadge + ')' : ''}</h2>
          ${extraBtn || ''}
        </div>
        <div class="table-wrap"><table class="data-table">
          <thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
          <tbody>${bodyRows || `<tr><td colspan="${cols.length}" style="text-align:center;padding:3rem 0;color:var(--color-text-muted)">${emptyMsg}</td></tr>`}</tbody>
        </table></div>
      </div></div>
    </div>`;
  }

  const hRows = highlights.map(h => highlightRow(h)).join('');
  const highlightsPanel = tablePanel('highlights', 'Highlights', totalH,
    `<div style="display:flex;gap:12px;align-items:center">${totalH > 0 ? `<span style="font-size:0.875rem;color:var(--color-text-muted)">${resolvedH} resolved, ${totalH-resolvedH} open</span>` : ''}<a href="/review/${esc(r.id)}/pdf" class="btn btn-primary btn-sm">Open PDF</a></div>`,
    ['Highlight','Page','Status','By','Actions'], hRows,
    `<a href="/review/${esc(r.id)}/pdf" class="text-primary">Open PDF</a> to add highlights`);

  const collabRows = collaborators.map(c => collaboratorRow(c)).join('');
  const collabPanel = tablePanel('collaborators', 'Collaborators', collaborators.length,
    canEditReview ? `<button onclick="document.getElementById('collab-dialog').style.display='flex'" class="btn btn-primary btn-sm">+ Add Collaborator</button>` : '',
    ['User','Role','Expires','Actions'], collabRows, 'No collaborators yet');

  const clRows = checklists.map(cl => `<tr class="hover">
    <td style="font-size:0.875rem">${esc(cl.name||'-')}</td>
    <td style="font-size:0.875rem;color:var(--color-text-muted)">${cl.total_items||0} items</td>
    <td><div style="display:flex;align-items:center;gap:8px"><progress class="progress progress-primary" style="width:4rem" value="${cl.total_items>0?Math.round((cl.completed_items||0)/cl.total_items*100):0}" max="100"></progress><span style="font-size:0.75rem;color:var(--color-text-muted)">${cl.completed_items||0}/${cl.total_items||0}</span></div></td>
    <td><a href="/checklist/${esc(cl.id)}" class="btn btn-ghost btn-xs">View</a></td>
  </tr>`).join('');
  const checklistPanel = tablePanel('checklists', 'Checklists', checklists.length, '', ['Name','Items','Progress',''], clRows, 'No checklists attached');

  const secRows = sections.map(s => `<tr class="hover">
    <td style="font-size:0.875rem">${esc(s.name||s.title||'-')}</td>
    <td style="font-size:0.875rem;color:var(--color-text-muted)">${s.highlight_count||0}</td>
    <td style="font-size:0.875rem;color:var(--color-text-muted)">${s.resolved_count||0}</td>
  </tr>`).join('');
  const sectionsPanel = tablePanel('sections', 'Sections', sections.length,
    `<a href="/review/${esc(r.id)}/sections" class="btn btn-ghost btn-sm">Full Report &rarr;</a>`,
    ['Section','Highlights','Resolved'], secRows, 'No sections defined');

  const bc = [{ href: '/', label: 'Home' }, { href: '/review', label: 'Reviews' }, { label: r.name || 'Review' }];

  const content = `
    <div class="page-header">
      <div>
        <h1 class="page-title">${esc(r.name||r.title||'Review')}</h1>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap">
          ${statusBadge(r.status)}
          ${r.review_type ? `<span style="font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em">${esc(r.review_type)}</span>` : ''}
          ${r.financial_year ? `<span style="font-size:0.75rem;color:var(--color-text-light)">${esc(r.financial_year)}</span>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${canEditReview ? `<a href="/review/${esc(r.id)}/edit" class="btn btn-ghost btn-sm" style="border:1px solid var(--color-border)">Edit</a>` : ''}
        <a href="/review/${esc(r.id)}/pdf" class="btn btn-primary btn-sm">View PDF</a>
      </div>
    </div>
    ${reviewZoneNav(r.id, 'overview')}
    ${tabBar}
    ${overviewPanel}
    ${highlightsPanel}
    ${collabPanel}
    ${checklistPanel}
    ${sectionsPanel}
    ${addCollaboratorDialog(r.id)}
  `;

  return page(user, `${esc(r.name||'Review')} | MOONLANDING`, bc, content, [reviewDetailScript(r.id)]);
}
