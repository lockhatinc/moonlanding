export function viewportToPage(point, viewport) {
  if (!viewport) return point;
  const scale = viewport.scale || 1;
  return { x: point.x / scale, y: point.y / scale };
}

export function pageToViewport(point, viewport) {
  if (!viewport) return point;
  const scale = viewport.scale || 1;
  return { x: point.x * scale, y: point.y * scale };
}

export function rectViewportToPage(rect, viewport) {
  if (!viewport) return rect;
  const scale = viewport.scale || 1;
  return {
    x: rect.x / scale,
    y: rect.y / scale,
    width: rect.width / scale,
    height: rect.height / scale,
  };
}

export function rectPageToViewport(rect, viewport) {
  if (!viewport) return rect;
  const scale = viewport.scale || 1;
  return {
    x: rect.x * scale,
    y: rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

export function pdfToScreen(point, pageHeight, viewport) {
  if (!viewport) return point;
  const scale = viewport.scale || 1;
  return { x: point.x * scale, y: (pageHeight - point.y) * scale };
}

export function screenToPdf(point, pageHeight, viewport) {
  if (!viewport) return point;
  const scale = viewport.scale || 1;
  return { x: point.x / scale, y: pageHeight - (point.y / scale) };
}

export function applyRotation(point, rotation, pageWidth, pageHeight) {
  const r = ((rotation % 360) + 360) % 360;
  if (r === 0) return { ...point };
  if (r === 90) return { x: point.y, y: pageWidth - point.x };
  if (r === 180) return { x: pageWidth - point.x, y: pageHeight - point.y };
  if (r === 270) return { x: pageHeight - point.y, y: point.x };
  return { ...point };
}

export function rectContainsPoint(rect, point) {
  return point.x >= rect.x && point.x <= rect.x + rect.width &&
         point.y >= rect.y && point.y <= rect.y + rect.height;
}

export function rectsOverlap(a, b) {
  return !(a.x + a.width < b.x || b.x + b.width < a.x ||
           a.y + a.height < b.y || b.y + b.height < a.y);
}
