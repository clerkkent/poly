'use client';

import { Card, Select, Table, Space, Button, Input, Tag, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Market, Account } from '@poly/shared';
import PriceChart from './PriceChart';

export default function Markets() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [monitoredMarkets, setMonitoredMarkets] = useState<Market[]>([]); // 监控的市场列表
  const [marketIdInput, setMarketIdInput] = useState<string>(''); // 手动输入的市场 ID

  useEffect(() => {
    loadAccounts();
    loadMarkets();
  }, [selectedAccount]);

  // 自动监控前三个交易对的行情
  useEffect(() => {
    if (markets.length >= 3) {
      const top3Markets = markets.slice(0, 3);
      setMonitoredMarkets(top3Markets);
      console.log(`[Markets] 自动监控前三个交易对:`, top3Markets.map(m => m.question || m.id));
    }
  }, [markets]);

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

  const loadMarkets = async () => {
    setLoading(true);
    try {
      // 行情数据与 chainId 无关
      const params = selectedAccount 
        ? `accountId=${selectedAccount}&limit=50`
        : `limit=50`;
      const res = await api.get(`/markets?${params}`);
      setMarkets(res.data);
    } catch (error) {
      console.error('加载市场失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMarketById = async (silent = false) => {
    const inputValue = marketIdInput.trim();
    if (!inputValue) {
      if (!silent) {
        message.warning('请输入市场 ID 或 URL');
      }
      return;
    }
    setLoading(true);
    try {
      let marketId = inputValue;
      
      // 如果输入的是 URL，尝试提取 market ID
      if (marketId.includes('polymarket.com')) {
        // 尝试提取 tid 参数
        const tidMatch = marketId.match(/tid=(\d+)/);
        if (tidMatch) {
          marketId = tidMatch[1];
          console.log(`[Markets] 从 URL 提取 market ID: ${marketId}`);
        } else {
          // 尝试从 URL 路径提取
          const pathMatch = marketId.match(/event\/[^?]+/);
          if (pathMatch) {
            if (!silent) {
              message.info('正在尝试通过 URL 查找市场...');
            }
          }
        }
      }

      // 尝试通过 market ID 或 condition ID 获取市场（行情数据与 chainId 无关）
      const params = selectedAccount 
        ? `accountId=${selectedAccount}`
        : '';
      
      console.log(`[Markets] 📊 加载市场: marketId=${marketId}`);
      const res = await api.get(`/markets/${marketId}${params ? `?${params}` : ''}`);
      const newMarket = res.data;
      
      if (!silent) {
        message.success(`市场加载成功: ${newMarket.question || marketId}`);
      }
      
      // 添加到监控列表
      setMonitoredMarkets(prev => {
        if (!prev.find(m => m.id === newMarket.id)) {
          return [...prev, newMarket];
        }
        return prev;
      });
      
      // 如果市场不在列表中，添加到列表
      setMarkets(prev => {
        if (!prev.find(m => m.id === newMarket.id)) {
          return [newMarket, ...prev];
        }
        return prev;
      });
    } catch (error: any) {
      console.error('[Markets] ❌ 加载市场失败:', error);
      if (!silent) {
        message.error(error.response?.data?.error || '加载市场失败，请检查市场 ID 是否正确');
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '问题', dataIndex: 'question', key: 'question', ellipsis: true },
    { title: '流动性', dataIndex: 'liquidity', key: 'liquidity', render: (val: number) => val?.toFixed(2) },
    { title: '成交量', dataIndex: 'volume', key: 'volume', render: (val: number) => val?.toFixed(2) },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Market) => (
        <Button 
          type="link" 
          onClick={() => {
            // 将市场添加到监控列表
            setMonitoredMarkets(prev => {
              if (!prev.find(m => m.id === record.id)) {
                return [...prev, record];
              }
              return prev;
            });
            message.success(`已添加 ${record.question || record.id} 到监控列表`);
          }}
        >
          添加到监控
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="行情观测"
        extra={
          <Space>
            <Select
              style={{ width: 200 }}
              value={selectedAccount}
              onChange={(value) => {
                setSelectedAccount(value || '');
              }}
              placeholder="选择账户（可选）"
              allowClear
            >
              {accounts.map(acc => (
                <Select.Option key={acc.id} value={acc.id}>
                  {acc.name}
                </Select.Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadMarkets}>
              刷新列表
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical" size="middle">
          <Space style={{ width: '100%' }}>
            <Input
              style={{ width: 500 }}
              placeholder="输入市场 ID 或 Polymarket URL（例如：1762798142175 或完整 URL）"
              value={marketIdInput}
              onChange={(e) => setMarketIdInput(e.target.value)}
              onPressEnter={() => loadMarketById(false)}
              allowClear
            />
            <Button type="primary" onClick={() => loadMarketById(false)} loading={loading}>
              添加监控
            </Button>
          </Space>
          {monitoredMarkets.length > 0 && (
            <div>
              <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px', marginBottom: 8 }}>
                正在监控 {monitoredMarkets.length} 个市场
              </Tag>
            </div>
          )}
        </Space>
        <Table
          columns={columns}
          dataSource={markets}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* 显示所有监控的市场行情 */}
      {monitoredMarkets.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {monitoredMarkets.map((market) => (
            <Card
              key={market.id}
              title={market.question || market.id}
              style={{ marginBottom: 16 }}
              extra={
                <Button 
                  size="small" 
                  onClick={() => {
                    setMonitoredMarkets(prev => prev.filter(m => m.id !== market.id));
                  }}
                >
                  移除监控
                </Button>
              }
            >
              <PriceChart 
                market={market} 
                accountId={selectedAccount}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

