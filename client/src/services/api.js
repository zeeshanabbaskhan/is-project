import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Don't clear auth for share-related responses
            const data = error.response?.data;
            const isShareRelated =
                data?.passwordRequired === true ||
                data?.requiresAuth === true ||
                data?.accessDenied === true ||
                data?.alreadyAccessed === true ||
                error.config?.url?.includes('/shares/');

            // Only clear auth if it's a genuine auth failure (not share-related)
            if (!isShareRelated) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        return Promise.reject(error);
    }
);

// Crypto API - Key Exchange
export const cryptoApi = {
    getServerPublicKey: () => api.get('/crypto/public-key'),
    registerClientPublicKey: (data) => api.post('/crypto/client-key', data),
};

// Auth API
export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.post('/auth/change-password', data),
    searchUsers: (query) => api.get('/auth/users/search', { params: { query } }),
    getSettings: () => api.get('/auth/settings'),
    updateSettings: (data) => api.put('/auth/settings', data),
    deleteAccount: (password) => api.delete('/auth/account', { data: { password } }),
    // 2FA
    setup2FA: () => api.post('/auth/2fa/setup'),
    enable2FA: (code) => api.post('/auth/2fa/enable', { code }),
    disable2FA: (password, code) => api.post('/auth/2fa/disable', { password, code }),
};

// File API
export const fileApi = {
    upload: (formData) => api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getAll: (params) => api.get('/files', { params }),
    getShared: () => api.get('/files/shared'),  // Files shared WITH the user (inbox)
    getOne: (id) => api.get(`/files/${id}`),
    preview: (id) => api.get(`/files/${id}/preview`, { responseType: 'blob' }),
    download: (id) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
    update: (id, data) => api.put(`/files/${id}`, data),
    delete: (id, permanent = false) => api.delete(`/files/${id}`, { params: { permanent } }),
    getStats: () => api.get('/files/stats/summary'),
    removeSharedUser: (fileId, userId) => api.delete(`/files/${fileId}/share`, { data: { userId } }),
};

// Share API - matches /api/shares routes
export const shareApi = {
    create: (data) => api.post('/shares/create', data),
    getAll: () => api.get('/shares'),
    getByToken: (token, password) => api.get(`/shares/${token}`, { params: { password } }),
    previewByToken: (token, password, sessionToken) => api.get(`/shares/${token}/preview`, {
        params: { password, sessionToken },
        responseType: 'blob'
    }),
    downloadByToken: (token, password, sessionToken) => api.get(`/shares/${token}/download`, {
        params: { password, sessionToken },
        responseType: 'blob'
    }),
    delete: (id) => api.delete(`/shares/${id}`),
    toggle: (id) => api.put(`/shares/${id}/toggle`),
    getTrace: (id) => api.get(`/shares/${id}/trace`),
};

// Note API
export const noteApi = {
    create: (data) => api.post('/notes', data),
    getAll: (params) => api.get('/notes', { params }),
    getOne: (id) => api.get(`/notes/${id}`),
    update: (id, data) => api.put(`/notes/${id}`, data),
    delete: (id, permanent = false) => api.delete(`/notes/${id}`, { params: { permanent } }),
    share: (id, data) => api.post(`/notes/${id}/share`, data),
};

// Device API
export const deviceApi = {
    getAll: () => api.get('/devices'),
    revoke: (id) => api.delete(`/devices/${id}`),
    revokeAll: () => api.post('/devices/revoke-all'),
    trust: (id) => api.put(`/devices/${id}/trust`),
    rename: (id, deviceName) => api.put(`/devices/${id}/rename`, { deviceName }),
};

// Analytics API
export const analyticsApi = {
    getActivity: (limit) => api.get('/analytics/activity', { params: { limit } }),
    getSummary: (days) => api.get('/analytics/summary', { params: { days } }),
    getDashboard: () => api.get('/analytics/dashboard'),
    getSecurity: () => api.get('/analytics/security'),
    getFileActivity: (id) => api.get(`/analytics/files/${id}`),
    // Storage info is part of dashboard stats, extract it
    getStorage: () => api.get('/analytics/dashboard').then(res => ({
        data: res.data?.stats?.storage || { used: 0, limit: 10737418240 } // 10GB default
    })),
};

export default api;
