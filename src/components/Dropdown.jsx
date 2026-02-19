import { h } from '@/ui/webjsx.js'

export function Dropdown({
  options = [],
  value = '',
  placeholder = 'Select...',
  label = null,
  disabled = false,
  error = null,
  name = '',
  className = '',
  ...props
}) {
  const optionElements = [
    placeholder ? h('option', { value: '', disabled: true, selected: !value }, placeholder) : null,
    ...options.map(opt => {
      const val = typeof opt === 'object' ? opt.value : opt
      const lbl = typeof opt === 'object' ? opt.label : opt
      const dis = typeof opt === 'object' ? opt.disabled : false
      return h('option', { value: val, selected: value === val, disabled: dis }, lbl)
    })
  ]

  return h('div', { class: `${className}`, 'data-component': 'dropdown' }, [
    label ? h('label', {
      class: 'block text-sm font-medium text-gray-700 mb-1',
      for: name
    }, label) : null,
    h('select', {
      name,
      id: name,
      class: `w-full px-3 py-2 text-sm bg-white border rounded-lg appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-400' : 'border-gray-300 hover:border-gray-400'} ${disabled ? 'opacity-50 pointer-events-none bg-gray-50' : ''}`,
      disabled,
      ...props
    }, optionElements),
    error ? h('p', { class: 'mt-1 text-xs text-red-600' }, error) : null
  ])
}

export default Dropdown
