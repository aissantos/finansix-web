import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals';

function getConnectionSpeed() {
  return (navigator as any).connection && (navigator as any).connection.effectiveType
    ? (navigator as any).connection.effectiveType
    : '';
}

export function reportWebVitals(onPerfEntry?: (metric: any) => void) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onINP(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
}

export function sendToAnalytics(metric: any) {
  const body = JSON.stringify({
    dsn: import.meta.env.VITE_ANALYTICS_ID || 'test-analytics-id',
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
      console.log('[Web Vitals]', metric);
  }
}
