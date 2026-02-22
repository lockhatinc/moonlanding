import { h } from '@/ui/webjsx.js'
import { page, statCards, dataTable } from '@/ui/layout.js'
import { getNavItems, getQuickActions } from '@/ui/permissions-ui.js'

function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function stageBadge(stage) {
  const map = {info_gathering:['badge-error','Info Gathering'],commencement:['badge-warning','Commencement'],team_execution:['badge-flat-primary','Team Execution'],partner_review:['badge-flat-secondary','Partner Review'],finalization:['badge-success','Finalization'],closeout:['badge-success','Close Out']}
  const [cls, lbl] = map[stage] || ['badge-flat-secondary', stage || '-']
  return `<span class="badge ${cls} badge-flat-${cls.replace('badge-','')} text-xs">${lbl}</span>`
}

function statusBadge(status) {
  const map = {active:'badge-success badge-flat-success',pending:'badge-warning badge-flat-warning',inactive:'badge-flat-secondary'}
  const cls = map[status] || 'badge-flat-secondary'
  const lbl = status ? status.charAt(0).toUpperCase()+status.slice(1) : '-'
  return `<span class="badge ${cls} text-xs">${lbl}</span>`
}

export function renderDashboard(user, stats = {}) {
  const isClerk = user?.role === 'clerk'

  const statDefs = isClerk
    ? [
        { label: 'My RFIs', value: stats.myRfis?.length || 0, desc: 'Assigned to you', href: '/rfi' },
        { label: 'Overdue', value: stats.overdueRfis?.length || 0, desc: 'Need attention', href: '/rfi', warn: true },
        { label: 'Reviews', value: stats.reviews || 0, desc: 'Total reviews', href: '/review' },
        { label: 'Clients', value: stats.clients || 0, desc: 'Active clients', href: '/client' },
      ]
    : [
        { label: 'Engagements', value: stats.engagements || 0, desc: 'Total engagements', href: '/engagements' },
        { label: 'Clients', value: stats.clients || 0, desc: 'Active clients', href: '/client' },
        { label: 'Open RFIs', value: stats.rfis || 0, desc: stats.overdueRfis?.length > 0 ? `${stats.overdueRfis.length} overdue` : 'All on track', href: '/rfi', warn: stats.overdueRfis?.length > 0 },
        { label: 'Reviews', value: stats.reviews || 0, desc: 'Active reviews', href: '/review' },
      ]

  const statsHtml = `<div class="stats shadow w-full mb-6 flex-wrap">` +
    statDefs.map(s => `<a href="${s.href}" class="stat hover:bg-base-200 transition-colors" style="text-decoration:none">
      <div class="stat-title">${s.label}</div>
      <div class="stat-value ${s.warn ? 'text-error' : ''}">${s.value}</div>
      <div class="stat-desc">${s.desc}</div>
    </a>`).join('') + `</div>`

  const overdueAlert = stats.overdueRfis?.length > 0
    ? `<div class="alert alert-error mb-4 flex justify-between items-center">
        <span>${stats.overdueRfis.length} overdue RFI${stats.overdueRfis.length !== 1 ? 's' : ''} require attention</span>
        <a href="/rfi" class="btn btn-sm btn-error">View RFIs</a>
      </div>` : ''

  const quickActions = getQuickActions(user)
  const actionsHtml = quickActions.length > 0
    ? `<div class="card bg-base-100 shadow-md mb-4">
        <div class="card-body">
          <h2 class="card-title text-sm">Quick Actions</h2>
          <div class="flex flex-wrap gap-2">
            ${quickActions.map(a => `<a href="${a.href}" class="btn btn-sm ${a.primary ? 'btn-primary' : 'btn-ghost'}">${a.label}</a>`).join('')}
          </div>
        </div>
      </div>` : ''

  const recentRows = (stats.recentEngagements || []).map(e => {
    const name = esc(e.name || e.client_name || 'Untitled')
    const client = esc(e.client_id_display || e.client_name || '-')
    const updated = e.updated_at ? new Date(typeof e.updated_at === 'number' ? e.updated_at * 1000 : e.updated_at).toLocaleDateString() : '-'
    return `<tr class="hover cursor-pointer" onclick="location.href='/engagement/${esc(e.id)}'">
      <td class="font-medium text-sm">${name}</td>
      <td class="text-sm text-base-content/70">${client}</td>
      <td>${stageBadge(e.stage)}</td>
      <td>${statusBadge(e.status)}</td>
      <td class="text-sm text-base-content/50">${updated}</td>
    </tr>`
  }).join('')

  const recentHtml = !isClerk && (stats.recentEngagements || []).length > 0
    ? `<div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <div class="flex justify-between items-center mb-2">
            <h2 class="card-title text-sm">Recent Engagements</h2>
            <a href="/engagements" class="btn btn-ghost btn-sm">View all</a>
          </div>
          <div class="table-container">
            <table class="table table-hover">
              <thead><tr>
                <th>Name</th><th>Client</th><th>Stage</th><th>Status</th><th>Updated</th>
              </tr></thead>
              <tbody>${recentRows}</tbody>
            </table>
          </div>
        </div>
      </div>` : ''

  const content = `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-base-content">Welcome back, ${esc(user?.name || 'User')}</h1>
      <p class="text-base-content/60 text-sm mt-1">${new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    ${statsHtml}
    ${overdueAlert}
    ${actionsHtml}
    ${recentHtml}
  `
  return page(user, 'Dashboard | MY FRIDAY', [], content)
}

export function renderAuditDashboard(user, auditData = {}) {
  const { summary = {}, recentActivity = [] } = auditData
  const actRows = recentActivity.slice(0, 20).map(a => `<tr><td>${new Date((a.timestamp||a.created_at)*1000).toLocaleString()}</td><td><span class="badge badge-sm">${a.action||'-'}</span></td><td>${a.entity_type||'-'}</td><td class="text-xs">${a.entity_id||'-'}</td><td>${a.user_name||a.user_id||'-'}</td><td class="text-xs text-base-content/50">${a.reason||'-'}</td></tr>`).join('') || '<tr><td colspan="6" class="text-center py-4 text-base-content/50">No audit records found</td></tr>'

  const cards = statCards([
    { label: 'Total Actions (30d)', value: summary.total_actions || 0 },
    { label: 'Permission Grants', value: summary.grants || 0, textClass: ' text-success' },
    { label: 'Permission Revokes', value: summary.revokes || 0, textClass: ' text-error' },
    { label: 'Role Changes', value: summary.role_changes || 0, textClass: ' text-primary' },
  ])

  const content = `<h1 class="text-2xl font-bold mb-6">Audit Dashboard</h1>${cards}
    <div class="card bg-base-100 shadow-md"><div class="card-body"><div class="flex justify-between items-center mb-4"><h2 class="card-title">Recent Activity</h2><a href="/permission_audit" class="btn btn-sm btn-outline-primary">View All Records</a></div>
    <div class="table-container">${dataTable('<th>Time</th><th>Action</th><th>Entity Type</th><th>Entity ID</th><th>User</th><th>Reason</th>', actRows, 'No audit records')}</div></div></div>`
  return page(user, 'Audit Dashboard', [{ href: '/', label: 'Dashboard' }, { href: '/admin/audit', label: 'Audit' }], content)
}

export function renderSystemHealth(user, healthData = {}) {
  const { database = {}, server: srv = {}, entities = {} } = healthData
  const entRows = Object.entries(entities).map(([n, c]) => `<tr><td>${n}</td><td class="text-right">${c}</td></tr>`).join('') || '<tr><td colspan="2" class="text-center py-4">No data</td></tr>'

  const cards = statCards([
    { label: 'Server Status', value: 'Online', textClass: ' text-success', sub: `Port: ${srv.port || 3004}` },
    { label: 'Database', value: database.status || 'Connected', textClass: ' text-success', sub: `Size: ${database.size || 'N/A'}` },
    { label: 'Uptime', value: srv.uptime || 'N/A', sub: `Started: ${srv.startTime || 'N/A'}` },
  ])

  const content = `<h1 class="text-2xl font-bold mb-6">System Health</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">${cards}</div>
    <div class="card bg-base-100 shadow-md"><div class="card-body"><h2 class="card-title mb-4">Entity Counts</h2>
    <div class="table-container"><table class="table table-hover"><thead><tr><th>Entity</th><th class="text-right">Count</th></tr></thead><tbody>${entRows}</tbody></table></div></div></div>`
  return page(user, 'System Health', [{ href: '/', label: 'Dashboard' }, { href: '/admin/health', label: 'Health' }], content)
}
