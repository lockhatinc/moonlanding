'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Something went wrong</h1>
      <p>{error?.message || 'An unexpected error occurred'}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
