import { Router } from 'express';
import { AccountService } from '../services/account-service';

export const tradesRouter = Router();

// 获取交易历史
tradesRouter.get('/', async (req, res) => {
  try {
    const { accountId, limit, offset, tokenId } = req.query;
    
    if (!accountId) {
      return res.status(400).json({ error: '需要 accountId 参数' });
    }

    const client = AccountService.getClient(accountId as string);
    if (!client) {
      return res.status(404).json({ error: '账户不存在' });
    }

    const trades = await client.getTrades({
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
      tokenId: tokenId as string,
    });

    res.json(trades);
  } catch (error) {
    console.error('获取交易历史失败:', error);
    res.status(500).json({ error: '获取交易历史失败' });
  }
});

