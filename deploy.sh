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

echo "5. 重启服务..."
# 停止旧服务
pm2 stop erp || true
# 启动新服务
npm run start > /dev/null 2>&1 &

echo "6. 验证服务状态..."
sleep 5
curl -s http://localhost:3002/api/health

echo "\n=== 部署完成！==="
echo "访问地址: http://223.6.248.154:3002"
