import { page } from '@/ui/layout.js';
import { canCreate } from '@/ui/permissions-ui.js';
import { esc, stagePill, statusPill, progressBar, STAGE_CONFIG, TABLE_SCRIPT } from '@/ui/render-helpers.js';

function engRow(e) {
  const name = esc(e.name || e.client_name || 'Untitled');
  const client = esc(e.client_name || e.client_id_display || e.client_id || '-');
  const type = esc(e.type || e.engagement_type || e.repeat_interval || '-');
  const year = esc(e.year || '-');
  const team = esc(e.team_name || e.team_id_display || e.team_id || '-');
  const deadline = e.deadline ? new Date(e.deadline).toLocaleDateString() : '-';
  const stageLbl = STAGE_CONFIG.find(s => s.key === e.stage)?.label || (e.stage || '-');
  return `<tr data-row data-navigate="/engagement/${esc(e.id)}" style="cursor:pointer">
    <td data-col="name"><strong>${name}</strong></td>
    <td data-col="client">${client}</td>
    <td data-col="type">${type}</td>
    <td data-col="year">${year}</td>
    <td data-col="team">${team}</td>
    <td data-col="stage">${stagePill(e.stage)}</td>
    <td data-col="stage-raw" style="display:none">${stageLbl}</td>
    <td data-col="status">${statusPill(e.status)}</td>
    <td data-col="deadline">${deadline}</td>
    <td data-col="rfi" style="text-align:center">${e.rfi_count != null ? e.rfi_count : '-'}</td>
    <td>${progressBar(e.progress)}</td>
  </tr>`;
}

export function renderEngagementGrid(user, engagements, options = {}) {
  const { filter = 'all', teams = [], years = [] } = options;
  const myEng = engagements.filter(e => e.assigned_to === user?.id || (Array.isArray(e.users) && e.users.includes(user?.id)));
  const teamEng = engagements.filter(e => e.team_id === user?.team_id);

  const stageCounts = {};
  STAGE_CONFIG.forEach(s => { stageCounts[s.key] = 0; });
  engagements.forEach(e => { if (stageCounts[e.stage] !== undefined) stageCounts[e.stage]++; });

  const stageStats = `<div class="stats-row">${STAGE_CONFIG.map(s =>
    `<div class="stat-card stat-card-clickable" onclick="filterByStage('${s.key}')" id="stage-card-${s.key}">
      <div class="stat-card-value">${stageCounts[s.key]||0}</div>
      <div class="stat-card-label">${s.label}</div>
    </div>`
  ).join('')}</div>`;

  const tabs = [
    { key: 'all',  label: 'All Engagements', count: engagements.length },
    { key: 'my',   label: 'My Engagements',  count: myEng.length },
    { key: 'team', label: 'Team',            count: teamEng.length },
  ];

  const tabBar = `<div class="tab-bar">${tabs.map(t =>
    `<button class="tab-btn${t.key === filter ? ' active' : ''}" onclick="switchTab('${t.key}')" id="tab-${t.key}">${t.label}<span class="tab-count">${t.count}</span></button>`
  ).join('')}</div>`;

  const addBtn = canCreate(user, 'engagement')
    ? `<a href="/engagement/new" class="btn-primary-clean"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Engagement</a>`
    : '';

  const stageOpts = STAGE_CONFIG.map(s => `<option value="${s.key}">${s.label}</option>`).join('');
  const teamOpts = teams.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
  const yearOpts = years.map(y => `<option value="${esc(y)}">${esc(y)}</option>`).join('');

  const rows = engagements.map(e => engRow(e)).join('') ||
    `<tr><td colspan="11" style="text-align:center;padding:48px;color:var(--color-text-muted)">No engagements found</td></tr>`;

  const content = `<div class="page-header">
        <div><h1 class="page-title">Engagements</h1><p class="page-subtitle">${engagements.length} total engagements</p></div>
        ${addBtn}
      </div>
      ${stageStats}${tabBar}
      <div class="table-wrap">
        <div class="table-toolbar">
          <div class="table-search"><input id="search-input" type="text" placeholder="Search engagements..."></div>
          ${stageOpts ? `<div class="table-filter"><select data-filter="stage-raw" id="filter-stage"><option value="">All Stages</option>${stageOpts}</select></div>` : ''}
          ${teamOpts ? `<div class="table-filter"><select data-filter="team" id="filter-team"><option value="">All Teams</option>${teamOpts}</select></div>` : ''}
          ${yearOpts ? `<div class="table-filter"><select data-filter="year" id="filter-year"><option value="">All Years</option>${yearOpts}</select></div>` : ''}
          <span class="table-count" id="row-count">${engagements.length} items</span>
        </div>
        <table class="data-table">
          <thead><tr>
            <th data-sort="name">Name</th><th data-sort="client">Client</th><th data-sort="type">Type</th>
            <th data-sort="year">Year</th><th data-sort="team">Team</th><th data-sort="stage-raw">Stage</th>
            <th style="display:none"></th><th data-sort="status">Status</th><th data-sort="deadline">Deadline</th>
            <th data-sort="rfi" style="text-align:center">RFI</th><th>Progress</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

  const stageFilterScript = `var _activeStage='';function filterByStage(stage){_activeStage=_activeStage===stage?'':stage;document.querySelectorAll('[id^="stage-card-"]').forEach(c=>{const s=c.id.replace('stage-card-','');c.style.outline=_activeStage===s?'2px solid var(--color-primary)':'none'});window.filterTable();}var _origFilter=window.filterTable||function(){};window.filterTable=function(){_origFilter();if(!_activeStage)return;const stageLabels=${JSON.stringify(Object.fromEntries(STAGE_CONFIG.map(s=>[s.key,s.label])))};document.querySelectorAll('tbody tr[data-row]').forEach(row=>{const stageCell=row.querySelector('[data-col="stage"]');if(stageCell&&!stageCell.textContent.toLowerCase().includes((stageLabels[_activeStage]||_activeStage||'').toLowerCase())){row.style.display='none';}})};function switchTab(tab){document.querySelectorAll('[id^="tab-"]').forEach(b=>b.classList.toggle('active',b.id==='tab-'+tab))}`;

  return page(user, 'Engagements | MOONLANDING', null, content, [TABLE_SCRIPT, stageFilterScript]);
}
