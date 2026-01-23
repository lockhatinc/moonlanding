const ROLE_HIERARCHY = {
  partner: 0,
  manager: 1,
  clerk: 2,
  client_admin: 3,
  client_user: 4,
};

const ENTITY_PERMISSIONS = {
  user: { list: ['partner'], view: ['partner'], create: ['partner'], edit: ['partner'], delete: ['partner'] },
  team: { list: ['partner'], view: ['partner'], create: ['partner'], edit: ['partner'], delete: ['partner'] },
  client: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager'], edit: ['partner', 'manager'], delete: ['partner'] },
  engagement: { list: ['partner', 'manager', 'clerk', 'client_admin'], view: ['partner', 'manager', 'clerk', 'client_admin', 'client_user'], create: ['partner', 'manager'], edit: ['partner', 'manager'], delete: ['partner'] },
  rfi: { list: ['partner', 'manager', 'clerk', 'client_admin', 'client_user'], view: ['partner', 'manager', 'clerk', 'client_admin', 'client_user'], create: ['partner', 'manager'], edit: ['partner', 'manager', 'clerk'], delete: ['partner'] },
  review: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager'], edit: ['partner', 'manager'], delete: ['partner'] },
  highlight: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager', 'clerk'], edit: ['partner', 'manager'], delete: ['partner'] },
  checklist: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager'], edit: ['partner', 'manager', 'clerk'], delete: ['partner'] },
  collaborator: { list: ['partner'], view: ['partner'], create: ['partner'], edit: ['partner'], delete: ['partner'] },
  tender: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager'], edit: ['partner', 'manager'], delete: ['partner'] },
  permission_audit: { list: ['partner', 'manager'], view: ['partner', 'manager'], create: [], edit: [], delete: [] },
};

export function canAccess(user, entity, action) {
  if (!user?.role) return false;
  const permissions = ENTITY_PERMISSIONS[entity];
  if (!permissions) return user.role === 'partner';
  const allowed = permissions[action] || [];
  return allowed.includes(user.role);
}

export function canList(user, entity) {
  return canAccess(user, entity, 'list');
}

export function canView(user, entity) {
  return canAccess(user, entity, 'view');
}

export function canCreate(user, entity) {
  return canAccess(user, entity, 'create');
}

export function canEdit(user, entity) {
  return canAccess(user, entity, 'edit');
}

export function canDelete(user, entity) {
  return canAccess(user, entity, 'delete');
}

export function isPartner(user) {
  return user?.role === 'partner';
}

export function isManager(user) {
  return user?.role === 'manager';
}

export function isClerk(user) {
  return user?.role === 'clerk';
}

export function isClientUser(user) {
  return user?.role === 'client_admin' || user?.role === 'client_user';
}

export function isAuditor(user) {
  return ['partner', 'manager', 'clerk'].includes(user?.role);
}

export function getNavItems(user) {
  const items = [];
  if (canList(user, 'engagement')) items.push({ href: '/engagement', label: 'Engagements' });
  if (canList(user, 'client')) items.push({ href: '/client', label: 'Clients' });
  if (canList(user, 'rfi')) items.push({ href: '/rfi', label: 'RFIs' });
  if (canList(user, 'review')) items.push({ href: '/review', label: 'Reviews' });
  if (canList(user, 'user')) items.push({ href: '/user', label: 'Users' });
  if (canList(user, 'team')) items.push({ href: '/team', label: 'Teams' });
  return items;
}

export function getAdminItems(user) {
  const items = [];
  if (canList(user, 'permission_audit')) items.push({ href: '/admin/audit', label: 'Audit' });
  if (isPartner(user)) items.push({ href: '/admin/health', label: 'Health' });
  if (isPartner(user)) items.push({ href: '/admin/settings', label: 'Settings' });
  return items;
}

export function getQuickActions(user) {
  const actions = [];
  if (isClerk(user)) {
    actions.push({ href: '/rfi', label: 'View My RFIs', primary: true });
    actions.push({ href: '/engagement', label: 'View Engagements', outline: true });
  } else if (isClientUser(user)) {
    actions.push({ href: '/rfi', label: 'View My RFIs', primary: true });
    actions.push({ href: '/engagement', label: 'My Engagements', outline: true });
  } else {
    if (canCreate(user, 'engagement')) actions.push({ href: '/engagement/new', label: 'New Engagement', primary: true });
    if (canCreate(user, 'client')) actions.push({ href: '/client/new', label: 'New Client', outline: true });
    if (canCreate(user, 'review')) actions.push({ href: '/review/new', label: 'New Review', outline: true });
  }
  return actions;
}
