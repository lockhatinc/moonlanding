import { h } from '@/ui/webjsx.js'

export function SearchInput({
  value = '',
  onSearch = null,
  placeholder = 'Search...',
  className = '',
  ...props
}) {
  const handleInput = (e) => {
    if (onSearch) onSearch(e.target.value)
  }

  return h('div', { class: `relative ${className}` }, [
    h('span', {
      class: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
    }, '🔍'),
    h('input', {
      type: 'search',
      value,
      placeholder,
      onInput: handleInput,
      class: 'w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      ...props
    })
  ])
}

export function FilterBar({
  children,
  onClear = null,
  className = '',
  ...props
}) {
  return h('div', {
    class: `flex flex-wrap gap-3 items-end p-3 bg-gray-50 border border-gray-300 rounded-lg mb-4 ${className}`,
    ...props
  }, [
    children,
    onClear && h('button', {
      type: 'button',
      onClick: onClear,
      class: 'text-xs text-blue-600 underline cursor-pointer ml-auto'
    }, 'Clear filters')
  ])
}

export function FilterField({
  label,
  children,
  className = '',
  ...props
}) {
  return h('div', {
    class: `flex flex-col gap-1 min-w-[150px] ${className}`,
    ...props
  }, [
    h('label', { class: 'text-xs font-medium text-gray-600' }, label),
    children
  ])
}

export default { SearchInput, FilterBar, FilterField }
