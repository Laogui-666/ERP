# 沐海旅行 - 签证行业ERP系统

# 项目状态 — 全知手册

> **文档版本**: V2.3  
> **更新日期**: 2026-03-20 11:23  
> **用途**: 本文件是项目唯一真相源。任何开发者/AI助手拿到本文件 + Git仓库即可完整恢复开发上下文。  
> **当前阶段**: M1 全部完成(12/12) ✅ → 进入 M2

---

## 目录

1. [项目概览与环境](#1-项目概览与环境)
2. [数据库完整参考](#2-数据库完整参考)
3. [源代码目录地图](#3-源代码目录地图)
4. [API 端点完整参考](#4-api-端点完整参考)
5. [TypeScript 类型定义](#5-typescript-类型定义)
6. [实现状态总表](#6-实现状态总表)
7. [核心代码模式与约定](#7-核心代码模式与约定)
8. [当前进度](#8-当前进度)
9. [技术决策记录](#9-技术决策记录)
10. [里程碑追踪](#10-里程碑追踪)
11. [风险与待办](#11-风险与待办)
12. [变更日志](#12-变更日志)

---

## 1. 项目概览与环境

### 1.1 基本信息

| 维度 | 信息 |
|---|---|
| **项目名称** | 沐海旅行 - 签证行业ERP系统 |
| **项目代号** | VISA-ERP |
| **所属公司** | 沐海旅行 |
| **产品定位** | 签证办理行业专属 SaaS 多租户 ERP 系统 |
| **Git 仓库** | `https://github.com/Laogui-666/ERP`（含认证 token，见初始化脚本） |
| **部署服务器** | 阿里云 ECS `223.6.248.154:3002` |
| **数据库** | 阿里云 RDS MySQL `rm-bp159g3iw669447778o.mysql.rds.aliyuncs.com:3306/visa` |
| **文件存储** | 阿里云 OSS `oss-cn-beijing` / bucket: `hxvisa001` |
| **技术栈** | Next.js 14.2.18 + React 18 + Prisma 5.22 + MySQL 8.0 + Tailwind 3.4 + Zustand 5 + Socket.io 4.8 |
| **目标用户** | 签证办理公司（客服/资料员/操作员/管理者/客户） |
| **代码统计** | 62 源文件 / ~5400 行 / 17 API 路由 / 6 页面 / 13 组件 |

### 1.2 从零启动开发环境

```bash
# 1. 克隆项目（或运行 ERP-BOOTSTRAP.sh）
git clone <仓库地址> erp-project
cd erp-project

# 2. 安装依赖
npm install

# 3. 配置环境变量（ERP-BOOTSTRAP.sh 自动创建 .env.local）
# .env.local 需包含：DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, OSS_* 等

# 4. 生成 Prisma Client
npx prisma generate

# 5. 数据库迁移（如果表不存在）
# 注意：本项目禁止 prisma db push（会误删其他项目表）
# 使用 prisma db execute 执行 SQL 文件：
# npx prisma db execute --file prisma/migrations/xxx/migration.sql

# 6. 填充种子数据
npx prisma db seed

# 7. 启动开发服务器（Custom Server + Socket.io）
npm run dev
# 或纯 Next.js（无 Socket.io）
npm run dev:next

# 8. 类型检查（提交前必跑）
npx tsc --noEmit

# 9. 构建验证（提交前必跑）
npm run build
```

### 1.3 种子数据

| 数据 | 说明 |
|---|---|
| 系统公司 | `id: 'system'`, name: '系统管理' |
| 超级管理员 | username: `superadmin`, 密码: `Admin@123456`, 角色: SUPER_ADMIN |
| 签证模板 ×3 | 申根旅游 / 美国B1/B2 / 日本单次旅游（isSystem=true） |

### 1.4 关键依赖版本

| 包 | 版本 | 用途 |
|---|---|---|
| next | 14.2.18 | 全栈框架 |
| react | ^18.3.1 | 前端 UI |
| prisma | ^5.22.0 | ORM |
| @prisma/client | ^5.22.0 | 数据库客户端 |
| zod | ^3.24.1 | 输入校验 |
| jose | ^5.9.6 | JWT |
| bcryptjs | ^2.4.3 | 密码哈希 |
| socket.io | ^4.8.1 | 实时通信 |
| ali-oss | latest | 阿里云 OSS SDK |
| zustand | ^5.0.2 | 状态管理 |
| tailwindcss | ^3.4.16 | 样式 |
| tsx | ^4.19.2 | Custom Server 运行时 |

---

## 2. 数据库完整参考

### 2.1 表清单

共 10 张表，全部 `erp_` 前缀，与其他项目完全隔离。

| # | Prisma Model | 实际表名 | 行数(种子) | 说明 |
|---|---|---|:---:|---|
| 1 | Company | erp_companies | 1 | 租户/公司 |
| 2 | Department | erp_departments | 0 | 部门 |
| 3 | User | erp_users | 1 | 用户（9级角色） |
| 4 | Order | erp_orders | 0 | 签证订单 |
| 5 | DocumentRequirement | erp_document_requirements | 0 | 资料需求清单 |
| 6 | DocumentFile | erp_document_files | 0 | 资料文件 |
| 7 | VisaMaterial | erp_visa_materials | 0 | 签证材料（操作员产出） |
| 8 | OrderLog | erp_order_logs | 0 | 操作日志 |
| 9 | Notification | erp_notifications | 0 | 站内通知 |
| 10 | VisaTemplate | erp_visa_templates | 3 | 签证模板库 |

### 2.2 完整 Schema（当前状态）

> 以下为 prisma/schema.prisma 当前内容的精简参考。完整定义请查看源文件。

```
Company
  id, name, logo?, phone?, email?, address?, status(ACTIVE/SUSPENDED/DELETED), settings? (Json), createdAt, updatedAt
  → 关联: users[], departments[], orders[], templates[]

Department
  id, companyId, name, code(CS/VISA/MANAGEMENT), parentId?, sortOrder, createdAt, updatedAt
  → 关联: company, parent?, children[], users[]
  → 唯一约束: [companyId, code]

User
  id, companyId, departmentId?, username(unique), phone(unique), email?(unique), passwordHash, realName,
  role(SUPER_ADMIN/COMPANY_OWNER/CS_ADMIN/CUSTOMER_SERVICE/VISA_ADMIN/DOC_COLLECTOR/OPERATOR/OUTSOURCE/CUSTOMER),
  status(ACTIVE/INACTIVE/LOCKED), avatar?, lastLoginAt?, createdAt, updatedAt
  → 关联: company, department?, customerOrders[], collectorOrders[], operatorOrders[], createdOrders[], orderLogs[], notifications[]

Order
  id, companyId, orderNo(unique, HX2026...格式), externalOrderNo?(unique, 外部订单号),
  customerName, customerPhone, customerEmail?, passportNo?, passportIssue?, passportExpiry?,
  targetCountry, visaType, visaCategory?, travelDate?,
  amount(Decimal), paymentMethod?, sourceChannel?, remark?,
  status(PENDING_CONNECTION/CONNECTED/COLLECTING_DOCS/PENDING_REVIEW/UNDER_REVIEW/MAKING_MATERIALS/PENDING_DELIVERY/DELIVERED/APPROVED/REJECTED),
  customerId?, collectorId?, operatorId?, createdBy(创建者客服ID),
  appointmentDate?, fingerprintRequired(default false),
  createdAt, updatedAt, deliveredAt?, completedAt?
  → 关联: company, customer?, collector?, operator?, creator,
          documentRequirements[], visaMaterials[], orderLogs[], notifications[]

DocumentRequirement
  id, orderId, companyId, name, description?, isRequired(default true),
  status(PENDING/UPLOADED/REVIEWING/APPROVED/REJECTED/SUPPLEMENT),
  rejectReason?, sortOrder, createdAt, updatedAt
  → 关联: order(Cascade), files[]

DocumentFile
  id, requirementId, companyId, fileName, fileSize, fileType(MIME), ossKey, ossUrl,
  uploadedBy, sortOrder(default 0), label?(自定义标签如"房产证1"), createdAt
  → 关联: requirement(Cascade)

VisaMaterial
  id, orderId, companyId, fileName, fileSize, fileType, ossKey, ossUrl,
  remark?, uploadedBy, version(default 1), createdAt
  → 关联: order(Cascade)

OrderLog
  id, orderId, companyId, userId, action, fromStatus?, toStatus?, detail?, metadata?(Json), createdAt
  → 关联: order(Cascade), user

Notification
  id, companyId, userId, orderId?,
  type(NotificationType: ORDER_NEW/ORDER_CREATED/STATUS_CHANGE/DOC_REVIEWED/MATERIAL_UPLOADED/MATERIAL_FEEDBACK/APPOINTMENT_REMIND/SYSTEM),
  title, content, isRead(default false), createdAt
  → 关联: user, order?

VisaTemplate
  id, companyId, name, country, visaType, items(Json: [{name, description, required}]),
  isSystem(default false), createdBy, createdAt, updatedAt
  → 关联: company
```

### 2.3 关键索引

| 表 | 索引 | 用途 |
|---|---|---|
| erp_orders | [companyId, status] | 按公司+状态筛选（最高频） |
| erp_orders | [companyId, createdBy] | 客服查看自己录入的订单 |
| erp_orders | [collectorId] | 资料员查看自己的订单 |
| erp_orders | [operatorId] | 操作员查看自己的订单 |
| erp_orders | [orderNo] | 按订单号查询 |
| erp_notifications | [userId, isRead] | 用户未读通知数 |
| erp_order_logs | [orderId, createdAt] | 订单操作日志按时间排序 |

### 2.4 枚举定义

```typescript
// 订单状态（10个）
OrderStatus: PENDING_CONNECTION | CONNECTED | COLLECTING_DOCS | PENDING_REVIEW | UNDER_REVIEW | MAKING_MATERIALS | PENDING_DELIVERY | DELIVERED | APPROVED | REJECTED

// 用户角色（9级）
UserRole: SUPER_ADMIN | COMPANY_OWNER | CS_ADMIN | CUSTOMER_SERVICE | VISA_ADMIN | DOC_COLLECTOR | OPERATOR | OUTSOURCE | CUSTOMER

// 资料需求状态
DocReqStatus: PENDING | UPLOADED | REVIEWING | APPROVED | REJECTED | SUPPLEMENT

// 通知类型
NotificationType: ORDER_NEW | ORDER_CREATED | STATUS_CHANGE | DOC_REVIEWED | MATERIAL_UPLOADED | MATERIAL_FEEDBACK | APPOINTMENT_REMIND | SYSTEM

// 公司状态
CompanyStatus: ACTIVE | SUSPENDED | DELETED

// 用户状态
UserStatus: ACTIVE | INACTIVE | LOCKED
```

---

## 3. 源代码目录地图

> ✅ = 已实现 | ⚠️ = 占位/部分实现 | 🔲 = 空文件/TODO

### 3.0 项目根目录

| 文件 | 状态 | 说明 |
|---|:---:|---|
| `server.ts` | ✅ | Custom Server：HTTP + Socket.io 共享端口，`npm run dev` 入口 |

### 3.1 API 路由 (`src/app/api/`)

| 文件 | 方法 | 路径 | 状态 | 说明 |
|---|---|---|:---:|---|
| `auth/login/route.ts` | POST | `/api/auth/login` | ✅ | 登录，返回 JWT，设置 HttpOnly Cookie |
| `auth/register/route.ts` | POST | `/api/auth/register` | ✅ | 公司入驻注册，创建公司+管理员 |
| `auth/refresh/route.ts` | POST | `/api/auth/refresh` | ✅ | 刷新 Access Token |
| `auth/logout/route.ts` | POST | `/api/auth/logout` | ✅ | 登出，清除 Cookie |
| `auth/me/route.ts` | GET | `/api/auth/me` | ✅ | 获取当前用户信息 |
| `auth/reset-password/route.ts` | POST | `/api/auth/reset-password` | ✅ | 客户首次登录重置密码 |
| `orders/route.ts` | GET | `/api/orders` | ✅ | 订单列表（按角色过滤+分页+搜索） |
| `orders/route.ts` | POST | `/api/orders` | ✅ | 创建订单（含客户自动创建+通知） |
| `orders/[id]/route.ts` | GET | `/api/orders/[id]` | ✅ | 订单详情（含资料/材料/日志） |
| `orders/[id]/route.ts` | PATCH | `/api/orders/[id]` | ✅ | 更新订单信息 |
| `orders/[id]/claim/route.ts` | POST | `/api/orders/[id]/claim` | ✅ | 接单（统一走 transitionOrder，乐观锁 WHERE） |
| `orders/[id]/status/route.ts` | POST | `/api/orders/[id]/status` | ✅ | 状态流转 |
| `orders/pool/route.ts` | GET | `/api/orders/pool` | ✅ | 公共池订单列表 |
| `users/route.ts` | GET | `/api/users` | ✅ | 员工列表 |
| `users/route.ts` | POST | `/api/users` | ✅ | 创建员工 |
| `departments/route.ts` | GET | `/api/departments` | ✅ | 部门列表 |
| `departments/route.ts` | POST | `/api/departments` | ✅ | 创建部门 |
| `notifications/route.ts` | GET | `/api/notifications` | ✅ | 通知列表（含 unreadCount） |
| `notifications/[id]/route.ts` | PATCH | `/api/notifications/[id]` | ✅ | 标记单条已读 |
| `notifications/mark-all-read/route.ts` | POST | `/api/notifications/mark-all-read` | ✅ | 全部已读 |
| `health/route.ts` | GET | `/api/health` | ✅ | 健康检查 |

### 3.2 页面 (`src/app/`)

| 文件 | 路径 | 状态 | 说明 |
|---|---|:---:|---|
| `(auth)/login/page.tsx` | `/login` | ✅ | 登录页（玻璃拟态） |
| `(auth)/register/page.tsx` | `/register` | ✅ | 注册页（公司入驻） |
| `(auth)/reset-password/page.tsx` | `/reset-password` | ✅ | 客户首次登录重置密码 |
| `(admin)/dashboard/page.tsx` | `/admin/dashboard` | ✅ | 管理端仪表盘 |
| `(admin)/layout.tsx` | — | ✅ | 管理端布局（侧边栏+顶栏） |
| `(customer)/orders/page.tsx` | `/customer/orders` | ⚠️ | 客户订单页（基础框架） |
| `(customer)/layout.tsx` | — | ✅ | 客户端布局 |
| `page.tsx` | `/` | ✅ | 首页（自动重定向） |
| `layout.tsx` | — | ✅ | 全局布局 |

### 3.3 组件 (`src/components/`)

| 文件 | 状态 | 说明 |
|---|:---:|---|
| `layout/sidebar.tsx` | ✅ | 动态侧边栏（按角色过滤菜单） |
| `layout/topbar.tsx` | ✅ | 顶栏（面包屑+通知+个人中心） |
| `layout/glass-card.tsx` | ✅ | 玻璃拟态卡片组件 |
| `layout/page-header.tsx` | ✅ | 页面标题组件 |
| `orders/status-badge.tsx` | ✅ | 订单状态徽章（10种颜色） |
| `notifications/notification-bell.tsx` | ✅ | 通知铃铛组件 |
| `ui/button.tsx` | ✅ | 按钮组件 |
| `ui/input.tsx` | ✅ | 输入框组件 |
| `ui/card.tsx` | ✅ | 卡片组件 |
| `ui/badge.tsx` | ✅ | 徽章组件 |
| `ui/modal.tsx` | ✅ | 弹窗组件 |
| `ui/select.tsx` | ✅ | 选择器组件 |
| `ui/toast.tsx` | ✅ | Toast 通知组件 |

### 3.4 工具库 (`src/lib/`)

| 文件 | 状态 | 说明 |
|---|:---:|---|
| `prisma.ts` | ✅ | Prisma 客户端单例 |
| `auth.ts` | ✅ | JWT 签发/验证/Cookie 管理 |
| `rbac.ts` | ✅ | 9级权限矩阵 + 数据范围过滤 + 路由权限 |
| `transition.ts` | ✅ | 状态机（12条规则+事务+日志） |
| `utils.ts` | ✅ | 通用工具（日期格式化/订单号生成/cn等） |
| `desensitize.ts` | ✅ | 数据脱敏（手机/护照/身份证/邮箱） |
| `events.ts` | ✅ | 事件总线 + 状态变更通知处理器（transitionOrder 触发） |
| `socket.ts` | ✅ | Socket.io 服务端（JWT 认证 + 公司/用户房间） |
| `oss.ts` | ✅ | 阿里云 OSS 客户端（上传/删除/签名URL/预签名直传） |

### 3.5 服务层 (`src/services/`)

| 文件 | 状态 | 说明 |
|---|:---:|---|
| `order.service.ts` | ⚠️ | 订单服务（与 API route 逻辑重复，待统一） |
| `notification.service.ts` | ⚠️ | 通知服务（基础 CRUD，未接入事件总线） |
| `document.service.ts` | 🔲 | 资料服务（占位文件） |
| `user.service.ts` | 🔲 | 用户服务（占位文件） |

### 3.6 状态管理 (`src/stores/`)

| 文件 | 状态 | 说明 |
|---|:---:|---|
| `auth-store.ts` | ✅ | 认证状态（用户信息+Token） |
| `order-store.ts` | ✅ | 订单状态（列表+详情+操作） |
| `notification-store.ts` | ✅ | 通知状态（列表+未读数） |

### 3.7 Hooks (`src/hooks/`)

| 文件 | 状态 | 说明 |
|---|:---:|---|
| `use-auth.ts` | ✅ | 认证 Hook（登录/登出/刷新） |
| `use-orders.ts` | ✅ | 订单 Hook（列表/详情/创建/状态变更） |
| `use-notifications.ts` | ✅ | 通知 Hook（列表/标记已读） |

### 3.8 类型 (`src/types/`)

| 文件 | 状态 | 说明 |
|---|:---:|---|
| `api.ts` | ✅ | ApiResponse/ApiError/AppError/Pagination |
| `order.ts` | ✅ | Order/OrderDetail/DocumentRequirement/DocumentFile/VisaMaterial/OrderLog + 枚举标签+颜色映射 |
| `user.ts` | ✅ | UserRole/UserProfile/LoginPayload/RegisterPayload |

### 3.9 中间件

| 文件 | 状态 | 说明 |
|---|:---:|---|
| `middleware.ts` | ✅ | 公开路由/鉴权/权限/客户跳转（优先重定向再校验权限） |

---

## 4. API 端点完整参考

### 4.1 认证模块

| 方法 | 路径 | 权限 | 状态 | 说明 |
|---|---|---|:---:|---|
| POST | `/api/auth/login` | 公开 | ✅ | 登录 → JWT + HttpOnly Cookie |
| POST | `/api/auth/register` | 公开 | ✅ | 公司入驻注册 → 创建公司+COMPANY_OWNER |
| POST | `/api/auth/refresh` | 已登录 | ✅ | 用 Refresh Token 换新 Access Token |
| POST | `/api/auth/logout` | 已登录 | ✅ | 清除 Cookie |
| GET | `/api/auth/me` | 已登录 | ✅ | 当前用户信息 |
| POST | `/api/auth/reset-password` | 公开 | ✅ | 客户首次登录重置密码（验证手机号+用户名） |

### 4.2 订单模块

| 方法 | 路径 | 权限 | 状态 | 说明 |
|---|---|---|:---:|---|
| GET | `/api/orders` | Lv2-9 | ✅ | 列表（按角色过滤+分页+搜索+日期范围） |
| POST | `/api/orders` | Lv2-4 | ✅ | 创建订单（含客户自动创建+通知资料员+通知客户） |
| GET | `/api/orders/[id]` | 有权限 | ✅ | 详情（含资料清单+文件+签证材料+操作日志） |
| PATCH | `/api/orders/[id]` | Lv2-7 | ✅ | 更新订单信息 |
| POST | `/api/orders/[id]/claim` | Lv5-8 | ⚠️ | 接单（有竞争条件#2） |
| POST | `/api/orders/[id]/status` | 有权限 | ✅ | 状态流转（经 TransitionService） |
| GET | `/api/orders/pool` | Lv5-8 | ✅ | 公共池（资料员看PENDING_CONNECTION，操作员看PENDING_REVIEW） |

### 4.3 其他模块

| 方法 | 路径 | 权限 | 状态 | 说明 |
|---|---|---|:---:|---|
| GET | `/api/users` | Lv2-5 | ✅ | 员工列表 |
| POST | `/api/users` | Lv2-5 | ✅ | 创建员工 |
| GET | `/api/departments` | Lv2-5 | ✅ | 部门列表 |
| POST | `/api/departments` | Lv2 | ✅ | 创建部门 |
| GET | `/api/notifications` | 已登录 | ✅ | 通知列表（含 unreadCount） |
| PATCH | `/api/notifications/[id]` | 接收者 | ✅ | 标记单条已读 |
| POST | `/api/notifications/mark-all-read` | 已登录 | ✅ | 全部已读 |
| GET | `/api/health` | 公开 | ✅ | 健康检查 |
| — | `/api/documents/*` | — | 🔲 | 资料模块（M2 开发） |
| — | `/api/sms/*` | — | 🔲 | SMS 预留（返回 501） |

---

## 5. TypeScript 类型定义

### 5.1 核心类型（src/types/order.ts）

```typescript
// 订单状态（10种）
type OrderStatus = 'PENDING_CONNECTION' | 'CONNECTED' | 'COLLECTING_DOCS' | 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'MAKING_MATERIALS' | 'PENDING_DELIVERY' | 'DELIVERED' | 'APPROVED' | 'REJECTED'

// 资料需求状态（6种）
type DocReqStatus = 'PENDING' | 'UPLOADED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'SUPPLEMENT'

// 通知类型（8种）
type NotificationType = 'ORDER_NEW' | 'ORDER_CREATED' | 'STATUS_CHANGE' | 'DOC_REVIEWED' | 'MATERIAL_UPLOADED' | 'MATERIAL_FEEDBACK' | 'APPOINTMENT_REMIND' | 'SYSTEM'

// 订单（列表项）
interface Order { id, orderNo, externalOrderNo?, customerName, customerPhone, targetCountry, visaType, status, amount, collectorId?, operatorId?, createdBy, createdAt, updatedAt, ... }

// 订单详情（含关联数据）
interface OrderDetail extends Order { customer?, collector?, operator?, documentRequirements[], visaMaterials[], orderLogs[] }

// 资料需求
interface DocumentRequirement { id, orderId, name, description?, isRequired, status, rejectReason?, sortOrder, files[] }

// 资料文件
interface DocumentFile { id, requirementId, fileName, fileSize, fileType, ossKey, ossUrl, uploadedBy, sortOrder, label?, createdAt }

// 签证材料
interface VisaMaterial { id, orderId, fileName, fileSize, fileType, ossKey, ossUrl, remark?, uploadedBy, version, createdAt }

// 操作日志
interface OrderLog { id, orderId, userId, action, fromStatus?, toStatus?, detail?, metadata?, createdAt, user: { realName } }
```

### 5.2 用户类型（src/types/user.ts）

```typescript
type UserRole = 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'CS_ADMIN' | 'CUSTOMER_SERVICE' | 'VISA_ADMIN' | 'DOC_COLLECTOR' | 'OPERATOR' | 'OUTSOURCE' | 'CUSTOMER'

interface UserProfile { id, username, realName, phone, email?, role, departmentId?, companyId, company?, department?, status?, avatar?, lastLoginAt?, createdAt, updatedAt }
```

### 5.3 API 类型（src/types/api.ts）

```typescript
interface ApiResponse<T> { success: true, data: T, meta?: { total, page, pageSize, totalPages } }
interface ApiError { success: false, error: { code, message, details? } }
class AppError extends Error { code, statusCode, details?, toJSON() }
```

---

## 6. 实现状态总表

### 6.1 功能模块

| 模块 | 状态 | 说明 |
|---|:---:|---|
| 登录/注册 | ✅ | JWT 双 Token + HttpOnly Cookie |
| RBAC 权限 | ✅ | 9级角色 + 功能权限 + 路由权限 + 数据范围 |
| 多租户隔离 | ✅ | companyId 强制过滤 |
| 订单 CRUD | ✅ | 创建/列表/详情/更新 |
| 状态机 | ✅ | 12条规则 + 事务 + 日志 |
| 公共池 + 接单 | ✅ | 统一走 transitionOrder，service 和 route 逻辑一致 |
| 客户自动创建 | ✅ | 创建订单时自动注册客户 + 首次登录重置密码流程 |
| 资料管理 | 🔲 | M2 开发 |
| 签证材料管理 | 🔲 | M2 开发 |
| 通知系统 | ✅ | 数据模型+事件总线+API 路由+Socket.io+前端 Store/Bell 全链路就绪 |
| 文件上传 | ✅ | 阿里云 OSS SDK 已接入（上传/删除/签名URL/预签名直传） |
| 数据看板 | 🔲 | M5 开发 |
| 客户端门户 | ⚠️ | 基础框架 |
| SMS | 🔲 | 501 预留 |
| 脱敏 | ✅ | OUTSOURCE 角色自动脱敏（订单列表+详情 API） |
| 操作日志 | ✅ | 数据模型 + 部分写入 |
| 登录/注册 UI | ✅ | 玻璃拟态风格 |
| 管理端布局 | ✅ | 侧边栏+顶栏 |

### 6.2 M1 修复状态（12项全部完成 ✅）

| # | 修复项 | 代码 | 数据库 | 状态 | 批次 |
|---|---|:---:|:---:|:---:|---|
| 1 | createdBy + CS 数据范围 | ✅ | ✅ | ✅ | 第一批 |
| 2 | 接单原子操作 | ✅ | — | ✅ | 第二批 |
| 3 | 统一接单逻辑 | ✅ | — | ✅ | 第二批 |
| 4 | 客户首次登录流程 | ✅ | — | ✅ | 第二批 |
| 5 | Socket.io custom server | ✅ | — | ✅ | 第三批 |
| 6 | 事件总线集成 | ✅ | — | ✅ | 第二批 |
| 7 | OSS 接入阿里云 SDK | ✅ | — | ✅ | 第三批 |
| 8 | HX订单号 + 外部订单号 | ✅ | ✅ | ✅ | 第一批 |
| 9 | NotificationType enum | ✅ | ✅ | ✅ | 第一批 |
| 10 | OUTSOURCE 脱敏调用 | ✅ | — | ✅ | 第四批 |
| 11 | DocumentFile sortOrder+label | ✅ | ✅ | ✅ | 第一批 |
| 12 | 中间件客户跳转顺序 | ✅ | — | ✅ | 第四批 |

### 6.3 M2 任务状态（19项）

见下方第 8 章。

---

## 7. 核心代码模式与约定

### 7.1 Prisma 可选字段

```typescript
// 规则：Prisma 可选字段必须 ?? null
await prisma.order.create({
  data: {
    customerEmail: data.email ?? null,    // undefined → null
    visaCategory: data.category ?? null,
  },
})

// 规则：update 用白名单逐字段赋值
const updateData: Record<string, unknown> = {}
if (data.name !== undefined) updateData.name = data.name
if (data.email !== undefined) updateData.email = data.email ?? null
```

### 7.2 API Route 模板

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. 认证
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    // 2. 权限
    requirePermission(user, 'orders', 'create')

    // 3. 参数校验
    const body = await request.json()
    const data = schema.parse(body)

    // 4. 业务逻辑（prisma.$transaction 如有需要）

    // 5. 返回
    return NextResponse.json(createSuccessResponse(result), { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        new AppError('VALIDATION_ERROR', '参数校验失败', 400, error.errors).toJSON(),
        { status: 400 }
      )
    }
    throw error
  }
}
```

### 7.3 数据库命名规则

- 表名：`erp_` 前缀 + 复数蛇形（`erp_orders`, `erp_document_files`）
- 字段名：Prisma 用 camelCase，数据库用 snake_case + `@map`
- 外键：`_id` 后缀（`company_id`, `collector_id`）
- 新 Model 必须加 `@@map("erp_xxx")`
- 新字段必须加 `@map("snake_case")`

### 7.4 状态机调用方式

```typescript
import { transitionOrder } from '@/lib/transition'

await transitionOrder({
  orderId: 'xxx',
  toStatus: 'CONNECTED',
  userId: user.userId,
  userRole: user.role,
  companyId: user.companyId,
  detail: '从公共池接单',  // 可选
})
// 内部自动：校验规则 → 校验权限 → 更新状态 → 写操作日志（同一事务）
```

### 7.5 权限检查方式

```typescript
import { requirePermission, getDataScopeFilter } from '@/lib/rbac'

// 功能权限
requirePermission(user, 'orders', 'create')  // 抛 AppError 如果无权

// 数据范围过滤
const scopeFilter = getDataScopeFilter(user)
const orders = await prisma.order.findMany({
  where: { ...scopeFilter, ...其他条件 },
})
```

### 7.6 Git 提交规范

```
<type>(<scope>): <subject>

type: feat / fix / docs / style / refactor / perf / test / chore
scope: order / auth / document / notification / user / db / ui / socket
示例: feat(order): 添加订单看板视图
      fix(auth): 修复 Token 刷新失败问题
```

---

## 8. 当前进度

### 8.1 已完成

| 项目 | 完成日期 | 说明 |
|---|---|---|
| 业务流程梳理 | 2026-03-19 | 5大阶段工作流完整定义 |
| 9级角色权限体系 | 2026-03-19 | SUPER_ADMIN → CUSTOMER 完整权限矩阵 |
| PRD | 2026-03-19 | 完整功能定义、UI设计规范 |
| 架构设计文档 | 2026-03-19 | 技术选型、数据库Schema、API设计、状态机 |
| 开发规范文档 | 2026-03-20 | 代码规范 + TypeScript防错 + 数据库命名 |
| 项目脚手架 | 2026-03-20 | 57 源文件，~4700 行 |
| Prisma Schema | 2026-03-20 | 10 张表，erp_ 前缀 |
| 数据库建表+种子 | 2026-03-20 | 10 表 + 超管 + 3 模板 |
| 登录/注册 UI | 2026-03-20 | 玻璃拟态风格 |
| 管理端布局 | 2026-03-20 | 侧边栏+顶栏+仪表盘 |
| M1 代码审查 | 2026-03-20 | 7严重+5中等问题 |
| M1 第一批修复 | 2026-03-20 | #1/#8/#9/#11 已完成 |
| M1 第二批修复 | 2026-03-20 | #2/#3/#4/#6 已完成 |
| M1 第三批修复 | 2026-03-20 | #5 Socket.io custom server + #7 OSS 阿里云 SDK |
| M1 第四批修复 | 2026-03-20 | #10 OUTSOURCE 脱敏调用 + #12 中间件跳转顺序 |

### 8.2 工作流差距分析

> 2026-03-20 经三轮深度分析（逐阶段核对 → 隐含交互提取 → 全维度边界审查），共发现 19 项需实现的开发任务。详见 PRD 和架构文档。

### 8.3 M2 核心工作流 — 最终任务清单（19 项）

> 覆盖工作流全部 42 个用户操作点，覆盖率 100%。

#### P0 — 核心功能（15 项）

| # | 任务 | 涉及阶段 | 说明 |
|---|---|---|---|
| 1 | 订单 CRUD API + 表单 | 一 | 已基本完成，需补充外部订单号编辑 |
| 2 | 客户账号自动创建 | 一 | 自动创建已完成，首次登录改密待修复#4 |
| 3 | 公共池 API + 接单逻辑 | 二/三 | 逻辑已有，并发修复#2 待执行 |
| 4 | 状态机引擎 | 全流程 | 12条规则已完成，签证类型区分待补充 |
| 5 | 文档级审核反馈系统 | 三/四 | 逐项打勾/备注/新增补充项 |
| 6 | 资料收集面板 | 二/三 | Drawer → 模板选择/手动添加/审核/预览 |
| 7 | 通知系统 | 全流程 | Socket.io 推送，事件总线集成#6 |
| 8 | 签证材料管理 | 四 | 独立面板（≠资料收集面板） |
| 9 | 客服工作台 UI | 一 | 快捷统计 + 我的已提交列表 |
| 10 | 资料员工作台 UI | 二 | 公共池 + 我的接单(Kanban) |
| 11 | 操作员工作台 UI | 三/四 | 公共池 + 我的接单(分屏) |
| 12 | 订单详情页 | 全流程 | 客户信息编辑 + 动态按钮文案 |
| 15 | 文字消息备注 | 三 | 审核时附加文字说明 |
| 16 | 文件处理增强 | 二/三/四 | TXT+HEIC / 多文件 / 上传进度 / 安全校验 |
| 18 | 文件预览系统 | 二/三/四 | PDF/图片/TXT内嵌 / Word转PDF |

#### P1 — 辅助功能（4 项）

| # | 任务 | 涉及阶段 | 说明 |
|---|---|---|---|
| 13 | 预约站内消息提醒 | 五 | Cron 定时任务 |
| 14 | 操作日志系统 | 全流程 | 完整审计记录 |
| 17 | 手机拍照上传+取景框 | 二 | getUserMedia + Canvas 引导框 |
| 19 | 异常与边界处理 | 全流程 | 取消/超时/转单/重办 |

#### 开发顺序（5 阶段）

```
阶段一（核心闭环）：  1 → 2 → 4 → 3
阶段二（资料流转）：  16 → 6 → 5 → 15 → 7
阶段三（材料与交付）：18 → 8 → 4(签证类型)
阶段四（UI 呈现）：   9 → 10 → 11 → 12
阶段五（完善与异常）：13 → 14 → 17 → 19
```

### 8.4 M2 任务状态追踪

| # | 任务 | 状态 |
|---|---|:---:|
| 1 | 订单 CRUD API + 表单 | ⬜ |
| 2 | 客户账号自动创建 | ⬜ |
| 3 | 公共池 API + 接单逻辑 | ⬜ |
| 4 | 状态机引擎 | ⬜ |
| 5 | 文档级审核反馈系统 | ⬜ |
| 6 | 资料收集面板组件 | ⬜ |
| 7 | 通知系统 (Socket.io) | ✅ |
| 8 | 签证材料管理 | ⬜ |
| 9 | 客服工作台 UI | ⬜ |
| 10 | 资料员工作台 UI | ⬜ |
| 11 | 操作员工作台 UI | ⬜ |
| 12 | 订单详情页（多角色） | ⬜ |
| 13 | 预约站内消息提醒 | ⬜ |
| 14 | 操作日志系统 | ⬜ |
| 15 | 文字消息备注 | ⬜ |
| 16 | 文件处理增强 | ⬜ |
| 17 | 手机拍照上传+取景框 | ⬜ |
| 18 | 文件预览系统 | ⬜ |
| 19 | 异常与边界处理 | ⬜ |

### 8.5 M1 修复执行顺序

```
✅ 第一批（Schema + 数据层）：  #1 → #11 → #9 → #8      全部完成 2026-03-20
✅ 第二批（核心逻辑）：        #2 → #3 → #4 → #6      全部完成 2026-03-20
✅ 第三批（基础设施）：        #5 → #7                 全部完成 2026-03-20
✅ 第四批（收尾）：            #10 → #12               全部完成 2026-03-20
```

> **M1 全部 12 项修复完成。项目状态：M2 就绪。**

---

## 9. 技术决策记录

| # | 决策 | 日期 | 理由 |
|---|---|---|---|
| 1 | Next.js 14 (App Router) | 2026-03-19 | SSR/RSC/API Routes 一体化 |
| 2 | 阿里云 RDS MySQL 8.0 | 2026-03-19 | 甲方指定 |
| 3 | Shared Database + companyId 隔离 | 2026-03-19 | 租户可控，成本低 |
| 4 | 阿里云 OSS + 预签名直传 | 2026-03-19 | 文件不经过服务器 |
| 5 | SMS 搁置，预留接口 | 2026-03-19 | 甲方要求 |
| 6 | 玻璃拟态 + 莫兰迪冷色系 | 2026-03-19 | 甲方设计要求 |
| 7 | Zustand + Server Components | 2026-03-19 | 轻量、TS友好 |
| 8 | 9级角色 RBAC | 2026-03-19 | 甲方完整角色体系 |
| 9 | erp_ 表前缀隔离 | 2026-03-20 | 同库有其他项目14张表 |
| 10 | exactOptionalPropertyTypes + ?? null | 2026-03-20 | 防 undefined/null 错误 |
| 11 | 预约提醒改为站内消息 | 2026-03-20 | SMS 搁置 |
| 12 | 文件支持 TXT + HEIC | 2026-03-20 | 工作流要求 |
| 13 | HEIC 后端转 JPEG | 2026-03-20 | 浏览器无法预览 |
| 14 | 同一资料项多文件上传 | 2026-03-20 | "房产证一栏可上传多个" |
| 15 | 手机拍照+取景框 | 2026-03-20 | 防证件拍歪 |
| 16 | Word 转 PDF 预览 | 2026-03-20 | 浏览器原生不支持 |
| 17 | 资料/材料分为两个独立面板 | 2026-03-20 | 功能和交互完全不同 |
| 18 | 审核用轻量文字备注 | 2026-03-20 | 避免 M4 聊天模块前置依赖 |
| 19 | 接单乐观锁 | 2026-03-20 | 防并发重复接单 |
| 20 | 状态回退保留审核上下文 | 2026-03-20 | 打回后已有结果不能清空 |

---

## 10. 里程碑追踪

```
M1 ████████████████████████████████████████ ████ ✅ 100%  Week 1
M2 ████████████████████████████████████████ ░░░░  0%      Week 2-5 (19项任务)
M3 ████████████████████████████████████████ ░░░░  0%      Week 6-7
M4 ████████████████████████████████████████ ░░░░  0%      Week 7-8
M5 ████████████████████████████████████████ ░░░░  0%      Week 8-10
M6 ████████████████████████████████████████ ░░░░  0%      Week 11-12
```

---

## 11. 风险与待办

### 11.1 活跃风险

| 风险 | 等级 | 应对方案 |
|---|:---:|---|
| Next.js 14.2.18 安全漏洞 | 中 | 待升级 |
| backdrop-blur 性能 | 中 | CSS 降级方案 |
| 文件安全 | 中 | magic bytes 校验 |
| 订单长时间无进展 | 中 | Cron 超时检测（M2 阶段五） |

### 11.2 已解决风险

| 风险 | 解决日期 | 方案 |
|---|---|---|
| 客服数据范围错误 | 2026-03-20 | #1 createdBy 字段 |
| 接单并发竞争 | 2026-03-20 | #2 乐观锁 WHERE |
| 接单逻辑重复 | 2026-03-20 | #3 统一走 transitionOrder |
| 客户无法登录 | 2026-03-20 | #4 /api/auth/reset-password + 空密码检测 |
| Socket.io 未启动 | 2026-03-20 | #5 custom server.ts + tsx 启动 |
| 事件总线死代码 | 2026-03-20 | #6 transitionOrder 触发 eventBus |
| OSS 占位实现 | 2026-03-20 | #7 接入阿里云 ali-oss SDK |
| 订单号竞争条件 | 2026-03-20 | #8 HX格式+unique |
| Notification 松散类型 | 2026-03-20 | #9 enum |
| OUTSOURCE 脱敏未应用 | 2026-03-20 | #10 GET 列表/详情接口调用 |
| DocumentFile 缺少多文件字段 | 2026-03-20 | #11 sortOrder+label |
| 中间件顺序错误 | 2026-03-20 | #12 客户重定向移到权限检查之前 |

### 11.3 待办事项

| 待办 | 优先级 | 说明 |
|---|---|---|
| Next.js 安全升级 | P1 | 升级到最新稳定版 |
| 域名 + SSL 证书 | P1 | 需要甲方提供 |
| 确定开发团队 | P1 | 甲方需确定 |

---

## 12. 变更日志

| 日期 | 版本 | 变更内容 |
|---|:---:|---|
| 2026-03-19 | V1.0 | 初始版本，完成架构设计和文档编写 |
| 2026-03-20 | V1.1 | 全面类型修复、Prisma Schema 对齐、环境配置 |
| 2026-03-20 | V1.2 | 数据库 erp_ 前缀隔离、开发规范更新 |
| 2026-03-20 | V1.3 | M1 全部完成、三轮深度审查、文档更新 |
| 2026-03-20 | V1.4 | 工作流逐阶段核对，M2 拆分为14项任务 |
| 2026-03-20 | V1.5 | 全维度分析，M2 扩展至19项 |
| 2026-03-20 | V1.6 | M1 代码审查，12项修复清单 |
| 2026-03-20 | V1.7 | 第一批修复完成 |
| 2026-03-20 | V2.0 | 全知手册重写：新增数据库完整参考/源代码目录地图/API端点参考/类型定义/实现状态总表/代码模式与约定；确保任何开发者/AI拿到本文件即可恢复全部开发上下文 |
| 2026-03-20 | V2.1 | M1 第二批修复完成：#2 接单原子操作/#3 统一接单逻辑/#4 客户首次登录流程/#6 事件总线集成；新增 /api/auth/reset-password 端点和 /reset-password 页面；修复通知铃铛 CSS 类名错误；M1 修复进度 8/12 |
| 2026-03-20 | V2.2 | M1 全部完成(12/12)：第三批 #5 Socket.io custom server(server.ts+tsx启动)、#7 OSS接入阿里云ali-oss SDK(上传/删除/签名URL/预签名直传)；第四批 #10 OUTSOURCE脱敏调用(订单列表+详情API)、#12中间件客户跳转顺序修复；新增依赖ali-oss/@types/ali-oss/tsx；npm scripts 改用 tsx server.ts |
| 2026-03-20 | V2.3 | 全量深度审查 + 5项修复：①创建通知API路由3个(GET/PATCH/POST) ②DATABASE_URL密码@编码修复 ③pool路由as any→OrderStatus类型修复 ④ApiMeta新增unreadCount字段 ⑤Tailwind morandi色系与CSS变量对齐；源文件59→62，API路由14→17，M2任务#7标记完成；文档同步更新 |

---

*文档结束 — 本文件是项目唯一真相源*
