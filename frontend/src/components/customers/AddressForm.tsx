import { Input, FormGroup } from '../common/Form';

interface AddressFormData {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface AddressFormProps {
  data: AddressFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export function AddressForm({ data, onChange, disabled = false }: AddressFormProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Address Line 1"
        type="text"
        name="address_line1"
        value={data.address_line1}
        onChange={onChange}
        required
        disabled={disabled}
        autoComplete="address-line1"
        placeholder="Street address"
      />

      <Input
        label="Address Line 2"
        type="text"
        name="address_line2"
        value={data.address_line2 || ''}
        onChange={onChange}
        disabled={disabled}
        autoComplete="address-line2"
        placeholder="Apartment, suite, etc. (optional)"
      />

      <FormGroup columns={3}>
        <Input
          label="City"
          type="text"
          name="city"
          value={data.city}
          onChange={onChange}
          required
          disabled={disabled}
          autoComplete="address-level2"
        />
        <Input
          label="State"
          type="text"
          name="state"
          value={data.state}
          onChange={onChange}
          required
          disabled={disabled}
          autoComplete="address-level1"
        />
        <Input
          label="Postal Code"
          type="text"
          name="postal_code"
          value={data.postal_code}
          onChange={onChange}
          required
          disabled={disabled}
          autoComplete="postal-code"
        />
      </FormGroup>

      <Input
        label="Country"
        type="text"
        name="country"
        value={data.country}
        onChange={onChange}
        disabled={disabled}
        autoComplete="country"
        maxLength={2}
        helpText="2-letter country code (e.g., US)"
      />
    </div>
  );
}

export default AddressForm;
