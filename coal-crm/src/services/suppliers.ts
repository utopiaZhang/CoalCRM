import { apiClient } from './apiClient';
import { Supplier } from '../types';

export const suppliersService = {
  async list(): Promise<Supplier[]> {
    return apiClient.get<Supplier[]>('/api/suppliers');
  },
  async create(payload: Partial<Supplier> & { name: string }): Promise<Supplier> {
    return apiClient.post<Supplier>('/api/suppliers', payload);
  },
  async update(id: string, payload: Partial<Supplier>): Promise<Supplier> {
    return apiClient.put<Supplier>(`/api/suppliers/${id}`, payload);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/suppliers/${id}`);
  }
};

