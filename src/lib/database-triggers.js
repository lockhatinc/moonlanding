import { list, update, remove, get } from '@/engine';
import { hookEngine } from './hook-engine';

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

  console.log('[Database Triggers] Registered: clientInactiveUpdate, teamUsersUpdateMonitor');
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

export { handleClientInactiveUpdate, handleTeamUsersUpdateMonitor };
