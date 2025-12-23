'use client';

import { useEffect } from 'react';
import { initClientDebug } from '@/lib/client-debug';

export function DebugInit() {
  useEffect(() => {
    initClientDebug();
  }, []);

  return null;
}
