import apiClient from './client';
import { Customer, CustomerUpdate } from '../types';

/**
 * Get the current customer's profile
 */
export async function getProfile(): Promise<Customer> {
  const response = await apiClient.get<Customer>('/customers/me');
  return response.data;
}

/**
 * Update the current customer's profile
 */
export async function updateProfile(data: CustomerUpdate): Promise<Customer> {
  const response = await apiClient.put<Customer>('/customers/me', data);
  return response.data;
}

/**
 * Deactivate the current customer's account
 */
export async function deactivateProfile(): Promise<Customer> {
  const response = await apiClient.delete<Customer>('/customers/me');
  return response.data;
}

export default {
  getProfile,
  updateProfile,
  deactivateProfile,
};
