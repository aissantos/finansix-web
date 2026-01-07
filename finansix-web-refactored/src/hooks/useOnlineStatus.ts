import { useSyncExternalStore, useEffect } from 'react';
import { useAppStore } from '@/stores';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function useOnlineStatus() {
  const setIsOnline = useAppStore((s) => s.setIsOnline);

  const isOnline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    setIsOnline(isOnline);
  }, [isOnline, setIsOnline]);

  return isOnline;
}
