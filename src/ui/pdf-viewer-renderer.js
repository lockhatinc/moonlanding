import { statusLabel, generateHtml, userAvatar, teamAvatarGroup } from '@/ui/renderer.js';
import { canEdit, getNavItems, getAdminItems } from '@/ui/permissions-ui.js';

function nav(user) {
  const links = getNavItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  const admin = getAdminItems(user).map(n => `<a href="${n.href}" class="btn btn-ghost btn-sm">${n.label}</a>`).join('');
  return `<nav class="navbar bg-white shadow-sm px-4" role="navigation" aria-label="Main navigation"><div class="navbar-start"><a href="/" class="font-bold text-lg">Platform</a><div class="hidden md:flex gap-1 ml-6">${links}${admin}</div></div><div class="navbar-end"></div></nav>`;
}

function highlightSidebarItem(h, idx) {
  const resolved = h.status === 'resolved';
  const partial = h.status === 'partial_resolved';
  const color = resolved ? '#22c55e' : partial ? '#f59e0b' : h.color || '#3b82f6';
  const statusDot = `<span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block"></span>`;
  const responses = h.response_count || 0;
  return `<div class="highlight-item p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer" data-highlight-id="${h.id}" data-page="${h.page_number || 1}" onclick="scrollToHighlight('${h.id}')"><div class="flex items-center gap-2 mb-1">${statusDot}<span class="text-xs font-semibold text-gray-700">#${idx + 1}</span><span class="text-xs text-gray-500 ml-auto">p.${h.page_number || '?'}</span></div><div class="text-sm text-gray-800 line-clamp-2">${h.text || h.content || 'Area highlight'}</div>${responses > 0 ? `<div class="text-xs text-gray-400 mt-1">${responses} response${responses !== 1 ? 's' : ''}</div>` : ''}</div>`;
}

function highlightSidebar(highlights) {
  const resolved = highlights.filter(h => h.status === 'resolved').length;
  const total = highlights.length;
  const pct = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const items = highlights.map((h, i) => highlightSidebarItem(h, i)).join('');
  return `<div class="flex flex-col h-full"><div class="p-3 border-b border-gray-200"><div class="flex justify-between items-center mb-2"><span class="font-semibold text-sm">Highlights</span><span class="text-xs text-gray-500">${resolved}/${total}</span></div><div class="w-full bg-gray-200 rounded-full h-1.5"><div class="bg-green-500 h-1.5 rounded-full" style="width:${pct}%"></div></div><div class="flex gap-1 mt-2"><button class="btn btn-xs btn-ghost highlight-filter-btn active" data-filter="all" onclick="filterHighlights('all')">All</button><button class="btn btn-xs btn-ghost highlight-filter-btn" data-filter="unresolved" onclick="filterHighlights('unresolved')">Open</button><button class="btn btn-xs btn-ghost highlight-filter-btn" data-filter="resolved" onclick="filterHighlights('resolved')">Resolved</button></div></div><div class="flex-1 overflow-y-auto" id="highlight-list">${items || '<div class="p-4 text-center text-sm text-gray-400">No highlights yet</div>'}</div></div>`;
}

function pdfToolbar(review, canEditReview) {
  const zoomControls = `<div class="flex items-center gap-1"><button class="btn btn-ghost btn-xs" onclick="zoomPdf(-0.1)" title="Zoom Out">-</button><span id="zoom-level" class="text-xs text-gray-600 min-w-[40px] text-center">100%</span><button class="btn btn-ghost btn-xs" onclick="zoomPdf(0.1)" title="Zoom In">+</button><button class="btn btn-ghost btn-xs" onclick="zoomPdf(0)" title="Reset">Reset</button></div>`;
  const pageNav = `<div class="flex items-center gap-1"><button class="btn btn-ghost btn-xs" onclick="prevPage()">&lt;</button><span id="page-indicator" class="text-xs text-gray-600">Page 1</span><button class="btn btn-ghost btn-xs" onclick="nextPage()">&gt;</button></div>`;
  const tools = canEditReview ? `<div class="flex items-center gap-1"><button class="btn btn-xs btn-primary" onclick="toggleHighlightMode('text')" id="tool-text" title="Text Highlight">Text</button><button class="btn btn-xs btn-outline" onclick="toggleHighlightMode('area')" id="tool-area" title="Area Highlight">Area</button></div>` : '';
  return `<div class="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50"><div class="flex items-center gap-3">${pageNav}${zoomControls}</div>${tools}</div>`;
}

export function renderPdfViewer(user, review, highlights = [], sections = []) {
  const canEditReview = canEdit(user, 'review');
  const pdfUrl = review.pdf_url || review.file_url || '';

  const sidebar = highlightSidebar(highlights);
  const toolbar = pdfToolbar(review, canEditReview);

  const viewer = `<div id="pdf-container" class="flex-1 bg-gray-100 overflow-auto relative" data-pdf-url="${pdfUrl}"><div id="pdf-pages" class="flex flex-col items-center py-4 gap-4"></div><div id="highlight-overlay" class="absolute inset-0 pointer-events-none"></div><div id="selection-layer" class="absolute inset-0" style="display:none"></div></div>`;

  const content = `<div class="flex h-[calc(100vh-64px)]"><div class="w-72 border-r border-gray-200 bg-white flex-shrink-0 overflow-hidden">${sidebar}</div><div class="flex-1 flex flex-col">${toolbar}${viewer}</div></div>`;

  const body = `<div class="min-h-screen flex flex-col">${nav(user)}${content}</div>`;

  const pdfScript = `let currentZoom=1,currentPage=1,totalPages=0,highlightMode=null;window.zoomPdf=function(d){if(d===0)currentZoom=1;else currentZoom=Math.max(0.5,Math.min(3,currentZoom+d));document.getElementById('zoom-level').textContent=Math.round(currentZoom*100)+'%';document.getElementById('pdf-pages').style.transform='scale('+currentZoom+')';document.getElementById('pdf-pages').style.transformOrigin='top center'};window.prevPage=function(){if(currentPage>1){currentPage--;updatePageIndicator()}};window.nextPage=function(){if(currentPage<totalPages){currentPage++;updatePageIndicator()}};function updatePageIndicator(){document.getElementById('page-indicator').textContent='Page '+currentPage+(totalPages?' / '+totalPages:'')}window.toggleHighlightMode=function(mode){highlightMode=highlightMode===mode?null:mode;document.getElementById('tool-text')?.classList.toggle('btn-primary',highlightMode==='text');document.getElementById('tool-text')?.classList.toggle('btn-outline',highlightMode!=='text');document.getElementById('tool-area')?.classList.toggle('btn-primary',highlightMode==='area');document.getElementById('tool-area')?.classList.toggle('btn-outline',highlightMode!=='area');document.getElementById('selection-layer').style.display=highlightMode?'block':'none'};window.scrollToHighlight=function(id){const el=document.querySelector('[data-highlight-render="'+id+'"]');if(el)el.scrollIntoView({behavior:'smooth',block:'center'})};window.filterHighlights=function(f){document.querySelectorAll('.highlight-filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.filter===f));document.querySelectorAll('.highlight-item').forEach(el=>{if(f==='all')el.style.display='';else{const resolved=el.querySelector('[style*="#22c55e"]');el.style.display=(f==='resolved')==!!resolved?'':'none'}})};async function initPdf(){const url=document.getElementById('pdf-container')?.dataset.pdfUrl;if(!url){document.getElementById('pdf-pages').innerHTML='<div class="p-8 text-center text-gray-500">No PDF file associated with this review.<br/><span class="text-sm">Upload a PDF to begin reviewing.</span></div>';return}document.getElementById('pdf-pages').innerHTML='<div class="p-8 text-center"><div class="loading loading-spinner loading-lg"></div><div class="text-sm text-gray-500 mt-2">Loading PDF...</div></div>'}document.addEventListener('DOMContentLoaded',initPdf)`;

  return generateHtml(`Review: ${review.name || 'Untitled'}`, body, [pdfScript]);
}

export function renderPdfEditorPlaceholder(user, review) {
  const body = `<div class="min-h-screen">${nav(user)}<div class="p-6"><div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-bold">PDF Editor</h1><a href="/review/${review.id}" class="btn btn-ghost btn-sm">Back to Review</a></div><div class="card bg-white shadow"><div class="card-body text-center py-16"><div class="text-5xl mb-4">&#9999;&#65039;</div><h3 class="text-lg font-semibold mb-2">PDF Annotation Editor</h3><p class="text-sm text-gray-500 mb-6 max-w-md mx-auto">Canvas-based PDF annotation with brush tools, text overlay, and save functionality. Select brush size, draw directly on PDF pages, and save annotated versions.</p><div class="flex gap-2 justify-center"><button class="btn btn-outline btn-sm" disabled>Brush Tool</button><button class="btn btn-outline btn-sm" disabled>Text Tool</button><button class="btn btn-outline btn-sm" disabled>Eraser</button><button class="btn btn-primary btn-sm" disabled>Save</button></div></div></div></div></div>`;
  return generateHtml('PDF Editor', body, []);
}
