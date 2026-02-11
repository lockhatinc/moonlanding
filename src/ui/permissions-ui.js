import { getConfigEngineSync } from '@/lib/config-generator-engine.js';

function getRoleHierarchy() {
  const config = getConfigEngineSync();
  const roles = config.getRoles();
  const hierarchy = {};
  let level = 0;
  for (const [roleName] of Object.entries(roles)) {
    hierarchy[roleName] = level++;
  }
  return hierarchy;
}

function getEntityPermissions() {
  const config = getConfigEngineSync();
  const entityNames = config.getAllEntities();
  const permissions = {};

  for (const name of entityNames) {
    if (!name) continue;
    try {
      const spec = config.generateEntitySpec(name);
      permissions[name] = {
        list: (spec.permission_template?.list || []).map(r => r.name || r),
        view: (spec.permission_template?.view || []).map(r => r.name || r),
        create: (spec.permission_template?.create || []).map(r => r.name || r),
        edit: (spec.permission_template?.edit || []).map(r => r.name || r),
        delete: (spec.permission_template?.delete || []).map(r => r.name || r),
      };
    } catch (e) {
      permissions[name] = { list: [], view: [], create: [], edit: [], delete: [] };
    }
  }
  return permissions;
}

export function canAccess(user, entity, action) {
  if (!user?.role) return false;
  const config = getConfigEngineSync();
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
  const config = getConfigEngineSync();
  const roles = config.getRoles();
  const partnerRole = Object.keys(roles)[0];
  return user?.role === partnerRole;
}

export function isManager(user) {
  const config = getConfigEngineSync();
  const roles = config.getRoles();
  const managerRole = Object.keys(roles)[1];
  return user?.role === managerRole;
}

export function isClerk(user) {
  const config = getConfigEngineSync();
  const roles = config.getRoles();
  const clerkRole = Object.keys(roles)[2];
  return user?.role === clerkRole;
}

export function isClientUser(user) {
  const config = getConfigEngineSync();
  const roles = config.getRoles();
  const clientRoles = Object.keys(roles).filter(r => r.includes('client'));
  return clientRoles.includes(user?.role);
}

export function isClientAdmin(user) {
  const config = getConfigEngineSync();
  const roles = config.getRoles();
  const clientAdminRole = Object.keys(roles).find(r => r === 'client_admin');
  return user?.role === clientAdminRole;
}

export function isAuditor(user) {
  const config = getConfigEngineSync();
  const roles = config.getRoles();
  const auditRoles = Object.keys(roles).filter(r => !r.includes('client'));
  return auditRoles.includes(user?.role);
}

const CLIENT_VISIBLE_ENTITIES = ['engagement', 'rfi', 'review', 'file', 'message', 'rfi_response'];

export function canClientAccessEntity(user, entityName) {
  if (!isClientUser(user)) return true;
  return CLIENT_VISIBLE_ENTITIES.includes(entityName);
}

export function getNavItems(user, domain) {
  const items = [];
  if (domain === 'mwr') return getMwrNavItems(user);
  if (canList(user, 'engagement')) items.push({ href: '/engagement', label: 'Engagements' });
  if (canList(user, 'client')) items.push({ href: '/client', label: 'Clients' });
  if (canList(user, 'rfi')) items.push({ href: '/rfi', label: 'RFIs' });
  if (canList(user, 'review')) items.push({ href: '/review', label: 'Reviews' });
  if (canList(user, 'user')) items.push({ href: '/user', label: 'Users' });
  if (canList(user, 'team')) items.push({ href: '/team', label: 'Teams' });
  if (canList(user, 'tender')) items.push({ href: '/tender', label: 'Tenders' });
  if (canList(user, 'checklist')) items.push({ href: '/checklist', label: 'Checklists' });
  if (canList(user, 'file')) items.push({ href: '/file', label: 'Files' });
  if (canList(user, 'letter')) items.push({ href: '/letter', label: 'Letters' });
  return items;
}

export function getMwrNavItems(user) {
  const items = [];
  if (canCreate(user, 'review')) items.push({ href: '/review/new', label: 'Start Review' });
  if (canList(user, 'review')) items.push({ href: '/reviews/active', label: 'Active Reviews' });
  if (canList(user, 'review')) items.push({ href: '/reviews/priority', label: 'Priority Reviews' });
  if (canList(user, 'review')) items.push({ href: '/reviews/history', label: 'History' });
  if (canList(user, 'review')) items.push({ href: '/reviews/archive', label: 'Archive' });
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
