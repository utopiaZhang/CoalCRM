import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Card,
  Divider,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { DeliveryBatch, DeliveryVehicle, BatchPaymentRecord, Customer, Supplier } from '../types';
import { customersService } from '../services/customers';
import { suppliersService } from '../services/suppliers';
import { batchesService } from '../services/batches';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const DeliveryRecords: React.FC = () => {
  const [batches, setBatches] = useState<DeliveryBatch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [editingBatch, setEditingBatch] = useState<DeliveryBatch | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<DeliveryBatch | null>(null);
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0); // 预估付款金额
  const [form] = Form.useForm();
  const [paymentForm] = Form.useForm();

  // 加载后端数据
  useEffect(() => {
    const load = async () => {
      try {
        const [customers, suppliers, batches] = await Promise.all([
          customersService.list(),
          suppliersService.list(),
          batchesService.list()
        ]);
        setCustomers(customers);
        setSuppliers(suppliers);
        setBatches(batches);
      } catch (err) {
        console.error(err);
        message.error('加载发货记录数据失败');
      }
    };
    load();
  }, []);

  // 发货批次表格列定义
  const batchColumns: ColumnsType<DeliveryBatch> = [
    {
      title: '批次编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '发货日期',
      dataIndex: 'departureDate',
      key: 'departureDate',
      width: 120,
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
    },
    {
      title: '供货方',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: 120,
    },
    {
      title: '车辆数',
      key: 'vehicleCount',
      width: 80,
      render: (_, record) => record.vehicles.length,
    },
    {
      title: '总重量(吨)',
      dataIndex: 'totalWeight',
      key: 'totalWeight',
      width: 100,
    },
    {
      title: '煤价(元/吨)',
      dataIndex: 'coalPrice',
      key: 'coalPrice',
      width: 100,
    },
    {
      title: '总应付(元)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '已付(元)',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 120,
      render: (amount) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '剩余应付(元)',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      width: 120,
      render: (amount) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          pending: { color: 'orange', text: '待付款' },
          partial_paid: { color: 'blue', text: '部分付款' },
          fully_paid: { color: 'green', text: '已付清' },
        };
        const { color, text } = statusMap[status as keyof typeof statusMap];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {/* 编辑功能暂未与后端同步，后续补充 */}
          <Button type="link" icon={<EditOutlined />} disabled>
            编辑
          </Button>
          <Button
            type="link"
            icon={<DollarOutlined />}
            onClick={() => handlePayment(record)}
            disabled={record.status === 'fully_paid'}
          >
            付款
          </Button>
          <Popconfirm
            title="确定删除这个发货批次吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 车辆信息表格列定义
  const vehicleColumns: ColumnsType<DeliveryVehicle> = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
    },
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
    },
    {
      title: '重量(吨)',
      dataIndex: 'weight',
      key: 'weight',
    },
    {
      title: '应付煤款(元)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${amount.toLocaleString()}`,
    },
  ];

  // 计算预估付款金额
  const calculateEstimatedAmount = () => {
    const coalPrice = form.getFieldValue('coalPrice') || 0;
    const vehicles = form.getFieldValue('vehicles') || [];
    const totalWeight = vehicles.reduce((sum: number, vehicle: any) => {
      return sum + (vehicle?.weight || 0);
    }, 0);
    const estimated = totalWeight * coalPrice;
    setEstimatedAmount(estimated);
    return estimated;
  };

  const handleAdd = () => {
    setEditingBatch(null);
    form.resetFields();
    setEstimatedAmount(0);
    setIsModalVisible(true);
  };

  const handleEdit = (batch: DeliveryBatch) => {
    setEditingBatch(batch);
    form.setFieldsValue({
      ...batch,
      departureDate: dayjs(batch.departureDate),
    });
    setEstimatedAmount(batch.totalAmount);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await batchesService.remove(id);
      const list = await batchesService.list();
      setBatches(list);
      message.success('删除成功');
    } catch (err) {
      console.error(err);
      message.error('删除失败');
    }
  };

  const handlePayment = (batch: DeliveryBatch) => {
    setSelectedBatch(batch);
    paymentForm.resetFields();
    setIsPaymentModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const vehicles = (values.vehicles || []).map((v: any) => ({
        plateNumber: v.plateNumber,
        driverName: v.driverName || '',
        weight: Number(v.weight) || 0,
        amount: (Number(v.weight) || 0) * (Number(values.coalPrice) || 0)
      }));

      await batchesService.create({
        customerId: values.customerId,
        customerName: customers.find(c => c.id === values.customerId)?.name || '',
        supplierId: values.supplierId,
        supplierName: suppliers.find(s => s.id === values.supplierId)?.name || '',
        departureDate: values.departureDate.format('YYYY-MM-DD'),
        coalPrice: Number(values.coalPrice) || 0,
        vehicles
      });

      const list = await batchesService.list();
      setBatches(list);
      message.success(`发货批次创建成功，已自动生成${vehicles.length}条车单记录`);
      setIsModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      const values = await paymentForm.validateFields();
      if (!selectedBatch) return;
      await batchesService.addPayment(selectedBatch.id, {
        amount: Number(values.amount) || 0,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        remark: values.remark
      });
      const list = await batchesService.list();
      setBatches(list);
      setIsPaymentModalVisible(false);
      message.success('付款记录添加成功');
    } catch (error) {
      console.error('付款表单验证失败:', error);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>发货记录管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增发货批次
          </Button>
        </div>

        <Table
          columns={batchColumns}
          dataSource={batches}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ margin: 0 }}>
                <h4>车辆明细：</h4>
                <Table
                  columns={vehicleColumns}
                  dataSource={record.vehicles}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
                {record.paymentRecords.length > 0 && (
                  <>
                    <h4 style={{ marginTop: 16 }}>付款记录：</h4>
                    <Table
                      columns={[
                        { title: '付款金额', dataIndex: 'amount', render: (amount) => `¥${amount.toLocaleString()}` },
                        { title: '付款日期', dataIndex: 'paymentDate' },
                        { title: '备注', dataIndex: 'remark' },
                      ]}
                      dataSource={record.paymentRecords}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </>
                )}
              </div>
            ),
          }}
        />
      </Card>

      {/* 新增/编辑发货批次模态框 */}
      <Modal
        title={editingBatch ? '编辑发货批次' : '新增发货批次'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        okText="确定"
        cancelText="取消"
      >
        <Form 
          form={form} 
          layout="vertical"
          onValuesChange={calculateEstimatedAmount}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerId"
                label="客户"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select placeholder="请选择客户">
                  {customers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="supplierId"
                label="供货方"
                rules={[{ required: true, message: '请选择供货方' }]}
              >
                <Select placeholder="请选择供货方">
                  {suppliers.map(supplier => (
                    <Option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="departureDate"
                label="发货日期"
                rules={[{ required: true, message: '请选择发货日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="coalPrice"
                label="煤价(元/吨)"
                rules={[{ required: true, message: '请输入煤价' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入每吨煤价格"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider>车辆信息</Divider>
          
          <Form.List name="vehicles">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} align="middle">
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'plateNumber']}
                        rules={[{ required: true, message: '请输入车牌号' }]}
                      >
                        <Input placeholder="车牌号" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'driverName']}
                      >
                        <Input placeholder="司机姓名" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'weight']}
                        rules={[{ required: true, message: '请输入重量' }]}
                      >
                        <InputNumber
                          placeholder="重量(吨)"
                          min={0}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Button type="link" danger onClick={() => remove(name)}>
                        删除
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加车辆
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider>付款信息</Divider>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="预估付款金额(元)">
                <InputNumber
                  value={estimatedAmount}
                  style={{ width: '100%' }}
                  readOnly
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => parseFloat(value!.replace(/¥\s?|(,*)/g, '')) || 0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="paidAmount"
                label="本次付款金额(元)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="如果现在付款，请输入金额"
                  min={0}
                  max={estimatedAmount}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="paymentRemark"
                label="付款备注"
              >
                <Input placeholder="付款备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 付款模态框 */}
      <Modal
        title="添加付款记录"
        open={isPaymentModalVisible}
        onOk={handlePaymentSubmit}
        onCancel={() => setIsPaymentModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={paymentForm} layout="vertical">
          <Form.Item label="批次信息">
            <Card size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="总应付" value={selectedBatch?.totalAmount} prefix="¥" />
                </Col>
                <Col span={12}>
                  <Statistic title="剩余应付" value={selectedBatch?.remainingAmount} prefix="¥" />
                </Col>
              </Row>
            </Card>
          </Form.Item>
          
          <Form.Item
            name="amount"
            label="付款金额(元)"
            rules={[
              { required: true, message: '请输入付款金额' },
              {
                validator: (_, value) => {
                  if (value && selectedBatch && value > selectedBatch.remainingAmount) {
                    return Promise.reject(new Error('付款金额不能超过剩余应付金额'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入付款金额"
              min={0}
              max={selectedBatch?.remainingAmount}
            />
          </Form.Item>

          <Form.Item
            name="paymentDate"
            label="付款日期"
            rules={[{ required: true, message: '请选择付款日期' }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeliveryRecords;
