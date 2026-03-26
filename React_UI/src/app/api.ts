/// <reference types="vite/client" />
import axios from 'axios';
import { toast } from 'sonner';

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';

const api = axios.create({
    baseURL,
});

api.interceptors.request.use(
    (config) => {
        const saved = sessionStorage.getItem('lims_auth');
        if (saved) {
            try {
                const userData = JSON.parse(saved);
                if (userData?.token) {
                    config.headers.Authorization = `Bearer ${userData.token}`;
                }
            } catch (e) {
                // ignore JSON parse errors
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                toast.error('Session expired. Please log in again.');
                sessionStorage.removeItem('lims_auth');
                window.location.reload();
            } else if (error.response.status >= 500) {
                toast.error('Server error (5xx). Please contact support.');
            } else if (error.response.status === 403) {
                toast.error('You do not have permission to perform this action.');
            } else if (error.response.status === 429) {
                toast.error('You are making too many requests. Please slow down.');
            }
            // For 400 Bad Request, we let the individual components handle the toasts to show specific validation errors mapping to fields.
        } else if (error.request) {
            toast.error('Network error. Check your connection or server status.');
        } else {
            toast.error('An unexpected error occurred in the request browser logic.');
        }
        return Promise.reject(error);
    }
);

export default api;
