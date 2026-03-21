# 沐海旅行 - 签证行业ERP系统

# 项目状态 — 全知手册

> **文档版本**: V7.0  
> **更新日期**: 2026-03-22 03:45  
> **用途**: 本文件是项目唯一真相源。任何开发者/AI助手拿到本文件 + Git仓库即可完整恢复开发上下文。  
> **当前阶段**: M1 ✅ → M2 ✅ → **M5 批次1-7完成（批次8待开发）**  

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
| **代码统计** | 90 源文件 / ~10106 行 / 30 API 路由 / 15 页面 / 22 组件 |

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

| # | Prisma Model | 实际表名 | 说明 |
|---|---|---|---|
| 1 | Company | erp_companies | 租户/公司 |
| 2 | Department | erp_departments | 部门 |
| 3 | User | erp_users | 用户（9级角色） |
| 4 | Order | erp_orders | 签证订单（含12个M5扩展字段） |
| 5 | Applicant | erp_applicants | 申请人（M5已实现） |
| 6 | DocumentRequirement | erp_document_requirements | 资料需求清单 |
| 7 | DocumentFile | erp_document_files | 资料文件 |
| 8 | VisaMaterial | erp_visa_materials | 签证材料（操作员产出） |
| 9 | OrderLog | erp_order_logs | 操作日志 |
| 10 | Notification | erp_notifications | 站内通知 |
| 11 | VisaTemplate | erp_visa_templates | 签证模板库 |

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
  status(PENDING_CONNECTION/CONNECTED/COLLECTING_DOCS/PENDING_REVIEW/UNDER_REVIEW/MAKING_MATERIALS/PENDING_DELIVERY/DELIVERED/APPROVED/REJECTED/PARTIAL),
  customerId?, collectorId?, operatorId?, createdBy(创建者客服ID),
  appointmentDate?, fingerprintRequired(default false),
  // M5 多申请人
  applicantCount(Int, default 1), contactName?(VARCHAR50), targetCity?(VARCHAR50),
  // M5 流程时间线
  submittedAt?(DateTime), visaResultAt?(DateTime),
  // M5 财务明细
  platformFeeRate?(Decimal 5,4), platformFee?(Decimal 10,2), visaFee?(Decimal 10,2),
  insuranceFee?(Decimal 10,2), rejectionInsurance?(Decimal 10,2), reviewBonus?(Decimal 10,2),
  grossProfit?(Decimal 10,2),
  createdAt, updatedAt, deliveredAt?, completedAt?
  → 关联: company, customer?, collector?, operator?, creator,
          applicants[], documentRequirements[], visaMaterials[], orderLogs[], notifications[]

Applicant
  id, orderId, companyId,
  name(VARCHAR50), phone?(VARCHAR20), passportNo?(VARCHAR20), passportExpiry?(DateTime),
  visaResult?(APPROVED/REJECTED), visaResultAt?(DateTime), visaResultNote?(Text),
  documentsComplete(Boolean, default false), sortOrder(Int, default 0),
  createdAt, updatedAt
  → 关联: order(Cascade)
  → 索引: [orderId], [companyId]

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
// 订单状态（11个，含 PARTIAL）
OrderStatus: PENDING_CONNECTION | CONNECTED | COLLECTING_DOCS | PENDING_REVIEW | UNDER_REVIEW | MAKING_MATERIALS | PENDING_DELIVERY | DELIVERED | APPROVED | REJECTED | PARTIAL

// 用户角色（9级）
UserRole: SUPER_ADMIN | COMPANY_OWNER | CS_ADMIN | CUSTOMER_SERVICE | VISA_ADMIN | DOC_COLLECTOR | OPERATOR | OUTSOURCE | CUSTOMER

// 签证结果（M5已实现）
VisaResult: APPROVED | REJECTED

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
| `scripts/import-excel.ts` | ✅ | 历史数据导入脚本：合并单元格检测+列模糊匹配+日期转换+支付标准化+dry-run |

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
| `orders/[id]/claim/route.ts` | POST | `/api/orders/[id]/claim` | ✅ | 接单（统一走 transitionOrder） |
| `orders/[id]/status/route.ts` | POST | `/api/orders/[id]/status` | ✅ | 状态流转 |
| `orders/[id]/documents/route.ts` | GET | `/api/orders/[id]/documents` | ✅ | 资料清单 |
| `orders/[id]/documents/route.ts` | POST | `/api/orders/[id]/documents` | ✅ | 批量添加资料需求项 |
| `orders/[id]/materials/route.ts` | GET | `/api/orders/[id]/materials` | ✅ | 签证材料列表 |
| `orders/[id]/materials/route.ts` | POST | `/api/orders/[id]/materials` | ✅ | 上传签证材料（自动版本号+状态流转） |
| `orders/pool/route.ts` | GET | `/api/orders/pool` | ✅ | 公共池订单列表 |
| `documents/[id]/route.ts` | PATCH | `/api/documents/[id]` | ✅ | 审核资料（合格/修改/补充） |
| `documents/[id]/route.ts` | DELETE | `/api/documents/[id]` | ✅ | 删除资料需求 |
| `documents/upload/route.ts` | POST | `/api/documents/upload` | ✅ | 上传文件到 OSS（类型白名单+大小校验） |
| `users/route.ts` | GET | `/api/users` | ✅ | 员工列表 |
| `users/route.ts` | POST | `/api/users` | ✅ | 创建员工 |
| `departments/route.ts` | GET | `/api/departments` | ✅ | 部门列表 |
| `departments/route.ts` | POST | `/api/departments` | ✅ | 创建部门 |
| `notifications/route.ts` | GET | `/api/notifications` | ✅ | 通知列表（含 unreadCount） |
| `notifications/[id]/route.ts` | PATCH | `/api/notifications/[id]` | ✅ | 标记单条已读 |
| `notifications/mark-all-read/route.ts` | POST | `/api/notifications/mark-all-read` | ✅ | 全部已读 |
| `health/route.ts` | GET | `/api/health` | ✅ | 健康检查 |
| `orders/[id]/cancel/route.ts` | POST | `/api/orders/[id]/cancel` | ✅ | 取消订单（终态标记+通知） |
| `orders/[id]/reassign/route.ts` | POST | `/api/orders/[id]/reassign` | ✅ | 转单（角色校验+通知目标用户） |
| `cron/appointment-remind/route.ts` | POST | `/api/cron/appointment-remind` | ✅ | 预约提醒（24h内预约通知） |
| `cron/timeout-check/route.ts` | POST | `/api/cron/timeout-check` | ✅ | 超时检测（5级超时规则预警） |
| `applicants/[id]/route.ts` | PATCH | `/api/applicants/[id]` | ✅ | 更新申请人结果/资料状态+autoResolveOrderStatus |
| `analytics/overview/route.ts` | GET | `/api/analytics/overview` | ✅ | 核心指标概览 |
| `analytics/trend/route.ts` | GET | `/api/analytics/trend` | ✅ | 月度趋势（原生SQL GROUP BY） |
| `analytics/workload/route.ts` | GET | `/api/analytics/workload` | ✅ | 人员负荷/绩效排行 |
| `analytics/export/route.ts` | GET | `/api/analytics/export` | ✅ | Excel导出（23列+多人行合并） |
| `orders/[id]/reassign/route.ts` | POST | `/api/orders/[id]/reassign` | ✅ | 转单（角色校验+通知目标用户） |
| `cron/appointment-remind/route.ts` | POST | `/api/cron/appointment-remind` | ✅ | 预约提醒（24h内预约通知） |
| `cron/timeout-check/route.ts` | POST | `/api/cron/timeout-check` | ✅ | 超时检测（5级超时规则预警） |

### 3.2 页面 (`src/app/`)

| 文件 | 路径 | 状态 | 说明 |
|---|---|:---:|---|
| `(auth)/login/page.tsx` | `/login` | ✅ | 登录页（玻璃拟态） |
| `(auth)/register/page.tsx` | `/register` | ✅ | 注册页（公司入驻） |
| `(auth)/reset-password/page.tsx` | `/reset-password` | ✅ | 客户首次登录重置密码 |
| `admin/dashboard/page.tsx` | `/admin/dashboard` | ✅ | 管理端仪表盘（核心指标+快捷操作+工作流） |
| `admin/orders/page.tsx` | `/admin/orders` | ✅ | 订单管理（列表/筛选/搜索/分页+新建订单表单） |
| `admin/orders/[id]/page.tsx` | `/admin/orders/[id]` | ✅ | 订单详情（信息展示+状态流转+资料面板+材料面板） |
| `admin/pool/page.tsx` | `/admin/pool` | ✅ | 公共池（卡片式展示+一键接单） |
| `admin/workspace/page.tsx` | `/admin/workspace` | ✅ | 我的工作台（快捷统计+订单列表） |
| `admin/templates/page.tsx` | `/admin/templates` | ⚠️ | 签证模板（M6 占位） |
| `admin/team/page.tsx` | `/admin/team` | ⚠️ | 团队管理（M5 占位） |
| `admin/analytics/page.tsx` | `/admin/analytics` | ⚠️ | 数据统计（M5 占位） |
| `admin/settings/page.tsx` | `/admin/settings` | ⚠️ | 系统设置（占位） |
| `admin/layout.tsx` | — | ✅ | 管理端布局（侧边栏+顶栏） |
| `customer/orders/page.tsx` | `/customer/orders` | ✅ | 客户订单页（真实API对接+状态进度条） |
| `customer/layout.tsx` | — | ✅ | 客户端布局 |
| `page.tsx` | `/` | ✅ | 首页（自动重定向） |
| `layout.tsx` | — | ✅ | 全局布局 |

> **路由结构**：使用实际路径段 `admin/` 和 `customer/`（非路由组），确保 URL 路径与文件结构一致。

### 3.3 组件 (`src/components/`)

| 文件 | 状态 | 说明 |
|---|:---:|---|
| `layout/sidebar.tsx` | ✅ | 动态侧边栏（按角色过滤菜单） |
| `layout/topbar.tsx` | ✅ | 顶栏（面包屑+通知+个人中心） |
| `layout/glass-card.tsx` | ✅ | 玻璃拟态卡片组件 |
| `layout/page-header.tsx` | ✅ | 页面标题组件（支持返回链接+action插槽） |
| `orders/status-badge.tsx` | ✅ | 订单状态徽章（11种颜色，含PARTIAL） |
| `orders/applicant-card.tsx` | ✅ | 申请人卡片（资料状态+出签/拒签标记+拒签备注） |
| `orders/applicant-form-item.tsx` | ✅ | 申请人表单项（姓名/手机/护照号+动态增删） |
| `documents/document-panel.tsx` | ✅ | 资料面板（需求列表+添加+多文件上传+拍照+审核+文件预览一体化） |
| `documents/material-panel.tsx` | ✅ | 签证材料面板（上传+版本分组+文件预览+HEIC支持） |
| `notifications/notification-bell.tsx` | ✅ | 通知铃铛组件 |
| `analytics/stat-card.tsx` | ✅ | 核心指标卡片 |
| `analytics/trend-chart.tsx` | ✅ | 月度趋势折线图（recharts） |
| `analytics/ranking-table.tsx` | ✅ | 绩效排行表格 |
| `ui/button.tsx` | ✅ | 按钮组件 |
| `ui/input.tsx` | ✅ | 输入框组件 |
| `ui/card.tsx` | ✅ | 卡片组件 |
| `ui/badge.tsx` | ✅ | 徽章组件 |
| `ui/modal.tsx` | ✅ | 弹窗组件 |
| `ui/select.tsx` | ✅ | 选择器组件 |
| `ui/toast.tsx` | ✅ | Toast 通知组件 |
| `ui/file-preview.tsx` | ✅ | 文件预览组件（图片/PDF/TXT内嵌预览+全屏灯箱+下载） |
| `ui/camera-capture.tsx` | ✅ | 手机拍照组件（前后置切换+证件取景引导框） |

### 3.4 工具库 (`src/lib/`)

| 文件 | 状态 | 说明 |
|---|:---:|---|
| `prisma.ts` | ✅ | Prisma 客户端单例 |
| `auth.ts` | ✅ | JWT 签发/验证/Cookie 管理 |
| `rbac.ts` | ✅ | 9级权限矩阵 + 数据范围过滤 + 路由权限 |
| `transition.ts` | ✅ | 状态机（14条规则+事务+日志+autoResolveOrderStatus自动终态） |
| `utils.ts` | ✅ | 通用工具（日期格式化/订单号生成/cn/calcPlatformFee/calcGrossProfit） |
| `desensitize.ts` | ✅ | 数据脱敏（手机/护照/身份证/邮箱） |
| `events.ts` | ✅ | 事件总线 + 状态变更通知处理器（11个状态标签含PARTIAL） |
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
| `order.ts` | ✅ | Order(+M5扩展12字段)/OrderDetail(+applicants)/Applicant/DocumentRequirement/DocumentFile/VisaMaterial/OrderLog + 枚举标签+颜色映射 |
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
| PATCH | `/api/orders/[id]` | Lv2-7 | ✅ | 更新订单信息（含M5财务字段白名单） |
| POST | `/api/orders/[id]/claim` | Lv5-8 | ✅ | 接单（统一走 transitionOrder） |
| POST | `/api/orders/[id]/status` | 有权限 | ✅ | 状态流转（含PARTIAL手动推进） |
| GET | `/api/orders/pool` | Lv5-8 | ✅ | 公共池（资料员看PENDING_CONNECTION，操作员看PENDING_REVIEW） |

### 4.3 资料模块

| 方法 | 路径 | 权限 | 状态 | 说明 |
|---|---|---|:---:|---|
| GET | `/api/orders/[id]/documents` | 有权限 | ✅ | 资料清单（含文件列表） |
| POST | `/api/orders/[id]/documents` | Lv5-7 | ✅ | 批量添加资料需求项 |
| PATCH | `/api/documents/[id]` | Lv5-7 | ✅ | 审核资料（APPROVED/REJECTED/SUPPLEMENT） |
| DELETE | `/api/documents/[id]` | Lv2,5-7 | ✅ | 删除资料需求（级联删除文件） |
| POST | `/api/documents/upload` | 有权限 | ✅ | 上传文件（类型白名单+大小校验+OSS） |

### 4.4 签证材料模块

| 方法 | 路径 | 权限 | 状态 | 说明 |
|---|---|---|:---:|---|
| GET | `/api/orders/[id]/materials` | Lv5-7,9 | ✅ | 签证材料列表（按版本降序） |
| POST | `/api/orders/[id]/materials` | Lv5,7 | ✅ | 上传签证材料（自动版本号+状态流转PENDING_DELIVERY） |

### 4.5 其他模块

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
| — | `/api/sms/*` | — | 🔲 | SMS 预留（返回 501） |

### 4.6 申请人模块（M5）

| 方法 | 路径 | 权限 | 状态 | 说明 |
|---|---|---|:---:|---|
| PATCH | `/api/applicants/[id]` | Lv5-7 | ✅ | 更新申请人结果/资料状态（含autoResolveOrderStatus） |

### 4.7 数据分析模块（M5）

| 方法 | 路径 | 权限 | 状态 | 说明 |
|---|---|---|:---:|---|
| GET | `/api/analytics/overview` | Lv1-3,5 | ✅ | 核心指标概览（总订单/营收/毛利/出签率/分布） |
| GET | `/api/analytics/trend` | Lv1-3,5 | ✅ | 月度趋势（原生SQL GROUP BY） |
| GET | `/api/analytics/workload` | Lv1-3,5 | ✅ | 人员负荷/绩效排行 |
| GET | `/api/analytics/export` | Lv1-3,5 | ✅ | Excel导出（23列+多人行合并） |

---

## 5. TypeScript 类型定义

### 5.1 核心类型（src/types/order.ts）

```typescript
// 订单状态（10种）
type OrderStatus = 'PENDING_CONNECTION' | 'CONNECTED' | 'COLLECTING_DOCS' | 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'MAKING_MATERIALS' | 'PENDING_DELIVERY' | 'DELIVERED' | 'APPROVED' | 'REJECTED' | 'PARTIAL'

// 签证结果（M5新增）
type VisaResult = 'APPROVED' | 'REJECTED'

// 申请人（M5已实现）
interface Applicant {
  id: string; orderId: string; name: string; phone: string | null;
  passportNo: string | null; passportExpiry: string | null;
  visaResult: VisaResult | null; visaResultAt: string | null;
  visaResultNote: string | null; documentsComplete: boolean;
  sortOrder: number; createdAt: string; updatedAt: string
}

// 资料需求状态（6种）
type DocReqStatus = 'PENDING' | 'UPLOADED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'SUPPLEMENT'

// 通知类型（8种）
type NotificationType = 'ORDER_NEW' | 'ORDER_CREATED' | 'STATUS_CHANGE' | 'DOC_REVIEWED' | 'MATERIAL_UPLOADED' | 'MATERIAL_FEEDBACK' | 'APPOINTMENT_REMIND' | 'SYSTEM'

// 订单（列表项）
interface Order { id, orderNo, externalOrderNo?, customerName, customerPhone, targetCountry, visaType, status, amount, collectorId?, operatorId?, createdBy, createdAt, updatedAt, ...,
  // M5扩展
  applicantCount: number, contactName: string | null, targetCity: string | null,
  submittedAt: string | null, visaResultAt: string | null,
  platformFeeRate: string | null, platformFee: string | null, visaFee: string | null,
  insuranceFee: string | null, rejectionInsurance: string | null, reviewBonus: string | null,
  grossProfit: string | null }

// 订单详情（含关联数据）
interface OrderDetail extends Order { customer?, collector?, operator?, applicants: Applicant[], documentRequirements[], visaMaterials[], orderLogs[] }

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
| 订单 CRUD | ✅ | 创建/列表/详情/更新 + 新建订单表单 |
| 状态机 | ✅ | 14条规则（含2条PARTIAL）+ 事务 + 日志 + 取消订单 + autoResolveOrderStatus |
| 公共池 + 接单 | ✅ | 统一走 transitionOrder，卡片式接单 UI，排除已接单 |
| 客户自动创建 | ✅ | 创建订单时自动注册客户 + 首次登录重置密码流程 |
| 资料管理 | ✅ | API（需求/审核/多文件上传）+ DocumentPanel + FilePreview |
| 签证材料管理 | ✅ | API（上传/版本/状态流转）+ MaterialPanel + FilePreview |
| 通知系统 | ✅ | 数据模型+事件总线+API路由+中文通知内容+Socket.io+前端全链路 |
| 文件上传 | ✅ | 阿里云 OSS SDK（上传/删除/签名URL/预签名直传/HEIC支持） |
| 文件预览 | ✅ | FilePreview 组件（图片/PDF/TXT 内嵌预览+全屏灯箱） |
| 手机拍照 | ✅ | CameraCapture 组件（前后置切换+证件取景引导框） |
| 转单 | ✅ | POST /api/orders/[id]/reassign + 角色校验 + 通知目标用户 |
| 取消订单 | ✅ | POST /api/orders/[id]/cancel + 终态标记 + 通知相关人员 |
| 预约提醒 | ✅ | POST /api/cron/appointment-remind + Cron 定时任务 |
| 超时检测 | ✅ | POST /api/cron/timeout-check + 5级超时规则 + 管理员通知 |
| 订单管理 UI | ✅ | 列表/筛选/搜索/分页/新建表单 |
| 订单详情 UI | ✅ | 信息展示+状态流转+取消+转单+资料面板+材料面板+操作日志 |
| 公共池 UI | ✅ | 卡片式展示+一键接单+并发安全 |
| 我的工作台 UI | ✅ | 快捷统计+订单列表 |
| 数据看板 | ⚠️ | 仪表盘框架（M5 接入真实数据） |
| 客户端门户 | ✅ | 真实API对接+订单列表+状态进度条 |
| SMS | 🔲 | 501 预留 |
| 脱敏 | ✅ | OUTSOURCE 角色自动脱敏（订单列表+详情 API） |
| 操作日志 | ✅ | 数据模型 + 全流程写入（创建/状态/审核/上传） |
| 登录/注册 UI | ✅ | 玻璃拟态风格 |
| 管理端布局 | ✅ | 侧边栏+顶栏（9个菜单项+角色过滤） |
| **M5：Applicant 数据模型** | **✅** | **erp_applicants 表 + VisaResult 枚举 + PARTIAL 状态 + Order 12 扩展字段** |
| **M5：autoResolveOrderStatus** | **✅** | **多人自动终态判断（全部出签/全部拒签/部分出签）** |
| **M5：财务自动计算** | **✅** | **calcPlatformFee + calcGrossProfit** |
| **M5：订单创建多人支持** | **✅** | **POST /api/orders 支持 applicants 数组 + 财务字段** |
| **M5：申请人 API** | **✅** | **PATCH /api/applicants/[id] + autoResolveOrderStatus + 通知** |
| **M5：前端多申请人** | **✅** | **ApplicantCard组件 + ApplicantFormItem组件 + 创建表单扩展 + 详情页扩展** |
| **M5：数据看板** | **✅** | **4个analytics API + 3个图表组件 + 完整看板页面** |
| **M5：订单详情财务展示** | **✅** | **财务明细区块 + PARTIAL状态流转 + 送签城市/递交日期** |
| **M5：Excel 导出** | **✅** | **GET /api/analytics/export (23列+多人行合并)** |
| **M5：Excel 导入** | **✅** | **批次7：scripts/import-excel.ts 脚本 — 合并单元格检测+列模糊匹配+日期转换+支付标准化+dry-run** |
| **M5：资料面板分组** | **🔲** | **批次8：applicantCount>1 时按人分组** |

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
| M1 全量深度审查 | 2026-03-20 | 逐文件审查 62 个源文件 + schema + 配置，发现 6 个问题 |
| M1 第五批修复 | 2026-03-20 | 见下方 8.6，6 个问题全部修复，tsc 0 错误 + build 通过 |
| M2 阶段一：核心闭环 | 2026-03-20 | 订单管理页+详情页+公共池+工作台+创建订单表单+状态流转弹窗 |
| M2 阶段二：资料流转 | 2026-03-20 | 文档API(需求/审核/上传)+材料API+DocumentPanel+MaterialPanel |
| M2 阶段三：完善与异常 | 2026-03-21 | 文件预览+拍照+预约提醒+转单+超时检测+取消订单 |
| M2 全部完成 | 2026-03-21 | 19/19 任务完成，84源文件/9225行 |
| M5 批次1：类型+Schema+迁移 | 2026-03-21 | Applicant Model + Order 12字段 + PARTIAL + VisaResult + 迁移SQL |
| M5 批次2：后端核心逻辑 | 2026-03-21 | autoResolveOrderStatus + 2条PARTIAL规则 + 财务计算函数 |
| M5 全面排查修复 | 2026-03-22 | 3项修复：PARTIAL筛选/进度条/??null |

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

| # | 任务 | 状态 | 说明 |
|---|---|:---:|---|
| 1 | 订单 CRUD API + 表单 | ✅ | 4个API + 订单管理页 + 新建订单弹窗 |
| 2 | 客户账号自动创建 | ✅ | POST /api/orders 内含自动注册+通知 |
| 3 | 公共池 API + 接单逻辑 | ✅ | pool API + claim API + 公共池卡片UI |
| 4 | 状态机引擎 | ✅ | 12条规则 + 事务 + 日志 + 订单详情页动态按钮+取消按钮 |
| 5 | 文档级审核反馈系统 | ✅ | PATCH /api/documents/[id] + DocumentPanel 审核表单 |
| 6 | 资料收集面板组件 | ✅ | DocumentPanel（需求/添加/多文件上传/拍照/审核/预览） |
| 7 | 通知系统 (Socket.io) | ✅ | 事件总线 + 状态变更中文通知 + 材料/审核专项通知 |
| 8 | 签证材料管理 | ✅ | Materials API + MaterialPanel（上传/版本分组/文件预览） |
| 9 | 客服工作台 UI | ✅ | workspace 页面（快捷统计 + 订单列表） |
| 10 | 资料员工作台 UI | ✅ | 公共池页面 + workspace 页面 |
| 11 | 操作员工作台 UI | ✅ | 公共池页面 + workspace 页面 |
| 12 | 订单详情页（多角色） | ✅ | 信息展示 + 动态状态按钮 + 取消 + 资料面板 + 材料面板 |
| 13 | 预约站内消息提醒 | ✅ | POST /api/cron/appointment-remind + Cron 任务已注册 |
| 14 | 操作日志系统 | ✅ | 全流程写入（创建/接单/状态/审核/上传/取消/转单） |
| 15 | 文字消息备注 | ✅ | 审核时填写 rejectReason + 状态流转 detail 字段 |
| 16 | 文件处理增强 | ✅ | 多文件上传 + 进度条 + 客户端大小预校验 + HEIC 支持 |
| 17 | 手机拍照上传+取景框 | ✅ | CameraCapture 组件（前后置切换+护照/证件引导框） |
| 18 | 文件预览系统 | ✅ | FilePreview 组件（图片/PDF/TXT 内嵌预览+全屏灯箱） |
| 19 | 异常与边界处理 | ✅ | 取消订单API + 转单API + 超时检测Cron + 5级超时规则 |

### 8.5 M1 修复执行顺序

```
✅ 第一批（Schema + 数据层）：  #1 → #11 → #9 → #8      全部完成 2026-03-20
✅ 第二批（核心逻辑）：        #2 → #3 → #4 → #6      全部完成 2026-03-20
✅ 第三批（基础设施）：        #5 → #7                 全部完成 2026-03-20
✅ 第四批（收尾）：            #10 → #12               全部完成 2026-03-20
✅ 第五批（全量审查修复）：     6 项安全/逻辑/性能修复    全部完成 2026-03-20
```

> **M1 全部修复完成。项目状态：M2 就绪。**

### 8.6 M1 第五批修复（全量深度审查）

| # | 优先级 | 文件 | 问题 | 修复 |
|---|---|---|---|---|
| 1 | 🔴 P0 | `api/users/route.ts` | `as any` 绕过角色枚举校验 → 权限提升漏洞 | zod 改为 `z.enum([...合法角色...])`，移除 `as any` |
| 2 | 🔴 P0 | `api/orders/pool/route.ts` | 公共池未排除已接订单 → 重复接单 | 加 `collectorId: null` / `operatorId: null` |
| 3 | 🔴 P0 | `api/orders/route.ts` POST | 客户查询缺 companyId → 跨公司数据泄露 | 加 `companyId + role: 'CUSTOMER'` |
| 4 | 🔴 P0 | `register/page.tsx` | 手机号 zod 校验不完整 → 无效号码 | zod 加 `.regex(/^1[3-9]\d{9}$/)` + 前端 `pattern` + `maxLength` |
| 5 | 🟡 P1 | `middleware.ts` | getCurrentUser 调用两次 → 性能浪费 | 函数开头统一调用一次 |
| 6 | 🟡 P1 | `api/orders/route.ts` GET | 列表查询多余关联 → 多余 LEFT JOIN | 移除 select 中的 collector/operator 关联 |

> 详细修复计划见 `docs/m1-fix-plan.md`

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
M2 ████████████████████████████████████████ ████ ✅ 100%  Week 2 (19/19 任务完成)
M3 ████████████████████████████████████████ ░░░░  0%      Week 6-8
M4 ████████████████████████████████████████ ░░░░  0%      Week 9-10
M5 ████████████████████████████████████████ ▓▓▓▓  90%     Week 11-13 (批次1-7完成，8待开发)
M6 ████████████████████████████████████████ ░░░░  0%      Week 14-15
```

### M5 多申请人 + 数据看板 — 最终任务清单（8 批次）

> 基于用户实际 Excel 统计表深度分析（5.5MB / 15 工作表 / 2718 行 / 330 单月订单 / 多人占比 33.5%），实现多申请人支持 + 财务统计 + 数据看板 + Excel 导出 + 历史数据迁移。

**关键架构决策**：
- PARTIAL 状态不走 `transitionOrder()`，走独立 `autoResolveOrderStatus()` 函数
- 创建订单 API 向后兼容：`applicants` 可选，不传自动创建 1 人
- 趋势查询用原生 SQL GROUP BY（1 次查询搞定多月聚合）
- Excel 导入检测 B 列合并单元格识别多人订单
- 支付方式 13 种标准化为 5 种

#### 批次 1：类型+Schema+迁移（2h）

| 任务 | 文件 | 说明 |
|---|---|---|
| Applicant 类型定义 | `src/types/order.ts` | +Applicant 接口 +PARTIAL +Order 扩展 12 字段 |
| Schema 扩展 | `prisma/schema.prisma` | +Applicant model +Order 12 字段 +PARTIAL 枚举 +VisaResult 枚举 |
| 数据库迁移 | `prisma migrate` | 新建 erp_applicants 表 + Order 扩展 |
| 状态标签 | `src/lib/events.ts` | +PARTIAL 中文标签 |
| 状态徽章 | `src/components/orders/status-badge.tsx` | +PARTIAL variant |

#### 批次 2：后端核心（2h）

| 任务 | 文件 | 说明 |
|---|---|---|
| 自动终态判断 | `src/lib/transition.ts` | +autoResolveOrderStatus +2 条 PARTIAL 手动规则 |
| 财务计算 | `src/lib/utils.ts` | +calcPlatformFee +calcGrossProfit |

#### 批次 3：订单 API 扩展（2h）

| 任务 | 文件 | 说明 |
|---|---|---|
| 创建订单 | `src/app/api/orders/route.ts` (POST) | +applicants 可选 +财务计算 +创建 Applicant |
| 订单详情 | `src/app/api/orders/[id]/route.ts` (GET) | +include applicants |
| 更新订单 | `src/app/api/orders/[id]/route.ts` (PATCH) | +财务字段白名单 |

#### 批次 4：申请人 API（1.5h）

| 任务 | 文件 | 说明 |
|---|---|---|
| 申请人更新 | `src/app/api/applicants/[id]/route.ts` | 新建，含 autoResolveOrderStatus 调用 |

#### 批次 5：前端多申请人（3h）

| 任务 | 文件 | 说明 |
|---|---|---|
| 申请人卡片 | `src/components/orders/applicant-card.tsx` | 新组件 |
| 申请人表单项 | `src/components/orders/applicant-form-item.tsx` | 新组件 |
| 创建表单 | `src/app/admin/orders/page.tsx` | +申请人动态列表 +财务字段 |
| 详情页 | `src/app/admin/orders/[id]/page.tsx` | +申请人卡片 +PARTIAL case +结果标记 |

#### 批次 6：数据看板（4h）

| 任务 | 文件 | 说明 |
|---|---|---|
| 概览 API | `src/app/api/analytics/overview/route.ts` | 新建 |
| 趋势 API | `src/app/api/analytics/trend/route.ts` | 新建（原生 SQL GROUP BY） |
| 人员负荷 API | `src/app/api/analytics/workload/route.ts` | 新建 |
| 导出 API | `src/app/api/analytics/export/route.ts` | 新建（23 列 + 多人行合并） |
| 指标卡片 | `src/components/analytics/stat-card.tsx` | 新建 |
| 趋势折线图 | `src/components/analytics/trend-chart.tsx` | 新建（recharts） |
| 绩效排行 | `src/components/analytics/ranking-table.tsx` | 新建 |
| 看板页面 | `src/app/admin/analytics/page.tsx` | 完全重写 |

#### 批次 7：Excel 导入（3h）

| 任务 | 文件 | 说明 |
|---|---|---|
| 导入脚本 | `scripts/import-excel.ts` | 合并单元格检测 + 列映射 + 月份推断 + dry-run |

#### 批次 8：资料面板分组 + 验收（1.5h）

| 任务 | 文件 | 说明 |
|---|---|---|
| 资料分组 | `src/components/documents/document-panel.tsx` | applicantCount>1 时分组展示 |
| 全量验收 | — | tsc 0 错误 + build 通过 |

**总工作量：~19 小时（2.5 天）**

---

## 11. 风险与待办

### 11.1 活跃风险

| 风险 | 等级 | 应对方案 |
|---|:---:|---|
| Next.js 14.2.18 安全漏洞 | 中 | 待升级 |
| backdrop-blur 性能 | 中 | CSS 降级方案 |
| 文件安全 | 中 | magic bytes 校验 |
| Excel 导入文件流兼容 | 低 | 导出后验证文件可打开 |

### 11.2 已解决风险

| 风险 | 解决日期 | 方案 |
|---|---|---|
| PARTIAL 与状态机架构冲突 | 2026-03-21 | 独立 autoResolveOrderStatus 函数，不走 transitionOrder |
| 创建订单向后兼容 | 2026-03-21 | applicants 可选，不传自动创建 1 人 |
| 趋势查询性能 | 2026-03-21 | 原生 SQL GROUP BY，1 次查询 |
| Excel 合并单元格解析 | 2026-03-21 | B 列合并范围检测算法 |
| cancel API 兼容 PARTIAL | 2026-03-21 | PARTIAL 不在终态列表，自动兼容 |
| Excel 列名不统一 | 2026-03-21 | 模糊匹配 + 跳过异常表（1月表） |
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
| 2026-03-20 | V2.4 | M1第五批修复（全量深度审查6项）：①用户角色注入漏洞(z.enum替代as any) ②公共池排除已接订单(collectorId/operatorId: null) ③客户查询加companyId防跨租户 ④注册手机号zod正则校验 ⑤中间件去重(getCurrentUser调用一次) ⑥订单列表移除多余关联查询；新增docs/m1-fix-plan.md；tsc 0错误+build通过 |
| 2026-03-20 | V2.5 | M2阶段一+二开发完成（13/19任务）：**阶段一** 订单管理页(列表/筛选/搜索/分页+新建订单表单)、订单详情页(信息展示+状态流转+动态按钮)、公共池页面(卡片式+一键接单)、我的工作台(统计+订单列表)；**阶段二** 文档API(GET/POST需求+PATCH审核+POST上传)、材料API(GET/POST上传+自动版本+状态流转)、DocumentPanel组件(需求/添加/上传/审核)、MaterialPanel组件(上传/版本/列表)；路由结构调整admin//customer实际路径段；页面5→14，源文件62→76，代码5371→7762行，API 17→21；其余页面占位(模板/团队/统计/设置)；tsc 0错误+build通过 |
| 2026-03-21 | V2.6 | 全量深度审查+5项Bug修复：①ToastProvider缺失(全局包裹) ②订单详情流转按钮预选修复 ③DATABASE_URL @编码 ④注释修正 ⑤通知面板hover修复；客户页面重写为真实API对接；清理as never/as any转型；Socket.io CORS端口修正 |
| 2026-03-21 | V2.7 | M2第三批次开发(6/6任务完成)：①#18文件预览系统(FilePreview组件-图片/PDF/TXT内嵌预览+全屏灯箱) ②#16文件处理增强(多文件上传+进度条+客户端大小校验+HEIC) ③#13预约站内消息提醒(cron/appointment-remind+Cron任务注册) ④#19转单API(orders/[id]/reassign) ⑤#19超时检测(cron/timeout-check+5级超时规则)；修复Cron路由被中间件拦截；修复timeout-check as never转型 |
| 2026-03-21 | V3.0 | M2全部完成(19/19)：①#17手机拍照+取景框(CameraCapture组件-前后置切换+护照引导框) ②#19取消订单API(orders/[id]/cancel+详情页取消按钮+确认弹窗) ③终审+工作流文档深度比对：修复通知内容英文状态码→中文映射、材料上传通知逻辑扩展(首次/修改均通知+通知客户)、客户端页面重写为真实API；最终统计84源文件/9225行/25API路由/14页面/17组件；tsc 0错误/as never 0残留/TODO 0残留 |
| 2026-03-21 | V4.0 | M5全知手册V2.0：基于用户实际Excel文件(5.5MB/15工作表/2718行/330单月订单)深度探针分析；发现8个关键偏差(表头在第2行/合并单元格检测/1月表格式不同/支付方式13种/扣点格式不统一/无出签结果列/订单号多值/8-9月缺财务列)；确定10项架构决策(PARTIAL独立函数/联系人≠申请人/创建API向后兼容/趋势原生SQL等)；M5拆分为8批次19h；全部10个风险标记为已解决；更新01-PRD/02-architecture/03-project-status/04-dev-standards |
| 2026-03-21 | V5.0 | 文档全面更新：数据库表清单10→11(Applicant)、枚举加PARTIAL+VisaResult、里程碑追踪改为8批次执行计划、已解决风险新增6项M5风险、变更日志同步；四份项目文档+M5手册统一版本号V4.0/V5.0 |
| 2026-03-22 | V5.1 | M5批次1+2完成：①Schema扩展(Applicant Model+Order 12字段+PARTIAL枚举+VisaResult枚举) ②TypeScript类型(Applicant接口+Order扩展+OrderDetail加applicants) ③迁移SQL ④autoResolveOrderStatus自动终态判断+2条PARTIAL手动流转规则 ⑤财务计算(calcPlatformFee+calcGrossProfit) ⑥事件标签+状态徽章加PARTIAL ⑦全面排查修复3项(订单列表PARTIAL筛选/客户页面PARTIAL进度/??null)；源文件79→79/8425行；tsc 0错误；文档全部更新至最新 |
| 2026-03-22 | V6.0 | M5批次3-6完成+全面深度审查：**批次3** POST/api/orders支持applicants+财务字段、GET详情返回applicants、PATCH支持M5字段+自动重算毛利；**批次4** PATCH/api/applicants/[id]含autoResolveOrderStatus+通知；**批次5** ApplicantCard组件+ApplicantFormItem组件+创建表单扩展(申请人动态列表+财务预览)+详情页扩展(申请人卡片+PARTIAL流转+财务明细)；**批次6** 4个analytics API(overview/trend/workload/export)+3个图表组件(StatCard/TrendChart/RankingTable)+完整数据看板页面；**修复** DATABASE_URL密码缺失、客户端登出、next.config.js、UpdateOrderPayload死代码清理；源文件89/10049行/30 API路由；tsc 0错误；build通过无警告 |
| 2026-03-22 | V7.0 | 两轮全面深度审查+10项修复：**第一轮**(P0/P1×4) ①DATABASE_URL密码丢失(.env.local+bootstrap脚本heredoc编码bug) ②auth/me返回数据不完整(补status/createdAt/updatedAt) ③login API company格式不一致(string→object) ④死代码注释清理；**优化**(×4) ⑤Dashboard接入analytics API真实数据+使用共享StatCard ⑥file-preview.tsx的`<img>`→`<Image />`+next.config.js配置OSS remotePatterns ⑦topbar面包屑支持子路由(新增getBreadcrumb函数) ⑧删除Dashboard本地重复StatCard定义；**第二轮**(P1×2) ⑨register API company格式统一为{id,name}对象 ⑩reset-password API company格式统一+补全phone/email/avatar/lastLoginAt字段；源文件89/10106行；tsc 0错误；build通过0 Warning；as any/console.log/TODO/死代码全部为0 |
| 2026-03-22 | V7.1 | M5批次7完成：scripts/import-excel.ts历史数据导入脚本(20KB)。功能：①Excel全表读取+跳过异常表(1月表) ②第2行表头+列名模糊匹配(23列→ERP字段) ③B列合并单元格检测→多人订单识别 ④Excel序列号日期→JS Date转换 ⑤支付方式13种→5种标准化 ⑥平台扣点"6.1%"→0.061转换 ⑦dry-run模式预览前5个订单 ⑧正式导入自动建立姓名→userId映射 ⑨事务写入Order+Applicant+OrderLog ⑩导入后验证计数；源文件90/10106行；tsc 0错误；build通过 |

---

*文档结束 — 本文件是项目唯一真相源*
