import { statusLabel, linearProgress } from '@/ui/renderer.js';
import { page } from '@/ui/layout.js';
import { canEdit } from '@/ui/permissions-ui.js';

function resolutionBar(resolved, partial, total) {
  if (total === 0) return '<div class="text-xs text-gray-400">No highlights</div>';
  const rPct = Math.round((resolved / total) * 100);
  const pPct = Math.round((partial / total) * 100);
  const uPct = 100 - rPct - pPct;
  return `<div class="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden"><div class="bg-green-500 h-3" style="width:${rPct}%" title="${resolved} resolved"></div><div class="bg-yellow-400 h-3" style="width:${pPct}%" title="${partial} partial"></div><div class="bg-red-400 h-3" style="width:${uPct}%"></div></div><div class="flex justify-between text-xs text-gray-500 mt-1"><span class="text-green-600">${resolved} resolved</span><span class="text-yellow-600">${partial} partial</span><span class="text-red-600">${total - resolved - partial} open</span></div>`;
}

function sectionCard(section, highlights, canResolve) {
  const total = highlights.length;
  const resolved = highlights.filter(h => h.status === 'resolved').length;
  const partial = highlights.filter(h => h.status === 'partial_resolved').length;
  const managerResolved = highlights.filter(h => h.status === 'manager_resolved').length;
  const partnerResolved = highlights.filter(h => h.status === 'partner_resolved').length;
  const isMandatory = section.mandatory || section.is_mandatory;
  const allResolved = resolved === total && total > 0;
  const borderColor = allResolved ? 'border-green-400' : isMandatory ? 'border-red-300' : 'border-gray-100';

  const roleBreakdown = `<div class="grid grid-cols-2 gap-2 mt-3 text-xs"><div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span>Manager: ${managerResolved}</div><div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500"></span>Partner: ${partnerResolved}</div></div>`;

  const highlightRows = highlights.map((h, i) => {
    const colors = { resolved: '#22c55e', partial_resolved: '#f59e0b', manager_resolved: '#3b82f6', partner_resolved: '#8b5cf6' };
    const color = colors[h.status] || '#ef4444';
    return `<div class="flex items-center gap-2 py-1.5 border-b border-gray-50"><span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0"></span><span class="text-xs text-gray-700 flex-1 truncate">${h.text || h.content || 'Highlight ' + (i + 1)}</span><span class="text-xs text-gray-400">p.${h.page_number || '?'}</span></div>`;
  }).join('');

  const resolveBtn = canResolve && !allResolved ? `<button class="btn btn-xs btn-outline mt-2" onclick="resolveSection('${section.id}')">Resolve All</button>` : '';

  return `<div class="card-clean" style="margin-bottom:1rem" data-section-id="${section.id}" data-section-complete="${allResolved}"><div class="card-clean-body"><div class="flex items-start justify-between mb-2"><div class="flex items-center gap-2"><button class="btn btn-ghost btn-xs" onclick="toggleSection('${section.id}')">&#9660;</button><span class="font-medium">${section.name || 'Unnamed Section'}</span>${isMandatory ? '<span class="badge badge-sm bg-red-100 text-red-700">Required</span>' : ''}</div><span class="text-sm font-semibold ${allResolved ? 'text-green-600' : 'text-gray-700'}">${resolved}/${total}</span></div>${resolutionBar(resolved, partial, total)}${roleBreakdown}<div class="mt-3 section-highlights" id="section-highlights-${section.id}">${highlightRows}</div>${resolveBtn}</div></div>`;
}

export function renderSectionResolution(user, review, sections, highlightsBySection) {
  const canResolve = canEdit(user, 'review');
  const allHighlights = Object.values(highlightsBySection).flat();
  const totalHighlights = allHighlights.length;
  const totalResolved = allHighlights.filter(h => h.status === 'resolved').length;
  const totalPartial = allHighlights.filter(h => h.status === 'partial_resolved').length;
  const mandatorySections = sections.filter(s => s.mandatory || s.is_mandatory);
  const mandatoryComplete = mandatorySections.every(s => {
    const hs = highlightsBySection[s.id] || [];
    return hs.length === 0 || hs.every(h => h.status === 'resolved');
  });

  const overallPct = totalHighlights > 0 ? Math.round((totalResolved / totalHighlights) * 100) : 0;

  const summary = `<div class="card-clean" style="margin-bottom:1.5rem"><div class="card-clean-body"><div class="flex items-center justify-between mb-4"><div><h3 class="font-semibold">Overall Resolution</h3><p class="text-sm text-gray-500">${totalResolved} of ${totalHighlights} highlights resolved</p></div><div class="text-3xl font-bold ${overallPct === 100 ? 'text-green-600' : overallPct > 50 ? 'text-yellow-600' : 'text-red-600'}">${overallPct}%</div></div>${resolutionBar(totalResolved, totalPartial, totalHighlights)}${!mandatoryComplete ? '<div class="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">Mandatory sections have unresolved highlights. Status change blocked.</div>' : ''}</div></div>`;

  const sectionCards = sections.map(s => {
    const hs = highlightsBySection[s.id] || [];
    return sectionCard(s, hs, canResolve);
  }).join('');

  const content = `<div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Section Resolution</h1><div class="flex gap-2"><a href="/review/${review.id}" class="btn btn-ghost btn-sm">Back to Review</a>${canResolve ? `<button class="btn btn-sm btn-primary" onclick="resolveAll()">Resolve All Sections</button>` : ''}</div></div>${summary}<div class="flex items-center gap-2 mb-4"><span class="text-sm font-medium">Sections (${sections.length})</span><label class="flex items-center gap-1 text-sm ml-auto"><input type="checkbox" id="hide-complete" class="checkbox checkbox-sm" onchange="toggleComplete()"/>Hide complete</label></div>${sectionCards || '<div class="text-center py-12 text-gray-400">No sections defined for this review</div>'}`;

  const sectionScript = `window.toggleSection=function(id){const el=document.getElementById('section-highlights-'+id);if(el)el.style.display=el.style.display==='none'?'':'none'};window.toggleComplete=function(){const hide=document.getElementById('hide-complete')?.checked;document.querySelectorAll('[data-section-complete="true"]').forEach(c=>c.style.display=hide?'none':'')};window.resolveSection=async function(id){try{const r=await fetch('/api/mwr/review/section/'+id+'/resolve-all',{method:'POST'});if(r.ok)location.reload();else alert('Failed')}catch(e){alert(e.message)}};window.resolveAll=async function(){if(!confirm('Resolve all highlights in all sections?'))return;try{const r=await fetch('/api/mwr/review/${review.id}/resolve-all',{method:'POST'});if(r.ok)location.reload();else alert('Failed')}catch(e){alert(e.message)}}`;

  return page(user, 'Section Resolution', [
    { href: '/', label: 'Dashboard' },
    { href: '/reviews', label: 'Reviews' },
    { href: `/review/${review.id}`, label: review.name || 'Review' },
    { label: 'Sections' }
  ], content, [sectionScript]);
}
