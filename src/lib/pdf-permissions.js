export const PDF_PERMISSIONS = {
  VIEW: 'view',
  HIGHLIGHT: 'highlight',
  COMMENT: 'comment',
  ANNOTATE: 'annotate',
  DOWNLOAD: 'download',
  PRINT: 'print',
  SHARE: 'share',
  DELETE_HIGHLIGHT: 'delete_highlight',
  RESOLVE_HIGHLIGHT: 'resolve_highlight',
};

const ROLE_PERMISSIONS = {
  partner: Object.values(PDF_PERMISSIONS),
  manager: Object.values(PDF_PERMISSIONS),
  clerk: [PDF_PERMISSIONS.VIEW, PDF_PERMISSIONS.HIGHLIGHT, PDF_PERMISSIONS.COMMENT, PDF_PERMISSIONS.RESOLVE_HIGHLIGHT],
  client_admin: [PDF_PERMISSIONS.VIEW, PDF_PERMISSIONS.COMMENT, PDF_PERMISSIONS.DOWNLOAD],
  client_user: [PDF_PERMISSIONS.VIEW, PDF_PERMISSIONS.COMMENT],
  collaborator: [PDF_PERMISSIONS.VIEW, PDF_PERMISSIONS.HIGHLIGHT, PDF_PERMISSIONS.COMMENT, PDF_PERMISSIONS.RESOLVE_HIGHLIGHT],
};

export function getPdfPermissions(userRole) {
  return ROLE_PERMISSIONS[userRole] || [PDF_PERMISSIONS.VIEW];
}

export function canPerformAction(userRole, action) {
  const perms = getPdfPermissions(userRole);
  return perms.includes(action);
}

export function getToolbarActions(userRole) {
  const perms = getPdfPermissions(userRole);
  const actions = [];
  if (perms.includes(PDF_PERMISSIONS.HIGHLIGHT)) actions.push({ key: 'highlight', label: 'Highlight', icon: '&#9998;' });
  if (perms.includes(PDF_PERMISSIONS.ANNOTATE)) actions.push({ key: 'area', label: 'Area Select', icon: '&#9634;' });
  if (perms.includes(PDF_PERMISSIONS.COMMENT)) actions.push({ key: 'comment', label: 'Comment', icon: '&#128172;' });
  if (perms.includes(PDF_PERMISSIONS.DOWNLOAD)) actions.push({ key: 'download', label: 'Download', icon: '&#128190;' });
  if (perms.includes(PDF_PERMISSIONS.PRINT)) actions.push({ key: 'print', label: 'Print', icon: '&#128424;' });
  if (perms.includes(PDF_PERMISSIONS.SHARE)) actions.push({ key: 'share', label: 'Share', icon: '&#128279;' });
  return actions;
}
