# 华夏签证 ERP — 全知全能部署指南

> **最后更新**: 2026-04-12
> **适用范围**: 阿里云 ECS 部署环境
> **核心原则**: 服务器不能访问 GitHub、内存仅 1.8GB、recharts barrel optimization 不兼容 — 本指南解决这三大已知问题。

---

## 目录

1. [环境速查](#1-环境速查)
2. [首次部署（从零开始）](#2-首次部署从零开始)
3. [日常更新部署（标准流程）](#3-日常更新部署标准流程)
4. [快速部署脚本（一键执行）](#4-快速部署脚本一键执行)
5. [已知问题与解决方案](#5-已知问题与解决方案)
6. [故障排查手册](#6-故障排查手册)
7. [架构约束备忘](#7-架构约束备忘)

---

## 1. 环境速查

| 项目 | 值 |
|---|---|
| **服务器** | 阿里云 ECS `223.6.248.154` |
| **SSH** | root / 见环境配置文档 |
| **项目路径** | `/www/wwwroot/ERP` |
| **端口** | `3002` |
| **数据库** | 阿里云 RDS MySQL 8.0 |
| **OSS** | 阿里云 oss-cn-beijing / bucket |
| **进程管理** | PM2 (`pm2 start` / `pm2 restart`) |
| **Node.js** | v22.22.2 (nvm) |
| **操作系统** | Alibaba Cloud Linux 3 (x86_64) |
| **可用内存** | ~1.3GB (总 1.8GB) |
| **Git 分支** | `main`（唯一生产分支） |

---

## 2. 首次部署（从零开始）

### 2.1 服务器初始化

```bash
# SSH 连接
ssh root@223.6.248.154

# 安装 Node.js（通过 nvm）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# 安装 PM2
npm install -g pm2

# 克隆项目（⚠️ 服务器无法访问 GitHub，见下方说明）
# 方案 A：从本地打包传输（推荐）
# 方案 B：配置 Git token 代理（不稳定）
```

### 2.2 配置环境变量

```bash
cd /www/wwwroot/ERP
cp .env.example .env.local
# 编辑 .env.local 填入实际值
vim .env.local
```

`.env.local` 必须包含：

```env
NODE_ENV=production
PORT=3002
DATABASE_URL="mysql://user:password@host:3306/database"
JWT_SECRET="your-64-char-random-string"
JWT_REFRESH_SECRET="your-another-64-char-random-string"
OSS_REGION="oss-cn-beijing"
OSS_ACCESS_KEY_ID="your-key"
OSS_ACCESS_KEY_SECRET="your-secret"
OSS_BUCKET="your-bucket"
```

### 2.3 安装依赖 & 构建

```bash
# ⚠️ 不能用 npm ci（OOM），必须用 npm install --ignore-scripts
npm install --ignore-scripts --no-optional

# 安装 recharts 缺失的 peer deps（recharts 3.x 必需）
npm install react-redux immer reselect --save

# 手动安装 SWC 二进制（--ignore-scripts 跳过了）
npm install @next/swc-linux-x64-gnu@15.5.14 --force --no-save

# 生成 Prisma Client
node_modules/.bin/prisma generate

# ⚠️ 不能在服务器上 build（recharts barrel optimization 报错）
# 必须在本地构建后上传 .next 目录（见第 3 节）
```

### 2.4 首次启动

```bash
# ⚠️ 必须用 --import als-patch，否则 AsyncLocalStorage 报错
pm2 start tsx --name erp -- --import ./scripts/als-patch.cjs server.ts
pm2 save
```

---

## 3. 日常更新部署（标准流程）

### 3.1 标准流程（5 步）

```bash
# ============ 在本地机器执行 ============

# ① 确保本地代码是最新
cd /path/to/ERP
git pull origin main
npm install

# ② 本地构建（本地能正常 build，服务器不行）
npm run build

# ③ 打包 .next 目录
tar czf /tmp/next-build.tar.gz .next

# ④ 打包 Git 变更（如果服务器无法访问 GitHub）
git bundle create /tmp/erp-update.bundle <服务器当前HEAD>..HEAD

# ⑤ 上传并部署（通过 SSH）
# 见下方一键脚本
```

### 3.2 手动 SSH 操作

```bash
# SSH 到服务器
ssh root@223.6.248.154

cd /www/wwwroot/ERP

# 拉取代码（如果能访问 GitHub）
git checkout main
git pull origin main

# 如果不能访问 GitHub，用 bundle
scp /tmp/erp-update.bundle root@223.6.248.154:/tmp/
git fetch /tmp/erp-update.bundle
git merge FETCH_HEAD --no-edit

# 停止服务
pm2 stop erp

# 上传 .next 构建（在本地执行）
scp /tmp/next-build.tar.gz root@223.6.248.154:/tmp/

# 在服务器上替换 .next
rm -rf .next
tar xzf /tmp/next-build.tar.gz
rm -f /tmp/next-build.tar.gz

# 如果有 package.json 变更，需要重新安装依赖
npm install --ignore-scripts --no-optional
node_modules/.bin/prisma generate

# 重启服务
pm2 restart erp
# 或者删除重建（更干净）
pm2 delete erp
pm2 start tsx --name erp -- --import ./scripts/als-patch.cjs server.ts
pm2 save

# 验证
curl http://127.0.0.1:3002/api/health
```

---

## 4. 快速部署脚本（一键执行）

### 4.1 deploy.sh（本地执行）

将以下脚本保存为项目根目录的 `deploy.sh`：

```bash
#!/bin/bash
set -e

SERVER="root@223.6.248.154"
PROJECT_DIR="/www/wwwroot/ERP"
SSH_PASS="<见环境配置文档>"

echo "📦 Step 1: Building locally..."
npm run build

echo "📦 Step 2: Creating git bundle..."
LATEST_SERVER_COMMIT=$(sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SERVER "cd $PROJECT_DIR && git rev-parse HEAD")
git bundle create /tmp/erp-update.bundle $LATEST_SERVER_COMMIT..HEAD 2>/dev/null || echo "No new commits to bundle"

echo "📦 Step 3: Packaging .next..."
tar czf /tmp/next-build.tar.gz .next

echo "🚀 Step 4: Uploading and deploying..."
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SERVER << 'REMOTE_EOF'
cd /www/wwwroot/ERP

# Apply git updates
if [ -f /tmp/erp-update.bundle ]; then
    git fetch /tmp/erp-update.bundle 2>&1
    git merge FETCH_HEAD --no-edit 2>&1
    rm -f /tmp/erp-update.bundle
fi

# Install deps if package.json changed
if git diff HEAD~1 --name-only 2>/dev/null | grep -q "package.json\|package-lock.json"; then
    echo "📦 package.json changed, reinstalling deps..."
    npm install --ignore-scripts --no-optional 2>&1
    node_modules/.bin/prisma generate 2>&1
fi

# Deploy .next build
pm2 stop erp 2>&1 || true
rm -rf .next
tar xzf /tmp/next-build.tar.gz
rm -f /tmp/next-build.tar.gz

# Restart
pm2 delete erp 2>&1 || true
pm2 start tsx --name erp -- --import ./scripts/als-patch.cjs server.ts
sleep 10
pm2 list
curl -s http://127.0.0.1:3002/api/health
pm2 save
echo "✅ Deployment complete"
REMOTE_EOF

# Cleanup
rm -f /tmp/erp-update.bundle /tmp/next-build.tar.gz
echo "✅ Done!"
```

### 4.2 Node.js 部署脚本（备选，不需要 sshpass）

```javascript
// deploy.mjs — 在本地项目根目录执行: node deploy.mjs
import { Client } from 'ssh2'
import { readFileSync, statSync } from 'fs'
import { execSync } from 'child_process'

const SSH_HOST = '223.6.248.154'
const SSH_USER = 'root'
const SSH_PASS = process.env.SSH_PASS // export SSH_PASS='...'
const PROJECT = '/www/wwwroot/ERP'

// 1. Build locally
console.log('📦 Building locally...')
execSync('npm run build', { stdio: 'inherit' })

// 2. Get server's current HEAD
console.log('📦 Getting server commit...')
const serverHead = execSync(
  `node -e "const{Client}=require('ssh2');const c=new Client();c.on('ready',()=>{c.exec('cd ${PROJECT}&&git rev-parse HEAD',(e,s)=>{let o='';s.on('close',()=>{console.log(o.trim());c.end();process.exit(0)}).on('data',d=>o+=d)})}).on('error',e=>{console.error(e.message);process.exit(1)}).connect({host:'${SSH_HOST}',port:22,username:'${SSH_USER}',password:'${SSH_PASS}',readyTimeout:15000})"`,
  { encoding: 'utf-8' }
).trim()

// 3. Create bundle
try {
  execSync(`git bundle create /tmp/erp-update.bundle ${serverHead}..HEAD`, { stdio: 'pipe' })
  console.log('📦 Bundle created')
} catch {
  console.log('📦 No new commits')
}

// 4. Package .next
execSync('tar czf /tmp/next-build.tar.gz .next', { stdio: 'inherit' })
const size = Math.round(statSync('/tmp/next-build.tar.gz').size / 1024 / 1024)
console.log(`📦 .next packaged (${size}MB)`)

// 5. Upload and deploy via SSH
const conn = new Client()
conn.on('ready', () => {
  console.log('✅ SSH connected')
  conn.sftp((err, sftp) => {
    // Upload .next
    const ws = sftp.createWriteStream('/tmp/next-build.tar.gz')
    ws.write(readFileSync('/tmp/next-build.tar.gz'))
    ws.end(() => {
      console.log('📤 .next uploaded')
      const deploy = [
        `cd ${PROJECT}`,
        // Apply bundle if exists
        '[ -f /tmp/erp-update.bundle ] && (git fetch /tmp/erp-update.bundle && git merge FETCH_HEAD --no-edit; rm -f /tmp/erp-update.bundle) || true',
        // Reinstall if package.json changed
        'git diff HEAD~1 --name-only 2>/dev/null | grep -q "package" && npm install --ignore-scripts --no-optional && node_modules/.bin/prisma generate || true',
        // Deploy
        'pm2 stop erp 2>&1 || true',
        'rm -rf .next && tar xzf /tmp/next-build.tar.gz && rm -f /tmp/next-build.tar.gz',
        'pm2 delete erp 2>&1 || true',
        'pm2 start tsx --name erp -- --import ./scripts/als-patch.cjs server.ts',
        'sleep 10',
        'pm2 list',
        'curl -s http://127.0.0.1:3002/api/health',
        'pm2 save',
        'echo "✅ DEPLOY COMPLETE"',
      ].join(' && ')
      conn.exec(deploy, (e, stream) => {
        if (e) throw e
        stream.on('close', (code) => {
          console.log(`\n=== Exit: ${code} ===`)
          conn.end()
        }).on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d))
      })
    })
  })
}).on('error', e => { console.error(e.message); process.exit(1) })
  .connect({ host: SSH_HOST, port: 22, username: SSH_USER, password: SSH_PASS, readyTimeout: 15000 })
```

---

## 5. 已知问题与解决方案

### 问题 1：服务器无法访问 GitHub（443 超时）

**现象**: `git pull` / `git fetch` 报 `Failed to connect to github.com port 443`

**原因**: 阿里云 ECS 安全组未放行到 GitHub 的出站 443 端口

**解决**: 用 `git bundle` 从本地传输

```bash
# 本地：创建 bundle
git bundle create /tmp/erp-update.bundle <服务器HEAD>..HEAD

# 上传到服务器
scp /tmp/erp-update.bundle root@223.6.248.154:/tmp/

# 服务器：应用 bundle
cd /www/wwwroot/ERP
git fetch /tmp/erp-update.bundle
git merge FETCH_HEAD --no-edit
rm -f /tmp/erp-update.bundle
```

**根治方案**: 在阿里云安全组放行 GitHub IP 段（443 端口出站），或配置代理。

---

### 问题 2：npm install/ci 内存不足被 Kill（OOM）

**现象**: `npm ci` 或 `npm install` 进程突然消失，exit code 137

**原因**: 服务器仅 1.8GB 内存，npm 的依赖解析 + 构建脚本消耗过多内存

**解决**: 三步走

```bash
# ① 用 --ignore-scripts 跳过 postinstall（省大量内存）
npm install --ignore-scripts --no-optional

# ② 手动安装 SWC 二进制（--ignore-scripts 跳过了 Next.js 的 postinstall）
npm install @next/swc-linux-x64-gnu@15.5.14 --force --no-save

# ③ 手动执行 postinstall（prisma generate）
node_modules/.bin/prisma generate
```

**注意**: `npm ci` 会先删除 node_modules 再安装，内存峰值更高。`npm install` 增量安装，峰值更低。

---

### 问题 3：recharts 3.x 的 Next.js barrel optimization 构建失败

**现象**: `next build` 报错 `Module not found: Can't resolve 'react-redux'` / `'reselect'` / `'immer'`

**原因**: Next.js 15 的 barrel optimization（`__barrel_optimize__`）处理 recharts 3.x 时，无法正确解析其内部对 react-redux/reselect/immer 的依赖。这是一个平台特定的 bug，在 macOS 上正常，在 Linux (Alibaba Cloud) 上失败。

**解决**: **不在服务器上 build，在本地构建后上传 .next**

```bash
# 本地构建（macOS/Windows/Linux 都行）
npm run build

# 打包上传
tar czf /tmp/next-build.tar.gz .next
scp /tmp/next-build.tar.gz root@223.6.248.154:/tmp/

# 服务器解压
cd /www/wwwroot/ERP
pm2 stop erp
rm -rf .next
tar xzf /tmp/next-build.tar.gz
pm2 restart erp
```

**根治方案**: 在 `next.config.js` 中 pin recharts 到 2.x 或禁用 barrel optimization：

```javascript
// next.config.js — 如果要彻底解决
const nextConfig = {
  // ...existing config
  experimental: {
    optimizePackageImports: [], // 禁用所有包的 barrel optimization
  },
}
```

---

### 问题 4：tsx + Next.js 15 AsyncLocalStorage 崩溃

**现象**: 进程启动后立即崩溃，报 `Error: Invariant: AsyncLocalStorage accessed in runtime where it is not available`

**原因**: tsx 4.x 在 CJS 模式下不初始化 `globalThis.AsyncLocalStorage`，但 Next.js 15 启动时立即访问它。

**解决**: 使用项目自带的修补脚本，在 tsx 启动时通过 `--import` 预加载：

```bash
# ✅ 正确的启动命令
pm2 start tsx --name erp -- --import ./scripts/als-patch.cjs server.ts

# ❌ 错误的启动命令（原 package.json 的 start 脚本）
pm2 start npm --name erp -- start
# 因为 start 脚本是: NODE_ENV=production tsx server.ts（缺少 --import）
```

**修补脚本内容** (`scripts/als-patch.cjs`)：

```javascript
if (typeof globalThis.AsyncLocalStorage === 'undefined') {
  const { AsyncLocalStorage } = require('node:async_hooks')
  globalThis.AsyncLocalStorage = AsyncLocalStorage
}
```

**根治方案**: 修改 `package.json` 的 start 脚本：

```json
{
  "scripts": {
    "start": "NODE_ENV=production tsx --import ./scripts/als-patch.cjs server.ts"
  }
}
```

---

### 问题 5：recharts 缺失 peer dependencies

**现象**: `next build` 报 `Can't resolve 'react-redux'` / `'reselect'` / `'immer'`（即使 barrel optimization 正常）

**原因**: recharts 3.8.0 将 react-redux、reselect、immer 列为 `dependencies` 而非 `peerDependencies`，但 npm hoisting 可能导致它们不在预期位置。

**解决**: 手动安装这些依赖：

```bash
npm install react-redux immer reselect --save
```

---

### 问题 6：SWC 二进制文件损坏

**现象**: `next build` 报 `ELF load command past end of file` 或 SWC 相关错误

**原因**: `npm ci` 被 kill 时 SWC 二进制下载中断，文件不完整

**解决**: 重新安装 SWC 包：

```bash
rm -rf node_modules/@next/swc-linux-x64-*
npm install @next/swc-linux-x64-gnu@15.5.14 --force --no-save
```

---

### 问题 7：PM2 进程崩溃循环

**现象**: PM2 `↺` 重启次数不断增长（如 765 次）

**排查**:

```bash
# 查看完整错误日志
pm2 logs erp --lines 50 --nostream

# 查看进程是否在监听端口
ss -tlnp | grep 3002

# 停止并清除，然后手动启动看实时输出
pm2 stop erp
cd /www/wwwroot/ERP
NODE_ENV=production node_modules/.bin/tsx --import ./scripts/als-patch.cjs server.ts
# 看到错误后 Ctrl+C，修复后再用 pm2 启动
```

---

## 6. 故障排查手册

### 6.1 快速检查清单

```bash
# SSH 到服务器后执行
cd /www/wwwroot/ERP

echo "=== 1. Git 状态 ==="
git log --oneline -3
git status --short

echo "=== 2. PM2 状态 ==="
pm2 list

echo "=== 3. 端口监听 ==="
ss -tlnp | grep 3002

echo "=== 4. 健康检查 ==="
curl -s http://127.0.0.1:3002/api/health

echo "=== 5. 最近日志 ==="
pm2 logs erp --lines 10 --nostream

echo "=== 6. 内存 ==="
free -m

echo "=== 7. .next 目录 ==="
ls -la .next/BUILD_ID 2>&1
```

### 6.2 常见故障对照表

| 现象 | 原因 | 解决 |
|---|---|---|
| `Could not find a production build` | .next 目录不存在 | 重新上传 .next 构建 |
| `AsyncLocalStorage` 报错 | 启动命令缺少 `--import` | 用 `--import ./scripts/als-patch.cjs` |
| `Can't resolve 'react-redux'` | recharts 依赖缺失或 barrel optimization | 本地构建上传 .next |
| `ELF load command past end` | SWC 二进制损坏 | 重新安装 `@next/swc-linux-x64-gnu` |
| curl 返回空响应 (exit 52) | 进程正在崩溃重启循环 | 查看 `pm2 logs` 排查根因 |
| `npm install` 被 kill | 内存不足 | 用 `--ignore-scripts` |
| `git pull` 超时 | 服务器无法访问 GitHub | 用 git bundle |

### 6.3 完全重置（最后手段）

```bash
cd /www/wwwroot/ERP
pm2 stop all && pm2 delete all
rm -rf node_modules .next package-lock.json
git checkout HEAD -- . && git clean -fd

# 从头安装
npm install --ignore-scripts --no-optional
npm install react-redux immer reselect --save
npm install @next/swc-linux-x64-gnu@15.5.14 --force --no-save
node_modules/.bin/prisma generate

# 上传 .next 构建（从本地）
# scp /tmp/next-build.tar.gz root@223.6.248.154:/tmp/
tar xzf /tmp/next-build.tar.gz

# 启动
pm2 start tsx --name erp -- --import ./scripts/als-patch.cjs server.ts
pm2 save
curl http://127.0.0.1:3002/api/health
```

---

## 7. 架构约束备忘

### 7.1 服务器硬性约束

| 约束 | 影响 | 应对 |
|---|---|---|
| 不能访问 GitHub | 无法 git pull/push | git bundle 传输 |
| 1.8GB 内存 | npm ci 会 OOM | --ignore-scripts 分步装 |
| recharts 3.x + Next.js 15 barrel optimization 不兼容 | 服务器上 build 失败 | 本地构建上传 .next |
| tsx 4.x + Next.js 15 AsyncLocalStorage 不兼容 | 启动崩溃 | --import als-patch.cjs |

### 7.2 部署前必检

- [ ] 本地 `npm run build` 通过
- [ ] 本地 `npx tsc --noEmit` 通过
- [ ] 本地 91 个测试全部通过
- [ ] 确认服务器当前 HEAD（用于创建 bundle）
- [ ] .next 构建产物已打包

### 7.3 Git 提交规范

```
<type>(<scope>): <subject>

type: feat / fix / docs / style / refactor / perf / test / chore
scope: customer / admin / portal / api / db / auth / chat / order

示例:
  fix(customer): 客户端底部Tab链接修复
  feat(admin): 新增订单批量导出
  fix(build): 修复构建类型错误，同步服务器部署修复
```

### 7.4 数据库迁移

```bash
# ⚠️ 禁止使用 prisma db push（会误删其他项目表）
# 必须使用 SQL 文件执行：
npx prisma db execute --file prisma/migrations/xxx/migration.sql

# 或在服务器上：
node_modules/.bin/prisma db execute --file prisma/migrations/xxx/migration.sql
```

---

## 附录：部署流程图

```
本地开发
  │
  ├─ git commit + push origin main
  │
  ├─ npm run build（本地构建 .next）
  │     ✅ 本地成功（macOS/Linux/Windows）
  │
  ├─ tar czf next-build.tar.gz .next
  │
  ├─ git bundle create erp-update.bundle <serverHEAD>..HEAD
  │
  ├─ SCP 上传 .next + bundle → 服务器
  │
  ▼
服务器部署
  │
  ├─ git fetch bundle + merge（更新代码）
  │
  ├─ npm install --ignore-scripts（如有 package.json 变更）
  │
  ├─ node_modules/.bin/prisma generate
  │
  ├─ 解压 .next 到项目目录
  │
  ├─ pm2 restart erp
  │     启动命令: tsx --import ./scripts/als-patch.cjs server.ts
  │
  ├─ curl http://127.0.0.1:3002/api/health → {"status":"ok"}
  │
  ▼
  ✅ 部署完成
```

---

*本指南基于 2026-04-12 实际部署过程中遇到的所有问题编写。如遇新问题，请补充到第 5 节。*
