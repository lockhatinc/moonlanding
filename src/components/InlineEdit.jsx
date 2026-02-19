import { h } from '@/ui/webjsx.js'

export function InlineEdit({
  value = '',
  onSave = null,
  onCancel = null,
  placeholder = 'Enter value...',
  multiline = false,
  className = '',
  ...props
}) {
  let tempValue = value

  const handleSave = () => {
    if (onSave) onSave(tempValue)
  }

  const handleCancel = () => {
    tempValue = value
    if (onCancel) onCancel()
  }

  const handleInput = (e) => {
    tempValue = e.target.value
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const inputClasses = 'w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'

  return h('div', { class: `inline-flex items-center gap-2 ${className}`, ...props }, [
    multiline
      ? h('textarea', {
        value,
        placeholder,
        onInput: handleInput,
        onKeyDown: handleKeyDown,
        class: inputClasses,
        rows: 3
      })
      : h('input', {
        type: 'text',
        value,
        placeholder,
        onInput: handleInput,
        onKeyDown: handleKeyDown,
        class: inputClasses
      }),
    h('button', {
      type: 'button',
      onClick: handleSave,
      class: 'px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700',
      'aria-label': 'Save'
    }, '✓'),
    h('button', {
      type: 'button',
      onClick: handleCancel,
      class: 'px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded hover:bg-gray-300',
      'aria-label': 'Cancel'
    }, '✕')
  ])
}

export default InlineEdit
