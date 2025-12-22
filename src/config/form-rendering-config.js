export const FORM_FIELD_DEFAULTS = {
  textarea: {
    defaultRows: 3,
    maxRows: 10,
    placeholder: 'Enter text...',
  },
  textInput: {
    placeholder: 'Enter text...',
    minWidth: '100%',
  },
  numberInput: {
    intStep: 1,
    decimalScale: 2,
    placeholder: '0',
  },
  jsonField: {
    defaultRows: 4,
    maxRows: 12,
    placeholder: '{}',
  },
  imageField: {
    listHeight: 40,
    listWidth: 40,
    detailHeight: 200,
    detailWidth: 'auto',
    placeholder: '—',
  },
  dateField: {
    padding: '8px 12px',
    borderRadius: 4,
    borderColor: 'var(--mantine-color-gray-4)',
  },
};

export const FORM_VALIDATION_DISPLAY = {
  errorSize: 'xs',
  errorSpacing: 4,
  errorColor: 'red',
  requiredIndicator: '*',
};

export const FORM_ACCESSIBILITY = {
  ariaDescribedByPattern: '{fieldKey}-error',
  ariaRequiredForRequired: true,
  ariaInvalidForErrors: true,
  ariaLabelFromField: true,
};

export const FORM_SKELETON = {
  skeletonRows: 8,
  skeletonColumns: 1,
  animationInterval: 1000,
};
