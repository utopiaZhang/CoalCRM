import { apiClient } from './apiClient';
import { LoanRecord, RepaymentRecord } from '../types';

export interface CreateLoanPayload {
  type: 'borrow' | 'lend';
  counterparty: string;
  counterpartyPhone?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  dueDate?: string | null;
  description?: string;
}

export const loansService = {
  async list(): Promise<LoanRecord[]> {
    return apiClient.get<LoanRecord[]>('/api/loans');
  },

  async create(payload: CreateLoanPayload): Promise<LoanRecord> {
    return apiClient.post<LoanRecord>('/api/loans', payload);
  },

  async update(id: string, payload: Partial<CreateLoanPayload & { status?: LoanRecord['status'] }>): Promise<LoanRecord> {
    return apiClient.put<LoanRecord>(`/api/loans/${id}`, payload);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/loans/${id}`);
  },

  async addRepayment(loanId: string, payload: Omit<RepaymentRecord, 'id' | 'createdAt' | 'loanRecordId'>): Promise<RepaymentRecord> {
    return apiClient.post<RepaymentRecord>(`/api/loans/${loanId}/repayments`, payload);
  }
};

