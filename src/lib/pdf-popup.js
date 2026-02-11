import { HIGHLIGHT_PALETTE } from '@/lib/mwr-core-engines';

export function createHighlightPopup(highlight, position, callbacks = {}) {
  removeHighlightPopups();

  const popup = document.createElement('div');
  popup.className = 'pdf-highlight-popup';

  const viewportHeight = window.innerHeight;
  const showAbove = (viewportHeight - position.bottom) < 250;

  Object.assign(popup.style, {
    position: 'absolute',
    left: `${position.left}px`,
    [showAbove ? 'bottom' : 'top']: showAbove
      ? `${position.containerHeight - position.top + 8}px`
      : `${position.bottom + 8}px`,
    zIndex: '1000',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    padding: '14px',
    minWidth: '260px',
    maxWidth: '360px'
  });

  const colorName = Object.entries(HIGHLIGHT_PALETTE).find(
    ([, p]) => p.color === highlight.color
  )?.[1]?.label || 'Unknown';

  const created = highlight.created_at
    ? new Date(typeof highlight.created_at === 'number' ? highlight.created_at * 1000 : highlight.created_at).toLocaleDateString()
    : '';

  const isResolved = highlight.status === 'resolved';

  popup.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="width:14px;height:14px;border-radius:50%;background:${highlight.color || '#B0B0B0'};flex-shrink:0"></span>
      <span style="font-size:13px;font-weight:500">${colorName}</span>
      <span style="font-size:12px;color:#6b7280;margin-left:auto">${isResolved ? 'Resolved' : 'Unresolved'}</span>
    </div>
    ${highlight.comment || highlight.content ? `<div style="font-size:13px;margin-bottom:8px;padding:6px;background:#f9fafb;border-radius:4px">${highlight.comment || highlight.content}</div>` : ''}
    <div style="font-size:11px;color:#9ca3af;margin-bottom:10px">
      ${highlight.created_by_display || highlight.author || ''}${created ? ` - ${created}` : ''}
    </div>
    <div class="pdf-popup-actions" style="display:flex;gap:6px;flex-wrap:wrap"></div>
  `;

  const actions = popup.querySelector('.pdf-popup-actions');

  if (!isResolved && callbacks.onResolve) {
    actions.appendChild(makeBtn('Resolve', '#22c55e', () => { popup.remove(); callbacks.onResolve(highlight.id); }));
  }
  if (isResolved && callbacks.onReopen) {
    actions.appendChild(makeBtn('Reopen', '#f59e0b', () => { popup.remove(); callbacks.onReopen(highlight.id); }));
  }
  if (callbacks.onEdit) {
    actions.appendChild(makeBtn('Edit', '#3b82f6', () => { popup.remove(); callbacks.onEdit(highlight.id); }));
  }
  if (callbacks.onDelete) {
    actions.appendChild(makeBtn('Delete', '#ef4444', () => { popup.remove(); callbacks.onDelete(highlight.id); }));
  }

  const dismissHandler = (e) => {
    if (!popup.contains(e.target)) {
      popup.remove();
      document.removeEventListener('mousedown', dismissHandler);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', dismissHandler), 0);

  return popup;
}

function makeBtn(label, color, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.style.cssText = `padding:3px 10px;border:1px solid ${color};border-radius:4px;background:white;color:${color};cursor:pointer;font-size:12px`;
  btn.addEventListener('click', onClick);
  return btn;
}

export function removeHighlightPopups() {
  document.querySelectorAll('.pdf-highlight-popup').forEach(el => el.remove());
}
