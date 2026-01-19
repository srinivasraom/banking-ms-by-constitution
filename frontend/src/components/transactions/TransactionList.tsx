import { Transaction, TransactionType } from '../../types';
import { Button } from '../common/Button';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

const transactionTypeStyles: Record<TransactionType, { icon: string; color: string }> = {
  deposit: { icon: '↓', color: 'text-success-600' },
  withdrawal: { icon: '↑', color: 'text-danger-600' },
  transfer_in: { icon: '←', color: 'text-success-600' },
  transfer_out: { icon: '→', color: 'text-danger-600' },
};

const transactionTypeLabels: Record<TransactionType, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
};

export function TransactionList({
  transactions,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg">No transactions found</p>
        <p className="text-sm mt-1">Make a deposit or withdrawal to see your transaction history</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const style = transactionTypeStyles[transaction.transaction_type];
        const isCredit = ['deposit', 'transfer_in'].includes(transaction.transaction_type);
        const formattedAmount = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(transaction.amount);

        return (
          <div
            key={transaction.reference}
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                isCredit ? 'bg-success-100' : 'bg-danger-100'
              } ${style.color}`}
            >
              {style.icon}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">
                {transactionTypeLabels[transaction.transaction_type]}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {transaction.description || 'No description'}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(transaction.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className={`font-semibold ${style.color}`}>
                {isCredit ? '+' : '-'}{formattedAmount}
              </p>
              <p className="text-xs text-gray-500">
                Balance: ${transaction.balance_after.toFixed(2)}
              </p>
            </div>
          </div>
        );
      })}

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="pt-4 text-center">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            isLoading={isLoadingMore}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

export default TransactionList;
