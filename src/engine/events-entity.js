import { list, get, update, create, remove, count } from '../engine.js';
import { queueEmail } from './email-templates';
import { secondsToDate } from '@/lib/field-registry';

function logActivity(entityType, entityId, action, message, user, details) {
  create('activity_log', { entity_type: entityType, entity_id: entityId, action, message, details: details ? JSON.stringify(details) : null, user_email: user?.email }, user);
}

async function updateEngagementProgress(engagementId) {
  const rfis = list('rfi', { engagement_id: engagementId });
  if (rfis.length === 0) return;
  const completed = rfis.filter(r => r.status === 1 || r.client_status === 'completed');
  update('engagement', engagementId, { progress: Math.round((completed.length / rfis.length) * 100) });
}

export const entityHandlers = {
  engagement: {
    afterCreate: async (engagement, user) => {
      if (engagement.client_id) {
        const engagementCount = count('engagement', { client_id: engagement.client_id });
        update('client', engagement.client_id, { engagement_count: engagementCount });
      }
      if (engagement.stage === 'info_gathering') {
        await queueEmail('engagement_info_gathering', { engagement, recipients: 'client_users' });
      }
      logActivity('engagement', engagement.id, 'create', `Engagement "${engagement.name}" created`, user);
    },

    afterUpdate: async (engagement, changes, prev, user) => {
      if (changes.stage && changes.stage !== prev.stage) {
        logActivity('engagement', engagement.id, 'stage_change', `Stage: ${prev.stage} → ${changes.stage}`, user, { from: prev.stage, to: changes.stage });

        const stageActions = {
          commencement: () => queueEmail('engagement_commencement', { engagement, recipients: 'client_users' }),
          finalization: () => queueEmail('engagement_finalization', { engagement, recipients: 'client_admin' }),
          close_out: () => {
            if (engagement.letter_auditor_status !== 'accepted' && engagement.progress > 0) {
              throw new Error('Cannot close out: Letter must be accepted or progress must be 0%');
            }
          },
        };
        await stageActions[changes.stage]?.();
      }
      if (changes.status && changes.status !== prev.status) {
        logActivity('engagement', engagement.id, 'status_change', `Status: ${prev.status} → ${changes.status}`, user);
      }
      if (changes.commencement_date && changes.commencement_date !== prev.commencement_date) {
        await queueEmail('engagement_date_change', { engagement, field: 'commencement_date', recipients: 'team_members' });
      }
    },

    afterDelete: async (engagement) => {
      if (engagement.client_id) {
        const engagementCount = count('engagement', { client_id: engagement.client_id });
        update('client', engagement.client_id, { engagement_count: engagementCount });
      }
    },
  },

  client: {
    afterUpdate: async (client, changes, prev, user) => {
      if (changes.status === 'inactive' && prev.status !== 'inactive') {
        const engagements = list('engagement', { client_id: client.id });
        for (const e of engagements) {
          if (e.repeat_interval !== 'once') update('engagement', e.id, { repeat_interval: 'once' });
          if (e.stage === 'info_gathering' && e.progress === 0) remove('engagement', e.id);
        }
        logActivity('client', client.id, 'status_change', `Client inactive. Updated ${engagements.length} engagements.`, user);
      }
    },
  },

  rfi: {
    afterUpdate: async (rfi, changes, prev, user) => {
      if (changes.status !== undefined && changes.status !== prev.status) {
        if (changes.status === 1 && !rfi.date_resolved) {
          update('rfi', rfi.id, { date_resolved: Math.floor(Date.now() / 1000) });
        }
        if (changes.client_status && changes.client_status !== prev.client_status) {
          await queueEmail('rfi_status_change', { rfi, from: prev.client_status, to: changes.client_status, recipients: 'assigned_users' });
        }
        logActivity('rfi', rfi.id, 'status_change', `Status: ${prev.status} → ${changes.status}`, user);
      }
      if (changes.deadline && changes.deadline !== prev.deadline) {
        await queueEmail('rfi_deadline_change', { rfi, newDeadline: changes.deadline, recipients: 'assigned_users' });
        const date = secondsToDate(changes.deadline);
        const dateStr = date ? date.toLocaleDateString() : changes.deadline;
        logActivity('rfi', rfi.id, 'update', `Deadline: ${dateStr}`, user);
      }
      if (changes.status !== undefined || changes.client_status !== undefined) {
        await updateEngagementProgress(rfi.engagement_id);
      }
    },
  },

  team: {
    afterUpdate: async (team, changes, prev) => {
      if (changes.users && prev.users) {
        const prevUsers = JSON.parse(prev.users || '[]');
        const newUsers = JSON.parse(changes.users || '[]');
        const removed = prevUsers.filter(u => !newUsers.includes(u));
        if (removed.length > 0) {
          for (const e of list('engagement', { team_id: team.id })) {
            const users = JSON.parse(e.users || '[]').filter(u => !removed.includes(u));
            if (users.length !== JSON.parse(e.users || '[]').length) {
              update('engagement', e.id, { users: JSON.stringify(users) });
            }
          }
        }
      }
    },
  },

  review: {
    afterCreate: async (review, user) => {
      await queueEmail('review_created', { review, recipients: 'team_partners' });
      if (review.template_id) {
        const template = get('template', review.template_id);
        for (const id of JSON.parse(template?.default_checklists || '[]')) {
          const checklist = get('checklist', id);
          if (checklist) create('review_checklist', { review_id: review.id, checklist_id: id, items: checklist.section_items || checklist.items, status: 'pending' }, user);
        }
      }
      logActivity('review', review.id, 'create', `Review "${review.name}" created`, user);
    },

    afterUpdate: async (review, changes, prev, user) => {
      if (changes.status && changes.status !== prev.status) {
        await queueEmail('review_status_change', { review, from: prev.status, to: changes.status, recipients: 'team_members' });
        logActivity('review', review.id, 'status_change', `Status: ${prev.status} → ${changes.status}`, user);
      }
      if (changes.collaborators && changes.collaborators !== prev.collaborators) {
        const added = JSON.parse(changes.collaborators || '[]').filter(c => !JSON.parse(prev.collaborators || '[]').find(p => p.id === c.id));
        for (const c of added) await queueEmail('collaborator_added', { review, collaborator: c, recipients: 'collaborator' });
      }
    },
  },

  highlight: {
    beforeDelete: async (highlight, user) => {
      create('removed_highlight', { review_id: highlight.review_id, original_id: highlight.id, highlight_data: JSON.stringify(highlight) }, user);
    },
  },

  collaborator: {
    afterCreate: async (collaborator, user) => {
      const review = get('review', collaborator.review_id);
      const collabUser = get('user', collaborator.user_id);
      if (review && collabUser) {
        await queueEmail('collaborator_added', { review, collaborator: collabUser, type: collaborator.type, expiresAt: collaborator.expires_at, recipients: 'collaborator' });
      }
    },
  },
};
