#!/bin/bash

# ============================================
# 华夏签证 ERP 系统 — 一键部署脚本
# 目标: 阿里云 ECS 223.6.248.154:3002
# ============================================

set -e

# ---------- 配置 ----------
SERVER="223.6.248.154"
PORT="22"
USER="root"
PASS="Laogui@900327"
PROJECT_DIR="/www/wwwroot/ERP"
SERVICE_PORT=3002
PM2_NAME="erp"

# ---------- 颜色 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1"; }
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
fail() { echo -e "${RED}  ❌ $1${NC}"; }

# ---------- 依赖检查 ----------
check_deps() {
    local missing=()
    for cmd in sshpass python3 curl; do
        if ! command -v "$cmd" &>/dev/null; then
            missing+=("$cmd")
        fi
    done
    if [ ${#missing[@]} -gt 0 ]; then
        fail "缺少依赖: ${missing[*]}"
        echo "  请先安装: sudo apt install ${missing[*]}  或  sudo yum install ${missing[*]}"
        exit 1
    fi
}

# ---------- SSH 执行 ----------
ssh_run() {
    sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
        "${USER}@${SERVER}" "$1"
}

# ---------- 主流程 ----------
main() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   华夏签证 ERP — 一键部署               ║${NC}"
    echo -e "${CYAN}║   目标: ${SERVER}:${SERVICE_PORT}                    ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
    echo ""

    check_deps

    # 1. 连接测试
    log "1/7 连接服务器..."
    if ssh_run "echo ok" &>/dev/null; then
        ok "SSH 连接成功"
    else
        fail "无法连接服务器 ${SERVER}"
        exit 1
    fi

    # 2. 拉取代码
    log "2/7 拉取最新代码..."
    PULL_OUT=$(ssh_run "cd ${PROJECT_DIR} && git pull origin main 2>&1")
    if echo "$PULL_OUT" | grep -qiE "error|fatal"; then
        fail "Git pull 失败:"
        echo "$PULL_OUT"
        exit 1
    fi
    ok "代码已更新"

    # 3. 安装依赖
    log "3/7 安装依赖 (npm ci)..."
    ssh_run "cd ${PROJECT_DIR} && npm ci --production=false 2>&1 | tail -3"
    ok "依赖安装完成"

    # 4. 生成 Prisma Client
    log "4/7 生成 Prisma Client..."
    ssh_run "cd ${PROJECT_DIR} && npx prisma generate 2>&1 | tail -3"
    ok "Prisma Client 已生成"

    # 5. 构建项目
    log "5/7 构建项目 (next build)..."
    BUILD_OUT=$(ssh_run "cd ${PROJECT_DIR} && npm run build 2>&1")
    if echo "$BUILD_OUT" | grep -qi "Build error"; then
        fail "构建失败:"
        echo "$BUILD_OUT" | tail -20
        exit 1
    fi
    ok "构建完成"

    # 6. PM2 重启
    log "6/7 重启服务 (PM2)..."
    ssh_run "
        cd ${PROJECT_DIR}
        # 确保 PM2 用正确配置管理
        if pm2 describe ${PM2_NAME} &>/dev/null; then
            pm2 restart ${PM2_NAME}
        else
            pm2 start ecosystem.config.json
        fi
        pm2 save
    " &>/dev/null
    ok "服务已重启"

    # 7. 健康检查
    log "7/7 健康检查..."
    sleep 8
    HEALTH=$(ssh_run "curl -s http://localhost:${SERVICE_PORT}/api/health 2>/dev/null")
    if echo "$HEALTH" | grep -q '"status":"ok"'; then
        ok "服务运行正常"
    else
        warn "健康检查未通过，查看日志..."
        ssh_run "pm2 logs ${PM2_NAME} --lines 5 --nostream"
    fi

    # 输出状态
    echo ""
    PM2_STATUS=$(ssh_run "pm2 list 2>/dev/null")
    echo "$PM2_STATUS"
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ 部署完成！                            ║${NC}"
    echo -e "${GREEN}║  访问: http://${SERVER}:${SERVICE_PORT}              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    echo ""
}

main "$@"
