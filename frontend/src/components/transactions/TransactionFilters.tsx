import { useState } from 'react';
import { TransactionType } from '../../types';
import { Input, Select, FormGroup } from '../common/Form';
import { Button } from '../common/Button';

interface TransactionFiltersProps {
  onApply: (filters: TransactionFilterValues) => void;
  onClear: () => void;
}

export interface TransactionFilterValues {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
}

const transactionTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
];

export function TransactionFilters({ onApply, onClear }: TransactionFiltersProps) {
  const [filters, setFilters] = useState<TransactionFilterValues>({
    startDate: '',
    endDate: '',
    type: undefined,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleApply = () => {
    onApply({
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      type: filters.type || undefined,
    });
  };

  const handleClear = () => {
    setFilters({
      startDate: '',
      endDate: '',
      type: undefined,
    });
    onClear();
  };

  const hasFilters = filters.startDate || filters.endDate || filters.type;

  return (
    <div className="card mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Filter Transactions</h3>
      <div className="space-y-3">
        <FormGroup columns={3}>
          <Input
            label="From Date"
            type="date"
            name="startDate"
            value={filters.startDate || ''}
            onChange={handleChange}
          />
          <Input
            label="To Date"
            type="date"
            name="endDate"
            value={filters.endDate || ''}
            onChange={handleChange}
          />
          <Select
            label="Type"
            name="type"
            value={filters.type || ''}
            onChange={handleChange}
            options={transactionTypeOptions}
          />
        </FormGroup>

        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={handleApply}>
            Apply Filters
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionFilters;
