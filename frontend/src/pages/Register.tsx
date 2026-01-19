import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input, DatePicker, FormError, FormGroup } from '../components/common/Form';
import { Button } from '../components/common/Button';
import { getErrorMessage } from '../api/client';
import { CustomerCreate } from '../types';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CustomerCreate>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    date_of_birth: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Auto-format phone to E.164 format
    if (name === 'phone') {
      let formattedPhone = value;
      // Remove all non-digit characters except leading +
      const digits = value.replace(/[^\d+]/g, '');
      // If starts with digits only, add + prefix
      if (digits && !digits.startsWith('+')) {
        formattedPhone = '+' + digits;
      } else {
        formattedPhone = digits;
      }
      setFormData((prev) => ({ ...prev, [name]: formattedPhone }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <FormError message={error} />}

          <div className="card">
            <h3 className="text-lg font-medium mb-4">Account Information</h3>
            <FormGroup columns={2}>
              <Input
                label="Email address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                helpText="At least 8 characters"
              />
            </FormGroup>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium mb-4">Personal Information</h3>
            <FormGroup columns={2}>
              <Input
                label="First name"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                autoComplete="given-name"
              />
              <Input
                label="Last name"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                autoComplete="family-name"
              />
            </FormGroup>

            <FormGroup columns={2}>
              <Input
                label="Phone number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                autoComplete="tel"
                placeholder="+14155551234"
                helpText="Include country code (e.g., +1 for US)"
              />
              <DatePicker
                label="Date of birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
                helpText="Must be 18 years or older"
              />
            </FormGroup>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium mb-4">Address</h3>
            <Input
              label="Address line 1"
              type="text"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              required
              autoComplete="address-line1"
              placeholder="Street address"
            />
            <Input
              label="Address line 2"
              type="text"
              name="address_line2"
              value={formData.address_line2 || ''}
              onChange={handleChange}
              autoComplete="address-line2"
              placeholder="Apartment, suite, etc. (optional)"
            />

            <FormGroup columns={3}>
              <Input
                label="City"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                autoComplete="address-level2"
              />
              <Input
                label="State"
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                autoComplete="address-level1"
              />
              <Input
                label="Postal code"
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                required
                autoComplete="postal-code"
              />
            </FormGroup>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
          >
            Create account
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Register;
