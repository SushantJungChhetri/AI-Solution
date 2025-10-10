const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

// Allow plain objects for "body"
type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: any;                 // ✅ accept objects; we'll stringify inside
  headers?: HeadersInit;
};

// Keep your auth helper as-is
const getAuthHeaders = (includeContentType: boolean = true) => {
  const token = localStorage.getItem('adminToken');
  return {
    ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// SAFEST implementation: build headers with the Headers API
const apiRequest = async (endpoint: string, options: ApiRequestOptions = {}) => {
  const token = localStorage.getItem('adminToken');
  const isForm = options.body instanceof FormData;

  const headers = new Headers(options.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!isForm && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let body: ApiRequestOptions['body'] = options.body ?? undefined;

  if (!isForm && body != null && typeof body !== 'string') {
    // Only stringify plain objects (skip Blob/URLSearchParams/etc.)
    if (
      !(body instanceof Blob) &&
      !(body instanceof ArrayBuffer) &&
      !(body instanceof URLSearchParams) &&
      !(body instanceof ReadableStream)
    ) {
      body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    method: options.method || 'GET',
    headers,
    body,
  });

  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText}`);
  }

  if (res.status === 204) return null;
  return res.json();
};

export { apiRequest, getAuthHeaders };
