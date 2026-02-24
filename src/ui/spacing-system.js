// Unified spacing and layout system - single source of truth for all UI
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

export function renderPageWrapper(content, opts = {}) {
  const padding = opts.padding || SPACING.md;
  return `<div style="padding:${padding};max-width:100%">${content}</div>`;
}

export function renderSection(content, opts = {}) {
  const marginBottom = opts.marginBottom || SPACING.lg;
  return `<div style="margin-bottom:${marginBottom}">${content}</div>`;
}

export function renderCard(content, opts = {}) {
  const padding = opts.padding !== undefined ? opts.padding : SPACING.md;
  const marginBottom = opts.marginBottom || SPACING.md;
  return `<div class="card-clean" style="margin-bottom:${marginBottom}"><div class="card-clean-body" style="padding:${padding}">${content}</div></div>`;
}

export function renderCardHeader(content, marginBottom = SPACING.md) {
  return `<h2 style="font-size:0.875rem;font-weight:600;margin-bottom:${marginBottom}">${content}</h2>`;
}

export function renderCardGrid(cols, gap = SPACING.md, marginBottom = SPACING.lg) {
  const colsStr = cols === 2 ? '1fr 1fr' : cols === 3 ? '1fr 1fr 1fr' : '1fr';
  return {
    wrap: (content) => `<div style="display:grid;grid-template-columns:${colsStr};gap:${gap};margin-bottom:${marginBottom}">${content}</div>`,
    col: (content) => `<div>${content}</div>`,
  };
}

export function renderTable(cols, rows, marginTop = SPACING.md) {
  return `<div class="table-wrap" style="margin-top:${marginTop}"><table class="data-table">
    <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${rows || `<tr><td colspan="${cols.length}" style="text-align:center;padding:${SPACING.lg} 0;color:var(--color-text-muted)">No data</td></tr>`}</tbody>
  </table></div>`;
}

export function renderFlex(content, opts = {}) {
  const { gap = SPACING.md, direction = 'row', justify = 'flex-start', align = 'center', marginBottom = SPACING.md } = opts;
  const flexDirection = direction === 'col' ? 'column' : 'row';
  return `<div style="display:flex;flex-direction:${flexDirection};gap:${gap};justify-content:${justify};align-items:${align};margin-bottom:${marginBottom}">${content}</div>`;
}

export function renderTabBar(tabs, activeDef = null) {
  return `<nav class="tab-bar" style="margin-bottom:${SPACING.lg};overflow-x:auto;scrollbar-width:none">
    ${tabs.map(t => `<a href="${t.href}" class="tab-btn${t.key === activeDef ? ' active' : ''}">${t.label}</a>`).join('')}
  </nav>`;
}

export function renderInfoGrid(items) {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:${SPACING.md}">
    ${items.map(([label, value]) => `<div>
      <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-muted);margin-bottom:${SPACING.xs}">${label}</div>
      <div style="font-size:0.875rem;color:var(--color-text)">${value}</div>
    </div>`).join('')}
  </div>`;
}

export function renderButton(label, opts = {}) {
  const { onclick, href, variant = 'ghost', size = 'sm', style = '', disabled = false } = opts;
  const btnClass = `btn btn-${variant} btn-${size}`;
  const extraStyle = style ? `;${style}` : '';

  if (href) {
    return `<a href="${href}" class="${btnClass}" style="justify-content:flex-start${extraStyle}">${label}</a>`;
  }

  return `<button onclick="${onclick}" class="${btnClass}" ${disabled ? 'disabled' : ''} style="justify-content:flex-start${extraStyle}">${label}</button>`;
}

export function renderProgress(value, max = 100, variant = 'success', marginTop = SPACING.md) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return `<div style="margin-top:${marginTop}">
    <div style="display:flex;justify-content:space-between;margin-bottom:${SPACING.sm};align-items:center">
      <span style="font-size:0.8rem;font-weight:600;color:var(--color-text-muted)">Progress</span>
      <span style="font-size:0.8rem;color:var(--color-text-light)">${pct}%</span>
    </div>
    <progress class="progress progress-${variant} w-full" value="${pct}" max="100"></progress>
  </div>`;
}

export function renderBadge(text, variant = 'success') {
  return `<span style="background:var(--color-${variant});color:white;padding:${SPACING.xs} ${SPACING.sm};border-radius:9999px;font-size:0.75rem;font-weight:600">${text}</span>`;
}

export function renderEmptyState(message, marginTop = SPACING.lg) {
  return `<div style="text-align:center;padding:${SPACING.lg} 0;color:var(--color-text-muted);margin-top:${marginTop}">${message}</div>`;
}
