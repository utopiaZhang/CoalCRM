import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Row, 
  Col, 
  Statistic, 
  Tag, 
  Button,
  DatePicker,
  Space,
  Alert,
  Tabs
} from 'antd';
import { 
  DollarOutlined, 
  UserOutlined, 
  TruckOutlined,
  ShopOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { AccountSummary, DeliveryBatch } from '../types';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface DebtRecord {
  id: string;
  name: string;
  type: 'customer' | 'supplier' | 'driver';
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  lastPaymentDate?: string;
  overdueDays?: number;
}

const Reconciliation: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);

  // 模拟发货批次数据（实际应用中应从API获取）
  const [deliveryBatches] = useState<DeliveryBatch[]>([
    {
      id: 'batch-1',
      customerId: '1',
      customerName: '北京钢铁厂',
      supplierId: '1',
      supplierName: '山西煤业集团',
      departureDate: '2024-01-15',
      coalPrice: 800,
      vehicles: [],
      totalWeight: 150,
      totalAmount: 120000,
      paidAmount: 80000,
      remainingAmount: 40000,
      paymentRecords: [],
      status: 'partial_paid',
      createdAt: '2024-01-15'
    },
    {
      id: 'batch-2',
      customerId: '2',
      customerName: '天津化工厂',
      supplierId: '2',
      supplierName: '内蒙古能源公司',
      departureDate: '2024-01-16',
      coalPrice: 750,
      vehicles: [],
      totalWeight: 100,
      totalAmount: 75000,
      paidAmount: 0,
      remainingAmount: 75000,
      paymentRecords: [],
      status: 'pending',
      createdAt: '2024-01-16'
    }
  ]);

  // 从发货批次计算应付款数据
  const calculatePayablesFromBatches = () => {
    const supplierPayables = new Map<string, {
      name: string;
      totalAmount: number;
      paidAmount: number;
      remainingAmount: number;
      lastPaymentDate?: string;
    }>();

    deliveryBatches.forEach(batch => {
      const existing = supplierPayables.get(batch.supplierId) || {
        name: batch.supplierName,
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0
      };

      existing.totalAmount += batch.totalAmount;
      existing.paidAmount += batch.paidAmount;
      existing.remainingAmount += batch.remainingAmount;

      // 获取最近的付款日期
      if (batch.paymentRecords.length > 0) {
        const latestPayment = batch.paymentRecords.sort((a, b) => 
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
        )[0];
        if (!existing.lastPaymentDate || latestPayment.paymentDate > existing.lastPaymentDate) {
          existing.lastPaymentDate = latestPayment.paymentDate;
        }
      }

      supplierPayables.set(batch.supplierId, existing);
    });

    return Array.from(supplierPayables.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      type: 'supplier' as const,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount,
      remainingAmount: data.remainingAmount,
      lastPaymentDate: data.lastPaymentDate
    }));
  };

  // 计算总体对账数据
  const calculateAccountSummary = () => {
    const supplierPayables = calculatePayablesFromBatches();
    const totalPayables = supplierPayables.reduce((sum, item) => sum + item.remainingAmount, 0);
    
    return {
      totalReceivables: 125000, // 客户应收款（暂时保持静态数据）
      totalPayables: totalPayables, // 从发货批次计算的应付款
      totalFreightPayables: 12000, // 运费应付款（暂时保持静态数据）
      netPosition: 125000 - totalPayables - 12000
    };
  };

  const [accountSummary, setAccountSummary] = useState<AccountSummary>(calculateAccountSummary());

  // 客户欠款记录
  const [customerDebts, setCustomerDebts] = useState<DebtRecord[]>([
    {
      id: '1',
      name: '北京钢铁厂',
      type: 'customer',
      totalAmount: 85000,
      paidAmount: 50000,
      remainingAmount: 35000,
      lastPaymentDate: '2024-01-18',
      overdueDays: 5
    },
    {
      id: '2',
      name: '天津化工厂',
      type: 'customer',
      totalAmount: 120000,
      paidAmount: 30000,
      remainingAmount: 90000,
      lastPaymentDate: '2024-01-10',
      overdueDays: 13
    }
  ]);

  // 供应商欠款记录（从发货批次计算）
  const [supplierDebts, setSupplierDebts] = useState<DebtRecord[]>(calculatePayablesFromBatches());

  // 司机欠款记录
  const [driverDebts, setDriverDebts] = useState<DebtRecord[]>([
    {
      id: '1',
      name: '张师傅',
      type: 'driver',
      totalAmount: 8000,
      paidAmount: 4200,
      remainingAmount: 3800,
      lastPaymentDate: '2024-01-17'
    },
    {
      id: '2',
      name: '李师傅',
      type: 'driver',
      totalAmount: 12000,
      paidAmount: 4000,
      remainingAmount: 8000,
      lastPaymentDate: '2024-01-14'
    }
  ]);

  // 客户欠款表格列
  const customerColumns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `¥${amount.toLocaleString()}`
    },
    {
      title: '已付金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (amount: number) => `¥${amount.toLocaleString()}`
    },
    {
      title: '欠款金额',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
          ¥{amount.toLocaleString()}
        </span>
      )
    },
    {
      title: '最后付款日期',
      dataIndex: 'lastPaymentDate',
      key: 'lastPaymentDate',
    },
    {
      title: '逾期天数',
      dataIndex: 'overdueDays',
      key: 'overdueDays',
      render: (days?: number) => {
        if (!days || days <= 0) return '-';
        return (
          <Tag color={days > 10 ? 'red' : days > 5 ? 'orange' : 'yellow'}>
            {days}天
          </Tag>
        );
      }
    }
  ];

  // 供应商应付表格列
  const supplierColumns = [
    {
      title: '供应商名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `¥${amount.toLocaleString()}`
    },
    {
      title: '已付金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (amount: number) => `¥${amount.toLocaleString()}`
    },
    {
      title: '应付金额',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
          ¥{amount.toLocaleString()}
        </span>
      )
    },
    {
      title: '最后付款日期',
      dataIndex: 'lastPaymentDate',
      key: 'lastPaymentDate',
    }
  ];

  // 司机欠款表格列
  const driverColumns = [
    {
      title: '司机姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '总运费',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `¥${amount.toLocaleString()}`
    },
    {
      title: '已付运费',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (amount: number) => `¥${amount.toLocaleString()}`
    },
    {
      title: '欠款金额',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
          ¥{amount.toLocaleString()}
        </span>
      )
    },
    {
      title: '最后付款日期',
      dataIndex: 'lastPaymentDate',
      key: 'lastPaymentDate',
    }
  ];

  // 计算汇总数据
  const calculateSummary = () => {
    const totalCustomerDebt = customerDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
    const totalSupplierDebt = supplierDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
    const totalDriverDebt = driverDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
    
    return {
      totalReceivables: totalCustomerDebt,
      totalPayables: totalSupplierDebt,
      totalFreightPayables: totalDriverDebt,
      netPosition: totalCustomerDebt - totalSupplierDebt - totalDriverDebt
    };
  };

  useEffect(() => {
    const summary = calculateSummary();
    setAccountSummary(summary);
  }, [customerDebts, supplierDebts, driverDebts]);

  return (
    <div>
      <Card title="对账管理" style={{ marginBottom: 24 }}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="应收账款"
                value={accountSummary.totalReceivables}
                precision={0}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="应付账款"
                value={accountSummary.totalPayables}
                precision={0}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ShopOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="应付运费"
                value={accountSummary.totalFreightPayables}
                precision={0}
                valueStyle={{ color: '#cf1322' }}
                prefix={<TruckOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="净头寸"
                value={accountSummary.netPosition}
                precision={0}
                valueStyle={{ 
                  color: accountSummary.netPosition >= 0 ? '#3f8600' : '#cf1322' 
                }}
                prefix={<UserOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
        </Row>

        {accountSummary.netPosition < 0 && (
          <Alert
            message="资金预警"
            description={`当前净头寸为负，需要支付 ¥${Math.abs(accountSummary.netPosition).toLocaleString()} 元`}
            type="warning"
            icon={<ExclamationCircleOutlined />}
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Space style={{ marginBottom: 16 }}>
          <span>查询时间范围：</span>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
          />
          <Button type="primary">刷新数据</Button>
        </Space>
      </Card>

      <Card>
        <Tabs defaultActiveKey="customers">
          <TabPane tab={`客户欠款 (${customerDebts.length})`} key="customers">
            <Table
              columns={customerColumns}
              dataSource={customerDebts}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              summary={(pageData) => {
                const totalDebt = pageData.reduce((sum, record) => sum + record.remainingAmount, 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <strong>合计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <strong style={{ color: '#ff4d4f' }}>
                        ¥{totalDebt.toLocaleString()}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                    <Table.Summary.Cell index={5} />
                  </Table.Summary.Row>
                );
              }}
            />
          </TabPane>

          <TabPane tab={`供应商应付 (${supplierDebts.length})`} key="suppliers">
            <Table
              columns={supplierColumns}
              dataSource={supplierDebts}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              expandable={{
                expandedRowRender: (record) => {
                  const supplierBatches = deliveryBatches.filter(b => b.supplierId === record.id);
                  return (
                    <Table
                      columns={[
                        { title: '批次编号', dataIndex: 'id', key: 'id' },
                        { title: '客户', dataIndex: 'customerName', key: 'customerName' },
                        { title: '发货日期', dataIndex: 'departureDate', key: 'departureDate' },
                        { title: '总重量', dataIndex: 'totalWeight', key: 'totalWeight', render: (w: number) => `${w}吨` },
                        { title: '总金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (a: number) => `¥${a.toLocaleString()}` },
                        { title: '已付金额', dataIndex: 'paidAmount', key: 'paidAmount', render: (a: number) => `¥${a.toLocaleString()}` },
                        { title: '应付金额', dataIndex: 'remainingAmount', key: 'remainingAmount', render: (a: number) => (
                          <span style={{ color: a > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>¥{a.toLocaleString()}</span>
                        ) },
                        { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
                          const statusMap = {
                            pending: { color: 'orange', text: '待付款' },
                            partial_paid: { color: 'blue', text: '部分付款' },
                            fully_paid: { color: 'green', text: '已付清' }
                          } as const;
                          const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
                          return <Tag color={config.color}>{config.text}</Tag>;
                        } }
                      ]}
                      dataSource={supplierBatches}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  );
                }
              }}
              summary={(pageData) => {
                const totalDebt = pageData.reduce((sum, record) => sum + record.remainingAmount, 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <strong>合计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <strong style={{ color: '#ff4d4f' }}>
                        ¥{totalDebt.toLocaleString()}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                  </Table.Summary.Row>
                );
              }}
            />
          </TabPane>

          <TabPane tab={`司机欠款 (${driverDebts.length})`} key="drivers">
            <Table
              columns={driverColumns}
              dataSource={driverDebts}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              summary={(pageData) => {
                const totalDebt = pageData.reduce((sum, record) => sum + record.remainingAmount, 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <strong>合计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <strong style={{ color: '#ff4d4f' }}>
                        ¥{totalDebt.toLocaleString()}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                  </Table.Summary.Row>
                );
              }}
            />
          </TabPane>

          {/* 发货批次已并入供应商应付的子列表，移除独立页签 */}
        </Tabs>
      </Card>
    </div>
  );
};

export default Reconciliation;
