import { useState, useEffect } from 'react';
import { Customer, CustomerUpdate } from '../../types';
import { Input, FormError, FormGroup } from '../common/Form';
import { Button } from '../common/Button';
import { AddressForm } from './AddressForm';

interface ProfileFormProps {
  customer: Customer;
  onSubmit: (data: CustomerUpdate) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function ProfileForm({ customer, onSubmit, isLoading = false, error }: ProfileFormProps) {
  const [formData, setFormData] = useState<CustomerUpdate>({
    first_name: customer.first_name,
    last_name: customer.last_name,
    phone: customer.phone,
    address_line1: customer.address_line1,
    address_line2: customer.address_line2 || '',
    city: customer.city,
    state: customer.state,
    postal_code: customer.postal_code,
    country: customer.country,
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    // Reset form when customer changes
    setFormData({
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      address_line1: customer.address_line1,
      address_line2: customer.address_line2 || '',
      city: customer.city,
      state: customer.state,
      postal_code: customer.postal_code,
      country: customer.country,
    });
    setIsDirty(false);
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only send changed fields
    const changes: CustomerUpdate = {};
    const keys = Object.keys(formData) as (keyof CustomerUpdate)[];

    for (const key of keys) {
      const currentValue = formData[key];
      const originalValue = customer[key as keyof Customer];

      if (currentValue !== originalValue && currentValue !== '') {
        (changes as any)[key] = currentValue;
      }
    }

    if (Object.keys(changes).length > 0) {
      await onSubmit(changes);
      setIsDirty(false);
    }
  };

  const handleReset = () => {
    setFormData({
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      address_line1: customer.address_line1,
      address_line2: customer.address_line2 || '',
      city: customer.city,
      state: customer.state,
      postal_code: customer.postal_code,
      country: customer.country,
    });
    setIsDirty(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-medium mb-4">Personal Information</h3>
        <FormGroup columns={2}>
          <Input
            label="First Name"
            type="text"
            name="first_name"
            value={formData.first_name || ''}
            onChange={handleChange}
            required
            autoComplete="given-name"
          />
          <Input
            label="Last Name"
            type="text"
            name="last_name"
            value={formData.last_name || ''}
            onChange={handleChange}
            required
            autoComplete="family-name"
          />
        </FormGroup>

        <Input
          label="Phone Number"
          type="tel"
          name="phone"
          value={formData.phone || ''}
          onChange={handleChange}
          required
          autoComplete="tel"
          placeholder="+1234567890"
          helpText="E.164 format (e.g., +1234567890)"
        />
      </div>

      {/* Address */}
      <div>
        <h3 className="text-lg font-medium mb-4">Address</h3>
        <AddressForm
          data={{
            address_line1: formData.address_line1 || '',
            address_line2: formData.address_line2,
            city: formData.city || '',
            state: formData.state || '',
            postal_code: formData.postal_code || '',
            country: formData.country || 'US',
          }}
          onChange={handleChange}
        />
      </div>

      {/* Account Info (Read-only) */}
      <div>
        <h3 className="text-lg font-medium mb-4">Account Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Email
            </label>
            <p className="text-gray-900">{customer.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Customer ID
            </label>
            <p className="text-gray-900">{customer.customer_id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Date of Birth
            </label>
            <p className="text-gray-900">
              {new Date(customer.date_of_birth).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Member Since
            </label>
            <p className="text-gray-900">
              {new Date(customer.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
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

export default ProfileForm;
