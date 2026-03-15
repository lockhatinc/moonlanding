import { page } from '@/ui/layout.js';
import { reviewZoneNav } from '@/ui/review-zone-nav.js';
import { SPACING, renderCard, renderButton, renderProgress, renderEmptyState, renderStatsRow, renderPageHeader } from '@/ui/spacing-system.js';

const TOAST_SCRIPT = `window.showToast=(m,t='info')=>{let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.className='toast-container';c.setAttribute('role','status');c.setAttribute('aria-live','polite');c.setAttribute('aria-atomic','true');document.body.appendChild(c)}const d=document.createElement('div');d.className='toast toast-'+t;d.textContent=m;c.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},3000)};`;

function fmtDate(ts) {
  if (!ts) return '-';
  const n = Number(ts);
  if (!isNaN(n) && n > 1e9 && n < 3e9) return new Date(n * 1000).toLocaleDateString();
  return String(ts);
}

function statusBadge(status) {
  const s = status || 'open';
  const map = { active: 'pill pill-info', open: 'pill pill-info', in_progress: 'pill pill-info', completed: 'pill pill-success', closed: 'pill pill-success', archived: 'pill pill-neutral' };
  const cls = map[s] || 'pill pill-warning';
  return `<span class="${cls}">${s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>`;
}

export function renderMwrHome(user, stats) {
  const { myReviews = [], sharedReviews = [], recentActivity = [], totalReviews = 0, activeReviews = 0, flaggedReviews = 0, overdueReviews = 0 } = stats;

  const statsHtml = renderStatsRow([
    { value: totalReviews, label: 'Total Reviews' },
    { value: activeReviews, label: 'Active', color: 'var(--color-primary)' },
    { value: flaggedReviews, label: 'Flagged', color: 'var(--color-warning)' },
    { value: overdueReviews, label: 'Overdue', color: overdueReviews > 0 ? 'var(--color-danger)' : undefined },
  ]);

  const tabBar = `<nav class="tab-bar" style="margin-bottom:${SPACING.md}">
    <button class="tab-btn active" data-tab="my" data-action="switchHomeTab" data-args='["my"]'>My Reviews<span class="tab-count">${myReviews.length}</span></button>
    <button class="tab-btn" data-tab="shared" data-action="switchHomeTab" data-args='["shared"]'>Shared With Me<span class="tab-count">${sharedReviews.length}</span></button>
    <button class="tab-btn" data-tab="activity" data-action="switchHomeTab" data-args='["activity"]'>Recent Activity<span class="tab-count">${recentActivity.length}</span></button>
  </nav>`;

  function listItem(r) {
    return `<div class="list-item-row" data-navigate="/review/${r.id}">
      <span class="list-item-name">${r.name || 'Untitled'}</span>
      <div class="list-item-meta">${statusBadge(r.status)}<span style="font-size:12px;color:var(--color-text-light)">${fmtDate(r.updated_at || r.created_at)}</span></div>
    </div>`;
  }

  const myList = myReviews.length ? myReviews.map(listItem).join('') : renderEmptyState('No reviews yet');
  const sharedList = sharedReviews.length ? sharedReviews.map(r => listItem(r)).join('') : renderEmptyState('No shared reviews');
  const actList = recentActivity.length ? recentActivity.slice(0, 20).map(a => `<div class="activity-item-row"><span class="activity-item-date">${fmtDate(a.created_at)}</span><span class="activity-item-desc">${a.description || a.action || '-'}</span></div>`).join('') : renderEmptyState('No recent activity');

  const panels = `<div id="home-panel-my">${myList}</div><div id="home-panel-shared" style="display:none">${sharedList}</div><div id="home-panel-activity" style="display:none">${actList}</div>`;

  const content = `${renderPageHeader('MWR Home', `Welcome back, ${user?.name || 'User'}`)}${statsHtml}${tabBar}${renderCard(panels, { padding: 0 })}`;
  const script = `window.switchHomeTab=(key)=>{document.querySelectorAll('.tab-btn[data-tab]').forEach(t=>t.classList.toggle('active',t.dataset.tab===key));document.querySelectorAll('[id^="home-panel-"]').forEach(p=>p.style.display='none');const el=document.getElementById('home-panel-'+key);if(el)el.style.display='block'}`;
  const bc = [{ href: '/', label: 'Dashboard' }, { label: 'MWR Home' }];
  return page(user, 'MWR Home | MOONLANDING', bc, content, [script]);
}

export function renderSectionReport(user, review, sections) {
  const total = sections.reduce((s, sec) => s + (sec.highlights_count || 0), 0);
  const resolved = sections.reduce((s, sec) => s + (sec.resolved_count || 0), 0);
  const flagged = sections.reduce((s, sec) => s + (sec.flagged_count || 0), 0);

  const tableRows = sections.map((sec, i) => {
    const pct = sec.highlights_count > 0 ? Math.round((sec.resolved_count || 0) / sec.highlights_count * 100) : 0;
    return `<tr>
      <td>${sec.name || `Section ${i + 1}`}</td>
      <td style="text-align:center">${sec.highlights_count || 0}</td>
      <td style="text-align:center">${sec.resolved_count || 0}</td>
      <td style="text-align:center">${sec.flagged_count || 0}</td>
      <td style="text-align:center"><div class="resolution-bar" style="width:80px;display:inline-block"><div class="resolution-bar-segment resolution-bar-resolved" style="width:${pct}%"></div></div> <span style="font-size:12px;color:var(--color-text-muted)">${pct}%</span></td>
    </tr>`;
  }).join('');

  const summaryRow = `<tr style="font-weight:700;background:var(--color-bg)">
    <td>Total</td>
    <td style="text-align:center">${total}</td>
    <td style="text-align:center">${resolved}</td>
    <td style="text-align:center">${flagged}</td>
    <td style="text-align:center">${total > 0 ? Math.round(resolved / total * 100) : 0}%</td>
  </tr>`;

  const pageHeader = renderPageHeader(
    `Section Report: ${review.name || 'Review'}`,
    '',
    `${renderButton('Print', { variant: 'ghost', size: 'sm', action: 'printPage' })}
     ${renderButton('Export CSV', { variant: 'primary', size: 'sm', action: 'exportSectionReport' })}`
  );

  const content = `${pageHeader}
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Section</th><th style="text-align:center">Highlights</th><th style="text-align:center">Resolved</th><th style="text-align:center">Flagged</th><th style="text-align:center">Progress</th></tr></thead>
        <tbody>${tableRows}${summaryRow}</tbody>
      </table>
    </div>`;

  const bc = [{ href: '/', label: 'Home' }, { href: '/review', label: 'Reviews' }, { href: `/review/${review.id}`, label: review.name || 'Review' }, { label: 'Sections' }];
  const exportScript = `window.exportSectionReport=function(){var rows=[['Section','Highlights','Resolved','Flagged','Progress']];document.querySelectorAll('tbody tr').forEach(function(r){var cells=[];r.querySelectorAll('td').forEach(function(c){cells.push(c.textContent.trim())});if(cells.length)rows.push(cells)});var csv=rows.map(function(r){return r.join(',')}).join('\\n');var b=new Blob([csv],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='section-report.csv';a.click()}`;
  return page(user, `${review.name || 'Review'} | Sections`, bc, reviewZoneNav(review.id, 'sections') + content, [exportScript]);
}
