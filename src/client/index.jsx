// Minimal client-side entry point
// Using dynamic imports to respect the importmap

console.log('[Client] Starting initialization...');

(async () => {
  try {
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');
    const { App } = await import('/client/app.jsx');

    console.log('[Client] Modules loaded successfully');

    const container = document.getElementById('__next');
    if (container) {
      console.log('[Client] Rendering app...');
      const root = ReactDOM.default.createRoot(container);
      root.render(React.default.createElement(App.default || App));
      console.log('[Client] App rendered');
    } else {
      console.error('[Client] __next container not found');
    }
  } catch (err) {
    console.error('[Client] Initialization error:', err.message);
    console.error(err.stack);
    // Fallback rendering
    const container = document.getElementById('__next');
    if (container) {
      container.innerHTML = `<div style="padding: 20px; color: red;">
        <h1>Error Loading App</h1>
        <p>${err.message}</p>
        <details><pre>${err.stack}</pre></details>
      </div>`;
    }
  }
})();
