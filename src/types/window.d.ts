export {};

declare global {
  interface Window {
    // Sentry is injected via verify-env or initialized in entry point
    Sentry?: {
        captureException: (error: unknown, options?: Record<string, unknown>) => void;
        setUser: (user: { id: string } | null) => void;
        setContext: (key: string, context: Record<string, unknown>) => void;
        init: (options: Record<string, unknown>) => void;
    };
  }
}
