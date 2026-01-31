import { useState, useEffect, useCallback } from 'react';

const DEFAULT_CHECK_INTERVAL = 5000;
const CONNECTIVITY_CHECK_URL = '/api/health';

export function useOnlineStatus(options = {}) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);

  const checkConnectivity = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch(CONNECTIVITY_CHECK_URL, {
        method: 'HEAD',
        cache: 'no-store',
        credentials: 'include'
      });
      const online = response.ok;
      setIsOnline(online);
      setLastCheckedAt(new Date());
      return online;
    } catch (error) {
      setIsOnline(false);
      setLastCheckedAt(new Date());
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastCheckedAt(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastCheckedAt(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!options.disabled) {
      const interval = setInterval(() => {
        checkConnectivity();
      }, options.checkInterval || DEFAULT_CHECK_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [options.disabled, options.checkInterval, checkConnectivity]);

  return {
    isOnline,
    isChecking,
    lastCheckedAt,
    checkConnectivity
  };
}

export default useOnlineStatus;
