import { get, create, remove } from '@/engine';

export const softDeleteHighlight = (highlightId, userId) => {
  const highlight = get('highlight', highlightId);
  if (!highlight) {
    throw new Error('Highlight not found');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const removedHighlight = {
    ...highlight,
    deleted_at: timestamp,
    deleted_by: userId,
    original_id: highlightId
  };

  create('removedHighlight', removedHighlight);
  remove('highlight', highlightId);
};

export const restoreHighlight = (removedHighlightId, userId) => {
  const removed = get('removedHighlight', removedHighlightId);
  if (!removed) {
    throw new Error('Removed highlight not found');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const restored = {
    ...removed,
    restored_at: timestamp,
    restored_by: userId,
    deleted_at: null,
    deleted_by: null
  };

  delete restored.original_id;

  create('highlight', restored);
  remove('removedHighlight', removedHighlightId);
};
