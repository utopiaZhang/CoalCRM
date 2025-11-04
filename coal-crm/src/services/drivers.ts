import { apiClient } from './apiClient';

export interface DriverSummary {
  id: string;
  name: string;
  phone: string;
  plateNumbers: string[];
  createdAt: string;
}

export const driversService = {
  async list(): Promise<DriverSummary[]> {
    return apiClient.get<DriverSummary[]>('/api/drivers');
  }
};

