export function createDateChoiceDialog(options = {}) {
  const {
    title = 'Select Date',
    initialDate = new Date().toISOString().split('T')[0],
    minDate = null,
    maxDate = null,
    onSelect = null,
    onCancel = null
  } = options;

  const dialog = document.createElement('div');
  dialog.className = 'date-choice-dialog';
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

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    width: 100%;
    max-width: 400px;
  `;

  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.cssText = `
    margin: 0 0 1.5rem 0;
    color: #333;
    font-size: 1.25rem;
  `;

  const form = document.createElement('form');

  const dateGroup = document.createElement('div');
  dateGroup.style.cssText = `
    margin-bottom: 1.5rem;
  `;

  const label = document.createElement('label');
  label.textContent = 'Date';
  label.style.cssText = `
    display: block;
    color: #333;
    font-weight: 500;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  `;

  const input = document.createElement('input');
  input.type = 'date';
  input.value = initialDate;
  if (minDate) input.min = minDate;
  if (maxDate) input.max = maxDate;
  input.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  `;
  input.onfocus = () => {
    input.style.borderColor = '#007bff';
    input.style.boxShadow = '0 0 0 2px rgba(0,123,255,0.1)';
  };
  input.onblur = () => {
    input.style.borderColor = '#ddd';
    input.style.boxShadow = 'none';
  };

  dateGroup.appendChild(label);
  dateGroup.appendChild(input);

  const buttonGroup = document.createElement('div');
  buttonGroup.style.cssText = `
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  `;

  const selectBtn = document.createElement('button');
  selectBtn.textContent = 'Select';
  selectBtn.type = 'submit';
  selectBtn.style.cssText = `
    flex: 1;
    padding: 0.75rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    font-size: 1rem;
  `;
  selectBtn.onmouseover = () => {
    selectBtn.style.background = '#0056b3';
  };
  selectBtn.onmouseout = () => {
    selectBtn.style.background = '#007bff';
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.type = 'button';
  cancelBtn.style.cssText = `
    flex: 1;
    padding: 0.75rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    font-size: 1rem;
  `;
  cancelBtn.onmouseover = () => {
    cancelBtn.style.background = '#5a6268';
  };
  cancelBtn.onmouseout = () => {
    cancelBtn.style.background = '#6c757d';
  };
  cancelBtn.onclick = close;

  buttonGroup.appendChild(selectBtn);
  buttonGroup.appendChild(cancelBtn);

  form.appendChild(dateGroup);
  form.appendChild(buttonGroup);

  form.onsubmit = (e) => {
    e.preventDefault();
    if (onSelect) {
      onSelect(input.value);
    }
    close();
  };

  content.appendChild(titleEl);
  content.appendChild(form);
  dialog.appendChild(content);

  function close() {
    if (onCancel) onCancel();
    dialog.remove();
  }

  dialog.onclick = (e) => {
    if (e.target === dialog) close();
  };

  return {
    element: dialog,
    open: () => {
      document.body.appendChild(dialog);
      input.focus();
    },
    close,
    getDate: () => input.value
  };
}

export function createDateRangeDialog(options = {}) {
  const {
    title = 'Select Date Range',
    startDate = new Date().toISOString().split('T')[0],
    endDate = new Date().toISOString().split('T')[0],
    minDate = null,
    maxDate = null,
    onSelect = null,
    onCancel = null
  } = options;

  const dialog = document.createElement('div');
  dialog.className = 'date-range-dialog';
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

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    width: 100%;
    max-width: 400px;
  `;

  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.cssText = `
    margin: 0 0 1.5rem 0;
    color: #333;
  `;

  const form = document.createElement('form');

  const createDateInput = (labelText, initialValue) => {
    const group = document.createElement('div');
    group.style.cssText = 'margin-bottom: 1.5rem;';

    const label = document.createElement('label');
    label.textContent = labelText;
    label.style.cssText = `
      display: block;
      color: #333;
      font-weight: 500;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    `;

    const input = document.createElement('input');
    input.type = 'date';
    input.value = initialValue;
    if (minDate) input.min = minDate;
    if (maxDate) input.max = maxDate;
    input.style.cssText = `
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      box-sizing: border-box;
    `;

    group.appendChild(label);
    group.appendChild(input);
    return { group, input };
  };

  const { group: startGroup, input: startInput } = createDateInput('Start Date', startDate);
  const { group: endGroup, input: endInput } = createDateInput('End Date', endDate);

  const buttonGroup = document.createElement('div');
  buttonGroup.style.cssText = 'display: flex; gap: 1rem; margin-top: 2rem;';

  const selectBtn = document.createElement('button');
  selectBtn.textContent = 'Select';
  selectBtn.type = 'submit';
  selectBtn.style.cssText = `
    flex: 1;
    padding: 0.75rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  `;

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.type = 'button';
  cancelBtn.style.cssText = `
    flex: 1;
    padding: 0.75rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  `;
  cancelBtn.onclick = close;

  buttonGroup.appendChild(selectBtn);
  buttonGroup.appendChild(cancelBtn);

  form.appendChild(startGroup);
  form.appendChild(endGroup);
  form.appendChild(buttonGroup);

  form.onsubmit = (e) => {
    e.preventDefault();
    if (onSelect) {
      onSelect({
        startDate: startInput.value,
        endDate: endInput.value
      });
    }
    close();
  };

  content.appendChild(titleEl);
  content.appendChild(form);
  dialog.appendChild(content);

  function close() {
    if (onCancel) onCancel();
    dialog.remove();
  }

  dialog.onclick = (e) => {
    if (e.target === dialog) close();
  };

  return {
    element: dialog,
    open: () => {
      document.body.appendChild(dialog);
      startInput.focus();
    },
    close,
    getDateRange: () => ({
      startDate: startInput.value,
      endDate: endInput.value
    })
  };
}
