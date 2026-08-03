import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const api = axios.create({ baseURL: `${API_BASE}/api/v1/admin` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (!window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    } else if (err.response?.status === 403) {
      if (!window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/dashboard';
      }
    }
    return Promise.reject(err);
  },
);

export async function getAdminAnalytics() {
  const { data } = await api.get('/analytics');
  return data;
}

export async function listAllWorkspaces(limit = 50, offset = 0) {
  const { data } = await api.get('/workspaces', { params: { limit, offset } });
  return data.items ?? data;
}

export async function updateWorkspacePlan(workspaceId: string, plan: string, monthlyMessageLimit: number) {
  const { data } = await api.patch(`/workspaces/${workspaceId}`, {
    plan,
    monthly_message_limit: monthlyMessageLimit
  });
  return data;
}

export async function listAllUsers(limit = 50, offset = 0) {
  const { data } = await api.get('/users', { params: { limit, offset } });
  return data.items ?? data;
}
