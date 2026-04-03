#!/usr/bin/env bash
# ============================================================
# 华夏签证 ERP - 一键部署脚本
#
# 用法（在服务器上执行）：
#   1. 删除旧目录：rm -rf /app/erp
#   2. 运行此脚本：bash DEPLOY.sh
#
# 前提：服务器已安装 Node.js 20+、npm、PM2
# ============================================================

set -e

APP_DIR="/app/erp"
# ⚠️ 替换 YOUR_GITHUB_TOKEN 为实际的 GitHub Personal Access Token
GIT_REPO="https://YOUR_GITHUB_TOKEN@github.com/Laogui-666/ERP.git"
PM2_NAME="erp"

echo "🚀 华夏签证 ERP - 一键部署"
echo "================================"

# 1. 克隆项目
echo "📥 克隆项目..."
mkdir -p "$(dirname "$APP_DIR")"
git clone "$GIT_REPO" "$APP_DIR"
cd "$APP_DIR"

# 2. 配置环境变量（从已有 .env.local 复制，或手动创建）
if [ -f /app/erp-env/.env.local ]; then
  echo "⚙️  从备份恢复 .env.local..."
  cp /app/erp-env/.env.local .env.local
else
  echo "⚠️  请手动创建 .env.local，参考 .env.example"
  echo "   需要的变量: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, OSS_*"
  exit 1
fi

# 3. 安装依赖
echo "📦 安装依赖..."
npm ci --production=false 2>/dev/null || npm install

# 4. 数据库迁移
echo "🔧 数据库迁移..."
npx prisma migrate deploy 2>/dev/null || echo "⚠️ 迁移可能已执行，继续..."

# 5. 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npx prisma generate

# 6. 填充种子数据（仅首次）
echo "🌱 填充种子数据..."
npx prisma db seed 2>/dev/null || npx tsx prisma/seed.ts 2>/dev/null || echo "⚠️ 种子数据可能已存在，跳过"

# 7. 构建
echo "🏗️  构建项目..."
npm run build

# 8. 停止旧进程
echo "🔄 停止旧进程..."
pm2 stop "$PM2_NAME" 2>/dev/null || true
pm2 delete "$PM2_NAME" 2>/dev/null || true

# 9. 启动服务
echo "🚀 启动服务..."
pm2 start tsx --name "$PM2_NAME" -- server.ts
pm2 save

# 10. 验证
echo ""
echo "⏳ 等待服务启动..."
sleep 5

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/health 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then
  echo ""
  echo "================================"
  echo "✅ 部署成功！"
  echo ""
  echo "🌐 访问地址: http://223.6.248.154:3002"
  echo "📊 PM2 状态: pm2 status"
  echo "📝 PM2 日志: pm2 logs $PM2_NAME"
  echo "================================"
else
  echo ""
  echo "⚠️ 服务启动可能需要更多时间，HEALTH=$HEALTH"
  echo "请手动检查: pm2 logs $PM2_NAME"
fi