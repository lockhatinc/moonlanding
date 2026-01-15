'use client';

import { Button as MantineButton } from '@mantine/core';

export function Button({
  children,
  loading = false,
  disabled = false,
  variant = 'filled',
  size = 'md',
  fullWidth = false,
  leftSection = null,
  rightSection = null,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <MantineButton
      {...props}
      disabled={isDisabled}
      loading={loading}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      leftSection={leftSection}
      rightSection={rightSection}
      style={{
        transition: 'all 0.2s ease-in-out',
        ...props.style
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        props.onMouseLeave?.(e);
      }}
    >
      {children}
    </MantineButton>
  );
}
