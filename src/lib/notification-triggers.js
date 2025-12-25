import { list, get } from '@/engine';
import { hookEngine } from './hook-engine';
import { notificationService } from '@/services/notification.service';

export function registerNotificationTriggers() {
  hookEngine.register('review.after.create', async ({ newData }) => {
    await handleNewReviewAlert(newData);
  });

  hookEngine.register('review.after.update', async ({ oldData, newData }) => {
    const oldCollaborators = oldData.collaborators || [];
    const newCollaborators = newData.collaborators || [];

    const addedCollaborators = newCollaborators.filter(collab => !oldCollaborators.includes(collab));
    const removedCollaborators = oldCollaborators.filter(collab => !newCollaborators.includes(collab));

    if (addedCollaborators.length > 0 || removedCollaborators.length > 0) {
      await handleCollaboratorChanges(newData, addedCollaborators, removedCollaborators);
    }
  });

  hookEngine.register('collaborator.after.create', async ({ newData }) => {
    await handleCollaboratorAdded(newData);
  });

  hookEngine.register('collaborator.after.delete', async ({ oldData }) => {
    await handleCollaboratorRemoved(oldData);
  });

  console.log('[Notification Triggers] Registered: newReviewAlert, collaboratorChanges');
}

async function handleNewReviewAlert(review) {
  console.log(`[Trigger:NewReviewAlert] Review ${review.id} created`);

  try {
    if (!review.team_id) {
      console.log(`[Trigger:NewReviewAlert] No team assigned to review ${review.id}, skipping`);
      return;
    }

    const team = get('team', review.team_id);
    if (!team) {
      console.log(`[Trigger:NewReviewAlert] Team ${review.team_id} not found`);
      return;
    }

    const partners = list('user', { role: 'partner', status: 'active' }).filter(user => {
      const userTeams = user.teams || [];
      return userTeams.includes(team.id);
    });

    console.log(`[Trigger:NewReviewAlert] Found ${partners.length} partners in team ${team.name}`);

    for (const partner of partners) {
      await notificationService.send(
        partner.email,
        `New Review Created: ${review.name || review.id}`,
        `A new review has been created and assigned to your team (${team.name}).\n\nReview: ${review.name || review.id}\nCreated: ${new Date().toLocaleString()}`,
        {
          html: `
            <h2>New Review Created</h2>
            <p>A new review has been created and assigned to your team <strong>${team.name}</strong>.</p>
            <p><strong>Review:</strong> ${review.name || review.id}</p>
            <p><strong>Created:</strong> ${new Date().toLocaleString()}</p>
          `
        }
      );
      console.log(`[Trigger:NewReviewAlert] Sent email to partner ${partner.email}`);
    }

    return { success: true, notified: partners.length };
  } catch (error) {
    console.error(`[Trigger:NewReviewAlert] Error:`, error.message);
    throw error;
  }
}

async function handleCollaboratorChanges(review, addedCollaborators, removedCollaborators) {
  console.log(`[Trigger:CollaboratorChanges] Review ${review.id} - Added: ${addedCollaborators.length}, Removed: ${removedCollaborators.length}`);

  try {
    for (const collaboratorId of addedCollaborators) {
      const user = get('user', collaboratorId);
      if (user && user.email) {
        await notificationService.send(
          user.email,
          `You've been added as a collaborator`,
          `You have been added as a collaborator on review: ${review.name || review.id}`,
          {
            html: `
              <h2>Collaborator Access Granted</h2>
              <p>You have been added as a collaborator on the following review:</p>
              <p><strong>Review:</strong> ${review.name || review.id}</p>
              <p><strong>Added:</strong> ${new Date().toLocaleString()}</p>
            `
          }
        );
        console.log(`[Trigger:CollaboratorChanges] Notified added collaborator ${user.email}`);
      }
    }

    for (const collaboratorId of removedCollaborators) {
      const user = get('user', collaboratorId);
      if (user && user.email) {
        await notificationService.send(
          user.email,
          `Collaborator access removed`,
          `Your collaborator access has been removed from review: ${review.name || review.id}`,
          {
            html: `
              <h2>Collaborator Access Removed</h2>
              <p>Your collaborator access has been removed from the following review:</p>
              <p><strong>Review:</strong> ${review.name || review.id}</p>
              <p><strong>Removed:</strong> ${new Date().toLocaleString()}</p>
            `
          }
        );
        console.log(`[Trigger:CollaboratorChanges] Notified removed collaborator ${user.email}`);
      }
    }

    return { success: true, notified: addedCollaborators.length + removedCollaborators.length };
  } catch (error) {
    console.error(`[Trigger:CollaboratorChanges] Error:`, error.message);
    throw error;
  }
}

async function handleCollaboratorAdded(collaborator) {
  console.log(`[Trigger:CollaboratorAdded] Collaborator ${collaborator.id} added to review ${collaborator.review_id}`);

  try {
    const user = get('user', collaborator.user_id);
    if (!user || !user.email) {
      console.log(`[Trigger:CollaboratorAdded] User ${collaborator.user_id} not found or has no email`);
      return;
    }

    const review = get('review', collaborator.review_id);
    if (!review) {
      console.log(`[Trigger:CollaboratorAdded] Review ${collaborator.review_id} not found`);
      return;
    }

    await notificationService.send(
      user.email,
      `You've been added as a collaborator`,
      `You have been granted collaborator access to review: ${review.name || review.id}\n\nAccess expires: ${collaborator.expires_at ? new Date(collaborator.expires_at * 1000).toLocaleString() : 'Never'}`,
      {
        html: `
          <h2>Collaborator Access Granted</h2>
          <p>You have been granted collaborator access to the following review:</p>
          <p><strong>Review:</strong> ${review.name || review.id}</p>
          <p><strong>Role:</strong> ${collaborator.role || 'Collaborator'}</p>
          <p><strong>Access expires:</strong> ${collaborator.expires_at ? new Date(collaborator.expires_at * 1000).toLocaleString() : 'Never'}</p>
        `
      }
    );

    console.log(`[Trigger:CollaboratorAdded] Notified ${user.email}`);
    return { success: true, notified: 1 };
  } catch (error) {
    console.error(`[Trigger:CollaboratorAdded] Error:`, error.message);
    throw error;
  }
}

async function handleCollaboratorRemoved(collaborator) {
  console.log(`[Trigger:CollaboratorRemoved] Collaborator ${collaborator.id} removed from review ${collaborator.review_id}`);

  try {
    const user = get('user', collaborator.user_id);
    if (!user || !user.email) {
      console.log(`[Trigger:CollaboratorRemoved] User ${collaborator.user_id} not found or has no email`);
      return;
    }

    const review = get('review', collaborator.review_id);

    await notificationService.send(
      user.email,
      `Collaborator access revoked`,
      `Your collaborator access has been revoked from review: ${review?.name || collaborator.review_id}`,
      {
        html: `
          <h2>Collaborator Access Revoked</h2>
          <p>Your collaborator access has been revoked from the following review:</p>
          <p><strong>Review:</strong> ${review?.name || collaborator.review_id}</p>
          <p><strong>Revoked:</strong> ${new Date().toLocaleString()}</p>
        `
      }
    );

    console.log(`[Trigger:CollaboratorRemoved] Notified ${user.email}`);
    return { success: true, notified: 1 };
  } catch (error) {
    console.error(`[Trigger:CollaboratorRemoved] Error:`, error.message);
    throw error;
  }
}

export { handleNewReviewAlert, handleCollaboratorChanges, handleCollaboratorAdded, handleCollaboratorRemoved };
