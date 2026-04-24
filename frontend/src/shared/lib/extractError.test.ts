import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from './extractError';

describe('extractErrorMessage', () => {
  it('returns the string directly when error is a string', () => {
    expect(extractErrorMessage('algo salió mal')).toBe('algo salió mal');
  });

  it('returns .message from a native Error', () => {
    expect(extractErrorMessage(new Error('native error'))).toBe('native error');
  });

  it('returns the server message from an Axios-shaped error', () => {
    const axiosError = {
      response: { data: { message: 'Credenciales inválidas' } },
    };
    expect(extractErrorMessage(axiosError)).toBe('Credenciales inválidas');
  });

  it('returns fallback when Axios response.data has no message', () => {
    const axiosError = {
      response: { data: { code: 500 } },
    };
    expect(extractErrorMessage(axiosError)).toBe('Ocurrió un error inesperado.');
  });

  it('returns fallback when error is null', () => {
    expect(extractErrorMessage(null)).toBe('Ocurrió un error inesperado.');
  });

  it('returns fallback when error is undefined', () => {
    expect(extractErrorMessage(undefined)).toBe('Ocurrió un error inesperado.');
  });

  it('returns fallback when error is a number', () => {
    expect(extractErrorMessage(42)).toBe('Ocurrió un error inesperado.');
  });

  it('returns fallback when error is an empty object', () => {
    expect(extractErrorMessage({})).toBe('Ocurrió un error inesperado.');
  });

  it('uses the default fallback when no second argument is given', () => {
    expect(extractErrorMessage(123)).toBe('Ocurrió un error inesperado.');
  });

  it('uses a custom fallback when provided', () => {
    expect(extractErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });
});
