'use client';

import { Layout, Menu } from 'antd';
import { useState } from 'react';
import {
  DashboardOutlined,
  AccountBookOutlined,
  LineChartOutlined,
  BellOutlined,
  RobotOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import Dashboard from '@/components/Dashboard';
import Accounts from '@/components/Accounts';
import Markets from '@/components/Markets';
import Orders from '@/components/Orders';
import Strategies from '@/components/Strategies';
import Alerts from '@/components/Alerts';
import Header from '@/components/Header';
import '@/styles/layout.scss';

const { Sider, Content } = Layout;

export default function Home() {
  const [selectedKey, setSelectedKey] = useState('dashboard');

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: 'accounts', icon: <AccountBookOutlined />, label: '账户管理' },
    { key: 'markets', icon: <LineChartOutlined />, label: '行情观测' },
    { key: 'orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
    { key: 'strategies', icon: <RobotOutlined />, label: '交易策略' },
    { key: 'alerts', icon: <BellOutlined />, label: '报警系统' },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <Accounts />;
      case 'markets':
        return <Markets />;
      case 'orders':
        return <Orders />;
      case 'strategies':
        return <Strategies />;
      case 'alerts':
        return <Alerts />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div className="logo">Polymarket 量化</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => setSelectedKey(key)}
        />
      </Sider>
      <Layout>
        <Header />
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

