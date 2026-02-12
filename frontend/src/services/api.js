import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ==================== GOALS ====================
export const goalsApi = {
  getAll: (params) => api.get('/goals', { params }),
  getById: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  getStats: () => api.get('/goals/stats/overview'),
};

// ==================== MILESTONES ====================
export const milestonesApi = {
  getByGoal: (goalId) => api.get(`/milestones/goal/${goalId}`),
  create: (data) => api.post('/milestones', data),
  update: (id, data) => api.put(`/milestones/${id}`, data),
  delete: (id) => api.delete(`/milestones/${id}`),
};

// ==================== TASKS ====================
export const tasksApi = {
  getByGoal: (goalId) => api.get(`/tasks/goal/${goalId}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// ==================== RISKS ====================
export const risksApi = {
  getByGoal: (goalId) => api.get(`/risks/goal/${goalId}`),
  getMatrix: (goalId) => api.get(`/risks/matrix/${goalId}`),
  create: (data) => api.post('/risks', data),
  update: (id, data) => api.put(`/risks/${id}`, data),
  delete: (id) => api.delete(`/risks/${id}`),
};

// ==================== PROGRESS ====================
export const progressApi = {
  getByGoal: (goalId, limit) => api.get(`/progress/goal/${goalId}`, { params: { limit } }),
  create: (data) => api.post('/progress', data),
};

// ==================== SYNC ====================
export const syncApi = {
  getChanges: (deviceId, since) => api.get('/sync/changes', { params: { device_id: deviceId, since } }),
  pushChanges: (deviceId, changes) => api.post('/sync/push', { device_id: deviceId, changes }),
  getFullData: () => api.get('/sync/full'),
};

// ==================== CONFIG ====================
export async function setApiBaseUrl(url) {
  api.defaults.baseURL = url;
  await AsyncStorage.setItem('api_base_url', url);
}

export async function loadApiBaseUrl() {
  const saved = await AsyncStorage.getItem('api_base_url');
  if (saved) {
    api.defaults.baseURL = saved;
  }
}

export default api;
