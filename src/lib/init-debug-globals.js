import { initClientDebug } from '@/lib/client-debug';
import { initConfigDebug, CONFIG_DEBUG } from '@/lib/config-debug';
import { initDomainDebug, DOMAIN_DEBUG } from '@/lib/domain-debug';
import { initDebugHelpers, HELPERS } from '@/lib/debug-helpers';

export async function initializeDebugGlobals(configEngine, domainLoader) {
  try {
    if (typeof window === 'undefined') {
      console.log('[DEBUG] Server-side context detected, skipping client debug init');
      return;
    }

    console.log('[DEBUG] Initializing global debug objects...');

    initClientDebug();
    initConfigDebug();
    initDomainDebug();
    initDebugHelpers();

    if (configEngine) {
      CONFIG_DEBUG.setEngine(configEngine);
      HELPERS.engine = configEngine;
      HELPERS.config = configEngine.getConfig();
    }

    if (domainLoader) {
      DOMAIN_DEBUG.setLoader(domainLoader);
      HELPERS.domains = domainLoader;
    }

    console.log('[DEBUG] ✓ All debug globals initialized');
    console.log('[DEBUG] Available: window.__DEBUG__, window.__CONFIG__, window.__DOMAINS__, window.__HELPERS__');
    console.log('[DEBUG] Quick start: Run window.__HELPERS__.quickTest()');
  } catch (error) {
    console.error('[DEBUG] Failed to initialize debug globals:', error.message);
  }
}

export function setUserForDebug(user) {
  if (typeof window !== 'undefined' && window.__DEBUG__) {
    window.__DEBUG__.record.user(user);
  }
}

export function recordApiCallForDebug(method, url, status, duration, response, error) {
  if (typeof window !== 'undefined' && window.__DEBUG__) {
    window.__DEBUG__.record.apiCall(method, url, status, duration, response, error);
  }
}

export function recordErrorForDebug(message, context) {
  if (typeof window !== 'undefined' && window.__DEBUG__) {
    window.__DEBUG__.record.appError(message, context);
  }
}
