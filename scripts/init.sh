#!/bin/bash

echo "🚀 初始化 Polymarket 量化交易系统..."

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ 未找到 pnpm，请先安装: npm install -g pnpm"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建共享包
echo "🔨 构建共享包..."
pnpm --filter @poly/shared build
pnpm --filter @poly/polymarket build
pnpm --filter @poly/strategies build

echo "✅ 初始化完成！"
echo ""
echo "启动开发服务器："
echo "  前端: pnpm dev"
echo "  后端: pnpm api"

