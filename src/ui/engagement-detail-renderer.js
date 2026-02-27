import { page } from '@/ui/layout.js';
import { canEdit, isPartner, isManager } from '@/ui/permissions-ui.js';
import { esc, STAGE_CONFIG } from '@/ui/render-helpers.js';
import { stageTransitionDialog, chatPanel, checklistPanel, activityPanel, filesPanel, engDetailScript } from '@/ui/engagement-detail-panels.js';
import { SPACING, renderInfoGrid, renderProgress } from '@/ui/spacing-system.js';

function stagePipelineHtml(e) {
  const currentIdx = STAGE_CONFIG.findIndex(s => s.key === e.stage);
  const stages = STAGE_CONFIG.map((s, i) => {
    const isCurrent = i === currentIdx;
    const isPast = i < currentIdx;
    const bg = isCurrent || isPast ? s.color : '#e2e8f0';
    const color = isCurrent || isPast ? '#fff' : '#94a3b8';
    const opacity = isPast ? '0.7' : '1';
    return `<div onclick="openStageTransition('${esc(s.key)}')" title="${s.label}" style="flex:1;min-width:0;padding:${SPACING.xs} ${SPACING.xs};text-align:center;background:${bg};color:${color};opacity:${opacity};font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.label}</div>`;
  }).join('');
  return `<div style="display:flex;flex-direction:row;width:100%;border-radius:6px;overflow:hidden;height:34px">${stages}</div>`;
}

export function renderEngagementCardView(user, engagements) {
  const cards = engagements.map(e => {
    const cfg = STAGE_CONFIG.find(s => s.key === e.stage);
    const stageLbl = cfg ? `<span class="badge ${cfg.badge} text-xs">${cfg.label}</span>` : '';
    const pct = typeof e.progress === 'number' ? Math.min(100, Math.round(e.progress)) : 0;
    return `<div data-navigate="/engagement/${esc(e.id)}" class="card-clean">
      <div class="card-clean-body" style="padding:${SPACING.md}">
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

  const infoGrid = renderInfoGrid(infoItems);
  const pct = typeof e.progress === 'number' ? Math.min(100, Math.round(e.progress)) : 0;
  const progressHtml = `<div style="margin-top:${SPACING.lg};padding-top:${SPACING.md};border-top:1px solid var(--color-border)">${renderProgress(pct, 100, 'primary', '0px')}</div>`;

  const rfiRows = rfis.map(r => {
    const rs = r.status || 'pending';
    const rc = rs==='active'?'badge-success badge-flat-success':rs==='closed'?'badge-flat-secondary':'badge-warning badge-flat-warning';
    return `<tr class="hover cursor-pointer" data-navigate="/rfi/${esc(r.id)}"><td class="text-sm">${esc(r.name||r.title||'RFI')}</td><td><span class="badge ${rc} text-xs">${rs}</span></td><td class="text-sm">${r.deadline?new Date(r.deadline).toLocaleDateString():'-'}</td></tr>`;
  }).join('') || `<tr><td colspan="3" class="text-center py-6 text-base-content/40 text-sm">No RFIs</td></tr>`;

  const stageBtn = canTransition ? `<button onclick="openStageTransition('${esc(e.stage)}')" class="btn btn-ghost btn-sm">Move Stage</button>` : '';
  const editBtn = canEdit(user, 'engagement') ? `<a href="/engagement/${esc(e.id)}/edit" class="btn btn-primary btn-sm">Edit</a>` : '';
  const newRfiBtn = `<a href="/rfi/new?engagement_id=${esc(e.id)}" class="btn btn-primary btn-sm">+ RFI</a>`;

  const TABS = ['Details','RFIs','Chat','Checklist','Activity','Files'];
  const tabBar = `<div class="tab-bar">${TABS.map((t,i) => `<button onclick="switchEngTab('${t.toLowerCase()}')" id="engtab-${t.toLowerCase()}" class="tab-btn${i===0?' active':''}">${t}</button>`).join('')}</div>`;

  const rfiTable = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Status</th><th>Deadline</th></tr></thead><tbody>${rfiRows}</tbody></table></div>`;

  const content = `
    <nav class="breadcrumb-clean"><a href="/">Home</a><span class="breadcrumb-sep">/</span><a href="/engagements">Engagements</a><span class="breadcrumb-sep">/</span><span>${esc(e.name || 'Engagement')}</span></nav>
    <div class="page-header">
      <div><h1 class="page-title">${esc(e.name || e.client_name || 'Engagement')}</h1><div style="margin-top:${SPACING.xs}"><span class="badge ${stageBadgeCls}">${stageLabel}</span></div></div>
      <div style="display:flex;gap:${SPACING.sm};flex-shrink:0">${stageBtn}${editBtn}</div>
    </div>
    <div class="card-clean overflow-hidden mb-4" style="padding:${SPACING.sm}">${stagePipelineHtml(e)}</div>
    ${tabBar}
    <div id="tab-details" class="eng-tab-panel"><div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card-clean"><div class="card-clean-body"><h2 class="text-sm font-semibold text-base-content mb-4">Engagement Details</h2>${infoGrid}${progressHtml}</div></div>
      <div class="card-clean"><div class="card-clean-body"><div class="flex justify-between items-center mb-4"><h2 class="text-sm font-semibold text-base-content">RFIs (${rfis.length})</h2>${newRfiBtn}</div>${rfiTable}</div></div>
    </div></div>
    <div id="tab-rfis" class="eng-tab-panel" style="display:none"><div class="card-clean"><div class="card-clean-body"><div class="flex justify-between items-center mb-4"><h2 class="text-sm font-semibold text-base-content">All RFIs</h2>${newRfiBtn}</div>${rfiTable}</div></div></div>
    ${chatPanel(e.id)}${checklistPanel(e.id)}${activityPanel(e.id)}${filesPanel(e.id)}
    ${stageTransitionDialog(e.id, e.stage)}
  `;

  return page(user, `${esc(e.name || 'Engagement')} | MOONLANDING`, null, content, [engDetailScript(e.id)]);
}
