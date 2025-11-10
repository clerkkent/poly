import { Router } from 'express';
import { testPolymarketConnection } from '../utils/network-test';

export const networkRouter = Router();

// 测试网络连接
networkRouter.get('/test', async (req, res) => {
  try {
    const { proxy } = req.query;
    const result = await testPolymarketConnection(proxy as string);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '测试失败',
      error: error.message,
    });
  }
});

