import React, { useEffect, useState } from 'react';
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
import { shipmentsService } from '../services/shipments';
import { customersService } from '../services/customers';
import { suppliersService } from '../services/suppliers';
import { batchesService } from '../services/batches';
import dayjs from 'dayjs';

const { Option } = Select;

const ShipmentManagement: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [viewingShipment, setViewingShipment] = useState<Shipment | null>(null);
  const [form] = Form.useForm();

  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [shipmentList, customerList, supplierList] = await Promise.all([
          shipmentsService.list(),
          customersService.list(),
          suppliersService.list()
        ]);
        setShipments(shipmentList);
        setCustomers(customerList.map(c => ({ id: c.id, name: c.name })));
        setSuppliers(supplierList.map(s => ({ id: s.id, name: s.name })));
      } catch (err) {
        console.error(err);
        message.error('加载车单数据失败');
      }
    };
    load();
  }, []);

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
          {/* 编辑暂不支持（车单为派生数据），请在发货记录中调整 */}
          <Button type="link" icon={<EditOutlined />} disabled>
            编辑
          </Button>
          {/* 删除暂不支持（需删除车辆/批次），请在发货记录中删除 */}
          <Button type="link" danger icon={<DeleteOutlined />} disabled>
            删除
          </Button>
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

  // 删除不支持，保留占位
  const handleDelete = (_id: string) => {};

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 通过创建发货批次（仅一个车辆）来生成车单
      const customerName = customers.find(c => c.id === values.customerId)?.name || '';
      const supplierName = suppliers.find(s => s.id === values.supplierId)?.name || '';
      await batchesService.create({
        customerId: values.customerId,
        customerName,
        supplierId: values.supplierId,
        supplierName,
        departureDate: values.departureDate.format('YYYY-MM-DD'),
        coalPrice: Number(values.coalPrice) || 0,
        vehicles: [{
          plateNumber: values.plateNumber,
          driverName: values.driverName || '',
          weight: Number(values.weight) || 0,
          amount: (Number(values.weight) || 0) * (Number(values.coalPrice) || 0)
        }]
      });
      const list = await shipmentsService.list();
      setShipments(list);
      message.success('车单创建成功');
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
