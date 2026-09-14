import { AppError } from './errors';

type FetchOptions = Omit<RequestInit, 'signal'> & { timeoutMs: number };

/**
 * External services are read-only dependencies for quoting. Retry a failed
 * connection once, but never turn a failed request into synthetic data.
 */
export async function fetchWithRetry(url: string, options: FetchOptions, unavailable: AppError): Promise<Response> {
  const { timeoutMs, ...init } = options;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    } catch {
      // The second failure is mapped to a stable application error below.
    }
  }
  throw unavailable;
}
