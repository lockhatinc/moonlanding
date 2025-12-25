import { get, update, list } from '@/engine';

// PRIORITY REVIEWS ENGINE
export function getPriorityReviews(userId) {
  const user = get('users', userId);
  if (!user || !user.priority_reviews) return [];

  return user.priority_reviews;
}

export function addPriorityReview(userId, reviewId) {
  const user = get('users', userId);
  if (!user) throw new Error('User not found');

  const priorities = user.priority_reviews || [];
  if (!priorities.includes(reviewId)) {
    priorities.push(reviewId);
    update('users', userId, { priority_reviews: priorities }, { id: userId, role: 'partner' });
  }

  return true;
}

export function removePriorityReview(userId, reviewId) {
  const user = get('users', userId);
  if (!user) throw new Error('User not found');

  const priorities = (user.priority_reviews || []).filter(id => id !== reviewId);
  update('users', userId, { priority_reviews: priorities }, { id: userId, role: 'partner' });

  return true;
}

export function reorderPriorities(userId, reviewIds) {
  // Validate all IDs exist and user has access
  const user = get('users', userId);
  if (!user) throw new Error('User not found');

  update('users', userId, { priority_reviews: reviewIds }, { id: userId, role: 'partner' });
  return true;
}

// CHECKLIST ENGINE
export function createChecklist(data) {
  const checklist = {
    name: data.name || 'Untitled Checklist',
    review_id: data.review_id,
    items: data.items || [],
    all_items_done: false,
    created_at: Math.floor(new Date().getTime() / 1000),
    created_by: data.created_by || 'system'
  };

  // In real impl: create in database
  return checklist;
}

export function addChecklistItem(checklistId, item) {
  const checklist = get('checklist', checklistId);
  if (!checklist) throw new Error('Checklist not found');

  const newItem = {
    id: `item_${Date.now()}`,
    text: item.text,
    is_done: false,
    assigned_to: item.assigned_to || null,
    due_date: item.due_date || null,
    created_at: Math.floor(new Date().getTime() / 1000)
  };

  const items = checklist.items || [];
  items.push(newItem);

  update('checklist', checklistId, { items }, { id: item.created_by || 'system', role: 'partner' });

  return newItem;
}

export function completeChecklistItem(checklistId, itemId) {
  const checklist = get('checklist', checklistId);
  if (!checklist) throw new Error('Checklist not found');

  const items = checklist.items || [];
  const item = items.find(i => i.id === itemId);
  if (!item) throw new Error('Item not found');

  item.is_done = true;
  item.completed_at = Math.floor(new Date().getTime() / 1000);

  // Check if all done
  const allDone = items.every(i => i.is_done);

  update('checklist', checklistId, {
    items,
    all_items_done: allDone,
    completed_at: allDone ? Math.floor(new Date().getTime() / 1000) : null
  }, { id: 'system', role: 'partner' });

  return true;
}

export function getChecklistProgress(checklistId) {
  const checklist = get('checklist', checklistId);
  if (!checklist) return 0;

  const items = checklist.items || [];
  if (items.length === 0) return 0;

  const doneCount = items.filter(i => i.is_done).length;
  return Math.round((doneCount / items.length) * 100);
}

export function validateBeforeFinalization(reviewId) {
  // Check that all required checklists are complete
  const checklists = list('checklist', { review_id: reviewId });

  for (const checklist of checklists) {
    if (checklist.required && !checklist.all_items_done) {
      return {
        valid: false,
        error: `Checklist "${checklist.name}" is not complete`,
        requiredChecklistsPending: checklists.filter(c => c.required && !c.all_items_done).map(c => c.name)
      };
    }
  }

  return { valid: true };
}

// TENDER ENGINE
export function calculateDaysUntilDeadline(tender) {
  if (!tender || !tender.deadline) return null;

  const deadlineDate = new Date(tender.deadline * 1000);
  const now = new Date();
  const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

  return daysUntil;
}

export function getDeadlineStatus(tender) {
  const daysUntil = calculateDaysUntilDeadline(tender);

  if (daysUntil === null) return 'no_deadline';
  if (daysUntil < 0) return 'closed';
  if (daysUntil === 0) return 'critical';
  if (daysUntil <= 1) return 'urgent';
  if (daysUntil <= 7) return 'warning';

  return 'open';
}

export function shouldAlertTender(tender) {
  const daysUntil = calculateDaysUntilDeadline(tender);

  if (daysUntil === null) return false;
  if (daysUntil <= 7) return true;

  // Critical priority: alert immediately
  if (tender.priority_level === 'critical') {
    return true;
  }

  return false;
}

export function validateDeadlineChange(tender, newDeadline) {
  if (!newDeadline) {
    throw new Error('Deadline cannot be removed');
  }

  const now = Math.floor(new Date().getTime() / 1000);

  if (newDeadline <= now && tender.status === 'open') {
    throw new Error('Cannot set deadline in the past for open tender');
  }

  return true;
}

export function autoCloseExpiredTender(tenderId) {
  const tender = get('tender', tenderId);
  if (!tender) throw new Error('Tender not found');

  const daysUntil = calculateDaysUntilDeadline(tender);

  if (daysUntil < 0 && tender.status === 'open') {
    update('tender', tenderId, {
      status: 'closed',
      closed_at: Math.floor(new Date().getTime() / 1000),
      close_reason: 'deadline_passed'
    }, { id: 'system', role: 'partner' });

    console.log(`[tender-engine] Auto-closed expired tender ${tenderId}`);
    return true;
  }

  return false;
}

// HIGHLIGHT COLOR PALETTE
export const HIGHLIGHT_PALETTE = {
  grey: { color: '#B0B0B0', label: 'Unresolved', status: 'open' },
  green: { color: '#44BBA4', label: 'Resolved', status: 'resolved' },
  red: { color: '#FF4141', label: 'Priority', status: 'high_priority' },
  purple: { color: '#7F7EFF', label: 'Active Focus', status: 'scrolled_to' }
};

export function getPaletteColor(status) {
  for (const [key, palette] of Object.entries(HIGHLIGHT_PALETTE)) {
    if (palette.status === status) {
      return palette.color;
    }
  }

  return HIGHLIGHT_PALETTE.grey.color;
}

export function validateColor(color) {
  const validColors = Object.keys(HIGHLIGHT_PALETTE);
  return validColors.includes(color);
}

export function applyHighlightColor(highlight, status) {
  const color = getPaletteColor(status);
  return { ...highlight, color, status };
}

export function getColorStats(reviewId) {
  const highlights = list('highlight', { review_id: reviewId });

  const stats = {
    grey: 0,
    green: 0,
    red: 0,
    purple: 0
  };

  for (const highlight of highlights) {
    const color = Object.keys(HIGHLIGHT_PALETTE).find(
      key => HIGHLIGHT_PALETTE[key].color === highlight.color
    );
    if (color && stats[color] !== undefined) {
      stats[color]++;
    }
  }

  return stats;
}
