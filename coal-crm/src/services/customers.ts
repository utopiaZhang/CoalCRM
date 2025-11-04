import { apiClient } from './apiClient';
import { Customer } from '../types';

export const customersService = {
  async list(): Promise<Customer[]> {
    return apiClient.get<Customer[]>('/api/customers');
  },
  async create(payload: Partial<Customer> & { name: string }): Promise<Customer> {
    return apiClient.post<Customer>('/api/customers', payload);
  },
  async update(id: string, payload: Partial<Customer>): Promise<Customer> {
    return apiClient.put<Customer>(`/api/customers/${id}`, payload);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/customers/${id}`);
  }
};

