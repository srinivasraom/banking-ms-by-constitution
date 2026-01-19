import apiClient from './client';
import {
  Transaction,
  TransactionCreate,
  TransactionListResponse,
  TransactionType,
} from '../types';

interface GetTransactionsParams {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  cursor?: string;
  limit?: number;
}

/**
 * Create a new transaction (deposit or withdrawal)
 */
export async function createTransaction(
  accountNumber: string,
  data: TransactionCreate
): Promise<Transaction> {
  const response = await apiClient.post<Transaction>(
    `/accounts/${accountNumber}/transactions`,
    data
  );
  return response.data;
}

/**
 * Get transaction history for an account
 */
export async function getTransactions(
  accountNumber: string,
  params?: GetTransactionsParams
): Promise<TransactionListResponse> {
  const queryParams: Record<string, string | number> = {};

  if (params?.startDate) queryParams.start_date = params.startDate;
  if (params?.endDate) queryParams.end_date = params.endDate;
  if (params?.type) queryParams.type = params.type;
  if (params?.cursor) queryParams.cursor = params.cursor;
  if (params?.limit) queryParams.limit = params.limit;

  const response = await apiClient.get<TransactionListResponse>(
    `/accounts/${accountNumber}/transactions`,
    { params: queryParams }
  );
  return response.data;
}

/**
 * Get a single transaction by reference
 */
export async function getTransaction(
  accountNumber: string,
  reference: string
): Promise<Transaction> {
  const response = await apiClient.get<Transaction>(
    `/accounts/${accountNumber}/transactions/${reference}`
  );
  return response.data;
}

export default {
  createTransaction,
  getTransactions,
  getTransaction,
};
