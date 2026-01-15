import React from 'react';
import { hydrateRoot } from 'react-dom/client';

console.log('[Client] Starting initialization...');

// Make React available globally for JSX transformation
globalThis.React = React;

console.log('[Client] React made global');

// Initialize the app when the DOM is ready
const container = document.getElementById('__next');
console.log('[Client] Container:', container);

if (container) {
  console.log('[Client] Hydrating server-rendered content');

  // Dynamically import the App component
  (async () => {
    try {
      const { App } = await import('/client/app.jsx');
      console.log('[Client] App imported');
      // Hydrate the server-rendered content with client interactivity
      hydrateRoot(container, React.createElement(App, null));
      console.log('[Client] App hydrated');
    } catch (err) {
      console.error('[Client] ERROR:', err.message);
      console.error('[Client] Stack:', err.stack);
      container.innerHTML = `<div style="padding: 20px; color: red;"><h1>Error</h1><p>${err.message}</p></div>`;
    }
  })();
} else {
  console.error('[Client] ERROR: __next container not found');
}

