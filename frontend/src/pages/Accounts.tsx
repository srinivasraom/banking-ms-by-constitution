import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountCard, AccountForm } from '../components/accounts';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { getAccounts, createAccount } from '../api/accounts';
import { getErrorMessage } from '../api/client';
import { AccountCreate, AccountStatus } from '../types';

const statusFilters: { value: AccountStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Accounts' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
];

export function Accounts() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [createError, setCreateError] = useState('');

  const {
    data: accountsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['accounts', statusFilter === 'all' ? undefined : statusFilter],
    queryFn: () => getAccounts(statusFilter === 'all' ? undefined : statusFilter),
  });

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsCreateModalOpen(false);
      setCreateError('');
    },
    onError: (err) => {
      setCreateError(getErrorMessage(err));
    },
  });

  const handleCreateAccount = async (data: AccountCreate) => {
    setCreateError('');
    await createMutation.mutateAsync(data);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-danger-50 border border-danger-200 rounded-md p-4">
          <p className="text-danger-700">Failed to load accounts: {getErrorMessage(error)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Accounts</h1>
          <p className="text-gray-600 mt-1">
            Manage your checking and savings accounts
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          + New Account
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Account Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : accountsData?.accounts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No accounts found</p>
          <p className="text-gray-400 mt-2">
            {statusFilter !== 'all'
              ? 'Try changing the filter or create a new account.'
              : 'Get started by creating your first account.'}
          </p>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4"
          >
            Create Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accountsData?.accounts.map((account) => (
            <AccountCard key={account.account_number} account={account} />
          ))}
        </div>
      )}

      {/* Total */}
      {accountsData && accountsData.total > 0 && (
        <div className="mt-6 text-sm text-gray-500">
          Showing {accountsData.accounts.length} of {accountsData.total} accounts
        </div>
      )}

      {/* Create Account Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateError('');
        }}
        title="Create New Account"
      >
        <AccountForm
          onSubmit={handleCreateAccount}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setCreateError('');
          }}
          isLoading={createMutation.isPending}
          error={createError}
        />
      </Modal>
    </div>
  );
}

export default Accounts;
