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

// Generic API client factory
const createApiClient = (basePath: string, useAuth: boolean = false) => {
  const client = {
    list: async (params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      const endpoint = query ? `${basePath}?${query}` : basePath;
      return apiRequest(endpoint, { method: 'GET' });
    },
    getById: async (id: string | number) => {
      return apiRequest(`${basePath}/${id}`, { method: 'GET' });
    },
    getBySlug: async (slug: string) => {
      return apiRequest(`${basePath}/slug/${slug}`, { method: 'GET' });
    },
    create: async (data: any) => {
      const options: ApiRequestOptions = { method: 'POST', body: data };
      if (useAuth) options.headers = getAuthHeaders();
      return apiRequest(basePath, options);
    },
    update: async (id: string | number, data: any) => {
      const options: ApiRequestOptions = { method: 'PUT', body: data };
      if (useAuth) options.headers = getAuthHeaders();
      return apiRequest(`${basePath}/${id}`, options);
    },
    delete: async (id: string | number) => {
      const options: ApiRequestOptions = { method: 'DELETE' };
      if (useAuth) options.headers = getAuthHeaders();
      return apiRequest(`${basePath}/${id}`, options);
    },
    upload: async (formData: FormData) => {
      const options: ApiRequestOptions = { method: 'POST', body: formData };
      if (useAuth) options.headers = getAuthHeaders(false); // No Content-Type for FormData
      return apiRequest(`${basePath}/upload`, options);
    }
  };
  return client;
};

// Public API Clients (no auth)
export const feedbackPublicAPI = createApiClient('/feedback');
export const articlesPublicAPI = createApiClient('/articles');
export const eventsPublicAPI = createApiClient('/events');
export const galleriesPublicAPI = createApiClient('/galleries');
export const contactAPI = createApiClient('/inquiries'); // Assuming contact uses inquiries endpoint

// Admin API Clients (with auth)
export const adminArticlesAPI = createApiClient('/admin/articles', true);
export const adminEventsAPI = createApiClient('/admin/events', true);
export const adminFeedbackAPI = createApiClient('/admin/feedback', true);
export const adminGalleriesAPI = createApiClient('/admin/galleries', true);
export const adminInquiriesAPI = createApiClient('/admin/inquiries', true);
export const adminMetricsAPI = createApiClient('/admin/metrics', true);

// AI API (assuming public or auth based on usage)
export const aiAPI = createApiClient('/ai');

// Auth API for admin login (with auth, but sendOTP/verifyOTP don't require token)
export const authAPI = {
  ...createApiClient('/auth', false), // No auth for initial sendOTP
  sendOTP: async (email: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },
  verifyOTP: async (email: string, otp: string) => {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: { email, otp }
    });
  }
};

export { apiRequest, getAuthHeaders };
