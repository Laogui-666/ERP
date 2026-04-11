#!/bin/bash
# ============================================
# ERP 一键部署脚本
# 用法: ./scripts/deploy.sh
# 前置: 本地 npm run build 已通过
# ============================================
set -e

SERVER="root@223.6.248.154"
PROJECT="/www/wwwroot/ERP"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

# 检查 SSH 密码
if [ -z "$SSH_PASS" ]; then
  err "请设置环境变量 SSH_PASS: export SSH_PASS='your-password'"
fi

# 检查 sshpass
if ! command -v sshpass &> /dev/null; then
  warn "sshpass 未安装，尝试安装..."
  brew install sshpass 2>/dev/null || apt-get install -y sshpass 2>/dev/null || true
fi

SSH_CMD="sshpass -p '$SSH_PASS' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10"
SCP_CMD="sshpass -p '$SSH_PASS' scp -o StrictHostKeyChecking=no"

echo ""
echo "🚀 开始部署 ERP 到 $SERVER"
echo ""

# Step 1: 本地构建
echo "📦 Step 1/6: 本地构建..."
npm run build 2>&1 | tail -3
log "本地构建完成"

# Step 2: 获取服务器当前 HEAD
echo "📦 Step 2/6: 获取服务器版本..."
SERVER_HEAD=$($SSH_CMD $SERVER "cd $PROJECT && git rev-parse HEAD" 2>/dev/null)
LOCAL_HEAD=$(git rev-parse HEAD)
log "服务器: ${SERVER_HEAD:0:7} | 本地: ${LOCAL_HEAD:0:7}"

# Step 3: 创建 Git Bundle
echo "📦 Step 3/6: 打包代码变更..."
if [ "$SERVER_HEAD" != "$LOCAL_HEAD" ]; then
  git bundle create /tmp/erp-update.bundle ${SERVER_HEAD}..HEAD 2>/dev/null
  COMMITS=$(git log --oneline ${SERVER_HEAD}..HEAD | wc -l | tr -d ' ')
  log "Bundle 创建成功 ($COMMITS 个提交)"
  NEED_BUNDLE=true
else
  log "代码已是最新，跳过 bundle"
  NEED_BUNDLE=false
fi

# Step 4: 打包 .next
echo "📦 Step 4/6: 打包构建产物..."
tar czf /tmp/next-build.tar.gz .next
SIZE=$(du -sh /tmp/next-build.tar.gz | cut -f1)
log ".next 打包完成 ($SIZE)"

# Step 5: 上传
echo "🚀 Step 5/6: 上传到服务器..."
$SCP_CMD /tmp/next-build.tar.gz $SERVER:/tmp/
if [ "$NEED_BUNDLE" = true ]; then
  $SCP_CMD /tmp/erp-update.bundle $SERVER:/tmp/
fi
log "上传完成"

# Step 6: 远程部署
echo "🚀 Step 6/6: 服务器部署..."
$SSH_CMD $SERVER bash << REMOTE_SCRIPT
set -e
cd $PROJECT

# 停止服务
pm2 stop erp 2>&1 || true

# 应用代码更新
if [ -f /tmp/erp-update.bundle ]; then
  git fetch /tmp/erp-update.bundle 2>&1
  git merge FETCH_HEAD --no-edit 2>&1
  rm -f /tmp/erp-update.bundle
  echo "✅ 代码已更新"
fi

# 检查是否需要重装依赖
CHANGED=\$(git diff HEAD~1 --name-only 2>/dev/null || echo "")
if echo "\$CHANGED" | grep -q "package.json\|package-lock.json"; then
  echo "📦 package.json 变更，重装依赖..."
  npm install --ignore-scripts --no-optional 2>&1 | tail -3
  node_modules/.bin/prisma generate 2>&1 | tail -1
fi

# 部署 .next
rm -rf .next
tar xzf /tmp/next-build.tar.gz
rm -f /tmp/next-build.tar.gz

# 启动
pm2 delete erp 2>&1 || true
pm2 start tsx --name erp -- --import ./scripts/als-patch.cjs server.ts
sleep 10

# 验证
echo ""
echo "=== 验证 ==="
pm2 list
echo ""
curl -s http://127.0.0.1:3002/api/health
echo ""
pm2 save 2>&1
echo ""
echo "✅ 部署完成！"
REMOTE_SCRIPT

# 清理
rm -f /tmp/erp-update.bundle /tmp/next-build.tar.gz
echo ""
log "全部完成！🎉"
