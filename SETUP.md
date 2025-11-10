# Polymarket 量化交易系统 - 安装和启动指南

## 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 构建共享包

```bash
pnpm --filter @poly/shared build
pnpm --filter @poly/polymarket build
pnpm --filter @poly/strategies build
```

或者一次性构建所有包：

```bash
pnpm -r build
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件。你可以：

**方法 1：复制示例文件（推荐）**

在 PowerShell 中执行：
```powershell
Copy-Item .env.example .env
```

或者在 Git Bash 或 Linux/Mac 中执行：
```bash
cp .env.example .env
```

**方法 2：手动创建**

在项目根目录创建 `.env` 文件，并填入以下内容（已包含测试凭证）：

```env
# 注意：现在使用官方 CLOB 客户端，不再需要 Builder API 凭证
# 账户配置在 Web 界面中完成（私钥、签名类型、代理地址）

PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
JWT_SECRET=polymarket_quant_system_secret_key_2024

# 代理配置（如果遇到连接超时问题，请配置代理）
# HTTP_PROXY=http://127.0.0.1:7890
# HTTPS_PROXY=http://127.0.0.1:7890
# 或者使用 PROXY 环境变量
# PROXY=http://127.0.0.1:7890

# API 超时和重试配置（可选）
# API_TIMEOUT=30000
# API_RETRIES=3
```

**注意**：
- `.env` 文件已在 `.gitignore` 中，不会被提交到版本控制系统
- 如果遇到 `ETIMEDOUT` 连接超时错误，请配置代理（见下方故障排除部分）

### 4. 启动服务

#### 启动后端 API（终端 1）

```bash
pnpm api
```

后端将在 http://localhost:3001 运行

#### 启动前端（终端 2）

```bash
pnpm dev
```

前端将在 http://localhost:3000 运行

## 功能说明

### 1. 账户管理
- 添加、编辑、删除 Polymarket 账户
- 支持多账户管理
- 查看账户余额

### 2. 行情观测
- 实时查看市场列表
- 价格图表展示
- WebSocket 实时价格更新

### 3. 订单管理
- 手动下单（买入/卖出）
- 查看活跃订单
- 取消订单
- 查看订单历史

### 4. 交易策略
- 做市策略（Market Maker）
- 动量策略（Momentum）
- 可扩展的策略框架
- 策略的启动/停止控制

### 5. 报警系统
- 价格预警（高于/低于阈值）
- 成交量预警
- 实时报警通知

## 项目结构

```
polymarket-quant-system/
├── apps/
│   ├── web/          # Next.js 前端应用
│   └── api/          # Express 后端 API
├── packages/
│   ├── shared/       # 共享类型和工具
│   ├── polymarket/   # Polymarket API 客户端
│   └── strategies/   # 交易策略库
└── scripts/          # 初始化脚本
```

## API 端点

### 账户
- `GET /api/accounts` - 获取所有账户
- `POST /api/accounts` - 创建账户
- `GET /api/accounts/:id` - 获取单个账户
- `PUT /api/accounts/:id` - 更新账户
- `DELETE /api/accounts/:id` - 删除账户
- `GET /api/accounts/:id/balance` - 获取账户余额

### 市场
- `GET /api/markets?accountId=xxx` - 获取市场列表
- `GET /api/markets/:marketId?accountId=xxx` - 获取单个市场
- `GET /api/markets/:marketId/orderbook?accountId=xxx&tokenId=xxx` - 获取订单簿

### 订单
- `GET /api/orders?accountId=xxx` - 获取活跃订单
- `POST /api/orders` - 下单
- `GET /api/orders/:orderId?accountId=xxx` - 获取订单详情
- `DELETE /api/orders/:orderId?accountId=xxx` - 取消订单

### 策略
- `GET /api/strategies?accountId=xxx` - 获取策略列表
- `POST /api/strategies` - 创建策略
- `PUT /api/strategies/:id` - 更新策略
- `DELETE /api/strategies/:id` - 删除策略
- `POST /api/strategies/:id/start` - 启动策略
- `POST /api/strategies/:id/stop` - 停止策略
- `GET /api/strategies/types` - 获取策略类型列表

### 报警
- `GET /api/alerts?accountId=xxx` - 获取报警列表
- `POST /api/alerts` - 创建报警
- `PUT /api/alerts/:id` - 更新报警
- `DELETE /api/alerts/:id` - 删除报警

### 价格
- `GET /api/price/:tokenId?accountId=xxx` - 获取价格数据

## WebSocket

连接到 `ws://localhost:3001`，发送以下消息订阅价格更新：

```json
{
  "type": "subscribe_price",
  "accountId": "your_account_id",
  "tokenId": "token_id",
  "interval": 5000
}
```

## 注意事项

1. 当前使用内存存储，重启后数据会丢失。生产环境建议使用数据库。
2. Polymarket API 的实际端点可能需要根据官方文档调整。
3. 请确保 API 凭证的安全性，不要提交到版本控制系统。
4. 如果遇到网络连接问题，请配置代理（见故障排除部分）。

## 故障排除

### 端口被占用
修改 `.env` 文件中的 `PORT` 和 `NEXT_PUBLIC_API_URL`

### 构建错误
确保所有共享包都已构建：
```bash
pnpm -r build
```

### API 连接超时错误 (ETIMEDOUT)

如果遇到 `connect ETIMEDOUT` 错误，可能是以下原因：

1. **网络问题**：Polymarket API 在某些地区可能无法直接访问
2. **防火墙阻止**：公司或本地防火墙可能阻止了连接
3. **需要代理**：需要使用代理服务器访问

**解决方案**：

#### 方法 1：配置代理（推荐）

在 `.env` 文件中添加代理配置：

```env
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

或者使用 `PROXY` 环境变量：

```env
PROXY=http://127.0.0.1:7890
```

**常见代理端口**：
- Clash: `http://127.0.0.1:7890`
- V2Ray: `http://127.0.0.1:10809`
- Shadowsocks: `http://127.0.0.1:1080`

#### 方法 2：测试网络连接

启动后端服务后，会自动测试 Polymarket API 连接。你也可以手动测试：

```bash
curl http://localhost:3001/api/network/test
```

或者使用代理测试：

```bash
curl "http://localhost:3001/api/network/test?proxy=http://127.0.0.1:7890"
```

#### 方法 3：检查网络环境

1. 检查是否能访问 Polymarket 官网：https://polymarket.com
2. 检查 DNS 解析是否正常
3. 尝试使用 VPN 或代理工具

### API 连接错误
检查：
1. 后端服务是否正常运行
2. 环境变量是否正确配置
3. API 凭证是否有效
4. 是否配置了正确的代理（如果网络受限）

