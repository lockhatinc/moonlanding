import { h } from '@/ui/webjsx.js'

export function ProgressLinear({
  value = 0,
  max = 100,
  color = 'primary',
  size = 'md',
  label = null,
  showPercentage = false,
  className = '',
  ...props
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const colorClasses = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  }

  const sizeClasses = {
    thin: 'h-1',
    md: 'h-2',
    thick: 'h-4'
  }

  return h('div', { class: className, ...props }, [
    label && h('div', { class: 'flex items-center justify-between mb-1' }, [
      h('span', { class: 'text-xs text-gray-600' }, label),
      showPercentage && h('span', {
        class: 'text-xs font-semibold text-gray-900 ml-2'
      }, `${Math.round(percentage)}%`)
    ]),
    h('div', {
      class: `w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`
    }, [
      h('div', {
        class: `${colorClasses[color]} rounded-full transition-all duration-300 ${sizeClasses[size]}`,
        style: `width: ${percentage}%`,
        role: 'progressbar',
        'aria-valuenow': value,
        'aria-valuemin': '0',
        'aria-valuemax': max
      })
    ])
  ])
}

export function ProgressCircular({
  value = 0,
  max = 100,
  size = 80,
  strokeWidth = 8,
  color = 'primary',
  label = null,
  showPercentage = true,
  className = '',
  ...props
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const colorClasses = {
    primary: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444'
  }

  return h('div', {
    class: `relative inline-flex ${className}`,
    style: `width: ${size}px; height: ${size}px`,
    ...props
  }, [
    h('svg', {
      class: 'transform -rotate-90',
      width: size,
      height: size
    }, [
      h('circle', {
        cx: size / 2,
        cy: size / 2,
        r: radius,
        stroke: '#e5e7eb',
        'stroke-width': strokeWidth,
        fill: 'none'
      }),
      h('circle', {
        cx: size / 2,
        cy: size / 2,
        r: radius,
        stroke: colorClasses[color],
        'stroke-width': strokeWidth,
        fill: 'none',
        'stroke-linecap': 'round',
        'stroke-dasharray': circumference,
        'stroke-dashoffset': offset,
        style: 'transition: stroke-dashoffset 0.3s ease',
        role: 'progressbar',
        'aria-valuenow': value,
        'aria-valuemin': '0',
        'aria-valuemax': max
      })
    ]),
    h('div', {
      class: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center'
    }, [
      showPercentage && h('div', {
        class: 'text-xl font-bold text-gray-900'
      }, `${Math.round(percentage)}%`),
      label && h('div', { class: 'text-xs text-gray-600' }, label)
    ])
  ])
}

export default { ProgressLinear, ProgressCircular }
