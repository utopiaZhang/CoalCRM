import { apiClient } from './apiClient';
import { ArrivalRecord } from '../types';

export const arrivalRecordsService = {
  async list(): Promise<ArrivalRecord[]> {
    return apiClient.get<ArrivalRecord[]>('/api/arrival-records');
  },
  async create(payload: Partial<ArrivalRecord>): Promise<ArrivalRecord> {
    return apiClient.post<ArrivalRecord>('/api/arrival-records', payload);
  },
  async update(id: string, payload: Partial<ArrivalRecord>): Promise<ArrivalRecord> {
    return apiClient.put<ArrivalRecord>(`/api/arrival-records/${id}`, payload);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/arrival-records/${id}`);
  }
};

