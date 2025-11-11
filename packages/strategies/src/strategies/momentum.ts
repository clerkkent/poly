import { BaseStrategy, StrategyContext, StrategyResult } from '../base';
import { Order, PriceData } from '@poly/shared';

export interface MomentumConfig {
  tokenId: string;
  lookbackPeriod: number; // 回看周期（分钟）
  momentumThreshold: number; // 动量阈值
  size: number;
  stopLoss?: number; // 止损百分比
  takeProfit?: number; // 止盈百分比
}

export class MomentumStrategy extends BaseStrategy {
  private config: MomentumConfig;
  private priceHistory: PriceData[] = [];

  constructor(context: StrategyContext, strategyId: string) {
    super(context, strategyId, 'Momentum');
    this.config = context.config as MomentumConfig;
  }

  validate(): boolean {
    if (!this.config.tokenId) {
      return false;
    }
    if (this.config.momentumThreshold <= 0) {
      return false;
    }
    if (this.config.size <= 0) {
      return false;
    }
    return true;
  }

  getDescription(): string {
    return `动量策略：监控 ${this.config.tokenId} 的价格动量，阈值 ${(this.config.momentumThreshold * 100).toFixed(2)}%`;
  }

  addPriceData(data: PriceData): void {
    this.priceHistory.push(data);
    // 只保留最近的数据
    const cutoff = Date.now() - this.config.lookbackPeriod * 60 * 1000;
    this.priceHistory = this.priceHistory.filter(p => p.timestamp.getTime() > cutoff);
  }

  calculateMomentum(): number {
    if (this.priceHistory.length < 2) {
      return 0;
    }
    const oldest = this.priceHistory[0].price;
    const newest = this.priceHistory[this.priceHistory.length - 1].price;
    return (newest - oldest) / oldest;
  }

  async execute(): Promise<StrategyResult> {
    try {
      if (!this.validate()) {
        return this.error('策略配置无效');
      }

      // 获取最新价格
      const priceData = await this.context.client.getPriceData(this.config.tokenId);
      this.addPriceData(priceData);

      const momentum = this.calculateMomentum();

      if (Math.abs(momentum) < this.config.momentumThreshold) {
        return this.success([], '动量不足，不执行交易');
      }

      const side = momentum > 0 ? 'BUY' : 'SELL';
      const currentPrice = priceData.price;

      const order = await this.context.client.placeOrder({
        tokenId: this.config.tokenId,
        side,
        price: currentPrice,
        size: this.config.size,
        orderType: 'GTC',
      });

      this.log(`动量交易：${side} ${this.config.size} @ ${currentPrice.toFixed(4)}，动量 ${(momentum * 100).toFixed(2)}%`);

      return this.success([order], `动量${side}订单已提交`);
    } catch (error) {
      return this.error('执行动量策略失败', error as Error);
    }
  }
}

