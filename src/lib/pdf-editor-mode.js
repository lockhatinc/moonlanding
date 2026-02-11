export const EDITOR_MODES = {
  VIEW: 'view',
  SELECT: 'select',
  AREA: 'area',
  COMMENT: 'comment',
};

export function createEditorState(initialMode = EDITOR_MODES.VIEW) {
  let mode = initialMode;
  let selectedHighlight = null;
  let areaStart = null;
  let listeners = [];

  function getMode() { return mode; }
  function getSelectedHighlight() { return selectedHighlight; }

  function setMode(newMode) {
    const prev = mode;
    mode = newMode;
    selectedHighlight = null;
    areaStart = null;
    notify({ type: 'mode', prev, current: mode });
  }

  function selectHighlight(highlight) {
    selectedHighlight = highlight;
    notify({ type: 'select', highlight });
  }

  function clearSelection() {
    selectedHighlight = null;
    notify({ type: 'deselect' });
  }

  function startArea(point) {
    areaStart = point;
    notify({ type: 'area_start', point });
  }

  function endArea(point) {
    const rect = areaStart ? {
      x: Math.min(areaStart.x, point.x),
      y: Math.min(areaStart.y, point.y),
      width: Math.abs(point.x - areaStart.x),
      height: Math.abs(point.y - areaStart.y),
    } : null;
    areaStart = null;
    notify({ type: 'area_end', rect });
    return rect;
  }

  function onEvent(fn) {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }

  function notify(event) {
    listeners.forEach(fn => { try { fn(event); } catch {} });
  }

  return { getMode, setMode, getSelectedHighlight, selectHighlight, clearSelection, startArea, endArea, onEvent };
}

export function editorToolbar(currentMode = EDITOR_MODES.VIEW) {
  const tools = [
    { mode: EDITOR_MODES.VIEW, icon: '&#128065;', label: 'View' },
    { mode: EDITOR_MODES.SELECT, icon: '&#9998;', label: 'Select Text' },
    { mode: EDITOR_MODES.AREA, icon: '&#9634;', label: 'Area Highlight' },
    { mode: EDITOR_MODES.COMMENT, icon: '&#128172;', label: 'Comment' },
  ];
  const btns = tools.map(t =>
    `<button class="btn btn-sm ${t.mode === currentMode ? 'btn-primary' : 'btn-ghost'}" data-editor-mode="${t.mode}" title="${t.label}" onclick="setEditorMode('${t.mode}')">${t.icon}</button>`
  ).join('');
  return `<div class="flex gap-1" id="editor-toolbar">${btns}</div>`;
}
