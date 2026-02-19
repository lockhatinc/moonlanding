import { h } from '@/ui/webjsx.js'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  onClick = null,
  className = '',
  ariaLabel = null,
  ...props
}) {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:translate-y-px',
    secondary: 'bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200',
    outline: 'bg-transparent text-blue-600 border border-current hover:bg-blue-50',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    error: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700'
  }

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs leading-4',
    sm: 'px-3 py-1.5 text-sm leading-5',
    md: 'px-4 py-2 text-base leading-6',
    lg: 'px-6 py-3 text-lg leading-7'
  }

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'

  const stateClasses = disabled || loading
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer'

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    stateClasses,
    className
  ].filter(Boolean).join(' ')

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault()
      return
    }
    if (onClick) onClick(e)
  }

  return h('button', {
    type,
    class: classes,
    disabled: disabled || loading,
    onClick: handleClick,
    'aria-label': ariaLabel,
    'aria-busy': loading ? 'true' : null,
    'aria-disabled': disabled ? 'true' : null,
    role: 'button',
    tabIndex: disabled ? -1 : 0,
    ...props
  }, loading ? [children, ' ...'] : children)
}

export default Button
