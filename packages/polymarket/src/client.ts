import { ClobClient, Side, OrderType, UserOrder, OpenOrder, TradeParams, Trade } from '@polymarket/clob-client';
import { Wallet } from '@ethersproject/wallet';
import { Account, Market, Order, PriceData } from '@poly/shared';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

export interface PolymarketConfig {
  privateKey: string; // 私钥
  chainId?: number; // 链 ID，默认 137 (Polygon)
  signatureType?: 1 | 2; // 签名类型：1=Email/Magic, 2=Browser Wallet, undefined=EOA
  funder?: string; // Polymarket 代理地址（如果使用代理）
  baseURL?: string; // API 基础 URL
  proxy?: string; // 代理地址，例如: http://127.0.0.1:7890
  timeout?: number;
  retries?: number; // 重试次数
}

export class PolymarketClient {
  private client: ClobClient;
  private config: PolymarketConfig;
  private signer: Wallet;

  constructor(config: PolymarketConfig) {
    this.config = config;
    
    // 创建钱包签名者
    this.signer = new Wallet(config.privateKey);
    
    // 配置代理（如果官方客户端支持）
    const host = config.baseURL || 'https://clob.polymarket.com';
    const chainId = config.chainId || 137;
    
    // 初始化 ClobClient
    // 根据文档：ClobClient(host, chainId, signer, apiKey?, signatureType?, funder?)
    console.log(config.funder, config.signatureType,config.privateKey, 'config.funder, config.signatureType');
    if (config.funder && config.signatureType) {
      // 使用代理地址和签名类型
      this.client = new ClobClient(
        host,
        chainId,
        this.signer,
        undefined, // apiKey (可选)
        config.signatureType,
        config.funder
      );
    } else {
      // 直接使用 EOA
      this.client = new ClobClient(host, chainId, this.signer);
    }
  }

  // 获取市场列表（需要使用 Gamma API 或其他数据源）
  async getMarkets(params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
  }): Promise<Market[]> {
    try {
      const result = await this.client.getMarkets();
      // 新版本返回 PaginationPayload，包含 data 数组
      const markets = (result as any).data || result || [];
      const limit = params?.limit || 50;
      // 转换格式
      return (Array.isArray(markets) ? markets : []).slice(0, limit).map((m: any) => ({
        id: m.condition_id || m.id || '',
        question: m.question || '',
        slug: m.slug || '',
        conditionId: m.condition_id || '',
        endDate: m.end_date_iso || '',
        liquidity: parseFloat(m.liquidity || '0'),
        volume: parseFloat(m.volume || '0'),
        outcomes: m.outcomes || [],
      }));
    } catch (error: any) {
      console.error('获取市场列表失败:', error);
      return [];
    }
  }

  // 获取单个市场信息
  async getMarket(marketId: string): Promise<Market> {
    try {
      const market = await this.client.getMarket(marketId);
      return {
        id: market.condition_id || market.id || marketId,
        question: market.question || '',
        slug: market.slug || '',
        conditionId: market.condition_id || marketId,
        endDate: market.end_date_iso || '',
        liquidity: parseFloat(market.liquidity || '0'),
        volume: parseFloat(market.volume || '0'),
        outcomes: market.outcomes || [],
      };
    } catch (error: any) {
      console.error('获取市场失败:', error);
      throw error;
    }
  }

  // 获取订单簿
  async getOrderbook(tokenId: string): Promise<any> {
    try {
      console.log(`[PolymarketClient] 获取订单簿: tokenId=${tokenId.substring(0, 20)}...`);
      const orderbook = await this.client.getOrderBook(tokenId);
      console.log(`[PolymarketClient] ✅ 订单簿获取成功`);
      return orderbook;
    } catch (error: any) {
      console.error(`[PolymarketClient] ❌ 获取订单簿失败:`, error.message || error);
      throw error;
    }
  }

  // 获取价格数据
  async getPriceData(tokenId: string): Promise<PriceData> {
    try {
      const orderbook = await this.getOrderbook(tokenId);
      const bids = orderbook.bids || [];
      const asks = orderbook.asks || [];
      
      const bestBid = bids.length > 0 ? parseFloat(bids[0].price || '0') : 0;
      const bestAsk = asks.length > 0 ? parseFloat(asks[0].price || '0') : 0;
      const midPrice = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : (bestBid || bestAsk);

      return {
        tokenId,
        price: midPrice,
        timestamp: new Date(),
        volume24h: 0,
        change24h: 0,
      };
    } catch (error: any) {
      console.error('获取价格数据失败:', error);
      throw error;
    }
  }

  // 下单
  async placeOrder(order: {
    tokenId: string;
    side: 'BUY' | 'SELL';
    price: number;
    size: number;
    orderType?: 'GTC' | 'FOK' | 'GTD';
    negRisk?: boolean;
  }): Promise<Order> {
    try {
      console.log(`[PolymarketClient] 📝 下单: ${order.side} ${order.size} @ ${order.price} (${order.orderType || 'GTC'})`);
      const side = order.side === 'BUY' ? Side.BUY : Side.SELL;
      const orderType = this.mapOrderType(order.orderType || 'GTC');
      
      // 创建订单
      const userOrder: UserOrder = {
        tokenID: order.tokenId,
        price: order.price,
        size: order.size,
        side,
      };

      // 创建签名订单
      console.log(`[PolymarketClient] 🔐 创建签名订单...`);
      const signedOrder = await this.client.createOrder(userOrder);
      console.log(`[PolymarketClient] ✅ 订单签名成功`);
      
      // 提交订单
      console.log(`[PolymarketClient] 📤 提交订单...`);
      const result = await this.client.postOrder(signedOrder, orderType);
      console.log(`[PolymarketClient] ✅ 订单提交成功: orderID=${result.orderID}, success=${result.success}`);

      // 转换为我们的 Order 类型
      return {
        id: result.orderID || '',
        accountId: '', // 需要从配置中获取
        tokenId: order.tokenId,
        side: order.side,
        price: order.price,
        size: order.size,
        status: result.success ? 'PENDING' : 'REJECTED',
        orderType: order.orderType || 'GTC',
        createdAt: new Date(),
      };
    } catch (error: any) {
      console.error(`[PolymarketClient] ❌ 下单失败:`, error.message || error);
      throw error;
    }
  }

  // 取消订单
  async cancelOrder(orderId: string): Promise<void> {
    try {
      console.log(`[PolymarketClient] 🗑️  取消订单: orderID=${orderId}`);
      await this.client.cancelOrder({ orderID: orderId });
      console.log(`[PolymarketClient] ✅ 订单取消成功`);
    } catch (error: any) {
      console.error(`[PolymarketClient] ❌ 取消订单失败:`, error.message || error);
      throw error;
    }
  }

  // 获取活跃订单
  async getActiveOrders(): Promise<Order[]> {
    try {
      console.log(`[PolymarketClient] 📋 获取活跃订单...`);
      const orders = await this.client.getOpenOrders();
      console.log(`[PolymarketClient] ✅ 获取到 ${orders?.length || 0} 个活跃订单`);
      return (orders || []).map((order: OpenOrder) => ({
        id: order.id || '',
        accountId: '',
        tokenId: order.asset_id || '',
        side: order.side === 'BUY' ? 'BUY' : 'SELL',
        price: parseFloat(order.price || '0'),
        size: parseFloat(order.original_size || '0'),
        status: this.mapOrderStatus(order.status),
        orderType: this.mapOrderTypeReverse((order as any).order_type),
        createdAt: order.created_at ? new Date(order.created_at * 1000) : new Date(),
      }));
    } catch (error: any) {
      console.error(`[PolymarketClient] ❌ 获取活跃订单失败:`, error.message || error);
      throw error;
    }
  }

  // 获取订单详情
  async getOrder(orderId: string): Promise<Order> {
    try {
      const order = await this.client.getOrder(orderId);
      return {
        id: order.id || orderId,
        accountId: '',
        tokenId: order.asset_id || '',
        side: order.side === 'BUY' ? 'BUY' : 'SELL',
        price: parseFloat(order.price || '0'),
        size: parseFloat(order.original_size || '0'),
        status: this.mapOrderStatus(order.status),
        orderType: this.mapOrderTypeReverse((order as any).order_type),
        createdAt: order.created_at ? new Date(order.created_at * 1000) : new Date(),
      };
    } catch (error: any) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  }

  // 获取账户余额
  async getBalance(): Promise<{ available: number; locked: number }> {
    try {
      console.log(`[PolymarketClient] 💰 获取账户余额...`);
      const balance = await this.client.getBalanceAllowance();
      const result = {
        available: parseFloat((balance as any).available || (balance as any).balance || '0'),
        locked: parseFloat((balance as any).locked || '0'),
      };
      console.log(`[PolymarketClient] ✅ 余额: available=${result.available}, locked=${result.locked}`);
      return result;
    } catch (error: any) {
      console.error(`[PolymarketClient] ❌ 获取余额失败:`, error.message || error);
      throw error;
    }
  }

  // 获取交易历史
  async getTrades(params?: {
    limit?: number;
    offset?: number;
    tokenId?: string;
  }): Promise<any[]> {
    try {
      const tradeParams: TradeParams = {
        asset_id: params?.tokenId,
      };
      const trades = await this.client.getTrades(tradeParams);
      // 如果返回的是数组，直接返回；否则可能是分页结果
      const result = Array.isArray(trades) ? trades : (trades as any).data || [];
      const limit = params?.limit;
      return limit ? result.slice(0, limit) : result;
    } catch (error: any) {
      console.error('获取交易历史失败:', error);
      throw error;
    }
  }

  // 辅助方法：映射订单类型
  private mapOrderType(type: 'GTC' | 'FOK' | 'GTD' | 'IOC'): OrderType {
    switch (type) {
      case 'GTC':
        return OrderType.GTC;
      case 'FOK':
        return OrderType.FOK;
      case 'GTD':
        return OrderType.GTD;
      case 'IOC':
        // IOC 不支持，映射为 GTC
        return OrderType.GTC;
      default:
        return OrderType.GTC;
    }
  }

  // 辅助方法：反向映射订单类型
  private mapOrderTypeReverse(type: string): 'GTC' | 'IOC' | 'FOK' | 'GTD' {
    switch (type?.toUpperCase()) {
      case 'GTC':
        return 'GTC';
      case 'FOK':
        return 'FOK';
      case 'GTD':
        return 'GTD';
      case 'IOC':
        return 'IOC';
      default:
        return 'GTC';
    }
  }

  // 辅助方法：映射订单状态
  private mapOrderStatus(status: string): 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED' {
    const upperStatus = status?.toUpperCase() || '';
    if (upperStatus.includes('FILLED') || upperStatus === 'FILLED') {
      return 'FILLED';
    }
    if (upperStatus.includes('CANCELLED') || upperStatus === 'CANCELLED') {
      return 'CANCELLED';
    }
    if (upperStatus.includes('REJECTED') || upperStatus === 'REJECTED') {
      return 'REJECTED';
    }
    return 'PENDING';
  }
}
