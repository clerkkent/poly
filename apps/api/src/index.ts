import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { bootstrap } from 'global-agent';
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

// 配置全局代理（在应用启动时初始化）
// 这样所有 HTTP/HTTPS 请求（包括 ClobClient）都会使用代理
const proxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.PROXY;
if (proxy) {
  process.env.GLOBAL_AGENT_HTTP_PROXY = proxy;
  process.env.GLOBAL_AGENT_HTTPS_PROXY = proxy;
  try {
    bootstrap();
    console.log(`🌐 已启用全局代理: ${proxy}`);
  } catch (error: any) {
    // 如果已经初始化过，忽略错误
    if (!error.message?.includes('already')) {
      console.warn(`⚠️  代理初始化警告:`, error.message);
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 配置
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // 允许的源列表
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
    
    // 从环境变量读取额外的允许源（用逗号分隔）
    const additionalOrigins = process.env.CORS_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const allAllowedOrigins = [...allowedOrigins, ...additionalOrigins];
    
    // 开发环境：允许所有源（包括 undefined，如 Postman 等工具）
    // 生产环境：只允许指定的源
    if (!origin || allAllowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('不允许的 CORS 源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};

app.use(cors(corsOptions));
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

