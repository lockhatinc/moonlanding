export function captureAreaAsPng(canvas, rect, scale = 1) {
  if (!canvas || !rect) return null;
  const { x, y, width, height } = rect;
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = Math.round(width * scale);
  tmpCanvas.height = Math.round(height * scale);
  const ctx = tmpCanvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(canvas, x * scale, y * scale, width * scale, height * scale, 0, 0, tmpCanvas.width, tmpCanvas.height);
  return tmpCanvas.toDataURL('image/png');
}

export function capturePageArea(pageNumber, rect, scale) {
  const pageEl = document.querySelector(`[data-page-number="${pageNumber}"] canvas`);
  if (!pageEl) return null;
  const deviceScale = scale || window.devicePixelRatio || 1;
  return captureAreaAsPng(pageEl, rect, deviceScale);
}

export function areaToBlob(dataUrl) {
  if (!dataUrl) return null;
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const raw = atob(parts[1]);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function downloadAreaAsPng(canvas, rect, filename = 'capture.png') {
  const dataUrl = captureAreaAsPng(canvas, rect);
  if (!dataUrl) return;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
