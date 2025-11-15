'use client';

import { Card, Table, Button, Space, Modal, Form, Input, Switch, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Account } from '@poly/shared';

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
    } catch (error) {
      message.error('加载账户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAccount(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    form.setFieldsValue({
      name: account.name,
      apiKey: account.apiKey,
      secret: account.secret,
      passphrase: account.passphrase,
      enabled: account.enabled,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/accounts/${id}`);
      message.success('删除成功');
      loadAccounts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/accounts', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadAccounts();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { 
      title: '私钥', 
      dataIndex: 'apiKey', 
      key: 'apiKey', 
      ellipsis: true,
      render: (text: string) => text ? `${text.substring(0, 10)}...${text.substring(text.length - 8)}` : '-'
    },
    {
      title: '链 ID',
      dataIndex: 'chainId',
      key: 'chainId',
      render: (chainId: number) => chainId || 137,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <span style={{ color: enabled ? '#52c41a' : '#999' }}>
          {enabled ? '已启用' : '已禁用'}
        </span>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleString() },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Account) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个账户吗？"
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
        title="账户管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            添加账户
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingAccount ? '编辑账户' : '添加账户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="账户名称"
            rules={[{ required: true, message: '请输入账户名称' }]}
          >
            <Input placeholder="例如：主账户" />
          </Form.Item>
          <Form.Item
            name="apiKey"
            label="私钥 (Private Key)"
            rules={[{ required: true, message: '请输入私钥' }]}
            tooltip="从 Magic Link 或 Web3 钱包导出的私钥"
          >
            <Input.Password placeholder="0x..." />
          </Form.Item>
          <Form.Item
            name="secret"
            label="签名类型 (Signature Type)"
            tooltip="1=Email/Magic, 2=Browser Wallet, 留空=EOA"
          >
            <Input placeholder="1 或 2（可选）" />
          </Form.Item>
          <Form.Item
            name="passphrase"
            label="代理地址 (Funder Address)"
            tooltip="Polymarket 代理地址（如果使用代理），在个人资料图片下方显示"
          >
            <Input placeholder="0x...（可选）" />
          </Form.Item>
          <Form.Item 
            name="chainId" 
            label="链 ID (Chain ID)" 
            tooltip="137=Polygon 主网（默认）"
            initialValue={137}
          >
            <Input min={1} style={{ width: '100%' }} placeholder="137" disabled />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

