import { h } from '@/ui/webjsx.js'

export function StageBar({
  stages = [],
  currentStage = null,
  className = '',
  ...props
}) {
  const currentIdx = stages.findIndex(s => {
    const key = typeof s === 'object' ? s.key || s.name : s
    return key === currentStage
  })

  const stageElements = stages.map((stage, idx) => {
    const label = typeof stage === 'object' ? stage.label || stage.name : stage
    const key = typeof stage === 'object' ? stage.key || stage.name : stage
    const isComplete = idx < currentIdx
    const isCurrent = idx === currentIdx
    const isPending = idx > currentIdx

    let dotClass = 'w-3 h-3 rounded-full flex-shrink-0 border-2 transition-colors'
    let labelClass = 'text-xs mt-1 text-center whitespace-nowrap transition-colors'
    let lineClass = 'flex-1 h-0.5 transition-colors'

    if (isComplete) {
      dotClass += ' bg-blue-600 border-blue-600'
      labelClass += ' text-blue-600 font-medium'
      lineClass += ' bg-blue-600'
    } else if (isCurrent) {
      dotClass += ' bg-white border-blue-600 ring-4 ring-blue-100'
      labelClass += ' text-blue-600 font-semibold'
      lineClass += ' bg-gray-200'
    } else {
      dotClass += ' bg-white border-gray-300'
      labelClass += ' text-gray-400'
      lineClass += ' bg-gray-200'
    }

    return [
      idx > 0 ? h('div', { class: lineClass }) : null,
      h('div', {
        class: 'flex flex-col items-center',
        'data-stage': key,
        'data-stage-state': isComplete ? 'complete' : isCurrent ? 'current' : 'pending'
      }, [
        h('div', { class: dotClass }),
        h('div', { class: labelClass }, label)
      ])
    ]
  }).flat().filter(Boolean)

  return h('div', {
    class: `flex items-start gap-0 ${className}`,
    'data-component': 'stage-bar',
    role: 'progressbar',
    'aria-valuenow': currentIdx + 1,
    'aria-valuemin': 1,
    'aria-valuemax': stages.length,
    ...props
  }, stageElements)
}

export default StageBar
