import { h } from '@/ui/webjsx.js'

export function SortSelect({
  value = '',
  options = [],
  onChange = null,
  label = 'Sort by',
  className = '',
  ...props
}) {
  const handleChange = (e) => {
    if (onChange) onChange(e.target.value)
  }

  return h('div', {
    class: `inline-flex items-center gap-2 ${className}`,
    ...props
  }, [
    h('label', { class: 'text-sm font-medium text-gray-700' }, label),
    h('select', {
      value,
      onChange: handleChange,
      class: 'px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
    }, options.map(opt =>
      h('option', {
        value: typeof opt === 'object' ? opt.value : opt
      }, typeof opt === 'object' ? opt.label : opt)
    ))
  ])
}

export function SortButton({
  field,
  currentField = null,
  direction = 'asc',
  onSort = null,
  children,
  className = '',
  ...props
}) {
  const isActive = field === currentField
  const indicator = isActive ? (direction === 'asc' ? ' ▲' : ' ▼') : ''

  const handleClick = () => {
    if (onSort) {
      const newDirection = isActive && direction === 'asc' ? 'desc' : 'asc'
      onSort(field, newDirection)
    }
  }

  return h('button', {
    type: 'button',
    onClick: handleClick,
    class: `text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'} ${className}`,
    ...props
  }, children + indicator)
}

export default { SortSelect, SortButton }
