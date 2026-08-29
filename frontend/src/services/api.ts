import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { email: string; password: string; full_name: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
};

// Users
export const userAPI = {
  getMe: () => api.get('/api/users/me'),
  updateAccount: (data: any) => api.put('/api/users/me', data),
  getProfile: () => api.get('/api/users/me/profile'),
  updateProfile: (data: any) => api.put('/api/users/me/profile', data),
};

// Courses
export const courseAPI = {
  list: () => api.get('/api/courses'),
  create: (data: any) => api.post('/api/courses', data),
  get: (id: number) => api.get(`/api/courses/${id}`),
  update: (id: number, data: any) => api.put(`/api/courses/${id}`, data),
  delete: (id: number) => api.delete(`/api/courses/${id}`),
  analyze: (id: number) => api.post(`/api/courses/${id}/analyze`),
  getTopics: (id: number) => api.get(`/api/courses/${id}/topics`),
};

// Documents
export const documentAPI = {
  upload: (courseId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/courses/${courseId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: (courseId: number) => api.get(`/api/courses/${courseId}/documents`),
  delete: (docId: number) => api.delete(`/api/courses/documents/${docId}`),
};

// Assessment
export const assessmentAPI = {
  get: (courseId: number) => api.get(`/api/courses/${courseId}/assessment`),
  create: (courseId: number) => api.post(`/api/courses/${courseId}/assessment`),
  submit: (courseId: number, assessmentId: number, data: any) =>
    api.post(`/api/courses/${courseId}/assessment/${assessmentId}/submit`, data),
};

// Study Plan
export const studyPlanAPI = {
  get: (courseId: number) => api.get(`/api/study-plan/${courseId}`),
  generate: (courseId: number) => api.post(`/api/study-plan/${courseId}/generate`),
  updateTask: (taskId: number, status: string) =>
    api.put(`/api/study-plan/tasks/${taskId}`, { status }),
};

// Quiz
export const quizAPI = {
  generate: (courseId: number, topicId?: number, difficulty?: string, numQuestions?: number) =>
    api.post('/api/quizzes/generate', null, {
      params: { course_id: courseId, topic_id: topicId, difficulty, num_questions: numQuestions },
    }),
  get: (quizId: number) => api.get(`/api/quizzes/${quizId}`),
  submit: (quizId: number, data: any) => api.post(`/api/quizzes/${quizId}/submit`, data),
};

// Tutor
export const tutorAPI = {
  chat: (courseId: number, data: any, conversationId?: number) =>
    api.post(`/api/tutor/chat/${courseId}`, data, {
      params: conversationId ? { conversation_id: conversationId } : {},
    }),
  getConversations: (courseId: number) => api.get(`/api/tutor/conversations/${courseId}`),
  getMessages: (courseId: number, conversationId: number) =>
    api.get(`/api/tutor/conversations/${courseId}/${conversationId}/messages`),
};

// Progress
export const progressAPI = {
  get: (courseId: number) => api.get(`/api/progress/${courseId}`),
  getMastery: (courseId: number) => api.get(`/api/progress/${courseId}/mastery`),
};

// Mistakes
export const mistakeAPI = {
  list: (courseId?: number) => api.get('/api/mistakes', { params: courseId ? { course_id: courseId } : {} }),
  resolve: (mistakeId: number) => api.put(`/api/mistakes/${mistakeId}/resolve`),
};

// Adaptive
export const adaptiveAPI = {
  recommend: (courseId: number, topicId: number) =>
    api.post('/api/adaptive/recommend', { course_id: courseId, topic_id: topicId }),
  apply: (courseId: number, topicId: number, action: string) =>
    api.post('/api/adaptive/apply', { course_id: courseId, topic_id: topicId, action }),
  dashboardRecommendation: (courseId: number) =>
    api.get(`/api/adaptive/dashboard-recommendation/${courseId}`),
};

export default api;
