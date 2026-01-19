import { Link } from 'react-router-dom';
import { AccountSummary, AccountStatus } from '../../types';

interface AccountCardProps {
  account: AccountSummary;
}

const statusColors: Record<AccountStatus, string> = {
  active: 'bg-success-100 text-success-700',
  inactive: 'bg-warning-100 text-warning-700',
  closed: 'bg-gray-100 text-gray-600',
  frozen: 'bg-danger-100 text-danger-700',
};

const accountTypeIcons: Record<string, string> = {
  checking: '💳',
  savings: '🏦',
};

export function AccountCard({ account }: AccountCardProps) {
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(account.balance);

  const displayName = account.nickname || `${account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account`;
  const maskedNumber = `****${account.account_number.slice(-4)}`;

  return (
    <Link
      to={`/accounts/${account.account_number}`}
      className="block card hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{accountTypeIcons[account.account_type]}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{displayName}</h3>
            <p className="text-sm text-gray-500">{maskedNumber}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[account.status]}`}
        >
          {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-500">Available Balance</p>
        <p className="text-2xl font-bold text-gray-900">{formattedBalance}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-primary-600 hover:text-primary-700">
          View details →
        </p>
      </div>
    </Link>
  );
}

export default AccountCard;
