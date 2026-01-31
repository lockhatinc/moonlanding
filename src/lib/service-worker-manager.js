import { offlineQueue } from '@/lib/offline-queue';

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  }

  async register() {
    if (!this.isSupported) {
      console.warn('[ServiceWorker] Service Workers not supported in this browser');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      this.registration = registration;
      console.log('[ServiceWorker] Successfully registered:', registration);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[ServiceWorker] Update available');
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('[ServiceWorker] Registration failed:', error);
      return false;
    }
  }

  async unregister() {
    if (!this.registration) {
      return false;
    }

    try {
      const success = await this.registration.unregister();
      if (success) {
        this.registration = null;
        console.log('[ServiceWorker] Successfully unregistered');
      }
      return success;
    } catch (error) {
      console.error('[ServiceWorker] Unregister failed:', error);
      return false;
    }
  }

  async skipWaiting() {
    if (!this.registration || !this.registration.waiting) {
      return false;
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    return true;
  }

  async clearCaches() {
    if (!this.registration) {
      return false;
    }

    this.registration.active?.postMessage({ type: 'CLEAR_CACHES' });
    return true;
  }

  async processOfflineQueue(checkConnectivity) {
    const results = await offlineQueue.processQueue(checkConnectivity);
    return results;
  }

  notifyUpdateAvailable() {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('sw-update-available', {
        detail: { message: 'A new version is available. Refresh to update.' }
      });
      window.dispatchEvent(event);
    }
  }

  isRegistered() {
    return this.registration !== null;
  }

  getRegistration() {
    return this.registration;
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();

export default ServiceWorkerManager;
