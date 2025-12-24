export function mergeChatMessages(engagementMessages, reviewMessages) {
  if (!engagementMessages && !reviewMessages) {
    return [];
  }

  if (!engagementMessages || !Array.isArray(engagementMessages)) {
    return Array.isArray(reviewMessages) ? [...reviewMessages] : [];
  }

  if (!reviewMessages || !Array.isArray(reviewMessages)) {
    return [...engagementMessages];
  }

  const combined = [...engagementMessages, ...reviewMessages];

  const sorted = sortMessagesByTimestamp(combined);

  const deduped = deduplicateMessages(sorted);

  return deduped;
}

export function sortMessagesByTimestamp(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  return [...messages].sort((a, b) => {
    const timeA = a.created_at || 0;
    const timeB = b.created_at || 0;
    return timeA - timeB;
  });
}

export function tagMessageSource(messages, source) {
  if (!Array.isArray(messages)) {
    return [];
  }

  if (!source || (source !== 'engagement' && source !== 'review')) {
    return messages;
  }

  return messages.map(msg => ({
    ...msg,
    _source: source
  }));
}

function deduplicateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const seen = new Set();
  const result = [];

  for (const msg of messages) {
    if (!msg || !msg.id) {
      continue;
    }

    if (!seen.has(msg.id)) {
      seen.add(msg.id);
      result.push(msg);
    }
  }

  return result;
}
