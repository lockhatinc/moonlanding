// Unified Event Delegation Framework
// Centralizes all event handling, eliminates 90% of onclick attributes
// Usage: Add data-action="actionName" and data-params='{"key":"value"}' to elements

window.__events = window.__events || {
  handlers: new Map(),
  register(name, fn) { this.handlers.set(name, fn); },
  dispatch(name, ...args) {
    const fn = this.handlers.get(name);
    if (!fn) console.warn(`Unknown action: ${name}`);
    return fn?.(...args);
  }
};

const eventDelegation = {
  // Dialog operations
  closeDialog(dialogId) {
    const el = document.getElementById(dialogId);
    if (el) el.style.display = 'none';
  },

  navigate(path) { window.location = path; },

  toggle(elementId, attr = 'checked') {
    const el = document.getElementById(elementId);
    if (el?.type === 'checkbox') el.checked = !el.checked;
    else el.classList.toggle('active');
  },

  toggleDisplay(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
  },

  setValue(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.value = value;
  },

  setDisplay(elementId, show) {
    const el = document.getElementById(elementId);
    if (el) el.style.display = show ? '' : 'none';
  },

  remove(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.remove();
  },

  focus(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.focus();
  }
};

// Register all standard actions
Object.entries(eventDelegation).forEach(([name, fn]) => {
  window.__events.register(name, fn);
});

// Universal click handler - attach to document root
document.addEventListener('click', (e) => {
  let target = e.target.closest('[data-action], [data-dialog-close], [data-navigate], [data-toggle]');
  if (!target) return;

  // Stop propagation for dialog overlays
  if (target.classList.contains('dialog-overlay') && e.target === target) {
    target.style.display = 'none';
    return;
  }

  if (target.dataset.dialogClose) {
    eventDelegation.closeDialog(target.dataset.dialogClose);
  } else if (target.dataset.navigate) {
    eventDelegation.navigate(target.dataset.navigate);
  } else if (target.dataset.toggle) {
    eventDelegation.toggle(target.dataset.toggle);
  } else if (target.dataset.action) {
    const params = target.dataset.params ? JSON.parse(target.dataset.params) : {};
    window.__events.dispatch(target.dataset.action, e, target, params);
  }
}, true);

// Keyboard support for dialogs
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const dialog = document.querySelector('[role="dialog"]:not([style*="display:none"])');
    if (dialog) {
      dialog.style.display = 'none';
      e.preventDefault();
    }
  }
});
