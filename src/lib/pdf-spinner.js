export function createSpinner(size = 32, color = '#3b82f6') {
  return `<div class="pdf-spinner" style="width:${size}px;height:${size}px;border:3px solid #e5e7eb;border-top-color:${color};border-radius:50%;animation:pdf-spin 0.7s linear infinite;display:inline-block"></div>`;
}

export function createLoadingOverlay(message = 'Loading...') {
  return `<div class="pdf-loading-overlay" style="position:absolute;inset:0;background:rgba(255,255,255,0.8);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;gap:0.75rem">
    ${createSpinner(40)}
    <span style="font-size:0.875rem;color:#6b7280">${message}</span>
  </div>`;
}

export function showPageSpinner(pageElement) {
  if (!pageElement) return;
  const existing = pageElement.querySelector('.pdf-loading-overlay');
  if (existing) return;
  const overlay = document.createElement('div');
  overlay.innerHTML = createLoadingOverlay('Loading page...');
  const el = overlay.firstElementChild;
  pageElement.style.position = pageElement.style.position || 'relative';
  pageElement.appendChild(el);
}

export function hidePageSpinner(pageElement) {
  if (!pageElement) return;
  const overlay = pageElement.querySelector('.pdf-loading-overlay');
  if (overlay) overlay.remove();
}

export function injectSpinnerStyles() {
  if (document.getElementById('pdf-spinner-styles')) return;
  const style = document.createElement('style');
  style.id = 'pdf-spinner-styles';
  style.textContent = '@keyframes pdf-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
}
