import { h } from '@/ui/webjsx.js'

export function EmptyState({
  icon = '📭',
  title = 'No items found',
  message = null,
  action = null,
  className = '',
  ...props
}) {
  return h('div', {
    class: `flex flex-col items-center justify-center py-12 px-6 text-center ${className}`,
    ...props
  }, [
    h('div', { class: 'text-5xl mb-4 leading-none text-gray-400' }, icon),
    h('h3', { class: 'text-lg font-semibold text-gray-900 mb-2' }, title),
    message && h('p', {
      class: 'text-sm text-gray-600 mb-6 max-w-md'
    }, message),
    action && h('div', { class: 'mt-4' }, action)
  ])
}

export default EmptyState
