# 华夏签证ERP - 部署工作流操作手册

## 📋 目录

1. [快速开始](#快速开始)
2. [完整部署流程](#完整部署流程)
3. [Git提交规范](#git提交规范)
4. [脚本使用说明](#脚本使用说明)
5. [手动部署](#手动部署)
6. [故障排查](#故障排查)
7. [回滚方案](#回滚方案)

---

## 🚀 快速开始

### 方式一：一键部署（推荐）

```bash
cd /workspace/ERP

# 1. 设置脚本执行权限
chmod +x scripts/push-and-deploy.sh
chmod +x scripts/deploy-complete.py

# 2. 执行一键部署（带提交信息）
./scripts/push-and-deploy.sh "fix(customer): 修复底部Tab导航"

# 或者使用默认提交信息
./scripts/push-and-deploy.sh
```

### 方式二：分步部署

```bash
# 1. 本地验证
npm run type-check
npm run test
npm run build

# 2. Git提交推送
git add -A
git commit -m "feat(admin): 新增数据看板"
git push origin main

# 3. 服务器部署
python3 scripts/deploy-complete.py
```

---

## 📝 完整部署流程

### 第一阶段：代码开发与本地验证

#### 1.1 代码修改
在 `/workspace/ERP` 目录下进行开发：

```
src/
├── shared/          # 公共基础设施
├── modules/erp/     # ERP业务模块
├── components/portal/# 门户组件
└── app/             # 路由
```

#### 1.2 本地验证（必须步骤）

```bash
# 1. TypeScript类型检查
npm run type-check
# ✅ 预期：0 errors

# 2. 运行测试
npm run test
# ✅ 预期：All tests passed

# 3. 构建验证
npm run build
# ✅ 预期：Build successful
```

**验证失败时的处理**：
- 类型错误：修复TypeScript类型问题
- 测试失败：修复测试用例或业务逻辑
- 构建失败：检查代码语法和依赖

---

### 第二阶段：Git提交与推送

#### 2.1 检查Git状态

```bash
git status
git diff  # 查看具体变更
```

#### 2.2 添加变更文件

```bash
# 添加所有变更
git add -A

# 或添加指定文件
git add src/app/api/...
```

#### 2.3 提交代码（遵循规范）

**格式**：`type(scope): description`

**完整示例**：

```bash
# 新功能
git commit -m "feat(portal): 新增首页Hero区域动画"

# 修复Bug
git commit -m "fix(customer): 修复订单详情页加载失败"

# 重构
git commit -m "refactor(api): 优化订单查询性能"

# 代码格式
git commit -m "style: 统一代码缩进格式"

# 文档更新
git commit -m "docs: 更新部署操作手册"

# 配置变更
git commit -m "chore: 更新Tailwind配置"

# 测试相关
git commit -m "test: 添加订单状态流转测试"
```

#### 2.4 推送到GitHub

```bash
# 确保在main分支
git checkout main

# 推送到远程
git push origin main
```

**如果推送失败**：
```bash
# 先拉取远程变更
git pull origin main --rebase

# 解决冲突后继续
git push origin main
```

---

### 第三阶段：服务器部署

#### 3.1 自动化部署（推荐）

```bash
cd /workspace/ERP
python3 scripts/deploy-complete.py
```

**部署脚本执行步骤**：
1. ✅ 连接服务器
2. ✅ 拉取最新代码
3. ✅ 安装依赖 (`npm ci`)
4. ✅ 生成Prisma Client
5. ✅ 构建项目 (`npm run build`)
6. ✅ PM2重启服务
7. ✅ 健康检查
8. ✅ 输出服务状态

#### 3.2 手动部署（备用方案）

```bash
# 1. SSH连接服务器
ssh root@223.6.248.154

# 2. 进入项目目录
cd /www/wwwroot/ERP

# 3. 确保在main分支
git checkout main

# 4. 拉取最新代码
git pull origin main

# 5. 安装依赖
npm ci

# 6. 生成Prisma Client
npx prisma generate

# 7. 构建项目
npm run build

# 8. PM2重启服务
pm2 restart erp

# 9. 健康检查（等待10秒）
sleep 10
curl -s http://localhost:3002/api/health

# 10. 查看服务状态
pm2 list
pm2 logs erp --lines 20
```

---

## 📌 Git提交规范详解

### Type类型

| Type | 说明 | 示例 |
|---|---|---|
| `feat` | 新功能 | `feat(admin): 新增团队管理` |
| `fix` | 修复Bug | `fix(customer): 修复登录状态` |
| `refactor` | 重构（不改变功能） | `refactor(api): 优化用户查询` |
| `style` | 代码格式调整 | `style: 统一导入顺序` |
| `docs` | 文档更新 | `docs: 更新PRD文档` |
| `chore` | 构建/工具/配置变更 | `chore: 更新依赖版本` |
| `test` | 测试相关 | `test: 添加权限测试` |

### Scope模块

| Scope | 说明 |
|---|---|
| `customer` | 客户端 |
| `admin` | 管理端 |
| `portal` | 门户页面 |
| `api` | 后端接口 |
| `db` | 数据库/Prisma |
| `auth` | 认证模块 |
| `chat` | 聊天模块 |
| `order` | 订单模块 |

### Description描述

- 使用现在时态
- 首字母小写
- 简洁明了
- 说明"做了什么"而非"为什么"

---

## 🛠 脚本使用说明

### 1. push-and-deploy.sh（一键脚本）

**位置**: `/workspace/ERP/scripts/push-and-deploy.sh`

**功能**:
- 本地验证（type-check + test + build）
- Git提交与推送
- 调用部署脚本

**用法**:

```bash
# 方式1：带自定义提交信息
./scripts/push-and-deploy.sh "fix(module): description"

# 方式2：使用默认提交信息
./scripts/push-and-deploy.sh
```

**执行流程**:
```
阶段1: 本地验证
  ├─ TypeScript类型检查
  ├─ 运行测试
  └─ 构建验证
阶段2: Git提交
  ├─ 检查状态
  ├─ 添加变更
  └─ 提交代码
阶段3: Git推送
  ├─ 切换到main
  └─ 推送到origin
阶段4: 服务器部署
  └─ 调用deploy-complete.py
```

---

### 2. deploy-complete.py（Python部署脚本）

**位置**: `/workspace/ERP/scripts/deploy-complete.py`

**功能**:
- SSH连接服务器
- Git拉取最新代码
- npm ci安装依赖
- Prisma Client生成
- Next.js构建
- PM2服务重启
- 健康检查
- 状态输出

**配置**:
```python
SERVER = "223.6.248.154"
SSH_PORT = 22
USER = "root"
PASS = "Laogui@900327"
PROJECT_DIR = "/www/wwwroot/ERP"
PM2_NAME = "erp"
```

**用法**:
```bash
python3 scripts/deploy-complete.py
```

---

## 🔧 手动部署详细步骤

### 完整SSH操作流程

```bash
# ==========================================
# 步骤1: 连接服务器
# ==========================================
ssh root@223.6.248.154
# 输入密码: Laogui@900327

# ==========================================
# 步骤2: 进入项目目录
# ==========================================
cd /www/wwwroot/ERP

# ==========================================
# 步骤3: 检查当前分支
# ==========================================
git branch
# 如果不在main，切换:
git checkout main

# ==========================================
# 步骤4: 拉取最新代码
# ==========================================
git pull origin main

# ==========================================
# 步骤5: 安装依赖
# ==========================================
# 使用npm ci确保版本一致
npm ci

# ==========================================
# 步骤6: 生成Prisma Client
# ==========================================
npx prisma generate

# ==========================================
# 步骤7: 构建项目
# ==========================================
npm run build
# 注意: 这步可能需要3-5分钟

# ==========================================
# 步骤8: 重启PM2服务
# ==========================================
pm2 restart erp

# ==========================================
# 步骤9: 验证服务状态
# ==========================================
# 等待服务启动
sleep 10

# 健康检查
curl -s http://localhost:3002/api/health

# 查看PM2状态
pm2 list

# 查看日志
pm2 logs erp --lines 30

# ==========================================
# 步骤10: 退出SSH
# ==========================================
exit
```

---

## 🚨 故障排查

### 常见问题及解决方案

#### 问题1: Git推送被拒绝

**症状**:
```
! [rejected] main -> main (fetch first)
```

**解决**:
```bash
git pull origin main --rebase
# 解决冲突后
git add .
git rebase --continue
git push origin main
```

---

#### 问题2: npm ci安装失败

**症状**:
```
npm ERR! code EINTEGRITY
```

**解决**:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

#### 问题3: 构建失败

**症状**:
```
Build error occurred
```

**解决**:
```bash
# 1. 清除缓存
rm -rf .next

# 2. 重新安装依赖
npm ci

# 3. 重新构建
npm run build

# 4. 查看详细错误
npm run build 2>&1 | head -100
```

---

#### 问题4: PM2服务无法启动

**症状**:
```
errored 状态
```

**解决**:
```bash
# 1. 查看详细日志
pm2 logs erp --lines 50 --nostream

# 2. 检查端口占用
lsof -i :3002
netstat -tulpn | grep 3002

# 3. 停止占用端口的进程
kill -9 <PID>

# 4. 重新启动
pm2 restart erp

# 5. 检查状态
pm2 list
```

---

#### 问题5: 健康检查失败

**症状**:
```
curl: (7) Failed to connect
```

**解决**:
```bash
# 1. 检查服务是否运行
pm2 list

# 2. 查看应用日志
pm2 logs erp --lines 100

# 3. 检查进程
ps aux | grep node

# 4. 手动启动测试
cd /www/wwwroot/ERP
npm run start
# 查看是否有错误输出
```

---

## 🔄 回滚方案

### 快速回滚步骤

#### 场景：部署后发现严重问题

```bash
# ==========================================
# 本地操作
# ==========================================
cd /workspace/ERP

# 1. 查看提交历史
git log --oneline -10

# 2. 回退到上一个稳定版本
# 方式A: 撤销最近一次提交（保留变更）
git reset --soft HEAD~1

# 方式B: 彻底回退（丢弃变更）
git reset --hard HEAD~1

# 3. 强制推送到远程
git push origin main --force

# ==========================================
# 服务器操作
# ==========================================
ssh root@223.6.248.154
cd /www/wwwroot/ERP

# 4. 拉取回滚后的代码
git pull origin main

# 5. 重新部署
npm ci
npx prisma generate
npm run build
pm2 restart erp

# 6. 验证
sleep 10
curl -s http://localhost:3002/api/health
pm2 list
```

---

### 使用Git标签回滚（推荐）

```bash
# ==========================================
# 部署前打标签
# ==========================================
git tag -a v1.0.0 -m "稳定版本"
git push origin v1.0.0

# ==========================================
# 回滚到标签版本
# ==========================================
git checkout v1.0.0
git push origin main --force
```

---

## 📊 部署后验证清单

| 检查项 | 验证方法 | 预期结果 |
|---|---|---|
| 1. Git状态 | `git log -1` | 最新提交已推送 |
| 2. PM2状态 | `pm2 list` | erp为online |
| 3. 健康检查 | `curl http://223.6.248.154:3002/api/health` | `{"status":"ok"}` |
| 4. 网页访问 | 浏览器打开 | 正常显示首页 |
| 5. 登录功能 | 测试登录 | 成功登录 |
| 6. 核心功能 | 订单/资料/通知 | 正常工作 |

---

## 🔐 安全注意事项

### 敏感信息

- ✅ `.env.local` 已在`.gitignore`中
- ✅ 服务器密码仅用于部署脚本
- ✅ 数据库密钥存储在服务器环境变量
- ⚠️ 不要在Git中提交任何密钥或密码

### 定期维护

- 🔄 定期更新依赖包
- 🔄 定期备份数据库
- 🔄 定期更换服务器密码
- 🔄 定期检查PM2日志

---

## 📞 技术支持

部署过程中遇到问题，请检查：

1. **本地日志**: 终端输出
2. **PM2日志**: `pm2 logs erp`
3. **构建日志**: `npm run build` 输出
4. **Git日志**: `git log --oneline`

---

**文档版本**: v1.0  
**最后更新**: 2026-04-08
