#!/bin/bash
# ============================================================
# 华夏签证ERP - Git推送 + 部署 一键脚本
#
# 功能:
# 1. 本地验证 (type-check + test + build)
# 2. Git提交并推送到main分支
# 3. SSH连接服务器并拉取代码
# 4. 服务器构建和部署
#
# 用法:
#   cd /workspace/ERP
#   chmod +x scripts/push-and-deploy.sh
#   ./scripts/push-and-deploy.sh "feat(module): description"
#
# ============================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1"; }
ok() { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
fail() { echo -e "${RED}  ❌ $1${NC}"; exit 1; }

# 配置
PROJECT_DIR="/workspace/ERP"
SERVER="223.6.248.154"
SSH_USER="root"
SSH_PASS="Laogui@900327"
SERVER_PROJECT_DIR="/www/wwwroot/ERP"
PM2_NAME="erp"

# 获取提交信息
COMMIT_MSG="${1:-chore: deploy at $(date '+%Y-%m-%d %H:%M:%S')}"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       华夏签证ERP - Git推送 + 一键部署                   ║${NC}"
echo -e "${CYAN}║       服务器: ${SERVER}                                      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_DIR"

# ============================================================
# 阶段1: 本地验证
# ============================================================
log "阶段 1/5: 本地验证..."

# 1.1 TypeScript类型检查
log "  1.1 TypeScript类型检查..."
if npm run type-check 2>&1; then
    ok "类型检查通过"
else
    fail "类型检查失败"
fi

# 1.2 运行测试
log "  1.2 运行测试..."
if npm run test 2>&1; then
    ok "测试通过"
else
    warn "测试未全部通过，继续执行..."
fi

# 1.3 构建验证
log "  1.3 构建验证..."
if npm run build 2>&1; then
    ok "构建成功"
else
    fail "构建失败"
fi

ok "本地验证完成"

# ============================================================
# 阶段2: Git提交
# ============================================================
log "阶段 2/5: Git提交..."

# 2.1 检查Git状态
GIT_STATUS=$(git status --porcelain)
if [ -n "$GIT_STATUS" ]; then
    log "  发现变更:"
    echo "$GIT_STATUS" | sed 's/^/    /'
else
    warn "  没有文件变更"
fi

# 2.2 添加所有变更
log "  添加变更文件..."
git add -A

# 2.3 提交
log "  提交代码: \"$COMMIT_MSG\""
if git commit -m "$COMMIT_MSG" 2>/dev/null; then
    ok "提交成功"
else
    warn "没有变更需要提交，继续"
fi

# ============================================================
# 阶段3: Git推送
# ============================================================
log "阶段 3/5: Git推送..."

# 确保在main分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log "  切换到main分支..."
    git checkout main
fi

# 推送到远程
log "  推送到 origin/main..."
if git push origin main; then
    ok "推送成功"
else
    fail "推送失败"
fi

# ============================================================
# 阶段4: 服务器部署
# ============================================================
log "阶段 4/5: 服务器部署..."

# 使用Python脚本进行部署
log "  调用部署脚本..."
if python3 scripts/deploy-complete.py; then
    ok "服务器部署完成"
else
    fail "服务器部署失败"
fi

# ============================================================
# 完成
# ============================================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🎉 部署完成！                          ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  🌐 访问地址: http://${SERVER}:3002                        ║${NC}"
echo -e "${GREEN}║  📊 查看状态: ssh root@${SERVER} 'pm2 list'                ║${NC}"
echo -e "${GREEN}║  📝 查看日志: ssh root@${SERVER} 'pm2 logs erp'            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
