import { Router } from 'express';
import { AccountService } from '../services/account-service';
import { MarketService } from '../services/market-service';

export const marketsRouter = Router();

// 获取市场列表（行情数据与 chainId 无关）
marketsRouter.get('/', async (req, res) => {
  try {
    const { accountId, limit, offset, active } = req.query;
    
    // 如果提供了 accountId，使用账户客户端
    if (accountId) {
      const client = AccountService.getClient(accountId as string);
      if (!client) {
        return res.status(404).json({ error: '账户不存在' });
      }

      const markets = await client.getMarkets({
        limit: limit ? parseInt(limit as string) : 5,
        offset: offset ? parseInt(offset as string) : 0,
        active: active === 'true',
      });

      return res.json(markets);
    }

    // 默认使用只读客户端（行情数据与 chainId 无关）
    console.log(`[Markets] 📊 获取市场列表（只读模式）`);
    const markets = await MarketService.getMarkets({
      limit: limit ? parseInt(limit as string) : 5,
      offset: offset ? parseInt(offset as string) : 0,
      active: active === 'true',
    });
    res.json(markets);
  } catch (error: any) {
    console.error(`[Markets] ❌ 获取市场列表失败:`, error.message || error);
    res.status(500).json({ error: error.message || '获取市场列表失败' });
  }
});

// 获取单个市场（行情数据与 chainId 无关）
marketsRouter.get('/:marketId', async (req, res) => {
  try {
    const { accountId } = req.query;
    
    // 如果提供了 accountId，使用账户客户端
    if (accountId) {
      const client = AccountService.getClient(accountId as string);
      if (!client) {
        return res.status(404).json({ error: '账户不存在' });
      }

      const market = await client.getMarket(req.params.marketId);
      return res.json(market);
    }

    // 默认使用只读客户端（行情数据与 chainId 无关）
    console.log(`[Markets] 📊 获取市场（只读模式）: marketId=${req.params.marketId}`);
    const market = await MarketService.getMarket(req.params.marketId);
    res.json(market);
  } catch (error: any) {
    console.error(`[Markets] ❌ 获取市场失败:`, error.message || error);
    res.status(500).json({ error: error.message || '获取市场失败' });
  }
});

// 获取订单簿（行情数据与 chainId 无关）
marketsRouter.get('/:marketId/orderbook', async (req, res) => {
  try {
    const { accountId, tokenId } = req.query;
    
    if (!tokenId) {
      return res.status(400).json({ error: '需要 tokenId 参数' });
    }
    
    // 如果提供了 accountId，使用账户客户端
    if (accountId) {
      const client = AccountService.getClient(accountId as string);
      if (!client) {
        return res.status(404).json({ error: '账户不存在' });
      }

      const orderbook = await client.getOrderbook(tokenId as string);
      return res.json(orderbook);
    }

    // 默认使用只读客户端（行情数据与 chainId 无关）
    const orderbook = await MarketService.getOrderbook(tokenId as string);
    res.json(orderbook);
  } catch (error: any) {
    console.error(`[Markets] ❌ 获取订单簿失败:`, error.message || error);
    res.status(500).json({ error: error.message || '获取订单簿失败' });
  }
});

