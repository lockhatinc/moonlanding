import { list, update, remove, get } from '@/engine';
import { hookEngine } from './hook-engine';
import { queueEmail } from '@/engine/email-templates';

export function registerDatabaseTriggers() {
  hookEngine.register('client.after.update', async ({ oldData, newData }) => {
    if (oldData.status !== 'Inactive' && newData.status === 'Inactive') {
      await handleClientInactiveUpdate(newData.id);
    }
  });

  hookEngine.register('team.after.update', async ({ oldData, newData }) => {
    const oldUsers = oldData.users || [];
    const newUsers = newData.users || [];
    const removedUsers = oldUsers.filter(userId => !newUsers.includes(userId));

    if (removedUsers.length > 0) {
      await handleTeamUsersUpdateMonitor(newData.id, removedUsers);
    }
  });

  hookEngine.register('engagement_letter.after.create', async ({ newData }) => {
    await updateEngagementLetterStatus(newData.engagement_id);
  });

  hookEngine.register('engagement_letter.after.update', async ({ oldData, newData }) => {
    if (oldData.status !== newData.status) {
      await updateEngagementLetterStatus(newData.engagement_id);
    }
  });

  hookEngine.register('engagement.after.update', async ({ oldData, newData }) => {
    if (oldData.team_id !== newData.team_id) {
      await updateEngagementTeamStatus(newData.id);
    }
  });

  hookEngine.register('rfi.after.update', async ({ oldData, newData }) => {
    if (oldData.status !== newData.status) {
      await updateEngagementRfiResponseStatus(newData.engagement_id);
    }
  });

  hookEngine.register('review.after.create', async ({ newData, user }) => {
    await notifyReviewCreated(newData, user);
  });

  hookEngine.register('review.after.update', async ({ oldData, newData }) => {
    const oldCollaborators = oldData.collaborators || [];
    const newCollaborators = newData.collaborators || [];
    const added = newCollaborators.filter(id => !oldCollaborators.includes(id));
    const removed = oldCollaborators.filter(id => !newCollaborators.includes(id));

    if (added.length > 0 || removed.length > 0) {
      await notifyCollaboratorChanges(newData, added, removed);
    }
  });

  console.log('[Database Triggers] Registered: clientInactiveUpdate, teamUsersUpdateMonitor, computedFields, notifications');
}

async function handleClientInactiveUpdate(clientId) {
  console.log(`[Trigger:clientInactiveUpdate] Client ${clientId} set to Inactive`);

  try {
    const engagements = list('engagement', { client_id: clientId });

    let repeatUpdated = 0;
    let deleted = 0;

    for (const engagement of engagements) {
      update('engagement', engagement.id, { repeat_interval: 'once' });
      repeatUpdated++;

      if (engagement.stage === 'info_gathering' && (engagement.progress === 0 || !engagement.progress)) {
        remove('engagement', engagement.id);
        deleted++;
      }
    }

    console.log(`[Trigger:clientInactiveUpdate] Updated ${repeatUpdated} engagements to repeat_interval='once', deleted ${deleted} engagements (InfoGathering + 0% progress)`);

    return { success: true, repeatUpdated, deleted };
  } catch (error) {
    console.error(`[Trigger:clientInactiveUpdate] Error:`, error.message);
    throw error;
  }
}

async function handleTeamUsersUpdateMonitor(teamId, removedUserIds) {
  console.log(`[Trigger:teamUsersUpdateMonitor] Team ${teamId} removed users:`, removedUserIds);

  try {
    const engagements = list('engagement', { team_id: teamId, status: 'active' });

    let updated = 0;

    for (const engagement of engagements) {
      const currentUsers = engagement.users || [];
      const updatedUsers = currentUsers.filter(userId => !removedUserIds.includes(userId));

      if (updatedUsers.length !== currentUsers.length) {
        update('engagement', engagement.id, { users: updatedUsers });
        updated++;
      }
    }

    console.log(`[Trigger:teamUsersUpdateMonitor] Removed users from ${updated} active engagements`);

    return { success: true, updated };
  } catch (error) {
    console.error(`[Trigger:teamUsersUpdateMonitor] Error:`, error.message);
    throw error;
  }
}

async function updateEngagementLetterStatus(engagementId) {
  try {
    const letters = list('engagement_letter', { engagement_id: engagementId, status: 'accepted' });
    const hasLetter = (letters && letters.length > 0) || false;
    await update('engagement', engagementId, { has_engagement_letter: hasLetter });
    console.log(`[Trigger:has_engagement_letter] Engagement ${engagementId} updated to ${hasLetter}`);
  } catch (error) {
    console.error(`[Trigger:has_engagement_letter] Error for engagement ${engagementId}:`, error.message);
  }
}

async function updateEngagementTeamStatus(engagementId) {
  try {
    const engagement = get('engagement', engagementId);
    const hasTeam = !!(engagement && engagement.team_id);
    await update('engagement', engagementId, { has_team: hasTeam });
    console.log(`[Trigger:has_team] Engagement ${engagementId} updated to ${hasTeam}`);
  } catch (error) {
    console.error(`[Trigger:has_team] Error for engagement ${engagementId}:`, error.message);
  }
}

async function updateEngagementRfiResponseStatus(engagementId) {
  try {
    const unresolvedRfis = list('rfi', { engagement_id: engagementId, status: 0 });
    const allResolved = !unresolvedRfis || unresolvedRfis.length === 0;
    await update('engagement', engagementId, { has_rfi_responses: allResolved });
    console.log(`[Trigger:has_rfi_responses] Engagement ${engagementId} updated to ${allResolved}`);
  } catch (error) {
    console.error(`[Trigger:has_rfi_responses] Error for engagement ${engagementId}:`, error.message);
  }
}

async function notifyReviewCreated(review, user) {
  try {
    const team = get('team', review.team_id);
    if (!team) {
      console.warn(`[Trigger:notifyReviewCreated] Team ${review.team_id} not found`);
      return;
    }

    await queueEmail('review_created', {
      review,
      user,
      created_by: user?.email || user?.name || 'Unknown',
      team_name: team.name,
      financial_year: review.financial_year || new Date().getFullYear(),
      recipients: 'team_partners'
    });

    console.log(`[Trigger:notifyReviewCreated] Queued email notification for review ${review.id} to team partners`);
  } catch (error) {
    console.error(`[Trigger:notifyReviewCreated] Error queueing email for review ${review.id}:`, error.message);
  }
}

async function notifyCollaboratorChanges(review, addedUserIds, removedUserIds) {
  try {
    console.log(`[Trigger:notifyCollaboratorChanges] Review ${review.id}: ${addedUserIds.length} added, ${removedUserIds.length} removed`);

    for (const userId of addedUserIds) {
      const user = get('user', userId);
      if (!user) continue;

      await queueEmail('collaborator_added', {
        review,
        user,
        access_type: 'Collaborator',
        expires_at: review.collaborator_expiry_date || 'No expiry',
        added_by: 'System',
        recipients: 'user'
      });
    }

    for (const userId of removedUserIds) {
      const user = get('user', userId);
      if (!user) continue;

      await queueEmail('collaborator_removed', {
        review,
        user,
        removed_by: 'System',
        recipients: 'user'
      });
    }

    console.log(`[Trigger:notifyCollaboratorChanges] Queued ${addedUserIds.length + removedUserIds.length} email notifications`);
  } catch (error) {
    console.error(`[Trigger:notifyCollaboratorChanges] Error queueing emails for review ${review.id}:`, error.message);
  }
}

export { handleClientInactiveUpdate, handleTeamUsersUpdateMonitor, updateEngagementLetterStatus, updateEngagementTeamStatus, updateEngagementRfiResponseStatus, notifyReviewCreated, notifyCollaboratorChanges };
