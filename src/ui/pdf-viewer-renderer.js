import { page } from '@/ui/layout.js';
import { reviewZoneNav } from '@/ui/review-zone-nav.js';
import { canEdit } from '@/ui/permissions-ui.js';

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function highlightSidebarItem(h, idx) {
  const resolved = h.status === 'resolved';
  const partial = h.status === 'partial_resolved';
  const color = resolved ? '#22c55e' : partial ? '#f59e0b' : h.color || '#3b82f6';
  const statusIcon = resolved ? '&#10003;' : partial ? '&#9684;' : '&#9675;';
  const responses = h.response_count || 0;
  const sectionTag = h.section_name ? `<span class="review-meta-tag">${escapeHtml(h.section_name)}</span>` : '';

  return `<div class="highlight-sidebar-item" data-highlight-id="${h.id}" data-page="${h.page_number || 1}" onclick="scrollToHighlight('${h.id}')" role="button" tabindex="0" aria-label="Highlight ${idx + 1}">
    <div class="highlight-sidebar-meta">
      <span style="font-size:12px;font-weight:700;color:${color}">${statusIcon}</span>
      <span style="font-size:12px;font-weight:600;color:var(--color-text-muted)">#${idx + 1}</span>
      ${sectionTag}
      <span style="font-size:11px;color:var(--color-text-light);margin-left:auto">p.${h.page_number || '?'}</span>
    </div>
    <div class="highlight-sidebar-text">${escapeHtml(h.text || h.content || 'Area highlight')}</div>
    ${responses > 0 ? `<div class="highlight-sidebar-responses"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>${responses} response${responses !== 1 ? 's' : ''}</div>` : ''}
  </div>`;
}

function highlightSidebar(highlights) {
  const resolved = highlights.filter(h => h.status === 'resolved').length;
  const total = highlights.length;
  const pct = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const items = highlights.map((h, i) => highlightSidebarItem(h, i)).join('');

  return `<div class="pdf-sidebar">
    <div class="pdf-sidebar-header">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:14px;font-weight:600;color:var(--color-text)">Highlights</span>
        <span style="font-size:12px;font-weight:500;color:var(--color-text-muted)">${resolved}/${total} resolved</span>
      </div>
      <div class="resolution-bar" style="margin-bottom:10px">
        <div class="resolution-bar-segment resolution-bar-resolved" style="width:${pct}%"></div>
      </div>
      <div class="pdf-sidebar-filters">
        <button class="pill pill-primary highlight-filter-btn" data-filter="all" onclick="filterHighlights('all')">All</button>
        <button class="pill pill-neutral highlight-filter-btn" data-filter="unresolved" onclick="filterHighlights('unresolved')">Open</button>
        <button class="pill pill-neutral highlight-filter-btn" data-filter="resolved" onclick="filterHighlights('resolved')">Resolved</button>
      </div>
    </div>
    <div class="pdf-sidebar-list" id="highlight-list" role="list" aria-label="Highlights list">
      ${items || `<div style="padding:24px;text-align:center;color:var(--color-text-light);font-size:13px">No highlights yet<br><span style="font-size:12px">Open PDF to add highlights</span></div>`}
    </div>
  </div>`;
}

function pdfToolbar(review, canEditReview) {
  const zoomControls = `<div class="pdf-toolbar-group">
    <button class="pdf-tool-btn" onclick="zoomPdf(-0.1)" title="Zoom Out" aria-label="Zoom out">&#65293;</button>
    <span id="zoom-level" class="pdf-zoom-display">100%</span>
    <button class="pdf-tool-btn" onclick="zoomPdf(0.1)" title="Zoom In" aria-label="Zoom in">&#65291;</button>
    <button class="pdf-tool-btn" onclick="zoomPdf(0)" title="Reset" aria-label="Reset zoom">&#8634;</button>
  </div>`;
  const pageNav = `<div class="pdf-toolbar-group">
    <button class="pdf-tool-btn" onclick="prevPage()" aria-label="Previous page">&#8249;</button>
    <span id="page-indicator" class="pdf-zoom-display" style="min-width:60px">--</span>
    <button class="pdf-tool-btn" onclick="nextPage()" aria-label="Next page">&#8250;</button>
  </div>`;
  const tools = canEditReview ? `<div class="pdf-toolbar-group">
    <button class="pdf-tool-btn" id="tool-text" onclick="toggleHighlightMode('text')" title="Text Highlight" aria-pressed="false">Text</button>
    <button class="pdf-tool-btn" id="tool-area" onclick="toggleHighlightMode('area')" title="Area Highlight" aria-pressed="false">Area</button>
    <button class="pdf-tool-btn active" onclick="saveHighlights()">Save</button>
  </div>` : '';
  const actions = `<div class="pdf-toolbar-group">
    <button class="pdf-tool-btn" onclick="toggleFullscreen()" title="Fullscreen" aria-label="Toggle fullscreen"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg></button>
    <button class="pdf-tool-btn" onclick="downloadPdf()" title="Download PDF" aria-label="Download PDF"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 4v12"/></svg></button>
  </div>`;
  return `<div class="pdf-toolbar">${pageNav}${zoomControls}${tools}${actions}</div>`;
}

export function renderPdfViewer(user, review, highlights = [], sections = []) {
  const canEditReview = canEdit(user, 'review');
  const pdfUrl = review.pdf_url || review.file_url || '';
  const sidebar = highlightSidebar(highlights);
  const toolbar = pdfToolbar(review, canEditReview);
  const viewer = `<div id="pdf-container" class="pdf-canvas-area" data-pdf-url="${pdfUrl}"><div id="pdf-pages" style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:16px"></div></div>`;
  const bc = [{ href: '/', label: 'Home' }, { href: '/review', label: 'Reviews' }, { href: `/review/${review.id}`, label: review.name || 'Review' }, { label: 'PDF' }];
  const content = `${reviewZoneNav(review.id, 'pdf')}<div class="pdf-layout"><div style="order:1">${sidebar}</div><div class="pdf-main" style="order:2">${toolbar}${viewer}</div></div>`;

  const pdfScript = `
(function() {
  var PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  var pdfjsLibLoaded = false;
  function esc(t){if(!t)return'';return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function loadPdfJs(){
    if(window.pdfjsLib){pdfjsLibLoaded=true;return Promise.resolve(true)}
    return new Promise(function(resolve,reject){var s=document.createElement('script');s.src=PDFJS_CDN;s.onload=function(){window.pdfjsLib=window['pdfjs-dist/build/pdf'];pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';pdfjsLibLoaded=true;resolve(true)};s.onerror=reject;document.head.appendChild(s)})
  }
  var pdfDoc=null,currentPageNum=1,totalPages=0,currentZoom=1,renderScale=1.5,highlightMode=null;
  var highlights=${JSON.stringify(highlights)};
  var container=document.getElementById('pdf-container');
  var pagesDiv=document.getElementById('pdf-pages');
  function showError(msg){pagesDiv.innerHTML='<div style="padding:32px;text-align:center;color:var(--color-danger)"><div style="font-size:15px;font-weight:600;margin-bottom:8px">Error loading PDF</div><div style="font-size:13px;color:var(--color-text-muted)">'+msg+'</div></div>'}
  function showLoading(){pagesDiv.innerHTML='<div style="padding:32px;text-align:center"><div style="font-size:13px;color:var(--color-text-muted)">Loading PDF document...</div></div>'}
  function initPdf(){
    var url=container&&container.dataset.pdfUrl;
    if(!url){pagesDiv.innerHTML='<div style="padding:48px;text-align:center"><svg style="width:48px;height:48px;color:var(--color-text-light);margin:0 auto 16px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><div style="font-weight:600;color:var(--color-text)">No PDF file</div><div style="font-size:13px;color:var(--color-text-muted);margin-top:4px">Upload a PDF to this review to get started.</div></div>';return}
    showLoading();
    loadPdfJs().then(function(){
      if(!pdfjsLibLoaded)throw new Error('PDF.js failed to load');
      return pdfjsLib.getDocument(url).promise
    }).then(function(doc){
      pdfDoc=doc;totalPages=doc.numPages;window.totalPages=totalPages;currentPageNum=1;
      return renderAllPages()
    }).then(function(){updatePageIndicator();setupKeyboardNav();setupScrollSync()}).catch(function(err){
      console.error('PDF init error:',err);
      if(err.name==='MissingPDFException'||(err.message&&err.message.indexOf('HTTP')>=0))showError('Unable to load PDF. The file may be missing.');
      else showError(err.message||'Failed to load PDF.')
    })
  }
  function renderAllPages(){
    pagesDiv.innerHTML='';var fragment=document.createDocumentFragment();
    for(var i=1;i<=totalPages;i++){var w=document.createElement('div');w.className='page-wrapper';w.style.cssText='position:relative;margin-bottom:16px;background:white;box-shadow:var(--shadow-sm)';w.dataset.pageNumber=i;w.id='page-wrapper-'+i;w.innerHTML='<div style="padding:32px;text-align:center;font-size:13px;color:var(--color-text-light)">Loading page '+i+'...</div>';fragment.appendChild(w)}
    pagesDiv.appendChild(fragment);
    var promises=[];for(var j=1;j<=totalPages;j++)promises.push(renderPage(j));
    return Promise.all(promises)
  }
  function renderPage(num){
    return pdfDoc.getPage(num).then(function(pg){
      var viewport=pg.getViewport({scale:renderScale*currentZoom});var wrapper=document.getElementById('page-wrapper-'+num);if(!wrapper)return;
      var canvas=document.createElement('canvas');var ctx=canvas.getContext('2d');canvas.height=viewport.height;canvas.width=viewport.width;canvas.style.cssText='display:block;margin:0 auto';
      wrapper.innerHTML='';wrapper.appendChild(canvas);
      return pg.render({canvasContext:ctx,viewport:viewport}).promise.then(function(){
        var overlay=document.createElement('div');overlay.style.cssText='position:absolute;inset:0;pointer-events:none';overlay.id='overlay-page-'+num;wrapper.appendChild(overlay);renderHighlightsOverlay(num,overlay);
        var label=document.createElement('div');label.className='pdf-page-label';label.textContent='Page '+num+' of '+totalPages;wrapper.appendChild(label)
      })
    }).catch(function(err){console.error('Failed to render page '+num,err);var w=document.getElementById('page-wrapper-'+num);if(w)w.innerHTML='<div style="padding:16px;color:var(--color-danger);font-size:13px">Error rendering page '+num+'</div>'})
  }
  function renderHighlightsOverlay(pageNum,el){
    var ph=highlights.filter(function(h){return(h.page_number||1)===pageNum});if(!ph.length)return;
    var scale=renderScale*currentZoom;
    el.innerHTML=ph.map(function(h){var isArea=!!h.width&&!!h.height;var x=(h.x||0)*scale;var y=(h.y||0)*scale;var w=(h.width||0)*scale;var hg=(h.height||0)*scale;var resolved=h.status==='resolved';var partial=h.status==='partial_resolved';var color=resolved?'#86efac':partial?'#fcd34d':h.color||'#93c5fd';var opacity=resolved?0.3:0.2;
      if(isArea)return'<div data-highlight-id="'+h.id+'" style="position:absolute;left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+hg+'px;background:'+color+';border:2px dashed '+color+';border-radius:4px;opacity:'+opacity+'" title="'+esc(h.text||h.content||'')+'"></div>';
      return'<div data-highlight-id="'+h.id+'" style="position:absolute;left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+hg+'px;background:linear-gradient(to bottom,transparent 60%,'+color+' 60%,'+color+' 80%,transparent 80%);opacity:'+opacity+'"></div>'
    }).join('')
  }
  window.toggleHighlightMode=function(mode){var a=highlightMode===mode;highlightMode=a?null:mode;var bt=document.getElementById('tool-text');var ba=document.getElementById('tool-area');if(bt){bt.classList.toggle('active',highlightMode==='text');bt.setAttribute('aria-pressed',highlightMode==='text')}if(ba){ba.classList.toggle('active',highlightMode==='area');ba.setAttribute('aria-pressed',highlightMode==='area')}};
  window.zoomPdf=function(d){if(d===0)currentZoom=1;else currentZoom=Math.max(0.5,Math.min(3,currentZoom+d));document.getElementById('zoom-level').textContent=Math.round(currentZoom*100)+'%';renderAllPages()};
  window.prevPage=function(){if(currentPageNum>1){currentPageNum--;scrollToPage(currentPageNum);updatePageIndicator()}};
  window.nextPage=function(){if(currentPageNum<totalPages){currentPageNum++;scrollToPage(currentPageNum);updatePageIndicator()}};
  function updatePageIndicator(){var el=document.getElementById('page-indicator');if(el)el.textContent=currentPageNum+(totalPages?' / '+totalPages:'')}
  window.scrollToHighlight=function(id){var el=document.querySelector('[data-highlight-id="'+id+'"]');if(el){var pw=el.closest('.page-wrapper');if(pw){var pn=parseInt(pw.dataset.pageNumber);if(pn){currentPageNum=pn;updatePageIndicator();pw.scrollIntoView({behavior:'smooth',block:'start'})}}}};
  window.filterHighlights=function(f){document.querySelectorAll('.highlight-filter-btn').forEach(function(b){b.className=b.dataset.filter===f?'pill pill-primary highlight-filter-btn':'pill pill-neutral highlight-filter-btn'});document.querySelectorAll('.highlight-sidebar-item').forEach(function(item){var hid=item.dataset.highlightId;var h=highlights.find(function(x){return x.id===hid});var isR=h&&h.status==='resolved';if(f==='all')item.style.display='';else if(f==='resolved')item.style.display=isR?'':'none';else item.style.display=isR?'none':''})};
  window.toggleFullscreen=function(){var el=document.getElementById('pdf-container');if(!document.fullscreenElement)el.requestFullscreen().catch(function(e){console.error(e)});else document.exitFullscreen()};
  window.downloadPdf=function(){var url=container.dataset.pdfUrl;if(url){var a=document.createElement('a');a.href=url;a.download='document.pdf';a.target='_blank';document.body.appendChild(a);a.click();document.body.removeChild(a)}};
  window.saveHighlights=function(){if(window.showToast)showToast('Highlights saved','success')};
  function setupKeyboardNav(){document.addEventListener('keydown',function(e){if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;switch(e.key){case'ArrowLeft':case'p':e.preventDefault();window.prevPage();break;case'ArrowRight':case'n':e.preventDefault();window.nextPage();break;case'Home':e.preventDefault();currentPageNum=1;scrollToPage(1);updatePageIndicator();break;case'End':e.preventDefault();currentPageNum=totalPages;scrollToPage(totalPages);updatePageIndicator();break;case'f':e.preventDefault();window.toggleFullscreen();break;case'Escape':if(document.fullscreenElement)document.exitFullscreen();break}})}
  function scrollToPage(num){var el=document.getElementById('page-wrapper-'+num);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
  function setupScrollSync(){var t;container.addEventListener('scroll',function(){clearTimeout(t);t=setTimeout(function(){var rect=container.getBoundingClientRect();var center=rect.top+rect.height/2;var wrappers=container.querySelectorAll('.page-wrapper');var closest=null;var minDist=Infinity;wrappers.forEach(function(w){var r=w.getBoundingClientRect();var dist=Math.abs(r.top-center);if(dist<minDist){minDist=dist;closest=w}});if(closest){var pn=parseInt(closest.dataset.pageNumber);if(pn&&pn!==currentPageNum){currentPageNum=pn;updatePageIndicator()}}},100)})}
  window.__PDF_VIEWER__={getPdfDoc:function(){return pdfDoc},getPageNum:function(){return currentPageNum},getTotalPages:function(){return totalPages}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initPdf);else initPdf()
})();`;

  return page(user, `Review: ${review.name || 'Untitled'} | PDF`, bc, content, [pdfScript]);
}

export function renderPdfEditorPlaceholder(user, review) {
  const content = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;padding:32px"><div style="max-width:400px;text-align:center"><h1 style="font-size:24px;font-weight:700;color:var(--color-primary);margin-bottom:16px">PDF Editor</h1><p style="font-size:14px;color:var(--color-text-muted);margin-bottom:32px">Advanced canvas-based PDF annotation is coming soon. For now, use the PDF viewer to add highlights and comments.</p><div style="display:flex;gap:12px;justify-content:center"><a href="/review/${review.id}/pdf" class="btn-primary-clean">Open PDF Viewer</a><a href="/review/${review.id}" class="btn-ghost-clean">Back to Review</a></div></div></div>`;
  const editorBc = [{ href: '/', label: 'Home' }, { href: '/review', label: 'Reviews' }, { href: `/review/${review.id}`, label: review.name || 'Review' }, { label: 'Editor' }];
  return page(user, `${review.name || 'Review'} | Editor`, editorBc, content);
}
