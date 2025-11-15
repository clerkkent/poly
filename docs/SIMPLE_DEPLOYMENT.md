# 简化部署指南 - 火山引擎服务器

## 超简单 3 步部署

### 前提条件
- 已购买火山引擎服务器（Ubuntu 20.04/22.04 或 CentOS 7/8）
- 已通过 SSH 连接到服务器
- 已将项目代码上传到服务器（或使用 git clone）

---

## 方法 1：一键部署脚本（推荐）

### 步骤 1：上传代码到服务器

在**本地**执行：

```bash
# 打包代码（排除 node_modules 和 .git）
tar -czf polymarket.tar.gz --exclude=node_modules --exclude=.git --exclude=dist .

# 上传到服务器
scp polymarket.tar.gz root@你的服务器IP:/root/
```

在**服务器**上执行：

```bash
# 解压代码
cd /root
tar -xzf polymarket.tar.gz
cd polymarket-quant-system  # 或你的项目目录名
```

### 步骤 2：运行一键部署脚本

```bash
# 给脚本执行权限
chmod +x scripts/simple-deploy.sh

# 运行脚本
bash scripts/simple-deploy.sh
```

脚本会自动完成：
- ✅ 安装 Node.js、pnpm、PM2
- ✅ 安装项目依赖
- ✅ 构建所有包
- ✅ 创建 .env 配置文件
- ✅ 创建 PM2 配置
- ✅ 启动服务
- ✅ 设置开机自启

### 步骤 3：配置防火墙

```bash
# Ubuntu (UFW)
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### 完成！

访问：
- 前端：`http://你的服务器IP:3000`
- 后端：`http://你的服务器IP:3001`

---

## 方法 2：手动部署（如果脚本失败）

### 步骤 1：安装环境

```bash
# 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 安装 pnpm 和 PM2
npm install -g pnpm pm2
```

### 步骤 2：构建项目

```bash
# 进入项目目录
cd /root/polymarket-quant-system  # 或你的项目目录

# 安装依赖
pnpm install

# 构建所有包
pnpm -r build
```

### 步骤 3：创建配置文件

```bash
# 创建 .env 文件
cat > .env << 'EOF'
PORT=3001
NEXT_PUBLIC_API_URL=http://你的服务器IP:3001
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
EOF

# 创建 PM2 配置
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'polymarket-api',
      script: './apps/api/dist/index.js',
      env: { NODE_ENV: 'production', PORT: 3001 },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      autorestart: true,
    },
    {
      name: 'polymarket-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: './apps/web',
      env: { NODE_ENV: 'production', PORT: 3000 },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      autorestart: true,
    },
  ],
};
EOF

# 创建日志目录
mkdir -p logs
```

### 步骤 4：启动服务

```bash
# 启动服务
pm2 start ecosystem.config.js

# 保存配置
pm2 save

# 设置开机自启
pm2 startup
# 执行上面命令输出的命令
```

### 步骤 5：配置防火墙

```bash
# Ubuntu
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# CentOS
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

---

## 验证部署

### 检查服务状态

```bash
# 查看 PM2 状态
pm2 status

# 查看日志
pm2 logs

# 测试 API
curl http://localhost:3001/health
```

### 访问服务

- 前端：`http://你的服务器IP:3000`
- 后端 API：`http://你的服务器IP:3001`
- 健康检查：`http://你的服务器IP:3001/health`

---

## 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs              # 所有服务
pm2 logs polymarket-api  # 只查看 API
pm2 logs polymarket-web  # 只查看 Web

# 重启服务
pm2 restart all
pm2 restart polymarket-api

# 停止服务
pm2 stop all

# 删除服务
pm2 delete all
```

---

## 更新代码

```bash
# 进入项目目录
cd /root/polymarket-quant-system

# 拉取最新代码（如果使用 git）
git pull

# 重新安装依赖（如果有新依赖）
pnpm install

# 重新构建
pnpm -r build

# 重启服务
pm2 restart all
```

---

## 常见问题

### Q1: 服务启动失败？

```bash
# 查看详细日志
pm2 logs --err

# 检查端口是否被占用
sudo netstat -tlnp | grep -E '3000|3001'

# 检查 .env 文件
cat .env
```

### Q2: 无法访问前端？

1. 检查防火墙是否开放端口
2. 检查服务是否运行：`pm2 status`
3. 查看日志：`pm2 logs polymarket-web`

### Q3: API 请求失败？

1. 检查后端服务：`pm2 status`
2. 查看日志：`pm2 logs polymarket-api`
3. 检查 `.env` 中的 `NEXT_PUBLIC_API_URL` 是否正确

### Q4: 如何修改配置？

```bash
# 编辑 .env 文件
nano .env

# 修改后重启服务
pm2 restart all
```

---

## 下一步（可选）

### 配置域名和 HTTPS

如果需要使用域名访问，参考 `docs/DEPLOYMENT.md` 中的 Nginx 配置部分。

### 配置代理

如果服务器无法直接访问 Polymarket API，在 `.env` 文件中添加：

```env
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

---

## 总结

**最简单的方法**：
1. 上传代码到服务器
2. 运行 `bash scripts/simple-deploy.sh`
3. 配置防火墙
4. 完成！

就是这么简单！🎉

