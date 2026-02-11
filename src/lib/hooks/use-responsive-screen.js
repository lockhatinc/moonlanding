'use client';

import { useState, useEffect, useCallback } from 'react';

const BREAKPOINTS = { mobile: 768, tablet: 1024 };

function getScreenType(width) {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

export function useResponsiveScreen() {
  const [screen, setScreen] = useState(() => {
    if (typeof window === 'undefined') return { isMobile: false, isTablet: false, isDesktop: true, width: 1024 };
    const w = window.innerWidth;
    const type = getScreenType(w);
    return { isMobile: type === 'mobile', isTablet: type === 'tablet', isDesktop: type === 'desktop', width: w };
  });

  const handleResize = useCallback(() => {
    const w = window.innerWidth;
    const type = getScreenType(w);
    setScreen({ isMobile: type === 'mobile', isTablet: type === 'tablet', isDesktop: type === 'desktop', width: w });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return screen;
}
