import { useState } from 'react';
import { Account, AccountUpdate } from '../../types';
import { Input, FormError } from '../common/Form';
import { Button } from '../common/Button';

interface AccountSettingsProps {
  account: Account;
  onSubmit: (data: AccountUpdate) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function AccountSettings({ account, onSubmit, isLoading = false, error }: AccountSettingsProps) {
  const [nickname, setNickname] = useState(account.nickname || '');
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ nickname: nickname || undefined });
    setIsDirty(false);
  };

  const handleReset = () => {
    setNickname(account.nickname || '');
    setIsDirty(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <FormError message={error} />}

      <Input
        label="Account Nickname"
        type="text"
        name="nickname"
        value={nickname}
        onChange={handleChange}
        placeholder="e.g., My Savings, Emergency Fund"
        maxLength={100}
        helpText="A friendly name to identify this account"
      />

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleReset}
          disabled={!isDirty || isLoading}
        >
          Reset
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={!isDirty}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}

export default AccountSettings;
