import { h } from '@/ui/webjsx.js'

export function DataGrid({
  columns = [],
  rows = [],
  sortColumn = null,
  sortDirection = 'asc',
  onSort = null,
  onRowClick = null,
  emptyMessage = 'No data available',
  className = '',
  ...props
}) {
  const sortIcon = (col) => {
    if (sortColumn !== col) return ''
    return sortDirection === 'asc' ? ' \u25B2' : ' \u25BC'
  }

  const headerCells = columns.map(col =>
    h('th', {
      class: `px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide ${col.sortable ? 'cursor-pointer hover:text-blue-600 select-none' : ''}`,
      style: col.width ? `width: ${col.width}` : '',
      'data-sort-key': col.sortable ? col.key : null,
      onclick: col.sortable && onSort ? `(${onSort})('${col.key}')` : null
    }, [col.label, col.sortable ? sortIcon(col.key) : ''])
  )

  const bodyRows = rows.length === 0
    ? [h('tr', {}, [
        h('td', {
          colSpan: columns.length,
          class: 'text-center py-12 text-sm text-gray-500'
        }, emptyMessage)
      ])]
    : rows.map((row, idx) =>
        h('tr', {
          class: `border-b border-gray-100 hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`,
          'data-row-index': idx,
          'data-row-id': row.id || idx
        }, columns.map(col =>
          h('td', {
            class: `px-4 py-3 text-sm text-gray-900 ${col.cellClass || ''}`
          }, col.render ? col.render(row[col.key], row) : (row[col.key] ?? ''))
        ))
      )

  return h('div', {
    class: `overflow-x-auto ${className}`,
    'data-component': 'data-grid',
    ...props
  }, [
    h('table', { class: 'w-full border-collapse' }, [
      h('thead', { class: 'bg-gray-50 border-b-2 border-gray-200' }, [
        h('tr', {}, headerCells)
      ]),
      h('tbody', {}, bodyRows)
    ])
  ])
}

export default DataGrid
