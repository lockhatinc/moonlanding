import { h } from '@/ui/webjsx.js'

export function DragDropZone({
  onDrop = null,
  onDragOver = null,
  children,
  className = '',
  ...props
}) {
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDragOver) onDragOver(e)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer?.files || [])
    if (onDrop) onDrop(files, e)
  }

  return h('div', {
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    class: `border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 ${className}`,
    ...props
  }, children)
}

export function DraggableItem({
  id,
  onDragStart = null,
  onDragEnd = null,
  children,
  className = '',
  ...props
}) {
  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    if (onDragStart) onDragStart(id, e)
  }

  const handleDragEnd = (e) => {
    if (onDragEnd) onDragEnd(id, e)
  }

  return h('div', {
    draggable: true,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    class: `cursor-move ${className}`,
    ...props
  }, children)
}

export default { DragDropZone, DraggableItem }
