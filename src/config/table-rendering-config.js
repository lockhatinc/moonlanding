export const TABLE_DEFAULTS = {
  cellPadding: 12,
  headerHeight: 44,
  rowHeight: 48,
  borderRadius: 8,
  striped: true,
  highlightOnHover: true,
  skeleton: {
    rowCount: 8,
    animationInterval: 1000,
  },
};

export const TABLE_COLUMN_DEFAULTS = {
  minWidth: 80,
  maxWidth: 400,
  sortable: true,
  filterable: true,
};

export const TABLE_GROUP_DEFAULTS = {
  backgroundColor: 'var(--mantine-color-gray-1)',
  headerHeight: 44,
  toggleable: true,
  indentLevel: 16,
};

export const TABLE_PAGINATION_DEFAULTS = {
  selectWidth: 140,
  siblings: 1,
  boundaries: 1,
  gap: 'xs',
};

export const TABLE_SEARCH_DEFAULTS = {
  width: 288,
  debounceMs: 300,
  minCharacters: 1,
  maxLength: 255,
};

export const LIST_EMPTY_STATE = {
  padding: 32,
  textAlignment: 'center',
  textColor: 'var(--mantine-color-gray-6)',
  iconSize: 48,
};

export const LIST_LOADING_STATE = {
  opacity: 0.6,
  pointerEvents: 'none',
};
