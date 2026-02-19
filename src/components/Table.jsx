import { h } from '@/ui/webjsx.js'

export function Table({
  children,
  className = '',
  ...props
}) {
  return h('div', { class: 'overflow-x-auto' }, [
    h('table', {
      class: `w-full border-collapse ${className}`,
      ...props
    }, children)
  ])
}

export function TableHead({ children, className = '', ...props }) {
  return h('thead', {
    class: `bg-gray-50 border-b-2 border-gray-300 ${className}`,
    ...props
  }, children)
}

export function TableBody({ children, className = '', ...props }) {
  return h('tbody', { class: className, ...props }, children)
}

export function TableRow({
  children,
  hover = true,
  className = '',
  ...props
}) {
  const hoverClass = hover ? 'hover:bg-gray-50 transition-colors duration-150' : ''

  return h('tr', {
    class: `border-b border-gray-100 ${hoverClass} ${className}`,
    ...props
  }, children)
}

export function TableHeader({
  children,
  sortable = false,
  sorted = null,
  onSort = null,
  className = '',
  ...props
}) {
  const baseClasses = 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide'
  const sortableClass = sortable ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''

  const handleClick = () => {
    if (sortable && onSort) onSort()
  }

  const sortIndicator = sorted === 'asc' ? ' ▲' : sorted === 'desc' ? ' ▼' : ''

  return h('th', {
    class: `${baseClasses} ${sortableClass} ${className}`,
    onClick: sortable ? handleClick : null,
    ...props
  }, [children, sortIndicator])
}

export function TableCell({ children, className = '', ...props }) {
  return h('td', {
    class: `px-4 py-3 text-sm text-gray-900 ${className}`,
    ...props
  }, children)
}

export function TableEmpty({
  message = 'No data available',
  colSpan = 1,
  className = '',
  ...props
}) {
  return h('tr', {}, [
    h('td', {
      colSpan,
      class: `text-center py-12 text-sm text-gray-600 ${className}`,
      ...props
    }, message)
  ])
}

export default Table
