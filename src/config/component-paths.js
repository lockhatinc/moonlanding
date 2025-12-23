export const COMPONENT_PATHS = {
  builders: {
    form: 'FormBuilder',
    list: 'ListBuilder',
    detail: 'DetailView',
  },

  dialogs: {
    addChecklist: 'AddChecklistDialog',
  },

  viewers: {
    pdf: 'PDFViewer',
    highlight: 'HighlightLayer',
    chat: 'ChatPanel',
  },

  layout: {
    shell: 'Shell',
  },

  dashboard: {
    statsGrid: 'StatsGrid',
    allEntities: 'AllEntities',
    recentActivity: 'RecentActivity',
    quickActions: 'QuickActions',
  },

  domain: {
    reviewDetail: 'ReviewDetail',
  },

  entity: {
    detail: 'EntityDetail',
    component: 'Entity',
  },

  detailParts: {
    actionsPanel: 'ActionsPanel',
    childTabs: 'ChildTabs',
    detailFields: 'DetailFields',
    detailHeader: 'DetailHeader',
  },

  form: {
    sections: 'FormSections',
    fieldRender: 'FieldRender',
  },

  utility: {
    skeleton: 'Skeleton',
    debugInit: 'DebugInit',
  },
};

export const COMPONENT_REGISTRY = {
  FormBuilder: '@/components/builders/form-builder.jsx',
  ListBuilder: '@/components/builders/list-builder.jsx',

  AddChecklistDialog: '@/components/dialogs/add-checklist.jsx',

  PDFViewer: '@/components/pdf-viewer.jsx',
  HighlightLayer: '@/components/highlight-layer.jsx',
  ChatPanel: '@/components/chat-panel.jsx',

  Shell: '@/components/layout.jsx#Shell',

  StatsGrid: '@/components/dashboard/stats-grid.jsx',
  AllEntities: '@/components/dashboard/all-entities.jsx',
  RecentActivity: '@/components/dashboard/recent-activity.jsx',
  QuickActions: '@/components/dashboard/quick-actions.jsx',

  ReviewDetail: '@/components/domain.jsx#ReviewDetail',

  EntityDetail: '@/components/entity-detail.jsx',
  Entity: '@/lib/entity-component.jsx',

  ActionsPanel: '@/components/entity-detail/actions-panel.jsx',
  ChildTabs: '@/components/entity-detail/child-tabs.jsx',
  DetailFields: '@/components/entity-detail/detail-fields.jsx',
  DetailHeader: '@/components/entity-detail/detail-header.jsx',

  FormSections: '@/components/form-sections.jsx',
  FieldRender: '@/components/field-render.jsx',

  Skeleton: '@/components/skeleton.jsx',
  DebugInit: '@/components/debug-init.jsx',
};

export function getComponent(componentName) {
  const path = COMPONENT_REGISTRY[componentName];
  if (!path) {
    console.warn(`[ComponentPaths] No component path found for: ${componentName}`);
    return null;
  }
  return path;
}

export function getComponentPath(category, name) {
  const componentName = COMPONENT_PATHS[category]?.[name];
  if (!componentName) {
    console.warn(`[ComponentPaths] No component name found for: ${category}.${name}`);
    return null;
  }
  return componentName;
}

export function getComponentFilePath(componentName) {
  return COMPONENT_REGISTRY[componentName] || null;
}

export function getComponentLoader(componentName) {
  const path = COMPONENT_REGISTRY[componentName];
  if (!path) {
    console.warn(`[ComponentPaths] No component loader found for: ${componentName}`);
    return null;
  }
  return path;
}

export function createComponentLoader(componentName) {
  const path = COMPONENT_REGISTRY[componentName];
  if (!path) {
    console.warn(`[ComponentPaths] No component loader found for: ${componentName}`);
    return null;
  }

  const [filePath, exportName] = path.includes('#') ? path.split('#') : [path, 'default'];

  return () => import(/* webpackIgnore: true */filePath).then((module) => {
    if (exportName === 'default') {
      return module.default;
    }
    return module[exportName];
  });
}

export function hasComponent(componentName) {
  return componentName in COMPONENT_REGISTRY;
}

export function listComponents(category = null) {
  if (!category) {
    return Object.keys(COMPONENT_REGISTRY);
  }
  const paths = COMPONENT_PATHS[category];
  return paths ? Object.values(paths) : [];
}

export function listCategories() {
  return Object.keys(COMPONENT_PATHS);
}
