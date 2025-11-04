import { apiClient } from './apiClient';

export interface DriverSummary {
  id: string;
  name: string;
  phone: string;
  teamName?: string;
  plateNumbers: string[];
  createdAt: string;
}

export const driversService = {
  async list(): Promise<DriverSummary[]> {
    return apiClient.get<DriverSummary[]>('/api/drivers');
  },
  async create(payload: { name: string; phone?: string; teamName?: string; plateNumbers?: string[] }): Promise<DriverSummary> {
    return apiClient.post<DriverSummary>('/api/drivers', payload);
  },
  async update(id: string, payload: { name?: string; phone?: string; teamName?: string; plateNumbers?: string[] }): Promise<DriverSummary> {
    return apiClient.put<DriverSummary>(`/api/drivers/${id}`, payload);
  },
  async remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/drivers/${id}`);
  }
};

