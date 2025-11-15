#!/bin/bash

# Polymarket 量化交易系统 - 快速部署脚本
# 适用于火山引擎服务器（Ubuntu/CentOS）

set -e

echo "🚀 开始部署 Polymarket 量化交易系统..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 用户运行此脚本${NC}"
    exit 1
fi

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo -e "${RED}无法检测操作系统${NC}"
    exit 1
fi

echo -e "${GREEN}检测到操作系统: $OS $VER${NC}"

# 安装 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}安装 Node.js...${NC}"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 18
    nvm use 18
    nvm alias default 18
else
    echo -e "${GREEN}Node.js 已安装: $(node -v)${NC}"
fi

# 安装 pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}安装 pnpm...${NC}"
    npm install -g pnpm
else
    echo -e "${GREEN}pnpm 已安装: $(pnpm -v)${NC}"
fi

# 安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}安装 PM2...${NC}"
    npm install -g pm2
else
    echo -e "${GREEN}PM2 已安装${NC}"
fi

# 安装 Git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}安装 Git...${NC}"
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get update
        apt-get install -y git
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        yum install -y git
    fi
else
    echo -e "${GREEN}Git 已安装${NC}"
fi

# 创建项目目录
PROJECT_DIR="/opt/polymarket"
echo -e "${YELLOW}项目目录: $PROJECT_DIR${NC}"

if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p $PROJECT_DIR
    echo -e "${GREEN}创建项目目录${NC}"
fi

# 检查是否需要克隆代码
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo -e "${YELLOW}请先上传代码到 $PROJECT_DIR 目录${NC}"
    echo -e "${YELLOW}或使用 git clone 克隆代码${NC}"
    read -p "是否已准备好代码？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}请先准备好代码后再运行此脚本${NC}"
        exit 1
    fi
fi

cd $PROJECT_DIR

# 安装依赖
echo -e "${YELLOW}安装依赖...${NC}"
pnpm install

# 构建项目
echo -e "${YELLOW}构建项目...${NC}"
pnpm -r build

# 创建日志目录
mkdir -p /var/log/polymarket
chown -R $USER:$USER /var/log/polymarket 2>/dev/null || true

# 检查 .env 文件
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${YELLOW}创建 .env 文件...${NC}"
    cat > $PROJECT_DIR/.env << EOF
# 后端服务端口
PORT=3001

# 前端 API 地址（请修改为你的服务器 IP 或域名）
NEXT_PUBLIC_API_URL=http://$(hostname -I | awk '{print $1}'):3001

# JWT 密钥（请修改为强随机字符串）
JWT_SECRET=$(openssl rand -hex 32)

# Node 环境
NODE_ENV=production

# 代理配置（如果需要）
# HTTP_PROXY=http://127.0.0.1:7890
# HTTPS_PROXY=http://127.0.0.1:7890
EOF
    echo -e "${GREEN}.env 文件已创建，请编辑配置${NC}"
    echo -e "${YELLOW}编辑命令: nano $PROJECT_DIR/.env${NC}"
fi

# 创建 PM2 配置文件
echo -e "${YELLOW}创建 PM2 配置...${NC}"
cat > $PROJECT_DIR/ecosystem.config.js << 'EOF'
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
EOF

# 启动服务
echo -e "${YELLOW}启动服务...${NC}"
pm2 start ecosystem.config.js
pm2 save

# 设置开机自启
echo -e "${YELLOW}设置开机自启...${NC}"
STARTUP_CMD=$(pm2 startup | grep -v "PM2" | tail -1)
if [ ! -z "$STARTUP_CMD" ]; then
    eval $STARTUP_CMD
fi

# 显示状态
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo -e "${GREEN}服务状态:${NC}"
pm2 status

echo ""
echo -e "${GREEN}访问地址:${NC}"
echo -e "  前端: http://$(hostname -I | awk '{print $1}'):3000"
echo -e "  后端: http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo -e "${GREEN}常用命令:${NC}"
echo -e "  查看日志: pm2 logs"
echo -e "  重启服务: pm2 restart all"
echo -e "  停止服务: pm2 stop all"
echo ""
echo -e "${YELLOW}⚠️  请编辑 .env 文件配置正确的环境变量${NC}"
echo -e "${YELLOW}⚠️  建议配置 Nginx 反向代理（参考 docs/DEPLOYMENT.md）${NC}"

