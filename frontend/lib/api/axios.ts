import axios, { type AxiosError } from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://backend:3001';
};

/** Token holder: set via setAccessToken() when user logs in (e.g. from Redux). */
const tokenRef = { current: null as string | null };

export function setAccessToken(token: string | null): void {
  tokenRef.current = token;
}

export function getAccessToken(): string | null {
  return tokenRef.current;
}

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = tokenRef.current;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; statusCode?: number }>) => {
    const message =
      error.response?.data?.message ??
      (typeof error.response?.data === 'string'
        ? error.response.data
        : error.message);
    return Promise.reject(new Error(message));
  },
);

export default api;
