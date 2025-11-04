import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message,
  Card,
  Select,
  DatePicker,
  InputNumber,
  Tag,
  Checkbox
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { CargoPayment, CustomerPayment, Shipment } from '../types';
import { ExtendedFreightPayment } from '../services/dataStore';
import { paymentsService } from '../services/payments';
import { shipmentsService } from '../services/shipments';
import { driversService, DriverSummary } from '../services/drivers';
import { customersService } from '../services/customers';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const PaymentManagement: React.FC = () => {
  // 货款支付记录
  const [cargoPayments, setCargoPayments] = useState<CargoPayment[]>([]);

  // 运费支付记录
  const [freightPayments, setFreightPayments] = useState<ExtendedFreightPayment[]>([]);

  // 加载三类支付记录
  useEffect(() => {
    const load = async () => {
      try {
        const [cargoList, freightList, customerList] = await Promise.all([
          paymentsService.listCargo(),
          paymentsService.listFreight(),
          paymentsService.listCustomer()
        ]);
        setCargoPayments(cargoList);
        setFreightPayments(freightList);
        setCustomerPayments(customerList);
      } catch (err) {
        console.error(err);
        message.error('加载支付记录失败');
      }
    };
    load();
  }, []);

  // 客户收款记录
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);

  const [isCargoModalVisible, setIsCargoModalVisible] = useState(false);
  const [isFreightModalVisible, setIsFreightModalVisible] = useState(false);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  
  const [cargoForm] = Form.useForm();
  const [freightForm] = Form.useForm();
  const [customerForm] = Form.useForm();

  // 后端数据
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        const [shipmentList, driverList, customerList] = await Promise.all([
          shipmentsService.list(),
          driversService.list(),
          customersService.list()
        ]);
        setShipments(shipmentList);
        setDrivers(driverList);
        setCustomers(customerList.map(c => ({ id: c.id, name: c.name })));
      } catch (err) {
        console.error(err);
        message.error('加载基础数据失败');
      }
    };
    loadBaseData();
  }, []);

  // 货款支付表格列
  const cargoColumns = [
    {
      title: '车单编号',
      dataIndex: 'shipmentId',
      key: 'shipmentId',
      render: (id: string) => `CU${id.padStart(6, '0')}`
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '应付金额',
      dataIndex: 'calculatedAmount',
      key: 'calculatedAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '实付金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '支付日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    }
  ];

  // 运费支付表格列
  const freightColumns = [
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
    },
    {
      title: '车牌号',
      dataIndex: 'plateNumbers',
      key: 'plateNumbers',
      render: (plateNumbers: string[]) => (
        <div>
          {plateNumbers?.map(plate => (
            <Tag key={plate} color="blue">{plate}</Tag>
          ))}
        </div>
      )
    },
    {
      title: '关联到货记录',
      dataIndex: 'arrivalRecordId',
      key: 'arrivalRecordId',
      render: (arrivalRecordId: string) => arrivalRecordId ? (
        <Tag color="green">到货记录 #{arrivalRecordId.slice(-6)}</Tag>
      ) : (
        <Tag color="gray">手动录入</Tag>
      )
    },
    {
      title: '应付运费',
      dataIndex: 'calculatedAmount',
      key: 'calculatedAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '实付运费',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '支付日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    }
  ];

  // 客户收款表格列
  const customerColumns = [
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '关联到货记录',
      dataIndex: 'arrivalRecordId',
      key: 'arrivalRecordId',
      render: (arrivalRecordId: string) => arrivalRecordId ? (
        <Tag color="green">到货记录 #{arrivalRecordId.slice(-6)}</Tag>
      ) : (
        <Tag color="gray">手动录入</Tag>
      )
    },
    {
      title: '收款金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '收款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    }
  ];

  // 处理货款支付
  const handleCargoPayment = async () => {
    try {
      const values = await cargoForm.validateFields();
      const selectedShipment = shipments.find(s => s.id === values.shipmentId);
      
      const newPayment: CargoPayment = {
        id: Date.now().toString(),
        ...values,
        customerId: selectedShipment?.customerId || '',
        customerName: selectedShipment?.customerName || '',
        calculatedAmount: selectedShipment?.coalAmount || 0,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      const created = await paymentsService.createCargo({
        shipmentId: newPayment.shipmentId,
        customerId: newPayment.customerId,
        customerName: newPayment.customerName,
        calculatedAmount: newPayment.calculatedAmount,
        actualAmount: newPayment.actualAmount,
        paymentDate: newPayment.paymentDate,
        remark: newPayment.remark
      });
      setCargoPayments([...cargoPayments, created]);
      message.success('货款支付记录添加成功');
      setIsCargoModalVisible(false);
      cargoForm.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理运费支付
  const handleFreightPayment = async () => {
    try {
      const values = await freightForm.validateFields();
      const selectedDriver = drivers.find(d => d.id === values.driverId);
      
      const newPayment: ExtendedFreightPayment = {
        id: Date.now().toString(),
        driverId: values.driverId,
        driverName: selectedDriver?.name || '',
        plateNumbers: values.plateNumbers,
        calculatedAmount: values.calculatedAmount,
        actualAmount: values.actualAmount,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        remark: values.remark || '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      const created = await paymentsService.createFreight({
        driverId: newPayment.driverId,
        driverName: newPayment.driverName,
        plateNumbers: newPayment.plateNumbers || [],
        calculatedAmount: newPayment.calculatedAmount,
        actualAmount: newPayment.actualAmount,
        paymentDate: newPayment.paymentDate,
        remark: newPayment.remark
      });
      setFreightPayments([...freightPayments, created]);
      message.success('运费支付记录添加成功');
      setIsFreightModalVisible(false);
      freightForm.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理客户收款
  const handleCustomerPayment = async () => {
    try {
      const values = await customerForm.validateFields();
      const selectedCustomer = customers.find(c => c.id === values.customerId);
      
      const newPayment: CustomerPayment = {
        id: Date.now().toString(),
        ...values,
        customerName: selectedCustomer?.name || '',
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      const created = await paymentsService.createCustomer({
        customerId: newPayment.customerId,
        customerName: newPayment.customerName,
        amount: newPayment.amount,
        paymentDate: newPayment.paymentDate,
        remark: newPayment.remark
      });
      setCustomerPayments([...customerPayments, created]);
      message.success('客户收款记录添加成功');
      setIsCustomerModalVisible(false);
      customerForm.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <div>
      <Card title="付款管理">
        <Tabs defaultActiveKey="cargo">
          <TabPane tab="货款支付" key="cargo">
            <div style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsCargoModalVisible(true)}
              >
                新增货款支付
              </Button>
            </div>
            <Table 
              columns={cargoColumns} 
              dataSource={cargoPayments}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab="运费支付" key="freight">
            <div style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsFreightModalVisible(true)}
              >
                新增运费支付
              </Button>
            </div>
            <Table 
              columns={freightColumns} 
              dataSource={freightPayments}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab="客户收款" key="customer">
            <div style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsCustomerModalVisible(true)}
              >
                新增客户收款
              </Button>
            </div>
            <Table 
              columns={customerColumns} 
              dataSource={customerPayments}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 货款支付模态框 */}
      <Modal
        title="新增货款支付"
        open={isCargoModalVisible}
        onOk={handleCargoPayment}
        onCancel={() => setIsCargoModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={cargoForm} layout="vertical">
          <Form.Item
            name="shipmentId"
            label="选择车单"
            rules={[{ required: true, message: '请选择车单' }]}
          >
            <Select placeholder="请选择车单">
              {shipments.map(shipment => (
                <Option key={shipment.id} value={shipment.id}>
                  CU{String(shipment.id).padStart(6, '0')} - {shipment.customerName} (¥{shipment.coalAmount})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="actualAmount"
            label="实付金额"
            rules={[{ required: true, message: '请输入实付金额' }]}
          >
            <InputNumber 
              min={0} 
              precision={2}
              placeholder="请输入实付金额"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="paymentDate"
            label="支付日期"
            rules={[{ required: true, message: '请选择支付日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 运费支付模态框 */}
      <Modal
        title="新增运费支付"
        open={isFreightModalVisible}
        onOk={handleFreightPayment}
        onCancel={() => setIsFreightModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={freightForm} layout="vertical">
          <Form.Item
            name="driverId"
            label="选择司机"
            rules={[{ required: true, message: '请选择司机' }]}
          >
            <Select placeholder="请选择司机">
              {drivers.map(driver => (
                <Option key={driver.id} value={driver.id}>
                  {driver.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="plateNumbers"
            label="选择车牌"
            rules={[{ required: true, message: '请选择车牌' }]}
          >
            <Checkbox.Group>
              {drivers.find(d => d.id === freightForm.getFieldValue('driverId'))?.plateNumbers.map(plate => (
                <Checkbox key={plate} value={plate}>{plate}</Checkbox>
              )) || []}
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            name="calculatedAmount"
            label="应付运费"
            rules={[{ required: true, message: '请输入应付运费' }]}
          >
            <InputNumber 
              min={0} 
              precision={2}
              placeholder="请输入应付运费"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="actualAmount"
            label="实付运费"
            rules={[{ required: true, message: '请输入实付运费' }]}
          >
            <InputNumber 
              min={0} 
              precision={2}
              placeholder="请输入实付运费"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="paymentDate"
            label="支付日期"
            rules={[{ required: true, message: '请选择支付日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 客户收款模态框 */}
      <Modal
        title="新增客户收款"
        open={isCustomerModalVisible}
        onOk={handleCustomerPayment}
        onCancel={() => setIsCustomerModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={customerForm} layout="vertical">
          <Form.Item
            name="customerId"
            label="选择客户"
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

          <Form.Item
            name="amount"
            label="收款金额"
            rules={[{ required: true, message: '请输入收款金额' }]}
          >
            <InputNumber 
              min={0} 
              precision={2}
              placeholder="请输入收款金额"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="paymentDate"
            label="收款日期"
            rules={[{ required: true, message: '请选择收款日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注，如：4车半的钱" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentManagement;
