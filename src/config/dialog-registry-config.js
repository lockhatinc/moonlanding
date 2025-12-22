export const DIALOG_REGISTRY = {
  confirmDelete: {
    type: 'confirm',
    title: 'Confirm Delete',
    message: 'Are you sure? This action cannot be undone.',
    action: 'delete',
    buttons: ['cancel', 'delete'],
    danger: true,
    size: 'sm',
  },
  confirmSubmit: {
    type: 'confirm',
    title: 'Confirm Submission',
    message: 'Submit this form? Changes will be saved.',
    action: 'submit',
    buttons: ['cancel', 'submit'],
    size: 'sm',
  },
  confirmStatusChange: {
    type: 'confirm',
    title: 'Confirm Status Change',
    message: 'Change status? Related workflows may be affected.',
    action: 'transition',
    buttons: ['cancel', 'confirm'],
    size: 'sm',
  },
  errorAlert: {
    type: 'alert',
    title: 'Error',
    buttons: ['close'],
    danger: true,
    size: 'sm',
  },
  successAlert: {
    type: 'alert',
    title: 'Success',
    buttons: ['close'],
    success: true,
    size: 'sm',
    autoClose: 3000,
  },
  warningAlert: {
    type: 'alert',
    title: 'Warning',
    buttons: ['close'],
    warning: true,
    size: 'sm',
  },
  addChecklist: {
    type: 'form',
    title: 'Add Checklist',
    action: 'create',
    buttons: ['cancel', 'save'],
    size: 'md',
    fields: ['name', 'description', 'items'],
  },
  editChecklist: {
    type: 'form',
    title: 'Edit Checklist',
    action: 'update',
    buttons: ['cancel', 'save'],
    size: 'md',
    fields: ['name', 'description', 'items'],
  },
  bulkAction: {
    type: 'selection',
    title: 'Bulk Action',
    message: 'Select action and confirm',
    action: 'bulk',
    buttons: ['cancel', 'proceed'],
    size: 'md',
    options: ['update', 'delete', 'reassign', 'export'],
  },
  fileUpload: {
    type: 'form',
    title: 'Upload File',
    action: 'upload',
    buttons: ['cancel', 'upload'],
    size: 'md',
    fields: ['file', 'description'],
  },
  dateSelector: {
    type: 'form',
    title: 'Select Date',
    action: 'select',
    buttons: ['cancel', 'select'],
    size: 'sm',
    fields: ['date'],
  },
};

export function getDialog(name) {
  return DIALOG_REGISTRY[name];
}

export function getAllDialogs() {
  return Object.entries(DIALOG_REGISTRY).map(([name, config]) => ({ id: name, ...config }));
}

export function getDialogsByType(type) {
  return Object.entries(DIALOG_REGISTRY)
    .filter(([_, config]) => config.type === type)
    .map(([name, config]) => ({ id: name, ...config }));
}

export function getConfirmDialog(action) {
  const suffix = action.charAt(0).toUpperCase() + action.slice(1);
  const name = `confirm${suffix}`;
  return getDialog(name);
}

export class DialogManager {
  constructor() {
    this.dialogs = [];
    this.activeDialog = null;
  }

  open(name, options = {}) {
    const config = getDialog(name);
    if (!config) throw new Error(`Dialog not found: ${name}`);

    this.activeDialog = { id: name, ...config, ...options };
    this.dialogs.push(this.activeDialog);
    return this.activeDialog;
  }

  close(id = null) {
    if (id) {
      this.dialogs = this.dialogs.filter(d => d.id !== id);
      if (this.activeDialog?.id === id) this.activeDialog = null;
    } else {
      if (this.activeDialog) {
        this.dialogs = this.dialogs.filter(d => d.id !== this.activeDialog.id);
        this.activeDialog = null;
      }
    }
  }

  closeAll() {
    this.dialogs = [];
    this.activeDialog = null;
  }

  isOpen(name) {
    return this.dialogs.some(d => d.id === name);
  }

  getActive() {
    return this.activeDialog;
  }
}

export const dialogManager = new DialogManager();
