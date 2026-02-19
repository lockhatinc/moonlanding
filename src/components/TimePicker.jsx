import { h } from '@/ui/webjsx.js'

export function TimePicker({
  value = '',
  onChange = null,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const handleChange = (e) => {
    if (onChange) onChange(e.target.value)
  }

  return h('input', {
    type: 'time',
    value,
    onChange: handleChange,
    required,
    disabled,
    class: `px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''} ${className}`,
    ...props
  })
}

export default TimePicker
