import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

let accessToken: string | null = null;
let instance: AxiosInstance | null = null;

export const BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const setAuthToken = (token: string | null) => {
  accessToken = token;
};

const initInstance = (): AxiosInstance => {
  const ax = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 20_000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  ax.interceptors.request.use(
    (config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  ax.interceptors.response.use(
    (response) => response,
    (error) => {
      return Promise.reject(error);
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
