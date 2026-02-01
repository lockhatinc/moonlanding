import { useState } from 'react';

/**
 * Custom hook to replace @mantine/hooks useDisclosure
 * Manages open/close state for modals, dialogs, etc.
 */
export function useDisclosure(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  return {
    value,
    open: () => setValue(true),
    close: () => setValue(false),
    toggle: () => setValue(!value),
  };
}
