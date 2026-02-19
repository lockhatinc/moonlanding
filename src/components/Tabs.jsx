import { h } from '@/ui/webjsx.js'

export function Tabs({
  children,
  className = '',
  ...props
}) {
  return h('div', {
    class: `flex gap-2 border-b-2 border-gray-100 overflow-x-auto ${className}`,
    role: 'tablist',
    ...props
  }, children)
}

export function Tab({
  children,
  active = false,
  badge = null,
  onClick = null,
  className = '',
  ...props
}) {
  const activeClass = active
    ? 'text-blue-600 border-blue-600'
    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'

  return h('button', {
    type: 'button',
    class: `px-4 py-3 text-sm font-medium bg-transparent border-b-2 cursor-pointer transition-all duration-150 whitespace-nowrap ${activeClass} ${className}`,
    onClick,
    role: 'tab',
    'aria-selected': active ? 'true' : 'false',
    tabIndex: active ? 0 : -1,
    ...props
  }, [
    children,
    badge !== null && h('span', {
      class: 'ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs'
    }, badge)
  ])
}

export function TabPanel({
  children,
  active = false,
  className = '',
  ...props
}) {
  if (!active) return null

  return h('div', {
    class: `pt-4 ${className}`,
    role: 'tabpanel',
    ...props
  }, children)
}

export default Tabs
