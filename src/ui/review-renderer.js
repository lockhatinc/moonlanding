import { canCreate, canEdit, canDelete } from '@/ui/permissions-ui.js';
import { page } from '@/ui/layout.js';
import { reviewZoneNav } from '@/ui/review-zone-nav.js';
import { reviewCreateDialog, reviewTemplateChoiceDialog, reviewContextMenu, reviewFlagsDialog, reviewTagsDialog, reviewValueDialog, reviewDeadlineDialog, reviewNotificationDialog } from '@/ui/review-dialogs.js';
import { SPACING, renderCard, renderTable, renderFlex, renderButton, renderProgress, renderEmptyState, renderStatsRow, renderPageHeader } from '@/ui/spacing-system.js';

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
  const map = { active: 'pill pill-info', open: 'pill pill-info', in_progress: 'pill pill-info', completed: 'pill pill-success', closed: 'pill pill-success', archived: 'pill pill-neutral' };
  const cls = map[s] || 'pill pill-warning';
  return `<span class="${cls}">${s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>`;
}

function reviewRow(r) {
  return `<tr class="review-row" data-status="${r.status || ''}" data-flags="${r.flags_count || 0}" data-highlights="${r.highlights_count || 0}" data-archived="${r.archived || 0}" data-priority="${(r.is_priority || r.flagged || (r.flags_count > 0)) ? 1 : 0}" data-stage="${r.stage || r.status || ''}" data-navigate="/review/${r.id}" oncontextmenu="showCtxMenu(event,'${r.id}')" style="cursor:pointer">
    <td style="font-weight:500;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.name || r.title || 'Untitled'}</td>
    <td style="font-size:13px;color:var(--color-text-muted)">${r.engagement_name || r.engagement_id_display || '-'}</td>
    <td>${statusBadge(r.status)}</td>
    <td style="text-align:center;font-size:13px">${r.highlights_count !== undefined ? r.highlights_count : '-'}</td>
    <td style="font-size:13px">${fmtDate(r.deadline)}</td>
    <td style="font-size:13px;color:var(--color-text-light)">${fmtDate(r.created_at)}</td>
  </tr>`;
}

export function renderReviewListTabbed(user, reviews) {
  const counts = {};
  TAB_DEFS.forEach(t => { counts[t.key] = reviews.filter(t.filter).length; });

  const tabBar = `<nav class="tab-bar" style="margin-bottom:${SPACING.lg}">
    ${TAB_DEFS.map(t => `<button class="tab-btn${t.key === 'all' ? ' active' : ''}" data-tab="${t.key}" onclick="switchTab('${t.key}')">${t.label}<span class="tab-count">${counts[t.key]}</span></button>`).join('')}
  </nav>`;

  const createBtn = canCreate(user, 'review')
    ? renderButton('New Review', { variant: 'primary', size: 'sm', onclick: "document.getElementById('review-create-dialog').style.display='flex'" })
    : '';

  const pageHeader = renderPageHeader(
    'Reviews',
    `${reviews.length} total`,
    `<label for="review-search" class="sr-only">Search reviews</label>
     <input type="text" id="review-search" placeholder="Search reviews..." class="form-input" style="max-width:220px;height:36px" aria-label="Search reviews"/>
     ${createBtn}`
  );

  const reviewRows = reviews.length ? reviews.map(reviewRow).join('') : '';
  const emptyState = reviews.length === 0 ? renderEmptyState(
    `<div style="font-size:32px;margin-bottom:12px;opacity:0.3">&#128196;</div>
     <div style="font-weight:600;margin-bottom:4px">No reviews yet</div>
     <div style="font-size:13px">Start a new review to get started.</div>`
  ) : '';

  const tableWrap = `<div class="table-wrap">
    <div class="table-toolbar">
      <div class="table-search"></div>
      <span class="table-count" id="row-count">${reviews.length} items</span>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Engagement</th>
          <th>Status</th>
          <th style="text-align:center">Highlights</th>
          <th>Deadline</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody id="review-tbody">${reviewRows || `<tr><td colspan="6">${emptyState}</td></tr>`}</tbody>
    </table>
  </div>`;

  const content = `${pageHeader}${tabBar}${tableWrap}${reviewContextMenu()}`;
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/review', label: 'Reviews' }];

  const tabScript = `window.switchTab=function(key){
    document.querySelectorAll('.tab-btn[data-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.tab===key)});
    var rows=document.querySelectorAll('#review-tbody tr.review-row');var count=0;
    rows.forEach(function(r){var show=true;
      if(key==='active')show=r.dataset.status==='active'||r.dataset.status==='open'||r.dataset.status==='in_progress';
      else if(key==='priority')show=r.dataset.priority==='1';
      else if(key==='history')show=r.dataset.status==='completed'||r.dataset.status==='closed';
      else if(key==='archive')show=r.dataset.status==='archived'||r.dataset.archived==='1';
      r.style.display=show?'':'none';if(show)count++;
    });
    var el=document.getElementById('row-count');if(el)el.textContent=count+' items';
  }`;

  const ctxScript = `var ctxEl=document.getElementById('review-ctx-menu');
  window.showCtxMenu=function(e,id){e.preventDefault();if(!ctxEl)return;ctxEl.dataset.reviewId=id;ctxEl.style.display='block';ctxEl.style.left=e.pageX+'px';ctxEl.style.top=e.pageY+'px'};
  document.addEventListener('click',function(){if(ctxEl)ctxEl.style.display='none'});
  window.ctxAction=function(action){var id=ctxEl&&ctxEl.dataset.reviewId;if(!id)return;
    if(action==='open')window.location='/review/'+id;
    else if(action==='pdf')window.location='/review/'+id+'/pdf';
    else if(action==='edit')window.location='/review/'+id+'/edit';
    else if(action==='highlights')window.location='/review/'+id+'/highlights';
  }`;

  const searchScript = `(function(){var input=document.getElementById('review-search');if(!input)return;
    input.addEventListener('input',function(){var q=input.value.toLowerCase();
      document.querySelectorAll('#review-tbody tr.review-row').forEach(function(r){
        var text=r.textContent.toLowerCase();r.style.display=text.indexOf(q)>=0?'':'none';
      });
    });
  })()`;

  return page(user, 'Reviews', bc, content, [TOAST_SCRIPT, tabScript, ctxScript, searchScript]);
}

export function reviewSearchField() {
  return `<label for="review-search" class="sr-only">Search reviews</label><input type="text" id="review-search" placeholder="Search reviews..." class="form-input" style="max-width:220px;height:36px" aria-label="Search reviews"/>`;
}

export function hideEmptyReviewsToggle() {
  return `<label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--color-text-muted);cursor:pointer" title="Hide reviews with 0 highlights"><input type="checkbox" id="hide-empty-toggle"/>Hide empty</label>`;
}

export function reviewGroupedList(reviews, groupBy) {
  const groups = {};
  reviews.forEach(r => {
    const key = r[groupBy] || r[`${groupBy}_name`] || r[`${groupBy}_id`] || 'Ungrouped';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return Object.entries(groups).map(([name, items]) =>
    `<div class="card-clean" style="margin-bottom:${SPACING.md}">
      <div class="card-clean-body" style="padding:${SPACING.md}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${SPACING.sm};cursor:pointer" onclick="this.parentElement.querySelector('.review-group-items').classList.toggle('collapsed')">
          <span style="font-weight:600;font-size:14px">${name}</span>
          <span class="pill pill-neutral">${items.length}</span>
        </div>
        <div class="review-group-items">
          ${items.map(r => `<div class="list-item-row" style="padding:8px 0" data-navigate="/review/${r.id}">
            <span class="list-item-name">${r.name || r.title || 'Untitled'}</span>
            ${r.status ? statusBadge(r.status) : ''}
          </div>`).join('')}
        </div>
      </div>
    </div>`
  ).join('');
}

export function renderReviewSections(user, review, sections) {
  const totalHighlights = sections.reduce((s, sec) => s + (sec.highlights_count || 0), 0);
  const resolvedHighlights = sections.reduce((s, sec) => s + (sec.resolved_count || 0), 0);
  const pct = totalHighlights > 0 ? Math.round(resolvedHighlights / totalHighlights * 100) : 0;

  const statsHtml = renderStatsRow([
    { value: sections.length, label: 'Sections' },
    { value: totalHighlights, label: 'Total Highlights' },
    { value: resolvedHighlights, label: 'Resolved', color: 'var(--color-success)' },
    { value: `${pct}%`, label: 'Progress' },
  ]);

  const sectionRows = sections.map((sec, i) => {
    const secPct = sec.highlights_count > 0 ? Math.round((sec.resolved_count || 0) / sec.highlights_count * 100) : 0;
    return `<div class="card-clean" style="margin-bottom:${SPACING.sm}">
      <div class="card-clean-body" style="padding:${SPACING.md}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${SPACING.sm}">
          <span style="font-weight:600;font-size:14px">${sec.name || `Section ${i + 1}`}</span>
          <span style="font-size:13px;color:var(--color-text-muted)">${sec.highlights_count || 0} highlights</span>
        </div>
        <div class="resolution-bar" style="margin-bottom:${SPACING.xs}">
          <div class="resolution-bar-segment resolution-bar-resolved" style="width:${secPct}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--color-text-muted)">
          <span>Resolved: ${sec.resolved_count || 0}</span>
          <span>Flagged: ${sec.flagged_count || 0}</span>
          <span>${secPct}%</span>
        </div>
      </div>
    </div>`;
  }).join('');

  const content = `${renderPageHeader(`Sections: ${review.name || 'Review'}`, '')}${statsHtml}${sectionRows || renderEmptyState('No sections found')}`;
  const bc = [{ href: '/', label: 'Dashboard' }, { href: '/review', label: 'Reviews' }, { href: `/review/${review.id}`, label: review.name || 'Review' }, { label: 'Sections' }];
  return page(user, `Sections - ${review.name || 'Review'}`, bc, content);
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
    `${renderButton('Print', { variant: 'ghost', size: 'sm', onclick: "window.print()" })}
     ${renderButton('Export CSV', { variant: 'primary', size: 'sm', onclick: "exportSectionReport()" })}`
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

export function renderMwrHome(user, stats) {
  const { myReviews = [], sharedReviews = [], recentActivity = [], totalReviews = 0, activeReviews = 0, flaggedReviews = 0, overdueReviews = 0 } = stats;

  const statsHtml = renderStatsRow([
    { value: totalReviews, label: 'Total Reviews' },
    { value: activeReviews, label: 'Active', color: 'var(--color-primary)' },
    { value: flaggedReviews, label: 'Flagged', color: 'var(--color-warning)' },
    { value: overdueReviews, label: 'Overdue', color: overdueReviews > 0 ? 'var(--color-danger)' : undefined },
  ]);

  const tabBar = `<nav class="tab-bar" style="margin-bottom:${SPACING.md}">
    <button class="tab-btn active" data-tab="my" onclick="switchHomeTab('my')">My Reviews<span class="tab-count">${myReviews.length}</span></button>
    <button class="tab-btn" data-tab="shared" onclick="switchHomeTab('shared')">Shared With Me<span class="tab-count">${sharedReviews.length}</span></button>
    <button class="tab-btn" data-tab="activity" onclick="switchHomeTab('activity')">Recent Activity<span class="tab-count">${recentActivity.length}</span></button>
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
  return page(user, 'MWR Home', bc, content, [script]);
}
