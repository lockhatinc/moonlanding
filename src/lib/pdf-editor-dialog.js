export function createPdfEditorDialog(options = {}) {
  const {
    title = 'PDF Editor',
    pdfUrl = '',
    onSave = null,
    onClose = null,
    readOnly = false
  } = options;

  const dialog = document.createElement('div');
  dialog.className = 'pdf-editor-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9000;
  `;

  const container = document.createElement('div');
  container.style.cssText = `
    background: white;
    width: 90vw;
    height: 90vh;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #eee;
    background: #f8f9fa;
  `;

  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.cssText = 'margin: 0; color: #333;';

  const buttonGroup = document.createElement('div');
  buttonGroup.style.cssText = 'display: flex; gap: 0.5rem;';

  if (!readOnly) {
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = `
      padding: 0.5rem 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    `;
    saveBtn.onclick = () => {
      if (onSave) onSave();
      close();
    };
    buttonGroup.appendChild(saveBtn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = `
    padding: 0.5rem 1rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
  `;
  closeBtn.onclick = close;
  buttonGroup.appendChild(closeBtn);

  header.appendChild(titleEl);
  header.appendChild(buttonGroup);

  const content = document.createElement('div');
  content.style.cssText = `
    flex: 1;
    overflow: auto;
    padding: 1rem;
    background: white;
  `;

  const pdfContainer = document.createElement('div');
  pdfContainer.className = 'pdf-editor-content';
  pdfContainer.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  if (pdfUrl) {
    const iframe = document.createElement('iframe');
    iframe.src = pdfUrl;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;
    pdfContainer.appendChild(iframe);
  } else {
    const placeholder = document.createElement('p');
    placeholder.textContent = 'No PDF selected';
    placeholder.style.cssText = 'color: #999;';
    pdfContainer.appendChild(placeholder);
  }

  content.appendChild(pdfContainer);
  container.appendChild(header);
  container.appendChild(content);
  dialog.appendChild(container);

  function close() {
    if (onClose) onClose();
    dialog.remove();
  }

  dialog.onclick = (e) => {
    if (e.target === dialog) close();
  };

  return {
    element: dialog,
    open: () => document.body.appendChild(dialog),
    close,
    setUrl: (url) => {
      const iframe = pdfContainer.querySelector('iframe');
      if (iframe) iframe.src = url;
    }
  };
}

export function renderPdfEditorButton(options = {}) {
  const {
    pdfUrl = '',
    buttonText = 'View PDF',
    onSave = null
  } = options;

  const button = document.createElement('button');
  button.textContent = buttonText;
  button.style.cssText = `
    padding: 0.5rem 1rem;
    background: #6c63ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
  `;

  button.onclick = () => {
    const dialog = createPdfEditorDialog({
      title: buttonText,
      pdfUrl,
      onSave
    });
    dialog.open();
  };

  return button;
}
