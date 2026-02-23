import { statusLabel, userAvatar } from '@/ui/renderer.js';
import { page } from '@/ui/layout.js';
import { canEdit } from '@/ui/permissions-ui.js';

function fmtDate(ts) {
  if (!ts) return '';
  const n = Number(ts);
  if (!isNaN(n) && n > 1e9 && n < 3e9) return new Date(n * 1000).toLocaleString();
  return String(ts);
}

const RESOLUTION_STATES = {
  unresolved: { label: 'Unresolved', color: '#ef4444', bg: '#fee2e2' },
  partial_resolved: { label: 'Partial', color: '#f59e0b', bg: '#fef3c7' },
  manager_resolved: { label: 'Manager Resolved', color: '#3b82f6', bg: '#dbeafe' },
  partner_resolved: { label: 'Partner Resolved', color: '#8b5cf6', bg: '#ede9fe' },
  resolved: { label: 'Resolved', color: '#22c55e', bg: '#d1fae5' },
};

function resolutionBadge(status) {
  const s = RESOLUTION_STATES[status] || RESOLUTION_STATES.unresolved;
  return `<span style="background:${s.bg};color:${s.color};padding:2px 8px;border-radius:9999px;font-size:0.7rem;font-weight:600">${s.label}</span>`;
}

function responseItem(response) {
  const avatar = response.user ? userAvatar(response.user, 'sm') : `<span class="user-avatar user-avatar-sm" style="width:28px;height:28px;background:#9ca3af;font-size:11px">?</span>`;
  const name = response.user?.name || response.user_name || 'Unknown';
  const date = fmtDate(response.created_at);
  return `<div class="flex gap-3 py-3"><div class="flex-shrink-0 mt-0.5">${avatar}</div><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><span class="text-sm font-medium text-gray-900">${name}</span><span class="text-xs text-gray-400">${date}</span></div><div class="text-sm text-gray-700">${response.text || response.content || ''}</div>${response.attachment ? `<div class="mt-1 text-xs text-blue-600"><a href="${response.attachment.url || '#'}" class="hover:underline">${response.attachment.name || 'Attachment'}</a></div>` : ''}</div></div>`;
}

function highlightThread(highlight, responses, canResolve) {
  const idx = highlight._index !== undefined ? highlight._index + 1 : '?';
  const status = highlight.status || 'unresolved';
  const badge = resolutionBadge(status);
  const color = RESOLUTION_STATES[status]?.color || '#ef4444';
  const threadItems = responses.map(r => responseItem(r)).join('<div class="border-t border-gray-100"></div>');

  const resolveActions = canResolve ? `<div class="flex gap-1 mt-3"><select id="resolve-status-${highlight.id}" class="select select-bordered select-xs"><option value="unresolved">Unresolved</option><option value="partial_resolved">Partial</option><option value="manager_resolved">Manager Resolved</option><option value="partner_resolved">Partner Resolved</option><option value="resolved">Resolved</option></select><button class="btn btn-xs btn-primary" onclick="updateResolution('${highlight.id}')">Update</button></div>` : '';

  const replyForm = `<div class="mt-3 border-t border-gray-100 pt-3"><textarea id="reply-${highlight.id}" class="textarea textarea-bordered textarea-sm w-full" rows="2" placeholder="Add a response..."></textarea><div class="flex justify-end gap-2 mt-2"><button class="btn btn-xs btn-primary" onclick="submitResponse('${highlight.id}')">Reply</button></div></div>`;

  return `<div class="card bg-white shadow mb-4" id="thread-${highlight.id}"><div class="card-body"><div class="flex items-start justify-between mb-3"><div class="flex items-center gap-2"><span style="width:28px;height:28px;border-radius:50%;background:${color};color:white;display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700">${idx}</span><span class="font-medium text-sm">${highlight.text || highlight.content || 'Area highlight'}</span></div>${badge}</div><div class="text-xs text-gray-400 mb-2">Page ${highlight.page_number || '?'} ${highlight.section_name ? '&middot; ' + highlight.section_name : ''}</div><div class="border-t border-gray-100">${threadItems || '<div class="py-4 text-center text-sm text-gray-400">No responses yet</div>'}</div>${resolveActions}${replyForm}</div></div>`;
}

export function renderHighlightThreading(user, review, highlights, responseMap) {
  const canResolve = canEdit(user, 'review');
  const indexed = highlights.map((h, i) => ({ ...h, _index: i }));

  const stats = {
    total: highlights.length,
    resolved: highlights.filter(h => h.status === 'resolved').length,
    partial: highlights.filter(h => h.status === 'partial_resolved').length,
    open: highlights.filter(h => !h.status || h.status === 'unresolved').length,
  };

  const summary = `<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">${[
    { label: 'Total', value: stats.total },
    { label: 'Open', value: stats.open, color: 'red' },
    { label: 'Partial', value: stats.partial, color: 'yellow' },
    { label: 'Resolved', value: stats.resolved, color: 'green' },
  ].map(s => `<div class="card bg-white shadow"><div class="card-body py-3 text-center"><div class="text-lg font-bold${s.color ? ` text-${s.color}-600` : ''}">${s.value}</div><div class="text-xs text-gray-500">${s.label}</div></div></div>`).join('')}</div>`;

  const filterBar = `<div class="flex gap-2 mb-4"><button class="btn btn-sm btn-primary" data-thread-filter="all" onclick="filterThreads('all')">All (${stats.total})</button><button class="btn btn-sm btn-ghost" data-thread-filter="open" onclick="filterThreads('open')">Open (${stats.open})</button><button class="btn btn-sm btn-ghost" data-thread-filter="resolved" onclick="filterThreads('resolved')">Resolved (${stats.resolved})</button></div>`;

  const threads = indexed.map(h => {
    const responses = responseMap?.[h.id] || [];
    return highlightThread(h, responses, canResolve);
  }).join('');

  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Highlight Discussions</h1><div class="flex gap-2"><a href="/review/${review.id}" class="btn btn-ghost btn-sm">Back to Review</a>${canResolve ? `<button class="btn btn-sm btn-outline" onclick="bulkResolve()">Resolve All</button>` : ''}</div></div>${summary}${filterBar}<div id="threads-container">${threads || '<div class="text-center py-12 text-gray-400">No highlights to discuss</div>'}</div>`;

  const threadScript = `window.filterThreads=function(f){document.querySelectorAll('[data-thread-filter]').forEach(b=>{b.classList.toggle('btn-primary',b.dataset.threadFilter===f);b.classList.toggle('btn-ghost',b.dataset.threadFilter!==f)});document.querySelectorAll('#threads-container>.card').forEach(c=>{if(f==='all'){c.style.display=''}else{const badge=c.querySelector('[style*="border-radius:9999px"]');const text=badge?.textContent?.toLowerCase()||'';c.style.display=(f==='resolved'?text==='resolved':text!=='resolved')?'':'none'}})};window.submitResponse=async function(hid){const ta=document.getElementById('reply-'+hid);if(!ta||!ta.value.trim())return;try{const res=await fetch('/api/mwr/review/highlight/'+hid+'/responses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:ta.value.trim()})});if(res.ok){ta.value='';location.reload()}else{alert('Failed to submit response')}}catch(e){alert('Error: '+e.message)}};window.updateResolution=async function(hid){const sel=document.getElementById('resolve-status-'+hid);if(!sel)return;try{const res=await fetch('/api/mwr/review/highlight/'+hid,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:sel.value})});if(res.ok)location.reload();else alert('Failed to update')}catch(e){alert('Error: '+e.message)}};window.bulkResolve=async function(){if(!confirm('Resolve all highlights?'))return;try{const res=await fetch(location.pathname.replace('/highlights','')+'?action=resolve-all',{method:'POST'});if(res.ok)location.reload();else alert('Failed')}catch(e){alert('Error: '+e.message)}}`;

  return page(user, 'Highlight Discussions', [
    { href: '/', label: 'Dashboard' },
    { href: '/reviews', label: 'Reviews' },
    { href: `/review/${review.id}`, label: review.name || 'Review' },
    { label: 'Highlights' }
  ], content, [threadScript]);
}
