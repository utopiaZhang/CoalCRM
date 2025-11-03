import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { 
  CarOutlined, 
  DollarOutlined, 
  TruckOutlined, 
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';

const Dashboard: React.FC = () => {
  // 模拟数据
  const recentDeliveries = [
    {
      key: '1',
      plateNumber: '京A12345',
      customerName: '北京钢铁厂',
      weight: 35.5,
      status: 'shipped',
      date: '2024-01-15'
    },
    {
      key: '2',
      plateNumber: '京B67890',
      customerName: '天津化工厂',
      weight: 40.2,
      status: 'arrived',
      date: '2024-01-14'
    },
    {
      key: '3',
      plateNumber: '津C11111',
      customerName: '河北电厂',
      weight: 38.8,
      status: 'paid',
      date: '2024-01-13'
    }
  ];

  const columns = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '重量(吨)',
      dataIndex: 'weight',
      key: 'weight',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          shipped: { color: 'blue', text: '已发货' },
          arrived: { color: 'orange', text: '已到货' },
          paid: { color: 'green', text: '已结算' }
        };
        const statusInfo = statusMap[status as keyof typeof statusMap];
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    }
  ];

  return (
    <div>
      <h1>工作台</h1>
      
      {/* 关键指标卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月发货车数"
              value={156}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月总重量(吨)"
              value={5420.5}
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月收入(万元)"
              value={1680.2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃客户数"
              value={28}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 待处理事项 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="待处理事项" size="small">
            <div style={{ marginBottom: 8 }}>
              <Tag color="red">紧急</Tag>
              <span>3车货款待结算</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Tag color="orange">重要</Tag>
              <span>5车运费待支付</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Tag color="blue">普通</Tag>
              <span>2个新客户待审核</span>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="本月统计" size="small">
            <div style={{ marginBottom: 8 }}>
              <span>总成本: </span>
              <span style={{ color: '#cf1322', fontWeight: 'bold' }}>1,250万元</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span>总收入: </span>
              <span style={{ color: '#3f8600', fontWeight: 'bold' }}>1,680万元</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span>净利润: </span>
              <span style={{ color: '#1890ff', fontWeight: 'bold' }}>430万元</span>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="快捷操作" size="small">
            <div style={{ marginBottom: 8 }}>
              <a href="/shipments">+ 新建车单</a>
            </div>
            <div style={{ marginBottom: 8 }}>
              <a href="/deliveries">+ 记录发货</a>
            </div>
            <div style={{ marginBottom: 8 }}>
              <a href="/payments">+ 处理付款</a>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 最近发货记录 */}
      <Card title="最近发货记录" style={{ marginBottom: 24 }}>
        <Table 
          columns={columns} 
          dataSource={recentDeliveries} 
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Dashboard;