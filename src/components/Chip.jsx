import { h } from '@/ui/webjsx.js'

export function Chip({
  children,
  variant = 'default',
  size = 'md',
  removable = false,
  onRemove = null,
  icon = null,
  className = '',
  ...props
}) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    primary: 'bg-blue-100 text-blue-700 border-blue-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    outline: 'bg-transparent text-gray-700 border-gray-300'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2'
  }

  return h('span', {
    class: `inline-flex items-center font-medium rounded-full border ${variantClasses[variant]} ${sizeClasses[size]} ${className}`,
    'data-component': 'chip',
    ...props
  }, [
    icon ? h('span', { class: 'flex-shrink-0' }, icon) : null,
    h('span', {}, children),
    removable ? h('button', {
      type: 'button',
      class: 'flex-shrink-0 bg-transparent border-0 cursor-pointer text-current opacity-60 hover:opacity-100 transition-opacity leading-none p-0 ml-0.5',
      'aria-label': 'Remove',
      onclick: onRemove ? `(${onRemove})()` : null
    }, '\u00D7') : null
  ])
}

export default Chip
