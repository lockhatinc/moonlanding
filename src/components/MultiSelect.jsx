import { h } from '@/ui/webjsx.js'

export function MultiSelect({
  options = [],
  selected = [],
  placeholder = 'Select items...',
  label = null,
  name = '',
  disabled = false,
  error = null,
  className = '',
  ...props
}) {
  const selectedSet = new Set(selected)

  const tags = selected.map(val => {
    const opt = options.find(o => (typeof o === 'object' ? o.value : o) === val)
    const lbl = opt ? (typeof opt === 'object' ? opt.label : opt) : val
    return h('span', {
      class: 'inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium',
      'data-value': val
    }, [
      lbl,
      h('button', {
        type: 'button',
        class: 'bg-transparent border-0 cursor-pointer text-blue-500 hover:text-blue-800 p-0 leading-none',
        'data-remove': val,
        'aria-label': `Remove ${lbl}`
      }, '\u00D7')
    ])
  })

  const optionElements = options.map(opt => {
    const val = typeof opt === 'object' ? opt.value : opt
    const lbl = typeof opt === 'object' ? opt.label : opt
    const isSelected = selectedSet.has(val)
    return h('label', {
      class: `flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`,
      'data-option': val
    }, [
      h('input', {
        type: 'checkbox',
        name: `${name}[]`,
        value: val,
        checked: isSelected,
        class: 'rounded border-gray-300 text-blue-600 focus:ring-blue-500'
      }),
      h('span', { class: 'text-gray-900' }, lbl)
    ])
  })

  return h('div', {
    class: `${className}`,
    'data-component': 'multi-select',
    ...props
  }, [
    label ? h('label', {
      class: 'block text-sm font-medium text-gray-700 mb-1'
    }, label) : null,
    h('div', {
      class: `border rounded-lg bg-white ${error ? 'border-red-400' : 'border-gray-300'} ${disabled ? 'opacity-50 pointer-events-none' : ''}`,
      tabIndex: 0
    }, [
      tags.length > 0
        ? h('div', { class: 'flex flex-wrap gap-1 p-2 border-b border-gray-100' }, tags)
        : h('div', { class: 'px-3 py-2 text-sm text-gray-400 border-b border-gray-100' }, placeholder),
      h('div', {
        class: 'max-h-48 overflow-y-auto',
        'data-options-list': true
      }, optionElements)
    ]),
    error ? h('p', { class: 'mt-1 text-xs text-red-600' }, error) : null
  ])
}

export default MultiSelect
