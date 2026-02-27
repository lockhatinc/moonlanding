import { page } from '@/ui/layout.js';
import { reviewZoneNav } from '@/ui/review-zone-nav.js';
export { reviewZoneNav };
import { canEdit } from '@/ui/permissions-ui.js';
import { esc, statusBadge, TOAST_SCRIPT } from '@/ui/render-helpers.js';
import { reviewDetailScript } from '@/ui/review-detail-script.js';
import { highlightRow, collaboratorRow, addCollaboratorDialog } from '@/ui/review-detail-panels.js';
import { SPACING, renderCard, renderTable, renderButton, renderInfoGrid } from '@/ui/spacing-system.js';

function fmtDate(ts) {
  if (!ts) return '-';
  const n = Number(ts);
  if (!isNaN(n) && n > 1e9 && n < 3e9) return new Date(n * 1000).toLocaleDateString();
  try { return new Date(ts).toLocaleDateString(); } catch { return String(ts); }
}

export function renderReviewDetail(user, review, highlights = [], collaborators = [], checklists = [], sections = []) {
  const r = review || {};
  const canEditReview = canEdit(user, 'review');
  const totalH = highlights.length;
  const resolvedH = highlights.filter(h => h.resolved || h.status === 'resolved').length;
  const openH = totalH - resolvedH;
  const pct = totalH > 0 ? Math.round((resolvedH / totalH) * 100) : 0;

  const TABS = [
    { id: 'overview', label: 'Overview', count: undefined },
    { id: 'highlights', label: 'Highlights', count: totalH },
    { id: 'collaborators', label: 'Collaborators', count: collaborators.length },
    { id: 'checklists', label: 'Checklists', count: checklists.length },
    { id: 'sections', label: 'Sections', count: sections.length },
  ];

  const tabBar = `<nav class="tab-bar" style="margin-bottom:${SPACING.lg}">
    ${TABS.map((t, i) => `<button onclick="switchTab('${t.id}')" id="rvtab-${t.id}" class="tab-btn${i === 0 ? ' active' : ''}" aria-selected="${i === 0}">${t.label}${t.count !== undefined ? `<span class="tab-count">${t.count}</span>` : ''}</button>`).join('')}
  </nav>`;

  const infoGrid = renderInfoGrid([
    ['Name', esc(r.name || r.title || '-')],
    ['Status', statusBadge(r.status)],
    ['Type', esc(r.review_type || r.type || '-')],
    ['Financial Year', esc(r.financial_year || '-')],
    ['Deadline', fmtDate(r.deadline)],
    ['Created', fmtDate(r.created_at)],
  ]);

  const progressSection = totalH > 0
    ? `<div style="margin-top:${SPACING.md}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${SPACING.sm}">
          <span style="font-size:13px;font-weight:600;color:var(--color-text-muted)">Resolution</span>
          <span style="font-size:13px;color:var(--color-text-light)">${resolvedH}/${totalH} resolved</span>
        </div>
        <div class="resolution-bar">
          <div class="resolution-bar-segment resolution-bar-resolved" style="width:${pct}%"></div>
        </div>
      </div>`
    : `<div style="margin-top:${SPACING.md};font-size:13px;color:var(--color-text-light)">No highlights yet</div>`;

  const detailsCard = renderCard(`<div class="card-header">Review Details</div>${infoGrid}${progressSection}`, { padding: SPACING.md });

  const actions = [];
  actions.push(renderButton('Open PDF', { variant: 'primary', size: 'sm', href: `/review/${esc(r.id)}/pdf` }));
  actions.push(renderButton('Discussions', { variant: 'ghost', size: 'sm', href: `/review/${esc(r.id)}/highlights` }));
  actions.push(renderButton('Sections', { variant: 'ghost', size: 'sm', href: `/review/${esc(r.id)}/sections` }));
  actions.push(renderButton('Resolution', { variant: 'ghost', size: 'sm', href: `/review/${esc(r.id)}/resolution` }));
  if (canEditReview) {
    actions.push(renderButton('Edit', { variant: 'outline', size: 'sm', href: `/review/${esc(r.id)}/edit` }));
    actions.push(renderButton('Export PDF', { variant: 'ghost', size: 'sm', onclick: `exportPdf('${esc(r.id)}')` }));
  }
  if (resolvedH < totalH && canEditReview) {
    actions.push(renderButton('Bulk Resolve', { variant: 'success', size: 'sm', onclick: `bulkResolve('${esc(r.id)}')` }));
  }

  const overviewPanel = `<div id="rvpanel-overview" class="rv-panel">
    ${detailsCard}
  </div>`;

  function tablePanel(id, heading, countBadge, extraBtn, cols, bodyRows, emptyMsg) {
    const header = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${SPACING.md}">
      <div><span style="font-size:15px;font-weight:600;color:var(--color-text)">${heading}</span>${countBadge ? `<span style="font-size:13px;color:var(--color-text-muted);margin-left:8px">(${countBadge})</span>` : ''}</div>
      <div style="display:flex;align-items:center;gap:8px">${extraBtn || ''}</div>
    </div>`;
    const table = renderTable(cols,
      bodyRows || `<tr><td colspan="${cols.length}" style="text-align:center;padding:${SPACING.xl} 0;color:var(--color-text-muted)">${emptyMsg}</td></tr>`,
      SPACING.md);
    return `<div id="rvpanel-${id}" class="rv-panel" style="display:none">${header}${table}</div>`;
  }

  const hRows = highlights.map(h => highlightRow(h)).join('');
  const highlightsPanel = tablePanel('highlights', 'Highlights', totalH,
    `<span style="font-size:13px;color:var(--color-text-muted)">${resolvedH} resolved, ${openH} open</span>${renderButton('Open PDF', { variant: 'primary', size: 'sm', href: `/review/${esc(r.id)}/pdf` })}`,
    ['Highlight', 'Page', 'Status', 'By', 'Actions'], hRows,
    `<a href="/review/${esc(r.id)}/pdf" style="color:var(--color-primary);font-weight:500;text-decoration:none">Open the PDF</a> to start adding highlights`);

  const collabRows = collaborators.map(c => collaboratorRow(c)).join('');
  const collabPanel = tablePanel('collaborators', 'Collaborators', collaborators.length,
    canEditReview ? renderButton('+ Add Collaborator', { variant: 'primary', size: 'sm', onclick: "document.getElementById('collab-dialog').style.display='flex'" }) : '',
    ['User', 'Role', 'Expires', 'Actions'], collabRows, 'No collaborators added yet');

  const clRows = checklists.map(cl => {
    const clPct = cl.total_items > 0 ? Math.round((cl.completed_items || 0) / cl.total_items * 100) : 0;
    return `<tr>
      <td style="font-weight:500">${esc(cl.name || '-')}</td>
      <td style="font-size:13px;color:var(--color-text-muted)">${cl.total_items || 0} items</td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="resolution-bar" style="width:80px"><div class="resolution-bar-segment resolution-bar-resolved" style="width:${clPct}%"></div></div><span style="font-size:12px;color:var(--color-text-muted)">${cl.completed_items || 0}/${cl.total_items || 0}</span></div></td>
      <td><a href="/checklist/${esc(cl.id)}" class="btn-ghost-clean" style="font-size:13px;padding:4px 10px">View</a></td>
    </tr>`;
  }).join('');
  const checklistPanel = tablePanel('checklists', 'Checklists', checklists.length, '', ['Name', 'Items', 'Progress', ''], clRows, 'No checklists attached');

  const secRows = sections.map(s => `<tr>
    <td style="font-weight:500">${esc(s.name || s.title || '-')}</td>
    <td style="text-align:center;font-size:13px;color:var(--color-text-muted)">${s.highlight_count || 0}</td>
    <td style="text-align:center;font-size:13px;color:var(--color-text-muted)">${s.resolved_count || 0}</td>
  </tr>`).join('');
  const sectionsPanel = tablePanel('sections', 'Sections', sections.length,
    renderButton('Full Report', { variant: 'primary', size: 'sm', href: `/review/${esc(r.id)}/sections` }),
    ['Section', 'Highlights', 'Resolved'], secRows, 'No sections defined');

  const bc = [{ href: '/', label: 'Home' }, { href: '/review', label: 'Reviews' }, { href: `/review/${r.id}`, label: r.name || 'Review' }, { label: 'Overview' }];

  const metaTags = [statusBadge(r.status),
    r.review_type ? `<span class="pill pill-neutral" style="text-transform:uppercase;font-size:11px;letter-spacing:0.5px">${esc(r.review_type)}</span>` : '',
    r.financial_year ? `<span style="font-size:13px;color:var(--color-text-muted)">FY ${esc(r.financial_year)}</span>` : '',
    pct === 100 ? `<span class="pill pill-success">Complete</span>` : '',
  ].filter(Boolean).join(' ');

  const pageHeader = `<div class="page-header" style="align-items:flex-start">
    <div><h1 class="page-title">${esc(r.name || r.title || 'Review')}</h1><div class="review-meta-row">${metaTags}</div></div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">${actions.join('')}</div>
  </div>`;

  const content = `${pageHeader}${reviewZoneNav(r.id, 'overview')}${tabBar}
    <div>${overviewPanel}${highlightsPanel}${collabPanel}${checklistPanel}${sectionsPanel}${addCollaboratorDialog(r.id)}</div>`;

  return page(user, `${esc(r.name || 'Review')} | MOONLANDING`, bc, content, [reviewDetailScript(r.id)]);
}
