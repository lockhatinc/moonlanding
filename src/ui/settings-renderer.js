import { page } from '@/ui/layout.js';
import { TOAST_SCRIPT, statusBadge as _statusBadge } from '@/ui/render-helpers.js';

export { TOAST_SCRIPT } from '@/ui/render-helpers.js';

export function settingsPage(user, title, bc, content, scripts = []) {
  return page(user, title, bc, content, scripts);
}

export function settingsBack() {
  return `<a href="/admin/settings" class="btn btn-ghost btn-sm gap-1 mb-4">&#8592; Back to Settings</a>`;
}

export function inlineTable(headers, rows, emptyMsg) {
  const ths = headers.map(h => `<th>${h}</th>`).join('');
  const empty = `<tr><td colspan="${headers.length}" class="text-center py-8 text-base-content/40 text-sm">${emptyMsg}</td></tr>`;
  return `<div class="table-container"><table class="table table-hover"><thead><tr>${ths}</tr></thead><tbody>${rows || empty}</tbody></table></div>`;
}

export function roleBadge(role) {
  const r = (role || '').toLowerCase();
  const pillMap = { admin:'pill pill-danger', partner:'pill pill-info', manager:'pill pill-success', clerk:'pill pill-warning', user:'pill pill-neutral', auditor:'pill pill-neutral' };
  const cls = pillMap[r] || 'pill pill-neutral';
  const label = r ? r.charAt(0).toUpperCase() + r.slice(1) : 'Staff';
  return `<span class="${cls}" title="${role}">${label}</span>`;
}

function statusBadge(status) { return _statusBadge(status); }

const SETTINGS_CARDS = [
  { key: 'system', icon: '&#9881;', title: 'System Info', desc: 'Database, server, cache configuration', href: '/admin/settings/system' },
  { key: 'users', icon: '&#128100;', title: 'Users', desc: 'Manage user accounts and roles', href: '/admin/settings/users', countKey: 'users' },
  { key: 'teams', icon: '&#128101;', title: 'Teams', desc: 'Manage audit teams', href: '/admin/settings/teams', countKey: 'teams' },
  { key: 'rfi-sections', icon: '&#128193;', title: 'RFI Sections', desc: 'Manage RFI section categories and colors', href: '/admin/settings/rfi-sections', countKey: 'rfiSections' },
  { key: 'templates', icon: '&#128196;', title: 'Templates', desc: 'Review templates and sections', href: '/admin/settings/templates', countKey: 'templates' },
  { key: 'notifications', icon: '&#128276;', title: 'Notifications', desc: 'Configure alerts, reminders, and reports', href: '/admin/settings/notifications' },
  { key: 'integrations', icon: '&#128279;', title: 'Integrations', desc: 'Google Drive, Gmail, and external services', href: '/admin/settings/integrations' },
  { key: 'checklists', icon: '&#9745;', title: 'Checklists', desc: 'Manage checklist definitions', href: '/admin/settings/checklists', countKey: 'checklists' },
  { key: 'recreation', icon: '&#128203;', title: 'Recreation Logs', desc: 'Audit trail and recreation history', href: '/admin/settings/recreation', countKey: 'recreation' },
];

export function renderSettingsHome(user, config = {}, counts = {}) {
  const cards = SETTINGS_CARDS.map(c => {
    const badge = c.countKey && counts[c.countKey] !== undefined
      ? `<span class="badge badge-flat-primary text-xs mt-2">${counts[c.countKey]} items</span>` : '';
    return `<a href="${c.href}" class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow" style="text-decoration:none">
      <div class="card-clean-body">
        <div class="flex items-start gap-3">
          <div class="text-2xl">${c.icon}</div>
          <div>
            <div class="font-bold text-base-content">${c.title}</div>
            <div class="text-sm text-base-content/60 mt-1">${c.desc}</div>
            ${badge}
          </div>
        </div>
      </div>
    </a>`;
  }).join('');
  const content = `<h1 class="text-2xl font-bold text-base-content mb-4">Settings</h1><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>`;
  return settingsPage(user, 'Settings', [{ href: '/', label: 'Dashboard' }, { label: 'Settings' }], content);
}

export function renderSettingsSystem(user, config = {}) {
  const t = config.thresholds || {};
  const sections = [
    { title: 'System Information', items: [['Database Type', config.database?.type || 'SQLite'], ['Server Port', config.server?.port || 3004], ['Session TTL', (t.cache?.session_ttl_seconds || 3600) + 's'], ['Page Size (Default)', t.system?.default_page_size || 50], ['Page Size (Max)', t.system?.max_page_size || 500]] },
    { title: 'RFI Configuration', items: [['Max Days Outstanding', (t.rfi?.max_days_outstanding || 90) + ' days'], ['Escalation Delay', (t.rfi?.escalation_delay_hours || 24) + ' hours'], ['Notification Days', (t.rfi?.notification_days || [7, 3, 1, 0]).join(', ')]] },
    { title: 'Email Configuration', items: [['Batch Size', t.email?.send_batch_size || 10], ['Max Retries', t.email?.send_max_retries || 3], ['Rate Limit Delay', (t.email?.rate_limit_delay_ms || 6000) + 'ms']] },
    { title: 'Workflow Configuration', items: [['Stage Transition Lockout', (t.workflow?.stage_transition_lockout_minutes || 5) + ' min'], ['Collaborator Default Expiry', (t.collaborator?.default_expiry_days || 7) + ' days'], ['Collaborator Max Expiry', (t.collaborator?.max_expiry_days || 30) + ' days']] },
  ];
  const cards = sections.map(s => `<div class="card bg-base-100 shadow-md">
    <div class="card-clean-body">
      <h2 class="card-title text-sm mb-3">${s.title}</h2>
      ${s.items.map(([l, v]) => `<div class="flex justify-between py-2 border-b border-base-200 last:border-0"><span class="text-sm text-base-content/60">${l}</span><span class="text-sm font-semibold">${v}</span></div>`).join('')}
    </div>
  </div>`).join('');
  const content = `${settingsBack()}<h1 class="text-2xl font-bold mb-4">System Info</h1><div class="grid grid-cols-1 md:grid-cols-2 gap-4">${cards}</div>`;
  return settingsPage(user, 'System Info - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'System Info' }], content);
}

export function renderSettingsUsers(user, users = []) {
  const rows = users.map(u => `<tr class="hover cursor-pointer" onclick="window.location='/user/${u.id}'">
    <td>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">${(u.name||'?').charAt(0).toUpperCase()}</div>
        <span class="text-sm font-medium">${u.name || '-'}</span>
      </div>
    </td>
    <td class="text-sm text-base-content/60">${u.email || '-'}</td>
    <td>${roleBadge(u.role || '-')}</td>
    <td>${statusBadge(u.status)}</td>
    <td><a href="/user/${u.id}/edit" onclick="event.stopPropagation()" class="btn btn-ghost btn-xs">Edit</a></td>
  </tr>`).join('');

  const content = `${settingsBack()}
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">Users</h1>
    <a href="/user/new" class="btn btn-primary btn-sm gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add User</a>
  </div>
  <div class="card bg-base-100 shadow-md">
    <div class="card-body p-0">
      ${inlineTable(['User', 'Email', 'Role', 'Status', 'Actions'], rows, 'No users found')}
    </div>
  </div>`;
  return settingsPage(user, 'Users - Settings', [{ href: '/', label: 'Dashboard' }, { href: '/admin/settings', label: 'Settings' }, { label: 'Users' }], content);
}

export { renderSettingsTeams, renderSettingsRfiSections } from '@/ui/settings-renderer-teams.js';
