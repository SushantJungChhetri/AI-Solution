// src/utils/api.ts

/***********************
 * 1) Decide the base URL
 ***********************/
const rawBase =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  '/api';

const stripTrailingSlash = (s: string) => s.replace(/\/+$/g, '');
const stripLeadingSlash = (s: string) => s.replace(/^\/+/g, '');
const API_BASE_URL = stripTrailingSlash(rawBase);

/***********************
 * 2) Safe URL joiner
 ***********************/
const joinUrl = (base: string, path: string) =>
  `${stripTrailingSlash(base)}/${stripLeadingSlash(path)}`;

/***********************
 * 3) Shared types
 ***********************/
type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: any;
  headers?: HeadersInit;
  query?: Record<string, string | number | boolean | undefined | null>;
};

/***********************
 * 4) Auth header helper
 ***********************/
export const getAuthHeaders = (includeContentType: boolean = true) => {
  const token = localStorage.getItem('adminToken');
  return {
    ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/***********************
 * 5) Query string helper
 ***********************/
const toQueryString = (q?: ApiRequestOptions['query']) => {
  if (!q) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
};

/***********************
 * 6) Core request function
 ***********************/
export const apiRequest = async (endpoint: string, options: ApiRequestOptions = {}) => {
  const token = localStorage.getItem('adminToken');
  const isForm = options.body instanceof FormData;

  const queryPart = toQueryString(options.query);
  const url = joinUrl(API_BASE_URL, `${endpoint}${queryPart}`);

  const headers = new Headers(options.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!isForm && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let body: BodyInit | undefined = options.body as any;
  if (!isForm && body != null && typeof body !== 'string') {
    if (
      !(body instanceof Blob) &&
      !(body instanceof ArrayBuffer) &&
      !(body instanceof URLSearchParams) &&
      !(body instanceof ReadableStream)
    ) {
      body = JSON.stringify(body);
    }
  }

  const res = await fetch(url, {
    ...options,
    method: options.method || 'GET',
    headers,
    body,
  });

  if (!res.ok) {
    let msg = `API ${res.status} ${res.statusText}`;
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = await res.json();
        if ((data as any)?.error) msg = `${msg}: ${(data as any).error}`;
        else if (typeof data === 'string') msg = `${msg}: ${data}`;
      } else {
        const t = await res.text();
        if (t) msg = `${msg}: ${t.slice(0, 500)}`;
      }
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return null;

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
};

/***********************
 * 7) Generic API client factory
 ***********************/
const createApiClient = (basePath: string, useAuth: boolean = false) => {
  const base = basePath.startsWith('/') ? basePath : `/${basePath}`;

  return {
    list: (params?: Record<string, any>) =>
      apiRequest(base, { method: 'GET', query: params }),

    getById: (id: string | number) =>
      apiRequest(joinUrl(base, String(id)), { method: 'GET' }),

    getBySlug: (slug: string) =>
      apiRequest(joinUrl(base, `slug/${slug}`), { method: 'GET' }),

    create: (data: any) =>
      apiRequest(base, {
        method: 'POST',
        body: data,
        headers: useAuth ? getAuthHeaders() : undefined,
      }),

    update: (id: string | number, data: any) =>
      apiRequest(joinUrl(base, String(id)), {
        method: 'PUT',
        body: data,
        headers: useAuth ? getAuthHeaders() : undefined,
      }),

    delete: (id: string | number) =>
      apiRequest(joinUrl(base, String(id)), {
        method: 'DELETE',
        headers: useAuth ? getAuthHeaders() : undefined,
      }),

    upload: (formData: FormData) =>
      apiRequest(joinUrl(base, 'upload'), {
        method: 'POST',
        body: formData,
        headers: useAuth ? getAuthHeaders(false) : undefined,
      }),
  };
};

/***********************
 * 8) Public API clients (no auth)
 ***********************/
export const feedbackPublicAPI  = createApiClient('/feedback');
export const articlesPublicAPI  = createApiClient('/articles');
export const eventsPublicAPI    = createApiClient('/events');
export const galleriesPublicAPI = createApiClient('/galleries');
export const contactAPI         = createApiClient('/inquiries');

/***********************
 * 9) Admin API clients (auth required)
 ***********************/
export const adminArticlesAPI   = createApiClient('/admin/articles', true);
export const adminEventsAPI     = createApiClient('/admin/events', true);
export const adminFeedbackAPI   = createApiClient('/admin/feedback', true);
export const adminGalleriesAPI  = createApiClient('/admin/galleries', true);
export const adminInquiriesAPI  = createApiClient('/admin/inquiries', true);
export const adminMetricsAPI    = createApiClient('/admin/metrics', true);

/***********************
 * 10) Auth API (login is public)
 ***********************/
export const authAPI = {
  ...createApiClient('/auth', false),
  login: (email: string, password: string) =>
    apiRequest('/auth/login', { method: 'POST', body: { email, password } }),
};

/***********************
 * 11) ✅ AI API (added back to satisfy AIChatModal import)
 *     - No auth by default; flip to `true` if your /ai route requires admin token
 ***********************/
export const aiAPI = createApiClient('/ai', false);

// Optional re-exports
export { API_BASE_URL, joinUrl };
