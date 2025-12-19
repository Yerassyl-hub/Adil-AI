import { getBaseUrl, getApiKey } from '../config/apiConfig';

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

const resolveUrl = (path: string) => {
  const base = getBaseUrl().replace(/\/+$/, '');
  return `${base}${normalizePath(path)}`;
};

const withAuthHeaders = (init: RequestInit = {}) => {
  const headers = new Headers(init.headers ?? {});
  const apiKey = getApiKey();

  if (apiKey) {
    headers.set('Authorization', `Bearer ${apiKey}`);
  }

  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return {
    ...init,
    headers,
  };
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  if (contentType.includes('text/')) {
    return (await response.text()) as T;
  }

  return (await response.blob()) as T;
};

const REQUEST_TIMEOUT = 60000;

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(resolveUrl(path), {
      ...withAuthHeaders(init),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
    }

    return await parseResponse<T>(response);
  } catch (error: any) {
    const name = error?.name ?? 'Error';
    const message = error?.message ?? String(error);
    throw new Error(`NETWORK: ${name} ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}

export const get = <T = any>(path: string) => api<T>(path);
export const post = <T = any>(path: string, body: any) =>
  api<T>(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

