
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';


const getAuthHeaders = (includeContentType: boolean = true) => {
  const token = localStorage.getItem('adminToken');
  return {
    ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: options.body instanceof FormData ? options.headers || {} : { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
};

// Auth
export const authAPI = {
  sendOTP: (email: string, password: string) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  verifyOTP: (email: string, otp: string) =>
    apiRequest('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  loginDirect: (email: string, password: string) =>
    apiRequest('/auth/login-direct', { method: 'POST', body: JSON.stringify({ email, password }) })
};

// PUBLIC (contact form -> inquiries)
export const inquiriesPublicAPI = {
  create: (payload: any) => apiRequest('/inquiries', { method: 'POST', body: JSON.stringify(payload) }),
};

// PUBLIC content
export const articlesPublicAPI = {
  list: (params: Record<string,string|number|boolean> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiRequest(`/articles${qs ? `?${qs}` : ''}`);
  },
  getBySlug: (slug: string) => apiRequest(`/articles/${slug}`)
};

export const eventsPublicAPI = {
  list: (params: Record<string,string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/events${qs ? `?${qs}` : ''}`);
  }
};


export const feedbackPublicAPI = {
  list: (params: Record<string,string|number> = { verified: 'true' }) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiRequest(`/feedback${qs ? `?${qs}` : ''}`);
  },
  submit: (data: any) => apiRequest('/feedback', { method: 'POST', body: JSON.stringify(data) }),
};

// ADMIN (protected)
export const adminInquiriesAPI = {
  list: (params: Record<string,string|number> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiRequest(`/admin/inquiries${qs ? `?${qs}` : ''}`, { headers: getAuthHeaders() });
  },
  get: (id: number) => apiRequest(`/admin/inquiries/${id}`, { headers: getAuthHeaders() }),
  updateStatus: (id: number, status: 'new'|'in-progress'|'completed'|'archived') =>
    apiRequest(`/admin/inquiries/${id}`, {
      method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ status })
    }),
  reply: (id: number, message: string) =>
    apiRequest(`/admin/inquiries/${id}/reply`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ message })
    }),
  delete: (id: number) => apiRequest(`/admin/inquiries/${id}`, { method: 'DELETE', headers: getAuthHeaders() }),
  exportCsv: () => apiRequest('/admin/inquiries/export.csv', { headers: getAuthHeaders() })
};

export const adminArticlesAPI = {
  create: (data: any) => apiRequest('/admin/articles', { method: 'POST', headers: getAuthHeaders(!(data instanceof FormData)), body: data instanceof FormData ? data : JSON.stringify(data) }),
  update: (id: number, data: any) => apiRequest(`/admin/articles/${id}`, { method: 'PUT', headers: getAuthHeaders(!(data instanceof FormData)), body: data instanceof FormData ? data : JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/admin/articles/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
};

export const adminEventsAPI = {
  create: (data:any) => apiRequest('/admin/events', { method: 'POST', headers: getAuthHeaders(false), body: data }),
  update: (id:number, data:any) => apiRequest(`/admin/events/${id}`, { method: 'PUT', headers: getAuthHeaders(false), body: data }),
  delete: (id:number) => apiRequest(`/admin/events/${id}`, { method: 'DELETE', headers: getAuthHeaders() }),
  get: (id:number) => apiRequest(`/admin/events/${id}`, { headers: getAuthHeaders() })
};

export const adminGalleriesAPI = {
  list: () => apiRequest('/admin/galleries', { headers: getAuthHeaders() }),
  upload: (data: FormData) => apiRequest('/admin/galleries', { method: 'POST', headers: getAuthHeaders(false), body: data }),
  delete: (id: number) => apiRequest(`/admin/galleries/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
};


export const adminFeedbackAPI = {
  list: (params: Record<string,string|number> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiRequest(`/admin/feedback${qs ? `?${qs}` : ''}`, { headers: getAuthHeaders() });
  },
  approve: (id:number, isApproved:boolean) =>
    apiRequest(`/admin/feedback/${id}`, { method:'PATCH', headers:getAuthHeaders(), body:JSON.stringify({ verified: isApproved }) }),
  updateStatus: (id:number, status:'pending'|'approved'|'denied') =>
    apiRequest(`/admin/feedback/${id}`, { method:'PATCH', headers:getAuthHeaders(), body:JSON.stringify({ status }) }),
  delete: (id:number) =>
    apiRequest(`/admin/feedback/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
};

export const adminMetricsAPI = {
  get: () => apiRequest('/admin/metrics', { headers: getAuthHeaders() })
};

// PUBLIC galleries
export const galleriesPublicAPI = {
  list: () => apiRequest('/galleries')
};

// -------- Aliases to match existing imports in your pages --------
export const contactAPI = inquiriesPublicAPI;

export const articlesAPI = {
  list: articlesPublicAPI.list,
  delete: adminArticlesAPI.delete,
};

export const eventsAPI = {
  list: eventsPublicAPI.list,
  delete: adminEventsAPI.delete,
};

export const feedbackAPI = {
  list: feedbackPublicAPI.list,
  approve: adminFeedbackAPI.approve,
  delete: adminFeedbackAPI.delete,
};

// AI Assistant API (Mock responses for now - FREE)
export const aiAPI = {
  chat: async (messages: Array<{role: 'user' | 'assistant' | 'system', content: string}>) => {
    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();

    if (!lastUserMessage) {
      return 'Hello! How can I help you today?';
    }

    const userInput = lastUserMessage.content.toLowerCase();

    // Mock AI responses based on common questions
    if (userInput.includes('hello') || userInput.includes('hi')) {
      return 'Hello! Welcome to AI-Solutions. I\'m here to help you learn about our AI services and how artificial intelligence can transform your business. What would you like to know?';
    }

    if (userInput.includes('services') || userInput.includes('offer')) {
      return 'AI-Solutions offers comprehensive AI-driven software solutions including: Machine Learning & AI Development, Computer Vision solutions, Natural Language Processing, Predictive Analytics, IoT integration, and Digital Transformation consulting. We serve industries like Healthcare, Finance, Manufacturing, and Education.';
    }

    if (userInput.includes('ai') && userInput.includes('help')) {
      return 'AI can help businesses in many ways: automating repetitive tasks, providing data-driven insights, improving customer experiences, optimizing operations, and enabling predictive capabilities. At AI-Solutions, we specialize in implementing these solutions tailored to your specific industry needs.';
    }

    if (userInput.includes('contact') || userInput.includes('reach')) {
      return 'You can contact AI-Solutions through our website contact form, email us at info@ai-solutions.com, or call our office. We offer free initial consultations to discuss your AI needs and how we can help transform your business.';
    }

    if (userInput.includes('pricing') || userInput.includes('cost') || userInput.includes('price')) {
      return 'Our pricing depends on the scope and complexity of your project. We offer flexible pricing models including fixed-price projects, hourly consulting, and ongoing AI-as-a-service solutions. Contact us for a personalized quote based on your specific requirements.';
    }

    if (userInput.includes('experience') || userInput.includes('projects')) {
      return 'AI-Solutions has successfully delivered AI solutions for clients across various industries. Our portfolio includes healthcare diagnostic systems, financial fraud detection, manufacturing optimization, educational AI platforms, and retail personalization systems. We have a proven track record of delivering measurable business results.';
    }

    // Default response
    return `Thank you for your question about "${lastUserMessage.content}". As an AI assistant for AI-Solutions, I'm here to help you learn about our AI services and capabilities. Could you tell me more specifically what you're interested in? For example, our machine learning solutions, computer vision applications, or how AI can benefit your industry?`;
  }
};
