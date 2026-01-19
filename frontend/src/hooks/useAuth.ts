import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { setTokens, clearTokens, getAccessToken } from '../api/client';
import { Customer, LoginRequest, TokenResponse, CustomerCreate } from '../types';

interface AuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: CustomerCreate) => Promise<void>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    try {
      const response = await apiClient.get<Customer>('/customers/me');
      setCustomer(response.data);
    } catch {
      setCustomer(null);
      clearTokens();
    }
  }, []);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        await fetchCustomer();
      }
      setIsLoading(false);
    };
    initAuth();
  }, [fetchCustomer]);

  const login = async (credentials: LoginRequest): Promise<void> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', credentials);
    setTokens(response.data.access_token, response.data.refresh_token);
    await fetchCustomer();
  };

  const register = async (data: CustomerCreate): Promise<void> => {
    // Register creates the customer and returns tokens
    const response = await apiClient.post<TokenResponse>('/auth/register', data);
    setTokens(response.data.access_token, response.data.refresh_token);
    await fetchCustomer();
  };

  const logout = (): void => {
    clearTokens();
    setCustomer(null);
  };

  const refreshCustomer = async (): Promise<void> => {
    await fetchCustomer();
  };

  const value: AuthContextType = {
    customer,
    isAuthenticated: !!customer,
    isLoading,
    login,
    register,
    logout,
    refreshCustomer,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
