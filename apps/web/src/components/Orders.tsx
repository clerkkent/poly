'use client';

import { Card, Table, Button, Space, Select, Tag, Modal, Form, Input, InputNumber, Radio, message } from 'antd';
import { PlusOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Order, Account } from '@poly/shared';

export default function Orders() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadOrders();
      const interval = setInterval(loadOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedAccount]);

  const loadAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
      if (res.data.length > 0) {
        setSelectedAccount(res.data[0].id);
      }
    } catch (error) {
      console.error('加载账户失败:', error);
    }
  };

  const loadOrders = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const res = await api.get(`/orders?accountId=${selectedAccount}`);
      setOrders(res.data);
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      await api.delete(`/orders/${orderId}?accountId=${selectedAccount}`);
      message.success('取消成功');
      loadOrders();
    } catch (error) {
      message.error('取消失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/orders', {
        accountId: selectedAccount,
        ...values,
      });
      message.success('下单成功');
      setModalVisible(false);
      form.resetFields();
      loadOrders();
    } catch (error: any) {
      message.error(error.response?.data?.error || '下单失败');
    }
  };

  const columns = [
    { title: '订单ID', dataIndex: 'id', key: 'id', ellipsis: true },
    {
      title: '方向',
      dataIndex: 'side',
      key: 'side',
      render: (side: string) => (
        <Tag color={side === 'BUY' ? 'green' : 'red'}>{side}</Tag>
      ),
    },
    { title: '价格', dataIndex: 'price', key: 'price', render: (val: number) => val?.toFixed(4) },
    { title: '数量', dataIndex: 'size', key: 'size', render: (val: number) => val?.toFixed(2) },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          FILLED: 'success',
          PENDING: 'processing',
          CANCELLED: 'default',
          REJECTED: 'error',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleString() },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        record.status === 'PENDING' && (
          <Button
            type="link"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleCancel(record.id)}
          >
            取消
          </Button>
        )
      ),
    },
  ];

  return (
    <div>
      <Card
        title="订单管理"
        extra={
          <Space>
            <Select
              style={{ width: 200 }}
              value={selectedAccount}
              onChange={setSelectedAccount}
              placeholder="选择账户"
            >
              {accounts.map(acc => (
                <Select.Option key={acc.id} value={acc.id}>
                  {acc.name}
                </Select.Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadOrders}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              下单
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title="下单"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="tokenId"
            label="Token ID"
            rules={[{ required: true, message: '请输入 Token ID' }]}
          >
            <Input placeholder="例如：114304586861386186441621124384163963092522056897081085884483958561365015034812" />
          </Form.Item>
          <Form.Item
            name="side"
            label="方向"
            rules={[{ required: true, message: '请选择方向' }]}
          >
            <Radio.Group>
              <Radio value="BUY">买入</Radio>
              <Radio value="SELL">卖出</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="price"
            label="价格"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <Input min={0} step={0.0001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="size"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <Input min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="orderType" label="订单类型" initialValue="GTC">
            <Radio.Group>
              <Radio value="GTC">GTC (一直有效)</Radio>
              <Radio value="FOK">FOK (全部成交或取消)</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

