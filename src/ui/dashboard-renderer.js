import { page } from '@/ui/layout.js'
import { getQuickActions } from '@/ui/permissions-ui.js'

function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const STAGE_MAP = {
  info_gathering:  ['stage-pill stage-info_gathering',  'Info Gathering'],
  commencement:    ['stage-pill stage-commencement',    'Commencement'],
  team_execution:  ['stage-pill stage-team_execution',  'Team Execution'],
  partner_review:  ['stage-pill stage-partner_review',  'Partner Review'],
  finalization:    ['stage-pill stage-finalization',    'Finalization'],
  closeout:        ['stage-pill stage-closeout',        'Close Out'],
};

function stagePill(stage) {
  const [cls, lbl] = STAGE_MAP[stage] || ['pill pill-neutral', stage || '-'];
  return `<span class="${cls}">${lbl}</span>`;
}

function statusPill(status) {
  const map = { active:'pill pill-success', pending:'pill pill-warning', inactive:'pill pill-neutral' };
  const cls = map[status] || 'pill pill-neutral';
  return `<span class="${cls}">${status ? status.charAt(0).toUpperCase()+status.slice(1) : '-'}</span>`;
}

export function renderDashboard(user, stats = {}) {
  const isClerk = user?.role === 'clerk';
  const statDefs = isClerk
    ? [
        { label: 'My RFIs',   value: stats.myRfis?.length || 0,   sub: 'Assigned to you',  href: '/rfi' },
        { label: 'Overdue',   value: stats.overdueRfis?.length || 0, sub: 'Need attention', href: '/rfi', warn: true },
        { label: 'Reviews',   value: stats.reviews || 0,            sub: 'Total reviews',   href: '/review' },
        { label: 'Clients',   value: stats.clients || 0,            sub: 'Active clients',  href: '/client' },
      ]
    : [
        { label: 'Engagements', value: stats.engagements || 0, sub: 'Total engagements',  href: '/engagements' },
        { label: 'Clients',     value: stats.clients || 0,     sub: 'Active clients',     href: '/client' },
        { label: 'Open RFIs',   value: stats.rfis || 0,        sub: stats.overdueRfis?.length > 0 ? `${stats.overdueRfis.length} overdue` : 'All on track', href: '/rfi', warn: stats.overdueRfis?.length > 0 },
        { label: 'Reviews',     value: stats.reviews || 0,     sub: 'Active reviews',     href: '/review' },
      ];

  const statsHtml = `<div class="stats-row">${statDefs.map(s => `<a href="${s.href}" class="stat-card stat-card-clickable" style="text-decoration:none">
    <div class="stat-card-value${s.warn?' style=\"color:var(--color-danger)\"':''}">${s.value}</div>
    <div class="stat-card-label">${s.label}</div>
    <div class="stat-card-sub">${s.sub}</div>
  </a>`).join('')}</div>`;

  const overdueAlert = stats.overdueRfis?.length > 0
    ? `<div class="alert-strip alert-strip-danger mb-5">
        <span>${stats.overdueRfis.length} overdue RFI${stats.overdueRfis.length !== 1 ? 's' : ''} require attention</span>
        <a href="/rfi" class="btn-danger-clean">View RFIs</a>
      </div>` : '';

  const quickActions = getQuickActions(user);
  const actionsHtml = quickActions.length > 0
    ? `<div class="card-clean card-section">
        <div class="card-clean-body">
          <div class="page-subtitle" style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px">Quick Actions</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px">
            ${quickActions.map(a => `<a href="${a.href}" class="${a.primary ? 'btn-primary-clean' : 'btn-ghost-clean'}">${a.label}</a>`).join('')}
          </div>
        </div>
      </div>` : '';

  const recentRows = (stats.recentEngagements || []).map(e => {
    const name = esc(e.name || e.client_name || 'Untitled');
    const client = esc(e.client_id_display || e.client_name || '-');
    const updated = e.updated_at ? new Date(typeof e.updated_at === 'number' ? e.updated_at * 1000 : e.updated_at).toLocaleDateString() : '-';
    return `<tr data-row onclick="location.href='/engagement/${esc(e.id)}'" style="cursor:pointer">
      <td data-col="name"><strong>${name}</strong></td>
      <td data-col="client">${client}</td>
      <td data-col="stage">${stagePill(e.stage)}</td>
      <td data-col="status">${statusPill(e.status)}</td>
      <td data-col="updated">${updated}</td>
    </tr>`;
  }).join('');

  const recentHtml = !isClerk && (stats.recentEngagements || []).length > 0
    ? `<div class="table-wrap">
        <div class="table-toolbar">
          <div class="table-search"><input id="search-input" type="text" placeholder="Search engagements..."></div>
          <span class="table-count" id="row-count">${(stats.recentEngagements||[]).length} items</span>
        </div>
        <table class="data-table">
          <thead><tr>
            <th data-sort="name">Name</th>
            <th data-sort="client">Client</th>
            <th data-sort="stage">Stage</th>
            <th data-sort="status">Status</th>
            <th data-sort="updated">Updated</th>
          </tr></thead>
          <tbody>${recentRows}</tbody>
        </table>
      </div>` : '';

  const content = `<div class="page-shell"><div class="page-shell-inner">
    <div class="page-header">
      <div>
        <h1 class="page-title">Welcome back, ${esc(user?.name || 'User')}</h1>
        <p class="page-subtitle">${new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
    ${statsHtml}
    ${overdueAlert}
    ${actionsHtml}
    ${recentHtml}
  </div></div>`;

  return page(user, 'Dashboard | MOONLANDING', [], content, [`(function(){
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
})();`]);
}

export function renderAuditDashboard(user, auditData = {}) {
  const { summary = {}, recentActivity = [] } = auditData;
  const actRows = recentActivity.slice(0, 20).map(a =>
    `<tr data-row>
      <td data-col="time">${new Date((a.timestamp||a.created_at)*1000).toLocaleString()}</td>
      <td data-col="action"><span class="pill pill-info">${a.action||'-'}</span></td>
      <td data-col="entity">${a.entity_type||'-'}</td>
      <td data-col="id" style="font-size:12px">${a.entity_id||'-'}</td>
      <td data-col="user">${a.user_name||a.user_id||'-'}</td>
      <td data-col="reason" style="font-size:12px;color:var(--color-text-muted)">${a.reason||'-'}</td>
    </tr>`
  ).join('') || '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-muted)">No audit records found</td></tr>';

  const statsHtml = `<div class="stats-row">
    ${[
      { label: 'Total Actions (30d)', value: summary.total_actions || 0 },
      { label: 'Permission Grants',   value: summary.grants || 0 },
      { label: 'Permission Revokes',  value: summary.revokes || 0 },
      { label: 'Role Changes',        value: summary.role_changes || 0 },
    ].map(s => `<div class="stat-card"><div class="stat-card-value">${s.value}</div><div class="stat-card-label">${s.label}</div></div>`).join('')}
  </div>`;

  const content2 = `<div class="page-shell"><div class="page-shell-inner">
    <div class="page-header"><h1 class="page-title">Audit Dashboard</h1>
      <a href="/permission_audit" class="btn-ghost-clean">View All Records</a></div>
    ${statsHtml}
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="table-search"><input id="search-input" type="text" placeholder="Search audit log..."></div>
        <span class="table-count" id="row-count">${recentActivity.length} items</span>
      </div>
      <table class="data-table">
        <thead><tr>
          <th data-sort="time">Time</th><th data-sort="action">Action</th><th data-sort="entity">Entity Type</th>
          <th data-sort="id">Entity ID</th><th data-sort="user">User</th><th data-sort="reason">Reason</th>
        </tr></thead>
        <tbody>${actRows}</tbody>
      </table>
    </div>
  </div></div>`;

  return page(user, 'Audit Dashboard', [{ href: '/', label: 'Dashboard' }, { href: '/admin/audit', label: 'Audit' }], content2, [`(function(){
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
})();`]);
}

export function renderSystemHealth(user, healthData = {}) {
  const { database = {}, server: srv = {}, entities = {} } = healthData;
  const entRows = Object.entries(entities).map(([n, c]) =>
    `<tr data-row><td data-col="entity">${n}</td><td data-col="count" style="text-align:right">${c}</td></tr>`
  ).join('') || '<tr><td colspan="2" style="text-align:center;padding:32px;color:var(--color-text-muted)">No data</td></tr>';

  const statsHtml = `<div class="stats-row">
    ${[
      { label: 'Server Status', value: 'Online', sub: 'Port: '+(srv.port||3000) },
      { label: 'Database',      value: database.status||'Connected', sub: 'Size: '+(database.size||'N/A') },
      { label: 'Uptime',        value: srv.uptime||'N/A', sub: 'Started: '+(srv.startTime||'N/A') },
    ].map(s => `<div class="stat-card"><div class="stat-card-value" style="font-size:20px">${s.value}</div><div class="stat-card-label">${s.label}</div><div class="stat-card-sub">${s.sub}</div></div>`).join('')}
  </div>`;

  const content3 = `<div class="page-shell"><div class="page-shell-inner">
    <div class="page-header"><h1 class="page-title">System Health</h1></div>
    ${statsHtml}
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="table-search"><input id="search-input" type="text" placeholder="Search entities..."></div>
        <span class="table-count" id="row-count">${Object.keys(entities).length} items</span>
      </div>
      <table class="data-table">
        <thead><tr><th data-sort="entity">Entity</th><th data-sort="count" style="text-align:right">Count</th></tr></thead>
        <tbody>${entRows}</tbody>
      </table>
    </div>
  </div></div>`;

  return page(user, 'System Health', [{ href: '/', label: 'Dashboard' }, { href: '/admin/health', label: 'Health' }], content3, [`(function(){
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
})();`]);
}
