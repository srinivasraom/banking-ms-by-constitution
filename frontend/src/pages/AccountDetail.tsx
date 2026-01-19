import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccount, updateAccount, closeAccount } from '../api/accounts';
import { getTransactions, createTransaction } from '../api/transactions';
import { getErrorMessage } from '../api/client';
import { AccountSettings } from '../components/accounts';
import { TransactionForm, TransactionList } from '../components/transactions';
import { Button } from '../components/common/Button';
import { Modal, ConfirmModal } from '../components/common/Modal';
import { AccountStatus, AccountUpdate, TransactionCreate } from '../types';

const statusColors: Record<AccountStatus, string> = {
  active: 'bg-success-100 text-success-700',
  inactive: 'bg-warning-100 text-warning-700',
  closed: 'bg-gray-100 text-gray-600',
  frozen: 'bg-danger-100 text-danger-700',
};

export function AccountDetail() {
  const { accountNumber } = useParams<{ accountNumber: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [closeError, setCloseError] = useState('');
  const [transactionError, setTransactionError] = useState('');

  const {
    data: account,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['account', accountNumber],
    queryFn: () => getAccount(accountNumber!),
    enabled: !!accountNumber,
  });

  // Get recent transactions
  const { data: recentTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', accountNumber, 'recent'],
    queryFn: () => getTransactions(accountNumber!, { limit: 5 }),
    enabled: !!accountNumber,
  });

  const updateMutation = useMutation({
    mutationFn: (data: AccountUpdate) => updateAccount(accountNumber!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', accountNumber] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setUpdateError('');
    },
    onError: (err) => {
      setUpdateError(getErrorMessage(err));
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => closeAccount(accountNumber!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      navigate('/accounts');
    },
    onError: (err) => {
      setCloseError(getErrorMessage(err));
    },
  });

  const transactionMutation = useMutation({
    mutationFn: (data: TransactionCreate) => createTransaction(accountNumber!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', accountNumber] });
      queryClient.invalidateQueries({ queryKey: ['account', accountNumber] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsTransactionModalOpen(false);
      setTransactionError('');
    },
    onError: (err) => {
      setTransactionError(getErrorMessage(err));
    },
  });

  const handleUpdate = async (data: AccountUpdate) => {
    setUpdateError('');
    await updateMutation.mutateAsync(data);
  };

  const handleClose = async () => {
    setCloseError('');
    await closeMutation.mutateAsync();
  };

  const handleTransaction = async (data: TransactionCreate) => {
    setTransactionError('');
    await transactionMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="card">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="p-6">
        <div className="bg-danger-50 border border-danger-200 rounded-md p-4">
          <p className="text-danger-700">
            {error ? getErrorMessage(error) : 'Account not found'}
          </p>
          <Link to="/accounts" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
            ← Back to Accounts
          </Link>
        </div>
      </div>
    );
  }

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(account.balance);

  const displayName = account.nickname || `${account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account`;
  const isClosed = account.status === 'closed';
  const canClose = !isClosed && account.balance === 0;
  const canTransact = account.status === 'active';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link to="/accounts" className="text-primary-600 hover:text-primary-700">
          ← Back to Accounts
        </Link>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
          <p className="text-gray-500 mt-1">
            Account: {account.account_number.replace(/(\d{4})(?=\d)/g, '$1 ')}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[account.status]}`}
        >
          {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
        </span>
      </div>

      {/* Balance Card with Quick Actions */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-700 mb-2">Current Balance</h2>
            <p className="text-4xl font-bold text-gray-900">{formattedBalance}</p>
            <p className="text-sm text-gray-500 mt-2">
              Available for withdrawal: {formattedBalance}
            </p>
          </div>
          {canTransact && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => setIsTransactionModalOpen(true)}
              >
                + New Transaction
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
          <Link
            to={`/accounts/${accountNumber}/transactions`}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            View All →
          </Link>
        </div>
        <TransactionList
          transactions={recentTransactions?.transactions || []}
          isLoading={isLoadingTransactions}
        />
      </div>

      {/* Account Info & Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Account Type</dt>
              <dd className="text-gray-900">
                {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Opened On</dt>
              <dd className="text-gray-900">
                {new Date(account.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            {account.closed_at && (
              <div>
                <dt className="text-sm text-gray-500">Closed On</dt>
                <dd className="text-gray-900">
                  {new Date(account.closed_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Settings */}
        {!isClosed && (
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h2>
            <AccountSettings
              account={account}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
              error={updateError}
            />
          </div>
        )}
      </div>

      {/* Danger Zone */}
      {!isClosed && (
        <div className="card border-danger-200">
          <h2 className="text-lg font-medium text-danger-600 mb-4">Danger Zone</h2>
          <p className="text-gray-600 mb-4">
            Closing an account is permanent and cannot be undone. The account must have a zero balance.
          </p>
          {!canClose && account.balance > 0 && (
            <p className="text-warning-600 mb-4 text-sm">
              This account has a balance of {formattedBalance}. Please withdraw all funds before closing.
            </p>
          )}
          {closeError && (
            <p className="text-danger-600 mb-4 text-sm">{closeError}</p>
          )}
          <Button
            variant="danger"
            onClick={() => setIsCloseModalOpen(true)}
            disabled={!canClose || closeMutation.isPending}
          >
            Close Account
          </Button>
        </div>
      )}

      {/* Close Confirmation Modal */}
      <ConfirmModal
        isOpen={isCloseModalOpen}
        onClose={() => {
          setIsCloseModalOpen(false);
          setCloseError('');
        }}
        onConfirm={handleClose}
        title="Close Account"
        message={`Are you sure you want to close account ${account.account_number}? This action cannot be undone.`}
        confirmText="Yes, Close Account"
        isLoading={closeMutation.isPending}
      />

      {/* New Transaction Modal */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setTransactionError('');
        }}
        title="New Transaction"
      >
        <TransactionForm
          onSubmit={handleTransaction}
          onCancel={() => {
            setIsTransactionModalOpen(false);
            setTransactionError('');
          }}
          accountBalance={account.balance}
          isLoading={transactionMutation.isPending}
          error={transactionError}
        />
      </Modal>
    </div>
  );
}

export default AccountDetail;
