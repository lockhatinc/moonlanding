'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Something went wrong</h1>
        <p>{error?.message || 'An unexpected error occurred'}</p>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
