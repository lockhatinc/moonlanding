import { h } from '@/ui/webjsx.js'

export function Toast({
  message,
  variant = 'info',
  onClose = null,
  duration = 3000,
  className = '',
  ...props
}) {
  const variantClasses = {
    success: 'bg-green-50 text-green-800 border-l-4 border-green-600',
    error: 'bg-red-50 text-red-800 border-l-4 border-red-600',
    warning: 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-600',
    info: 'bg-blue-50 text-blue-800 border-l-4 border-blue-600'
  }

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  return h('div', {
    class: `flex items-start gap-3 p-3 rounded-md shadow-lg min-w-[280px] max-w-[320px] ${variantClasses[variant]} ${className}`,
    role: 'alert',
    'aria-live': 'polite',
    ...props
  }, [
    h('span', { class: 'flex-shrink-0 w-5 h-5 text-current' }, icons[variant]),
    h('div', { class: 'flex-1 text-sm leading-5' }, message),
    onClose && h('button', {
      class: 'flex-shrink-0 w-5 h-5 border-0 bg-transparent cursor-pointer opacity-60 hover:opacity-100 transition-opacity duration-150',
      onClick: onClose,
      'aria-label': 'Close notification',
      type: 'button'
    }, '×')
  ])
}

export function ToastContainer({ toasts = [], onRemove = null, className = '' }) {
  return h('div', {
    class: `fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-[320px] ${className}`
  }, toasts.map((toast, index) =>
    h(Toast, {
      key: toast.id || index,
      ...toast,
      onClose: () => onRemove && onRemove(toast.id || index)
    })
  ))
}

export default Toast
