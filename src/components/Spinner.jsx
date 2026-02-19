import { h } from '@/ui/webjsx.js'

export function Spinner({
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  }

  const colorClasses = {
    primary: 'border-gray-200 border-t-blue-600',
    white: 'border-gray-300 border-t-white',
    success: 'border-gray-200 border-t-green-600',
    danger: 'border-gray-200 border-t-red-600'
  }

  return h('div', {
    class: `inline-block rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`,
    role: 'status',
    'aria-label': 'Loading',
    ...props
  }, [
    h('span', { class: 'sr-only' }, 'Loading...')
  ])
}

export function SpinnerOverlay({
  message = 'Loading...',
  className = '',
  ...props
}) {
  return h('div', {
    class: `fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white bg-opacity-90 ${className}`,
    ...props
  }, [
    h(Spinner, { size: 'lg' }),
    message && h('p', { class: 'mt-4 text-sm text-gray-600' }, message)
  ])
}

export default Spinner
