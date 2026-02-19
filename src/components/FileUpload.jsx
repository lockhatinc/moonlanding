import { h } from '@/ui/webjsx.js'

export function FileUpload({
  accept = '*',
  multiple = false,
  onChange = null,
  maxSize = null,
  className = '',
  ...props
}) {
  const handleChange = (e) => {
    const files = Array.from(e.target.files || [])

    if (maxSize) {
      const oversized = files.filter(f => f.size > maxSize)
      if (oversized.length > 0) {
        alert(`Some files exceed the maximum size of ${maxSize / 1024 / 1024}MB`)
        return
      }
    }

    if (onChange) onChange(files)
  }

  return h('div', { class: className }, [
    h('input', {
      type: 'file',
      accept,
      multiple,
      onChange: handleChange,
      class: 'hidden',
      id: 'file-upload-input',
      ...props
    }),
    h('label', {
      for: 'file-upload-input',
      class: 'inline-flex items-center px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors'
    }, [
      h('span', {}, '📎 Choose files'),
      multiple && h('span', { class: 'ml-2 text-xs text-gray-500' }, '(multiple)')
    ])
  ])
}

export function FileUploadDrop({
  accept = '*',
  multiple = false,
  onChange = null,
  maxSize = null,
  className = '',
  ...props
}) {
  const handleDrop = (files) => {
    if (maxSize) {
      const oversized = files.filter(f => f.size > maxSize)
      if (oversized.length > 0) {
        alert(`Some files exceed the maximum size of ${maxSize / 1024 / 1024}MB`)
        return
      }
    }

    if (!multiple && files.length > 1) {
      files = [files[0]]
    }

    if (onChange) onChange(files)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    handleDrop(files)
  }

  return h('div', { class: className, ...props }, [
    h('div', {
      class: 'border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-200',
      onDragOver: (e) => { e.preventDefault() },
      onDrop: (e) => {
        e.preventDefault()
        const files = Array.from(e.dataTransfer?.files || [])
        handleDrop(files)
      }
    }, [
      h('div', { class: 'text-4xl mb-2' }, '📁'),
      h('p', { class: 'text-sm text-gray-600 mb-2' }, 'Drag and drop files here'),
      h('p', { class: 'text-xs text-gray-500 mb-4' }, 'or'),
      h('input', {
        type: 'file',
        accept,
        multiple,
        onChange: handleFileSelect,
        class: 'hidden',
        id: 'file-upload-drop-input'
      }),
      h('label', {
        for: 'file-upload-drop-input',
        class: 'inline-block px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700'
      }, 'Browse files')
    ])
  ])
}

export default { FileUpload, FileUploadDrop }
