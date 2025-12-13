'use client';

import { useEffect } from 'react';
import { initDebug } from '@/lib/client-debug';

export function DebugInit() {
  useEffect(() => {
    initDebug();
  }, []);

  return null;
}
