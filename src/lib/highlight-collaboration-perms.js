import { get } from '@/engine';
import { checkCollaboratorAccess } from '@/lib/collaborator-access-control';

export const HIGHLIGHT_PERMISSIONS = {
  partner: {
    canCreate: true,
    canEdit: true,
    canEditOthers: true,
    canDelete: true,
    canResolve: true,
    canManageFlags: true,
    canManageFlagsOthers: true
  },
  manager: {
    canCreate: true,
    canEdit: true,
    canEditOthers: false,
    canDelete: false,
    canResolve: true,
    canResolveOthers: false,
    canManageFlags: true,
    canManageFlagsOthers: false
  },
  clerk: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canResolve: false,
    canManageFlags: false,
    viewOnly: true
  }
};

export function canCreateHighlight(user, review) {
  if (!user || !review) return false;

  const perms = HIGHLIGHT_PERMISSIONS[user.role];
  if (!perms) return false;

  if (!perms.canCreate) return false;

  // Check if user has access to review (collaborator or team member)
  return hasReviewAccess(user, review);
}

export function canEditHighlight(user, review, highlight) {
  if (!user || !review || !highlight) return false;

  const perms = HIGHLIGHT_PERMISSIONS[user.role];
  if (!perms) return false;

  if (!perms.canEdit) return false;

  // Partner can edit any highlight
  if (user.role === 'partner') {
    return hasReviewAccess(user, review);
  }

  // Manager/Clerk can only edit their own
  if (highlight.created_by === user.id) {
    return hasReviewAccess(user, review);
  }

  return false;
}

export function canDeleteHighlight(user, review, highlight) {
  if (!user || !review || !highlight) return false;

  const perms = HIGHLIGHT_PERMISSIONS[user.role];
  if (!perms) return false;

  if (!perms.canDelete) return false;

  // Only partner can delete
  if (user.role !== 'partner') return false;

  return hasReviewAccess(user, review);
}

export function canResolveHighlight(user, review, highlight) {
  if (!user || !review || !highlight) return false;

  const perms = HIGHLIGHT_PERMISSIONS[user.role];
  if (!perms) return false;

  if (!perms.canResolve) return false;

  // Partner can resolve any
  if (user.role === 'partner') {
    return hasReviewAccess(user, review);
  }

  // Manager can resolve their own
  if (user.role === 'manager' && highlight.created_by === user.id) {
    return hasReviewAccess(user, review);
  }

  return false;
}

export function canManageHighlightFlags(user, review) {
  if (!user || !review) return false;

  const perms = HIGHLIGHT_PERMISSIONS[user.role];
  if (!perms) return false;

  if (!perms.canManageFlags) return false;

  return hasReviewAccess(user, review);
}

export function canApplyFlagToHighlight(user, review, highlight) {
  if (!user || !review || !highlight) return false;

  const perms = HIGHLIGHT_PERMISSIONS[user.role];
  if (!perms) return false;

  // Partner can apply to any
  if (user.role === 'partner') {
    return canManageHighlightFlags(user, review);
  }

  // Manager can apply to own highlights
  if (user.role === 'manager' && highlight.created_by === user.id) {
    return canManageHighlightFlags(user, review);
  }

  return false;
}

export function canViewHighlights(user, review) {
  if (!user || !review) return false;

  // All users with review access can view highlights
  return hasReviewAccess(user, review);
}

export function getHighlightVisibility(user, review, highlight) {
  // Returns what user can see about a highlight
  const canView = canViewHighlights(user, review);

  if (!canView) {
    return {
      visible: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canResolve: false
    };
  }

  return {
    visible: true,
    canCreate: canCreateHighlight(user, review),
    canEdit: canEditHighlight(user, review, highlight),
    canDelete: canDeleteHighlight(user, review, highlight),
    canResolve: canResolveHighlight(user, review, highlight),
    canManageFlags: canManageHighlightFlags(user, review),
    createdBy: highlight.created_by,
    isOwnHighlight: highlight.created_by === user.id
  };
}

function hasReviewAccess(user, review) {
  if (!review) return false;

  // Check if user is in review's assigned team
  if (review.assigned_to && review.assigned_to.includes(user.id)) {
    return true;
  }

  // Check if user is a collaborator on the review
  if (checkCollaboratorAccess(review.id, user.id)) {
    return true;
  }

  // Partner can access any review
  if (user.role === 'partner') {
    return true;
  }

  return false;
}

export function getAccessibleHighlights(user, review) {
  if (!canViewHighlights(user, review)) {
    return [];
  }

  // In real implementation: fetch highlights and filter by visibility
  return [];
}
