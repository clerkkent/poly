import { PolymarketReadonlyClient } from '@poly/polymarket';
import { Market, PriceData } from '@poly/shared';

// 只读客户端（行情数据与 chainId 无关，使用固定客户端）
let readonlyClient: PolymarketReadonlyClient | null = null;

export class MarketService {
  /**
   * 获取只读客户端（用于行情监控）
   * 注意：行情数据与 chainId 无关，使用固定客户端即可
   */
  static getReadonlyClient(): PolymarketReadonlyClient {
    if (!readonlyClient) {
      // 使用固定 chainId 137 初始化，因为行情数据是通用的
      readonlyClient = new PolymarketReadonlyClient(137);
      console.log(`[MarketService] 创建只读客户端（行情数据与 chainId 无关）`);
    }
    return readonlyClient;
  }

  /**
   * 获取市场列表（只读）
   */
  static async getMarkets(params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
  }): Promise<Market[]> {
    const client = this.getReadonlyClient();
    return client.getMarkets(params);
  }

  /**
   * 获取单个市场（只读）
   */
  static async getMarket(marketId: string): Promise<Market> {
    const client = this.getReadonlyClient();
    return client.getMarket(marketId);
  }

  /**
   * 获取订单簿（只读）
   */
  static async getOrderbook(tokenId: string): Promise<any> {
    const client = this.getReadonlyClient();
    return client.getOrderbook(tokenId);
  }

  /**
   * 获取价格数据（只读）
   */
  static async getPriceData(tokenId: string): Promise<PriceData> {
    const client = this.getReadonlyClient();
    return client.getPriceData(tokenId);
  }
}

