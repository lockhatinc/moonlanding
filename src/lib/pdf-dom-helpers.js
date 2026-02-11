export function getPageElement(pageNumber) {
  const selector = `.page[data-page-number="${pageNumber}"], [data-page="${pageNumber}"]`;
  return document.querySelector(selector) || document.querySelector(`.pdf-page-${pageNumber}`);
}

export function getTextLayer(pageElement) {
  if (!pageElement) return null;
  return pageElement.querySelector('.textLayer') || pageElement.querySelector('[class*="text-layer"]');
}

export function getCanvasLayer(pageElement) {
  if (!pageElement) return null;
  return pageElement.querySelector('canvas') || pageElement.querySelector('.canvasWrapper canvas');
}

export function getViewport(page, scale = 1, rotation = 0) {
  if (page?.getViewport) {
    return page.getViewport({ scale, rotation });
  }
  const defaultWidth = 612;
  const defaultHeight = 792;
  const isRotated = rotation === 90 || rotation === 270;
  const width = (isRotated ? defaultHeight : defaultWidth) * scale;
  const height = (isRotated ? defaultWidth : defaultHeight) * scale;
  return { width, height, scale, rotation };
}

export function getPageContainer(pageElement) {
  if (!pageElement) return null;
  return pageElement.closest('.pdf-container') || pageElement.parentElement;
}

export function getScrollContainer(pageElement) {
  if (!pageElement) return null;
  let el = pageElement.parentElement;
  while (el) {
    const style = window.getComputedStyle(el);
    if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
      return el;
    }
    el = el.parentElement;
  }
  return document.documentElement;
}

export function scrollToPage(pageNumber) {
  const pageEl = getPageElement(pageNumber);
  if (!pageEl) return;
  const scrollContainer = getScrollContainer(pageEl);
  pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
