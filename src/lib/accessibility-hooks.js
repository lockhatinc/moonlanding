'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Manages focus trap for modals/dialogs
 * Ensures keyboard navigation stays within the modal
 */
export function useFocusTrap(isActive = true) {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!isActive || !elementRef.current) return;

    const element = elementRef.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return elementRef;
}

/**
 * Manages focus restoration after modal closes
 * Returns focus to the element that opened the modal
 */
export function useFocusRestore() {
  const previousActiveRef = useRef(document.activeElement);

  const storeFocus = React.useCallback(() => {
    previousActiveRef.current = document.activeElement;
  }, []);

  const restoreFocus = React.useCallback(() => {
    previousActiveRef.current?.focus?.();
  }, []);

  return { storeFocus, restoreFocus };
}

/**
 * Prevents scroll when modal/drawer is open
 */
export function useScrollLock(isLocked = true) {
  useEffect(() => {
    if (!isLocked) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isLocked]);
}
