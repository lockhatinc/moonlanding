import { h } from '@/ui/webjsx.js'

export function Toggle({
  checked = false,
  label = null,
  description = null,
  disabled = false,
  name = '',
  size = 'md',
  className = '',
  ...props
}) {
  const sizeConfig = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' }
  }
  const s = sizeConfig[size] || sizeConfig.md

  const trackClass = `${s.track} rounded-full relative inline-flex items-center cursor-pointer transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
  const thumbClass = `${s.thumb} rounded-full bg-white shadow-sm transform transition-transform ${checked ? s.translate : 'translate-x-0.5'}`

  const toggle = h('label', {
    class: `inline-flex items-center gap-3 ${disabled ? 'pointer-events-none' : 'cursor-pointer'} ${className}`,
    'data-component': 'toggle'
  }, [
    h('input', {
      type: 'checkbox',
      name,
      checked,
      disabled,
      class: 'sr-only peer',
      ...props
    }),
    h('div', { class: trackClass }, [
      h('div', { class: thumbClass })
    ]),
    (label || description) ? h('div', {}, [
      label ? h('span', { class: 'text-sm font-medium text-gray-900' }, label) : null,
      description ? h('p', { class: 'text-xs text-gray-500 mt-0.5' }, description) : null
    ]) : null
  ])

  return toggle
}

export default Toggle
