import { HIGHLIGHT_PALETTE } from '@/lib/mwr-core-engines';

export function createTipContainer(position, onSave, onCancel) {
  const container = document.createElement('div');
  container.className = 'pdf-tip-container';

  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - (position.top + position.height);
  const showAbove = spaceBelow < 200;

  Object.assign(container.style, {
    position: 'absolute',
    left: `${position.left}px`,
    [showAbove ? 'bottom' : 'top']: showAbove
      ? `${position.containerHeight - position.top + 8}px`
      : `${position.top + position.height + 8}px`,
    zIndex: '1000',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    padding: '12px',
    minWidth: '240px',
    maxWidth: '320px'
  });

  let selectedColor = HIGHLIGHT_PALETTE.grey.color;
  let noteText = '';

  const colorRow = document.createElement('div');
  colorRow.style.cssText = 'display:flex;gap:6px;margin-bottom:8px';

  for (const [key, palette] of Object.entries(HIGHLIGHT_PALETTE)) {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.title = palette.label;
    swatch.style.cssText = `width:24px;height:24px;border-radius:50%;border:2px solid transparent;background:${palette.color};cursor:pointer`;
    swatch.addEventListener('click', () => {
      selectedColor = palette.color;
      colorRow.querySelectorAll('button').forEach(b => b.style.borderColor = 'transparent');
      swatch.style.borderColor = '#333';
    });
    if (palette.color === selectedColor) swatch.style.borderColor = '#333';
    colorRow.appendChild(swatch);
  }

  const noteInput = document.createElement('textarea');
  noteInput.placeholder = 'Add a note...';
  noteInput.rows = 2;
  noteInput.style.cssText = 'width:100%;border:1px solid #ddd;border-radius:4px;padding:6px;font-size:13px;resize:vertical;margin-bottom:8px;font-family:inherit';
  noteInput.addEventListener('input', (e) => { noteText = e.target.value; });

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:6px;justify-content:flex-end';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = 'padding:4px 12px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer;font-size:13px';
  cancelBtn.addEventListener('click', () => { container.remove(); onCancel?.(); });

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.textContent = 'Save';
  saveBtn.style.cssText = 'padding:4px 12px;border:none;border-radius:4px;background:#2563eb;color:white;cursor:pointer;font-size:13px';
  saveBtn.addEventListener('click', () => {
    container.remove();
    onSave?.({ color: selectedColor, note: noteText });
  });

  btnRow.append(cancelBtn, saveBtn);
  container.append(colorRow, noteInput, btnRow);

  return container;
}

export function removeTipContainers() {
  document.querySelectorAll('.pdf-tip-container').forEach(el => el.remove());
}
