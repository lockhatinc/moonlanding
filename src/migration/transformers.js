// Field transformation utilities
import { randomUUID } from 'crypto';

export const uuid = () => randomUUID();

// App stores timestamps as Unix seconds (INTEGER)
export const now = () => Math.floor(Date.now() / 1000);

export function toTs(val) {
  if (!val) return now();
  if (typeof val === 'number') return val > 1e10 ? Math.floor(val / 1000) : val;
  if (val && typeof val === 'object' && val._seconds) return val._seconds;
  if (val && typeof val === 'object' && val.seconds) return val.seconds;
  const d = new Date(val);
  return isNaN(d) ? now() : Math.floor(d.getTime() / 1000);
}

export function toDateTs(str) {
  if (!str) return null;
  // Handle DD/MM/YY HH:mm or DD/MM/YYYY
  const ddmm = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (ddmm) {
    const [, d, m, y] = ddmm;
    const year = y.length === 2 ? `20${y}` : y;
    const ms = new Date(`${year}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`).getTime();
    return ms ? Math.floor(ms / 1000) : null;
  }
  const ts = new Date(str).getTime();
  return isNaN(ts) ? null : Math.floor(ts / 1000);
}

export function toJson(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
}

export function normStatus(val) {
  if (!val) return 'active';
  const s = String(val).toLowerCase();
  if (s === 'active' || s === 'true' || s === '1') return 'active';
  if (s === 'inactive' || s === 'false' || s === '0' || s === 'closed') return 'inactive';
  return s;
}

export function normStage(val) {
  if (!val) return 'info_gathering';
  const s = String(val).toLowerCase().replace(/\s+/g, '_');
  const map = {
    'info_gathering': 'info_gathering',
    'rfi': 'rfi',
    'finalization': 'finalization',
    'complete': 'complete',
    'archive': 'archive',
    'history': 'archive',
  };
  return map[s] || 'info_gathering';
}

export function bool(val) {
  if (val === true || val === 1 || val === 'true') return 1;
  return 0;
}
