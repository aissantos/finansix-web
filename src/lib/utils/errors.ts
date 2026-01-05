// Custom error classes for better error handling

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code = 'UNKNOWN_ERROR',
    statusCode = 500,
    isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class SupabaseError extends AppError {
  public readonly originalError: unknown;

  constructor(message: string, code: string, originalError?: unknown) {
    super(message, code, 500, true);
    this.name = 'SupabaseError';
    this.originalError = originalError;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 'NOT_FOUND', 404, true);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, true);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Não autenticado') {
    super(message, 'UNAUTHENTICATED', 401, true);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Sem permissão para esta ação') {
    super(message, 'UNAUTHORIZED', 403, true);
    this.name = 'AuthorizationError';
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Erro de conexão. Verifique sua internet.') {
    super(message, 'NETWORK_ERROR', 0, true);
    this.name = 'NetworkError';
  }
}

// Error handler utility
export function handleSupabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string; details?: string };
    
    switch (supabaseError.code) {
      case 'PGRST116':
        throw new NotFoundError('Recurso');
      case '23505':
        throw new ValidationError('Registro duplicado');
      case '23503':
        throw new ValidationError('Referência inválida');
      case '42501':
        throw new AuthorizationError();
      case 'PGRST301':
        throw new AuthenticationError();
      default:
        throw new SupabaseError(
          supabaseError.message || 'Erro no banco de dados',
          supabaseError.code,
          error
        );
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new NetworkError();
    }
    throw new AppError(error.message);
  }

  throw new AppError('Erro desconhecido');
}

// User-friendly error messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Common Supabase/network errors
    if (error.message.includes('Failed to fetch')) {
      return 'Erro de conexão. Verifique sua internet.';
    }
    if (error.message.includes('JWT')) {
      return 'Sua sessão expirou. Faça login novamente.';
    }
    if (error.message.includes('duplicate key')) {
      return 'Este registro já existe.';
    }
    
    return error.message;
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}

// Error logging utility
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const errorData = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof AppError && {
        code: error.code,
        statusCode: error.statusCode,
      }),
    } : error,
    context,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', errorData);
  }

  // Send to Sentry in production
  if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (e: unknown, ctx?: unknown) => void } }).Sentry) {
    (window as unknown as { Sentry: { captureException: (e: unknown, ctx?: unknown) => void } }).Sentry.captureException(error, {
      extra: context,
    });
  }
}

// Type guard for checking if error is operational (expected)
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
