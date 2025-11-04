import { apiClient } from './apiClient';
import { DeliveryBatch, BatchPaymentRecord } from '../types';

// 后端 /api/batches POST 接收的创建负载
export interface CreateBatchPayload {
  customerId: string;
  customerName: string;
  supplierId: string;
  supplierName: string;
  departureDate: string;
  coalPrice: number;
  vehicles: Array<{
    plateNumber: string;
    driverName?: string;
    weight: number;
    amount: number;
  }>;
}

export const batchesService = {
  async list(): Promise<DeliveryBatch[]> {
    return apiClient.get<DeliveryBatch[]>('/api/batches');
  },

  async create(payload: CreateBatchPayload): Promise<DeliveryBatch> {
    return apiClient.post<DeliveryBatch>('/api/batches', payload as any);
  },

  async update(id: string, payload: Partial<DeliveryBatch>): Promise<DeliveryBatch> {
    return apiClient.put<DeliveryBatch>(`/api/batches/${id}`, payload);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/batches/${id}`);
  },

  async addPayment(batchId: string, payload: Omit<BatchPaymentRecord, 'id' | 'createdAt' | 'batchId'>): Promise<BatchPaymentRecord> {
    return apiClient.post<BatchPaymentRecord>(`/api/batches/${batchId}/payments`, payload);
  }
};
