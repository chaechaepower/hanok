import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios, { AxiosHeaders } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import type { ApiResponse, LoginResponseData } from '@/types';
import { disconnectStompClient, refreshStompClientConnection } from '@/websocket/stompClient';

let instance: AxiosInstance | null = null;
let guestSafeInstance: AxiosInstance | null = null;
let refreshRequestPromise: Promise<ApiResponse<LoginResponseData>> | null = null;

export const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REFRESH_TOKEN_PATH = '/v1/auth/refresh';
const STARTED_STREAM_IDS_STORAGE_KEY = 'startedLiveStreamIds';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const isRefreshRequest = (url?: string) => url?.includes(REFRESH_TOKEN_PATH) ?? false;

export const clearAuthSession = ({ redirectToLogin = true }: { redirectToLogin?: boolean } = {}) => {
  void disconnectStompClient();
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(STARTED_STREAM_IDS_STORAGE_KEY);
  }
  queryClient.clear();

  if (!redirectToLogin || typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
};

export const refreshSessionTokens = async () => {
  if (refreshRequestPromise) {
    return refreshRequestPromise;
  }

  const currentRefreshToken = localStorage.getItem('refreshToken');

  if (!currentRefreshToken) {
    clearAuthSession();
    throw new Error('Refresh token is missing.');
  }

  refreshRequestPromise = axios
    .post<ApiResponse<LoginResponseData>>(
      `${BASE_URL}${REFRESH_TOKEN_PATH}`,
      { refreshToken: currentRefreshToken },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    .then(async (response) => {
      const { accessToken, refreshToken } = response.data.data;

      if (!accessToken) {
        throw new Error('Access token is missing from refresh response.');
      }

      localStorage.setItem('accessToken', accessToken);

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      await refreshStompClientConnection();

      return response.data;
    })
    .catch((error) => {
      clearAuthSession();
      throw error;
    })
    .finally(() => {
      refreshRequestPromise = null;
    });

  return refreshRequestPromise;
};

const initInstance = (): AxiosInstance => {
  const ax = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 20_000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  ax.interceptors.request.use(
    (config) => {
      const accessToken = localStorage.getItem('accessToken');

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  ax.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetriableRequestConfig | undefined;
      const status = error.response?.status;

      if (!originalRequest || status !== 401 || originalRequest._retry || isRefreshRequest(originalRequest.url)) {
        if (status === 401 && isRefreshRequest(originalRequest?.url)) {
          clearAuthSession();
        }

        return Promise.reject(error);
      }

      const currentRefreshToken = localStorage.getItem('refreshToken');

      if (!currentRefreshToken) {
        clearAuthSession();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshResponse = await refreshSessionTokens();
        const nextAccessToken = refreshResponse.data.accessToken;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        } else {
          originalRequest.headers = new AxiosHeaders({
            Authorization: `Bearer ${nextAccessToken}`,
          });
        }

        return ax(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    },
  );

  return ax;
};

export const getFetchInstance = (): AxiosInstance => {
  if (!instance) {
    instance = initInstance();
  }
  return instance;
};

export const getGuestSafeFetchInstance = (): AxiosInstance => {
  if (!guestSafeInstance) {
    guestSafeInstance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 20_000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    guestSafeInstance.interceptors.request.use(
      (config) => {
        const accessToken = localStorage.getItem('accessToken');

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      },
      (error) => Promise.reject(error),
    );
  }

  return guestSafeInstance;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      throwOnError: true,
    },
    mutations: {
      retry: 0,
      throwOnError: true,
    },
  },
});
