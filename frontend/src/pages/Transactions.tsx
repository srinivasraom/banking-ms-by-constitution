import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getAccount } from '../api/accounts';
import { getTransactions, createTransaction } from '../api/transactions';
import { getErrorMessage } from '../api/client';
import {
  TransactionForm,
  TransactionList,
  TransactionFilters,
  TransactionFilterValues,
} from '../components/transactions';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { TransactionCreate, TransactionType } from '../types';

export function Transactions() {
  const { accountNumber } = useParams<{ accountNumber: string }>();
  const queryClient = useQueryClient();

  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [transactionError, setTransactionError] = useState('');
  const [filters, setFilters] = useState<TransactionFilterValues>({});

  // Get account details
  const { data: account, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['account', accountNumber],
    queryFn: () => getAccount(accountNumber!),
    enabled: !!accountNumber,
  });

  // Get transactions with infinite scrolling
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['transactions', accountNumber, filters],
    queryFn: ({ pageParam }) =>
      getTransactions(accountNumber!, {
        ...filters,
        cursor: pageParam,
        limit: 20,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
    enabled: !!accountNumber,
  });

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: (data: TransactionCreate) => createTransaction(accountNumber!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', accountNumber] });
      queryClient.invalidateQueries({ queryKey: ['account', accountNumber] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsNewTransactionOpen(false);
      setTransactionError('');
    },
    onError: (err) => {
      setTransactionError(getErrorMessage(err));
    },
  });

  const handleCreateTransaction = async (data: TransactionCreate) => {
    setTransactionError('');
    await createMutation.mutateAsync(data);
  };

  const handleApplyFilters = (newFilters: TransactionFilterValues) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  // Flatten transactions from all pages
  const transactions = transactionsData?.pages.flatMap((page) => page.transactions) || [];
  const totalTransactions = transactionsData?.pages[0]?.total || 0;

  if (!accountNumber) {
    return (
      <div className="p-6">
        <p className="text-danger-600">Account number is required</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 flex gap-2 text-sm">
        <Link to="/accounts" className="text-primary-600 hover:text-primary-700">
          Accounts
        </Link>
        <span className="text-gray-400">/</span>
        <Link
          to={`/accounts/${accountNumber}`}
          className="text-primary-600 hover:text-primary-700"
        >
          {accountNumber}
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">Transactions</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          {account && (
            <p className="text-gray-500 mt-1">
              {account.nickname || `${account.account_type} Account`} •
              Current Balance: ${account.balance.toFixed(2)}
            </p>
          )}
        </div>
        <Button
          variant="primary"
          onClick={() => setIsNewTransactionOpen(true)}
          disabled={!account || account.status !== 'active'}
        >
          + New Transaction
        </Button>
      </div>

      {/* Filters */}
      <TransactionFilters onApply={handleApplyFilters} onClear={handleClearFilters} />

      {/* Transaction Count */}
      {totalTransactions > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          {totalTransactions} transaction{totalTransactions !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Transaction List */}
      <TransactionList
        transactions={transactions}
        isLoading={isLoadingTransactions}
        hasMore={hasNextPage}
        onLoadMore={() => fetchNextPage()}
        isLoadingMore={isFetchingNextPage}
      />

      {/* New Transaction Modal */}
      <Modal
        isOpen={isNewTransactionOpen}
        onClose={() => {
          setIsNewTransactionOpen(false);
          setTransactionError('');
        }}
        title="New Transaction"
      >
        {account && (
          <TransactionForm
            onSubmit={handleCreateTransaction}
            onCancel={() => {
              setIsNewTransactionOpen(false);
              setTransactionError('');
            }}
            accountBalance={account.balance}
            isLoading={createMutation.isPending}
            error={transactionError}
          />
        )}
      </Modal>
    </div>
  );
}

export default Transactions;
