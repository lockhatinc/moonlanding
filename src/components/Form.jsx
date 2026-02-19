import { h } from '@/ui/webjsx.js'

export function FormField({ children, className = '', ...props }) {
  return h('div', { class: `mb-4 ${className}`, ...props }, children)
}

export function FormLabel({
  children,
  required = false,
  htmlFor = null,
  className = '',
  ...props
}) {
  return h('label', {
    class: `block text-sm font-medium text-gray-900 mb-1 ${className}`,
    for: htmlFor,
    ...props
  }, [
    children,
    required && h('span', { class: 'text-red-600 ml-0.5' }, '*')
  ])
}

export function FormInput({
  type = 'text',
  error = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses = 'w-full px-3 py-2 text-base leading-6 border rounded-md bg-white text-gray-900 transition-all duration-200'
  const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500'
  const errorClasses = error ? 'border-red-600 ring-2 ring-red-100' : 'border-gray-300'
  const disabledClasses = disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''

  const classes = [
    baseClasses,
    focusClasses,
    errorClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ')

  return h('input', { type, class: classes, disabled, ...props })
}

export function FormTextarea({
  error = false,
  disabled = false,
  rows = 4,
  className = '',
  ...props
}) {
  const baseClasses = 'w-full px-3 py-2 text-base leading-6 border rounded-md bg-white text-gray-900 transition-all duration-200 resize-vertical'
  const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500'
  const errorClasses = error ? 'border-red-600 ring-2 ring-red-100' : 'border-gray-300'
  const disabledClasses = disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''

  const classes = [
    baseClasses,
    focusClasses,
    errorClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ')

  return h('textarea', { class: classes, disabled, rows, ...props })
}

export function FormSelect({
  options = [],
  error = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses = 'w-full px-3 py-2 text-base leading-6 border rounded-md bg-white text-gray-900 transition-all duration-200 pr-10'
  const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500'
  const errorClasses = error ? 'border-red-600 ring-2 ring-red-100' : 'border-gray-300'
  const disabledClasses = disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''

  const classes = [
    baseClasses,
    focusClasses,
    errorClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ')

  return h('select', { class: classes, disabled, ...props },
    options.map(opt =>
      h('option', {
        value: typeof opt === 'object' ? opt.value : opt
      }, typeof opt === 'object' ? opt.label : opt)
    )
  )
}

export function FormCheckbox({
  label = null,
  className = '',
  ...props
}) {
  const checkboxClasses = 'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500'

  if (label) {
    return h('label', { class: 'flex items-center gap-2 cursor-pointer' }, [
      h('input', { type: 'checkbox', class: checkboxClasses, ...props }),
      h('span', { class: 'text-sm text-gray-900' }, label)
    ])
  }

  return h('input', { type: 'checkbox', class: checkboxClasses, ...props })
}

export function FormRadio({
  label = null,
  className = '',
  ...props
}) {
  const radioClasses = 'w-4 h-4 rounded-full border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500'

  if (label) {
    return h('label', { class: 'flex items-center gap-2 cursor-pointer' }, [
      h('input', { type: 'radio', class: radioClasses, ...props }),
      h('span', { class: 'text-sm text-gray-900' }, label)
    ])
  }

  return h('input', { type: 'radio', class: radioClasses, ...props })
}

export function FormHelp({ children, className = '', ...props }) {
  return h('p', {
    class: `text-xs text-gray-600 mt-1 ${className}`,
    ...props
  }, children)
}

export function FormError({ children, className = '', ...props }) {
  if (!children) return null

  return h('p', {
    class: `text-xs text-red-600 mt-1 ${className}`,
    role: 'alert',
    ...props
  }, children)
}

export default {
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormRadio,
  FormHelp,
  FormError
}
