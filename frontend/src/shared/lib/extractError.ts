import type { AxiosError } from 'axios';

/**
 * Safely extracts a human-readable error message from an unknown catch value.
 * Works with Axios errors, native Error objects, and raw strings.
 */
export function extractErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    // Axios error shape
    const axiosErr = error as AxiosError<{ message?: string }>;
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
    // Native Error
    if ('message' in error && typeof (error as Error).message === 'string') {
      return (error as Error).message;
    }
  }
  return fallback;
}
