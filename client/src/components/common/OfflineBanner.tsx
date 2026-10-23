import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

interface OfflineBannerProps {
  onReconnect?: () => void;
}

export function OfflineBanner({ onReconnect }: OfflineBannerProps) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      if (onReconnect) onReconnect();

      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onReconnect]);

  if (!isOffline && !justReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg text-xs font-medium transition-all duration-300 ${
        isOffline
          ? 'bg-amber-600 text-white'
          : 'bg-emerald-600 text-white'
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>You're offline. Showing the latest cached stories.</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          <span>Back online! Feed refreshed.</span>
        </>
      )}
    </div>
  );
}
