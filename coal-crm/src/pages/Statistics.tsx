import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  DatePicker,
  Space,
  Button,
  Select,
  Progress
} from 'antd';
import { 
  DollarOutlined, 
  TruckOutlined, 
  ShopOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { MonthlyStats } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;

const Statistics: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');

  // 模拟月度统计数据
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([
    {
      month: '2024-01',
      totalCost: 180000,
      totalCoalPayment: 150000,
      totalFreight: 30000,
      totalCollection: 200000,
      totalProfit: 20000,
      shipmentCount: 45,
      totalWeight: 900
    },
    {
      month: '2023-12',
      totalCost: 165000,
      totalCoalPayment: 140000,
      totalFreight: 25000,
      totalCollection: 185000,
      totalProfit: 20000,
      shipmentCount: 42,
      totalWeight: 840
    },
    {
      month: '2023-11',
      totalCost: 155000,
      totalCoalPayment: 130000,
      totalFreight: 25000,
      totalCollection: 175000,
      totalProfit: 20000,
      shipmentCount: 38,
      totalWeight: 760
    }
  ]);

  // 获取当前月份数据
  const currentMonthData = monthlyStats[0];
  const previousMonthData = monthlyStats[1];

  // 计算同比增长率
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100);
  };

  // 月度统计表格列
  const monthlyColumns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: '车次',
      dataIndex: 'shipmentCount',
      key: 'shipmentCount',
      render: (count: number) => `${count}车次`
    },
    {
      title: '总重量',
      dataIndex: 'totalWeight',
      key: 'totalWeight',
      render: (weight: number) => `${weight}吨`
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost: number) => `¥${cost.toLocaleString()}`
    },
    {
      title: '煤款支出',
      dataIndex: 'totalCoalPayment',
      key: 'totalCoalPayment',
      render: (payment: number) => `¥${payment.toLocaleString()}`
    },
    {
      title: '运费支出',
      dataIndex: 'totalFreight',
      key: 'totalFreight',
      render: (freight: number) => `¥${freight.toLocaleString()}`
    },
    {
      title: '总收款',
      dataIndex: 'totalCollection',
      key: 'totalCollection',
      render: (collection: number) => `¥${collection.toLocaleString()}`
    },
    {
      title: '净利润',
      dataIndex: 'totalProfit',
      key: 'totalProfit',
      render: (profit: number) => (
        <span style={{ 
          color: profit >= 0 ? '#3f8600' : '#cf1322',
          fontWeight: 'bold'
        }}>
          ¥{profit.toLocaleString()}
        </span>
      )
    },
    {
      title: '利润率',
      key: 'profitRate',
      render: (record: MonthlyStats) => {
        const rate = record.totalCollection > 0 ? (record.totalProfit / record.totalCollection * 100) : 0;
        return (
          <span style={{ 
            color: rate >= 0 ? '#3f8600' : '#cf1322',
            fontWeight: 'bold'
          }}>
            {rate.toFixed(2)}%
          </span>
        );
      }
    }
  ];

  // 成本构成数据
  const costBreakdown = [
    { name: '煤款', value: currentMonthData.totalCoalPayment, color: '#1890ff' },
    { name: '运费', value: currentMonthData.totalFreight, color: '#52c41a' }
  ];

  return (
    <div>
      <Card title="经营统计" style={{ marginBottom: 24 }}>
        <Space style={{ marginBottom: 16 }}>
          <span>查询月份：</span>
          <DatePicker.MonthPicker
            value={selectedMonth}
            onChange={(date) => date && setSelectedMonth(date)}
          />
          <Select value={viewType} onChange={setViewType} style={{ width: 120 }}>
            <Option value="monthly">月度视图</Option>
            <Option value="yearly">年度视图</Option>
          </Select>
          <Button type="primary">刷新数据</Button>
        </Space>

        {/* 核心指标 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="本月收款"
                value={currentMonthData.totalCollection}
                precision={0}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
                suffix="元"
              />
              <div style={{ marginTop: 8 }}>
                {calculateGrowthRate(currentMonthData.totalCollection, previousMonthData.totalCollection) >= 0 ? (
                  <span style={{ color: '#3f8600' }}>
                    <RiseOutlined /> {calculateGrowthRate(currentMonthData.totalCollection, previousMonthData.totalCollection).toFixed(1)}%
                  </span>
                ) : (
                  <span style={{ color: '#cf1322' }}>
                    <FallOutlined /> {Math.abs(calculateGrowthRate(currentMonthData.totalCollection, previousMonthData.totalCollection)).toFixed(1)}%
                  </span>
                )}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="本月成本"
                value={currentMonthData.totalCost}
                precision={0}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ShopOutlined />}
                suffix="元"
              />
              <div style={{ marginTop: 8 }}>
                {calculateGrowthRate(currentMonthData.totalCost, previousMonthData.totalCost) >= 0 ? (
                  <span style={{ color: '#cf1322' }}>
                    <RiseOutlined /> {calculateGrowthRate(currentMonthData.totalCost, previousMonthData.totalCost).toFixed(1)}%
                  </span>
                ) : (
                  <span style={{ color: '#3f8600' }}>
                    <FallOutlined /> {Math.abs(calculateGrowthRate(currentMonthData.totalCost, previousMonthData.totalCost)).toFixed(1)}%
                  </span>
                )}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="本月利润"
                value={currentMonthData.totalProfit}
                precision={0}
                valueStyle={{ 
                  color: currentMonthData.totalProfit >= 0 ? '#3f8600' : '#cf1322' 
                }}
                prefix={<BarChartOutlined />}
                suffix="元"
              />
              <div style={{ marginTop: 8 }}>
                <span>利润率: {(currentMonthData.totalProfit / currentMonthData.totalCollection * 100).toFixed(2)}%</span>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="本月车次"
                value={currentMonthData.shipmentCount}
                precision={0}
                valueStyle={{ color: '#1890ff' }}
                prefix={<TruckOutlined />}
                suffix="车次"
              />
              <div style={{ marginTop: 8 }}>
                <span>总重量: {currentMonthData.totalWeight}吨</span>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 成本构成分析 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title="成本构成分析" size="small">
              {costBreakdown.map((item, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{item.name}</span>
                    <span>¥{item.value.toLocaleString()} ({(item.value / currentMonthData.totalCost * 100).toFixed(1)}%)</span>
                  </div>
                  <Progress 
                    percent={item.value / currentMonthData.totalCost * 100} 
                    strokeColor={item.color}
                    showInfo={false}
                  />
                </div>
              ))}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="经营效率指标" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="平均每车收入"
                    value={currentMonthData.totalCollection / currentMonthData.shipmentCount}
                    precision={0}
                    suffix="元"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="平均每车成本"
                    value={currentMonthData.totalCost / currentMonthData.shipmentCount}
                    precision={0}
                    suffix="元"
                  />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Statistic
                    title="平均每吨收入"
                    value={currentMonthData.totalCollection / currentMonthData.totalWeight}
                    precision={0}
                    suffix="元"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="平均每吨成本"
                    value={currentMonthData.totalCost / currentMonthData.totalWeight}
                    precision={0}
                    suffix="元"
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 历史数据表格 */}
      <Card title="历史统计数据">
        <Table
          columns={monthlyColumns}
          dataSource={monthlyStats}
          rowKey="month"
          pagination={{ pageSize: 12 }}
          summary={(pageData) => {
            const totalShipments = pageData.reduce((sum, record) => sum + record.shipmentCount, 0);
            const totalWeight = pageData.reduce((sum, record) => sum + record.totalWeight, 0);
            const totalCost = pageData.reduce((sum, record) => sum + record.totalCost, 0);
            const totalCollection = pageData.reduce((sum, record) => sum + record.totalCollection, 0);
            const totalProfit = pageData.reduce((sum, record) => sum + record.totalProfit, 0);
            
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>合计</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>{totalShipments}车次</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <strong>{totalWeight}吨</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <strong>¥{totalCost.toLocaleString()}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} />
                <Table.Summary.Cell index={5} />
                <Table.Summary.Cell index={6}>
                  <strong>¥{totalCollection.toLocaleString()}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7}>
                  <strong style={{ color: totalProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                    ¥{totalProfit.toLocaleString()}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8}>
                  <strong>
                    {totalCollection > 0 ? (totalProfit / totalCollection * 100).toFixed(2) : 0}%
                  </strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default Statistics;