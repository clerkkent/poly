'use client';

import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Account, Order } from '@poly/shared';

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsRes, ordersRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/orders?accountId=' + (accounts[0]?.id || '')),
      ]);
      setAccounts(accountsRes.data);
      if (accountsRes.data.length > 0) {
        const ordersData = await api.get(`/orders?accountId=${accountsRes.data[0].id}`);
        setOrders(ordersData.data.slice(0, 10));
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderColumns = [
    { title: '订单ID', dataIndex: 'id', key: 'id', ellipsis: true },
    { title: '方向', dataIndex: 'side', key: 'side', render: (side: string) => (
      <Tag color={side === 'BUY' ? 'green' : 'red'}>{side}</Tag>
    )},
    { title: '价格', dataIndex: 'price', key: 'price' },
    { title: '数量', dataIndex: 'size', key: 'size' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
      <Tag color={status === 'FILLED' ? 'success' : status === 'PENDING' ? 'processing' : 'default'}>
        {status}
      </Tag>
    )},
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="账户总数"
              value={accounts.length}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃订单"
              value={orders.filter(o => o.status === 'PENDING').length}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已成交"
              value={orders.filter(o => o.status === 'FILLED').length}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已取消"
              value={orders.filter(o => o.status === 'CANCELLED').length}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="最近订单" loading={loading}>
            <Table
              columns={orderColumns}
              dataSource={orders}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="账户状态" loading={loading}>
            <div>
              {accounts.map(account => (
                <div key={account.id} style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  <div style={{ fontWeight: 'bold' }}>{account.name}</div>
                  <div style={{ marginTop: 8 }}>
                    <Tag color={account.enabled ? 'success' : 'default'}>
                      {account.enabled ? '已启用' : '已禁用'}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

