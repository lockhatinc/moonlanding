import { h } from '@/ui/webjsx.js'
import { page, statCards, dataTable } from '@/ui/layout.js'
import { getNavItems, getQuickActions } from '@/ui/permissions-ui.js'

export function renderDashboard(user, stats = {}) {
  const isClerk = user?.role === 'clerk'

  const statDefs = isClerk
    ? [
        { label: 'My RFIs', value: stats.myRfis?.length || 0, color: '#1976d2', icon: '&#128203;', href: '/rfi' },
        { label: 'Overdue', value: stats.overdueRfis?.length || 0, color: '#c62828', icon: '&#9888;', href: '/rfi' },
        { label: 'Reviews', value: stats.reviews || 0, color: '#2e7d32', icon: '&#128196;', href: '/review' },
        { label: 'Clients', value: stats.clients || 0, color: '#555', icon: '&#127968;', href: '/client' },
      ]
    : [
        { label: 'Engagements', value: stats.engagements || 0, color: '#1565c0', icon: '&#128203;', href: '/engagements' },
        { label: 'Clients', value: stats.clients || 0, color: '#04141f', icon: '&#127968;', href: '/client' },
        { label: 'Open RFIs', value: stats.rfis || 0, color: stats.overdueRfis?.length > 0 ? '#c62828' : '#e65100', icon: '&#128193;', href: '/rfi' },
        { label: 'Reviews', value: stats.reviews || 0, color: '#2e7d32', icon: '&#128196;', href: '/review' },
      ]

  const cards = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:24px">` +
    statDefs.map(s => `<a href="${s.href}" style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px;text-decoration:none;display:block;border-left:4px solid ${s.color};transition:box-shadow 0.15s" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.08)'">
      <div style="font-size:1.4rem;margin-bottom:6px">${s.icon}</div>
      <div style="font-size:2rem;font-weight:700;color:${s.color};line-height:1">${s.value}</div>
      <div style="font-size:0.78rem;color:#666;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${s.label}</div>
    </a>`).join('') + `</div>`

  const overdueAlert = stats.overdueRfis?.length > 0
    ? `<div style="background:#fdecea;border:1px solid #f5c6cb;border-radius:8px;padding:14px 18px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#c62828;font-weight:600;font-size:0.88rem">&#9888; ${stats.overdueRfis.length} overdue RFI${stats.overdueRfis.length !== 1 ? 's' : ''} require attention</span>
        <a href="/rfi" style="background:#c62828;color:#fff;padding:5px 12px;border-radius:6px;text-decoration:none;font-size:0.8rem;font-weight:600">View RFIs</a>
      </div>` : ''

  const quickActions = getQuickActions(user)
  const actionsHtml = quickActions.length > 0
    ? `<div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px;margin-bottom:16px">
        <div style="font-size:0.9rem;font-weight:700;color:#333;margin-bottom:12px">Quick Actions</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">${quickActions.map(a => `<a href="${a.href}" style="background:${a.primary ? '#04141f' : '#f5f5f5'};color:${a.primary ? '#fff' : '#333'};padding:7px 14px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600;transition:opacity 0.15s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">${a.label}</a>`).join('')}</div>
      </div>` : ''

  const navLinks = getNavItems(user)
  const navHtml = navLinks.length > 0
    ? `<div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px;margin-bottom:16px">
        <div style="font-size:0.9rem;font-weight:700;color:#333;margin-bottom:12px">Navigate</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">${navLinks.map(n => `<a href="${n.href}" style="background:#f7f8fa;border:1px solid #e0e0e0;color:#333;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:500" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='#f7f8fa'">${n.label}</a>`).join('')}</div>
      </div>` : ''

  const recentRows = (stats.recentEngagements || []).map(e => {
    const sc = {info_gathering:['#e53935','#ffebee'],commencement:['#e65100','#fff3e0'],team_execution:['#1565c0','#e3f2fd'],partner_review:['#283593','#e8eaf6'],finalization:['#2e7d32','#e8f5e9'],closeout:['#33691e','#f1f8e9']}
    const stageLabels = {info_gathering:'Info Gathering',commencement:'Commencement',team_execution:'Team Execution',partner_review:'Partner Review',finalization:'Finalization',closeout:'Close Out'}
    const [sc_,sbg] = sc[e.stage] || ['#555','#f5f5f5']
    const stagePill = `<span style="background:${sbg};color:${sc_};padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:700;border:1px solid ${sc_}44">${stageLabels[e.stage]||e.stage||'-'}</span>`
    const sm = {active:['#2e7d32','#e8f5e9'],pending:['#e65100','#fff3e0'],inactive:['#555','#f5f5f5']}
    const [sc2,sbg2] = sm[e.status] || ['#555','#f5f5f5']
    const statusPill = `<span style="background:${sbg2};color:${sc2};padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:700;border:1px solid ${sc2}44">${e.status ? e.status.charAt(0).toUpperCase()+e.status.slice(1) : '-'}</span>`
    const name = String(e.name || e.client_name || 'Untitled').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    const client = String(e.client_id_display || e.client_name || '-').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    const updated = e.updated_at ? new Date(typeof e.updated_at === 'number' ? e.updated_at * 1000 : e.updated_at).toLocaleDateString() : '-'
    return `<tr onclick="location.href='/engagement/${e.id}'" style="cursor:pointer;border-bottom:1px solid #f0f0f0" onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background=''">
      <td style="padding:9px 12px;font-weight:500;font-size:0.82rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</td>
      <td style="padding:9px 12px;font-size:0.8rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${client}</td>
      <td style="padding:9px 12px">${stagePill}</td>
      <td style="padding:9px 12px">${statusPill}</td>
      <td style="padding:9px 12px;font-size:0.78rem;color:#888">${updated}</td>
    </tr>`
  }).join('')

  const recentHtml = !isClerk && (stats.recentEngagements || []).length > 0
    ? `<div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-size:0.9rem;font-weight:700;color:#333">Recent Engagements</div>
          <a href="/engagements" style="font-size:0.78rem;color:#1565c0;text-decoration:none;font-weight:600">View all</a>
        </div>
        <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
          <thead><tr style="border-bottom:2px solid #e0e0e0">
            <th style="padding:7px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600;text-transform:uppercase">Name</th>
            <th style="padding:7px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600;text-transform:uppercase">Client</th>
            <th style="padding:7px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600;text-transform:uppercase">Stage</th>
            <th style="padding:7px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600;text-transform:uppercase">Status</th>
            <th style="padding:7px 12px;text-align:left;font-size:0.72rem;color:#666;font-weight:600;text-transform:uppercase">Updated</th>
          </tr></thead>
          <tbody>${recentRows}</tbody>
        </table></div>
      </div>` : ''

  const content = `
    <div style="margin-bottom:24px">
      <h1 style="font-size:1.5rem;font-weight:700;color:#1a1a1a;margin:0 0 4px">Welcome back, ${user?.name || 'User'}</h1>
      <p style="color:#888;font-size:0.88rem;margin:0">${new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    ${cards}
    ${overdueAlert}
    ${actionsHtml}
    ${navHtml}
    ${recentHtml}
  `
  return page(user, 'Dashboard | MY FRIDAY', [], content)
}

export function renderAuditDashboard(user, auditData = {}) {
  const { summary = {}, recentActivity = [] } = auditData
  const actRows = recentActivity.slice(0, 20).map(a => `<tr><td>${new Date((a.timestamp||a.created_at)*1000).toLocaleString()}</td><td><span class="badge badge-sm">${a.action||'-'}</span></td><td>${a.entity_type||'-'}</td><td class="text-xs">${a.entity_id||'-'}</td><td>${a.user_name||a.user_id||'-'}</td><td class="text-xs text-gray-500">${a.reason||'-'}</td></tr>`).join('') || '<tr><td colspan="6" class="text-center py-4 text-gray-500">No audit records found</td></tr>'

  const cards = statCards([
    { label: 'Total Actions (30d)', value: summary.total_actions || 0 },
    { label: 'Permission Grants', value: summary.grants || 0, textClass: ' text-green-600' },
    { label: 'Permission Revokes', value: summary.revokes || 0, textClass: ' text-red-600' },
    { label: 'Role Changes', value: summary.role_changes || 0, textClass: ' text-blue-600' },
  ])

  const content = `<h1 class="text-2xl font-bold mb-6">Audit Dashboard</h1>${cards}
    <div class="card bg-white shadow"><div class="card-body"><div class="flex justify-between items-center mb-4"><h2 class="card-title">Recent Activity</h2><a href="/permission_audit" class="btn btn-sm btn-outline">View All Records</a></div>
    <div style="overflow-x:auto">${dataTable('<th>Time</th><th>Action</th><th>Entity Type</th><th>Entity ID</th><th>User</th><th>Reason</th>', actRows, 'No audit records')}</div></div></div>`
  return page(user, 'Audit Dashboard', [{ href: '/', label: 'Dashboard' }, { href: '/admin/audit', label: 'Audit' }], content)
}

export function renderSystemHealth(user, healthData = {}) {
  const { database = {}, server: srv = {}, entities = {} } = healthData
  const entRows = Object.entries(entities).map(([n, c]) => `<tr><td>${n}</td><td class="text-right">${c}</td></tr>`).join('') || '<tr><td colspan="2" class="text-center py-4">No data</td></tr>'

  const cards = statCards([
    { label: 'Server Status', value: 'Online', textClass: ' text-green-600', sub: `Port: ${srv.port || 3004}` },
    { label: 'Database', value: database.status || 'Connected', textClass: ' text-green-600', sub: `Size: ${database.size || 'N/A'}` },
    { label: 'Uptime', value: srv.uptime || 'N/A', sub: `Started: ${srv.startTime || 'N/A'}` },
  ])

  const content = `<h1 class="text-2xl font-bold mb-6">System Health</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">${cards.replace('md:grid-cols-4', 'md:grid-cols-3')}</div>
    <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title mb-4">Entity Counts</h2><table class="table w-full"><thead><tr><th>Entity</th><th class="text-right">Count</th></tr></thead><tbody>${entRows}</tbody></table></div></div>`
  return page(user, 'System Health', [{ href: '/', label: 'Dashboard' }, { href: '/admin/health', label: 'Health' }], content)
}
