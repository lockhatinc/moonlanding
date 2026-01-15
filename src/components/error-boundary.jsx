'use client';

import React from 'react';
import { Alert, Stack } from '@mantine/core';
import { STATUS_ICONS } from '@/config/icon-config';

/**
 * Error Boundary component
 * Catches errors in child components and displays error UI
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error caught:', error, errorInfo);
    // Can send to error tracking service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          icon={<STATUS_ICONS.error size={16} />}
          title="Something went wrong"
          color="red"
          style={{
            margin: '16px',
          }}
        >
          <Stack gap="sm">
            <span>{this.state.error?.message || 'An unexpected error occurred'}</span>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--mantine-color-red-6)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </Stack>
        </Alert>
      );
    }

    return this.props.children;
  }
}

/**
 * AsyncBoundary for handling async errors in components
 * Catches promise rejections and renders error state
 */
export function useAsyncError() {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handler = (event) => {
      setError(event.reason);
    };

    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  return { error, setError, clearError: () => setError(null) };
}
