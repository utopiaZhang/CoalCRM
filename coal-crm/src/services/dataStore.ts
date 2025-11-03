// 全局数据存储服务
import { FreightPayment } from '../types';

// 扩展运费支付接口以支持到货记录关联
export interface ExtendedFreightPayment extends Omit<FreightPayment, 'plateNumbers'> {
  arrivalRecordId?: string; // 关联的到货记录ID
  plateNumber?: string; // 单个车牌号
  plateNumbers?: string[]; // 多个车牌号（保持兼容性）
}

class DataStore {
  private freightPayments: ExtendedFreightPayment[] = [
    {
      id: '1',
      driverId: '1',
      driverName: '张师傅',
      plateNumbers: ['京A12345'],
      calculatedAmount: 4260,
      actualAmount: 4200,
      paymentDate: '2024-01-17',
      remark: '取整支付',
      createdAt: '2024-01-17'
    }
  ];

  private listeners: Array<() => void> = [];

  // 添加运费支付记录
  addFreightPayment(payment: ExtendedFreightPayment) {
    this.freightPayments.push(payment);
    this.notifyListeners();
  }

  // 获取所有运费支付记录
  getFreightPayments(): ExtendedFreightPayment[] {
    return [...this.freightPayments];
  }

  // 根据到货记录ID获取运费支付记录
  getFreightPaymentsByArrivalRecord(arrivalRecordId: string): ExtendedFreightPayment[] {
    return this.freightPayments.filter(payment => payment.arrivalRecordId === arrivalRecordId);
  }

  // 删除运费支付记录
  removeFreightPayment(paymentId: string) {
    this.freightPayments = this.freightPayments.filter(payment => payment.id !== paymentId);
    this.notifyListeners();
  }

  // 添加监听器
  addListener(listener: () => void) {
    this.listeners.push(listener);
  }

  // 移除监听器
  removeListener(listener: () => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // 通知所有监听器
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

// 创建全局实例
export const dataStore = new DataStore();