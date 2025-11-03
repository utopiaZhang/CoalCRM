import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Tabs,
  message,
  Popconfirm,
  Typography,
  Divider,
  Checkbox,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoneyCollectOutlined,
  PayCircleOutlined,
  EyeOutlined,
  TeamOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { LoanRecord, RepaymentRecord, DebtSummary, BatchRepaymentRecord, RepaymentAllocation, PersonLoanSummary } from '../types';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const LoanManagement: React.FC = () => {
  // 状态管理
  const [loanRecords, setLoanRecords] = useState<LoanRecord[]>([]);
  const [personSummaries, setPersonSummaries] = useState<PersonLoanSummary[]>([]);
  const [batchRepaymentRecords, setBatchRepaymentRecords] = useState<BatchRepaymentRecord[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRepaymentModalVisible, setIsRepaymentModalVisible] = useState(false);
  const [isBatchRepaymentModalVisible, setIsBatchRepaymentModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LoanRecord | null>(null);
  const [currentLoanId, setCurrentLoanId] = useState<string>('');
  const [currentCounterparty, setCurrentCounterparty] = useState<string>('');
  const [form] = Form.useForm();
  const [repaymentForm] = Form.useForm();
  const [batchRepaymentForm] = Form.useForm();
  const [debtSummary, setDebtSummary] = useState<DebtSummary>({
    myDebts: { totalAmount: 0, records: [] },
    othersDebts: { totalAmount: 0, records: [] }
  });

  // 初始化模拟数据
  useEffect(() => {
    const mockLoanRecords: LoanRecord[] = [
      {
        id: '1',
        type: 'borrow',
        counterparty: '张三',
        counterpartyPhone: '13800138001',
        amount: 50000,
        date: '2024-01-15',
        dueDate: '2024-02-15',
        description: '临时资金周转',
        status: 'active',
        repaymentRecords: [
          {
            id: 'r1',
            loanRecordId: '1',
            amount: 20000,
            date: '2024-01-25',
            description: '部分还款',
            createdAt: '2024-01-25T10:00:00Z'
          }
        ],
        remainingAmount: 30000,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-25T10:00:00Z'
      },
      {
        id: '2',
        type: 'lend',
        counterparty: '李四',
        counterpartyPhone: '13900139002',
        amount: 80000,
        date: '2024-01-20',
        dueDate: '2024-03-20',
        description: '朋友急用',
        status: 'active',
        repaymentRecords: [],
        remainingAmount: 80000,
        createdAt: '2024-01-20T14:00:00Z',
        updatedAt: '2024-01-20T14:00:00Z'
      },
      {
        id: '3',
        type: 'borrow',
        counterparty: '王五',
        counterpartyPhone: '13700137003',
        amount: 30000,
        date: '2024-01-10',
        description: '设备采购资金',
        status: 'settled',
        repaymentRecords: [
          {
            id: 'r2',
            loanRecordId: '3',
            amount: 30000,
            date: '2024-01-30',
            description: '全额还款',
            createdAt: '2024-01-30T16:00:00Z'
          }
        ],
        remainingAmount: 0,
        createdAt: '2024-01-10T11:00:00Z',
        updatedAt: '2024-01-30T16:00:00Z'
      }
    ];
    
    setLoanRecords(mockLoanRecords);
  }, []);

  // 计算债务汇总
  useEffect(() => {
    const myDebts = loanRecords.filter(record => record.type === 'borrow' && record.status === 'active');
    const othersDebts = loanRecords.filter(record => record.type === 'lend' && record.status === 'active');
    
    const myDebtTotal = myDebts.reduce((sum, record) => sum + record.remainingAmount, 0);
    const othersDebtTotal = othersDebts.reduce((sum, record) => sum + record.remainingAmount, 0);
    
    setDebtSummary({
      myDebts: {
        totalAmount: myDebtTotal,
        records: myDebts
      },
      othersDebts: {
        totalAmount: othersDebtTotal,
        records: othersDebts
      }
    });
  }, [loanRecords]);

  // 计算按人员分组的统计
  useEffect(() => {
    const personMap = new Map<string, PersonLoanSummary>();
    
    loanRecords.forEach(record => {
      const { counterparty } = record;
      
      if (!personMap.has(counterparty)) {
        personMap.set(counterparty, {
          counterparty,
          phone: record.counterpartyPhone,
          totalBorrowed: 0,
          totalLent: 0,
          netAmount: 0,
          activeBorrowedAmount: 0,
          activeLentAmount: 0,
          borrowedRecords: [],
          lentRecords: [],
          lastTransactionDate: record.date
        });
      }
      
      const person = personMap.get(counterparty)!;
      
      // 更新最后交易日期
      if (record.date > person.lastTransactionDate) {
        person.lastTransactionDate = record.date;
      }
      
      if (record.type === 'borrow') {
        person.totalBorrowed += record.amount;
        person.borrowedRecords.push(record);
        if (record.status === 'active') {
          person.activeBorrowedAmount += record.remainingAmount;
        }
      } else {
        person.totalLent += record.amount;
        person.lentRecords.push(record);
        if (record.status === 'active') {
          person.activeLentAmount += record.remainingAmount;
        }
      }
      
      // 计算净额（正数表示对方欠我，负数表示我欠对方）
      person.netAmount = person.activeLentAmount - person.activeBorrowedAmount;
    });
    
    // 按净额排序，欠我钱的在前面
    const sortedPersons = Array.from(personMap.values()).sort((a, b) => b.netAmount - a.netAmount);
    setPersonSummaries(sortedPersons);
  }, [loanRecords]);

  // 处理添加/编辑
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: LoanRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
      dueDate: record.dueDate ? dayjs(record.dueDate) : null
    });
    setIsModalVisible(true);
  };

  // 处理删除
  const handleDelete = (id: string) => {
    setLoanRecords(prev => prev.filter(record => record.id !== id));
    message.success('删除成功');
  };

  // 处理还款
  const handleRepayment = (record: LoanRecord) => {
    setCurrentLoanId(record.id);
    repaymentForm.resetFields();
    repaymentForm.setFieldsValue({
      maxAmount: record.remainingAmount
    });
    setIsRepaymentModalVisible(true);
  };

  // 保存借贷记录
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const now = new Date().toISOString();
      
      if (editingRecord) {
        // 编辑
        setLoanRecords(prev => prev.map(record => {
          if (record.id === editingRecord.id) {
            return {
              ...record,
              ...values,
              date: values.date.format('YYYY-MM-DD'),
              dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
              updatedAt: now
            };
          }
          return record;
        }));
        message.success('修改成功');
      } else {
        // 新增
        const newRecord: LoanRecord = {
          id: Date.now().toString(),
          ...values,
          date: values.date.format('YYYY-MM-DD'),
          dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
          status: 'active',
          repaymentRecords: [],
          remainingAmount: values.amount,
          createdAt: now,
          updatedAt: now
        };
        setLoanRecords(prev => [...prev, newRecord]);
        message.success('添加成功');
      }
      
      setIsModalVisible(false);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 保存还款记录
  const handleRepaymentSave = async () => {
    try {
      const values = await repaymentForm.validateFields();
      const now = new Date().toISOString();
      
      const newRepayment: RepaymentRecord = {
        id: Date.now().toString(),
        loanRecordId: currentLoanId,
        amount: values.amount,
        date: values.date.format('YYYY-MM-DD'),
        description: values.description,
        createdAt: now
      };
      
      setLoanRecords(prev => prev.map(record => {
        if (record.id === currentLoanId) {
          const newRepaymentRecords = [...record.repaymentRecords, newRepayment];
          const newRemainingAmount = record.remainingAmount - values.amount;
          const newStatus = newRemainingAmount <= 0 ? 'settled' : 'active';
          
          return {
            ...record,
            repaymentRecords: newRepaymentRecords,
            remainingAmount: Math.max(0, newRemainingAmount),
            status: newStatus,
            updatedAt: now
          };
        }
        return record;
      }));
      
      message.success('还款记录添加成功');
      setIsRepaymentModalVisible(false);
    } catch (error) {
      console.error('还款记录保存失败:', error);
    }
  };

  // 处理批量还款
  const handleBatchRepayment = (counterparty: string) => {
    setCurrentCounterparty(counterparty);
    batchRepaymentForm.resetFields();
    setIsBatchRepaymentModalVisible(true);
  };

  // 保存批量还款记录
  const handleBatchRepaymentSave = async () => {
    try {
      const values = await batchRepaymentForm.validateFields();
      const now = new Date().toISOString();
      
      const { totalAmount, date, description, allocations } = values;
      
      // 验证分配金额总和
      const totalAllocated = allocations.reduce((sum: number, allocation: any) => sum + allocation.amount, 0);
      if (totalAllocated > totalAmount) {
        message.error('分配金额总和不能超过还款总额');
        return;
      }
      
      // 创建批量还款记录
      const batchRepayment: BatchRepaymentRecord = {
        id: Date.now().toString(),
        totalAmount,
        date: date.format('YYYY-MM-DD'),
        counterparty: currentCounterparty,
        description,
        allocations: allocations.map((allocation: any) => {
          const loanRecord = loanRecords.find(r => r.id === allocation.loanId);
          return {
            loanRecordId: allocation.loanId,
            loanDescription: loanRecord ? `${loanRecord.amount}元 - ${loanRecord.description || '无描述'}` : '',
            allocatedAmount: allocation.amount
          };
        }),
        createdAt: now
      };
      
      // 更新借款记录
      setLoanRecords(prev => prev.map(record => {
        const allocation = allocations.find((a: any) => a.loanId === record.id);
        if (allocation) {
          const newRemainingAmount = record.remainingAmount - allocation.amount;
          const newStatus = newRemainingAmount <= 0 ? 'settled' : 'active';
          
          // 创建对应的还款记录
          const newRepayment: RepaymentRecord = {
            id: `${Date.now()}-${record.id}`,
            loanRecordId: record.id,
            amount: allocation.amount,
            date: date.format('YYYY-MM-DD'),
            description: `批量还款 - ${description || ''}`,
            createdAt: now
          };
          
          return {
            ...record,
            repaymentRecords: [...record.repaymentRecords, newRepayment],
            remainingAmount: Math.max(0, newRemainingAmount),
            status: newStatus,
            updatedAt: now
          };
        }
        return record;
      }));
      
      // 保存批量还款记录
      setBatchRepaymentRecords(prev => [...prev, batchRepayment]);
      
      message.success('批量还款记录添加成功');
      setIsBatchRepaymentModalVisible(false);
    } catch (error) {
      console.error('批量还款记录保存失败:', error);
    }
  };

  // 人员汇总表格列定义
  const personColumns: ColumnsType<PersonLoanSummary> = [
    {
      title: '姓名',
      dataIndex: 'counterparty',
      key: 'counterparty',
      width: 120,
      render: (name: string) => (
        <Text strong>{name}</Text>
      )
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (phone: string) => phone || '-'
    },
    {
      title: '净额',
      dataIndex: 'netAmount',
      key: 'netAmount',
      width: 120,
      render: (amount: number) => (
        <Text type={amount > 0 ? 'success' : amount < 0 ? 'danger' : 'secondary'} strong>
          {amount > 0 ? '+' : ''}¥{amount.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => b.netAmount - a.netAmount
    },
    {
      title: '我欠对方',
      dataIndex: 'activeBorrowedAmount',
      key: 'activeBorrowedAmount',
      width: 120,
      render: (amount: number) => (
        <Text type={amount > 0 ? 'danger' : 'secondary'}>
          ¥{amount.toLocaleString()}
        </Text>
      )
    },
    {
      title: '对方欠我',
      dataIndex: 'activeLentAmount',
      key: 'activeLentAmount',
      width: 120,
      render: (amount: number) => (
        <Text type={amount > 0 ? 'success' : 'secondary'}>
          ¥{amount.toLocaleString()}
        </Text>
      )
    },
    {
      title: '最后交易',
      dataIndex: 'lastTransactionDate',
      key: 'lastTransactionDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRecord(null);
              form.resetFields();
              form.setFieldsValue({ counterparty: record.counterparty, counterpartyPhone: record.phone });
              setIsModalVisible(true);
            }}
          >
            新增往来
          </Button>
          {record.activeBorrowedAmount > 0 && (
            <Button
              type="link"
              size="small"
              icon={<TeamOutlined />}
              onClick={() => handleBatchRepayment(record.counterparty)}
            >
              批量还款
            </Button>
          )}
        </Space>
      )
    }
  ];

  // 详细记录表格列定义
  const detailColumns: ColumnsType<LoanRecord> = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'borrow' ? 'red' : 'green'}>
          {type === 'borrow' ? '借入' : '借出'}
        </Tag>
      )
    },
    {
      title: '对方',
      dataIndex: 'counterparty',
      key: 'counterparty',
      width: 120
    },
    {
      title: '电话',
      dataIndex: 'counterpartyPhone',
      key: 'counterpartyPhone',
      width: 120
    },
    {
      title: '借贷金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => `¥${amount.toLocaleString()}`
    },
    {
      title: '剩余金额',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      width: 120,
      render: (amount: number) => (
        <Text type={amount > 0 ? 'danger' : 'success'}>
          ¥{amount.toLocaleString()}
        </Text>
      )
    },
    {
      title: '借贷日期',
      dataIndex: 'date',
      key: 'date',
      width: 120
    },
    {
      title: '约定还款日',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string) => date || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'orange' : 'green'}>
          {status === 'active' ? '未结清' : '已结清'}
        </Tag>
      )
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {/* 查看详情 */}}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.status === 'active' && (
            <Button
              type="link"
              size="small"
              icon={record.type === 'borrow' ? <PayCircleOutlined /> : <MoneyCollectOutlined />}
              onClick={() => handleRepayment(record)}
            >
              {record.type === 'borrow' ? '还款' : '收款'}
            </Button>
          )}
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>资金往来管理</Title>
      
      {/* 债务汇总统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="我欠别人的总金额"
              value={debtSummary.myDebts.totalAmount}
              precision={0}
              valueStyle={{ color: '#cf1322' }}
              prefix="¥"
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">共 {debtSummary.myDebts.records.length} 笔未结清</Text>
              {debtSummary.myDebts.records.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {/* 按对方分组显示批量还款按钮 */}
                  {Object.entries(
                    debtSummary.myDebts.records.reduce((acc, record) => {
                      if (!acc[record.counterparty]) {
                        acc[record.counterparty] = [];
                      }
                      acc[record.counterparty].push(record);
                      return acc;
                    }, {} as Record<string, any[]>)
                  ).map(([counterparty, records]) => (
                    <div key={counterparty} style={{ marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        欠 {counterparty}: ¥{records.reduce((sum, r) => sum + r.remainingAmount, 0)}
                      </Text>
                      <Button
                        type="link"
                        size="small"
                        icon={<TeamOutlined />}
                        onClick={() => handleBatchRepayment(counterparty)}
                        style={{ marginLeft: 8, padding: 0, height: 'auto' }}
                      >
                        批量还款
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="别人欠我的总金额"
              value={debtSummary.othersDebts.totalAmount}
              precision={0}
              valueStyle={{ color: '#389e0d' }}
              prefix="¥"
            />
            <Text type="secondary">共 {debtSummary.othersDebts.records.length} 笔未结清</Text>
          </Card>
        </Col>
      </Row>

      {/* 按人员分组的往来记录表格 */}
      <Card
        title="往来记录（按人员分组）"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增记录
          </Button>
        }
      >
        <Table
          columns={personColumns}
          dataSource={personSummaries}
          rowKey="counterparty"
          expandable={{
            expandedRowRender: (record: PersonLoanSummary) => {
              const allRecords = [...record.borrowedRecords, ...record.lentRecords]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              
              return (
                <div style={{ margin: 0 }}>
                  <Title level={5} style={{ marginBottom: 16 }}>
                    与 {record.counterparty} 的往来明细
                  </Title>
                  <Table
                    columns={detailColumns}
                    dataSource={allRecords}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                </div>
              );
            },
            rowExpandable: (record) => (record.borrowedRecords.length + record.lentRecords.length) > 0,
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个联系人`
          }}
        />
      </Card>

      {/* 添加/编辑借贷记录弹窗 */}
      <Modal
        title={editingRecord ? '编辑借贷记录' : '新增借贷记录'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: 'borrow',
            date: dayjs()
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select>
                  <Option value="borrow">借入（我借钱）</Option>
                  <Option value="lend">借出（我借给别人）</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="金额"
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={0}
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => {
                    const parsed = value!.replace(/¥\s?|(,*)/g, '');
                    return parsed as any;
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="counterparty"
                label="对方姓名"
                rules={[{ required: true, message: '请输入对方姓名' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="counterpartyPhone"
                label="对方电话"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="借贷日期"
                rules={[{ required: true, message: '请选择借贷日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="约定还款日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="说明"
          >
            <TextArea rows={3} placeholder="请输入借贷说明..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 还款/收款记录弹窗 */}
      <Modal
        title="记录还款/收款"
        open={isRepaymentModalVisible}
        onOk={handleRepaymentSave}
        onCancel={() => setIsRepaymentModalVisible(false)}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={repaymentForm}
          layout="vertical"
          initialValues={{
            date: dayjs()
          }}
        >
          <Form.Item
            name="amount"
            label="还款/收款金额"
            rules={[
              { required: true, message: '请输入金额' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const maxAmount = getFieldValue('maxAmount');
                  if (!value || value <= maxAmount) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(`金额不能超过剩余金额 ¥${maxAmount.toLocaleString()}`));
                },
              }),
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={0}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => {
                const parsed = value!.replace(/¥\s?|(,*)/g, '');
                return parsed as any;
              }}
            />
          </Form.Item>
          
          <Form.Item name="maxAmount" hidden>
            <InputNumber />
          </Form.Item>
          
          <Form.Item
            name="date"
            label="还款/收款日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="说明"
          >
            <TextArea rows={3} placeholder="请输入说明..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量还款弹窗 */}
      <Modal
        title={`批量还款 - ${currentCounterparty}`}
        open={isBatchRepaymentModalVisible}
        onOk={handleBatchRepaymentSave}
        onCancel={() => setIsBatchRepaymentModalVisible(false)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={batchRepaymentForm}
          layout="vertical"
          initialValues={{
            date: dayjs(),
            allocations: []
          }}
        >
          <Alert
            message="批量还款说明"
            description="您可以一次性还款给同一个人的多笔借款。请先输入总还款金额，然后分配到具体的借款记录中。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalAmount"
                label="总还款金额"
                rules={[{ required: true, message: '请输入总还款金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={0}
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => {
                    const parsed = value!.replace(/¥\s?|(,*)/g, '');
                    return parsed as any;
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="还款日期"
                rules={[{ required: true, message: '请选择还款日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="还款说明"
          >
            <TextArea rows={2} placeholder="请输入还款说明..." />
          </Form.Item>
          
          <Divider>还款分配</Divider>
          
          <Form.List name="allocations">
            {(fields, { add, remove }) => {
              // 获取当前对方的未结清借款
              const availableLoans = loanRecords.filter(
                record => record.counterparty === currentCounterparty && 
                         record.type === 'borrow' && 
                         record.status === 'active'
              );
              
              return (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={16} align="middle">
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, 'loanId']}
                          label={key === 0 ? '选择借款' : ''}
                          rules={[{ required: true, message: '请选择借款' }]}
                        >
                          <Select placeholder="选择要还款的借款">
                            {availableLoans.map(loan => (
                              <Option key={loan.id} value={loan.id}>
                                ¥{loan.amount.toLocaleString()} - 剩余¥{loan.remainingAmount.toLocaleString()} 
                                ({loan.description || '无描述'})
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'amount']}
                          label={key === 0 ? '分配金额' : ''}
                          rules={[{ required: true, message: '请输入分配金额' }]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            precision={0}
                            formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => {
                              const parsed = value!.replace(/¥\s?|(,*)/g, '');
                              return parsed as any;
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        {key === 0 ? (
                          <Form.Item label=" ">
                            <Button type="dashed" onClick={() => add()} block>
                              添加分配
                            </Button>
                          </Form.Item>
                        ) : (
                          <Form.Item label=" ">
                            <Button type="link" danger onClick={() => remove(name)}>
                              删除
                            </Button>
                          </Form.Item>
                        )}
                      </Col>
                    </Row>
                  ))}
                  {fields.length === 0 && (
                    <Button type="dashed" onClick={() => add()} block>
                      添加还款分配
                    </Button>
                  )}
                </>
              );
            }}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default LoanManagement;