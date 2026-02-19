import { h } from '@/ui/webjsx.js'

export function DatePicker({
  value = '',
  onChange = null,
  min = null,
  max = null,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const handleChange = (e) => {
    if (onChange) onChange(e.target.value)
  }

  return h('input', {
    type: 'date',
    value,
    onChange: handleChange,
    min,
    max,
    required,
    disabled,
    class: `px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''} ${className}`,
    ...props
  })
}

export function DateRangePicker({
  startValue = '',
  endValue = '',
  onStartChange = null,
  onEndChange = null,
  className = '',
  ...props
}) {
  return h('div', {
    class: `flex items-center gap-2 ${className}`,
    ...props
  }, [
    h(DatePicker, {
      value: startValue,
      onChange: onStartChange,
      max: endValue || null
    }),
    h('span', { class: 'text-gray-500' }, '—'),
    h(DatePicker, {
      value: endValue,
      onChange: onEndChange,
      min: startValue || null
    })
  ])
}

export default DatePicker
