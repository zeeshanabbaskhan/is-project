import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
});

export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
};

export const fileApi = {
    upload: (data) => api.post('/files/upload', data),
    getAll: () => api.get('/files'),
    getShared: () => api.get('/files/shared'),
    getOne: (id) => api.get(`/files/${id}`),
    download: (id) => api.get(`/files/${id}/download`),
    update: (id, data) => api.put(`/files/${id}`, data),
    delete: (id) => api.delete(`/files/${id}`),
    restore: (id) => api.post(`/files/${id}/restore`),
};

export const shareApi = {
    create: (data) => api.post('/shares/create', data),
    getAll: () => api.get('/shares'),
    getPublic: (token) => api.get(`/shares/public/${token}`),
    accessPublic: (token, data) => api.post(`/shares/public/${token}/access`, data),
    revoke: (id) => api.delete(`/shares/${id}`),
};

export const noteApi = {
    create: (data) => api.post('/notes', data),
    access: (id) => api.post(`/notes/${id}/access`),
};

export const deviceApi = {
    getAll: () => api.get('/devices'),
    revoke: (id) => api.delete(`/devices/${id}`),
    revokeAllOthers: () => api.delete('/devices/all-others'),
};

export const analyticsApi = {
    getStorage: () => api.get('/analytics/storage'),
    getActivity: () => api.get('/analytics/activity'),
    getFileStats: (id) => api.get(`/analytics/file/${id}`),
};

export default api;
