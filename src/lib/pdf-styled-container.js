export function createStyledContainer(options = {}) {
  const { width = '100%', height = '100%', className = '', padding = '0', background = 'white', overflow = 'hidden' } = options;
  return `<div class="pdf-styled-container ${className}" style="width:${width};height:${height};padding:${padding};background:${background};overflow:${overflow};position:relative;border-radius:0.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.1)"></div>`;
}

export function createViewerContainer(options = {}) {
  const { id = 'pdf-viewer', height = '80vh' } = options;
  return `<div id="${id}" class="pdf-viewer-container" style="width:100%;height:${height};overflow:auto;background:#525659;position:relative;border-radius:0.5rem">
    <div id="${id}-pages" class="pdf-pages-wrapper" style="display:flex;flex-direction:column;align-items:center;gap:1rem;padding:1rem"></div>
  </div>`;
}

export function createPageContainer(pageNumber) {
  return `<div class="pdf-page-container" data-page-number="${pageNumber}" style="position:relative;background:white;box-shadow:0 2px 8px rgba(0,0,0,0.15);margin:0 auto">
    <canvas class="pdf-page-canvas"></canvas>
    <div class="pdf-text-layer" style="position:absolute;inset:0;overflow:hidden;opacity:0.25;line-height:1"></div>
    <div class="pdf-highlight-layer" style="position:absolute;inset:0;pointer-events:none"></div>
    <div class="pdf-annotation-layer" style="position:absolute;inset:0"></div>
  </div>`;
}

export function createToolbarContainer(leftContent = '', rightContent = '') {
  return `<div class="pdf-toolbar" style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 1rem;background:white;border-bottom:1px solid #e5e7eb;border-radius:0.5rem 0.5rem 0 0">
    <div class="pdf-toolbar-left" style="display:flex;align-items:center;gap:0.5rem">${leftContent}</div>
    <div class="pdf-toolbar-right" style="display:flex;align-items:center;gap:0.5rem">${rightContent}</div>
  </div>`;
}
