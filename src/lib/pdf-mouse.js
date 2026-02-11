export function createMouseSelection(container, options = {}) {
  const { onSelectionStart, onSelectionEnd, onSelectionChange, minSize = 5 } = options;
  let isSelecting = false;
  let startPoint = null;
  let currentRect = null;
  let overlay = null;

  function getPoint(e) {
    const cr = container.getBoundingClientRect();
    return { x: e.clientX - cr.left, y: e.clientY - cr.top };
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;
    isSelecting = true;
    startPoint = getPoint(e);
    currentRect = null;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'pdf-selection-overlay';
      overlay.style.cssText = 'position:absolute;border:2px dashed #3b82f6;background:rgba(59,130,246,0.08);pointer-events:none;z-index:10;display:none;';
      container.style.position = container.style.position || 'relative';
      container.appendChild(overlay);
    }
    overlay.style.display = 'block';
    if (onSelectionStart) onSelectionStart(startPoint);
  }

  function onMouseMove(e) {
    if (!isSelecting || !startPoint) return;
    const p = getPoint(e);
    const x = Math.min(startPoint.x, p.x);
    const y = Math.min(startPoint.y, p.y);
    const w = Math.abs(p.x - startPoint.x);
    const h = Math.abs(p.y - startPoint.y);
    currentRect = { x, y, width: w, height: h };
    if (overlay) {
      overlay.style.left = x + 'px';
      overlay.style.top = y + 'px';
      overlay.style.width = w + 'px';
      overlay.style.height = h + 'px';
    }
    if (onSelectionChange) onSelectionChange(currentRect);
  }

  function onMouseUp() {
    if (!isSelecting) return;
    isSelecting = false;
    if (overlay) overlay.style.display = 'none';
    if (currentRect && currentRect.width >= minSize && currentRect.height >= minSize) {
      if (onSelectionEnd) onSelectionEnd(currentRect);
    }
    startPoint = null;
    currentRect = null;
  }

  container.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  return {
    destroy() {
      container.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
  };
}

export function createMouseMonitor(element, options = {}) {
  const { onEnter, onLeave, onMove, throttleMs = 16 } = options;
  let isInside = false;
  let lastMoveTime = 0;

  function handleEnter(e) {
    if (isInside) return;
    isInside = true;
    if (onEnter) onEnter(e);
  }

  function handleLeave(e) {
    if (!isInside) return;
    isInside = false;
    if (onLeave) onLeave(e);
  }

  function handleMove(e) {
    const now = Date.now();
    if (now - lastMoveTime < throttleMs) return;
    lastMoveTime = now;
    if (onMove) onMove(e);
  }

  element.addEventListener('mouseenter', handleEnter);
  element.addEventListener('mouseleave', handleLeave);
  element.addEventListener('mousemove', handleMove);

  return {
    isInside() { return isInside; },
    destroy() {
      element.removeEventListener('mouseenter', handleEnter);
      element.removeEventListener('mouseleave', handleLeave);
      element.removeEventListener('mousemove', handleMove);
    }
  };
}
