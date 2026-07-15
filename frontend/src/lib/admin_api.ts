import axios from 'axios';
import type { User, Workspace } from '../types';

const api = axios.create({ baseURL: '/api/v1/admin' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
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
