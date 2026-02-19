import { h } from '@/ui/webjsx.js'

export function Tooltip({
  children,
  text = '',
  position = 'top',
  className = '',
  ...props
}) {
  if (!text) return children

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent border-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent border-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent border-4'
  }

  return h('div', {
    class: `relative inline-flex group ${className}`,
    'data-component': 'tooltip',
    ...props
  }, [
    children,
    h('div', {
      class: `absolute ${positionClasses[position]} hidden group-hover:block z-50 pointer-events-none`
    }, [
      h('div', {
        class: 'relative bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap'
      }, [
        text,
        h('div', { class: `absolute ${arrowClasses[position]}` })
      ])
    ])
  ])
}

export default Tooltip
