import React from 'react';

const renderers = {};
const defaultMode = 'display';

export function registerRenderer(type, mode, component) {
  if (!renderers[type]) {
    renderers[type] = {};
  }
  renderers[type][mode] = component;
}

export function getRenderer(type, mode = defaultMode) {
  const typeRenderers = renderers[type];
  if (!typeRenderers) {
    console.warn(`[FieldRenderer] No renderers registered for type: ${type}`);
    return renderers.default?.[mode] || renderers.default?.display;
  }

  return typeRenderers[mode] || typeRenderers.display || renderers.default?.display;
}

export function createFieldRenderer(type, mode = defaultMode) {
  return getRenderer(type, mode);
}

export function registerFieldTypeRenderers(type, modesMap) {
  for (const [mode, component] of Object.entries(modesMap)) {
    registerRenderer(type, mode, component);
  }
}

export function getAvailableRenderers() {
  return Object.keys(renderers);
}

export function getAvailableModesForType(type) {
  return Object.keys(renderers[type] || {});
}

export function hasRenderer(type, mode) {
  return !!renderers[type]?.[mode];
}

export function getAllRenderers() {
  return { ...renderers };
}
