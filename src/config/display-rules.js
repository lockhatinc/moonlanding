export const FIELD_DISPLAY_RULES = {
  text: {
    truncate: 50,
    transform: 'none',
    maxLines: 1,
  },
  textarea: {
    truncate: 100,
    transform: 'none',
    maxLines: 3,
    showExpand: true,
  },
  json: {
    truncate: 80,
    transform: 'stringify',
    prettyPrint: true,
    maxLines: 5,
  },
  date: {
    format: 'short',
    relative: false,
  },
  timestamp: {
    format: 'datetime',
    relative: true,
  },
  reference: {
    display: 'label',
    showId: false,
    truncate: 30,
  },
  email: {
    transform: 'email',
    truncate: 40,
  },
  number: {
    format: 'default',
    decimals: 0,
  },
  boolean: {
    displayTrue: 'Yes',
    displayFalse: 'No',
  },
};

export const LIST_DISPLAY_RULES = {
  maxColumnWidth: '300px',
  minColumnWidth: '100px',
  defaultColumnWidth: '150px',
  headerHeight: '40px',
  rowHeight: '40px',
  compactRowHeight: '32px',
};

export const DISPLAY_LIMITS = {
  TEXT_PREVIEW: 50,
  TEXTAREA_PREVIEW: 100,
  JSON_PREVIEW: 80,
  EMAIL_PREVIEW: 40,
};

export const TRUNCATION_INDICATORS = {
  text: '...',
  multiline: '... (see more)',
  json: '... (see more)',
};
