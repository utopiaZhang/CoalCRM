import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Space, 
  Popconfirm, 
  message,
  Card,
  Select,
  DatePicker,
  InputNumber,
  Tag,
  Descriptions
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Shipment } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;

const ShipmentManagement: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([
    {
      id: '1',
      batchId: 'batch-1',
      vehicleId: 'vehicle-1',
      plateNumber: '京A12345',
      driverName: '张师傅',
      driverId: 'driver-1',
      customerId: '1',
      customerName: '北京钢铁厂',
      supplierId: '1',
      supplierName: '山西煤业集团',
      coalPrice: 800,
      freightPrice: 120,
      weight: 30,
      coalAmount: 24000,
      freightAmount: 3600,
      departureDate: '2024-01-15',
      arrivalDate: '2024-01-17',
      status: 'completed',
      createdAt: '2024-01-14'
    },
    {
      id: '2',
      batchId: 'batch-2',
      vehicleId: 'vehicle-2',
      plateNumber: '津B67890',
      driverName: '李师傅',
      driverId: 'driver-2',
      customerId: '2',
      customerName: '天津化工厂',
      supplierId: '2',
      supplierName: '内蒙古能源公司',
      coalPrice: 750,
      freightPrice: 100,
      weight: 25,
      coalAmount: 18750,
      freightAmount: 2500,
      departureDate: '2024-01-16',
      status: 'shipping',
      createdAt: '2024-01-15'
    }
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [viewingShipment, setViewingShipment] = useState<Shipment | null>(null);
  const [form] = Form.useForm();

  // 模拟客户和供货方数据
  const customers = [
    { id: '1', name: '北京钢铁厂' },
    { id: '2', name: '天津化工厂' },
    { id: '3', name: '河北电厂' }
  ];

  const suppliers = [
    { id: '1', name: '山西煤业集团' },
    { id: '2', name: '内蒙古能源公司' },
    { id: '3', name: '陕西煤炭集团' }
  ];

  const columns = [
    {
      title: '车单编号',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => `CU${id.padStart(6, '0')}`
    },
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      render: (plateNumber: string) => (
        <Tag color="blue">{plateNumber}</Tag>
      )
    },
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '供货方',
      dataIndex: 'supplierName',
      key: 'supplierName',
    },
    {
      title: '重量(吨)',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight: number) => `${weight}吨`
    },
    {
      title: '煤价(元/吨)',
      dataIndex: 'coalPrice',
      key: 'coalPrice',
      render: (price: number) => `¥${price}`
    },
    {
      title: '运费(元/吨)',
      dataIndex: 'freightPrice',
      key: 'freightPrice',
      render: (price: number) => `¥${price}`
    },
    {
      title: '发货日期',
      dataIndex: 'departureDate',
      key: 'departureDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'orange', text: '待发货' },
          shipping: { color: 'blue', text: '运输中' },
          completed: { color: 'green', text: '已完成' }
        };
        const statusInfo = statusMap[status as keyof typeof statusMap];
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Shipment) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个车单吗？"
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

  const handleAdd = () => {
    setEditingShipment(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment);
    form.setFieldsValue({
      ...shipment,
      departureDate: dayjs(shipment.departureDate),
      arrivalDate: shipment.arrivalDate ? dayjs(shipment.arrivalDate) : undefined
    });
    setIsModalVisible(true);
  };

  const handleView = (shipment: Shipment) => {
    setViewingShipment(shipment);
    setIsDetailVisible(true);
  };

  const handleDelete = (id: string) => {
    setShipments(shipments.filter(shipment => shipment.id !== id));
    message.success('车单删除成功');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const customerName = customers.find(c => c.id === values.customerId)?.name || '';
      const supplierName = suppliers.find(s => s.id === values.supplierId)?.name || '';
      
      const formattedValues = {
        ...values,
        departureDate: values.departureDate.format('YYYY-MM-DD'),
        arrivalDate: values.expectedArrivalDate ? values.expectedArrivalDate.format('YYYY-MM-DD') : undefined,
        customerName,
        supplierName,
        coalAmount: values.weight * values.coalPrice, // 计算煤款
        freightAmount: values.weight * values.freightPrice, // 计算运费
        batchId: `batch-${Date.now()}`, // 生成批次ID
        vehicleId: `vehicle-${Date.now()}`, // 生成车辆ID
        driverId: `driver-${Date.now()}`, // 生成司机ID
      };
      
      if (editingShipment) {
        // 编辑车单
        setShipments(shipments.map(shipment => 
          shipment.id === editingShipment.id 
            ? { ...shipment, ...formattedValues }
            : shipment
        ));
        message.success('车单信息更新成功');
      } else {
        // 新增车单
        const newShipment: Shipment = {
          id: Date.now().toString(),
          ...formattedValues,
          status: 'shipping',
          createdAt: new Date().toISOString().split('T')[0]
        };
        setShipments([...shipments, newShipment]);
        message.success('车单创建成功');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingShipment(null);
  };

  return (
    <div>
      <Card 
        title="车单管理" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新建车单
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={shipments}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 新增/编辑车单模态框 */}
      <Modal
        title={editingShipment ? '编辑车单' : '新建车单'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="shipmentForm"
        >
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

          <Form.Item
            name="plateNumber"
            label="车牌号"
            rules={[{ required: true, message: '请输入车牌号' }]}
          >
            <Input placeholder="请输入车牌号，如：京A12345" />
          </Form.Item>

          <Form.Item
            name="driverName"
            label="司机姓名"
            rules={[{ required: true, message: '请输入司机姓名' }]}
          >
            <Input placeholder="请输入司机姓名" />
          </Form.Item>

          <Form.Item
            name="weight"
            label="重量(吨)"
            rules={[{ required: true, message: '请输入重量' }]}
          >
            <InputNumber 
              min={0} 
              precision={2}
              placeholder="请输入重量"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="coalPrice"
            label="煤价(元/吨)"
            rules={[{ required: true, message: '请输入煤价' }]}
          >
            <InputNumber 
              min={0} 
              precision={2}
              placeholder="请输入煤价"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="freightPrice"
            label="运费(元/吨)"
            rules={[{ required: true, message: '请输入运费' }]}
          >
            <InputNumber 
              min={0} 
              precision={2}
              placeholder="请输入运费"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="departureDate"
            label="发货日期"
            rules={[{ required: true, message: '请选择发货日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="expectedArrivalDate"
            label="预计到货日期"
            rules={[{ required: true, message: '请选择预计到货日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 车单详情模态框 */}
      <Modal
        title="车单详情"
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {viewingShipment && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="车单编号">
              CU{viewingShipment.id.padStart(6, '0')}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={
                viewingShipment.status === 'shipping' ? 'blue' : 
                viewingShipment.status === 'arrived' ? 'orange' : 'green'
              }>
                {viewingShipment.status === 'shipping' ? '运输中' :
                 viewingShipment.status === 'arrived' ? '已到货' : '已完成'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="车牌号">
              {viewingShipment.plateNumber}
            </Descriptions.Item>
            <Descriptions.Item label="司机">
              {viewingShipment.driverName}
            </Descriptions.Item>
            <Descriptions.Item label="客户">
              {viewingShipment.customerName}
            </Descriptions.Item>
            <Descriptions.Item label="供货方">
              {viewingShipment.supplierName}
            </Descriptions.Item>
            <Descriptions.Item label="重量">
              {viewingShipment.weight}吨
            </Descriptions.Item>
            <Descriptions.Item label="煤价">
              {viewingShipment.coalPrice}元/吨
            </Descriptions.Item>
            <Descriptions.Item label="运费">
              {viewingShipment.freightPrice}元/吨
            </Descriptions.Item>
            <Descriptions.Item label="煤款金额">
              ¥{viewingShipment.coalAmount.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="运费金额">
              ¥{viewingShipment.freightAmount.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="发货日期">
              {viewingShipment.departureDate}
            </Descriptions.Item>
            <Descriptions.Item label="到货日期">
              {viewingShipment.arrivalDate || '未到货'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {viewingShipment.createdAt}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ShipmentManagement;