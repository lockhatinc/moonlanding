import { getConfigEngine } from '@/lib/index.js';

function getRoleHierarchy() {
  const config = getConfigEngine();
  const roles = config.getRoles();
  const hierarchy = {};
  let level = 0;
  for (const [roleName] of Object.entries(roles)) {
    hierarchy[roleName] = level++;
  }
  return hierarchy;
}

function getEntityPermissions() {
  const config = getConfigEngine();
  const entities = config.getAllEntities();
  const permissions = {};

  for (const entity of entities) {
    const spec = config.generateEntitySpec(entity.name);
    permissions[entity.name] = {
      list: (spec.permission_template?.list || []).map(r => r.name || r),
      view: (spec.permission_template?.view || []).map(r => r.name || r),
      create: (spec.permission_template?.create || []).map(r => r.name || r),
      edit: (spec.permission_template?.edit || []).map(r => r.name || r),
      delete: (spec.permission_template?.delete || []).map(r => r.name || r),
    };
  }
  return permissions;
}

export function canAccess(user, entity, action) {
  if (!user?.role) return false;
  const config = getConfigEngine();
  const roles = config.getRoles();
  const partnerRole = Object.keys(roles)[0];

  const permissions = getEntityPermissions()[entity];
  if (!permissions) return user.role === partnerRole;
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
  const config = getConfigEngine();
  const roles = config.getRoles();
  const partnerRole = Object.keys(roles)[0];
  return user?.role === partnerRole;
}

export function isManager(user) {
  const config = getConfigEngine();
  const roles = config.getRoles();
  const managerRole = Object.keys(roles)[1];
  return user?.role === managerRole;
}

export function isClerk(user) {
  const config = getConfigEngine();
  const roles = config.getRoles();
  const clerkRole = Object.keys(roles)[2];
  return user?.role === clerkRole;
}

export function isClientUser(user) {
  const config = getConfigEngine();
  const roles = config.getRoles();
  const clientRoles = Object.keys(roles).filter(r => r.includes('client'));
  return clientRoles.includes(user?.role);
}

export function isAuditor(user) {
  const config = getConfigEngine();
  const roles = config.getRoles();
  const auditRoles = Object.keys(roles).filter(r => !r.includes('client'));
  return auditRoles.includes(user?.role);
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
