import { h } from '@/ui/webjsx.js'
import { page, statCards, dataTable } from '@/ui/layout.js'
import { getNavItems, getQuickActions } from '@/ui/permissions-ui.js'

export function renderDashboard(user, stats = {}) {
  const isClerk = user?.role === 'clerk'
  const welcomeMsg = isClerk ? 'Here are your assigned tasks' : (user?.role === 'manager' ? 'Team overview' : 'System overview')

  const myRfis = (stats.myRfis?.length > 0) ? `<div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">My Assigned RFIs</h2><div class="mt-4">${dataTable('<th>Title</th><th>Status</th><th>Due Date</th><th>Action</th>',
    stats.myRfis.map(r => `<tr><td>${r.title || 'Untitled'}</td><td><span class="badge badge-sm">${r.status || 'open'}</span></td><td>${r.due_date ? new Date(r.due_date * 1000).toLocaleDateString() : '-'}</td><td><a href="/rfi/${r.id}" class="btn btn-xs btn-primary">View</a></td></tr>`).join(''), '')}</div></div>` : ''

  const overdue = (stats.overdueRfis?.length > 0) ? `<div class="card bg-white shadow border-l-4 border-red-500"><div class="card-body"><h2 class="card-title text-red-600">Overdue Items</h2><div class="mt-4">${dataTable('<th>Title</th><th>Days Overdue</th><th>Action</th>',
    stats.overdueRfis.map(r => `<tr class="text-red-600"><td>${r.title || 'Untitled RFI'}</td><td>${r.daysOverdue || 0} days</td><td><a href="/rfi/${r.id}" class="btn btn-xs btn-error">View</a></td></tr>`).join(''), '')}</div></div>` : ''

  const cards = statCards([
    { label: isClerk ? 'My RFIs' : 'Engagements', value: isClerk ? (stats.myRfis?.length || 0) : (stats.engagements || 0) },
    { label: 'Clients', value: stats.clients || 0 },
    { label: (stats.overdueRfis?.length > 0) ? 'Overdue RFIs' : 'Open RFIs', value: (stats.overdueRfis?.length > 0) ? stats.overdueRfis.length : (stats.rfis || 0), border: (stats.overdueRfis?.length > 0) ? ' border-l-4 border-red-500' : '', textClass: (stats.overdueRfis?.length > 0) ? ' text-red-600' : '' },
    { label: 'Reviews', value: stats.reviews || 0 },
  ])

  const actions = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">Quick Actions</h2><div class="flex flex-wrap gap-2 mt-4">${getQuickActions(user).map(a => `<a href="${a.href}" class="btn ${a.primary ? 'btn-primary' : 'btn-outline'} btn-sm">${a.label}</a>`).join('')}</div></div></div>
    <div class="card bg-white shadow"><div class="card-body"><h2 class="card-title">Navigation</h2><div class="flex flex-wrap gap-2 mt-4">${getNavItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('')}</div></div></div></div>`

  const content = `<div class="mb-6"><h1 class="text-2xl font-bold">Dashboard</h1><p class="text-gray-500">Welcome back, ${user?.name || 'User'}. ${welcomeMsg}</p></div>${cards}${overdue}${myRfis}${actions}`
  return page(user, 'Dashboard', [{ href: '/', label: 'Dashboard' }], content)
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
