import { apiClient } from './apiClient';
import { Shipment } from '../types';

export const shipmentsService = {
  async list(): Promise<Shipment[]> {
    return apiClient.get<Shipment[]>('/api/shipments');
  }
};

