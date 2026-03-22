#!/usr/bin/env bash
# ============================================================
# ERP 生产部署脚本
#
# 用法：bash scripts/deploy.sh
# 前提：服务器已安装 Node.js 20+、PM2、Git
# ============================================================

set -e

APP_DIR="${APP_DIR:-/app/erp}"
PM2_NAME="erp"

echo "🚀 ERP 生产部署"
echo "================================"

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
cd "$APP_DIR"
git pull origin main

# 2. 安装依赖
echo "📦 安装依赖..."
npm ci --production=false

# 3. 数据库迁移（如果有新的 migration）
echo "🔧 数据库迁移..."
npx prisma migrate deploy

# 4. 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npx prisma generate

# 5. 构建
echo "🏗️  构建项目..."
npm run build

# 6. 重启服务
echo "🔄 重启服务..."
if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  pm2 restart "$PM2_NAME"
else
  pm2 start ecosystem.config.json
fi

# 7. 验证
echo "🔍 验证部署..."
sleep 3
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/health 2>/dev/null || echo "000")

if [ "$HEALTH" = "200" ]; then
  echo "✅ 部署成功！健康检查通过 (HTTP $HEALTH)"
else
  echo "⚠️  健康检查返回 HTTP $HEALTH，请检查日志："
  echo "   pm2 logs $PM2_NAME"
fi

echo "================================"
echo "📋 常用命令："
echo "   pm2 status          查看状态"
echo "   pm2 logs $PM2_NAME  查看日志"
echo "   pm2 restart $PM2_NAME  重启服务"
