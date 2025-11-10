import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { accountsRouter } from './routes/accounts';
import { marketsRouter } from './routes/markets';
import { ordersRouter } from './routes/orders';
import { strategiesRouter } from './routes/strategies';
import { alertsRouter } from './routes/alerts';
import { tradesRouter } from './routes/trades';
import { priceRouter } from './routes/price';
import { networkRouter } from './routes/network';
import { createWebSocketServer } from './websocket';
import { testPolymarketConnection } from './utils/network-test';
import { requestLogger, errorLogger } from './middleware/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 请求日志中间件
app.use(requestLogger);

// 路由
app.use('/api/accounts', accountsRouter);
app.use('/api/markets', marketsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/strategies', strategiesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/price', priceRouter);
app.use('/api/network', networkRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 处理
app.use((req, res) => {
  console.warn(`[404] 未找到路由: ${req.method} ${req.path}`);
  res.status(404).json({ error: '未找到路由' });
});

// 错误处理中间件（必须在最后）
app.use(errorLogger);

const server = app.listen(PORT, async () => {
  console.log(`🚀 API 服务器运行在 http://localhost:${PORT}`);
  
  // 测试 Polymarket 连接
  console.log('\n🔍 测试 Polymarket API 连接...');
  const proxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.PROXY;
  const result = await testPolymarketConnection(proxy);
  
  if (result.success) {
    console.log(`✅ ${result.message} (延迟: ${result.latency}ms)`);
  } else {
    console.warn(`⚠️  ${result.message}`);
    if (proxy) {
      console.warn(`   当前使用代理: ${proxy}`);
    } else {
      console.warn(`   提示: 如果无法连接，请在 .env 文件中设置 HTTP_PROXY 或 HTTPS_PROXY`);
      console.warn(`   例如: HTTP_PROXY=http://127.0.0.1:7890`);
    }
  }
  console.log('');
});

// WebSocket 服务器
createWebSocketServer(server);

