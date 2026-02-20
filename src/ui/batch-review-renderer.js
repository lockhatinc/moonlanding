import { statusLabel, generateHtml } from '@/ui/renderer.js';
import { canEdit, getNavItems, getAdminItems } from '@/ui/permissions-ui.js';

function nav(user) {
  const links = getNavItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  const admin = getAdminItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  return `<nav class="navbar bg-white shadow-sm px-4" role="navigation" aria-label="Main navigation"><div class="navbar-start"><a href="/" class="font-bold text-lg">Platform</a><div class="hidden md:flex gap-1 ml-6">${links}${admin}</div></div><div class="navbar-end"></div></nav>`;
}

function bc(items) {
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map((item, i) => i === items.length - 1 ? `<span>${item.label}</span>` : `<a href="${item.href}">${item.label}</a><span class="breadcrumb-separator">/</span>`).join('')}</nav>`;
}

function page(user, title, crumbs, content, scripts = []) {
  const body = `<div class="min-h-screen">${nav(user)}<div class="p-6">${bc(crumbs)}${content}</div></div>`;
  return generateHtml(title, body, scripts);
}

function fmtDate(ts) {
  if (!ts) return '-';
  const n = Number(ts);
  if (!isNaN(n) && n > 1e9 && n < 3e9) return new Date(n * 1000).toLocaleDateString();
  return String(ts);
}

function reviewCheckRow(review) {
  const sts = review.status ? statusLabel(review.status) : '';
  const highlights = review.highlights_count !== undefined ? review.highlights_count : '-';
  return `<tr data-review-id="${review.id}" data-status="${review.status || ''}"><td><input type="checkbox" class="checkbox checkbox-sm review-check" value="${review.id}" onchange="updateSelection()"/></td><td class="font-medium">${review.name || review.title || 'Untitled'}</td><td>${review.engagement_name || '-'}</td><td>${sts}</td><td>${highlights}</td><td>${review.creator_name || '-'}</td><td class="text-xs text-gray-500">${fmtDate(review.created_at)}</td></tr>`;
}

export function renderBatchOperations(user, reviews) {
  const canEditReview = canEdit(user, 'review');
  if (!canEditReview) {
    const body = `<div class="min-h-screen">${nav(user)}<div class="p-6"><div class="text-center py-12"><h1 class="text-xl font-bold mb-2">Access Denied</h1><p class="text-gray-500">You need edit permissions for batch operations.</p><a href="/reviews" class="btn btn-primary btn-sm mt-4">Back to Reviews</a></div></div></div>`;
    return generateHtml('Batch Operations', body, []);
  }

  const statusOptions = ['active', 'completed', 'archived', 'draft', 'closed'].map(s =>
    `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
  ).join('');

  const actionBar = `<div class="card bg-white shadow mb-4 sticky top-0 z-10"><div class="card-body py-3"><div class="flex items-center gap-3 flex-wrap"><div class="flex items-center gap-2"><input type="checkbox" id="select-all" class="checkbox checkbox-sm" onchange="toggleAll()"/><span class="text-sm font-medium">Select All</span><span class="text-sm text-gray-500" id="selection-count">(0 selected)</span></div><div class="flex gap-2 ml-auto"><select id="batch-status" class="select select-bordered select-sm"><option value="">Change Status...</option>${statusOptions}</select><button class="btn btn-sm btn-primary" onclick="batchUpdateStatus()" id="btn-status" disabled>Apply Status</button><button class="btn btn-sm btn-outline" onclick="batchAssign()" id="btn-assign" disabled>Assign</button><button class="btn btn-sm btn-error btn-outline" onclick="batchArchive()" id="btn-archive" disabled>Archive</button><button class="btn btn-sm btn-error" onclick="batchDelete()" id="btn-delete" disabled>Delete</button></div></div></div></div>`;

  const headers = '<th class="w-10"></th><th>Name</th><th>Engagement</th><th>Status</th><th>Highlights</th><th>Creator</th><th>Created</th>';
  const rows = reviews.map(r => reviewCheckRow(r)).join('');
  const table = `<div class="card bg-white shadow" style="overflow-x:auto"><table class="table table-zebra w-full"><thead><tr>${headers}</tr></thead><tbody id="batch-tbody">${rows || '<tr><td colspan="7" class="text-center py-8 text-gray-500">No reviews found</td></tr>'}</tbody></table></div>`;

  const filterBar = `<div class="flex gap-2 mb-4"><input type="text" id="batch-search" placeholder="Filter reviews..." class="input input-bordered input-sm" style="width:250px"/><select id="batch-filter-status" class="select select-bordered select-sm" onchange="filterBatch()"><option value="">All Statuses</option>${statusOptions}</select></div>`;

  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Batch Operations</h1><a href="/reviews" class="btn btn-ghost btn-sm">Back to Reviews</a></div>${actionBar}${filterBar}${table}`;

  const batchScript = `function getSelected(){return[...document.querySelectorAll('.review-check:checked')].map(c=>c.value)}function updateSelection(){const n=getSelected().length;document.getElementById('selection-count').textContent='('+n+' selected)';const dis=n===0;document.getElementById('btn-status').disabled=dis;document.getElementById('btn-assign').disabled=dis;document.getElementById('btn-archive').disabled=dis;document.getElementById('btn-delete').disabled=dis}window.toggleAll=function(){const checked=document.getElementById('select-all').checked;document.querySelectorAll('.review-check').forEach(c=>{if(c.closest('tr').style.display!=='none')c.checked=checked});updateSelection()};window.batchUpdateStatus=async function(){const ids=getSelected();const status=document.getElementById('batch-status')?.value;if(!ids.length||!status)return alert('Select reviews and a status');if(!confirm('Update '+ids.length+' reviews to '+status+'?'))return;try{const r=await fetch('/api/review/batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update_status',ids,status})});if(r.ok){location.reload()}else{alert('Failed')}}catch(e){alert(e.message)}};window.batchArchive=async function(){const ids=getSelected();if(!ids.length)return;if(!confirm('Archive '+ids.length+' reviews?'))return;try{const r=await fetch('/api/review/batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update_status',ids,status:'archived'})});if(r.ok)location.reload();else alert('Failed')}catch(e){alert(e.message)}};window.batchDelete=async function(){const ids=getSelected();if(!ids.length)return;if(!confirm('DELETE '+ids.length+' reviews? This cannot be undone!'))return;try{const r=await fetch('/api/review/batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',ids})});if(r.ok)location.reload();else alert('Failed')}catch(e){alert(e.message)}};window.batchAssign=function(){alert('Assignment dialog would open here for '+getSelected().length+' reviews')};window.filterBatch=function(){const q=(document.getElementById('batch-search')?.value||'').toLowerCase();const s=document.getElementById('batch-filter-status')?.value||'';document.querySelectorAll('#batch-tbody tr[data-review-id]').forEach(r=>{let show=true;if(q&&!r.textContent.toLowerCase().includes(q))show=false;if(s&&r.dataset.status!==s)show=false;r.style.display=show?'':'none'})};document.getElementById('batch-search')?.addEventListener('input',()=>{clearTimeout(window._bst);window._bst=setTimeout(filterBatch,300)})`;

  return page(user, 'Batch Operations', [{ href: '/', label: 'Dashboard' }, { href: '/reviews', label: 'Reviews' }, { label: 'Batch' }], content, [batchScript]);
}
