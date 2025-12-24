import { list, get, update, create } from '@/lib/query-engine';

const logActivity = (entityType, entityId, action, message, user, details) => {
  try {
    create('activity_log', {
      entity_type: entityType,
      entity_id: entityId,
      action,
      message,
      details: details ? JSON.stringify(details) : null,
      user_email: user?.email || 'system',
      created_at: Math.floor(Date.now() / 1000)
    }, user);
  } catch (error) {
    console.error('[checklist-hooks] Failed to log activity:', error);
  }
};

const checkAndCompleteChecklist = (checklistId) => {
  try {
    const items = list('checklist_item', { checklist_id: checklistId });

    if (items.length === 0) {
      return;
    }

    const allDone = items.every(item => item.is_done === true || item.is_done === 1);
    const checklist = get('checklist', checklistId);

    if (!checklist) {
      console.error('[checklist-hooks] Checklist not found:', checklistId);
      return;
    }

    if (allDone && checklist.status !== 'completed') {
      update('checklist', checklistId, {
        status: 'completed',
        completed_at: Math.floor(Date.now() / 1000)
      });
      console.log(`[checklist-hooks] Checklist ${checklistId} auto-completed (all ${items.length} items done)`);
    } else if (!allDone && checklist.status === 'completed') {
      update('checklist', checklistId, {
        status: 'in_progress',
        completed_at: null
      });
      console.log(`[checklist-hooks] Checklist ${checklistId} reopened (not all items done)`);
    }
  } catch (error) {
    console.error('[checklist-hooks] Error in checkAndCompleteChecklist:', error);
  }
};

export const registerChecklistHooks = (hookEngine) => {
  hookEngine.on('create:checklist_item:after', async ({ entity, data, user }) => {
    if (data.checklist_id) {
      logActivity('checklist_item', data.id, 'create', `Item "${data.name}" created`, user, {
        checklist_id: data.checklist_id,
        is_done: data.is_done
      });

      checkAndCompleteChecklist(data.checklist_id);
    }
  });

  hookEngine.on('update:checklist_item:after', async ({ entity, id, data, user, prev }) => {
    const item = data;

    if (item.checklist_id) {
      const changes = [];

      if (prev && item.is_done !== prev.is_done) {
        changes.push(`marked as ${item.is_done ? 'done' : 'not done'}`);
      }

      if (prev && item.name !== prev.name) {
        changes.push(`renamed to "${item.name}"`);
      }

      if (changes.length > 0) {
        logActivity('checklist_item', id, 'update', `Item ${changes.join(', ')}`, user, {
          checklist_id: item.checklist_id,
          is_done: item.is_done,
          previous_is_done: prev?.is_done
        });
      }

      checkAndCompleteChecklist(item.checklist_id);
    }
  });

  hookEngine.on('delete:checklist_item:after', async ({ entity, id, record, user }) => {
    if (record.checklist_id) {
      logActivity('checklist_item', id, 'delete', `Item "${record.name}" deleted`, user, {
        checklist_id: record.checklist_id
      });

      checkAndCompleteChecklist(record.checklist_id);
    }
  });

  console.log('[checklist-hooks] Registered checklist item hooks');
};
