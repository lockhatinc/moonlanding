const updateChannels = new Map();

export function broadcastUpdate(url, action, data) {
  if (!updateChannels.has(url)) {
    updateChannels.set(url, []);
  }
  const callbacks = updateChannels.get(url);
  callbacks.forEach(cb => {
    try {
      cb({ url, action, data, timestamp: Date.now() });
    } catch (err) {
      console.error('Realtime callback error:', err);
    }
  });
}

export function subscribeToUpdates(url, callback) {
  if (!updateChannels.has(url)) {
    updateChannels.set(url, []);
  }
  updateChannels.get(url).push(callback);

  return () => {
    const callbacks = updateChannels.get(url);
    const idx = callbacks.indexOf(callback);
    if (idx > -1) callbacks.splice(idx, 1);
  };
}
