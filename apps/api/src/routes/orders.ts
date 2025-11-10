import { Router } from 'express';
import { AccountService } from '../services/account-service';

export const ordersRouter = Router();

// 获取活跃订单
ordersRouter.get('/', async (req, res) => {
  try {
    const { accountId } = req.query;
    
    if (!accountId) {
      return res.status(400).json({ error: '需要 accountId 参数' });
    }

    const client = AccountService.getClient(accountId as string);
    if (!client) {
      return res.status(404).json({ error: '账户不存在' });
    }

    const orders = await client.getActiveOrders();
    res.json(orders);
  } catch (error) {
    console.error('获取订单失败:', error);
    res.status(500).json({ error: '获取订单失败' });
  }
});

// 获取单个订单
ordersRouter.get('/:orderId', async (req, res) => {
  try {
    const { accountId } = req.query;
    
    if (!accountId) {
      return res.status(400).json({ error: '需要 accountId 参数' });
    }

    const client = AccountService.getClient(accountId as string);
    if (!client) {
      return res.status(404).json({ error: '账户不存在' });
    }

    const order = await client.getOrder(req.params.orderId);
    res.json(order);
  } catch (error) {
    console.error('获取订单失败:', error);
    res.status(500).json({ error: '获取订单失败' });
  }
});

// 下单
ordersRouter.post('/', async (req, res) => {
  try {
    const { accountId, tokenId, side, price, size, orderType } = req.body;
    console.log(`[Orders] 📝 下单请求: accountId=${accountId}, ${side} ${size} @ ${price}`);
    
    if (!accountId || !tokenId || !side || price === undefined || size === undefined) {
      return res.status(400).json({ error: '缺少必需字段' });
    }

    const client = AccountService.getClient(accountId);
    if (!client) {
      console.warn(`[Orders] ⚠️  账户不存在: accountId=${accountId}`);
      return res.status(404).json({ error: '账户不存在' });
    }

    const order = await client.placeOrder({
      tokenId,
      side,
      price: parseFloat(price),
      size: parseFloat(size),
      orderType: orderType || 'GTC',
    });

    console.log(`[Orders] ✅ 下单成功: orderId=${order.id}`);
    res.status(201).json(order);
  } catch (error: any) {
    console.error(`[Orders] ❌ 下单失败:`, error.message || error);
    res.status(500).json({ error: error.message || '下单失败' });
  }
});

// 取消订单
ordersRouter.delete('/:orderId', async (req, res) => {
  try {
    const { accountId } = req.query;
    
    if (!accountId) {
      return res.status(400).json({ error: '需要 accountId 参数' });
    }

    const client = AccountService.getClient(accountId as string);
    if (!client) {
      return res.status(404).json({ error: '账户不存在' });
    }

    await client.cancelOrder(req.params.orderId);
    res.json({ success: true });
  } catch (error) {
    console.error('取消订单失败:', error);
    res.status(500).json({ error: '取消订单失败' });
  }
});

