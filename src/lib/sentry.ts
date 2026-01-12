import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      
      integrations: [
        new BrowserTracing({
          tracePropagationTargets: ['localhost', /^https:\/\/.*\.vercel\.app/],
        }),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% das transações

      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% das sessões normais
      replaysOnErrorSampleRate: 1.0, // 100% das sessões com erro

      environment: import.meta.env.MODE,

      // Release tracking
      release: `finansix-web@${import.meta.env.VITE_APP_VERSION || 'unknown'}`,

      // Filter errors
      beforeSend(event, hint) {
        // Filtrar PII (Personal Identifiable Information)
        if (event.user) {
          delete event.user.email;
          delete event.user.username;
        }

        // Filtrar erros conhecidos/esperados
        const error = hint.originalException;
        if (error instanceof Error) {
          // Ignorar erros de extensões de navegador
          if (error.message.includes('Extension context invalidated')) {
            return null;
          }
          
          // Ignorar erros de rede esperados (offline)
          if (error.message.includes('Failed to fetch') && navigator.onLine === false) {
            return null;
          }
        }

        return event;
      },

      // Add user context (sem PII)
      beforeBreadcrumb(breadcrumb) {
        // Remove dados sensíveis dos breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.data) {
          if (breadcrumb.data.arguments) {
            breadcrumb.data.arguments = breadcrumb.data.arguments.map((arg: unknown) =>
              typeof arg === 'string' ? arg : '[Object]'
            );
          }
        }
        return breadcrumb;
      },
    });

    // Set global error handlers
    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason);
    });
  }
}

// Helper to set user context (chamado após login)
export function setSentryUser(userId: string, householdId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (import.meta.env.PROD && (window as any).Sentry) {
    Sentry.setUser({
      id: userId,
      // Não incluir email ou nome (PII)
    });
    
    if (householdId) {
      Sentry.setContext('household', {
        id: householdId,
      });
    }
  }
}

// Helper to clear user context (chamado no logout)
export function clearSentryUser() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (import.meta.env.PROD && (window as any).Sentry) {
    Sentry.setUser(null);
  }
}

// Helper to add breadcrumb
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).Sentry) {
    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data,
    });
  }
}
