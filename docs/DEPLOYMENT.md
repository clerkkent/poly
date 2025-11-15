# 服务器部署指南 - 火山引擎

本指南将帮助你在火山引擎服务器上部署整个 Polymarket 量化交易系统。

## 前置要求

- 火山引擎云服务器（推荐配置：2核4G，Ubuntu 20.04/22.04 或 CentOS 7/8）
- 服务器已开放以下端口：
  - 3000（前端，可选，如果使用 Nginx 反向代理）
  - 3001（后端 API）
  - 22（SSH）
- 域名（可选，用于 HTTPS）

---

## 步骤 1：服务器环境准备

### 1.1 连接到服务器

```bash
ssh root@你的服务器IP
```

### 1.2 更新系统

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 1.3 安装 Node.js 和 pnpm

```bash
# 安装 Node.js 18+ (使用 nvm 推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18

# 安装 pnpm
npm install -g pnpm

# 验证安装
node -v  # 应该显示 v18.x.x 或更高
pnpm -v  # 应该显示版本号
```

### 1.4 安装 Git

```bash
# Ubuntu/Debian
sudo apt-get install -y git

# CentOS/RHEL
sudo yum install -y git
```

### 1.5 安装 PM2（进程管理）

```bash
npm install -g pm2
```

### 1.6 安装 Nginx（用于反向代理，可选但推荐）

```bash
# Ubuntu/Debian
sudo apt-get install -y nginx

# CentOS/RHEL
sudo yum install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 步骤 2：部署项目代码

### 2.1 克隆项目

```bash
# 创建项目目录
mkdir -p /opt/polymarket
cd /opt/polymarket

# 克隆项目（替换为你的仓库地址）
git clone https://github.com/your-username/polymarket-quant-system.git .

# 或者如果你已经有代码，可以使用 scp 上传
# 在本地执行：
# scp -r . root@你的服务器IP:/opt/polymarket/
```

### 2.2 安装依赖

```bash
cd /opt/polymarket

# 安装所有依赖
pnpm install

# 构建所有包
pnpm -r build
```

### 2.3 配置环境变量

```bash
# 创建 .env 文件
nano /opt/polymarket/.env
```

添加以下内容（根据你的实际情况修改）：

```env
# 后端服务端口
PORT=3001

# 前端 API 地址（使用服务器 IP 或域名）
NEXT_PUBLIC_API_URL=http://你的服务器IP:3001
# 或者如果使用域名和 Nginx：
# NEXT_PUBLIC_API_URL=https://你的域名

# JWT 密钥（生产环境请使用强随机字符串）
JWT_SECRET=你的强随机密钥_至少32字符

# 代理配置（如果需要访问 Polymarket API）
# HTTP_PROXY=http://127.0.0.1:7890
# HTTPS_PROXY=http://127.0.0.1:7890

# API 超时和重试配置
API_TIMEOUT=30000
API_RETRIES=3

# Node 环境
NODE_ENV=production
```

保存并退出（`Ctrl+X`，然后 `Y`，然后 `Enter`）

---

## 步骤 3：构建项目

### 3.1 构建所有包

```bash
cd /opt/polymarket

# 构建共享包
pnpm --filter @poly/shared build
pnpm --filter @poly/polymarket build
pnpm --filter @poly/strategies build

# 或者一次性构建所有包
pnpm -r build
```

### 3.2 构建前端

```bash
cd /opt/polymarket

# 构建前端
pnpm --filter @poly/web build
```

### 3.3 构建后端

```bash
cd /opt/polymarket

# 构建后端
pnpm --filter @poly/api build
```

---

## 步骤 4：配置 PM2 进程管理

### 4.1 创建 PM2 配置文件

```bash
nano /opt/polymarket/ecosystem.config.js
```

添加以下内容：

```javascript
module.exports = {
  apps: [
    {
      name: 'polymarket-api',
      script: './apps/api/dist/index.js',
      cwd: '/opt/polymarket',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/polymarket/api-error.log',
      out_file: '/var/log/polymarket/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'polymarket-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/opt/polymarket/apps/web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/polymarket/web-error.log',
      out_file: '/var/log/polymarket/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
    },
  ],
};
```

### 4.2 创建日志目录

```bash
sudo mkdir -p /var/log/polymarket
sudo chown -R $USER:$USER /var/log/polymarket
```

### 4.3 启动服务

```bash
cd /opt/polymarket

# 启动所有服务
pm2 start ecosystem.config.js

# 查看服务状态
pm2 status

# 查看日志
pm2 logs

# 保存 PM2 配置（开机自启）
pm2 save
pm2 startup
# 执行上面命令输出的命令（通常是 sudo env PATH=...）
```

---

## 步骤 5：配置 Nginx 反向代理（推荐）

### 5.1 创建 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/polymarket
```

添加以下内容（替换 `你的域名` 为你的实际域名或 IP）：

```nginx
# 前端服务
server {
    listen 80;
    server_name 你的域名;  # 或使用服务器 IP

    # 前端 Next.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 增加超时时间
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 5.2 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/polymarket /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 5.3 配置防火墙

```bash
# Ubuntu (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 步骤 6：配置 HTTPS（可选但推荐）

### 6.1 安装 Certbot

```bash
# Ubuntu/Debian
sudo apt-get install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx
```

### 6.2 获取 SSL 证书

```bash
sudo certbot --nginx -d 你的域名
```

按照提示完成配置。

### 6.3 自动续期

Certbot 会自动配置自动续期，你也可以手动测试：

```bash
sudo certbot renew --dry-run
```

---

## 步骤 7：验证部署

### 7.1 检查服务状态

```bash
# 检查 PM2 服务
pm2 status

# 检查 Nginx
sudo systemctl status nginx

# 检查端口
sudo netstat -tlnp | grep -E '3000|3001|80|443'
```

### 7.2 测试访问

```bash
# 测试后端 API
curl http://localhost:3001/health

# 测试前端（如果直接访问）
curl http://localhost:3000

# 测试通过 Nginx（如果配置了）
curl http://你的域名/health
```

### 7.3 查看日志

```bash
# PM2 日志
pm2 logs

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 应用日志
tail -f /var/log/polymarket/api-out.log
tail -f /var/log/polymarket/web-out.log
```

---

## 步骤 8：更新部署

当需要更新代码时：

```bash
cd /opt/polymarket

# 拉取最新代码
git pull

# 重新安装依赖（如果有新依赖）
pnpm install

# 重新构建
pnpm -r build

# 重启服务
pm2 restart all

# 或者重启特定服务
pm2 restart polymarket-api
pm2 restart polymarket-web
```

---

## 常见问题

### Q1: 服务无法启动？

**检查清单**：
1. ✅ 检查端口是否被占用：`sudo netstat -tlnp | grep 3001`
2. ✅ 检查环境变量是否正确：`cat .env`
3. ✅ 查看 PM2 日志：`pm2 logs`
4. ✅ 检查文件权限：`ls -la /opt/polymarket`

### Q2: 无法访问前端？

**检查清单**：
1. ✅ 检查防火墙是否开放端口
2. ✅ 检查 Nginx 配置是否正确：`sudo nginx -t`
3. ✅ 检查前端是否正常启动：`pm2 status`
4. ✅ 查看前端日志：`pm2 logs polymarket-web`

### Q3: API 请求失败？

**检查清单**：
1. ✅ 检查后端服务是否运行：`pm2 status`
2. ✅ 检查 CORS 配置是否正确
3. ✅ 检查 `.env` 中的 `NEXT_PUBLIC_API_URL` 是否正确
4. ✅ 查看后端日志：`pm2 logs polymarket-api`

### Q4: 内存不足？

如果服务器内存较小，可以：

```bash
# 限制 Node.js 内存使用
# 在 ecosystem.config.js 中已经设置了 max_memory_restart: '500M'

# 或者手动设置
export NODE_OPTIONS="--max-old-space-size=512"
```

### Q5: 如何查看实时日志？

```bash
# 查看所有服务日志
pm2 logs

# 查看特定服务日志
pm2 logs polymarket-api
pm2 logs polymarket-web

# 查看最近 100 行
pm2 logs --lines 100
```

### Q6: 如何停止服务？

```bash
# 停止所有服务
pm2 stop all

# 停止特定服务
pm2 stop polymarket-api

# 删除服务（从 PM2 中移除）
pm2 delete all
```

---

## 性能优化建议

### 1. 使用 Nginx 缓存

在 Nginx 配置中添加缓存：

```nginx
# 在 server 块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m;

# 在 location /api 中添加
proxy_cache my_cache;
proxy_cache_valid 200 302 10m;
proxy_cache_valid 404 1m;
```

### 2. 启用 Gzip 压缩

在 Nginx 配置中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 3. 使用 CDN（可选）

如果前端静态资源较大，可以考虑使用 CDN。

---

## 安全建议

1. **更改默认 SSH 端口**
2. **使用密钥认证而非密码**
3. **定期更新系统和依赖**
4. **配置防火墙规则**
5. **使用强密码和 JWT 密钥**
6. **启用 HTTPS**
7. **定期备份数据**

---

## 监控和维护

### 设置监控（可选）

可以使用 PM2 Plus 或其他监控工具：

```bash
# 安装 PM2 Plus
pm2 link your-secret-key your-public-key
```

### 定期备份

建议定期备份：
- 代码仓库
- 环境变量文件
- 日志文件

---

## 总结

部署完成后，你应该能够：

1. ✅ 通过 `http://你的域名` 或 `http://你的服务器IP` 访问前端
2. ✅ 通过 `http://你的域名/api` 访问后端 API
3. ✅ 所有服务在服务器重启后自动启动
4. ✅ 日志文件保存在 `/var/log/polymarket/`

如果遇到问题，请查看日志文件或联系技术支持。

