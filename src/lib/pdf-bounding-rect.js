export function getBoundingRect(rects) {
  if (!rects || rects.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const rect of rects) {
    const x1 = rect.left ?? rect.x ?? 0;
    const y1 = rect.top ?? rect.y ?? 0;
    const x2 = x1 + (rect.width ?? 0);
    const y2 = y1 + (rect.height ?? 0);

    if (x1 < minX) minX = x1;
    if (y1 < minY) minY = y1;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  }

  return {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY,
    right: maxX,
    bottom: maxY,
    x: minX,
    y: minY
  };
}

export function normalizeRect(rect, containerRect) {
  if (!rect || !containerRect) return null;
  const cw = containerRect.width || 1;
  const ch = containerRect.height || 1;
  const cx = containerRect.left ?? containerRect.x ?? 0;
  const cy = containerRect.top ?? containerRect.y ?? 0;

  return {
    x: ((rect.left ?? rect.x ?? 0) - cx) / cw,
    y: ((rect.top ?? rect.y ?? 0) - cy) / ch,
    width: (rect.width ?? 0) / cw,
    height: (rect.height ?? 0) / ch
  };
}

export function denormalizeRect(normalizedRect, containerRect) {
  if (!normalizedRect || !containerRect) return null;
  const cx = containerRect.left ?? containerRect.x ?? 0;
  const cy = containerRect.top ?? containerRect.y ?? 0;

  return {
    left: normalizedRect.x * containerRect.width + cx,
    top: normalizedRect.y * containerRect.height + cy,
    width: normalizedRect.width * containerRect.width,
    height: normalizedRect.height * containerRect.height
  };
}
