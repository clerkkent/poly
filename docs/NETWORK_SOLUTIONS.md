# 网络访问解决方案

如果本地网络无法直接访问 `https://clob.polymarket.com`，可以使用以下方案解决。

## 方案对比

| 方案 | 成本 | 难度 | 稳定性 | 推荐度 |
|------|------|------|--------|--------|
| 本地代理工具 | 免费/低 | ⭐ 简单 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 云服务器代理 | 中等 | ⭐⭐ 中等 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 代理服务商 | 低-中 | ⭐ 简单 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 内网穿透 | 免费/低 | ⭐⭐ 中等 | ⭐⭐⭐ | ⭐⭐⭐ |

---

## 方案 1：使用本地代理工具（推荐）

### 1.1 使用 Clash/V2Ray 等代理工具

**优点**：
- 配置简单
- 通常已有现成的代理服务
- 免费或低成本

**步骤**：

1. **安装代理工具**（如果还没有）：
   - Clash for Windows: https://github.com/Fndroid/clash_for_windows_pkg
   - V2Ray: https://www.v2ray.com/
   - 或其他你正在使用的代理工具

2. **启动代理服务**，通常会在本地监听：
   - HTTP 代理：`http://127.0.0.1:7890`
   - SOCKS5 代理：`socks5://127.0.0.1:7890`

3. **配置项目环境变量**：

   在项目根目录的 `.env` 文件中添加：

   ```env
   # HTTP/HTTPS 代理（根据你的代理工具配置）
   HTTP_PROXY=http://127.0.0.1:7890
   HTTPS_PROXY=http://127.0.0.1:7890
   
   # 或者使用 SOCKS5 代理（需要转换为 HTTP 代理，或使用支持 SOCKS5 的工具）
   # HTTP_PROXY=socks5://127.0.0.1:7890
   # HTTPS_PROXY=socks5://127.0.0.1:7890
   ```

4. **重启后端服务**：

   ```bash
   pnpm api
   ```

5. **验证连接**：

   访问 `http://localhost:3001/api/network/test` 查看连接状态

### 1.2 使用系统代理设置

如果你的系统已经配置了全局代理，可以：

1. **获取系统代理地址**（Windows）：
   ```powershell
   # 查看系统代理设置
   netsh winhttp show proxy
   ```

2. **在 .env 中使用系统代理地址**

---

## 方案 2：使用云服务器搭建代理（最稳定）

如果你有云服务器（阿里云、腾讯云、AWS 等），可以搭建自己的代理服务器。

### 2.1 使用 Squid 搭建 HTTP 代理

**服务器端（Linux）**：

```bash
# 1. 安装 Squid
sudo apt-get update
sudo apt-get install -y squid

# 2. 配置 Squid（编辑 /etc/squid/squid.conf）
sudo nano /etc/squid/squid.conf

# 添加以下配置：
http_port 3128
http_access allow all
forwarded_for off
via off

# 3. 启动 Squid
sudo systemctl start squid
sudo systemctl enable squid

# 4. 开放防火墙端口（如果使用云服务器）
sudo ufw allow 3128/tcp
```

**本地配置**：

在 `.env` 文件中：

```env
HTTP_PROXY=http://你的服务器IP:3128
HTTPS_PROXY=http://你的服务器IP:3128
```

### 2.2 使用 Shadowsocks 搭建 SOCKS5 代理

**服务器端**：

```bash
# 1. 安装 Shadowsocks
pip install shadowsocks

# 2. 创建配置文件 /etc/shadowsocks.json
sudo nano /etc/shadowsocks.json

# 内容：
{
    "server": "0.0.0.0",
    "server_port": 8388,
    "password": "你的密码",
    "method": "aes-256-cfb"
}

# 3. 启动服务
sudo ssserver -c /etc/shadowsocks.json -d start
```

**本地配置**：

需要将 SOCKS5 转换为 HTTP 代理，可以使用 `privoxy` 或直接使用支持 SOCKS5 的代理工具。

### 2.3 使用 Nginx 反向代理（推荐用于生产环境）

**服务器端**：

```bash
# 1. 安装 Nginx
sudo apt-get install -y nginx

# 2. 配置 Nginx（编辑 /etc/nginx/sites-available/default）
sudo nano /etc/nginx/sites-available/default

# 添加以下配置：
server {
    listen 8080;
    location / {
        proxy_pass https://clob.polymarket.com;
        proxy_set_header Host clob.polymarket.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_ssl_server_name on;
    }
}

# 3. 重启 Nginx
sudo systemctl restart nginx
```

**本地配置**：

修改 `packages/polymarket/src/client.ts` 中的 `baseURL`：

```typescript
const host = config.baseURL || 'https://你的服务器IP:8080';
```

---

## 方案 3：使用代理服务商

### 3.1 购买代理服务

一些代理服务商提供 HTTP/HTTPS 代理服务：

- **Bright Data (原 Luminati)**: https://brightdata.com/
- **Smartproxy**: https://smartproxy.com/
- **Oxylabs**: https://oxylabs.io/

**配置示例**：

```env
HTTP_PROXY=http://用户名:密码@代理服务器:端口
HTTPS_PROXY=http://用户名:密码@代理服务器:端口
```

### 3.2 使用免费代理（不推荐用于生产）

⚠️ **警告**：免费代理通常不稳定，不建议用于生产环境。

---

## 方案 4：使用内网穿透（临时方案）

如果需要临时访问，可以使用内网穿透工具将服务器端口映射到本地。

### 4.1 使用 ngrok

```bash
# 1. 安装 ngrok
# 下载：https://ngrok.com/download

# 2. 启动隧道（将本地 3001 端口映射到公网）
ngrok http 3001

# 3. 使用返回的公网地址访问
```

### 4.2 使用 frp

**服务器端**：

```bash
# 1. 下载 frp
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
tar -xzf frp_0.52.3_linux_amd64.tar.gz

# 2. 配置 frps.ini
[common]
bind_port = 7000

# 3. 启动服务端
./frps -c frps.ini
```

**本地端**：

```bash
# 1. 配置 frpc.ini
[common]
server_addr = 你的服务器IP
server_port = 7000

[polymarket]
type = tcp
local_ip = 127.0.0.1
local_port = 3001
remote_port = 3001

# 2. 启动客户端
./frpc -c frpc.ini
```

---

## 测试连接

配置完成后，使用以下方法测试：

### 方法 1：使用 API 测试接口

```bash
curl http://localhost:3001/api/network/test
```

### 方法 2：使用 curl 直接测试

```bash
# 不使用代理
curl -v https://clob.polymarket.com

# 使用代理
curl -v --proxy http://127.0.0.1:7890 https://clob.polymarket.com
```

### 方法 3：查看后端启动日志

启动后端服务时，会自动测试连接并显示结果：

```bash
pnpm api
```

应该看到：

```
🌐 已启用全局代理: http://127.0.0.1:7890
🔍 测试 Polymarket API 连接...
✅ 连接成功 (状态码: 200) (延迟: 150ms)
```

---

## 常见问题

### Q1: 代理配置后仍然无法连接？

**检查清单**：
1. ✅ 代理服务是否正常运行？
2. ✅ 代理地址和端口是否正确？
3. ✅ 防火墙是否允许连接？
4. ✅ `.env` 文件是否在项目根目录？
5. ✅ 是否重启了后端服务？

### Q2: 如何确认代理是否生效？

查看后端启动日志，应该看到：
```
🌐 已启用全局代理: http://127.0.0.1:7890
```

### Q3: 使用云服务器代理需要多少成本？

- **轻量应用服务器**（阿里云/腾讯云）：约 24-50 元/月
- **VPS**（Vultr/DigitalOcean）：约 $5-10/月
- **带宽费用**：通常包含在服务器费用中

### Q4: 代理会影响性能吗？

- **本地代理**：延迟增加 10-50ms（几乎无影响）
- **云服务器代理**：延迟增加 50-200ms（取决于服务器位置）
- **代理服务商**：延迟增加 20-100ms

### Q5: 生产环境推荐哪种方案？

**推荐顺序**：
1. **云服务器 + Nginx 反向代理**（最稳定，可控制）
2. **代理服务商**（省心，但需要付费）
3. **本地代理工具**（适合开发环境）

---

## 推荐配置（开发环境）

对于开发环境，推荐使用**方案 1（本地代理工具）**：

1. 使用你现有的 Clash/V2Ray 等工具
2. 在 `.env` 中配置代理地址
3. 重启服务即可

**示例 `.env` 配置**：

```env
# 后端服务端口
PORT=3001

# 前端 API 地址
NEXT_PUBLIC_API_URL=http://localhost:3001

# 代理配置（根据你的代理工具调整）
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
# 或者
# PROXY=http://127.0.0.1:7890
```

---

## 推荐配置（生产环境）

对于生产环境，推荐使用**方案 2（云服务器代理）**：

1. 购买一台海外云服务器（推荐：香港、新加坡、日本）
2. 使用 Nginx 搭建反向代理
3. 修改 `baseURL` 指向你的代理服务器
4. 配置 SSL 证书（可选，但推荐）

这样可以：
- ✅ 保证稳定性和速度
- ✅ 完全控制代理服务器
- ✅ 可以添加缓存、限流等功能
- ✅ 成本可控（约 50-100 元/月）

---

## 总结

**最快解决方案**：使用现有的本地代理工具（Clash/V2Ray），在 `.env` 中配置即可。

**最稳定解决方案**：使用云服务器搭建反向代理，适合生产环境。

**最省心解决方案**：购买代理服务商的服务，但需要额外成本。

根据你的需求选择合适的方案即可！

