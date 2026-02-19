export function createMobileResizableRectangle(options = {}) {
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    onResize = null,
    onMove = null,
    onEnd = null,
    color = 'rgba(255, 224, 130, 0.5)'
  } = options;

  const rect = document.createElement('div');
  rect.className = 'mobile-resizable-rect';
  rect.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: ${width}px;
    height: ${height}px;
    background: ${color};
    border: 2px solid #FFC107;
    border-radius: 2px;
    touch-action: none;
    cursor: move;
  `;

  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'resize-handle';
  resizeHandle.style.cssText = `
    position: absolute;
    width: 20px;
    height: 20px;
    background: #FFC107;
    border: 1px solid #FF9800;
    border-radius: 2px;
    right: -10px;
    bottom: -10px;
    cursor: nwse-resize;
    touch-action: none;
  `;

  rect.appendChild(resizeHandle);

  let isDragging = false;
  let isResizing = false;
  let startX, startY, startWidth, startHeight;

  function handleMoveStart(e) {
    const touch = e.touches?.[0] || e;
    isDragging = true;
    startX = touch.clientX - rect.offsetLeft;
    startY = touch.clientY - rect.offsetTop;

    if (e.type.startsWith('touch')) {
      e.preventDefault();
    }
  }

  function handleResizeStart(e) {
    const touch = e.touches?.[0] || e;
    isResizing = true;
    startX = touch.clientX;
    startY = touch.clientY;
    startWidth = rect.offsetWidth;
    startHeight = rect.offsetHeight;

    if (e.type.startsWith('touch')) {
      e.preventDefault();
    }
  }

  function handleMove(e) {
    if (!isDragging) return;

    const touch = e.touches?.[0] || e;
    const newX = touch.clientX - startX;
    const newY = touch.clientY - startY;

    rect.style.left = newX + 'px';
    rect.style.top = newY + 'px';

    if (onMove) {
      onMove({
        x: newX,
        y: newY,
        width: rect.offsetWidth,
        height: rect.offsetHeight
      });
    }

    if (e.type.startsWith('touch')) {
      e.preventDefault();
    }
  }

  function handleResize(e) {
    if (!isResizing) return;

    const touch = e.touches?.[0] || e;
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    const newWidth = Math.max(50, startWidth + deltaX);
    const newHeight = Math.max(50, startHeight + deltaY);

    rect.style.width = newWidth + 'px';
    rect.style.height = newHeight + 'px';

    if (onResize) {
      onResize({
        x: rect.offsetLeft,
        y: rect.offsetTop,
        width: newWidth,
        height: newHeight
      });
    }

    if (e.type.startsWith('touch')) {
      e.preventDefault();
    }
  }

  function handleEnd(e) {
    if (isDragging || isResizing) {
      if (onEnd) {
        onEnd({
          x: rect.offsetLeft,
          y: rect.offsetTop,
          width: rect.offsetWidth,
          height: rect.offsetHeight
        });
      }
    }
    isDragging = false;
    isResizing = false;
  }

  rect.addEventListener('mousedown', handleMoveStart);
  rect.addEventListener('touchstart', handleMoveStart);

  resizeHandle.addEventListener('mousedown', handleResizeStart);
  resizeHandle.addEventListener('touchstart', handleResizeStart);

  document.addEventListener('mousemove', handleMove);
  document.addEventListener('touchmove', handleMove, { passive: false });

  document.addEventListener('mousemove', handleResize);
  document.addEventListener('touchmove', handleResize, { passive: false });

  document.addEventListener('mouseup', handleEnd);
  document.addEventListener('touchend', handleEnd);

  return {
    element: rect,
    setPosition: (newX, newY) => {
      rect.style.left = newX + 'px';
      rect.style.top = newY + 'px';
    },
    setSize: (newWidth, newHeight) => {
      rect.style.width = newWidth + 'px';
      rect.style.height = newHeight + 'px';
    },
    getRect: () => ({
      x: rect.offsetLeft,
      y: rect.offsetTop,
      width: rect.offsetWidth,
      height: rect.offsetHeight
    }),
    destroy: () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('touchmove', handleResize);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
      rect.remove();
    }
  };
}

export function createPinchZoomHandler(container, options = {}) {
  const { onZoom = null } = options;
  let lastDistance = 0;

  function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      lastDistance = getDistance(e.touches[0], e.touches[1]);
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scale = distance / lastDistance;

      if (onZoom) {
        onZoom(scale);
      }

      lastDistance = distance;
      e.preventDefault();
    }
  }

  container.addEventListener('touchstart', handleTouchStart);
  container.addEventListener('touchmove', handleTouchMove, { passive: false });

  return {
    destroy: () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    }
  };
}
