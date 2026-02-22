import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';
import { canEdit } from '@/ui/permissions-ui.js';

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


export function renderEngagementCardView(user, engagements) {
  const cards = engagements.map(e => {
    const cfg = STAGE_CONFIG.find(s => s.key === e.stage);
    const stageLbl = cfg ? `<span style="background:${cfg.bg};color:${cfg.color};padding:2px 6px;border-radius:8px;font-size:0.68rem;font-weight:700">${cfg.label}</span>` : '';
    const pct = typeof e.progress === 'number' ? Math.min(100, Math.round(e.progress)) : 0;
    return `<div onclick="location.href='/engagement/${esc(e.id)}'" style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:16px;cursor:pointer;transition:box-shadow 0.15s" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.08)'">
      <div style="font-weight:600;font-size:0.9rem;margin-bottom:4px">${esc(e.name || 'Untitled')}</div>
      <div style="font-size:0.78rem;color:#666;margin-bottom:8px">${esc(e.client_name || '')}</div>
      ${stageLbl}
      <div style="margin-top:10px;background:#e0e0e0;border-radius:4px;height:4px"><div style="width:${pct}%;background:#1976d2;height:4px;border-radius:4px"></div></div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:0.7rem;color:#999"><span>${e.year || ''}</span><span>${pct}%</span></div>
    </div>`;
  }).join('');
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">${cards || '<div style="grid-column:1/-1;text-align:center;padding:48px;color:#aaa">No engagements found</div>'}</div>`;
}

export function renderEngagementDetail(user, engagement, client, rfis = []) {
  const e = engagement || {};
  const stageCfg = STAGE_CONFIG.find(s => s.key === e.stage);
  const stageLabel = stageCfg ? stageCfg.label : (e.stage || '-');
  const stageColor = stageCfg ? stageCfg.color : '#555';
  const stageBg = stageCfg ? stageCfg.bg : '#f5f5f5';

  const stagePipeline = STAGE_CONFIG.map(s => {
    const isCurrent = s.key === e.stage;
    const isPast = STAGE_CONFIG.findIndex(x => x.key === e.stage) > STAGE_CONFIG.indexOf(s);
    const bg = isCurrent ? s.color : isPast ? s.color + '66' : '#e0e0e0';
    const textColor = isCurrent || isPast ? '#fff' : '#999';
    return `<div style="flex:1;padding:8px 4px;text-align:center;background:${bg};color:${textColor};font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;position:relative;cursor:${isCurrent ? 'default' : 'pointer'}" onclick="if('${s.key}'!=='${esc(e.stage)}'){}">
      ${s.label}${isCurrent ? '<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid '+s.color+'"></div>' : ''}
    </div>`;
  }).join('');

  const infoItems = [
    ['Client', esc(client?.name || e.client_name || e.client_id_display || e.client_id || '-')],
    ['Type', esc(e.type || e.engagement_type || e.title || '-')],
    ['Year', esc(e.year || '-')],
    ['Month', esc(e.month || '-')],
    ['Team', esc(e.team_name || e.team_id_display || e.team_id || '-')],
    ['Deadline', e.deadline ? new Date(e.deadline).toLocaleDateString() : '-'],
    ['Status', e.status ? `<span style="background:${e.status==='active'?'#e8f5e9':'#fff3e0'};color:${e.status==='active'?'#2e7d32':'#e65100'};padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:700">${e.status}</span>` : '-'],
    ['Created', e.created_at ? new Date(typeof e.created_at === 'number' ? e.created_at * 1000 : e.created_at).toLocaleDateString() : '-'],
  ];

  const infoGrid = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 24px">` +
    infoItems.map(([label, val]) => `<div><div style="font-size:0.72rem;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">${label}</div><div style="font-size:0.88rem;color:#222">${val}</div></div>`).join('') +
    `</div>`;

  const pct = typeof e.progress === 'number' ? Math.min(100, Math.round(e.progress)) : 0;
  const progressBar = `<div style="margin-top:16px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:0.78rem;font-weight:600;color:#555">Overall Progress</span><span style="font-size:0.78rem;color:#888">${pct}%</span></div><div style="background:#e0e0e0;border-radius:6px;height:8px"><div style="width:${pct}%;background:#1976d2;height:8px;border-radius:6px;transition:width 0.3s"></div></div></div>`;

  const rfiRows = rfis.map(r => {
    const rStatus = r.status || 'pending';
    const rc = rStatus === 'active' ? ['#2e7d32','#e8f5e9'] : rStatus === 'closed' ? ['#555','#f5f5f5'] : ['#e65100','#fff3e0'];
    return `<tr style="border-bottom:1px solid #f0f0f0"><td style="padding:8px 12px;font-size:0.82rem">${esc(r.name || r.title || 'RFI')}</td><td style="padding:8px 12px"><span style="background:${rc[1]};color:${rc[0]};padding:2px 7px;border-radius:8px;font-size:0.7rem;font-weight:700">${rStatus}</span></td><td style="padding:8px 12px;font-size:0.8rem">${r.deadline ? new Date(r.deadline).toLocaleDateString() : '-'}</td></tr>`;
  }).join('') || `<tr><td colspan="3" style="padding:24px;text-align:center;color:#aaa;font-size:0.82rem">No RFIs</td></tr>`;

  const editBtn = `<a href="/engagement/${esc(e.id)}/edit" style="background:#1976d2;color:#fff;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">Edit</a>`;
  const backBtn = `<a href="/engagements" style="color:#1976d2;text-decoration:none;font-size:0.85rem;font-weight:500;display:flex;align-items:center;gap:4px">&#8592; Back to Engagements</a>`;

  const content = `
    <div style="margin-bottom:16px">${backBtn}</div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:1.5rem;font-weight:700;margin:0 0 6px;color:#1a1a1a">${esc(e.name || e.client_name || 'Engagement')}</h1>
        <span style="background:${stageBg};color:${stageColor};padding:4px 12px;border-radius:12px;font-size:0.78rem;font-weight:700;border:1px solid ${stageColor}44">${stageLabel}</span>
      </div>
      <div style="display:flex;gap:8px">${editBtn}</div>
    </div>

    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);overflow:hidden;margin-bottom:16px">
      <div style="display:flex;border-radius:8px 8px 0 0;overflow:hidden">${stagePipeline}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0 0 16px;color:#333">Engagement Details</h2>
        ${infoGrid}
        ${progressBar}
      </div>
      <div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
        <h2 style="font-size:0.95rem;font-weight:700;margin:0 0 16px;color:#333">RFIs (${rfis.length})</h2>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0">
            <th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">NAME</th>
            <th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">STATUS</th>
            <th style="padding:8px 12px;text-align:left;font-size:0.75rem;color:#666;font-weight:600">DEADLINE</th>
          </tr></thead>
          <tbody>${rfiRows}</tbody>
        </table>
      </div>
    </div>
  `;

  const body = `<div style="min-height:100vh;background:#f7f8fa">${nav(user)}<main style="padding:24px 32px" id="main-content">${content}</main></div>`;
  return generateHtml(`${esc(e.name || 'Engagement')} | MY FRIDAY`, body, []);
}
