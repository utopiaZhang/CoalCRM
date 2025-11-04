// 基础数据类型定义

// 客户信息
export interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  createdAt: string;
}

// 供货方信息
export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  createdAt: string;
}

// 司机信息
export interface Driver {
  id: string;
  name: string;
  phone: string;
  plateNumber: string;
  teamName?: string; // 车队名称，可选
  createdAt: string;
}

// 发货批次（一次发货操作，包含多辆车）
export interface DeliveryBatch {
  id: string;
  customerId: string;
  customerName: string;
  supplierId: string;
  supplierName: string;
  departureDate: string;
  coalPrice: number; // 每吨煤价格
  vehicles: DeliveryVehicle[]; // 本批次的车辆列表
  totalWeight: number; // 总重量
  totalAmount: number; // 总应付煤款
  paidAmount: number; // 已付煤款
  remainingAmount: number; // 剩余应付
  paymentRecords: BatchPaymentRecord[]; // 付款记录
  status: 'pending' | 'partial_paid' | 'fully_paid';
  createdAt: string;
}

// 发货车辆信息
export interface DeliveryVehicle {
  id: string;
  batchId: string; // 所属批次ID
  plateNumber: string;
  driverName?: string;
  driverId?: string;
  weight: number; // 发货称重
  amount: number; // 该车应付煤款
  createdAt: string;
}

// 批次付款记录
export interface BatchPaymentRecord {
  id: string;
  batchId: string;
  amount: number; // 付款金额
  paymentDate: string;
  remark?: string;
  createdAt: string;
}

// 车单（从发货记录生成）
export interface Shipment {
  id: string;
  batchId: string; // 关联发货批次
  vehicleId: string; // 关联车辆
  plateNumber: string;
  driverName: string;
  driverId: string;
  customerId: string;
  customerName: string;
  supplierId: string;
  supplierName: string;
  coalPrice: number;
  freightPrice: number;
  weight: number;
  coalAmount: number; // 煤款
  freightAmount: number; // 运费
  departureDate: string;
  arrivalDate?: string;
  status: 'shipping' | 'arrived' | 'completed';
  createdAt: string;
}

// 货款支付记录
export interface CargoPayment {
  id: string;
  shipmentId: string;
  customerId: string;
  customerName: string;
  calculatedAmount: number; // 应付金额
  actualAmount: number; // 实付金额
  paymentDate: string;
  remark?: string;
  createdAt: string;
}

// 运费支付记录
export interface FreightPayment {
  id: string;
  driverId: string;
  driverName: string;
  plateNumbers: string[]; // 支付的车牌号列表
  calculatedAmount: number; // 应付运费
  actualAmount: number; // 实付运费
  paymentDate: string;
  remark?: string;
  createdAt: string;
}

// 客户收款记录
export interface CustomerPayment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  remark?: string; // 备注，比如"4车半的钱"
  createdAt: string;
  arrivalRecordId?: string;
}

// 对账统计数据
export interface AccountSummary {
  totalReceivables: number; // 总应收账款
  totalPayables: number; // 总应付账款
  totalFreightPayables: number; // 总应付运费
  netPosition: number; // 净头寸
}

// 月度统计数据
export interface MonthlyStats {
  month: string; // YYYY-MM格式
  totalCost: number; // 总成本
  totalCoalPayment: number; // 总煤款支出
  totalFreight: number; // 总运费支出
  totalCollection: number; // 总收款
  totalProfit: number; // 总利润
  shipmentCount: number; // 车次数量
  totalWeight: number; // 总重量（吨）
}

// 借贷记录类型
export interface LoanRecord {
  id: string;
  type: 'borrow' | 'lend'; // borrow: 我借入, lend: 我借出
  counterparty: string; // 对方姓名
  counterpartyPhone?: string; // 对方电话
  amount: number; // 借贷金额
  date: string; // 借贷日期
  dueDate?: string; // 约定还款日期
  description?: string; // 借贷说明
  status: 'active' | 'settled'; // active: 未结清, settled: 已结清
  repaymentRecords: RepaymentRecord[]; // 还款记录
  remainingAmount: number; // 剩余未还金额
  createdAt: string;
  updatedAt: string;
}

// 还款记录
export interface RepaymentRecord {
  id: string;
  loanRecordId: string;
  amount: number; // 还款金额
  date: string; // 还款日期
  description?: string; // 还款说明
  createdAt: string;
}

// 批量还款记录
export interface BatchRepaymentRecord {
  id: string;
  totalAmount: number; // 总还款金额
  date: string; // 还款日期
  counterparty: string; // 对方姓名
  description?: string; // 还款说明
  allocations: RepaymentAllocation[]; // 分配到各个借款的明细
  createdAt: string;
}

// 还款分配明细
export interface RepaymentAllocation {
  loanRecordId: string;
  loanDescription: string; // 借款描述，便于识别
  allocatedAmount: number; // 分配到此借款的金额
}

// 债务汇总统计
export interface DebtSummary {
  // 我欠别人的
  myDebts: {
    totalAmount: number; // 总欠款
    records: LoanRecord[]; // 欠款记录
  };
  // 别人欠我的
  othersDebts: {
    totalAmount: number; // 总应收
    records: LoanRecord[]; // 应收记录
  };
}

// 按人员分组的往来统计
export interface PersonLoanSummary {
  counterparty: string; // 对方姓名
  phone?: string; // 联系电话
  totalBorrowed: number; // 我向此人借入的总金额
  totalLent: number; // 我借给此人的总金额
  netAmount: number; // 净额（正数表示对方欠我，负数表示我欠对方）
  activeBorrowedAmount: number; // 未结清的借入金额
  activeLentAmount: number; // 未结清的借出金额
  borrowedRecords: LoanRecord[]; // 借入记录
  lentRecords: LoanRecord[]; // 借出记录
  lastTransactionDate: string; // 最后交易日期
}

// 按人员分组的往来统计
export interface PersonLoanSummary {
  counterparty: string; // 对方姓名
  phone?: string; // 联系电话
  totalBorrowed: number; // 我向此人借入的总金额
  totalLent: number; // 我借给此人的总金额
  netAmount: number; // 净额（正数表示对方欠我，负数表示我欠对方）
  activeBorrowedAmount: number; // 未结清的借入金额
  activeLentAmount: number; // 未结清的借出金额
  borrowedRecords: LoanRecord[]; // 借入记录
  lentRecords: LoanRecord[]; // 借出记录
  lastTransactionDate: string; // 最后交易日期
}

// 到货记录
export interface ArrivalRecord {
  id: string;
  arrivalDate: string; // 到货日期
  freightPerTon: number; // 运费/吨
  sellingPricePerTon: number; // 售价/吨
  customerId: string;
  customerName: string;
  relatedShipments: ArrivalShipment[]; // 关联的车单
  totalWeight: number; // 总重量
  totalLoss: number; // 总运损（发货重量 - 到货重量）
  totalReceivable: number; // 总应收款（到货重量 × 售价）
  actualFreightPaid: number; // 实付运费
  freightPaymentStatus: 'unpaid' | 'partial' | 'paid'; // 运费平账状态
  actualReceived: number; // 实收款
  receivablePaymentStatus: 'unpaid' | 'partial' | 'paid'; // 收款平账状态
  remark?: string; // 备注
  status: 'pending' | 'completed';
  createdAt: string;
}

// 到货车单信息
export interface ArrivalShipment {
  id: string;
  arrivalRecordId: string;
  shipmentId: string; // 关联的原始车单ID
  plateNumber: string;
  driverName: string;
  originalWeight: number; // 发货称重
  arrivalWeight: number; // 到货称重
  loss: number; // 运损（发货重量 - 到货重量）
  receivableAmount: number; // 应收款（到货重量 × 售价）
}
