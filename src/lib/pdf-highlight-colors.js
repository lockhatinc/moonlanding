export const HIGHLIGHT_COLORS = {
  yellow:  { bg: 'rgba(255, 226, 100, 0.4)', border: '#f59e0b', label: 'Yellow' },
  red:     { bg: 'rgba(255, 100, 100, 0.35)', border: '#ef4444', label: 'Red' },
  green:   { bg: 'rgba(100, 220, 130, 0.35)', border: '#22c55e', label: 'Green' },
  blue:    { bg: 'rgba(100, 160, 255, 0.35)', border: '#3b82f6', label: 'Blue' },
  purple:  { bg: 'rgba(180, 130, 255, 0.35)', border: '#8b5cf6', label: 'Purple' },
  orange:  { bg: 'rgba(255, 180, 80, 0.35)',  border: '#f97316', label: 'Orange' },
  pink:    { bg: 'rgba(255, 130, 180, 0.35)', border: '#ec4899', label: 'Pink' },
  gray:    { bg: 'rgba(180, 180, 180, 0.35)', border: '#6b7280', label: 'Gray' },
};

export const DEFAULT_HIGHLIGHT_COLOR = 'yellow';

export function getHighlightStyle(color) {
  return HIGHLIGHT_COLORS[color] || HIGHLIGHT_COLORS[DEFAULT_HIGHLIGHT_COLOR];
}

export function getHighlightCss(color, isSelected = false) {
  const style = getHighlightStyle(color);
  const outline = isSelected ? `outline: 2px solid ${style.border}; outline-offset: 1px;` : '';
  return `background: ${style.bg}; ${outline}`;
}

export function highlightColorPicker(selectedColor = DEFAULT_HIGHLIGHT_COLOR) {
  const swatches = Object.entries(HIGHLIGHT_COLORS).map(([key, val]) =>
    `<div class="cpd-swatch${key === selectedColor ? ' cpd-selected' : ''}" style="background:${val.bg.replace(/[\d.]+\)$/, '0.8)')};border-color:${val.border}" data-color="${key}" title="${val.label}"></div>`
  ).join('');
  return `<div class="color-picker-grid" style="grid-template-columns:repeat(4,1fr)">${swatches}</div>`;
}

export function resolvedHighlightStyle() {
  return 'background: rgba(34, 197, 94, 0.15); border-left: 3px solid #22c55e;';
}

export function flaggedHighlightStyle() {
  return 'background: rgba(239, 68, 68, 0.15); border-left: 3px solid #ef4444;';
}
