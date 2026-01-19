import { useState } from 'react';
import { TransactionCreate, TransactionType } from '../../types';
import { Input, Select, FormError } from '../common/Form';
import { Button } from '../common/Button';

interface TransactionFormProps {
  onSubmit: (data: TransactionCreate) => Promise<void>;
  onCancel: () => void;
  accountBalance: number;
  isLoading?: boolean;
  error?: string;
}

const transactionTypeOptions = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
];

export function TransactionForm({
  onSubmit,
  onCancel,
  accountBalance,
  isLoading = false,
  error,
}: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionCreate>({
    transaction_type: 'deposit',
    amount: 0,
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      description: formData.description || undefined,
    });
  };

  const isWithdrawal = formData.transaction_type === 'withdrawal';
  const maxAmount = isWithdrawal ? accountBalance : undefined;
  const insufficientFunds = isWithdrawal && formData.amount > accountBalance;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <FormError message={error} />}

      <Select
        label="Transaction Type"
        name="transaction_type"
        value={formData.transaction_type}
        onChange={handleChange}
        options={transactionTypeOptions}
        required
      />

      <div>
        <Input
          label="Amount"
          type="number"
          name="amount"
          value={formData.amount?.toString() || '0'}
          onChange={handleChange}
          min={0.01}
          max={maxAmount}
          step="0.01"
          required
          leftAddon="$"
        />
        {isWithdrawal && (
          <p className="mt-1 text-sm text-gray-500">
            Available balance: ${accountBalance.toFixed(2)}
          </p>
        )}
        {insufficientFunds && (
          <p className="mt-1 text-sm text-danger-600">
            Amount exceeds available balance
          </p>
        )}
      </div>

      <Input
        label="Description (Optional)"
        type="text"
        name="description"
        value={formData.description || ''}
        onChange={handleChange}
        placeholder="e.g., Salary deposit, Grocery shopping"
        maxLength={500}
      />

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          variant={isWithdrawal ? 'danger' : 'primary'}
          isLoading={isLoading}
          disabled={insufficientFunds || formData.amount <= 0}
          className="flex-1"
        >
          {isWithdrawal ? 'Withdraw' : 'Deposit'}
        </Button>
      </div>
    </form>
  );
}

export default TransactionForm;
