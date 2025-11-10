'use client';

import { Card, Table, Button, Space, Select, Tag, Modal, Form, Input, Switch, message, Popconfirm, Radio } from 'antd';
import { PlusOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Alert, Account } from '@poly/shared';

export default function Alerts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadAlerts();
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

  const loadAlerts = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const res = await api.get(`/alerts?accountId=${selectedAccount}`);
      setAlerts(res.data);
    } catch (error) {
      console.error('加载报警失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({ accountId: selectedAccount, enabled: true });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/alerts/${id}`);
      message.success('删除成功');
      loadAlerts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/alerts', values);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadAlerts();
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const columns = [
    { title: 'Token ID', dataIndex: 'tokenId', key: 'tokenId', ellipsis: true },
    {
      title: '条件',
      key: 'condition',
      render: (_: any, record: Alert) => {
        const conditionMap: Record<string, string> = {
          PRICE_ABOVE: '价格高于',
          PRICE_BELOW: '价格低于',
          VOLUME_ABOVE: '成交量高于',
          VOLUME_BELOW: '成交量低于',
        };
        return `${conditionMap[record.condition]} ${record.threshold}`;
      },
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: Alert) => (
        <Space>
          <Tag color={record.enabled ? 'success' : 'default'}>
            {record.enabled ? '已启用' : '已禁用'}
          </Tag>
          {record.triggered && (
            <Tag color="warning">已触发</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '触发时间',
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Alert) => (
        <Popconfirm
          title="确定删除这个报警吗？"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="报警系统"
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
            <Button icon={<ReloadOutlined />} onClick={loadAlerts}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建报警
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="创建报警"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="accountId" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="tokenId"
            label="Token ID"
            rules={[{ required: true, message: '请输入 Token ID' }]}
          >
            <Input placeholder="例如：114304586861386186441621124384163963092522056897081085884483958561365015034812" />
          </Form.Item>
          <Form.Item
            name="condition"
            label="触发条件"
            rules={[{ required: true, message: '请选择触发条件' }]}
          >
            <Radio.Group>
              <Radio value="PRICE_ABOVE">价格高于</Radio>
              <Radio value="PRICE_BELOW">价格低于</Radio>
              <Radio value="VOLUME_ABOVE">成交量高于</Radio>
              <Radio value="VOLUME_BELOW">成交量低于</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="threshold"
            label="阈值"
            rules={[{ required: true, message: '请输入阈值' }]}
          >
            <Input type="number" step="0.0001" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

