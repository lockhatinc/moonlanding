import { h } from '@/ui/webjsx.js'

export function ContextMenu({
  items = [],
  x = 0,
  y = 0,
  visible = false,
  onClose = null,
  className = '',
  ...props
}) {
  if (!visible) return null

  const menuItems = items.map(item => {
    if (item.divider) {
      return h('div', { class: 'border-t border-gray-100 my-1' })
    }
    return h('button', {
      type: 'button',
      class: `w-full text-left px-4 py-2 text-sm bg-transparent border-0 cursor-pointer transition-colors ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'} ${item.disabled ? 'opacity-40 pointer-events-none' : ''}`,
      'data-action': item.action || null,
      disabled: item.disabled || false
    }, [
      item.icon ? h('span', { class: 'mr-2' }, item.icon) : null,
      item.label
    ])
  })

  return h('div', {
    class: 'fixed inset-0 z-[100]',
    'data-component': 'context-menu-overlay',
    onclick: onClose ? `(${onClose})()` : null
  }, [
    h('div', {
      class: `absolute bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px] z-[101] ${className}`,
      style: `left: ${x}px; top: ${y}px`,
      'data-component': 'context-menu',
      ...props
    }, menuItems)
  ])
}

export default ContextMenu
