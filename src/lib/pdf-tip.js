export function createPdfTip(options = {}) {
  const {
    x = 0,
    y = 0,
    highlightText = '',
    color = '#FFE082',
    onColorChange = null,
    onDelete = null,
    onComment = null
  } = options;

  const tip = document.createElement('div');
  tip.className = 'pdf-tip';
  tip.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 8000;
    padding: 0.75rem;
    min-width: 250px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  `;
  header.textContent = 'Highlight';

  const text = document.createElement('div');
  text.style.cssText = `
    background: ${color};
    padding: 0.5rem;
    border-radius: 3px;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    color: #333;
    max-height: 100px;
    overflow: auto;
    line-height: 1.4;
  `;
  text.textContent = highlightText || '(text)';

  const colorSection = document.createElement('div');
  colorSection.style.cssText = 'margin-bottom: 0.75rem;';

  const colorLabel = document.createElement('div');
  colorLabel.style.cssText = 'font-size: 0.75rem; color: #666; margin-bottom: 0.25rem;';
  colorLabel.textContent = 'Color:';

  const colorOptions = document.createElement('div');
  colorOptions.style.cssText = 'display: flex; gap: 0.5rem; flex-wrap: wrap;';

  const colors = [
    { name: 'Yellow', value: '#FFE082' },
    { name: 'Green', value: '#C8E6C9' },
    { name: 'Blue', value: '#BBDEFB' },
    { name: 'Pink', value: '#F8BBD0' },
    { name: 'Orange', value: '#FFE0B2' }
  ];

  colors.forEach(c => {
    const colorBtn = document.createElement('button');
    colorBtn.title = c.name;
    colorBtn.style.cssText = `
      width: 24px;
      height: 24px;
      background: ${c.value};
      border: ${c.value === color ? '2px solid #333' : '1px solid #ddd'};
      border-radius: 3px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    colorBtn.onmouseover = () => {
      colorBtn.style.transform = 'scale(1.1)';
    };
    colorBtn.onmouseout = () => {
      colorBtn.style.transform = 'scale(1)';
    };
    colorBtn.onclick = () => {
      text.style.background = c.value;
      if (onColorChange) onColorChange(c.value);
      updateColorSelection();
    };
    colorOptions.appendChild(colorBtn);
  });

  function updateColorSelection() {
    Array.from(colorOptions.children).forEach((btn, idx) => {
      const isSelected = btn.style.background === text.style.background;
      btn.style.border = isSelected ? '2px solid #333' : '1px solid #ddd';
    });
  }

  colorSection.appendChild(colorLabel);
  colorSection.appendChild(colorOptions);

  const actions = document.createElement('div');
  actions.style.cssText = 'display: flex; gap: 0.5rem;';

  const commentBtn = document.createElement('button');
  commentBtn.textContent = 'Comment';
  commentBtn.style.cssText = `
    flex: 1;
    padding: 0.4rem 0.6rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
  `;
  commentBtn.onclick = () => {
    if (onComment) onComment();
    close();
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.style.cssText = `
    flex: 1;
    padding: 0.4rem 0.6rem;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
  `;
  deleteBtn.onclick = () => {
    if (onDelete) onDelete();
    close();
  };

  actions.appendChild(commentBtn);
  actions.appendChild(deleteBtn);

  tip.appendChild(header);
  tip.appendChild(text);
  tip.appendChild(colorSection);
  tip.appendChild(actions);

  function close() {
    tip.remove();
  }

  return {
    element: tip,
    show: () => document.body.appendChild(tip),
    close,
    setPosition: (newX, newY) => {
      tip.style.left = newX + 'px';
      tip.style.top = newY + 'px';
    }
  };
}

export function createTipContainer() {
  const container = document.createElement('div');
  container.className = 'pdf-tips-container';
  container.style.cssText = 'position: fixed; pointer-events: none; z-index: 7999;';

  const tips = new Map();

  return {
    element: container,
    add: (id, tip) => {
      tips.set(id, tip);
      container.appendChild(tip.element);
    },
    remove: (id) => {
      const tip = tips.get(id);
      if (tip) {
        tip.close();
        tips.delete(id);
      }
    },
    clear: () => {
      tips.forEach(tip => tip.close());
      tips.clear();
    },
    getTip: (id) => tips.get(id),
    getAll: () => Array.from(tips.values())
  };
}
