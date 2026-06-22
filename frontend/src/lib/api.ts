import axios from 'axios';
import type { Analytics, Bot, BotCreate, Conversation, Handoff, KnowledgeItem, KnowledgeItemCreate, Message, User } from '../types';

const api = axios.create({ baseURL: '/api/v1' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', data.access_token);
  return data;
}

export async function register(email: string, password: string, name: string, phone?: string) {
  const { data } = await api.post('/auth/register', { email, password, name, phone });
  localStorage.setItem('token', data.access_token);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function listBots(): Promise<Bot[]> {
  const { data } = await api.get('/bots');
  return data;
}

export async function getBot(id: string): Promise<Bot> {
  const { data } = await api.get(`/bots/${id}`);
  return data;
}

export async function createBot(body: BotCreate): Promise<Bot> {
  const { data } = await api.post('/bots', body);
  return data;
}

export async function updateBot(id: string, body: Partial<BotCreate>): Promise<Bot> {
  const { data } = await api.patch(`/bots/${id}`, body);
  return data;
}

export async function deleteBot(id: string): Promise<void> {
  await api.delete(`/bots/${id}`);
}

export async function activateBot(id: string): Promise<Bot> {
  const { data } = await api.post(`/bots/${id}/activate`);
  return data;
}

export async function deactivateBot(id: string): Promise<Bot> {
  const { data } = await api.post(`/bots/${id}/deactivate`);
  return data;
}

export async function listKnowledge(botId: string): Promise<KnowledgeItem[]> {
  const { data } = await api.get(`/bots/${botId}/knowledge`);
  return data;
}

export async function createKnowledge(botId: string, body: KnowledgeItemCreate): Promise<KnowledgeItem> {
  const { data } = await api.post(`/bots/${botId}/knowledge`, body);
  return data;
}

export async function deleteKnowledge(botId: string, itemId: string): Promise<void> {
  await api.delete(`/bots/${botId}/knowledge/${itemId}`);
}

export async function listConversations(botId: string): Promise<Conversation[]> {
  const { data } = await api.get('/conversations', { params: { bot_id: botId } });
  return data.items ?? data;
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const { data } = await api.get(`/conversations/${conversationId}/messages`);
  return data;
}

export async function listHandoffs(): Promise<Handoff[]> {
  const { data } = await api.get('/handoffs');
  return data;
}

export async function resolveHandoff(id: string): Promise<void> {
  await api.patch(`/handoffs/${id}/resolve`);
}

export async function getAnalyticsOverview(): Promise<Analytics> {
  const { data } = await api.get('/analytics/overview');
  return data;
}

export async function getBotAnalytics(botId: string): Promise<Analytics> {
  const { data } = await api.get(`/analytics/bots/${botId}`);
  return data;
}


