import { h } from '@/ui/webjsx.js'

export function Breadcrumb({
  items = [],
  separator = '/',
  className = '',
  ...props
}) {
  if (!items || items.length === 0) return null

  return h('nav', {
    class: `flex items-center gap-2 text-sm text-gray-600 py-3 ${className}`,
    'aria-label': 'Breadcrumb',
    ...props
  }, items.map((item, index) => {
    const isLast = index === items.length - 1

    return h('div', {
      key: index,
      class: 'flex items-center gap-2'
    }, [
      isLast
        ? h('span', {
          class: 'text-gray-900 font-medium',
          'aria-current': 'page'
        }, item.label)
        : h('a', {
          href: item.href,
          class: 'text-blue-600 hover:underline'
        }, item.label),
      !isLast && h('span', {
        class: 'mx-1 text-gray-400',
        'aria-hidden': 'true'
      }, separator)
    ])
  }))
}

export default Breadcrumb
