import { h } from '@/ui/webjsx.js'

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange = null,
  className = '',
  ...props
}) {
  const pages = []
  const showEllipsis = totalPages > 7

  if (showEllipsis) {
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    }
  } else {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  }

  const handlePageClick = (page) => {
    if (typeof page === 'number' && page !== currentPage && onPageChange) {
      onPageChange(page)
    }
  }

  return h('div', {
    class: `flex items-center justify-center gap-1 ${className}`,
    role: 'navigation',
    'aria-label': 'Pagination',
    ...props
  }, [
    h('button', {
      type: 'button',
      onClick: () => handlePageClick(currentPage - 1),
      disabled: currentPage === 1,
      class: 'px-3 py-2 text-sm font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed',
      'aria-label': 'Previous page'
    }, '←'),
    ...pages.map((page, index) =>
      page === '...'
        ? h('span', { key: `ellipsis-${index}`, class: 'px-2 text-gray-500' }, '...')
        : h('button', {
          key: page,
          type: 'button',
          onClick: () => handlePageClick(page),
          class: page === currentPage
            ? 'px-3 py-2 text-sm font-medium border border-blue-600 rounded-md bg-blue-600 text-white'
            : 'px-3 py-2 text-sm font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50',
          'aria-current': page === currentPage ? 'page' : null
        }, page)
    ),
    h('button', {
      type: 'button',
      onClick: () => handlePageClick(currentPage + 1),
      disabled: currentPage === totalPages,
      class: 'px-3 py-2 text-sm font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed',
      'aria-label': 'Next page'
    }, '→')
  ])
}

export default Pagination
