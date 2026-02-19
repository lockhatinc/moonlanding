import { getConfig } from '../lib/config-generator-engine.js';

export function renderDialog(dialogId, context = {}) {
  const config = getConfig();
  const dialogConfig = config.dialogs?.[dialogId];

  if (!dialogConfig) {
    console.warn(`Dialog config not found: ${dialogId}`);
    return '';
  }

  const { title, fields = [], actions = [], width = '640px', onSubmit } = dialogConfig;
  const dialogHtml = generateDialogHtml(dialogId, title, fields, actions, width, context, onSubmit);

  return dialogHtml;
}

function generateDialogHtml(dialogId, title, fields, actions, width, context, onSubmit) {
  const fieldHtml = fields.map(f => generateFieldHtml(f, dialogId, context)).join('');
  const actionButtons = (actions || []).map(a => {
    if (a.type === 'cancel') {
      return `<button class="btn btn-ghost btn-sm" onclick="closeDialog('${dialogId}')">${a.label || 'Cancel'}</button>`;
    } else if (a.type === 'submit') {
      return `<button class="btn btn-primary btn-sm" onclick="submitDialog('${dialogId}')">${a.label || 'Submit'}</button>`;
    }
    return '';
  }).join('');

  return `
    <div id="${dialogId}" class="dialog-overlay" style="display:none" onclick="if(event.target===this)closeDialog('${dialogId}')">
      <div class="dialog-panel" style="max-width:${width}">
        <div class="dialog-header">
          <span class="dialog-title">${escapeHtml(title)}</span>
          <button class="dialog-close" onclick="closeDialog('${dialogId}')">&times;</button>
        </div>
        <div class="dialog-body">
          ${fieldHtml}
        </div>
        <div class="dialog-footer">
          ${actionButtons}
        </div>
      </div>
    </div>
    <script>
      window.closeDialog = window.closeDialog || function(id) {
        document.getElementById(id).style.display = 'none';
      };
      window.submitDialog = window.submitDialog || function(id) {
        const form = document.getElementById(id + '-form');
        if (form) form.dispatchEvent(new Event('submit'));
      };
      window.openDialog = window.openDialog || function(id) {
        document.getElementById(id).style.display = 'flex';
      };
    </script>
  `;
}

function generateFieldHtml(field, dialogId, context) {
  const { name, label, type, required, placeholder, options, value } = field;
  const fieldId = `${dialogId}-${name}`;
  const requiredAttr = required ? 'required' : '';

  let inputHtml = '';

  switch (type) {
    case 'text':
      inputHtml = `<input type="text" id="${fieldId}" name="${name}" class="input input-bordered w-full" placeholder="${placeholder || ''}" ${requiredAttr}/>`;
      break;
    case 'textarea':
      inputHtml = `<textarea id="${fieldId}" name="${name}" class="textarea textarea-bordered w-full" rows="5" placeholder="${placeholder || ''}" ${requiredAttr}></textarea>`;
      break;
    case 'email':
      inputHtml = `<input type="email" id="${fieldId}" name="${name}" class="input input-bordered w-full" placeholder="${placeholder || ''}" ${requiredAttr}/>`;
      break;
    case 'number':
      inputHtml = `<input type="number" id="${fieldId}" name="${name}" class="input input-bordered w-full" placeholder="${placeholder || ''}" ${requiredAttr}/>`;
      break;
    case 'date':
      inputHtml = `<input type="date" id="${fieldId}" name="${name}" class="input input-bordered w-full" ${requiredAttr}/>`;
      break;
    case 'select':
      const optionsHtml = (options || []).map(opt =>
        `<option value="${opt.value}">${escapeHtml(opt.label || opt.value)}</option>`
      ).join('');
      inputHtml = `<select id="${fieldId}" name="${name}" class="select select-bordered w-full" ${requiredAttr}><option value="">Select...</option>${optionsHtml}</select>`;
      break;
    case 'checkbox':
      inputHtml = `<label class="flex items-center gap-2"><input type="checkbox" id="${fieldId}" name="${name}" class="checkbox" ${requiredAttr}/><span class="text-sm">${label}</span></label>`;
      break;
    case 'multi-select':
      const multiOptHtml = (options || []).map(opt =>
        `<label class="flex items-center gap-2"><input type="checkbox" name="${name}" value="${opt.value}" class="checkbox"/><span class="text-sm">${escapeHtml(opt.label || opt.value)}</span></label>`
      ).join('');
      inputHtml = `<div class="flex flex-col gap-2">${multiOptHtml}</div>`;
      break;
    case 'file':
      inputHtml = `<input type="file" id="${fieldId}" name="${name}" class="file-input file-input-bordered w-full" ${requiredAttr}/>`;
      break;
    case 'color':
      inputHtml = `<input type="color" id="${fieldId}" name="${name}" class="input input-bordered w-full" ${requiredAttr}/>`;
      break;
    default:
      inputHtml = `<input type="text" id="${fieldId}" name="${name}" class="input input-bordered w-full" placeholder="${placeholder || ''}" ${requiredAttr}/>`;
  }

  return `
    <div class="modal-form-group">
      ${type !== 'checkbox' ? `<label for="${fieldId}">${escapeHtml(label || name)}</label>` : ''}
      ${inputHtml}
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function getDialogConfig(dialogId) {
  const config = getConfig();
  return config.dialogs?.[dialogId];
}

export function listDialogs() {
  const config = getConfig();
  return Object.keys(config.dialogs || {});
}
