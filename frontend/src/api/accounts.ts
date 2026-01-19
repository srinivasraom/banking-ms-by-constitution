import apiClient from './client';
import {
  Account,
  AccountCreate,
  AccountUpdate,
  AccountListResponse,
  AccountsAggregateResponse,
  AccountStatus,
} from '../types';

/**
 * Create a new bank account
 */
export async function createAccount(data: AccountCreate): Promise<Account> {
  const response = await apiClient.post<Account>('/accounts', data);
  return response.data;
}

/**
 * Get all accounts for the current customer
 */
export async function getAccounts(status?: AccountStatus): Promise<AccountListResponse> {
  const params = status ? { status } : {};
  const response = await apiClient.get<AccountListResponse>('/accounts', { params });
  return response.data;
}

/**
 * Get account details by account number
 */
export async function getAccount(accountNumber: string): Promise<Account> {
  const response = await apiClient.get<Account>(`/accounts/${accountNumber}`);
  return response.data;
}

/**
 * Update account settings (e.g., nickname)
 */
export async function updateAccount(
  accountNumber: string,
  data: AccountUpdate
): Promise<Account> {
  const response = await apiClient.patch<Account>(`/accounts/${accountNumber}`, data);
  return response.data;
}

/**
 * Close an account (requires zero balance)
 */
export async function closeAccount(accountNumber: string): Promise<Account> {
  const response = await apiClient.delete<Account>(`/accounts/${accountNumber}`, {
    data: { confirm: true },
  });
  return response.data;
}

/**
 * Get aggregate summary of all accounts
 */
export async function getAccountsSummary(): Promise<AccountsAggregateResponse> {
  const response = await apiClient.get<AccountsAggregateResponse>('/accounts/summary');
  return response.data;
}

export default {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  closeAccount,
  getAccountsSummary,
};
