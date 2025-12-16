

export const API_ENDPOINTS = {
  
  entity: (name) => `/api/${name}`,
  entityId: (name, id) => `/api/${name}/${id}`,
  entityChild: (name, id, child) => `/api/${name}/${id}/${child}`,

  engagement: {
    list: '/api/engagement',
    detail: (id) => `/api/engagement/${id}`,
    create: '/api/engagement',
    update: (id) => `/api/engagement/${id}`,
    delete: (id) => `/api/engagement/${id}`,
    children: (id, child) => `/api/engagement/${id}/${child}`,
  },

  review: {
    list: '/api/review',
    detail: (id) => `/api/review/${id}`,
    create: '/api/review',
    update: (id) => `/api/review/${id}`,
    delete: (id) => `/api/review/${id}`,
    children: (id, child) => `/api/review/${id}/${child}`,
  },

  rfi: {
    list: '/api/rfi',
    detail: (id) => `/api/rfi/${id}`,
    create: '/api/rfi',
    update: (id) => `/api/rfi/${id}`,
    delete: (id) => `/api/rfi/${id}`,
    children: (id, child) => `/api/rfi/${id}/${child}`,
  },

  highlight: {
    list: '/api/highlight',
    detail: (id) => `/api/highlight/${id}`,
    create: '/api/highlight',
    update: (id) => `/api/highlight/${id}`,
    delete: (id) => `/api/highlight/${id}`,
  },

  highlightResponse: {
    create: '/api/highlight_response',
    list: '/api/highlight_response',
  },

  checklist: {
    list: '/api/checklist',
    detail: (id) => `/api/checklist/${id}`,
    create: '/api/checklist',
  },

  reviewChecklist: {
    create: '/api/review_checklist',
    list: '/api/review_checklist',
    update: (id) => `/api/review_checklist/${id}`,
  },

  client: {
    list: '/api/client',
    detail: (id) => `/api/client/${id}`,
  },

  user: {
    list: '/api/user',
    detail: (id) => `/api/user/${id}`,
    current: '/api/auth/me',
  },

  team: {
    list: '/api/team',
    detail: (id) => `/api/team/${id}`,
  },

  file: {
    list: '/api/file',
    upload: '/api/file/upload',
    delete: (id) => `/api/file/${id}`,
  },

  chat: {
    send: '/api/chat',
    list: '/api/chat',
  },

  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    google: '/api/auth/google',
    googleCallback: '/api/auth/google/callback',
  },
};

export function getEntityEndpoint(entity, method = 'GET', id = null) {
  const base = `/api/${entity}`;
  return {
    url: id ? `${base}/${id}` : base,
    method,
  };
}

export function getSearchEndpoint(entity, query) {
  return `/api/${entity}?q=${encodeURIComponent(query)}`;
}

export function isApiEndpoint(url) {
  return url.startsWith('/api/');
}
