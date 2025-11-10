import { Router } from 'express';
import { AccountService } from '../services/account-service';
import { MarketService } from '../services/market-service';
import { AlertService } from '../services/alert-service';

export const priceRouter = Router();

// 获取价格数据（行情数据与 chainId 无关）
priceRouter.get('/:tokenId', async (req, res) => {
  try {
    const { accountId } = req.query;
    
    let priceData;
    
    if (accountId) {
      // 如果提供了 accountId，使用账户客户端
      const client = AccountService.getClient(accountId as string);
      if (!client) {
        return res.status(404).json({ error: '账户不存在' });
      }
      priceData = await client.getPriceData(req.params.tokenId);
      
      // 更新报警检查（仅在有账户时）
      AlertService.updatePriceCache(req.params.tokenId, priceData);
    } else {
      // 默认使用只读客户端（行情数据与 chainId 无关）
      priceData = await MarketService.getPriceData(req.params.tokenId);
    }

    res.json(priceData);
  } catch (error: any) {
    console.error(`[Price] ❌ 获取价格数据失败:`, error.message || error);
    res.status(500).json({ error: error.message || '获取价格数据失败' });
  }
});

