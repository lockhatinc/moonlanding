import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';
import { canEdit, isPartner, isManager } from '@/ui/permissions-ui.js';
import { esc, STAGE_CONFIG } from '@/ui/render-helpers.js';
import { stagePipelineHtml, stageTransitionDialog, chatPanel, checklistPanel, activityPanel, filesPanel, engDetailScript } from '@/ui/engagement-detail-panels.js';

export function renderEngagementCardView(user, engagements) {
  const cards = engagements.map(e => {
    const cfg = STAGE_CONFIG.find(s => s.key === e.stage);
    const stageLbl = cfg ? `<span class="badge ${cfg.badge} text-xs">${cfg.label}</span>` : '';
    const pct = typeof e.progress === 'number' ? Math.min(100, Math.round(e.progress)) : 0;
    return `<div onclick="location.href='/engagement/${esc(e.id)}'" class="card bg-base-100 shadow-md cursor-pointer hover:shadow-lg transition-shadow">
      <div class="card-body p-4">
        <div class="font-semibold text-sm mb-1">${esc(e.name || 'Untitled')}</div>
        <div class="text-xs text-base-content/60 mb-2">${esc(e.client_name || '')}</div>
        ${stageLbl}
        <progress class="progress progress-primary w-full mt-3" value="${pct}" max="100"></progress>
        <div class="flex justify-between mt-1 text-xs text-base-content/40"><span>${e.year || ''}</span><span>${pct}%</span></div>
      </div>
    </div>`;
  }).join('');
  return `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">${cards || '<div class="col-span-full text-center py-12 text-base-content/40">No engagements found</div>'}</div>`;
}

export function renderEngagementDetail(user, engagement, client, rfis = []) {
  const e = engagement || {};
  const stageCfg = STAGE_CONFIG.find(s => s.key === e.stage);
  const stageLabel = stageCfg ? stageCfg.label : (e.stage || '-');
  const stageBadgeCls = stageCfg ? stageCfg.badge : 'badge-flat-secondary';
  const canTransition = isPartner(user) || isManager(user);

  function fmtDate(v) {
    if (!v) return '-';
    const n = typeof v === 'number' ? (v > 1e10 ? v : v * 1000) : new Date(v).getTime();
    return new Date(n).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtCurrency(v) {
    if (!v && v !== 0) return '-';
    return 'R ' + Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  const assignedUsersHtml = (e.assigned_users_resolved || []).length
    ? (e.assigned_users_resolved || []).map(u => `<span class="badge badge-flat-primary text-xs mr-1">${esc(u.name)}</span>`).join('')
    : '<span class="text-base-content/40 text-sm italic">Not assigned</span>';

  const infoItems = [
    ['Client', esc(client?.name || e.client_name || e.client_id_display || e.client_id || '-')],
    ['Type', esc(e.type || e.engagement_type || e.repeat_interval || '-')],
    ['Year', esc(e.year || '-')],
    ['Team', esc(e.team_name || e.team_id_display || e.team_id || '-')],
    ['Status', e.status ? `<span class="badge ${e.status==='active'?'badge-success badge-flat-success':'badge-warning badge-flat-warning'} text-xs">${e.status}</span>` : '-'],
    ['Fee', fmtCurrency(e.fee || e.fees)],
    ['Commenced', fmtDate(e.commencement_date)],
    ['Deadline', fmtDate(e.deadline_date || e.deadline)],
    ['Created', fmtDate(e.created_at)],
    ['Assigned', assignedUsersHtml],
  ];

  const infoGrid = `<div class="grid grid-cols-2 gap-3">${infoItems.map(([label, val]) => `<div><div class="text-xs text-base-content/50 font-semibold uppercase tracking-wider mb-1">${label}</div><div class="text-sm text-base-content">${val}</div></div>`).join('')}</div>`;
  const pct = typeof e.progress === 'number' ? Math.min(100, Math.round(e.progress)) : 0;
  const progressHtml = `<div class="mt-4"><div class="flex justify-between mb-1"><span class="text-sm font-semibold text-base-content/60">Overall Progress</span><span class="text-sm text-base-content/50">${pct}%</span></div><progress class="progress progress-primary w-full" value="${pct}" max="100"></progress></div>`;

  const rfiRows = rfis.map(r => {
    const rs = r.status || 'pending';
    const rc = rs==='active'?'badge-success badge-flat-success':rs==='closed'?'badge-flat-secondary':'badge-warning badge-flat-warning';
    return `<tr class="hover cursor-pointer" onclick="location.href='/rfi/${esc(r.id)}'"><td class="text-sm">${esc(r.name||r.title||'RFI')}</td><td><span class="badge ${rc} text-xs">${rs}</span></td><td class="text-sm">${r.deadline?new Date(r.deadline).toLocaleDateString():'-'}</td></tr>`;
  }).join('') || `<tr><td colspan="3" class="text-center py-6 text-base-content/40 text-sm">No RFIs</td></tr>`;

  const stageBtn = canTransition ? `<button onclick="openStageTransition('${esc(e.stage)}')" class="btn btn-ghost btn-sm">Move Stage</button>` : '';
  const editBtn = canEdit(user, 'engagement') ? `<a href="/engagement/${esc(e.id)}/edit" class="btn btn-primary btn-sm">Edit</a>` : '';
  const newRfiBtn = `<a href="/rfi/new?engagement_id=${esc(e.id)}" class="btn btn-primary btn-sm">+ RFI</a>`;

  const TABS = ['Details','RFIs','Chat','Checklist','Activity','Files'];
  const tabBar = `<div class="tab-bar">${TABS.map((t,i) => `<button onclick="switchEngTab('${t.toLowerCase()}')" id="engtab-${t.toLowerCase()}" class="tab ${i===0?'active':''}">${t}</button>`).join('')}</div>`;

  const rfiTable = `<div class="table-container"><table class="table table-hover"><thead><tr><th>Name</th><th>Status</th><th>Deadline</th></tr></thead><tbody>${rfiRows}</tbody></table></div>`;

  const content = `
    <nav class="breadcrumbs text-sm mb-4"><ul><li><a href="/">Home</a></li><li><a href="/engagements">Engagements</a></li><li>${esc(e.name || 'Engagement')}</li></ul></nav>
    <div class="flex justify-between items-start mb-4 flex-wrap gap-3">
      <div><h1 class="text-2xl font-bold text-base-content mb-2">${esc(e.name || e.client_name || 'Engagement')}</h1><span class="badge ${stageBadgeCls}">${stageLabel}</span></div>
      <div class="flex gap-2">${stageBtn}${editBtn}</div>
    </div>
    <div class="card bg-base-100 shadow-md overflow-hidden mb-4"><div class="flex">${stagePipelineHtml(e)}</div></div>
    ${tabBar}
    <div id="tab-details" class="eng-tab-panel"><div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card bg-base-100 shadow-md"><div class="card-body"><h2 class="card-title text-sm mb-4">Engagement Details</h2>${infoGrid}${progressHtml}</div></div>
      <div class="card bg-base-100 shadow-md"><div class="card-body"><div class="flex justify-between items-center mb-4"><h2 class="card-title text-sm">RFIs (${rfis.length})</h2>${newRfiBtn}</div>${rfiTable}</div></div>
    </div></div>
    <div id="tab-rfis" class="eng-tab-panel" style="display:none"><div class="card bg-base-100 shadow-md"><div class="card-body"><div class="flex justify-between items-center mb-4"><h2 class="card-title text-sm">All RFIs</h2>${newRfiBtn}</div>${rfiTable}</div></div></div>
    ${chatPanel(e.id)}${checklistPanel(e.id)}${activityPanel(e.id)}${filesPanel(e.id)}
    ${stageTransitionDialog(e.id, e.stage)}
  `;

  const body = `<div style="min-height:100vh;background:var(--color-bg)">${nav(user)}<main class="page-shell" id="main-content"><div class="page-shell-inner">${content}</div></main></div>`;
  return generateHtml(`${esc(e.name || 'Engagement')} | MOONLANDING`, body, [engDetailScript(e.id)]);
}
