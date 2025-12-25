import { create, update, get, list } from '@/engine';

const DEFAULT_EXPIRY_DAYS = 7;
const MAX_EXPIRY_DAYS = 30;

export function validateExpiryDate(expiresAt, maxExpiryDays = MAX_EXPIRY_DAYS) {
  if (!expiresAt) return null; // Permanent access

  const now = Math.floor(new Date().getTime() / 1000);
  const maxAllowedTime = now + (maxExpiryDays * 24 * 60 * 60);

  if (expiresAt <= now) {
    throw new Error('Expiry date must be in the future');
  }

  if (expiresAt > maxAllowedTime) {
    throw new Error(`Expiry date cannot exceed ${maxExpiryDays} days from now`);
  }

  return expiresAt;
}

export function addCollaborator(reviewId, email, options = {}) {
  const { expiresAt, isPermanent = false, reason = '' } = options;

  let finalExpiresAt = null;
  let finalIsPermanent = true;

  if (expiresAt) {
    finalExpiresAt = validateExpiryDate(expiresAt);
    finalIsPermanent = false;
  }

  const collaborator = {
    review_id: reviewId,
    email,
    expires_at: finalExpiresAt,
    is_permanent: finalIsPermanent,
    created_at: Math.floor(new Date().getTime() / 1000),
    created_by: options.createdBy || 'system',
    reason,
    access_type: finalIsPermanent ? 'permanent' : 'temporary'
  };

  const collaboratorId = create('collaborator', collaborator, { id: options.createdBy || 'system', role: 'partner' });

  console.log(`[collaborator-access] Added collaborator ${email} to review ${reviewId}, expires: ${finalExpiresAt || 'never'}`);

  return collaboratorId;
}

export function checkCollaboratorAccess(reviewId, userId) {
  // Check if user is collaborator on review or original team member
  const collaborators = list('collaborator', { review_id: reviewId });

  for (const collab of collaborators) {
    // Check if this user is the collaborator and not expired
    if (collab.user_id === userId || collab.email === getUserEmail(userId)) {
      if (hasExpired(collab)) {
        return false;
      }
      return true;
    }
  }

  return false;
}

export function hasExpired(collaborator) {
  if (collaborator.is_permanent) return false;
  if (!collaborator.expires_at) return false;

  const now = Math.floor(new Date().getTime() / 1000);
  return collaborator.expires_at <= now;
}

export function revokeCollaborator(collaboratorId, reason = 'manual_revoke', revokedBy = 'system') {
  const collaborator = get('collaborator', collaboratorId);
  if (!collaborator) throw new Error('Collaborator not found');

  update('collaborator', collaboratorId, {
    revoked_at: Math.floor(new Date().getTime() / 1000),
    revoked_by: revokedBy,
    revocation_reason: reason,
    access_type: 'revoked'
  }, { id: revokedBy, role: 'partner' });

  console.log(`[collaborator-access] Revoked access for collaborator ${collaboratorId}: ${reason}`);

  return true;
}

export function updateAccessExpiry(collaboratorId, newExpiresAt, updatedBy = 'system') {
  const collaborator = get('collaborator', collaboratorId);
  if (!collaborator) throw new Error('Collaborator not found');

  if (collaborator.is_permanent) {
    throw new Error('Cannot update expiry for permanent collaborators');
  }

  const oldExpiry = collaborator.expires_at;
  const validatedExpiry = validateExpiryDate(newExpiresAt);

  if (validatedExpiry <= oldExpiry) {
    throw new Error('New expiry must be after current expiry');
  }

  update('collaborator', collaboratorId, {
    expires_at: validatedExpiry,
    expiry_updated_at: Math.floor(new Date().getTime() / 1000),
    expiry_updated_by: updatedBy
  }, { id: updatedBy, role: 'partner' });

  console.log(`[collaborator-access] Updated expiry for collaborator ${collaboratorId} from ${oldExpiry} to ${validatedExpiry}`);

  return true;
}

export function getReviewCollaborators(reviewId) {
  const collaborators = list('collaborator', { review_id: reviewId });
  const now = Math.floor(new Date().getTime() / 1000);

  return collaborators.map(collab => ({
    id: collab.id,
    email: collab.email,
    accessType: collab.access_type,
    isPermanent: collab.is_permanent,
    expiresAt: collab.expires_at,
    daysUntilExpiry: collab.expires_at ? Math.ceil((collab.expires_at - now) / (24 * 60 * 60)) : null,
    isExpired: hasExpired(collab),
    createdAt: collab.created_at,
    createdBy: collab.created_by
  }));
}

export function getAccessStats(reviewId) {
  const collaborators = list('collaborator', { review_id: reviewId });
  const now = Math.floor(new Date().getTime() / 1000);

  const stats = {
    totalCollaborators: collaborators.length,
    permanentCount: 0,
    temporaryCount: 0,
    expiredCount: 0,
    expiringWithin7Days: 0
  };

  for (const collab of collaborators) {
    if (hasExpired(collab)) {
      stats.expiredCount++;
    } else if (collab.is_permanent) {
      stats.permanentCount++;
    } else {
      stats.temporaryCount++;

      if (collab.expires_at) {
        const daysUntil = (collab.expires_at - now) / (24 * 60 * 60);
        if (daysUntil <= 7 && daysUntil > 0) {
          stats.expiringWithin7Days++;
        }
      }
    }
  }

  return stats;
}

function getUserEmail(userId) {
  // In real implementation: fetch user and return email
  return null;
}
