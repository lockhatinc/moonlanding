'use server';

import { list, get, remove, create, update } from '@/engine';
import { dateToSeconds } from '@/lib/field-registry';
import { revalidatePath } from 'next/cache';
import { createCRUDActions, createEntityAction } from '@/lib/action-utils';

import { serverDeleteEntity } from '@/lib/action-factory';

export const deleteAction = async (entityName, id) => {
  return serverDeleteEntity(entityName, id);
};

export const mlConsolidateQueries = createEntityAction('review', 'mlConsolidateQueries', 'edit',
  async (_user, _spec, reviewId) => {
    const review = get('review', reviewId);
    if (!review) throw new Error('Review not found');

    const highlights = list('highlight', { review_id: reviewId });
    if (!highlights.length) throw new Error('No queries to consolidate');

    const textHighlights = highlights.filter(h => h.type === 'text' && !h.resolved);
    if (textHighlights.length < 2) throw new Error('Need at least 2 unresolved text queries to consolidate');

    const grouped = {};
    for (const h of textHighlights) {
      const key = (h.comment || '').substring(0, 50).toLowerCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(h.id);
    }

    let consolidated = 0;
    for (const [_, ids] of Object.entries(grouped)) {
      if (ids.length > 1) {
        for (let i = 1; i < ids.length; i++) {
          remove('highlight', ids[i]);
          consolidated++;
        }
      }
    }

    revalidatePath(`/review/${reviewId}`);
    return { consolidated, remaining: highlights.length - consolidated };
  }
);

export const pushToFriday = createEntityAction('review', 'pushToFriday', 'edit',
  async (user, _spec, reviewId) => {
    const review = get('review', reviewId);
    if (!review) throw new Error('Review not found');

    const highlights = list('highlight', { review_id: reviewId });
    const unresolved = highlights.filter(h => !h.resolved);

    if (!unresolved.length) throw new Error('No unresolved queries to push');

    for (const h of unresolved) {
      if (!h.rfi_id) {
        const rfi = create('rfi', {
          engagement_id: review.friday_link || null,
          question: h.comment || h.content || '',
          client_status: 'pending',
          auditor_status: 'requested',
        }, user);
        update('highlight', h.id, { rfi_id: rfi.id });
      }
    }

    revalidatePath(`/review/${reviewId}`);
    return { pushed: unresolved.length };
  }
);

export const sendRfiReminder = createEntityAction('rfi', 'sendRfiReminder', 'edit',
  async (_user, _spec, rfiId) => {
    const rfi = get('rfi', rfiId);
    if (!rfi) throw new Error('RFI not found');

    const engagement = get('engagement', rfi.engagement_id);
    if (!engagement) throw new Error('Engagement not found');

    const clientUsers = list('client_user', { client_id: engagement.client_id, status: 'active' });
    if (!clientUsers.length) throw new Error('No active client users found');

    const { queueEmail } = await import('@/engine/email-templates');
    for (const cu of clientUsers) {
      await queueEmail('rfi_reminder', { rfi, engagement, user: cu });
    }

    revalidatePath(`/engagement/${engagement.id}`);
    return { reminded: clientUsers.length };
  }
);

export const toggleRfiFlag = createEntityAction('rfi', 'toggleRfiFlag', 'edit',
  async (user, _spec, rfiId) => {
    const rfi = get('rfi', rfiId);
    if (!rfi) throw new Error('RFI not found');

    update('rfi', rfiId, { flag: !rfi.flag }, user);
    const updated = get('rfi', rfiId);

    revalidatePath(`/engagement/${rfi.engagement_id}`);
    return { flagged: updated.flag };
  }
);

export const setBulkDeadline = createEntityAction('rfi', 'setBulkDeadline', 'edit',
  async (user, _spec, rfiIds, deadline) => {
    if (!Array.isArray(rfiIds) || !rfiIds.length) throw new Error('No RFIs specified');
    if (!deadline) throw new Error('Deadline required');

    const deadlineTime = dateToSeconds(new Date(deadline));
    let updated = 0;

    for (const id of rfiIds) {
      const rfi = get('rfi', id);
      if (rfi) {
        update('rfi', id, { deadline_date: deadlineTime }, user);
        updated++;
      }
    }

    if (updated > 0) {
      const firstRfi = get('rfi', rfiIds[0]);
      if (firstRfi) revalidatePath(`/engagement/${firstRfi.engagement_id}`);
    }

    return { updated };
  }
);
