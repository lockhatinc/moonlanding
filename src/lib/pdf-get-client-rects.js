export function getClientRects(range, containerEl) {
  if (!range) return [];
  const clientRects = range.getClientRects();
  if (!clientRects || !clientRects.length) return [];
  const containerRect = containerEl ? containerEl.getBoundingClientRect() : { top: 0, left: 0 };
  return Array.from(clientRects).map(r => ({
    top: r.top - containerRect.top,
    left: r.left - containerRect.left,
    width: r.width,
    height: r.height,
    bottom: r.bottom - containerRect.top,
    right: r.right - containerRect.left,
  }));
}

export function getTextSelectionRects(pageElement) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return [];
  const range = sel.getRangeAt(0);
  return getClientRects(range, pageElement);
}

export function getTextNodeRects(textNode, start, end, containerEl) {
  if (!textNode || textNode.nodeType !== 3) return [];
  const range = document.createRange();
  const len = textNode.textContent?.length || 0;
  range.setStart(textNode, Math.min(start, len));
  range.setEnd(textNode, Math.min(end, len));
  return getClientRects(range, containerEl);
}

export function rectsFromHighlight(highlight, pageElement) {
  if (!highlight || !highlight.rects) return [];
  if (Array.isArray(highlight.rects)) return highlight.rects;
  if (typeof highlight.rects === 'string') {
    try { return JSON.parse(highlight.rects); } catch { return []; }
  }
  return [];
}
