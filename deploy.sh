#!/bin/bash

# 部署脚本 - 华夏签证 ERP 系统
# 运行环境：阿里云 ECS

set -e

echo "=== 开始部署华夏签证 ERP 系统 ==="

# 进入项目目录
cd /www/wwwroot/ERP

echo "1. 拉取最新代码..."
git pull origin main

echo "2. 安装依赖..."
npm ci

echo "3. 生成 Prisma Client..."
npx prisma generate

echo "4. 构建项目..."
npm run build

echo "5. 重启服务（通过PM2管理）..."
# 通过 PM2 管理重启，避免端口冲突和进程泄漏
pm2 restart erp || pm2 start ecosystem.config.json

echo "6. 等待服务启动..."
sleep 8

echo "7. 验证服务状态..."
HEALTH=$(curl -s http://localhost:3002/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "   ✅ 服务正常运行"
else
    echo "   ⚠️ 健康检查未通过，查看日志："
    pm2 logs erp --lines 10 --nostream
    exit 1
fi

echo ""
echo "=== 部署完成！==="
echo "访问地址: http://223.6.248.154:3002"
echo "PM2 状态："
pm2 list
