import { h } from '@/ui/webjsx.js'

export function SuccessState({
  icon = '✓',
  title = 'Success!',
  message = null,
  action = null,
  className = '',
  ...props
}) {
  return h('div', {
    class: `flex flex-col items-center justify-center py-12 px-6 text-center ${className}`,
    role: 'status',
    ...props
  }, [
    h('div', {
      class: 'flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl font-bold mb-4'
    }, icon),
    h('h3', { class: 'text-lg font-semibold text-gray-900 mb-2' }, title),
    message && h('p', {
      class: 'text-sm text-gray-600 mb-6 max-w-md'
    }, message),
    action && h('div', { class: 'mt-4' }, action)
  ])
}

export default SuccessState
