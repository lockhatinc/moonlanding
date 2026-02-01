import { defineAbility } from '@casl/ability';

const roles = {
  partner: 'partner',
  manager: 'manager',
  clerk: 'clerk',
  client_admin: 'client_admin',
  client_user: 'client_user',
};

const roleHierarchy = {
  partner: ['partner', 'manager', 'clerk', 'client_admin', 'client_user'],
  manager: ['manager', 'clerk', 'client_user'],
  clerk: ['clerk', 'client_user'],
  client_admin: ['client_admin', 'client_user'],
  client_user: ['client_user'],
};

export function defineAbilityFor(user) {
  return defineAbility((can, cannot) => {
    if (!user) {
      cannot('manage', 'all');
      return;
    }

    const role = user.role || 'client_user';

    if (role === 'partner') {
      can('manage', 'all');
      return;
    }

    if (role === 'manager') {
      can('manage', ['engagement', 'review', 'comment', 'highlight']);
      can('read', ['user', 'client', 'team', 'checklist']);
      can('create', ['engagement', 'review', 'comment', 'checklist']);
      can('update', ['engagement', 'review'], { created_by_id: user.id });
      cannot('delete', 'user');
      return;
    }

    if (role === 'clerk') {
      can('read', ['engagement', 'review', 'comment', 'user', 'client', 'checklist', 'highlight']);
      can('create', ['comment', 'checklist']);
      can('update', ['comment', 'checklist'], { created_by_id: user.id });
      cannot('manage', 'user');
      cannot('create', 'engagement');
      cannot('create', 'review');
      return;
    }

    if (role === 'client_admin') {
      can('read', 'engagement');
      can('read', 'review');
      can('read', 'comment');
      can('create', 'comment');
      can('update', 'comment', { created_by_id: user.id });
      can('read', 'client', { id: user.client_id });
      can('read', 'client_user');
      cannot('manage', 'user');
      cannot('create', 'engagement');
      return;
    }

    if (role === 'client_user') {
      can('read', 'engagement');
      can('read', 'review');
      can('read', 'comment');
      can('create', 'comment');
      can('update', 'comment', { created_by_id: user.id });
      cannot('manage', 'user');
      cannot('create', 'engagement');
      cannot('delete', 'comment');
      return;
    }
  });
}

export function isInheritedRole(userRole, requiredRole) {
  if (!userRole || !requiredRole) return false;
  const inherited = roleHierarchy[userRole] || [];
  return inherited.includes(requiredRole);
}

export function hasRole(user, requiredRole) {
  if (!user || !user.role) return false;
  return user.role === requiredRole || isInheritedRole(user.role, requiredRole);
}

export function canPerformAction(ability, action, subject) {
  try {
    return ability.can(action, subject);
  } catch (e) {
    return false;
  }
}

export function getAllRoles() {
  return Object.values(roles);
}

export function getRoleLabel(role) {
  const labels = {
    partner: 'Partner',
    manager: 'Manager',
    clerk: 'Clerk',
    client_admin: 'Client Admin',
    client_user: 'Client User',
  };
  return labels[role] || role;
}

export function getRoleDescription(role) {
  const descriptions = {
    partner: 'Full system access, manage all users and configurations',
    manager: 'Can manage engagements, reviews, and team members',
    clerk: 'Can view and create comments, limited to assigned items',
    client_admin: 'Can manage client users and view client data',
    client_user: 'Can view data and create comments',
  };
  return descriptions[role] || '';
}

export function getPermissionMatrix() {
  return {
    partner: {
      user: ['list', 'read', 'create', 'update', 'delete'],
      engagement: ['list', 'read', 'create', 'update', 'delete'],
      review: ['list', 'read', 'create', 'update', 'delete'],
      comment: ['list', 'read', 'create', 'update', 'delete'],
      checklist: ['list', 'read', 'create', 'update', 'delete'],
      highlight: ['list', 'read', 'create', 'update', 'delete'],
      client: ['list', 'read', 'create', 'update', 'delete'],
      team: ['list', 'read', 'create', 'update', 'delete'],
    },
    manager: {
      user: ['list', 'read'],
      engagement: ['list', 'read', 'create', 'update'],
      review: ['list', 'read', 'create', 'update'],
      comment: ['list', 'read', 'create', 'update'],
      checklist: ['list', 'read', 'create', 'update'],
      highlight: ['list', 'read'],
      client: ['list', 'read'],
      team: ['list', 'read'],
    },
    clerk: {
      user: [],
      engagement: ['list', 'read'],
      review: ['list', 'read'],
      comment: ['list', 'read', 'create', 'update'],
      checklist: ['list', 'read', 'create', 'update'],
      highlight: ['list', 'read'],
      client: [],
      team: [],
    },
    client_admin: {
      user: [],
      engagement: ['list', 'read'],
      review: ['list', 'read'],
      comment: ['list', 'read', 'create', 'update'],
      checklist: ['list', 'read'],
      highlight: ['list', 'read'],
      client: ['read'],
      team: [],
    },
    client_user: {
      user: [],
      engagement: ['list', 'read'],
      review: ['list', 'read'],
      comment: ['list', 'read', 'create'],
      checklist: ['list', 'read'],
      highlight: ['list', 'read'],
      client: [],
      team: [],
    },
  };
}
