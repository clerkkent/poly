# 迁移到官方 CLOB 客户端指南

## 概述

系统已更新为使用官方的 `@polymarket/clob-client` 和 `@ethersproject/wallet` 包，替代了之前的自定义实现。

## 主要变化

### 1. 账户配置变化

**之前**（使用 Builder API 凭证）：
- API Key
- Secret
- Passphrase

**现在**（使用官方 CLOB 客户端）：
- **私钥 (Private Key)**: 从 Magic Link 或 Web3 钱包导出的私钥
- **签名类型 (Signature Type)**: 可选，1=Email/Magic, 2=Browser Wallet, 留空=EOA
- **代理地址 (Funder Address)**: 可选，Polymarket 代理地址（如果使用代理）

### 2. 如何获取私钥

#### 从 Magic Link 导出私钥
1. 访问 https://reveal.magic.link/polymarket
2. 登录你的账户
3. 导出私钥

#### 从 Web3 钱包导出私钥
- **MetaMask**: 设置 → 安全与隐私 → 显示私钥
- **Coinbase Wallet**: 设置 → 显示私钥

### 3. 如何获取代理地址

如果你使用 Email/Magic 或浏览器钱包登录：
1. 登录 Polymarket 网站
2. 查看个人资料图片下方的地址
3. 这就是你的代理地址（Funder Address）

### 4. 配置账户

在"账户管理"页面添加账户时：

**直接使用 EOA（如果你直接使用钱包）**：
- 私钥: 你的钱包私钥
- 签名类型: 留空
- 代理地址: 留空

**使用 Email/Magic 账户**：
- 私钥: 从 Magic Link 导出的私钥
- 签名类型: `1`
- 代理地址: 你的 Polymarket 代理地址

**使用浏览器钱包（MetaMask/Coinbase Wallet）**：
- 私钥: 从钱包导出的私钥
- 签名类型: `2`
- 代理地址: 你的 Polymarket 代理地址

## API 变化

### 订单类型

官方客户端支持的订单类型：
- **GTC** (Good-Till-Cancelled): 一直有效直到取消
- **FOK** (Fill-Or-Kill): 全部成交或取消
- **GTD** (Good-Till-Date): 在指定日期前有效

注意：不再支持 IOC (Immediate-Or-Cancel) 类型。

### 方法变化

大部分方法保持不变，但内部实现已切换到官方客户端：
- `getOrderbook()` - 获取订单簿
- `placeOrder()` - 下单
- `cancelOrder()` - 取消订单
- `getActiveOrders()` - 获取活跃订单
- `getOrder()` - 获取订单详情
- `getBalance()` - 获取余额
- `getTrades()` - 获取交易历史

## 优势

使用官方客户端的好处：
1. ✅ 官方维护，更稳定可靠
2. ✅ 自动处理签名和认证
3. ✅ 更好的类型支持
4. ✅ 与 Polymarket 最新功能同步
5. ✅ 更好的错误处理

## 注意事项

1. **私钥安全**: 私钥非常敏感，请妥善保管，不要分享给任何人
2. **代理地址**: 如果使用代理钱包，必须提供正确的代理地址
3. **签名类型**: 根据你的登录方式选择正确的签名类型
4. **网络连接**: 如果遇到连接问题，请配置代理（见 SETUP.md）

## 故障排除

### 错误：invalid signature
- 检查私钥是否正确
- 检查签名类型是否匹配你的登录方式
- 检查代理地址是否正确（如果使用代理）

### 错误：not enough balance / allowance
- 确保账户有足够的 USDC
- 如果使用 MetaMask/Web3 钱包，需要设置代币授权

### 连接超时
- 配置代理（见 SETUP.md 中的故障排除部分）

## 参考文档

- [Polymarket 官方文档](https://docs.polymarket.com/quickstart/orders/first-order)
- [CLOB 客户端文档](https://docs.polymarket.com/developers/CLOB/clients)

