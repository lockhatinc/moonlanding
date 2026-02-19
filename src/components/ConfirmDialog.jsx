import { h } from '@/ui/webjsx.js'

export function ConfirmDialog({
  isOpen = false,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm = null,
  onCancel = null,
  className = '',
  ...props
}) {
  if (!isOpen) return null

  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white'
  }

  const iconMap = {
    danger: h('div', { class: 'w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4' },
      h('span', { class: 'text-red-600 text-2xl' }, '\u26A0')
    ),
    warning: h('div', { class: 'w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4' },
      h('span', { class: 'text-yellow-600 text-2xl' }, '\u26A0')
    ),
    primary: null
  }

  return h('div', {
    class: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50',
    'data-component': 'confirm-dialog',
    role: 'alertdialog',
    'aria-modal': 'true',
    ...props
  }, [
    h('div', {
      class: `bg-white rounded-lg shadow-2xl w-full max-w-md p-6 text-center ${className}`
    }, [
      iconMap[variant] || null,
      h('h3', { class: 'text-lg font-semibold text-gray-900 mb-2' }, title),
      h('p', { class: 'text-sm text-gray-600 mb-6' }, message),
      h('div', { class: 'flex gap-3 justify-center' }, [
        h('button', {
          type: 'button',
          class: 'px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors',
          'data-action': 'cancel'
        }, cancelLabel),
        h('button', {
          type: 'button',
          class: `px-4 py-2 text-sm font-medium border-0 rounded-lg cursor-pointer transition-colors ${variantClasses[variant]}`,
          'data-action': 'confirm'
        }, confirmLabel)
      ])
    ])
  ])
}

export default ConfirmDialog
