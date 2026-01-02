/**
 * API Client Configuration
 * 
 * Axios instance with interceptors for authentication and error handling
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/shared/config';
import { tokenStorage } from './tokenStorage';

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
  withCredentials: true, // Send cookies with requests
});

/**
 * Request Interceptor
 * Adds JWT token to all requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles token refresh and error responses
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        const payload = refreshToken ? { refreshToken } : undefined;

        // Attempt to refresh token (cookie-based sessions supported)
        const response = await axios.post(
          `${config.apiUrl}/auth/refresh`,
          payload,
          { withCredentials: true }
        );

        const accessToken = (response.data as { data?: { accessToken?: string }; accessToken?: string })?.data?.accessToken
          ?? (response.data as { accessToken?: string })?.accessToken;

        if (accessToken && originalRequest.headers) {
          // Retry the original request with new token when using header-based auth
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        tokenStorage.clear();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { getErrorMessage } from './errors';
export type { ApiError } from './errors';
