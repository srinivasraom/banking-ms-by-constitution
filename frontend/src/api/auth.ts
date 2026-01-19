import apiClient, { setTokens, clearTokens } from './client';
import { LoginRequest, TokenResponse, CustomerCreate } from '../types';

/**
 * Register a new customer
 */
export async function register(data: CustomerCreate): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/auth/register', data);
  setTokens(response.data.access_token, response.data.refresh_token);
  return response.data;
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/auth/login', data);
  setTokens(response.data.access_token, response.data.refresh_token);
  return response.data;
}

/**
 * Refresh access token using refresh token
 */
export async function refresh(refreshToken: string): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  setTokens(response.data.access_token, response.data.refresh_token);
  return response.data;
}

/**
 * Logout and clear tokens
 */
export function logout(): void {
  clearTokens();
}

export default {
  register,
  login,
  refresh,
  logout,
};
