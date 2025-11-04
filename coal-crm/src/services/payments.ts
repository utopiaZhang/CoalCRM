import { apiClient } from './apiClient';
import { CargoPayment, CustomerPayment, FreightPayment } from '../types';
import { ExtendedFreightPayment } from './dataStore';

export const paymentsService = {
  // 货款支付
  async listCargo(): Promise<CargoPayment[]> {
    return apiClient.get<CargoPayment[]>('/api/payments/cargo');
  },
  async createCargo(payload: Omit<CargoPayment, 'id' | 'createdAt'>): Promise<CargoPayment> {
    return apiClient.post<CargoPayment>('/api/payments/cargo', payload);
  },

  // 运费支付（支持arrivalRecordId）
  async listFreight(): Promise<ExtendedFreightPayment[]> {
    return apiClient.get<ExtendedFreightPayment[]>('/api/payments/freight');
  },
  async createFreight(payload: Omit<ExtendedFreightPayment, 'id' | 'createdAt'>): Promise<ExtendedFreightPayment> {
    return apiClient.post<ExtendedFreightPayment>('/api/payments/freight', payload);
  },
  async removeFreight(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/payments/freight/${id}`);
  },

  // 客户收款
  async listCustomer(): Promise<CustomerPayment[]> {
    return apiClient.get<CustomerPayment[]>('/api/payments/customer');
  },
  async createCustomer(payload: Omit<CustomerPayment, 'id' | 'createdAt'>): Promise<CustomerPayment> {
    return apiClient.post<CustomerPayment>('/api/payments/customer', payload);
  }
};

