import { generateHtml, nav } from '@/ui/layout.js';
import { canCreate, isPartner, isClerk } from '@/ui/permissions-ui.js';

const STAGE_CONFIG = [
  { key: 'info_gathering', label: 'Info Gathering' },
  { key: 'commencement',   label: 'Commencement'   },
  { key: 'team_execution', label: 'Team Execution'  },
  { key: 'partner_review', label: 'Partner Review'  },
  { key: 'finalization',   label: 'Finalization'    },
  { key: 'closeout',       label: 'Close Out'       },
];

function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function stagePill(stage) {
  const cfg = STAGE_CONFIG.find(s => s.key === stage);
  const lbl = cfg ? cfg.label : (stage || '-');
  return `<span class="stage-pill stage-${esc(stage||'')}">${lbl}</span>`;
}

function statusPill(status) {
  const map = { active:'pill pill-success', pending:'pill pill-warning', inactive:'pill pill-neutral' };
  const cls = map[status] || 'pill pill-neutral';
  return `<span class="${cls}">${status ? status.charAt(0).toUpperCase()+status.slice(1) : '-'}</span>`;
}

function progressBar(pct) {
  if (typeof pct !== 'number') return '-';
  const p = Math.min(100, Math.max(0, Math.round(pct)));
  return `<div style="display:flex;align-items:center;gap:8px;min-width:100px">
    <div style="flex:1;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">
      <div style="height:100%;width:${p}%;background:var(--color-primary);border-radius:3px"></div>
    </div>
    <span style="font-size:12px;color:var(--color-text-muted);min-width:28px">${p}%</span>
  </div>`;
}

function engRow(e) {
  const name = esc(e.name || e.client_name || 'Untitled');
  const client = esc(e.client_name || e.client_id_display || e.client_id || '-');
  const type = esc(e.type || e.engagement_type || e.repeat_interval || '-');
  const year = esc(e.year || '-');
  const team = esc(e.team_name || e.team_id_display || e.team_id || '-');
  const deadline = e.deadline ? new Date(e.deadline).toLocaleDateString() : '-';
  const stageLbl = STAGE_CONFIG.find(s => s.key === e.stage)?.label || (e.stage || '-');
  return `<tr data-row onclick="location.href='/engagement/${esc(e.id)}'" style="cursor:pointer">
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
    `<button class="tab-btn${t.key === filter ? ' active' : ''}" onclick="switchTab('${t.key}')" id="tab-${t.key}">
      ${t.label}<span class="tab-count">${t.count}</span>
    </button>`
  ).join('')}</div>`;

  const addBtn = canCreate(user, 'engagement')
    ? `<a href="/engagement/new" class="btn-primary-clean"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Engagement</a>`
    : '';

  const stageOpts = STAGE_CONFIG.map(s => `<option value="${s.key}">${s.label}</option>`).join('');
  const teamOpts = teams.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
  const yearOpts = years.map(y => `<option value="${esc(y)}">${esc(y)}</option>`).join('');

  const rows = engagements.map(e => engRow(e)).join('') ||
    `<tr><td colspan="11" style="text-align:center;padding:48px;color:var(--color-text-muted)">No engagements found</td></tr>`;

  const body = `<div class="min-h-screen" style="background:var(--color-bg)">${nav(user)}<main class="page-shell" id="main-content">
    <div class="page-shell-inner">
      <div class="page-header">
        <div>
          <h1 class="page-title">Engagements</h1>
          <p class="page-subtitle">${engagements.length} total engagements</p>
        </div>
        ${addBtn}
      </div>
      ${stageStats}
      ${tabBar}
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
            <th data-sort="name">Name</th>
            <th data-sort="client">Client</th>
            <th data-sort="type">Type</th>
            <th data-sort="year">Year</th>
            <th data-sort="team">Team</th>
            <th data-sort="stage-raw">Stage</th>
            <th style="display:none"></th>
            <th data-sort="status">Status</th>
            <th data-sort="deadline">Deadline</th>
            <th data-sort="rfi" style="text-align:center">RFI</th>
            <th>Progress</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  </main></div>`;

  const script = `
var _activeStage='';
function filterByStage(stage){
  _activeStage=_activeStage===stage?'':stage;
  document.querySelectorAll('[id^="stage-card-"]').forEach(c=>{
    const s=c.id.replace('stage-card-','');
    c.style.outline=_activeStage===s?'2px solid var(--color-primary)':'none';
  });
  window.filterTable();
}
var _origFilter=window.filterTable||function(){};
window.filterTable=function(){
  _origFilter();
  if(!_activeStage)return;
  document.querySelectorAll('tbody tr[data-row]').forEach(row=>{
    const stageCell=row.querySelector('[data-col="stage"]');
    if(stageCell&&!stageCell.textContent.toLowerCase().includes(
      (`${STAGE_CONFIG.find(s=>s.key===_activeStage)?.label||_activeStage}`).toLowerCase()
    )){row.style.display='none';}
  });
};
function switchTab(tab){
  document.querySelectorAll('[id^="tab-"]').forEach(b=>b.classList.toggle('active',b.id==='tab-'+tab));
}
`;

  return generateHtml('Engagements | MY FRIDAY', body, [`(function(){
  let sortCol=null,sortDir=1;
  function filterTable(){
    const search=(document.getElementById('search-input')?.value||'').toLowerCase();
    const filters={};
    document.querySelectorAll('[data-filter]').forEach(el=>{if(el.value)filters[el.dataset.filter]=el.value.toLowerCase()});
    let shown=0,total=0;
    document.querySelectorAll('tbody tr[data-row]').forEach(row=>{
      total++;
      const text=row.textContent.toLowerCase();
      const matchSearch=!search||text.includes(search);
      const matchFilters=Object.entries(filters).every(([key,val])=>{
        const cell=row.querySelector('[data-col="'+key+'"]');
        return !cell||cell.textContent.toLowerCase().includes(val);
      });
      const visible=matchSearch&&matchFilters;
      row.style.display=visible?'':'none';
      if(visible)shown++;
    });
    const counter=document.getElementById('row-count');
    if(counter)counter.textContent=shown===total?total+' items':shown+' of '+total+' items';
  }
  function sortTable(col){
    if(sortCol===col)sortDir*=-1;else{sortCol=col;sortDir=1;}
    document.querySelectorAll('th[data-sort]').forEach(th=>{
      th.classList.remove('sort-asc','sort-desc');
      if(th.dataset.sort===col)th.classList.add(sortDir===1?'sort-asc':'sort-desc');
    });
    const tbody=document.querySelector('tbody');
    if(!tbody)return;
    const rows=Array.from(tbody.querySelectorAll('tr[data-row]'));
    rows.sort((a,b)=>{
      const av=a.querySelector('[data-col="'+col+'"]')?.textContent?.trim()||'';
      const bv=b.querySelector('[data-col="'+col+'"]')?.textContent?.trim()||'';
      return av.localeCompare(bv,undefined,{numeric:true})*sortDir;
    });
    rows.forEach(r=>tbody.appendChild(r));
  }
  window.filterTable=filterTable;window.sortTable=sortTable;
  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('search-input')?.addEventListener('input',filterTable);
    document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('change',filterTable));
    document.querySelectorAll('th[data-sort]').forEach(th=>th.addEventListener('click',()=>sortTable(th.dataset.sort)));
  });
})();`, script]);
}
