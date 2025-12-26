export const mwrPermissions = {
  canCreateReview: (user) => {
    return user.role === 'partner' || user.role === 'manager';
  },

  canAddChecklist: (user) => {
    return user.role === 'partner' || user.role === 'manager';
  },

  canRemoveChecklist: (user) => {
    return user.role === 'partner';
  },

  canDeleteAttachment: (user) => {
    return user.role === 'partner';
  },

  canResolveHighlight: (user, highlight) => {
    if (user.role === 'partner') return true;
    if (user.role === 'manager') return highlight.created_by === user.id;
    return false;
  },

  canCreateFlagType: (user) => {
    return user.role === 'partner';
  },

  canApplyFlag: (user) => {
    return user.role === 'partner' || user.role === 'manager';
  },

  canViewFlag: (user) => {
    return user.role !== 'none';
  },

  canArchiveReview: (user) => {
    return user.role === 'partner';
  },

  canManageDeadline: (user) => {
    return user.role === 'partner';
  },

  enforcePermission: (user, permission, options = {}) => {
    const permissionMap = {
      'review:create': mwrPermissions.canCreateReview,
      'checklist:add': mwrPermissions.canAddChecklist,
      'checklist:remove': mwrPermissions.canRemoveChecklist,
      'attachment:delete': mwrPermissions.canDeleteAttachment,
      'highlight:resolve': (u) => mwrPermissions.canResolveHighlight(u, options.highlight),
      'flag:create_type': mwrPermissions.canCreateFlagType,
      'flag:apply': mwrPermissions.canApplyFlag,
      'flag:view': mwrPermissions.canViewFlag,
      'review:archive': mwrPermissions.canArchiveReview,
      'review:manage_deadline': mwrPermissions.canManageDeadline,
    };

    const check = permissionMap[permission];
    if (!check) throw new Error(`Unknown permission: ${permission}`);
    return check(user);
  },
};
