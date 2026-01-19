import { useState } from 'react';
import { AccountCreate, AccountType } from '../../types';
import { Input, Select, FormError, FormGroup } from '../common/Form';
import { Button } from '../common/Button';

interface AccountFormProps {
  onSubmit: (data: AccountCreate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

const accountTypeOptions = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
];

export function AccountForm({ onSubmit, onCancel, isLoading = false, error }: AccountFormProps) {
  const [formData, setFormData] = useState<AccountCreate>({
    account_type: 'checking',
    initial_deposit: 0,
    nickname: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'initial_deposit' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      nickname: formData.nickname || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <FormError message={error} />}

      <Select
        label="Account Type"
        name="account_type"
        value={formData.account_type}
        onChange={handleChange}
        options={accountTypeOptions}
        required
      />

      <Input
        label="Initial Deposit"
        type="number"
        name="initial_deposit"
        value={formData.initial_deposit?.toString() || '0'}
        onChange={handleChange}
        min={0}
        step="0.01"
        helpText="Minimum $0.00"
        leftAddon="$"
      />

      <Input
        label="Account Nickname (Optional)"
        type="text"
        name="nickname"
        value={formData.nickname || ''}
        onChange={handleChange}
        placeholder="e.g., My Savings, Emergency Fund"
        maxLength={100}
      />

      <FormGroup columns={2}>
        <Button type="button" variant="secondary" onClick={onCancel} className="w-full">
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
          Create Account
        </Button>
      </FormGroup>
    </form>
  );
}

export default AccountForm;
