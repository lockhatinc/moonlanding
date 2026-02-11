export function optimizeClientRects(rects) {
  if (!rects || !rects.length) return [];
  const sorted = [...rects].sort((a, b) => a.top - b.top || a.left - b.left);
  const merged = [];
  let current = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    const sameRow = Math.abs(r.top - current.top) < 2 && Math.abs(r.height - current.height) < 2;
    const adjacent = r.left <= current.left + current.width + 1;
    if (sameRow && adjacent) {
      const right = Math.max(current.left + current.width, r.left + r.width);
      current.width = right - current.left;
    } else {
      merged.push(current);
      current = { ...r };
    }
  }
  merged.push(current);
  return merged;
}

export function filterSmallRects(rects, minWidth = 1, minHeight = 1) {
  return (rects || []).filter(r => r.width >= minWidth && r.height >= minHeight);
}

export function deduplicateRects(rects, tolerance = 1) {
  if (!rects || !rects.length) return [];
  const result = [];
  for (const r of rects) {
    const dup = result.find(existing =>
      Math.abs(existing.top - r.top) <= tolerance &&
      Math.abs(existing.left - r.left) <= tolerance &&
      Math.abs(existing.width - r.width) <= tolerance &&
      Math.abs(existing.height - r.height) <= tolerance
    );
    if (!dup) result.push(r);
  }
  return result;
}

export function boundingRectOfRects(rects) {
  if (!rects || !rects.length) return null;
  let top = Infinity, left = Infinity, bottom = -Infinity, right = -Infinity;
  for (const r of rects) {
    if (r.top < top) top = r.top;
    if (r.left < left) left = r.left;
    if (r.top + r.height > bottom) bottom = r.top + r.height;
    if (r.left + r.width > right) right = r.left + r.width;
  }
  return { top, left, width: right - left, height: bottom - top };
}
