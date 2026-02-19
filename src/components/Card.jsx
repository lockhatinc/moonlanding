import { h } from '@/ui/webjsx.js'

export function Card({
  children,
  variant = 'default',
  hover = false,
  className = '',
  ...props
}) {
  const variantClasses = {
    default: 'bg-white rounded-lg shadow border border-gray-100',
    flat: 'bg-white rounded-lg border border-gray-300',
    bordered: 'bg-white rounded-lg border-2 border-gray-300'
  }

  const hoverClass = hover ? 'hover:shadow-md hover:-translate-y-px transition-all duration-150' : ''

  const classes = [
    'p-6',
    variantClasses[variant],
    hoverClass,
    className
  ].filter(Boolean).join(' ')

  return h('div', { class: classes, ...props }, children)
}

export function CardHeader({ children, className = '', ...props }) {
  return h('div', {
    class: `pb-4 mb-4 border-b border-gray-100 ${className}`,
    ...props
  }, children)
}

export function CardTitle({ children, className = '', ...props }) {
  return h('h3', {
    class: `text-lg font-semibold text-gray-900 ${className}`,
    ...props
  }, children)
}

export function CardBody({ children, className = '', ...props }) {
  return h('div', { class: className, ...props }, children)
}

export function CardFooter({ children, className = '', ...props }) {
  return h('div', {
    class: `pt-4 mt-4 border-t border-gray-100 ${className}`,
    ...props
  }, children)
}

export default Card
