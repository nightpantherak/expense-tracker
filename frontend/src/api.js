import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function request(path, opts = {}) {
  const token = await AsyncStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const detail = (data && data.detail) || `HTTP ${res.status}`;
    const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
    throw new Error(msg);
  }
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),

  listTransactions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/transactions${q ? `?${q}` : ''}`);
  },
  createTransaction: (body) => request('/transactions', { method: 'POST', body }),
  updateTransaction: (id, body) => request(`/transactions/${id}`, { method: 'PATCH', body }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  listCategories: () => request('/categories'),
  createCategory: (body) => request('/categories', { method: 'POST', body }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  getBudget: (month) => request(`/budget${month ? `?month=${month}` : ''}`),
  setBudget: (body) => request('/budget', { method: 'POST', body }),

  getSavings: (month) => request(`/savings${month ? `?month=${month}` : ''}`),
  setSavings: (body) => request('/savings', { method: 'POST', body }),

  analytics: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/analytics/summary${q ? `?${q}` : ''}`);
  },

  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body }),
  changePassword: (body) => request('/auth/change-password', { method: 'POST', body }),
};

export async function setToken(token) {
  await AsyncStorage.setItem('access_token', token);
}
export async function clearToken() {
  await AsyncStorage.removeItem('access_token');
}
export async function getToken() {
  return AsyncStorage.getItem('access_token');
}
