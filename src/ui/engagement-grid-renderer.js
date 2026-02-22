import { generateHtml, nav } from '@/ui/layout.js';
import { canCreate, isPartner, isClerk } from '@/ui/permissions-ui.js';

const STAGE_CONFIG = [
  { key: 'info_gathering',  label: 'Info Gathering',  badge: 'badge-error badge-flat-error' },
  { key: 'commencement',    label: 'Commencement',    badge: 'badge-warning badge-flat-warning' },
  { key: 'team_execution',  label: 'Team Execution',  badge: 'badge-flat-primary' },
  { key: 'partner_review',  label: 'Partner Review',  badge: 'badge-flat-secondary' },
  { key: 'finalization',    label: 'Finalization',    badge: 'badge-success badge-flat-success' },
  { key: 'closeout',        label: 'Close Out',       badge: 'badge-success badge-flat-success' },
];

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function stageCards(engagements) {
  const counts = {};
  STAGE_CONFIG.forEach(s => { counts[s.key] = 0; });
  engagements.forEach(e => { if (counts[e.stage] !== undefined) counts[e.stage]++; });
  const cards = STAGE_CONFIG.map(s => {
    const n = counts[s.key] || 0;
    return `<div onclick="filterByStage('${s.key}')" class="stat cursor-pointer hover:bg-base-200 transition-colors" style="min-width:0">
      <div class="stat-value text-2xl">${n}</div>
      <div class="stat-title text-xs">${s.label}</div>
    </div>`;
  }).join('');
  return `<div class="stats shadow w-full mb-4 flex-wrap">${cards}</div>`;
}

function stageBadge(stage) {
  const cfg = STAGE_CONFIG.find(s => s.key === stage);
  if (!cfg) return stage ? `<span class="badge badge-flat-secondary text-xs">${esc(stage)}</span>` : '-';
  return `<span class="badge ${cfg.badge} text-xs">${cfg.label}</span>`;
}

function statusBadge(status) {
  const map = { active: 'badge-success badge-flat-success', pending: 'badge-warning badge-flat-warning', inactive: 'badge-flat-secondary' };
  const cls = map[status] || 'badge-flat-secondary';
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '-';
  return `<span class="badge ${cls} text-xs">${label}</span>`;
}

function progressBar(pct) {
  if (typeof pct !== 'number') return '-';
  const p = Math.min(100, Math.max(0, Math.round(pct)));
  return `<div class="flex items-center gap-2"><progress class="progress progress-primary flex-1" value="${p}" max="100"></progress><span class="text-xs text-base-content/50 min-w-8">${p}%</span></div>`;
}

function extractYear(y) {
  if (!y) return '';
  const m = String(y).match(/\b(20\d{2}|19\d{2})\b/);
  return m ? m[1] : '';
}

function engRow(e) {
  const client = esc(e.client_name || e.client_id_display || e.client_id || '-');
  const type = esc(e.type || e.engagement_type || e.repeat_interval || '-');
  const year = esc(e.year || '-');
  const month = esc(e.month || e.period || '-');
  const team = esc(e.team_name || e.team_id_display || e.team_id || '-');
  const deadline = e.deadline ? new Date(e.deadline).toLocaleDateString() : '-';
  const rfi = e.rfi_count != null ? e.rfi_count : '-';
  const name = esc(e.name || e.client_name || 'Untitled');
  const searchText = `${name} ${client} ${type} ${year} ${team}`.toLowerCase();
  const normYear = extractYear(e.year);
  return `<tr class="hover cursor-pointer" onclick="location.href='/engagement/${esc(e.id)}'" data-stage="${esc(e.stage)}" data-text="${searchText}" data-year="${normYear}" data-team="${esc(e.team_id || '')}">
    <td class="font-medium max-w-44 truncate" title="${name}">${name}</td>
    <td class="text-sm max-w-36 truncate text-base-content/70" title="${client}">${client}</td>
    <td class="text-sm">${type}</td>
    <td class="text-sm">${year}</td>
    <td class="text-sm">${month}</td>
    <td class="text-sm">${team}</td>
    <td>${stageBadge(e.stage)}</td>
    <td>${statusBadge(e.status)}</td>
    <td class="text-sm whitespace-nowrap">${deadline}</td>
    <td class="text-sm text-center">${rfi}</td>
    <td style="min-width:120px">${progressBar(e.progress)}</td>
  </tr>`;
}

export function renderEngagementGrid(user, engagements, options = {}) {
  const { filter = 'all', teams = [], years = [] } = options;
  const myEng = engagements.filter(e => e.assigned_to === user?.id || (Array.isArray(e.users) && e.users.includes(user?.id)));
  const teamEng = engagements.filter(e => e.team_id === user?.team_id);
  const tabs = [
    { key: 'all', label: 'All Engagements', count: engagements.length },
    { key: 'my', label: 'My Engagements', count: myEng.length },
    { key: 'team', label: 'Team', count: teamEng.length },
  ];

  const tabBar = `<div class="tabs tabs-boxed bg-base-200 mb-4 flex-wrap gap-1">` +
    tabs.map(t => `<button onclick="switchTab('${t.key}')" id="tab-${t.key}" class="tab ${t.key === filter ? 'tab-active' : ''}">${t.label}&nbsp;<span class="badge badge-sm ml-1">${t.count}</span></button>`).join('') +
    `</div>`;

  const addBtn = canCreate(user, 'engagement') ? `<a href="/engagement/new" class="btn btn-primary btn-sm gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Engagement</a>` : '';
  const teamOpts = teams.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
  const yearOpts = years.map(y => `<option value="${esc(y)}">${esc(y)}</option>`).join('');

  const filters = `<div class="flex gap-2 items-center flex-wrap mb-3">
    <input type="text" id="eng-search" placeholder="Search engagements..." oninput="filterRows()" class="input input-solid" style="max-width:240px">
    ${teams.length ? `<select id="filter-team" onchange="filterRows()" class="select select-solid" style="max-width:160px"><option value="">All Teams</option>${teamOpts}</select>` : ''}
    ${years.length ? `<select id="filter-year" onchange="filterRows()" class="select select-solid" style="max-width:140px"><option value="">All Years</option>${yearOpts}</select>` : ''}
  </div>`;

  const rows = engagements.map(e => engRow(e)).join('');
  const emptyState = `<tr><td colspan="11" class="text-center py-16 text-base-content/40">
    <div class="text-4xl mb-3 opacity-30">&#128203;</div>
    <div class="font-semibold mb-1">No engagements found</div>
    <div class="text-sm">Try adjusting your filters or add a new engagement.</div>
  </td></tr>`;

  const table = `<div class="card bg-base-100 shadow-md">
    <div class="card-body p-0">
      <div class="flex items-center justify-between px-4 py-3 border-b border-base-200">
        <span id="eng-count" class="text-sm text-base-content/60">Showing <strong>${engagements.length}</strong> engagements</span>
      </div>
      <div class="table-container">
        <table class="table table-hover" id="eng-table">
          <thead><tr>
            <th>Name</th><th>Client</th><th>Type</th><th>Year</th><th>Month</th><th>Team</th><th>Stage</th><th>Status</th><th>Deadline</th><th class="text-center">RFI</th><th>Progress</th>
          </tr></thead>
          <tbody id="eng-tbody">${rows || emptyState}</tbody>
        </table>
      </div>
    </div>
  </div>`;

  const content = `
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-base-content">Engagements</h1>
      ${addBtn}
    </div>
    ${stageCards(engagements)}
    ${tabBar}
    ${filters}
    ${table}
  `;

  const body = `<div class="min-h-screen bg-base-200">${nav(user)}<main class="p-4 md:p-6" id="main-content">${content}</main></div>`;

  const script = `
var activeStage = '';
function switchTab(tab) {
  document.querySelectorAll('[id^="tab-"]').forEach(function(b) {
    b.classList.toggle('tab-active', b.id === 'tab-' + tab);
  });
  filterRows();
}
function filterByStage(stage) {
  activeStage = activeStage === stage ? '' : stage;
  filterRows();
}
function filterRows() {
  var q = (document.getElementById('eng-search')?.value || '').toLowerCase();
  var yr = document.getElementById('filter-year')?.value || '';
  var tm = document.getElementById('filter-team')?.value || '';
  var visible = 0, total = 0;
  document.querySelectorAll('#eng-tbody tr').forEach(function(r) {
    if (!r.dataset.text && !r.dataset.stage) return;
    total++;
    var show = true;
    if (q && !(r.dataset.text||'').includes(q)) show = false;
    if (yr && r.dataset.year !== yr) show = false;
    if (tm && r.dataset.team !== tm) show = false;
    if (activeStage && r.dataset.stage !== activeStage) show = false;
    r.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  var c = document.getElementById('eng-count');
  if (c) c.innerHTML = 'Showing <strong>' + visible + '</strong> of ' + total + ' engagements';
}
`;

  return generateHtml('Engagements | MY FRIDAY', body, [script]);
}
