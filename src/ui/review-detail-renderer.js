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
  return `<nav class="review-zone-nav" style="display:flex;gap:0;border-bottom:2px solid var(--color-border,#e5e7eb);margin-bottom:1.25rem;overflow-x:auto;scrollbar-width:none">
    ${links.map(l => `<a href="${l.href}" class="review-zone-tab${l.key===active?' active':''}" style="padding:0.5rem 1rem;font-size:0.85rem;font-weight:500;white-space:nowrap;border-bottom:2px solid ${l.key===active?'var(--color-primary,#6366f1)':'transparent'};margin-bottom:-2px;color:${l.key===active?'var(--color-primary,#6366f1)':'inherit'};text-decoration:none;transition:color 0.15s,border-color 0.15s" onmouseover="this.style.color='var(--color-primary,#6366f1)'" onmouseout="if('${l.key}'!=='${active}')this.style.color='inherit'">${l.label}</a>`).join('')}
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

  const tabBar = `<div class="tab-bar">${TABS.map((t, i) => `<button onclick="switchTab('${t.id}')" id="rvtab-${t.id}" class="tab-btn ${i===0?'active':''}">${t.label}</button>`).join('')}</div>`;

  const infoItems = [
    ['Name', esc(r.name||r.title||'-')],
    ['Status', statusBadge(r.status)],
    ['Type', esc(r.review_type||r.type||'-')],
    ['Financial Year', esc(r.financial_year||'-')],
    ['Deadline', fmtDate(r.deadline)],
    ['Created', fmtDate(r.created_at)],
    ['Highlights', totalH > 0 ? `${resolvedH}/${totalH} resolved` : '<span class="text-base-content/40">None yet</span>'],
  ];

  const infoGrid = infoItems.map(([l,v]) => `<div style="padding:0.5rem 0;border-bottom:1px solid var(--color-border,#e5e7eb)"><div style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted,#6b7280);margin-bottom:3px">${l}</div><div style="font-size:0.875rem">${v}</div></div>`).join('');
  const overviewPanel = `<div id="rvpanel-overview" class="rv-panel">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <h2 class="card-title text-sm" style="margin-bottom:0.75rem">Review Details</h2>
          ${infoGrid}
          ${totalH > 0 ? `<div style="margin-top:1rem"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:0.875rem;color:var(--color-text-muted,#6b7280)">Resolution Progress</span><span style="font-size:0.875rem;font-weight:600">${pct}%</span></div><progress class="progress progress-success" style="width:100%" value="${pct}" max="100"></progress></div>` : ''}
        </div>
      </div>
      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <h2 class="card-title text-sm" style="margin-bottom:0.75rem">Quick Actions</h2>
          <div style="display:flex;flex-direction:column;gap:0.375rem">
            <a href="/review/${esc(r.id)}/pdf" class="btn btn-ghost btn-sm" style="justify-content:flex-start">View PDF &amp; Highlights</a>
            <a href="/review/${esc(r.id)}/highlights" class="btn btn-ghost btn-sm" style="justify-content:flex-start">Highlight Threads</a>
            <a href="/review/${esc(r.id)}/sections" class="btn btn-ghost btn-sm" style="justify-content:flex-start">Section Report</a>
            <a href="/review/${esc(r.id)}/resolution" class="btn btn-ghost btn-sm" style="justify-content:flex-start">Resolution Tracker</a>
            <button onclick="exportPdf('${esc(r.id)}')" class="btn btn-ghost btn-sm" style="justify-content:flex-start">Export PDF</button>
            ${resolvedH < totalH && canEditReview ? `<button onclick="bulkResolve('${esc(r.id)}')" class="btn btn-success btn-sm" style="justify-content:flex-start">Bulk Resolve All</button>` : ''}
          </div>
        </div>
      </div>
    </div>
  </div>`;

  const hRows = highlights.map(h => highlightRow(h)).join('') ||
    `<tr><td colspan="5" style="text-align:center;padding:3rem 0;color:var(--color-text-muted,#6b7280)"><div style="font-size:2rem;margin-bottom:0.5rem;opacity:0.3">&#128172;</div><div style="font-weight:600;margin-bottom:0.25rem">No highlights yet</div><div style="font-size:0.875rem"><a href="/review/${esc(r.id)}/pdf" class="link link-primary">Open PDF</a> to add highlights</div></td></tr>`;
  const highlightsPanel = `<div id="rvpanel-highlights" class="rv-panel" style="display:none">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-sm">Highlights (${totalH})</h2>
          <div class="flex gap-3 items-center">
            ${totalH > 0 ? `<span class="text-sm text-base-content/50">${resolvedH} resolved, ${totalH-resolvedH} open</span>` : ''}
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
    `<tr><td colspan="4" style="text-align:center;padding:3rem 0;color:var(--color-text-muted,#6b7280)"><div style="font-size:2rem;margin-bottom:0.5rem;opacity:0.3">&#128101;</div><div style="font-weight:600;margin-bottom:0.25rem">No collaborators yet</div>${canEditReview ? '<div style="font-size:0.875rem">Add collaborators to share this review</div>' : ''}</td></tr>`;
  const collabPanel = `<div id="rvpanel-collaborators" class="rv-panel" style="display:none">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-sm">Collaborators</h2>
          ${canEditReview ? `<button onclick="document.getElementById('collab-dialog').style.display='flex'" class="btn btn-primary btn-sm">+ Add Collaborator</button>` : ''}
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
    <td><div class="flex items-center gap-2"><progress class="progress progress-primary w-16" value="${cl.total_items>0?Math.round((cl.completed_items||0)/cl.total_items*100):0}" max="100"></progress><span class="text-xs text-base-content/50">${cl.completed_items||0}/${cl.total_items||0}</span></div></td>
    <td><a href="/checklist/${esc(cl.id)}" class="btn btn-ghost btn-xs">View</a></td>
  </tr>`).join('') || `<tr><td colspan="4" style="text-align:center;padding:3rem 0;color:var(--color-text-muted,#6b7280)"><div style="font-size:2rem;margin-bottom:0.5rem;opacity:0.3">&#9989;</div><div style="font-weight:600">No checklists attached</div></td></tr>`;

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
  </tr>`).join('') || `<tr><td colspan="3" style="text-align:center;padding:3rem 0;color:var(--color-text-muted,#6b7280)"><div style="font-size:2rem;margin-bottom:0.5rem;opacity:0.3">&#128203;</div><div style="font-weight:600">No sections defined</div></td></tr>`;

  const sectionsPanel = `<div id="rvpanel-sections" class="rv-panel" style="display:none">
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-sm">Sections</h2>
          <a href="/review/${esc(r.id)}/sections" class="btn btn-ghost btn-sm">Full Report &rarr;</a>
        </div>
        <div class="table-container">
          <table class="table table-hover"><thead><tr><th>Section</th><th>Highlights</th><th>Resolved</th></tr></thead><tbody>${secRows}</tbody></table>
        </div>
      </div>
    </div>
  </div>`;

  const bc = [{ href: '/', label: 'Home' }, { href: '/review', label: 'Reviews' }, { label: r.name || 'Review' }];

  const content = `
    <div class="flex justify-between items-start mb-3 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-base-content mb-1">${esc(r.name||r.title||'Review')}</h1>
        <div class="flex items-center gap-2 flex-wrap">${statusBadge(r.status)}${r.review_type ? `<span class="text-xs text-base-content/50 uppercase tracking-wider">${esc(r.review_type)}</span>` : ''}${r.financial_year ? `<span class="text-xs text-base-content/40">${esc(r.financial_year)}</span>` : ''}</div>
      </div>
      <div class="flex gap-2 flex-wrap">
        ${canEditReview ? `<a href="/review/${esc(r.id)}/edit" class="btn btn-ghost btn-sm border border-base-300">Edit</a>` : ''}
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
