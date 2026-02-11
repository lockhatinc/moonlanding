const MIN_SIZE = 20;

const HANDLE_POSITIONS = [
  { cursor: 'nw-resize', x: 0, y: 0 },
  { cursor: 'n-resize',  x: 0.5, y: 0 },
  { cursor: 'ne-resize', x: 1, y: 0 },
  { cursor: 'w-resize',  x: 0, y: 0.5 },
  { cursor: 'e-resize',  x: 1, y: 0.5 },
  { cursor: 'sw-resize', x: 0, y: 1 },
  { cursor: 's-resize',  x: 0.5, y: 1 },
  { cursor: 'se-resize', x: 1, y: 1 }
];

export function createMobileResizeHandles(highlightEl, onResize) {
  if (!highlightEl) return null;

  const handles = [];
  let activeHandle = null;
  let startTouch = null;
  let startRect = null;

  for (const pos of HANDLE_POSITIONS) {
    const handle = document.createElement('div');
    handle.className = 'pdf-resize-handle';
    Object.assign(handle.style, {
      position: 'absolute',
      width: '18px',
      height: '18px',
      background: 'white',
      border: '2px solid #3b82f6',
      borderRadius: '50%',
      cursor: pos.cursor,
      left: `calc(${pos.x * 100}% - 9px)`,
      top: `calc(${pos.y * 100}% - 9px)`,
      touchAction: 'none',
      zIndex: '10'
    });

    handle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      activeHandle = pos;
      startTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startRect = {
        left: highlightEl.offsetLeft,
        top: highlightEl.offsetTop,
        width: highlightEl.offsetWidth,
        height: highlightEl.offsetHeight
      };
    }, { passive: false });

    handles.push(handle);
    highlightEl.appendChild(handle);
  }

  const onTouchMove = (e) => {
    if (!activeHandle || !startTouch || !startRect) return;
    e.preventDefault();

    const dx = e.touches[0].clientX - startTouch.x;
    const dy = e.touches[0].clientY - startTouch.y;
    const h = activeHandle;

    let newLeft = startRect.left;
    let newTop = startRect.top;
    let newWidth = startRect.width;
    let newHeight = startRect.height;

    if (h.x === 0) { newLeft = startRect.left + dx; newWidth = startRect.width - dx; }
    if (h.x === 1) { newWidth = startRect.width + dx; }
    if (h.y === 0) { newTop = startRect.top + dy; newHeight = startRect.height - dy; }
    if (h.y === 1) { newHeight = startRect.height + dy; }

    if (newWidth < MIN_SIZE) { newWidth = MIN_SIZE; if (h.x === 0) newLeft = startRect.left + startRect.width - MIN_SIZE; }
    if (newHeight < MIN_SIZE) { newHeight = MIN_SIZE; if (h.y === 0) newTop = startRect.top + startRect.height - MIN_SIZE; }

    highlightEl.style.left = `${newLeft}px`;
    highlightEl.style.top = `${newTop}px`;
    highlightEl.style.width = `${newWidth}px`;
    highlightEl.style.height = `${newHeight}px`;
  };

  const onTouchEnd = () => {
    if (!activeHandle) return;
    const container = highlightEl.parentElement;
    const cw = container?.offsetWidth || 1;
    const ch = container?.offsetHeight || 1;

    const dims = {
      x: highlightEl.offsetLeft / cw,
      y: highlightEl.offsetTop / ch,
      width: highlightEl.offsetWidth / cw,
      height: highlightEl.offsetHeight / ch
    };

    activeHandle = null;
    startTouch = null;
    startRect = null;
    onResize?.(dims);
  };

  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd);

  return () => {
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    handles.forEach(h => h.remove());
  };
}

export function removeMobileResizeHandles(highlightEl) {
  if (!highlightEl) return;
  highlightEl.querySelectorAll('.pdf-resize-handle').forEach(h => h.remove());
}
