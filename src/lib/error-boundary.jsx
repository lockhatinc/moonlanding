'use client';

import { Component } from 'react';
import { Box, Title, Text, Button, Stack } from '@mantine/core';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    console.error('Error caught by boundary:', error);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p="xl" ta="center">
          <Stack gap="md">
            <Title order={2} c="red">Something went wrong</Title>
            <Text c="dimmed">{this.state.error?.message || 'An unexpected error occurred'}</Text>
            <Button onClick={this.reset} variant="light">Try again</Button>
          </Stack>
        </Box>
      );
    }

    return this.props.children;
  }
}
