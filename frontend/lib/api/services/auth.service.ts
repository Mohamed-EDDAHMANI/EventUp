import { api } from '@/lib/api/axios';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from '@/lib/api/types';

const AUTH_BASE = '/auth';

export const authService = {
  /**
   * Login with email and password.
   * Returns user + access_token. Call setAccessToken(access_token) and dispatch setCredentials after.
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(`${AUTH_BASE}/login`, payload);
    return data;
  },

  /**
   * Register a new user.
   * Returns user + access_token.
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(
      `${AUTH_BASE}/register`,
      payload,
    );
    return data;
  },
};
