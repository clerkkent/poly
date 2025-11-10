Write-Host "🚀 初始化 Polymarket 量化交易系统..." -ForegroundColor Green

# 检查 pnpm
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未找到 pnpm，请先安装: npm install -g pnpm" -ForegroundColor Red
    exit 1
}

# 安装依赖
Write-Host "📦 安装依赖..." -ForegroundColor Yellow
pnpm install

# 构建共享包
Write-Host "🔨 构建共享包..." -ForegroundColor Yellow
pnpm --filter @poly/shared build
pnpm --filter @poly/polymarket build
pnpm --filter @poly/strategies build

Write-Host "✅ 初始化完成！" -ForegroundColor Green
Write-Host ""
Write-Host "启动开发服务器：" -ForegroundColor Cyan
Write-Host "  前端: pnpm dev" -ForegroundColor White
Write-Host "  后端: pnpm api" -ForegroundColor White

