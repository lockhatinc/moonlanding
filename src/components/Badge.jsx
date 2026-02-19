import { h } from '@/ui/webjsx.js'

export function Badge({
  children,
  variant = 'gray',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-700'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm'
  }

  const classes = `inline-flex items-center font-medium rounded-full whitespace-nowrap leading-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return h('span', { class: classes, ...props }, [
    dot && h('span', {
      class: 'w-2 h-2 rounded-full bg-current mr-1.5'
    }),
    children
  ])
}

export function StatusBadge({
  status,
  className = '',
  ...props
}) {
  const statusConfig = {
    pending: { variant: 'warning', label: 'Pending' },
    active: { variant: 'primary', label: 'Active' },
    completed: { variant: 'success', label: 'Completed' },
    archived: { variant: 'gray', label: 'Archived' },
    draft: { variant: 'gray', label: 'Draft' },
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'danger', label: 'Rejected' },
    overdue: { variant: 'danger', label: 'Overdue' }
  }

  const config = statusConfig[status] || { variant: 'gray', label: status }

  return h(Badge, {
    variant: config.variant,
    dot: true,
    className,
    ...props
  }, config.label)
}

export default Badge
