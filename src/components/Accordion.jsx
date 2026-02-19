import { h } from '@/ui/webjsx.js'

export function Accordion({
  children,
  className = '',
  ...props
}) {
  return h('div', {
    class: `border border-gray-300 rounded-lg overflow-hidden ${className}`,
    ...props
  }, children)
}

export function AccordionItem({
  title,
  children,
  isOpen = false,
  onToggle = null,
  className = '',
  ...props
}) {
  const handleToggle = () => {
    if (onToggle) onToggle()
  }

  return h('div', {
    class: `border-b border-gray-100 last:border-b-0 ${className}`,
    ...props
  }, [
    h('button', {
      type: 'button',
      class: 'flex items-center justify-between w-full px-4 py-3 font-medium text-left bg-transparent cursor-pointer select-none hover:bg-gray-50 transition-colors duration-150',
      onClick: handleToggle,
      'aria-expanded': isOpen ? 'true' : 'false'
    }, [
      h('span', {}, title),
      h('span', {
        class: `transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`
      }, '▼')
    ]),
    isOpen && h('div', {
      class: 'px-4 py-3 border-t border-gray-100'
    }, children)
  ])
}

export default Accordion
