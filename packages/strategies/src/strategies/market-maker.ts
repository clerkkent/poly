import { BaseStrategy, StrategyContext, StrategyResult } from '../base';
import { Order } from '@poly/shared';

export interface MarketMakerConfig {
  tokenId: string;
  spread: number; // 价差百分比，如 0.01 表示 1%
  size: number; // 每次下单数量
  refreshInterval: number; // 刷新间隔（毫秒）
}

export class MarketMakerStrategy extends BaseStrategy {
  private config: MarketMakerConfig;

  constructor(context: StrategyContext, strategyId: string) {
    super(context, strategyId, 'Market Maker');
    this.config = context.config as MarketMakerConfig;
  }

  validate(): boolean {
    if (!this.config.tokenId) {
      return false;
    }
    if (this.config.spread <= 0 || this.config.spread >= 1) {
      return false;
    }
    if (this.config.size <= 0) {
      return false;
    }
    return true;
  }

  getDescription(): string {
    return `做市策略：在 ${this.config.tokenId} 上提供流动性，价差 ${(this.config.spread * 100).toFixed(2)}%`;
  }

  async execute(): Promise<StrategyResult> {
    try {
      if (!this.validate()) {
        return this.error('策略配置无效');
      }

      // 获取当前订单簿
      const orderbook = await this.context.client.getOrderbook(this.config.tokenId);
      const bestBid = parseFloat(orderbook.bids?.[0]?.[0] || '0');
      const bestAsk = parseFloat(orderbook.asks?.[0]?.[0] || '0');

      if (bestBid === 0 || bestAsk === 0) {
        return this.error('无法获取有效的订单簿数据');
      }

      const midPrice = (bestBid + bestAsk) / 2;
      const buyPrice = midPrice * (1 - this.config.spread / 2);
      const sellPrice = midPrice * (1 + this.config.spread / 2);

      // 下单
      const orders: Order[] = [];

      // 买单
      const buyOrder = await this.context.client.placeOrder({
        tokenId: this.config.tokenId,
        side: 'BUY',
        price: buyPrice,
        size: this.config.size,
        orderType: 'GTC',
      });
      orders.push(buyOrder);

      // 卖单
      const sellOrder = await this.context.client.placeOrder({
        tokenId: this.config.tokenId,
        side: 'SELL',
        price: sellPrice,
        size: this.config.size,
        orderType: 'GTC',
      });
      orders.push(sellOrder);

      this.log(`下单成功：买入价 ${buyPrice.toFixed(4)}，卖出价 ${sellPrice.toFixed(4)}`);

      return this.success(orders, '做市订单已提交');
    } catch (error) {
      return this.error('执行做市策略失败', error as Error);
    }
  }
}

