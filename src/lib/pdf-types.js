export const HighlightType = {
  TEXT: 'text',
  AREA: 'area',
};

export const HighlightStatus = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  FLAGGED: 'flagged',
};

export function createHighlightData(options = {}) {
  return {
    id: options.id || null,
    review_id: options.review_id || null,
    type: options.type || HighlightType.TEXT,
    page: options.page || 1,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 0,
    height: options.height ?? 0,
    rects: options.rects || [],
    text: options.text || '',
    color: options.color || 'yellow',
    comment: options.comment || '',
    status: options.status || HighlightStatus.ACTIVE,
    resolved: options.resolved || false,
    flagged: options.flagged || false,
    created_by: options.created_by || null,
    created_at: options.created_at || null,
  };
}

export function isTextHighlight(highlight) {
  return highlight?.type === HighlightType.TEXT;
}

export function isAreaHighlight(highlight) {
  return highlight?.type === HighlightType.AREA;
}

export function highlightHasImage(highlight) {
  return !!(highlight?.image || highlight?.image_url || highlight?.area_image);
}

export function parseHighlightRects(highlight) {
  if (!highlight?.rects) return [];
  if (Array.isArray(highlight.rects)) return highlight.rects;
  if (typeof highlight.rects === 'string') {
    try { return JSON.parse(highlight.rects); } catch { return []; }
  }
  return [];
}
