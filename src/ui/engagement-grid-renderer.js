import { statusLabel, linearProgress, engagementProgress, userAvatar, teamAvatarGroup, generateHtml } from '@/ui/renderer.js';
import { canCreate, canEdit, canDelete, getNavItems, getAdminItems } from '@/ui/permissions-ui.js';
import { memoize } from '@/lib/render-cache.js';
import { virtualScrollScript, deferOffscreen } from '@/ui/virtual-scroll.js';
import { eventDelegation, perfBudget } from '@/ui/perf-helpers.js';

const STAGE_KEYS = ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'closeout'];

function nav(user) {
  const links = getNavItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  const admin = getAdminItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  return `<nav class="navbar bg-white shadow-sm px-4" role="navigation" aria-label="Main navigation"><div class="navbar-start"><a href="/" class="font-bold text-lg" aria-label="Home">Platform</a><div class="hidden md:flex gap-1 ml-6">${links}${admin}</div></div><div class="navbar-end"><div id="user-dropdown" class="dropdown dropdown-end"><button type="button" onclick="toggleUserMenu(event)" class="btn btn-ghost btn-circle avatar placeholder" style="cursor:pointer" aria-label="User menu for ${user?.name || 'User'}" aria-haspopup="menu" aria-expanded="false"><div class="bg-primary text-white rounded-full w-10" style="display:flex;align-items:center;justify-content:center;height:2.5rem"><span aria-hidden="true">${user?.name?.charAt(0) || 'U'}</span></div></button></div></div></nav>`;
}

function bc(items) {
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map((item, i) => i === items.length - 1 ? `<span>${item.label}</span>` : `<a href="${item.href}">${item.label}</a><span class="breadcrumb-separator">/</span>`).join('')}</nav>`;
}

function page(user, title, crumbs, content, scripts = []) {
  const body = `<div class="min-h-screen">${nav(user)}<main id="main-content" role="main"><div class="p-6">${bc(crumbs)}${content}</div></main></div>`;
  return generateHtml(title, body, scripts);
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const stageCounts = memoize(function stageCounts(engagements) {
  const counts = {};
  STAGE_KEYS.forEach(k => { counts[k] = 0; });
  engagements.forEach(e => { if (counts[e.stage] !== undefined) counts[e.stage]++; });
  return counts;
});

const stageCountBar = memoize(function stageCountBar(counts, total) {
  const pills = STAGE_KEYS.map(k => {
    const n = counts[k] || 0;
    const pct = total > 0 ? Math.round((n / total) * 100) : 0;
    const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `<div class="flex flex-col items-center flex-1 min-w-[80px]"><div class="text-lg font-bold">${n}</div><div class="text-xs text-gray-500 text-center">${label}</div><div class="w-full bg-gray-200 rounded-full h-1 mt-1"><div class="bg-blue-500 h-1 rounded-full" style="width:${pct}%"></div></div></div>`;
  }).join('');
  return `<div class="card bg-white shadow mb-6"><div class="card-body"><div class="flex justify-between items-center mb-3"><span class="font-semibold">Stage Overview</span><span class="text-sm text-gray-500">${total} total</span></div><div class="flex gap-2">${pills}</div></div></div>`;
});

function engagementRow(e, canEditEng) {
  const sts = e.status ? statusLabel(e.status) : '-';
  const stage = e.stage ? engagementProgress(e.stage) : '-';
  const pct = typeof e.progress === 'number' ? linearProgress(e.progress, 100, '', 'thin') : '-';
  const date = e.created_at ? (typeof e.created_at === 'number' ? new Date(e.created_at * 1000).toLocaleDateString() : e.created_at) : '-';
  const team = e.team_name || e.team_id_display || '-';
  const client = e.client_name || e.client_id_display || '-';
  return `<tr class="hover cursor-pointer" data-searchable data-stage="${e.stage || ''}" data-status="${e.status || ''}" data-team="${e.team_id || ''}" data-year="${e.year || ''}" tabindex="0" role="link" onclick="window.location='/engagement/${e.id}'" onkeydown="if(event.key==='Enter'){window.location='/engagement/${e.id}'}"><td class="font-medium">${e.name || 'Untitled'}</td><td>${client}</td><td>${sts}</td><td style="min-width:200px">${stage}</td><td style="min-width:120px">${pct}</td><td>${team}</td><td>${date}</td></tr>`;
}

export function renderEngagementGrid(user, engagements, options = {}) {
  const { filter = 'all', teams = [], years = [] } = options;
  const counts = stageCounts(engagements);
  const total = engagements.length;
  const userCanCreate = canCreate(user, 'engagement');
  const userCanEdit = canEdit(user, 'engagement');

  const tabs = [
    { key: 'all', label: 'All', count: total },
    { key: 'my', label: 'My Engagements', count: engagements.filter(e => e.assigned_to === user?.id || (e.users && e.users.includes?.(user?.id))).length },
    { key: 'team', label: 'Team', count: engagements.filter(e => e.team_id === user?.team_id).length },
  ];
  const tabBar = `<div class="flex gap-1 mb-4">${tabs.map(t => `<button class="btn btn-sm ${t.key === filter ? 'btn-primary' : 'btn-ghost'}" onclick="window.location='/engagements?filter=${t.key}'">${t.label} <span class="badge badge-sm ml-1">${t.count}</span></button>`).join('')}</div>`;

  const teamFilter = teams.length > 0 ? `<select id="filter-team" class="select select-bordered select-sm" onchange="filterGrid()"><option value="">All Teams</option>${teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select>` : '';
  const yearFilter = years.length > 0 ? `<select id="filter-year" class="select select-bordered select-sm" onchange="filterGrid()"><option value="">All Years</option>${years.map(y => `<option value="${y}">${y}</option>`).join('')}</select>` : '';
  const filters = `<div class="flex gap-2 mb-4 flex-wrap"><label for="grid-search" class="sr-only">Search engagements</label><input type="text" id="grid-search" placeholder="Search engagements..." class="input input-bordered input-sm" style="width:250px" aria-label="Search engagements"/>${teamFilter}${yearFilter}<label class="flex items-center gap-1 text-sm"><input type="checkbox" id="current-year-toggle" class="checkbox checkbox-sm"/>Current Year</label></div>`;

  const headers = '<th>Name</th><th>Client</th><th>Status</th><th>Stage</th><th>Progress</th><th>Team</th><th>Created</th>';
  const initialRows = engagements.slice(0, 100).map(e => engagementRow(e, userCanEdit)).join('');
  const deferredRows = engagements.slice(100).map(e => engagementRow(e, userCanEdit)).join('');
  const rows = initialRows + (deferredRows ? `<div class="defer-load" data-content="${escapeHtml(deferredRows)}"></div>` : '');
  const createBtn = userCanCreate ? `<a href="/engagement/new" class="btn btn-primary btn-sm">New Engagement</a>` : '';
  const table = `<div id="eng-grid" class="card bg-white shadow" style="overflow-x:auto;max-height:800px"><table class="table table-zebra w-full"><thead><tr>${headers}</tr></thead><tbody id="eng-tbody">${rows || '<tr><td colspan="7" class="text-center py-8 text-gray-500">No engagements found</td></tr>'}</tbody></table></div>`;

  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Engagements</h1>${createBtn}</div>${stageCountBar(counts, total)}${tabBar}${filters}${table}`;

  const filterScript = `function filterGrid(){const q=(document.getElementById('grid-search')?.value||'').toLowerCase();const tm=document.getElementById('filter-team')?.value||'';const yr=document.getElementById('filter-year')?.value||'';const cy=document.getElementById('current-year-toggle')?.checked;const now=new Date().getFullYear();document.querySelectorAll('#eng-tbody tr[data-searchable]').forEach(r=>{let show=true;if(q&&!r.textContent.toLowerCase().includes(q))show=false;if(tm&&r.dataset.team!==tm)show=false;if(yr&&r.dataset.year!==yr)show=false;if(cy&&r.dataset.year&&Number(r.dataset.year)!==now)show=false;r.style.display=show?'':'none'})}document.getElementById('grid-search')?.addEventListener('input',()=>{clearTimeout(window._gst);window._gst=setTimeout(filterGrid,300)})`;
  const clickScript = eventDelegation('eng-tbody', 'tr[data-searchable]', 'click', `window.location=t.querySelector('td')?.parentElement?.onclick?.toString().match(/\\/engagement\\/[^']+/)?.[0]||'#'`);
  const perfScript = perfBudget('engagement-grid-render', 200);
  const deferScript = deferOffscreen('.defer-load');
  const virtualScript = engagements.length > 200 ? virtualScrollScript('eng-grid', 48, 10) : '';
  const scripts = [filterScript, clickScript, perfScript, deferScript, virtualScript].filter(Boolean);

  return page(user, 'Engagements', [{ href: '/', label: 'Dashboard' }, { label: 'Engagements' }], content, scripts);
}

export function renderEngagementCardView(user, engagements) {
  const cards = engagements.map(e => {
    const sts = e.status ? statusLabel(e.status) : '';
    const pct = typeof e.progress === 'number' ? `<div class="w-full bg-gray-200 rounded-full h-1.5 mt-2"><div class="bg-blue-500 h-1.5 rounded-full" style="width:${Math.min(100, e.progress)}%"></div></div>` : '';
    return `<div class="card bg-white shadow hover:shadow-md cursor-pointer transition-shadow" onclick="window.location='/engagement/${e.id}'"><div class="card-body p-4"><div class="flex justify-between items-start mb-2"><span class="font-medium text-sm">${e.name || 'Untitled'}</span>${sts}</div><div class="text-xs text-gray-500 mb-2">${e.client_name || ''}</div>${pct}<div class="flex justify-between items-center mt-3 text-xs text-gray-400"><span>${e.stage?.replace(/_/g, ' ') || ''}</span><span>${e.year || ''}</span></div></div></div>`;
  }).join('');
  return `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">${cards || '<div class="col-span-full text-center py-12 text-gray-500">No engagements found</div>'}</div>`;
}
