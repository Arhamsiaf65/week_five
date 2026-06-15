import axios, { type AxiosRequestConfig, type AxiosError, type AxiosHeaders } from 'axios';
import { useAuthStore } from '../store/authStore';

interface RetryableRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
}

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        if (!config.headers) {
            config.headers = new axios.AxiosHeaders();
        }

        const headers = config.headers as AxiosHeaders;
        headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError | unknown) => {
        if (axios.isAxiosError(error)) {
            const originalRequest = error.config as RetryableRequestConfig | undefined;

            if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const refreshToken = useAuthStore.getState().refreshToken;
                    if (!refreshToken) throw new Error('No refresh token available');

                    const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
                    const { accessToken, refreshToken: newRefreshToken } = response.data as {
                        accessToken: string;
                        refreshToken: string;
                    };

                    useAuthStore.getState().setTokens(accessToken, newRefreshToken);

                    originalRequest.headers = {
                        ...originalRequest.headers,
                        Authorization: `Bearer ${accessToken}`,
                    };

                    return api(originalRequest);
                } catch (refreshError) {
                    useAuthStore.getState().logout();
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);
