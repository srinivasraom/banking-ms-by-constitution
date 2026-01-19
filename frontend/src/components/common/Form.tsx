import React from 'react';

// Input component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export function Input({
  label,
  error,
  helpText,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="label">
        {label}
        {props.required && <span className="text-danger-500 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        className={`input ${error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : ''} ${className}`}
        {...props}
      />
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
}

// Select component
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  helpText?: string;
  placeholder?: string;
}

export function Select({
  label,
  options,
  error,
  helpText,
  placeholder,
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="mb-4">
      <label htmlFor={selectId} className="label">
        {label}
        {props.required && <span className="text-danger-500 ml-1">*</span>}
      </label>
      <select
        id={selectId}
        className={`input ${error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : ''} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
}

// DatePicker component (native date input)
interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helpText?: string;
}

export function DatePicker({
  label,
  error,
  helpText,
  id,
  className = '',
  ...props
}: DatePickerProps) {
  const inputId = id || `date-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="label">
        {label}
        {props.required && <span className="text-danger-500 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        type="date"
        className={`input ${error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : ''} ${className}`}
        {...props}
      />
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
}

// Checkbox component
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export function Checkbox({
  label,
  description,
  id,
  className = '',
  ...props
}: CheckboxProps) {
  const inputId = id || `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-start mb-4">
      <div className="flex items-center h-5">
        <input
          id={inputId}
          type="checkbox"
          className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${className}`}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={inputId} className="font-medium text-gray-700">
          {label}
        </label>
        {description && <p className="text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

// Form group for horizontal layout
interface FormGroupProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}

export function FormGroup({ children, columns = 1 }: FormGroupProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
  };

  return <div className={`grid gap-4 ${gridClasses[columns]}`}>{children}</div>;
}

// Form error alert
interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps) {
  return (
    <div className="mb-4 p-4 bg-danger-500/10 border border-danger-500/20 rounded-md">
      <p className="text-sm text-danger-500">{message}</p>
    </div>
  );
}

export default Input;
