import { h } from '@/ui/webjsx.js'

const ICONS = {
  info: '\u2139\uFE0F',
  success: '\u2705',
  warning: '\u26A0\uFE0F',
  error: '\u274C'
}

export function Alert({
  children,
  variant = 'info',
  title = null,
  dismissible = false,
  onDismiss = null,
  icon = true,
  className = '',
  ...props
}) {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  }

  return h('div', {
    class: `flex items-start gap-3 p-4 border rounded-lg ${variantClasses[variant]} ${className}`,
    role: 'alert',
    'data-component': 'alert',
    'data-variant': variant,
    ...props
  }, [
    icon ? h('span', { class: 'flex-shrink-0 text-base' }, ICONS[variant] || ICONS.info) : null,
    h('div', { class: 'flex-1 min-w-0' }, [
      title ? h('div', { class: 'font-semibold text-sm mb-1' }, title) : null,
      h('div', { class: 'text-sm' }, children)
    ]),
    dismissible ? h('button', {
      type: 'button',
      class: 'flex-shrink-0 bg-transparent border-0 cursor-pointer text-current opacity-60 hover:opacity-100 transition-opacity text-lg leading-none p-0',
      'aria-label': 'Dismiss',
      onclick: onDismiss ? `(${onDismiss})()` : null
    }, '\u00D7') : null
  ])
}

export default Alert
