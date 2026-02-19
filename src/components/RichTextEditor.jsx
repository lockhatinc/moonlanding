import { h } from '@/ui/webjsx.js'

export function RichTextEditor({
  value = '',
  onChange = null,
  placeholder = 'Enter text...',
  minHeight = '200px',
  className = '',
  ...props
}) {
  const handleInput = (e) => {
    if (onChange) onChange(e.target.innerHTML)
  }

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value)
  }

  return h('div', { class: `border border-gray-300 rounded-lg overflow-hidden ${className}`, ...props }, [
    h('div', {
      class: 'flex gap-1 p-2 bg-gray-50 border-b border-gray-200'
    }, [
      h('button', {
        type: 'button',
        onClick: () => execCommand('bold'),
        class: 'px-3 py-1 text-sm font-bold bg-white border border-gray-300 rounded hover:bg-gray-100',
        title: 'Bold'
      }, 'B'),
      h('button', {
        type: 'button',
        onClick: () => execCommand('italic'),
        class: 'px-3 py-1 text-sm italic bg-white border border-gray-300 rounded hover:bg-gray-100',
        title: 'Italic'
      }, 'I'),
      h('button', {
        type: 'button',
        onClick: () => execCommand('underline'),
        class: 'px-3 py-1 text-sm underline bg-white border border-gray-300 rounded hover:bg-gray-100',
        title: 'Underline'
      }, 'U'),
      h('div', { class: 'w-px bg-gray-300 mx-1' }),
      h('button', {
        type: 'button',
        onClick: () => execCommand('insertUnorderedList'),
        class: 'px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100',
        title: 'Bullet list'
      }, '•'),
      h('button', {
        type: 'button',
        onClick: () => execCommand('insertOrderedList'),
        class: 'px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100',
        title: 'Numbered list'
      }, '1.'),
      h('div', { class: 'w-px bg-gray-300 mx-1' }),
      h('button', {
        type: 'button',
        onClick: () => {
          const url = prompt('Enter URL:')
          if (url) execCommand('createLink', url)
        },
        class: 'px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100',
        title: 'Insert link'
      }, '🔗')
    ]),
    h('div', {
      contentEditable: true,
      onInput: handleInput,
      class: 'p-3 focus:outline-none',
      style: `min-height: ${minHeight}`,
      'data-placeholder': placeholder,
      innerHTML: value
    })
  ])
}

export default RichTextEditor
