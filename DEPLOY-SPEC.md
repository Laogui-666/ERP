# 华夏签证 ERP — 部署规格文档

> **版本**: V1.0
> **最后更新**: 2026-04-03
> **当前状态**: 生产运行中 ✅

---

## 1. 服务器信息

| 项目 | 值 |
|---|---|
| 公网 IP | 223.6.248.154 |
| 实例 | i-bp1g25p0qi7h7owl69ft |
| 操作系统 | Alibaba Cloud Linux 3 (x86_64) |
| Node.js | v22.22.2 |
| npm | 10.9.7 |
| PM2 | 6.0.14 |
| Nginx | 已安装（宝塔面板管理） |
| 项目路径 | `/www/wwwroot/ERP` |
| 访问地址 | http://223.6.248.154:3002 |

---

## 2. 数据库

| 项目 | 值 |
|---|---|
| 类型 | 阿里云 RDS MySQL 8.0 |
| Host | rm-bp159g3iw669447778o.mysql.rds.aliyuncs.com |
| Port | 3306 |
| 用户 | visa |
| 数据库 | visa |
| 表数量 | 22 张（全部 `erp_` 前缀） |
| Prisma 迁移 | 5 个 migration |

### 表清单

```
erp_applicants, erp_chat_messages, erp_chat_reads, erp_chat_rooms,
erp_companies, erp_departments, erp_doc_helper_templates, erp_document_files,
erp_document_requirements, erp_form_records, erp_form_templates,
erp_generated_documents, erp_itineraries, erp_news_articles,
erp_notifications, erp_order_logs, erp_orders, erp_translation_requests,
erp_users, erp_visa_assessments, erp_visa_materials, erp_visa_templates
```

---

## 3. 启动方式

### ⚠️ 关键：使用 `next start` 而非 `tsx server.ts`

| 方式 | 结果 | 原因 |
|---|---|---|
| `tsx server.ts` | ❌ PM2 反复重启 | Next.js 15 的 AsyncLocalStorage 与 tsx CJS 模式不兼容 |
| `node --import tsx/esm server.ts` | ❌ ERR_REQUIRE_CYCLE_MODULE | ESM/CJS 循环依赖 |
| **`next start -p 3002`** | ✅ 稳定运行 | Next.js 原生启动，无兼容问题 |

> Socket.io 功能暂时不可用（custom server 无法启动），核心 ERP 功能完全正常。

### PM2 配置 (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [{
    name: 'erp',
    script: 'node_modules/.bin/next',
    args: ['start', '-p', '3002'],
    cwd: '/www/wwwroot/ERP',
    env: {
      NODE_ENV: 'production',
      PORT: '3002',
    },
    max_restarts: 10,
    restart_delay: 3000,
    min_uptime: '5s',
  }]
}
```

---

## 4. 环境变量 (`.env.local`)

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://223.6.248.154:3002
PORT=3002

DATABASE_URL="mysql://visa:Laogui%40900327@rm-bp159g3iw669447778o.mysql.rds.aliyuncs.com:3306/visa"

JWT_SECRET="ab5a6900f05247dab4b2716c7232569467ec6eb4489889c6040266e7b2b0ab25"
JWT_REFRESH_SECRET="acd35ab59e8fb65d4afecde6b981b8898af9489e8c35e84873dfb90693ccdba8"

OSS_REGION=oss-cn-beijing
OSS_ENDPOINT=https://oss-cn-beijing.aliyuncs.com
OSS_ACCESS_KEY_ID=<见服务器备份>
OSS_ACCESS_KEY_SECRET=<见服务器备份>
OSS_BUCKET=hxvisa001

SOCKET_PORT=3002
SMS_ENABLED=false
```

### ⚠️ 注意事项

1. **数据库端口**: 使用 `3306`（非文档中的 `33306`）
2. **Cookie Secure**: `COOKIE_SECURE` 未设置时默认 `false`（HTTP 部署）。HTTPS 部署时需设为 `true`
3. **密码编码**: `DATABASE_URL` 中密码的 `@` 需编码为 `%40`

---

## 5. 部署流程（服务器端执行）

```bash
# === 1. 停止旧服务 + 备份 ===
pm2 stop erp 2>/dev/null
pm2 delete erp 2>/dev/null
kill $(lsof -ti :3002) 2>/dev/null
mkdir -p /root/erp-backup
cp /www/wwwroot/ERP/.env.local /root/erp-backup/.env.local 2>/dev/null

# === 2. 删除旧项目 ===
rm -rf /www/wwwroot/ERP

# === 3. 拉取最新代码 ===
cd /www/wwwroot
git clone https://YOUR_GITHUB_TOKEN@github.com/Laogui-666/ERP.git ERP

# === 4. 恢复环境变量 ===
cp /root/erp-backup/.env.local /www/wwwroot/ERP/.env.local

# === 5. 安装依赖 + 迁移 + 构建 ===
cd /www/wwwroot/ERP
npm install
export $(grep '=' .env.local | tr -d '"' | xargs)
npx prisma migrate deploy
npx prisma generate
npx prisma db seed 2>/dev/null || npx tsx prisma/seed.ts 2>/dev/null
npm run build

# === 6. PM2 启动 ===
# 确保 ecosystem.config.js 使用 next start（见第3节）
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null

# === 7. 验证 ===
sleep 5
curl -s http://localhost:3002/api/health
# 期望: {"success":true,"data":{"status":"ok",...}}
```

---

## 6. 已知问题与限制

| # | 问题 | 状态 | 说明 |
|---|---|---|---|
| 1 | Socket.io 不可用 | ⚠️ 已知 | `next start` 不支持 custom server，Socket.io 需后续方案 |
| 2 | `tsx server.ts` 启动失败 | ⚠️ 已知 | Next.js 15 + tsx 的 AsyncLocalStorage 兼容问题 |
| 3 | Pool API 403 for SUPER_ADMIN | ✅ 设计预期 | 超管无公共池权限（池仅供签证部角色） |
| 4 | Companies GET 405 | ✅ 设计预期 | `/api/companies/me` 仅支持 PATCH |

---

## 7. 测试结果（2026-04-03 实机测试）

### API 全链路测试: 14/16 通过

```
  [OK] Health                HTTP 200
  [OK] Login                 HTTP 200
  [OK] Auth Me               HTTP 200
  [OK] Orders List           HTTP 200 total=8
  [OK] Create Order          HTTP 201
  [OK] Templates             HTTP 200
  [OK] Users                 HTTP 200 total=5
  [OK] Departments           HTTP 200
  [OK] Notifications         HTTP 200
  [OK] Analytics Overview    HTTP 200
  [FAIL] Pool                HTTP 403 (设计预期: 超管无权)
  [OK] ChatRooms             HTTP 200
  [OK] News                  HTTP 200
  [FAIL] Companies           HTTP 405 (设计预期: 仅PATCH)
  [OK] Itineraries           HTTP 200
  [OK] Assessments           HTTP 200
```

### 前端页面测试: 全部通过

```
  [OK] 首页 (/)                    HTTP 200
  [OK] 登录 (/login)               HTTP 200
  [OK] 注册 (/register)            HTTP 200
  [OK] 服务页 (/services)           HTTP 200
  [OK] 工具箱 (/tools)              HTTP 200
  [OK] 订单重定向 (/orders)          HTTP 307 → /portal/orders
  [OK] 我的 (/portal/profile)       HTTP 307 → /login
  [OK] 管理后台 (/admin/dashboard)  HTTP 307 → /login
```

### 稳定性

```
  PM2 uptime: 69s, restarts: 0, memory: 162.7MB
  外部访问: HTTP 200 ✅
```

---

## 8. 本次部署修复清单

| # | Commit | 类型 | 修复内容 |
|---|---|---|---|
| 1 | `a114148` | Bug Fix | orders API 支持逗号分隔多状态查询；admin layout CSS 冲突；403 页面无效类；底部 Tab 错误链接 |
| 2 | `90d2604` | Bug Fix | JWT 密钥改为惰性加载，解决 tsx + dotenv 模块加载顺序冲突 |
| 3 | `eddaf00` | Bug Fix | server.ts 添加 AsyncLocalStorage polyfill（已被 next start 方案替代） |
| 4 | `2bf48e2` | Bug Fix | Cookie Secure 标志改用 COOKIE_SECURE 环境变量，HTTP 部署不再丢失认证 |
| 5 | `3a8d31a` | Bug Fix | ChatRooms API SQL 语法错误，prisma.$queryRaw 模板拼接改 queryRawUnsafe |

---

## 9. 超管账号

| 项目 | 值 |
|---|---|
| 用户名 | `superadmin` |
| 密码 | `Admin@123456` |
| 角色 | SUPER_ADMIN (Lv1) |
| 公司 | system |

---

## 10. 后续优化方向

1. **Socket.io 方案**: 在 `next start` 基础上通过独立进程运行 Socket.io（不同端口或 Nginx 反代）
2. **HTTPS**: 配置域名 + SSL 证书（宝塔面板可一键配置）
3. **Next.js 安全升级**: 定期检查并更新依赖
4. **PM2 日志轮转**: 配置 `pm2-logrotate` 防止日志文件过大
5. **数据库备份**: 配置 RDS 自动备份策略

---

*文档结束*
