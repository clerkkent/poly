'use client';

import { Layout, Space, Badge, Button } from 'antd';
import { BellOutlined, SettingOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;

export default function Header() {
  return (
    <AntHeader style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
        Polymarket 量化交易系统
      </div>
      <Space size="large">
        <Badge count={0} showZero>
          <Button type="text" icon={<BellOutlined />} />
        </Badge>
        <Button type="text" icon={<SettingOutlined />}>
          设置
        </Button>
      </Space>
    </AntHeader>
  );
}

