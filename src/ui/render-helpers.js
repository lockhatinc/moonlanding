import { h } from '@/ui/webjsx.js'

export const STAGE_COLORS = {
  info_gathering: { bg: '#dbeafe', text: '#1e40af', label: 'Info Gathering' },
  commencement: { bg: '#dbeafe', text: '#1e40af', label: 'Commencement' },
  team_execution: { bg: '#fef3c7', text: '#92400e', label: 'Team Execution' },
  partner_review: { bg: '#fef3c7', text: '#92400e', label: 'Partner Review' },
  finalization: { bg: '#d1fae5', text: '#065f46', label: 'Finalization' },
  closeout: { bg: '#d1fae5', text: '#065f46', label: 'Close Out' },
}

export const STATUS_COLORS = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  active: { bg: '#dbeafe', text: '#1e40af' },
  completed: { bg: '#d1fae5', text: '#065f46' },
  archived: { bg: '#f3f4f6', text: '#4b5563' },
  open: { bg: '#fef3c7', text: '#92400e' },
  closed: { bg: '#d1fae5', text: '#065f46' },
  draft: { bg: '#f3f4f6', text: '#6b7280' },
  in_progress: { bg: '#dbeafe', text: '#1e40af' },
  review: { bg: '#ede9fe', text: '#5b21b6' },
  approved: { bg: '#d1fae5', text: '#065f46' },
  rejected: { bg: '#fee2e2', text: '#991b1b' },
  overdue: { bg: '#fee2e2', text: '#991b1b' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280' },
  on_hold: { bg: '#fef3c7', text: '#92400e' },
  resolved: { bg: '#d1fae5', text: '#065f46' },
  unresolved: { bg: '#fee2e2', text: '#991b1b' },
  flagged: { bg: '#fce7f3', text: '#9d174d' },
  responded: { bg: '#dbeafe', text: '#1e40af' },
  expired: { bg: '#f3f4f6', text: '#6b7280' },
  private: { bg: '#ede9fe', text: '#5b21b6' },
  public: { bg: '#dbeafe', text: '#1e40af' },
}

export const AVATAR_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1','#14b8a6','#e11d48']
export const AVATAR_SIZES = { sm: 24, md: 32, lg: 40, xl: 48 }

export const TOAST_SCRIPT = `window.showToast=(m,t='info')=>{let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.className='toast-container';document.body.appendChild(c)}const d=document.createElement('div');d.className='toast toast-'+t;d.textContent=m;c.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300)},3000)};`

export function fmtVal(value, fieldKey, item = {}) {
  if (value === null || value === undefined) return '-'
  if (fieldKey?.includes('_at') || fieldKey === 'created_at' || fieldKey === 'updated_at') {
    const num = Number(value)
    if (!isNaN(num) && num > 1000000000 && num < 3000000000) return new Date(num * 1000).toLocaleString()
  }
  if (fieldKey === 'year') { const n = Number(value); if (!isNaN(n)) return String(Math.floor(n)) }
  if (fieldKey === 'stage' && STAGE_COLORS[value]) {
    const s = STAGE_COLORS[value]
    return h('span', { className: 'badge-stage', style: `background:${s.bg};color:${s.text}` }, s.label)
  }
  if (fieldKey === 'status' && STATUS_COLORS[value]) {
    const s = STATUS_COLORS[value]
    return h('span', { className: 'badge-status', style: `background:${s.bg};color:${s.text}` }, value.charAt(0).toUpperCase() + value.slice(1))
  }
  if (item[`${fieldKey}_display`]) return item[`${fieldKey}_display`]
  return String(value)
}

export function statusLabel(status) {
  if (!status) return ''
  const key = status.toLowerCase().replace(/\s+/g, '_')
  const s = STATUS_COLORS[key] || { bg: '#f3f4f6', text: '#6b7280' }
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
  return h('span', { className: 'status-label', style: `background:${s.bg};color:${s.text}` }, label)
}

export function nameHash(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return Math.abs(hash)
}

export { getInitials } from '@/lib/utils.js'
