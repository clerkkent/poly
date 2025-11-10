import { ClobClient, SignatureType  } from '@polymarket/clob-client';
import { Wallet } from '@ethersproject/wallet';
import { Market, PriceData } from '@poly/shared';

/**
 * 只读行情监控客户端
 * 用于监控行情，不需要私钥（使用一个临时钱包）
 */
export class PolymarketReadonlyClient {
  private client: ClobClient;
  private chainId: number;

  constructor(chainId: number = 137, baseURL?: string) {
    this.chainId = chainId;
    this.init();
  }

  async init() {
    try {
      const host = 'https://clob.polymarket.com';
      const funder = '0x36A5e909C8FdA4b84105ac0cBCac60b2915932e8'; //This is the address listed below your profile picture when using the Polymarket site.
      const signer = new Wallet("ebc90e0e8d10dc299f85ea05fc202d3a35f6b76c30093639f9a536b1c0684944"); //This is your Private Key. If using email login export from https://reveal.magic.link/polymarket otherwise export from your Web3 Application
      
      
      //In general don't create a new API key, always derive or createOrDerive
      const creds = new ClobClient(host, 137, signer).createOrDeriveApiKey();
      
      //1: Magic/Email Login
      //2: Browser Wallet(Metamask, Coinbase Wallet, etc)
      //0: EOA (If you don't know what this is you're not using it)
      
      const signatureType = 1;

      const clobClient = new ClobClient(host, 137, signer, await creds, signatureType, funder);
      console.log(`[PolymarketReadonlyClient] ✅ 初始化只读客户端成功:`, clobClient);
      this.client = clobClient
    } catch (error) {
      console.error(`[PolymarketReadonlyClient] ❌ 初始化只读客户端失败:`, (error as Error)?.message || error);
    }
    
  }

  // 获取市场列表
  async getMarkets(params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
  }): Promise<Market[]> {
    try {
      console.log(`[PolymarketReadonlyClient] 📊 获取市场列表: chainId=${this.chainId} ${this.client}`);
      const time = await this.client?.getServerTime();
      console.log(`[PolymarketReadonlyClient] ✅ 获取到时间: ${JSON.stringify(time)}`);
      const result = await this.client?.getMarkets();
      const markets = (result as any)?.data || result || [];
      const limit = params?.limit || 50;
      const marketsArray = Array.isArray(markets) ? markets : [];

      console.log(`[PolymarketReadonlyClient] ✅ 获取到 ${this.client} ${JSON.stringify(result)}`);
      return marketsArray.slice(0, limit).map((m: any) => ({
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
      console.error(`[PolymarketReadonlyClient] ❌ 获取市场列表失败:`, error.message || error);
      return [];
    }
  }

  // 获取单个市场信息
  async getMarket(marketId: string): Promise<Market> {
    try {
      console.log(`[PolymarketReadonlyClient] 📊 获取市场: marketId=${marketId}, chainId=${this.chainId}`);
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
      console.error(`[PolymarketReadonlyClient] ❌ 获取市场失败:`, error.message || error);
      throw error;
    }
  }

  // 获取订单簿
  async getOrderbook(tokenId: string): Promise<any> {
    try {
      console.log(`[PolymarketReadonlyClient] 📖 获取订单簿: tokenId=${tokenId.substring(0, 20)}..., chainId=${this.chainId}`);
      const orderbook = await this.client.getOrderBook(tokenId);
      console.log(`[PolymarketReadonlyClient] ✅ 订单簿获取成功`);
      return orderbook;
    } catch (error: any) {
      console.error(`[PolymarketReadonlyClient] ❌ 获取订单簿失败:`, error.message || error);
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
      console.error(`[PolymarketReadonlyClient] ❌ 获取价格数据失败:`, error.message || error);
      throw error;
    }
  }

  getChainId(): number {
    return this.chainId;
  }
}

