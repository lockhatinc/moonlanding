'use client';

export function useThrottledMediaQuery(query, throttleMs = 200) {
  let matches = false;
  let lastCheck = 0;
  let cached = null;

  function check() {
    const now = Date.now();
    if (cached !== null && now - lastCheck < throttleMs) return cached;
    lastCheck = now;
    if (typeof window !== 'undefined' && window.matchMedia) {
      matches = window.matchMedia(query).matches;
    }
    cached = matches;
    return matches;
  }

  return { check, get matches() { return check(); } };
}

export function createMediaQueryListener(query, callback, throttleMs = 200) {
  if (typeof window === 'undefined') return { destroy() {} };
  const mql = window.matchMedia(query);
  let timer = null;
  function handler(e) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { callback(e.matches); }, throttleMs);
  }
  if (mql.addEventListener) mql.addEventListener('change', handler);
  else mql.addListener(handler);
  callback(mql.matches);
  return {
    destroy() {
      if (timer) clearTimeout(timer);
      if (mql.removeEventListener) mql.removeEventListener('change', handler);
      else mql.removeListener(handler);
    }
  };
}
