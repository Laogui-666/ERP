#!/usr/bin/env bash
# ============================================================
# ERP 数据库备份脚本
#
# 用途：定时备份阿里云 RDS MySQL 数据库
# 使用：bash scripts/db-backup.sh
# Cron：0 3 * * * cd /path/to/erp && bash scripts/db-backup.sh >> /var/log/erp-backup.log 2>&1
# ============================================================

set -e

# ==================== 配置 ====================

# 从 .env.local 读取数据库连接信息
if [ -f .env.local ]; then
  export $(grep -E '^DATABASE_URL=' .env.local | xargs)
fi

# 备份目录
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETAIN_DAYS=30

# ==================== 执行 ====================

DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/erp_backup_${DATE}.sql.gz"

echo "📦 ERP 数据库备份 - ${DATE}"
echo "================================"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 解析 DATABASE_URL 获取连接信息
# 格式: mysql://user:pass@host:port/dbname
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL 未设置"
  exit 1
fi

# 提取连接参数（URL 解码密码中的 @）
DB_INFO=$(echo "$DATABASE_URL" | sed 's|^mysql://||')
DB_USER=$(echo "$DB_INFO" | cut -d: -f1)
DB_PASS_RAW=$(echo "$DB_INFO" | sed "s|^${DB_USER}:||" | cut -d@ -f1)
DB_PASS=$(echo "$DB_PASS_RAW" | sed 's/%40/@/g')
DB_HOST=$(echo "$DB_INFO" | sed "s|^${DB_USER}:${DB_PASS_RAW}@||" | cut -d: -f1)
DB_PORT=$(echo "$DB_INFO" | sed "s|^${DB_USER}:${DB_PASS_RAW}@||" | sed "s|${DB_HOST}||" | cut -d/ -f1 | sed 's/^://')
DB_NAME=$(echo "$DB_INFO" | sed "s|^${DB_USER}:${DB_PASS_RAW}@${DB_HOST}:${DB_PORT}/||")

DB_PORT=${DB_PORT:-3306}

echo "   数据库: ${DB_NAME}"
echo "   主机: ${DB_HOST}:${DB_PORT}"
echo "   备份文件: ${BACKUP_FILE}"

# 执行备份
mysqldump \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --add-drop-table \
  --complete-insert \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

# 检查备份大小
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ 备份完成: ${BACKUP_SIZE}"

# 清理过期备份
DELETED=$(find "$BACKUP_DIR" -name "erp_backup_*.sql.gz" -mtime +${RETAIN_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "🗑️  已清理 ${DELETED} 个过期备份（>${RETAIN_DAYS}天）"
fi

# 统计当前备份数
TOTAL=$(find "$BACKUP_DIR" -name "erp_backup_*.sql.gz" | wc -l)
echo "📊 当前备份数: ${TOTAL}"
echo "================================"
