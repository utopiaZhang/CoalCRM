import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Descriptions, 
  Table, 
  Button, 
  Modal, 
  Tabs, 
  Statistic,
  Row,
  Col,
  Tag,
  Space,
  message
} from 'antd';
import { ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, Shipment, ArrivalRecord } from '../types';

const { TabPane } = Tabs;

interface CustomerReconciliationData {
  customer: Customer;
  totalShipments: number;
  totalArrivalWeight: number;
  collectedAmount: number;
  outstandingReceivables: number;
  unsettledAmounts: Array<{
    id: string;
    arrivalRecordId: string;
    arrivalDate: string;
    amount: number;
    status: 'unsettled' | 'partial' | 'settled';
  }>;
}

interface VehicleOrderSummary {
  id: string;
  plateNumber: string;
  shippingWeight: number;
  arrivalWeight: number;
  shippingDate: string;
  arrivalDate: string;
  sellingUnitPrice: number;
  receivableAmount: number;
  status: 'settled' | 'unsettled';
}

const CustomerReconciliation: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  
  const [reconciliationData, setReconciliationData] = useState<CustomerReconciliationData | null>(null);
  const [vehicleOrders, setVehicleOrders] = useState<VehicleOrderSummary[]>([]);
  const [isVehicleModalVisible, setIsVehicleModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // 模拟数据加载
  useEffect(() => {
    if (customerId) {
      loadReconciliationData(customerId);
      loadVehicleOrders(customerId);
    }
  }, [customerId]);

  const loadReconciliationData = (id: string) => {
    // 模拟数据
    const mockData: CustomerReconciliationData = {
      customer: {
        id: id,
        name: '北京钢铁厂',
        contact: '张经理',
        phone: '13800138001',
        address: '北京市朝阳区工业园区1号',
        createdAt: '2024-01-01'
      },
      totalShipments: 25,
      totalArrivalWeight: 875.5,
      collectedAmount: 680000,
      outstandingReceivables: 120000,
      unsettledAmounts: [
        {
          id: '1',
          arrivalRecordId: 'arr001',
          arrivalDate: '2024-01-15',
          amount: 45000,
          status: 'unsettled'
        },
        {
          id: '2',
          arrivalRecordId: 'arr002',
          arrivalDate: '2024-01-18',
          amount: 38000,
          status: 'partial'
        },
        {
          id: '3',
          arrivalRecordId: 'arr003',
          arrivalDate: '2024-01-20',
          amount: 37000,
          status: 'unsettled'
        }
      ]
    };
    setReconciliationData(mockData);
  };

  const loadVehicleOrders = (id: string) => {
    // 模拟车单数据
    const mockOrders: VehicleOrderSummary[] = [
      {
        id: '1',
        plateNumber: '京A12345',
        shippingWeight: 35.0,
        arrivalWeight: 34.2,
        shippingDate: '2024-01-10',
        arrivalDate: '2024-01-15',
        sellingUnitPrice: 850,
        receivableAmount: 29070,
        status: 'settled'
      },
      {
        id: '2',
        plateNumber: '京B67890',
        shippingWeight: 40.0,
        arrivalWeight: 39.5,
        shippingDate: '2024-01-12',
        arrivalDate: '2024-01-18',
        sellingUnitPrice: 850,
        receivableAmount: 33575,
        status: 'unsettled'
      },
      {
        id: '3',
        plateNumber: '京C11111',
        shippingWeight: 38.0,
        arrivalWeight: 37.8,
        shippingDate: '2024-01-14',
        arrivalDate: '2024-01-20',
        sellingUnitPrice: 850,
        receivableAmount: 32130,
        status: 'unsettled'
      },
      {
        id: '4',
        plateNumber: '京D22222',
        shippingWeight: 42.0,
        arrivalWeight: 41.5,
        shippingDate: '2024-01-16',
        arrivalDate: '2024-01-22',
        sellingUnitPrice: 850,
        receivableAmount: 35275,
        status: 'settled'
      }
    ];
    setVehicleOrders(mockOrders);
  };

  const unsettledAmountsColumns = [
    {
      title: '到货记录ID',
      dataIndex: 'arrivalRecordId',
      key: 'arrivalRecordId',
    },
    {
      title: '到货日期',
      dataIndex: 'arrivalDate',
      key: 'arrivalDate',
    },
    {
      title: '未平账金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          'unsettled': { color: 'red', text: '未平账' },
          'partial': { color: 'orange', text: '部分平账' },
          'settled': { color: 'green', text: '已平账' }
        };
        const config = statusMap[status as keyof typeof statusMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  const vehicleOrderColumns = [
    {
      title: '车号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
    },
    {
      title: '发货称重(吨)',
      dataIndex: 'shippingWeight',
      key: 'shippingWeight',
      render: (weight: number) => weight.toFixed(1),
    },
    {
      title: '到货称重(吨)',
      dataIndex: 'arrivalWeight',
      key: 'arrivalWeight',
      render: (weight: number) => weight.toFixed(1),
    },
    {
      title: '发货日期',
      dataIndex: 'shippingDate',
      key: 'shippingDate',
    },
    {
      title: '到货日期',
      dataIndex: 'arrivalDate',
      key: 'arrivalDate',
    },
    {
      title: '售价单价(元/吨)',
      dataIndex: 'sellingUnitPrice',
      key: 'sellingUnitPrice',
      render: (price: number) => `¥${price}`,
    },
    {
      title: '应收金额',
      dataIndex: 'receivableAmount',
      key: 'receivableAmount',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'settled' ? 'green' : 'red'}>
          {status === 'settled' ? '已平账' : '未平账'}
        </Tag>
      ),
    },
  ];

  const getFilteredVehicleOrders = () => {
    switch (activeTab) {
      case 'settled':
        return vehicleOrders.filter(order => order.status === 'settled');
      case 'unsettled':
        return vehicleOrders.filter(order => order.status === 'unsettled');
      default:
        return vehicleOrders;
    }
  };

  const calculateStatistics = (orders: VehicleOrderSummary[]) => {
    return {
      totalShippingWeight: orders.reduce((sum, order) => sum + order.shippingWeight, 0),
      totalArrivalWeight: orders.reduce((sum, order) => sum + order.arrivalWeight, 0),
      totalReceivables: orders.reduce((sum, order) => sum + order.receivableAmount, 0),
    };
  };

  const handleBack = () => {
    navigate('/customers');
  };

  const handleShowVehicleOrders = () => {
    setIsVehicleModalVisible(true);
  };

  if (!reconciliationData) {
    return <div>加载中...</div>;
  }

  const filteredOrders = getFilteredVehicleOrders();
  const statistics = calculateStatistics(filteredOrders);

  return (
    <div>
      <Card 
        title={
          <Space>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
            >
              返回
            </Button>
            <span>客户对账 - {reconciliationData.customer.name}</span>
          </Space>
        }
      >
        {/* 客户基础信息 */}
        <Card title="客户基础信息" style={{ marginBottom: 16 }}>
          <Descriptions column={2}>
            <Descriptions.Item label="客户名称">{reconciliationData.customer.name}</Descriptions.Item>
            <Descriptions.Item label="联系人">{reconciliationData.customer.contact}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{reconciliationData.customer.phone}</Descriptions.Item>
            <Descriptions.Item label="地址">{reconciliationData.customer.address}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 统计数据 */}
        <Card title="对账统计" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic 
                title="总车数" 
                value={reconciliationData.totalShipments} 
                suffix="车"
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="总到货称重" 
                value={reconciliationData.totalArrivalWeight} 
                suffix="吨"
                precision={1}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="已收款金额" 
                value={reconciliationData.collectedAmount} 
                prefix="¥"
                precision={0}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="应收未收金额" 
                value={reconciliationData.outstandingReceivables} 
                prefix="¥"
                precision={0}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 未平账金额列表 */}
        <Card 
          title="未平账金额" 
          style={{ marginBottom: 16 }}
          extra={
            <Button 
              type="primary" 
              icon={<EyeOutlined />}
              onClick={handleShowVehicleOrders}
            >
              查看车单详情
            </Button>
          }
        >
          <Table
            columns={unsettledAmountsColumns}
            dataSource={reconciliationData.unsettledAmounts}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      </Card>

      {/* 车单详情弹窗 */}
      <Modal
        title={`${reconciliationData.customer.name} - 车单详情`}
        open={isVehicleModalVisible}
        onCancel={() => setIsVehicleModalVisible(false)}
        footer={null}
        width={1200}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="全部车单" key="all">
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic 
                    title="总发货称重" 
                    value={statistics.totalShippingWeight} 
                    suffix="吨"
                    precision={1}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="总到货称重" 
                    value={statistics.totalArrivalWeight} 
                    suffix="吨"
                    precision={1}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="总应收" 
                    value={statistics.totalReceivables} 
                    prefix="¥"
                    precision={0}
                  />
                </Col>
              </Row>
            </Card>
            <Table
              columns={vehicleOrderColumns}
              dataSource={filteredOrders}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>
          
          <TabPane tab="未平账车单" key="unsettled">
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic 
                    title="总发货称重" 
                    value={statistics.totalShippingWeight} 
                    suffix="吨"
                    precision={1}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="总到货称重" 
                    value={statistics.totalArrivalWeight} 
                    suffix="吨"
                    precision={1}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="总应收" 
                    value={statistics.totalReceivables} 
                    prefix="¥"
                    precision={0}
                  />
                </Col>
              </Row>
            </Card>
            <Table
              columns={vehicleOrderColumns}
              dataSource={filteredOrders}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>
          
          <TabPane tab="已平账车单" key="settled">
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic 
                    title="总发货称重" 
                    value={statistics.totalShippingWeight} 
                    suffix="吨"
                    precision={1}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="总到货称重" 
                    value={statistics.totalArrivalWeight} 
                    suffix="吨"
                    precision={1}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="总应收" 
                    value={statistics.totalReceivables} 
                    prefix="¥"
                    precision={0}
                  />
                </Col>
              </Row>
            </Card>
            <Table
              columns={vehicleOrderColumns}
              dataSource={filteredOrders}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default CustomerReconciliation;