import { h } from '@/ui/webjsx.js'

export function Modal({
  isOpen = false,
  onClose = null,
  size = 'md',
  children,
  className = '',
  ...props
}) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl'
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && onClose) {
      onClose()
    }
  }

  return h('div', {
    class: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50',
    onClick: handleOverlayClick,
    onKeyDown: handleKeyDown,
    role: 'dialog',
    'aria-modal': 'true',
    tabIndex: -1,
    ...props
  }, [
    h('div', {
      class: `bg-white rounded-lg shadow-2xl w-full ${sizeClasses[size]} max-h-[85vh] overflow-y-auto ${className}`,
      onClick: (e) => e.stopPropagation()
    }, children)
  ])
}

export function ModalHeader({
  children,
  onClose = null,
  className = '',
  ...props
}) {
  return h('div', {
    class: `flex items-center justify-between p-6 border-b border-gray-100 ${className}`,
    ...props
  }, [
    children,
    onClose && h('button', {
      class: 'w-8 h-8 flex items-center justify-center border-0 bg-transparent text-gray-400 cursor-pointer rounded-md hover:bg-gray-100 hover:text-gray-600 transition-all duration-150',
      onClick: onClose,
      'aria-label': 'Close modal',
      type: 'button'
    }, '×')
  ])
}

export function ModalTitle({ children, className = '', ...props }) {
  return h('h2', {
    class: `text-xl font-semibold text-gray-900 ${className}`,
    ...props
  }, children)
}

export function ModalBody({ children, className = '', ...props }) {
  return h('div', {
    class: `p-6 ${className}`,
    ...props
  }, children)
}

export function ModalFooter({ children, className = '', ...props }) {
  return h('div', {
    class: `flex gap-2 justify-end p-4 border-t border-gray-100 ${className}`,
    ...props
  }, children)
}

export default Modal
