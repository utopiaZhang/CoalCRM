import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  CarOutlined,
  UserOutlined,
  TruckOutlined,
  DollarOutlined,
  BarChartOutlined,
  AccountBookOutlined,
  TeamOutlined,
  ShopOutlined,
  BankOutlined
} from '@ant-design/icons';

// 导入页面组件（稍后创建）
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import CustomerReconciliation from './pages/CustomerReconciliation';
import SupplierManagement from './pages/SupplierManagement';
import DriverManagement from './pages/DriverManagement';
import ShipmentManagement from './pages/ShipmentManagement';
import DeliveryRecords from './pages/DeliveryRecords';
import ArrivalRecords from './pages/ArrivalRecords';
import PaymentManagement from './pages/PaymentManagement';
import Reconciliation from './pages/Reconciliation';
import Statistics from './pages/Statistics';
import LoanManagement from './pages/LoanManagement';

const { Header, Sider, Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">工作台</Link>,
    },
    {
      key: 'basic',
      icon: <TeamOutlined />,
      label: '基础数据',
      children: [
        {
          key: '/customers',
          icon: <UserOutlined />,
          label: <Link to="/customers">客户管理</Link>,
        },
        {
          key: '/suppliers',
          icon: <ShopOutlined />,
          label: <Link to="/suppliers">供货方管理</Link>,
        },
        {
          key: '/drivers',
          icon: <TruckOutlined />,
          label: <Link to="/drivers">司机管理</Link>,
        },
      ],
    },
    {
      key: 'business',
      icon: <CarOutlined />,
      label: '业务管理',
      children: [
        {
          key: '/shipments',
          icon: <CarOutlined />,
          label: <Link to="/shipments">车单管理</Link>,
        },
        {
          key: '/deliveries',
          icon: <TruckOutlined />,
          label: <Link to="/deliveries">发货记录</Link>,
        },
        {
          key: '/arrivals',
          icon: <TruckOutlined />,
          label: <Link to="/arrivals">到货记录</Link>,
        },
      ],
    },
    {
      key: 'finance',
      icon: <DollarOutlined />,
      label: '财务管理',
      children: [
        {
          key: '/payments',
          icon: <DollarOutlined />,
          label: <Link to="/payments">付款管理</Link>,
        },
        {
          key: '/loans',
          icon: <BankOutlined />,
          label: <Link to="/loans">资金往来</Link>,
        },
        {
          key: '/reconciliation',
          icon: <AccountBookOutlined />,
          label: <Link to="/reconciliation">对账中心</Link>,
        },
      ],
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: <Link to="/statistics">统计报表</Link>,
    },
  ];

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider trigger={null} collapsible collapsed={collapsed}>
          <div style={{ 
            height: 32, 
            margin: 16, 
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}>
            {collapsed ? 'CRM' : '煤炭供销CRM'}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['/']}
            items={menuItems}
          />
        </Sider>
        <Layout>
          <Header style={{ 
            padding: 0, 
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 16
          }}>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                border: 'none',
                background: 'none',
                cursor: 'pointer'
              }}
            >
              {collapsed ? '>' : '<'}
            </button>
            <h2 style={{ margin: 0, marginLeft: 16 }}>煤炭供销管理系统</h2>
          </Header>
          <Content
            style={{
              margin: '24px 16px',
              padding: 24,
              minHeight: 280,
              background: colorBgContainer,
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<CustomerManagement />} />
              <Route path="/customers/:customerId/reconciliation" element={<CustomerReconciliation />} />
              <Route path="/suppliers" element={<SupplierManagement />} />
              <Route path="/drivers" element={<DriverManagement />} />
              <Route path="/shipments" element={<ShipmentManagement />} />
              <Route path="/deliveries" element={<DeliveryRecords />} />
              <Route path="/arrivals" element={<ArrivalRecords />} />
              <Route path="/payments" element={<PaymentManagement />} />
              <Route path="/loans" element={<LoanManagement />} />
            <Route path="/reconciliation" element={<Reconciliation />} />
              <Route path="/statistics" element={<Statistics />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;
