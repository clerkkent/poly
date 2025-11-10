# Polymarket 多账户量化交易系统

基于 Polymarket Builders Program 的完整量化交易系统，支持多账户管理、行情观测、报警和自动交易。

## 项目结构

```
polymarket-quant-system/
├── apps/
│   ├── web/          # Next.js 前端应用
│   └── api/          # 后端 API 服务
├── packages/
│   ├── shared/       # 共享类型和工具
│   ├── polymarket/   # Polymarket API 客户端
│   └── strategies/   # 交易策略库
└── pnpm-workspace.yaml
```

## 技术栈

- **前端**: Next.js 14, React 18, Ant Design 5, SCSS
- **后端**: Node.js, Express, TypeScript
- **包管理**: pnpm (monorepo)
- **API**: Polymarket Builders Program API

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制 `.env.example` 到 `.env` 并填写你的 API 凭证：

```bash
cp .env.example .env
```

### 启动开发服务器

**推荐方式（3个终端）：**

```bash
# 终端 1: 监听 packages 目录的修改（热更新）
pnpm watch

# 终端 2: 启动后端 API
pnpm api

# 终端 3: 启动前端
pnpm dev
```

或者使用 `dev:packages` 命令（与 `watch` 相同）：

```bash
pnpm dev:packages
```

**说明：**
- `pnpm watch` 会同时监听所有 packages（shared, polymarket, strategies）的修改
- 修改 packages 下的代码后，会自动重新编译到 `dist` 目录
- API 和 Web 应用会自动使用最新的编译结果（API 使用 `tsx watch`，Web 使用 Next.js 的 HMR）

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 功能特性

- ✅ 多账户管理
- ✅ 实时行情观测
- ✅ 价格报警系统
- ✅ 自动下单交易
- ✅ 可扩展策略系统
- ✅ 交易历史记录
- ✅ 账户余额管理

## 许可证

MIT

