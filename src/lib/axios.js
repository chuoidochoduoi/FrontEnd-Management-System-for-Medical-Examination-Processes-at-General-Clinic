import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (!error.response) {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            error.message = 'Thiết bị đang mất kết nối Internet. Vui lòng kiểm tra mạng và thử lại.';
        } else if (error.code === 'ECONNABORTED') {
            error.message = 'Kết nối quá thời gian. Vui lòng thử lại.';
        } else {
            error.message = 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
        }
    }
    if (error.response && error.response.status === 401) {
        // Token expired or unauthorized
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});

export default api;
