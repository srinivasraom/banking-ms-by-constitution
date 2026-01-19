import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { ProfileForm } from '../components/customers';
import { Button } from '../components/common/Button';
import { ConfirmModal } from '../components/common/Modal';
import { updateProfile, deactivateProfile } from '../api/customers';
import { getErrorMessage } from '../api/client';
import { CustomerUpdate } from '../types';

export function Profile() {
  const { customer, refreshCustomer, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [deactivateError, setDeactivateError] = useState('');

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await refreshCustomer();
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      setUpdateError('');
    },
    onError: (err) => {
      setUpdateError(getErrorMessage(err));
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateProfile,
    onSuccess: () => {
      logout();
      navigate('/login');
    },
    onError: (err) => {
      setDeactivateError(getErrorMessage(err));
    },
  });

  const handleUpdate = async (data: CustomerUpdate) => {
    setUpdateError('');
    await updateMutation.mutateAsync(data);
  };

  const handleDeactivate = async () => {
    setDeactivateError('');
    await deactivateMutation.mutateAsync();
  };

  if (!customer) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="card">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            customer.status === 'active'
              ? 'bg-success-100 text-success-700'
              : 'bg-warning-100 text-warning-700'
          }`}
        >
          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)} Account
        </span>
      </div>

      {/* Profile Form */}
      <div className="card mb-6">
        <ProfileForm
          customer={customer}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
          error={updateError}
        />
      </div>

      {/* Danger Zone */}
      <div className="card border-danger-200">
        <h2 className="text-lg font-medium text-danger-600 mb-4">Danger Zone</h2>
        <p className="text-gray-600 mb-4">
          Deactivating your account will prevent you from logging in and accessing your banking services.
          You must close all active accounts before deactivating your profile.
        </p>
        {deactivateError && (
          <p className="text-danger-600 mb-4 text-sm">{deactivateError}</p>
        )}
        <Button
          variant="danger"
          onClick={() => setIsDeactivateModalOpen(true)}
          disabled={deactivateMutation.isPending}
        >
          Deactivate Account
        </Button>
      </div>

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeactivateModalOpen}
        onClose={() => {
          setIsDeactivateModalOpen(false);
          setDeactivateError('');
        }}
        onConfirm={handleDeactivate}
        title="Deactivate Account"
        message="Are you sure you want to deactivate your account? You will no longer be able to access your banking services. This action requires all accounts to be closed first."
        confirmText="Yes, Deactivate"
        isLoading={deactivateMutation.isPending}
      />
    </div>
  );
}

export default Profile;
