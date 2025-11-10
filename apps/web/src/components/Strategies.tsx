'use client';

import { Card, Table, Button, Space, Select, Tag, Modal, Form, Input, Switch, message, Popconfirm } from 'antd';
import { PlusOutlined, ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Strategy, Account } from '@poly/shared';

export default function Strategies() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [strategyTypes, setStrategyTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAccounts();
    loadStrategyTypes();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadStrategies();
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

  const loadStrategyTypes = async () => {
    try {
      const res = await api.get('/strategies/types');
      setStrategyTypes(res.data);
    } catch (error) {
      console.error('加载策略类型失败:', error);
    }
  };

  const loadStrategies = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const res = await api.get(`/strategies?accountId=${selectedAccount}`);
      setStrategies(res.data);
    } catch (error) {
      console.error('加载策略失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({ accountId: selectedAccount, enabled: true });
    setModalVisible(true);
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await api.put(`/strategies/${id}`, { enabled: !enabled });
      message.success(enabled ? '策略已停止' : '策略已启动');
      loadStrategies();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/strategies/${id}`);
      message.success('删除成功');
      loadStrategies();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/strategies', values);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadStrategies();
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const getStrategyConfigFields = (type: string) => {
    switch (type) {
      case 'market-maker':
        return (
          <>
            <Form.Item name={['config', 'tokenId']} label="Token ID" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name={['config', 'spread']} label="价差 (%)" rules={[{ required: true }]}>
              <InputNumber min={0.01} max={1} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name={['config', 'size']} label="数量" rules={[{ required: true }]}>
              <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </>
        );
      case 'momentum':
        return (
          <>
            <Form.Item name={['config', 'tokenId']} label="Token ID" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name={['config', 'momentumThreshold']} label="动量阈值 (%)" rules={[{ required: true }]}>
              <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name={['config', 'size']} label="数量" rules={[{ required: true }]}>
              <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '运行中' : '已停止'}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleString() },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Strategy) => (
        <Space>
          <Button
            type="link"
            icon={record.enabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => handleToggle(record.id, record.enabled)}
          >
            {record.enabled ? '停止' : '启动'}
          </Button>
          <Popconfirm
            title="确定删除这个策略吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="交易策略"
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
            <Button icon={<ReloadOutlined />} onClick={loadStrategies}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建策略
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={strategies}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="创建策略"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="accountId" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="策略名称"
            rules={[{ required: true, message: '请输入策略名称' }]}
          >
            <Input placeholder="例如：ETH 做市策略" />
          </Form.Item>
          <Form.Item
            name="type"
            label="策略类型"
            rules={[{ required: true, message: '请选择策略类型' }]}
          >
            <Select placeholder="选择策略类型">
              {strategyTypes.map(type => (
                <Select.Option key={type} value={type}>
                  {type === 'market-maker' ? '做市策略' : type === 'momentum' ? '动量策略' : type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => getStrategyConfigFields(getFieldValue('type'))}
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

