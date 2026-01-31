import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals';

function getConnectionSpeed() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (navigator as any).connection && (navigator as any).connection.effectiveType
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (navigator as any).connection.effectiveType
    : '';
}

export function reportWebVitals(onPerfEntry?: (metric: Metric) => void) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onINP(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
}

export function sendToAnalytics(metric: Metric) {
  const analyticsId = import.meta.env.VITE_ANALYTICS_ID;
  
  // Also log to console in development and skip sending to server
  if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[Web Vitals]', metric);
      return;
  }

  // If no analytics ID is configured, do not send
  if (!analyticsId) {
    return;
  }

  const body = JSON.stringify({
    dsn: analyticsId,
    id: metric.id,
    page: window.location.pathname,
    href: window.location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: getConnectionSpeed(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(vitalsUrl, body);
  } else {
    fetch(vitalsUrl, {
      body,
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  // Also log to console in development
  if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[Web Vitals]', metric);
  }
}
