import { generateHtml } from '@/ui/renderer.js';
import { nav } from '@/ui/layout.js';

const STATUS_COLORS = {
  draft:    ['#888', '#f5f5f5'],
  active:   ['#1565c0', '#e3f2fd'],
  sent:     ['#e65100', '#fff3e0'],
  responded:['#2e7d32', '#e8f5e9'],
  closed:   ['#555', '#eeeeee'],
  overdue:  ['#c62828', '#ffebee'],
};

function statusBadge(status) {
  const s = (status || 'draft').toLowerCase();
  const [color, bg] = STATUS_COLORS[s] || STATUS_COLORS.draft;
  return `<span style="background:${bg};color:${color};padding:2px 9px;border-radius:10px;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.3px">${s}</span>`;
}

function deadlineDisplay(deadline) {
  if (!deadline) return '<span style="color:#aaa">—</span>';
  const d = typeof deadline === 'number' ? new Date(deadline * 1000) : new Date(deadline);
  const isOverdue = d < new Date();
  const str = d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  return `<span style="color:${isOverdue ? '#c62828' : '#333'};font-weight:${isOverdue ? '600' : '400'}">${str}${isOverdue ? ' ⚠' : ''}</span>`;
}

export function renderRfiList(user, rfis = [], engagements = []) {
  const engMap = Object.fromEntries(engagements.map(e => [e.id, e]));

  const statusCounts = rfis.reduce((acc, r) => {
    const s = (r.status || 'draft').toLowerCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const tabs = ['all', 'active', 'draft', 'sent', 'responded', 'closed', 'overdue'];
  const tabBar = `<div style="display:flex;gap:0;border-bottom:2px solid #e0e0e0;margin-bottom:20px">` +
    tabs.map(t => {
      const count = t === 'all' ? rfis.length : (statusCounts[t] || 0);
      return `<button onclick="filterTab('${t}')" id="tab-${t}" style="padding:10px 16px;border:none;background:none;cursor:pointer;font-size:0.82rem;font-weight:600;color:#888;border-bottom:3px solid transparent;margin-bottom:-2px;transition:color 0.15s" onmouseover="this.style.color='#1a1a1a'" onmouseout="if(currentTab!=='${t}')this.style.color='#888'">${t === 'all' ? 'All RFIs' : t.charAt(0).toUpperCase()+t.slice(1)} <span style="background:#f0f0f0;color:#666;padding:1px 6px;border-radius:8px;font-size:0.68rem;margin-left:3px">${count}</span></button>`;
    }).join('') + `</div>`;

  const rows = rfis.map(r => {
    const eng = engMap[r.engagement_id] || {};
    const s = (r.status || 'draft').toLowerCase();
    return `<tr class="rfi-row" data-status="${s}" style="border-bottom:1px solid #f0f0f0;cursor:pointer" onclick="window.location='/rfi/${r.id}'" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background=''">
      <td style="padding:10px 12px;font-size:0.82rem;font-weight:500">${r.display_name || r.name || r.title || 'RFI ' + r.id.slice(0,6)}</td>
      <td style="padding:10px 12px"><a href="/engagement/${r.engagement_id}" onclick="event.stopPropagation()" style="color:#1565c0;text-decoration:none;font-size:0.82rem">${eng.name || eng.client_name || (r.engagement_id ? r.engagement_id.slice(0,12)+'…' : '—')}</a></td>
      <td style="padding:10px 12px">${statusBadge(r.status)}</td>
      <td style="padding:10px 12px;font-size:0.82rem">${deadlineDisplay(r.deadline)}</td>
      <td style="padding:10px 12px;font-size:0.78rem;color:#888">${r.created_at ? new Date(typeof r.created_at==='number'?r.created_at*1000:r.created_at).toLocaleDateString('en-ZA') : '—'}</td>
    </tr>`;
  }).join('');

  const empty = `<tr><td colspan="5" style="padding:40px;text-align:center;color:#aaa;font-size:0.85rem">No RFIs found</td></tr>`;

  const table = `<div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);overflow-x:auto">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#fafafa">
        <th style="padding:10px 12px;text-align:left;font-size:0.72rem;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e0e0e0">Name</th>
        <th style="padding:10px 12px;text-align:left;font-size:0.72rem;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e0e0e0">Engagement</th>
        <th style="padding:10px 12px;text-align:left;font-size:0.72rem;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e0e0e0">Status</th>
        <th style="padding:10px 12px;text-align:left;font-size:0.72rem;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e0e0e0">Deadline</th>
        <th style="padding:10px 12px;text-align:left;font-size:0.72rem;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e0e0e0">Created</th>
      </tr></thead>
      <tbody id="rfi-tbody">${rows || empty}</tbody>
    </table>
  </div>`;

  const overdueCount = rfis.filter(r => r.deadline && new Date(typeof r.deadline==='number'?r.deadline*1000:r.deadline) < new Date()).length;
  const alert = overdueCount > 0 ? `<div style="background:#ffebee;border:1px solid #ffcdd2;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center"><span style="color:#c62828;font-weight:600;font-size:0.85rem">&#9888; ${overdueCount} overdue RFI${overdueCount!==1?'s':''} require attention</span></div>` : '';

  const content = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <h1 style="font-size:1.4rem;font-weight:700;margin:0">RFIs <span style="font-size:0.9rem;color:#888;font-weight:400">(${rfis.length})</span></h1>
    <a href="/rfi/new" style="background:#04141f;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600">New RFI</a>
  </div>${alert}${tabBar}${table}`;

  const script = `var currentTab='all';
    function filterTab(t){
      currentTab=t;
      document.querySelectorAll('[id^=tab-]').forEach(b=>{b.style.color='#888';b.style.borderBottomColor='transparent'});
      var btn=document.getElementById('tab-'+t);
      if(btn){btn.style.color='#1a1a1a';btn.style.borderBottomColor='#1565c0'}
      document.querySelectorAll('.rfi-row').forEach(row=>{
        row.style.display=(t==='all'||row.dataset.status===t)?'':'none'
      });
    }
    filterTab('all');`;

  const body = `<div style="min-height:100vh;background:#f7f8fa">${nav(user)}<main style="padding:24px 32px">${content}</main></div>`;
  return generateHtml('RFIs | MY FRIDAY', body, [script]);
}
