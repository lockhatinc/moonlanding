import { h } from '@/ui/webjsx.js'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#f43f5e', '#78716c', '#64748b', '#1e293b'
]

export function ColorPicker({
  value = '#3b82f6',
  presets = PRESET_COLORS,
  label = null,
  name = '',
  showInput = true,
  className = '',
  ...props
}) {
  const swatches = presets.map(color =>
    h('button', {
      type: 'button',
      class: `w-7 h-7 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${color === value ? 'border-gray-900 ring-2 ring-offset-1 ring-blue-400' : 'border-gray-200'}`,
      style: `background-color: ${color}`,
      'data-color': color,
      'aria-label': color
    })
  )

  return h('div', {
    class: `${className}`,
    'data-component': 'color-picker',
    ...props
  }, [
    label ? h('label', {
      class: 'block text-sm font-medium text-gray-700 mb-2',
      for: name
    }, label) : null,
    h('div', { class: 'flex items-center gap-3 mb-2' }, [
      h('div', {
        class: 'w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0',
        style: `background-color: ${value}`
      }),
      showInput ? h('input', {
        type: 'text',
        name,
        id: name,
        value,
        class: 'flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500',
        maxlength: 7,
        pattern: '#[0-9a-fA-F]{6}'
      }) : null
    ]),
    h('div', { class: 'flex flex-wrap gap-1.5' }, swatches)
  ])
}

export default ColorPicker
