// Enums
export type CustomerStatus = 'active' | 'inactive' | 'suspended';
export type AccountType = 'checking' | 'savings';
export type AccountStatus = 'active' | 'inactive' | 'closed' | 'frozen';
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';

// Customer types
export interface Customer {
  customer_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  date_of_birth: string;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  date_of_birth: string;
}

export interface CustomerUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// Account types
export interface Account {
  account_number: string;
  account_type: AccountType;
  balance: number;
  status: AccountStatus;
  nickname: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface AccountSummary {
  account_number: string;
  account_type: AccountType;
  balance: number;
  status: AccountStatus;
  nickname: string | null;
}

export interface AccountCreate {
  account_type: AccountType;
  initial_deposit?: number;
  nickname?: string;
}

export interface AccountUpdate {
  nickname?: string;
}

export interface AccountListResponse {
  accounts: AccountSummary[];
  total: number;
}

export interface AccountsAggregateResponse {
  total_accounts: number;
  active_accounts: number;
  total_balance: number;
  accounts_by_type: Record<string, number>;
}

// Transaction types
export interface Transaction {
  reference: string;
  transaction_type: TransactionType;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export interface TransactionCreate {
  transaction_type: TransactionType;
  amount: number;
  description?: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  next_cursor: string | null;
  has_more: boolean;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Error types
export interface ApiError {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ValidationError extends ApiError {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      errors: ValidationErrorDetail[];
    };
  };
}
