import { generateHtml, nav } from '@/ui/layout.js';
import { canCreate, isPartner, isClerk } from '@/ui/permissions-ui.js';

const STAGE_CONFIG = [
  { key: 'info_gathering',  label: 'Info Gathering',  color: '#e53935', bg: '#ffebee' },
  { key: 'commencement',    label: 'Commencement',    color: '#e65100', bg: '#fff3e0' },
  { key: 'team_execution',  label: 'Team Execution',  color: '#1565c0', bg: '#e3f2fd' },
  { key: 'partner_review',  label: 'Partner Review',  color: '#283593', bg: '#e8eaf6' },
  { key: 'finalization',    label: 'Finalization',    color: '#2e7d32', bg: '#e8f5e9' },
  { key: 'closeout',        label: 'Close Out',       color: '#33691e', bg: '#f1f8e9' },
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
    return `<div onclick="filterByStage('${s.key}')" style="flex:1;min-width:100px;background:${s.bg};border:2px solid ${s.color}44;border-radius:8px;padding:14px 10px;text-align:center;cursor:pointer;transition:border-color 0.15s,box-shadow 0.15s" onmouseover="this.style.borderColor='${s.color}';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.12)'" onmouseout="this.style.borderColor='${s.color}44';this.style.boxShadow=''">
      <div style="font-size:1.6rem;font-weight:700;color:${s.color}">${n}</div>
      <div style="font-size:0.68rem;color:#555;margin-top:3px;line-height:1.3;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${s.label}</div>
    </div>`;
  }).join('');
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">${cards}</div>`;
}

function stageBadge(stage) {
  const cfg = STAGE_CONFIG.find(s => s.key === stage);
  if (!cfg) return stage ? `<span style="font-size:0.72rem">${esc(stage)}</span>` : '-';
  return `<span style="background:${cfg.bg};color:${cfg.color};padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:700;white-space:nowrap;border:1px solid ${cfg.color}44">${cfg.label}</span>`;
}

function statusBadge(status) {
  const map = { active: ['#2e7d32','#e8f5e9'], pending: ['#e65100','#fff3e0'], inactive: ['#555','#f5f5f5'] };
  const [color, bg] = map[status] || ['#555','#f5f5f5'];
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '-';
  return `<span style="background:${bg};color:${color};padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:700;border:1px solid ${color}44">${label}</span>`;
}

function progressBar(pct) {
  if (typeof pct !== 'number') return '-';
  const p = Math.min(100, Math.max(0, Math.round(pct)));
  return `<div style="display:flex;align-items:center;gap:6px"><div style="flex:1;background:#e0e0e0;border-radius:4px;height:5px"><div style="width:${p}%;background:#1976d2;height:5px;border-radius:4px;transition:width 0.3s"></div></div><span style="font-size:0.68rem;color:#666;min-width:28px">${p}%</span></div>`;
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
  return `<tr onclick="location.href='/engagement/${esc(e.id)}'" style="cursor:pointer;border-bottom:1px solid #f0f0f0" data-stage="${esc(e.stage)}" data-text="${searchText}" data-year="${normYear}" data-team="${esc(e.team_id || '')}" onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background=''">
    <td style="padding:10px 12px;font-weight:500;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${name}">${name}</td>
    <td style="padding:10px 12px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.82rem" title="${client}">${client}</td>
    <td style="padding:10px 12px;font-size:0.8rem">${type}</td>
    <td style="padding:10px 12px;font-size:0.8rem">${year}</td>
    <td style="padding:10px 12px;font-size:0.8rem">${month}</td>
    <td style="padding:10px 12px;font-size:0.8rem;white-space:nowrap">${team}</td>
    <td style="padding:10px 12px">${stageBadge(e.stage)}</td>
    <td style="padding:10px 12px">${statusBadge(e.status)}</td>
    <td style="padding:10px 12px;font-size:0.8rem;white-space:nowrap">${deadline}</td>
    <td style="padding:10px 12px;font-size:0.8rem;text-align:center">${rfi}</td>
    <td style="padding:10px 12px;min-width:120px">${progressBar(e.progress)}</td>
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

  const tabBar = `<div style="display:flex;gap:0;border-bottom:2px solid #e0e0e0;margin-bottom:16px">` +
    tabs.map(t => `<button onclick="switchTab('${t.key}')" id="tab-${t.key}" style="padding:8px 20px;font-size:0.82rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:${t.key === filter ? '2px solid #1976d2;color:#1976d2' : '2px solid transparent;color:#666'};margin-bottom:-2px">${t.label}&nbsp;<span style="background:#e0e0e0;border-radius:10px;padding:1px 7px;font-size:0.7rem">${t.count}</span></button>`).join('') +
    `</div>`;

  const addBtn = canCreate(user, 'engagement') ? `<a href="/engagement/new" style="background:#1976d2;color:#fff;padding:7px 16px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">+ New Engagement</a>` : '';
  const teamOpts = teams.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
  const yearOpts = years.map(y => `<option value="${esc(y)}">${esc(y)}</option>`).join('');

  const filters = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
    <input type="text" id="eng-search" placeholder="Search engagements..." oninput="filterRows()" style="padding:6px 12px;border:1px solid #ddd;border-radius:6px;font-size:0.82rem;width:220px;outline:none" onfocus="this.style.borderColor='#1976d2'" onblur="this.style.borderColor='#ddd'">
    ${teams.length ? `<select id="filter-team" onchange="filterRows()" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:0.82rem"><option value="">All Teams</option>${teamOpts}</select>` : ''}
    ${years.length ? `<select id="filter-year" onchange="filterRows()" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:0.82rem"><option value="">All Years</option>${yearOpts}</select>` : ''}
  </div>`;

  const rows = engagements.map(e => engRow(e)).join('');
  const th = (label, extra = '') => `<th style="padding:10px 12px;text-align:left;font-weight:600;font-size:0.78rem;color:#444;white-space:nowrap${extra}">${label}</th>`;
  const emptyState = `<tr><td colspan="11" style="text-align:center;padding:60px 20px">
    <div style="font-size:2.5rem;opacity:0.2;margin-bottom:12px">📋</div>
    <div style="font-weight:600;color:#333;margin-bottom:6px">No engagements found</div>
    <div style="color:#aaa;font-size:0.82rem">Try adjusting your filters or add a new engagement.</div>
  </td></tr>`;
  const table = `<div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.1)">
    <div style="padding:10px 12px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between">
      <span id="eng-count" style="font-size:0.78rem;color:#888">Showing <strong>${engagements.length}</strong> engagements</span>
    </div>
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:0.82rem" id="eng-table">
      <thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0">
        ${th('NAME')}${th('CLIENT')}${th('TYPE')}${th('YEAR')}${th('MONTH')}${th('TEAM')}${th('STAGE')}${th('STATUS')}${th('DEADLINE')}${th('RFI',';text-align:center')}${th('PROGRESS',';min-width:120px')}
      </tr></thead>
      <tbody id="eng-tbody">${rows || emptyState}</tbody>
    </table>
    </div>
  </div>`;

  const content = `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1 style="font-size:1.25rem;font-weight:700;margin:0;color:#04141f">Engagements</h1>
      ${addBtn}
    </div>
    ${stageCards(engagements)}
    ${tabBar}
    ${filters}
    ${table}
  `;

  const body = `<div style="min-height:100vh;background:#f7f8fa">${nav(user)}<main style="padding:24px 32px;padding:clamp(16px,3vw,32px)" id="main-content">${content}</main></div>`;

  const script = `
var activeStage = '';
function switchTab(tab) {
  document.querySelectorAll('[id^="tab-"]').forEach(function(b) {
    var isA = b.id === 'tab-' + tab;
    b.style.borderBottomColor = isA ? '#1976d2' : 'transparent';
    b.style.color = isA ? '#1976d2' : '#666';
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
    var txt = r.dataset.text || '';
    var stage = r.dataset.stage || '';
    var rowYear = r.dataset.year || '';
    var rowTeam = r.dataset.team || '';
    var show = true;
    if (q && !txt.includes(q)) show = false;
    if (yr && rowYear !== yr) show = false;
    if (tm && rowTeam !== tm) show = false;
    if (activeStage && stage !== activeStage) show = false;
    r.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  var c = document.getElementById('eng-count');
  if (c) c.innerHTML = 'Showing <strong>' + visible + '</strong> of ' + total + ' engagements';
}
`;

  return generateHtml('Engagements | MY FRIDAY', body, [script]);
}
