import { describe, it, expect } from 'vitest';
import {
  AppError,
  SupabaseError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  getErrorMessage,
  isOperationalError,
} from '@/lib/utils/errors';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should create error with custom values', () => {
      const error = new AppError('Custom error', 'CUSTOM_CODE', 400, false);
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('User');
      expect(error.message).toBe('User não encontrado');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Email inválido', 'email');
      expect(error.message).toBe('Email inválido');
      expect(error.field).toBe('email');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Não autenticado');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error', () => {
      const error = new AuthorizationError();
      expect(error.message).toBe('Sem permissão para esta ação');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError();
      expect(error.message).toBe('Erro de conexão. Verifique sua internet.');
      expect(error.statusCode).toBe(0);
    });
  });
});

describe('getErrorMessage', () => {
  it('should return message from AppError', () => {
    const error = new NotFoundError('Transação');
    expect(getErrorMessage(error)).toBe('Transação não encontrado');
  });

  it('should return message from regular Error', () => {
    const error = new Error('Regular error');
    expect(getErrorMessage(error)).toBe('Regular error');
  });

  it('should return friendly message for network errors', () => {
    const error = new Error('Failed to fetch');
    expect(getErrorMessage(error)).toBe('Erro de conexão. Verifique sua internet.');
  });

  it('should return default message for unknown errors', () => {
    expect(getErrorMessage(null)).toBe('Ocorreu um erro inesperado. Tente novamente.');
    expect(getErrorMessage(undefined)).toBe('Ocorreu um erro inesperado. Tente novamente.');
    expect(getErrorMessage('string error')).toBe('Ocorreu um erro inesperado. Tente novamente.');
  });
});

describe('isOperationalError', () => {
  it('should return true for operational AppErrors', () => {
    const error = new NotFoundError('Test');
    expect(isOperationalError(error)).toBe(true);
  });

  it('should return false for non-operational AppErrors', () => {
    const error = new AppError('Critical', 'CRITICAL', 500, false);
    expect(isOperationalError(error)).toBe(false);
  });

  it('should return false for regular errors', () => {
    const error = new Error('Regular');
    expect(isOperationalError(error)).toBe(false);
  });

  it('should return false for non-errors', () => {
    expect(isOperationalError(null)).toBe(false);
    expect(isOperationalError('string')).toBe(false);
  });
});
