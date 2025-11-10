'use client';

import { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Space, Statistic, Tag } from 'antd';
import { Market } from '@poly/shared';
import { api } from '@/lib/api';

interface PriceData {
  price: number;
  timestamp: Date;
  volume24h: number;
  change24h: number;
}

export default function PriceChart({ 
  market, 
  accountId
}: { 
  market: Market; 
  accountId?: string;
}) {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<PriceData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!market.outcomes || market.outcomes.length === 0) return;

    const tokenId = market.outcomes[0].id;
    const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:3001';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe_price',
        accountId: accountId || undefined,
        tokenId,
        interval: 5000,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'price_update') {
        const newData = {
          ...data.data,
          timestamp: new Date(data.data.timestamp),
        };
        setCurrentPrice(newData);
        setPriceData(prev => {
          const updated = [...prev, newData];
          return updated.slice(-50); // 只保留最近50个数据点
        });
      }
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [market, accountId]);

  const chartData = priceData.map((d, index) => ({
    time: index,
    price: d.price,
  }));

  return (
    <div>
      {currentPrice && (
        <Space size="large" style={{ marginBottom: 16 }}>
          <Statistic title="当前价格" value={currentPrice.price.toFixed(4)} />
          <Statistic
            title="24h变化"
            value={currentPrice.change24h}
            precision={2}
            valueStyle={{ color: currentPrice.change24h >= 0 ? '#3f8600' : '#cf1322' }}
            suffix="%"
          />
          <Statistic title="24h成交量" value={currentPrice.volume24h.toFixed(2)} />
        </Space>
      )}

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip />
          <Line type="monotone" dataKey="price" stroke="#1890ff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 16 }}>
        <h4>市场结果</h4>
        <Space>
          {market.outcomes?.map(outcome => (
            <Tag key={outcome.id} color="blue">
              {outcome.name}: {outcome.price?.toFixed(4) || 'N/A'}
            </Tag>
          ))}
        </Space>
      </div>
    </div>
  );
}

