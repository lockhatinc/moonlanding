import React from 'react';

// Minimal app component - no external dependencies yet
export function App() {
  return React.createElement('div', { style: { padding: '20px', fontFamily: 'system-ui, sans-serif' } },
    React.createElement('h1', null, '🚀 Platform'),
    React.createElement('p', null, 'Current page: ' + (window.__PATHNAME__ || '/')),
    React.createElement('p', null, 'Client-side rendering is working!')
  );
}

