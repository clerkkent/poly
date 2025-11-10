export interface Account {
  id: string;
  name: string;
  apiKey: string;
  secret: string;
  passphrase: string;
  chainId?: number; // 链 ID，默认 137 (Polygon 主网)，545 可能是测试网
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Market {
  id: string;
  question: string;
  slug: string;
  conditionId: string;
  endDate: string;
  liquidity: number;
  volume: number;
  outcomes: MarketOutcome[];
}

export interface MarketOutcome {
  id: string;
  name: string;
  price: number;
  volume: number;
  liquidity: number;
}

export interface Order {
  id: string;
  accountId: string;
  tokenId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  orderType: 'GTC' | 'IOC' | 'FOK' | 'GTD';
  createdAt: Date;
  filledAt?: Date;
  cancelledAt?: Date;
}

export interface Alert {
  id: string;
  accountId: string;
  marketId: string;
  tokenId: string;
  condition: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VOLUME_ABOVE' | 'VOLUME_BELOW';
  threshold: number;
  enabled: boolean;
  triggered: boolean;
  triggeredAt?: Date;
  createdAt: Date;
}

export interface Strategy {
  id: string;
  name: string;
  type: string;
  accountId: string;
  enabled: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  orderId: string;
  accountId: string;
  tokenId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  timestamp: Date;
  pnl?: number;
}

export interface PriceData {
  tokenId: string;
  price: number;
  timestamp: Date;
  volume24h: number;
  change24h: number;
}

