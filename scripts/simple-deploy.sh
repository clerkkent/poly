#!/bin/bash

# 简化版部署脚本 - 适用于火山引擎服务器
# 使用方法: bash simple-deploy.sh

set -e

echo "🚀 开始简化部署..."

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 1. 检查并安装 Node.js
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 18
    nvm use 18
    nvm alias default 18
fi

# 2. 检查并安装 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 安装 pnpm..."
    npm install -g pnpm
fi

# 3. 检查并安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

# 4. 安装依赖（如果还没有）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install
fi

# 5. 构建项目（如果还没有构建）
if [ ! -d "packages/shared/dist" ] || [ ! -d "packages/polymarket/dist" ] || [ ! -d "packages/strategies/dist" ]; then
    echo "🔨 构建共享包..."
    pnpm -r build
fi

# 6. 创建 .env 文件（如果不存在）
if [ ! -f ".env" ]; then
    echo "📝 创建 .env 文件..."
    SERVER_IP=$(hostname -I | awk '{print $1}')
    cat > .env << EOF
# 后端服务端口
PORT=3001

# 前端 API 地址（自动检测服务器 IP）
NEXT_PUBLIC_API_URL=http://${SERVER_IP}:3001

# JWT 密钥（自动生成）
JWT_SECRET=$(openssl rand -hex 32)

# Node 环境
NODE_ENV=production

# 代理配置（如果需要，取消注释并修改）
# HTTP_PROXY=http://127.0.0.1:7890
# HTTPS_PROXY=http://127.0.0.1:7890
EOF
    echo "✅ .env 文件已创建，请根据需要修改"
fi

# 7. 创建日志目录
mkdir -p /var/log/polymarket 2>/dev/null || mkdir -p ./logs

# 8. 创建 PM2 配置文件
echo "📝 创建 PM2 配置..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'polymarket-api',
      script: './apps/api/dist/index.js',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'polymarket-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: './apps/web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
    },
  ],
};
EOF

# 9. 停止旧服务（如果存在）
echo "🛑 停止旧服务..."
pm2 delete all 2>/dev/null || true

# 10. 启动服务
echo "🚀 启动服务..."
pm2 start ecosystem.config.js
pm2 save

# 11. 设置开机自启
echo "⚙️  设置开机自启..."
STARTUP_CMD=$(pm2 startup | grep -v "PM2" | tail -1)
if [ ! -z "$STARTUP_CMD" ]; then
    echo "执行以下命令以设置开机自启："
    echo "$STARTUP_CMD"
    read -p "是否现在执行？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        eval $STARTUP_CMD
    fi
fi

# 12. 显示结果
echo ""
echo "✅ 部署完成！"
echo ""
echo "📊 服务状态："
pm2 status
echo ""
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "🌐 访问地址："
echo "   前端: http://${SERVER_IP}:3000"
echo "   后端: http://${SERVER_IP}:3001"
echo "   健康检查: http://${SERVER_IP}:3001/health"
echo ""
echo "📝 常用命令："
echo "   查看日志: pm2 logs"
echo "   重启服务: pm2 restart all"
echo "   停止服务: pm2 stop all"
echo "   查看状态: pm2 status"
echo ""
echo "⚠️  提示："
echo "   1. 请确保防火墙开放了 3000 和 3001 端口"
echo "   2. 如需配置域名，请参考 docs/DEPLOYMENT.md"
echo "   3. 编辑 .env 文件可修改配置"

