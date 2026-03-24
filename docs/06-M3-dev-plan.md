# 沐海旅行 ERP - M3 全知开发手册（V6.0 终版）

> **文档版本**: V6.0
> **更新日期**: 2026-03-25 01:50
> **用途**: M3 阶段唯一开发指南。即使丢失所有上下文，拿到本文件 + Git 仓库即可完整恢复开发。
> **前置条件**: M1 ✅ + M2 ✅ + M5 ✅ 全部完成（102 源文件 / 11518 行 / 30 API 路由 / 15 页面 / 23 组件 / 74 测试用例）
> **核心交付**: 客户端门户完整可用 + 两类资料交互闭环 + 实时通信接入 + 全链路通知闭环
> **分析基础**: 三轮深度分析（逐文件审查全部 102 个源文件 + 30 个 API 路由 + 工作流文档 + 客户材料清单 + 实际工作流比对）+ 批次2专项两轮审查（20个关键文件）

---

## 目录

1. [M3 总览](#1-m3-总览)
2. [前置条件与环境](#2-前置条件与环境)
3. [现有资产清单（可直接复用）](#3-现有资产清单)
4. [两类资料流向深度分析](#4-两类资料流向深度分析)
5. [工作流逐阶段核对](#5-工作流逐阶段核对)
6. [全链路通知矩阵](#6-全链路通知矩阵)
7. [两轮深度分析发现的 7 个缺口](#7-两轮深度分析发现的-7-个缺口)
8. [架构决策（10 项）](#8-架构决策)
9. [批次 1 完成状态](#9-批次-1-完成状态)
10. [批次 2：A 类资料上传核心（M3-5 ~ M3-8 + M3-19 + M3-23 + M3-24）](#10-批次-2a-类资料上传核心)
11. [批次 3：B 类材料 + 详情页 + 确认提交 + 出签反馈](#11-批次-3b-类材料--详情页--确认提交--出签反馈)
12. [批次 4：通知 + Socket](#12-批次-4通知--socket)
13. [批次 5：个人中心](#13-批次-5个人中心)
14. [批次 6：通知闭环 + 管理端增强](#14-批次-6通知闭环--管理端增强)
15. [批次 7：全量验收](#15-批次-7全量验收)
16. [文件变更全量清单](#16-文件变更全量清单)
17. [执行计划（8 批次 / 25h）](#17-执行计划)
18. [验收标准](#18-验收标准)
19. [风险矩阵](#19-风险矩阵)
20. [开发 Checklist](#20-开发-checklist)

---

## 1. M3 总览

### 1.1 目标

| 目标 | 说明 |
|---|---|
| 客户端门户完整可用 | 订单详情、A 类资料上传、B 类材料下载、通知中心、个人中心、出签结果反馈 |
| A 类资料交互闭环 | 资料员发送清单 → 客户逐项上传 → 确认提交 → 资料员审核 → 补充循环 |
| B 类材料交付闭环 | 操作员上传 → 资料员确认 → 状态已交付 → 客户下载 |
| 通知全链路打通 | 9 个通知节点全部触发 + Socket.io 客户端实时接入 |
| 客户材料清单适配 | 12 类材料说明文字展示 + 预选机制 + 多文件上传 |

### 1.2 当前项目状态

| 维度 | 状态 |
|---|---|
| M1 基础架构 | ✅ 100% |
| M2 核心工作流 | ✅ 100% (19/19) |
| M5 多申请人+看板 | ✅ 100% (8/8 批次) |
| M3 文件与客户端 | 🔄 12.5%（批次 1/8 完成，批次 2 分析完成待开发） |

### 1.3 代码规模

| 维度 | 数量 |
|---|---|
| 源文件 | 102 个 |
| 代码行数 | 11,518 行 |
| API 路由 | 30 个 |
| 页面 | 15 个 |
| 组件 | 23 个 |
| 测试文件 | 4 个（74 用例） |
| Hooks | 3 个 |
| Stores | 3 个 |
| 工具库 | 11 个 |

### 1.4 关键文件位置速查

```
erp-project/                                    ← 项目根目录
├── prisma/schema.prisma                        ← 数据库 Schema（含 DOCS_SUBMITTED 待加）
├── server.ts                                   ← Custom Server（HTTP + Socket.io 共享端口）
├── src/
│   ├── app/
│   │   ├── customer/                           ← M3 主战场
│   │   │   ├── layout.tsx                      ← ✅已改：3个Tab + 未读角标轮询
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx                    ← ✅已改：Link可点击 + 待办提示 + 多人标记
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx                ← 新建：客户订单详情页 ⭐核心（批次3）
│   │   │   │       └── loading.tsx             ← ✅已建：加载骨架屏
│   │   │   ├── notifications/page.tsx          ← 新建：通知中心（批次4）
│   │   │   └── profile/page.tsx                ← 新建：个人中心（批次5）
│   │   ├── api/
│   │   │   ├── documents/
│   │   │   │   ├── presign/route.ts            ← 新建：预签名直传 URL（批次2 ⭐）
│   │   │   │   ├── confirm/route.ts            ← 新建：上传确认写库（批次2 ⭐）
│   │   │   │   ├── files/[id]/route.ts         ← 新建：文件级删除（批次2 ⭐）
│   │   │   │   ├── upload/route.ts             ← 不改（管理端兼容保留）
│   │   │   │   └── [id]/route.ts               ← 不改（审核逻辑已有）
│   │   │   ├── orders/[id]/
│   │   │   │   ├── documents/route.ts          ← 修改：POST 增加通知客户（批次2）
│   │   │   │   └── submit/route.ts             ← 新建：客户确认提交 + 通知资料员（批次3）
│   │   │   └── auth/
│   │   │       └── change-password/route.ts    ← 新建：修改密码（批次5）
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx                  ← ✅
│   │   │   ├── register/page.tsx               ← ✅
│   │   │   └── reset-password/page.tsx         ← ✅
│   │   └── admin/                              ← 管理端（全部 ✅）
│   ├── components/
│   │   ├── orders/
│   │   │   ├── status-timeline.tsx             ← ✅已建：6步进度条
│   │   │   └── material-checklist.tsx          ← 新建：B类材料下载面板（批次3）
│   │   ├── documents/
│   │   │   ├── document-panel.tsx              ← ✅管理端资料面板
│   │   │   └── customer-upload.tsx             ← 新建：客户上传组件（批次2 ⭐核心）
│   │   └── ui/
│   │       ├── file-preview.tsx                ← ✅ 文件预览（compact+card+灯箱）
│   │       └── camera-capture.tsx              ← ✅ 拍照（前后置+取景框）
│   ├── hooks/
│   │   └── use-socket-client.ts                ← 新建：Socket.io 客户端（批次4）
│   ├── lib/
│   │   ├── oss.ts                              ← ✅ generatePresignedPutUrl/getSignedUrl/deleteFile
│   │   ├── socket.ts                           ← 修改：Cookie 认证改造（批次2）
│   │   ├── rbac.ts                             ← ✅ CUSTOMER read/create/delete
│   │   ├── auth.ts                             ← ✅ getCurrentUser/verifyAccessToken
│   │   ├── events.ts                           ← ✅ eventBus + emitToUser
│   │   ├── api-client.ts                       ← ✅ apiFetch（Token 自动刷新）
│   │   └── transition.ts                       ← ✅ 状态机
│   ├── types/order.ts                          ← 修改：加 DOCS_SUBMITTED（批次2）
│   └── stores/notification-store.ts            ← ✅ fetchUnreadCount
```

---

## 2. 前置条件与环境

### 2.1 从零启动开发环境

```bash
# 1. 克隆项目
git clone <仓库地址> erp-project
cd erp-project

# 2. 安装依赖
npm install

# 3. 配置环境变量（.env.local 已在仓库配置好）

# 4. 生成 Prisma Client
npx prisma generate

# 5. 启动开发服务器
npm run dev    # Custom Server + Socket.io
# 或
npm run dev:next  # 纯 Next.js（无 Socket.io）

# 6. 类型检查（提交前必跑）
npx tsc --noEmit

# 7. 构建验证（提交前必跑）
npm run build
```

### 2.2 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 全栈框架 | Next.js (App Router) | 15.5.14 |
| 前端 UI | React | 19.2.4 |
| ORM | Prisma | 5.22.0 |
| 数据库 | 阿里云 RDS MySQL | 8.0 |
| 样式 | Tailwind CSS | 3.4.16 |
| 状态管理 | Zustand | 5.0.2 |
| 实时通信 | Socket.io | 4.8.1 |
| 文件存储 | 阿里云 OSS | SDK latest |

### 2.3 数据库表清单（11 张，全部 `erp_` 前缀）

| Prisma Model | 实际表名 | 说明 |
|---|---|---|
| Company | erp_companies | 租户/公司 |
| Department | erp_departments | 部门 |
| User | erp_users | 用户（9 级角色） |
| Order | erp_orders | 签证订单（含 M5 扩展字段） |
| Applicant | erp_applicants | 申请人（M5 新增） |
| DocumentRequirement | erp_document_requirements | 资料需求清单 |
| DocumentFile | erp_document_files | 资料文件 |
| VisaMaterial | erp_visa_materials | 签证材料 |
| OrderLog | erp_order_logs | 操作日志 |
| Notification | erp_notifications | 站内通知 |
| VisaTemplate | erp_visa_templates | 签证模板库 |

---

## 3. 现有资产清单

> 以下工具/组件/函数已实现，M3 可直接复用，无需重建。

### 3.1 工具库（src/lib/）

| 函数 | 文件 | 用途 | M3 批次 |
|---|---|---|---|
| `generatePresignedPutUrl(ossKey, mimeType, expires)` | `oss.ts:107` | 生成预签名上传 URL | 批次 2 |
| `getSignedUrl(ossKey, expires)` | `oss.ts:131` | 生成签名下载 URL（内联展示） | 批次 2 |
| `getDownloadUrl(ossKey, fileName, expires)` | `oss.ts:148` | 生成强制下载 URL | 批次 3 |
| `deleteFile(ossKey)` | `oss.ts:162` | 删除单个 OSS 文件 | 批次 2 |
| `deleteFiles(ossKeys)` | `oss.ts:169` | 批量删除 OSS 文件 | — |
| `buildOssKey(params)` | `oss.ts:53` | 构建 OSS 存储路径 | 批次 2 |
| `uploadFile(file, ossKey, mimeType)` | `oss.ts:82` | 服务端上传到 OSS | — |
| `hasPermission(role, resource, action)` | `rbac.ts:136` | 功能权限检查 | 批次 2 |
| `requirePermission(user, resource, action)` | `rbac.ts:144` | 权限检查（无权抛异常） | 批次 2 |
| `getDataScopeFilter(user)` | `rbac.ts:155` | 数据范围过滤 | — |
| `getCurrentUser(request)` | `auth.ts:77` | 从 Cookie 提取 JWT 用户 | 批次 2 |
| `verifyAccessToken(token)` | `auth.ts:67` | 验证 Access Token | 批次 2 |
| `emitToUser(userId, event, data)` | `socket.ts:52` | Socket 推送给指定用户 | 批次 2 |
| `emitToCompany(companyId, event, data)` | `socket.ts:58` | Socket 推送给公司 | — |
| `apiFetch(url, options)` | `api-client.ts` | 封装 fetch（401 自动刷新） | 批次 2 |
| `logApiError(context, error, meta)` | `logger.ts` | 结构化错误日志 | 批次 2 |
| `handleApiError(error)` | `logger.ts` | 统一错误响应 | 批次 2 |
| `AppError(code, message, statusCode)` | `types/api.ts` | 业务错误类 | 批次 2 |
| `createSuccessResponse(data, meta?)` | `types/api.ts` | 统一成功响应 | 批次 2 |

### 3.2 组件（src/components/）

| 组件 | 文件 | 用途 | M3 批次 |
|---|---|---|---|
| `FilePreview` | `ui/file-preview.tsx` | 文件预览（compact+card+灯箱） | 批次 2 |
| `CameraCapture` | `ui/camera-capture.tsx` | 手机拍照（前后置+取景框） | 批次 2 |
| `GlassCard` | `layout/glass-card.tsx` | 玻璃拟态卡片 | 批次 2 |
| `StatusBadge` | `orders/status-badge.tsx` | 订单状态徽章 | 批次 3 |
| `StatusTimeline` | `orders/status-timeline.tsx` | 6 步进度条 | 批次 3 |
| `Toast` | `ui/toast.tsx` | Toast 通知 | 批次 2 |
| `Badge` | `ui/badge.tsx` | 徽章组件 | 批次 2 |
| `DocumentPanel` | `documents/document-panel.tsx` | 管理端资料面板（含分组逻辑） | 参考分组逻辑 |
| `MaterialPanel` | `documents/material-panel.tsx` | 管理端材料面板 | 参考 |

### 3.3 状态管理（src/stores/）

| Store | 文件 | 用途 |
|---|---|---|
| `useNotificationStore` | `notification-store.ts` | 通知状态（fetchUnreadCount/markAsRead/markAllAsRead） |
| `useAuthStore` | `auth-store.ts` | 认证状态 |
| `useOrderStore` | `order-store.ts` | 订单状态 |

### 3.4 API 端点（可直接复用）

| 方法 | 路径 | CUSTOMER 可用 | 用途 |
|---|---|:---:|---|
| GET | `/api/orders` | ✅ | 订单列表（scopeFilter: customerId=userId） |
| GET | `/api/orders/[id]` | ✅ | 详情（含资料+文件+材料+日志+申请人） |
| GET | `/api/orders/[id]/documents` | ✅ | 资料清单（含文件列表） |
| GET | `/api/orders/[id]/materials` | ✅ | 签证材料列表 |
| POST | `/api/orders/[id]/status` | ✅ | 状态流转（出签反馈用） |
| GET | `/api/notifications` | ✅ | 通知列表（含 unreadCount） |
| PATCH | `/api/notifications/[id]` | ✅ | 标记单条已读 |
| POST | `/api/notifications/mark-all-read` | ✅ | 全部已读 |

---

## 4. 两类资料流向深度分析

### 4.1 核心概念：A 类 vs B 类

| 维度 | A 类资料（客户上传） | B 类材料（操作员制作） |
|---|---|---|
| **数据模型** | `DocumentRequirement` → `DocumentFile` | `VisaMaterial` |
| **创建者** | 资料员（选择模板/手动添加） | 操作员 |
| **上传者** | 客户（预签名直传） | 操作员（服务端上传） |
| **审核者** | 资料员 | 资料员 |
| **消费者** | 资料员/操作员（审核用） | 客户（下载用） |
| **状态管理** | DocReqStatus (6 种) | 无独立状态，随订单状态 |
| **典型材料** | 护照、身份证、户口本、在职证明、银行流水 | 保险单、行程单、机票、酒店预订单 |

### 4.2 A 类资料完整数据流

```
阶段1: 资料员创建需求清单
  资料员 → POST /api/orders/[id]/documents
    → 创建 N 个 DocumentRequirement (status=PENDING)
    → 通知客户（M3-24 新增 ✅批次2修复）
    → 状态 CONNECTED → COLLECTING_DOCS（首次发送时）

阶段2: 客户逐项上传
  客户 → POST /api/documents/presign（获取预签名 URL）     ← 批次2新建
       → PUT oss-cn-beijing.aliyuncs.com（直传 OSS）
       → POST /api/documents/confirm                      ← 批次2新建
         → 创建 DocumentFile
         → 更新 requirement.status = UPLOADED（条件更新）
         → 修正 OSS 对象 Content-Type
         → 不通知资料员（设计决策：等确认提交）

阶段3: 客户确认提交
  客户 → POST /api/orders/[id]/submit                      ← 批次3新建
    → 验证：status=COLLECTING_DOCS + 至少一个 requirement 有文件
    → 所有有文件的 requirement → REVIEWING
    → 通知资料员（type=DOCS_SUBMITTED）+ Socket 推送
    → 不改变订单状态（仍在 COLLECTING_DOCS）

阶段4: 资料员审核
  资料员 → PATCH /api/documents/[id]
    → APPROVED: 合格
    → REJECTED: 需修改 + rejectReason → 通知客户（DOC_REVIEWED）
    → SUPPLEMENT: 需补充 + rejectReason → 通知客户（DOC_REVIEWED）

阶段5: 循环（阶段2→3→4 直到全部 APPROVED）
  全部 APPROVED → 资料员点击"提交审核"
    → POST /api/orders/[id]/status (COLLECTING_DOCS → PENDING_REVIEW)
```

### 4.3 B 类材料完整数据流

```
阶段1: 操作员制作并上传
  操作员 → POST /api/orders/[id]/materials
    → 创建 VisaMaterial (version=N)
    → 状态 MAKING_MATERIALS → PENDING_DELIVERY
    → 通知资料员 + 通知客户

阶段2: 资料员查看确认
  资料员查看 → OK → POST /api/orders/[id]/status (PENDING_DELIVERY → DELIVERED)
            → 需修改 → POST status (PENDING_DELIVERY → MAKING_MATERIALS) → 通知操作员

阶段3: 客户下载
  客户 → GET /api/orders/[id]/materials → 下载/预览
    → 仅 PENDING_DELIVERY / DELIVERED / APPROVED / REJECTED / PARTIAL 状态可见
    → MAKING_MATERIALS 状态显示"制作中"提示
```

### 4.4 管理端 DocumentPanel vs 客户端 CustomerUpload 对比

| 能力 | DocumentPanel（管理端） | CustomerUpload（客户端） |
|---|---|---|
| 添加需求项 | ✅ 资料员操作 | ❌ 客户只看不加 |
| 选择模板 | ✅ | ❌ |
| 审核（合格/不合格） | ✅ | ❌ |
| 上传文件 | ✅ 服务端上传 | ✅ 预签名直传 |
| 拍照上传 | ✅ | ✅ |
| 查看说明文字 | ✅ | ✅（重点展示） |
| 删除文件 | ⬜M3-21 | ✅M3-7 仅删自己上传 |
| "确认提交"按钮 | ❌ | ✅M3-9 |
| 多文件上传 | ✅ | ✅ |
| 按申请人分组 | ✅M5 已实现 | ✅复用逻辑 |

---

## 5. 工作流逐阶段核对

### 阶段一：客服接单录单

| 步骤 | 工作流描述 | 代码实现 | 状态 |
|---|---|---|:---:|
| 1 | 客服录入订单信息 | `POST /api/orders` | ✅ |
| 2 | 推送到资料员待接单界面 | 公共池 PENDING_CONNECTION | ✅ |
| 3 | 自动为客户创建账号 | 创建订单时自动注册 Customer | ✅ |
| 4 | 资料员通知："又有新订单啦" | ORDER_NEW 通知 | ✅ |

### 阶段二：资料员接单及收集反馈

| 步骤 | 工作流描述 | 代码实现 | 状态 |
|---|---|---|:---:|
| 2.1 | 资料员点击"接单" | `POST /api/orders/[id]/claim` → CONNECTED | ✅ |
| 2.2 | 选择/添加资料清单→"发送客户" | `POST /api/orders/[id]/documents` 批量创建 | ✅ |
| 2.2 | 首次通知客户 | M3-24（批次2修复） | ⬜ |
| 2.3 | 客户上传资料 | M3-5/6/8（批次2） | ⬜ |
| 2.3 | 客户点击"确认提交" | M3-9 submit API（批次3） | ⬜ |
| 2.4 | 资料员审核（打勾/备注） | PATCH `/api/documents/[id]` | ✅ |
| 2.4 | 驳回通知客户 | PATCH 内建通知 | ✅ |
| 2.4 | 追加需求项通知客户 | M3-24（批次2修复，覆盖追加场景） | ⬜ |

### 阶段三~五

全部后端逻辑已完成（M2），M3 只补客户端 UI 和新增端点。详见工作流文档。

---

## 6. 全链路通知矩阵

| # | 触发时机 | 接收者 | 类型 | 代码位置 | 状态 |
|---|---|---|---|---|:---:|
| N1 | 客服创建订单 | 资料员 | ORDER_NEW | orders POST | ✅ |
| N2 | 客服创建订单 | 客户 | ORDER_CREATED | orders POST | ✅ |
| N3 | 状态变更（任何） | 相关人员 | STATUS_CHANGE | events.ts | ✅ |
| N4 | 资料员发送清单/追加需求 | 客户 | DOC_REVIEWED | documents POST | ⬜批次2修复 |
| N5 | 客户确认提交 | 资料员 | DOCS_SUBMITTED | submit POST | ⬜批次3 |
| N6 | 资料审核驳回 | 客户 | DOC_REVIEWED | documents/[id] PATCH | ✅ |
| N7 | 材料上传 | 资料员 | MATERIAL_UPLOADED | materials POST | ✅ |
| N8 | 材料上传（首版） | 客户 | MATERIAL_UPLOADED | materials POST | ✅ |
| N9 | 取消订单 | 相关人员 | STATUS_CHANGE | cancel POST | ✅ |

---

## 7. 两轮深度分析发现的 7 个缺口

### 第一轮：代码 vs 工作流文档逐句核对

#### 🔴 P0-1：Socket.io Cookie 认证失败
- **文件**：`src/lib/socket.ts` 第 16-27 行
- **现状**：`io.use()` 只读 `socket.handshake.auth.token`，HttpOnly Cookie 的 `access_token` 无法被 JS 读取
- **影响**：客户端 Socket 连接始终被服务端拒绝（返回 `Authentication required`）
- **修复**：`io.use()` 增加 Cookie fallback 解析（批次 2 M3-23）

#### 🔴 P0-2：资料员发送清单后客户无通知
- **文件**：`src/app/api/orders/[id]/documents/route.ts` POST 方法（第 48-70 行）
- **现状**：批量创建 DocumentRequirement 后只写操作日志，不创建客户通知
- **影响**：客户不知道有资料需要上传，除非主动查看订单详情
- **修复**：POST 方法内查询 `order.customerId`，创建 `DOC_REVIEWED` 通知 + Socket 推送（批次 2 M3-24）

#### 🔴 P0-3：NotificationType 枚举缺少 DOCS_SUBMITTED
- **文件**：`prisma/schema.prisma:NotificationType` + `src/types/order.ts:NotificationType`
- **现状**：两处都只有 8 个值，无 `DOCS_SUBMITTED`
- **影响**：submit API（M3-9）创建通知时类型校验失败
- **修复**：Schema 加枚举值 + 类型加联合成员 + 数据库迁移（批次 2 M3-19）

### 第二轮：逐文件深度审查（20 个关键文件）

#### 🟡 P1-4：presigned URL 未包含 Content-Type → OSS 对象 MIME 类型未知
- **文件**：`src/lib/oss.ts:generatePresignedPutUrl`
- **现状**：签名 URL 不包含 Content-Type，客户端 PUT 时 OSS 不校验此头
- **影响**：OSS 对象 Content-Type 可能为 `application/octet-stream`，FilePreview 组件内联预览失败（浏览器下载而非展示）
- **修复**：confirm API 中调用 `client.putMeta(ossKey, { 'Content-Type': fileType })` 修正 MIME（批次 2 M3-6）

#### 🟡 P1-5：presign API 未校验文件类型
- **文件**：新建 `src/app/api/documents/presign/route.ts`
- **现状**：现有 `upload/route.ts` 有 `ALLOWED_TYPES` 白名单校验，presign 端点需同样校验
- **修复**：presign API 验证 `fileType ∈ ALLOWED_TYPES`（批次 2 M3-5）

#### 🟢 P2-6：OSS Bucket CORS 未配置
- **影响**：浏览器 PUT 直传 OSS 会被跨域策略拦截
- **修复**：部署时在阿里云 OSS 控制台配置 Bucket CORS 规则（非代码问题）
- **CORS 配置要求**：
  ```
  来源: https://你的域名（或 * 用于开发）
  允许 Methods: PUT, POST, GET, DELETE, HEAD
  允许 Headers: *
  暴露 Headers: ETag, x-oss-request-id
  缓存时间: 3600
  ```

#### 🟢 P2-7：confirm API 状态更新需条件判断
- **文件**：新建 `src/app/api/documents/confirm/route.ts`
- **现状**：现有 `upload/route.ts` 无条件将 status 设为 UPLOADED
- **风险**：客户在 REVIEWING 状态下重复上传时，无条件设回 UPLOADED 会打断资料员审核流程
- **修复**：仅当 `status ∈ {PENDING, REJECTED, SUPPLEMENT}` 时设 UPLOADED（批次 2 M3-6）

---

## 8. 架构决策（10 项）

### 决策 1：客户端页面结构
```
/customer/
├── orders/page.tsx              ← ✅已改：卡片可点击
├── orders/[id]/page.tsx         ← 新建：详情页 ⭐（批次3）
├── notifications/page.tsx       ← 新建：通知中心（批次4）
└── profile/page.tsx             ← 新建：个人中心（批次5）
```

### 决策 2：M3 仅新建 7 个辅助端点
核心业务 API 全部已存在（M1/M2 已实现），M3 只需：
- `POST /api/documents/presign` — 预签名 URL（批次 2）
- `POST /api/documents/confirm` — 写库 + MIME 修正（批次 2）
- `DELETE /api/documents/files/[id]` — 文件级删除（批次 2）
- `POST /api/orders/[id]/submit` — 客户确认提交 + 通知资料员（批次 3）
- `POST /api/auth/change-password` — 修改密码（批次 5）

### 决策 3：预签名直传三步流程
```
客户端 → POST /api/documents/presign（获取 URL + ossKey）
       → PUT oss-cn-beijing.aliyuncs.com（直传 OSS，带进度条）
       → POST /api/documents/confirm（写 DB + 修正 MIME，不通知资料员）
```

### 决策 4：客户"确认提交"机制
```
上传阶段：客户逐项上传（静默，不通知资料员）
提交阶段：客户点击"确认提交" → POST /api/orders/[id]/submit
  → 验证：至少一个 requirement 有文件
  → 所有有文件的 requirement → REVIEWING
  → 创建通知给资料员: DOCS_SUBMITTED
  → Socket 推送
  → 不改变订单状态（仍在 COLLECTING_DOCS）
```

### 决策 5：两类资料展示分离
- A 类：「📤 我需要上传的资料」— 按需求项逐项展示状态 + 说明文字 + 上传
- B 类：「📥 签证材料（为您制作）」— 仅 PENDING_DELIVERY 及以后显示下载，MAKING_MATERIALS 显示"制作中"提示

### 决策 6：Socket.io Cookie 认证改造
```typescript
// src/lib/socket.ts — io.use() 改造
function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
}

io.use(async (socket, next) => {
  const authToken = socket.handshake.auth.token as string | undefined
  const cookies = parseCookies(socket.handshake.headers.cookie)
  const token = authToken || cookies['access_token']
  if (!token) return next(new Error('Authentication required'))
  try {
    const payload = await verifyAccessToken(token)
    socket.data.user = payload
    next()
  } catch { next(new Error('Invalid token')) }
})
```

### 决策 7：Tab 导航路由化
- 📋 订单 → `/customer/orders`（✅已完成）
- 💬 消息 → `/customer/notifications`（批次 4）
- 👤 我的 → `/customer/profile`（批次 5）

### 决策 8：客户删除文件权限
- 客户只能删除自己上传的文件（`uploadedBy === userId`，API 层校验）
- 管理员不限
- 已在 rbac.ts 补全 `documents: delete` 权限（✅批次 1）

### 决策 9：新增通知类型
- `DOCS_SUBMITTED` — 客户已提交资料（通知资料员）
- 修改 `prisma/schema.prisma` 的 NotificationType enum
- 修改 `src/types/order.ts` 的 NotificationType type

### 决策 10：confirm API 条件更新 + MIME 修正
```typescript
// confirm API 内部逻辑：
// 1. 仅当 status ∈ {PENDING, REJECTED, SUPPLEMENT} 时设 UPLOADED
// 2. 修正 OSS 对象 Content-Type（确保浏览器内联预览）
const currentReq = await tx.documentRequirement.findUnique({ where: { id: requirementId } })
if (['PENDING', 'REJECTED', 'SUPPLEMENT'].includes(currentReq!.status)) {
  await tx.documentRequirement.update({
    where: { id: requirementId },
    data: { status: 'UPLOADED' },
  })
}
// 修正 OSS MIME
const ossClient = getOssClient()
await ossClient.putMeta(ossKey, { 'Content-Type': fileType })
```

---

## 9. 批次 1 完成状态

**批次 1（3h）— 基础框架补全** ✅ 已完成 2026-03-23

| 任务 | 文件 | 状态 |
|---|---|:---:|
| M3-1 Tab 导航路由化 | `src/app/customer/layout.tsx` | ✅ |
| M3-2 订单列表增强 | `src/app/customer/orders/page.tsx` | ✅ |
| M3-3 状态时间线组件 | `src/components/orders/status-timeline.tsx` | ✅ |
| M3-4 权限补全 | `src/lib/rbac.ts` | ✅ |
| 额外：loading 骨架屏 | `src/app/customer/orders/[id]/loading.tsx` | ✅ |
| 额外：server.ts 修复 | `server.ts` | ✅ |
| 额外：documents/[id] 修复 | `src/app/api/documents/[id]/route.ts` | ✅ |

验收：tsc 0 错误 ✅ | build 0 警告 ✅

---

## 10. 批次 2：A 类资料上传核心

> 7 项子任务 + 1 项验收，预估 4.5h。这是 M3 最核心的批次。

### M3-5：预签名直传 API

**新建** `src/app/api/documents/presign/route.ts`

```
端点：POST /api/documents/presign
认证：getCurrentUser(request)
权限：requirePermission(user, 'documents', 'create')
```

**请求体（Zod 校验）**：
```typescript
const presignSchema = z.object({
  requirementId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
})
```

**处理逻辑**：
1. 认证 + 权限检查
2. Zod 校验请求体
3. 验证 `fileType ∈ ALLOWED_TYPES`（复用 `upload/route.ts` 的白名单）
4. 查询 DocumentRequirement（`id === requirementId && companyId === user.companyId`）
   - 同时 include order 获取 orderId
   - 不存在则抛 404
5. 调用 `buildOssKey({ companyId, orderId: requirement.order.id, type: 'documents', subId: requirementId, fileName })`
6. 调用 `generatePresignedPutUrl(ossKey, fileType, 3600)`
7. 返回 `{ presignedUrl, ossKey }`

**响应**：
```json
{
  "success": true,
  "data": {
    "presignedUrl": "https://oss-cn-beijing.aliyuncs.com/...",
    "ossKey": "companies/xxx/orders/xxx/documents/xxx/1234567890_filename.jpg"
  }
}
```

**错误处理**：
- 401：未登录
- 403：无权限
- 400：文件类型不支持
- 404：资料需求不存在

**文件类型白名单**（与 upload/route.ts 一致）：
```typescript
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'text/plain',
]
```

**完整代码模板**：
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { buildOssKey, generatePresignedPutUrl } from '@/lib/oss'
import { z } from 'zod'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'text/plain',
]

const presignSchema = z.object({
  requirementId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'documents', 'create')

    const body = await request.json()
    const data = presignSchema.parse(body)

    // 文件类型校验
    if (!ALLOWED_TYPES.includes(data.fileType)) {
      throw new AppError('INVALID_FILE_TYPE', `不支持的文件类型: ${data.fileType}`, 400)
    }

    // 查询需求（校验 companyId）
    const requirement = await prisma.documentRequirement.findFirst({
      where: { id: data.requirementId, companyId: user.companyId },
      include: { order: { select: { id: true, companyId: true } } },
    })
    if (!requirement) throw new AppError('NOT_FOUND', '资料需求不存在', 404)

    // 构建 OSS 路径 + 生成预签名 URL
    const ossKey = buildOssKey({
      companyId: user.companyId,
      orderId: requirement.order.id,
      type: 'documents',
      subId: data.requirementId,
      fileName: data.fileName,
    })

    const { url } = await generatePresignedPutUrl(ossKey, data.fileType, 3600)

    return NextResponse.json(createSuccessResponse({ presignedUrl: url, ossKey }))
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

---

### M3-6：上传确认 API

**新建** `src/app/api/documents/confirm/route.ts`

```
端点：POST /api/documents/confirm
认证：getCurrentUser(request)
权限：requirePermission(user, 'documents', 'create')
```

**请求体（Zod 校验）**：
```typescript
const confirmSchema = z.object({
  requirementId: z.string().min(1),
  ossKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  fileType: z.string().min(1),
  label: z.string().max(100).optional(),
})
```

**处理逻辑**（事务内）：
1. 认证 + 权限检查
2. Zod 校验请求体
3. 查询 DocumentRequirement（`id === requirementId && companyId === user.companyId`）
   - include order 获取 orderId
   - 不存在则抛 404
4. 验证 ossKey 格式（包含 `user.companyId`，防止跨公司攻击）
5. 事务内：
   a. 调用 `getSignedUrl(ossKey)` → 签名下载 URL
   b. 查询当前 requirement 下最大 `sortOrder` → nextSort = max + 1
   c. 创建 DocumentFile：
      ```typescript
      {
        requirementId,
        companyId: user.companyId,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        ossKey: data.ossKey,
        ossUrl: signedUrl.url,     // 签名下载 URL
        uploadedBy: user.userId,
        sortOrder: nextSort,
        label: data.label ?? null,
      }
      ```
   d. **条件更新** requirement.status：
      ```typescript
      // 仅当 status ∈ {PENDING, REJECTED, SUPPLEMENT} 时设 UPLOADED
      // REVIEWING 和 APPROVED 状态下不改（避免打断审核流程）
      if (['PENDING', 'REJECTED', 'SUPPLEMENT'].includes(currentReq.status)) {
        await tx.documentRequirement.update({
          where: { id: data.requirementId },
          data: { status: 'UPLOADED' },
        })
      }
      ```
   e. 写操作日志
6. 事务提交后，修正 OSS 对象 Content-Type（**修复 P1-4 缺口**）：
   ```typescript
   import('@/lib/oss').then(({ getOssClient }) => {
     // 注意：getOssClient 需导出，当前 oss.ts 未导出此函数
     // 方案：在 oss.ts 新增 export function getOssClient()
     // 或直接在 confirm 中创建 OSS client
   })
   ```
   实际实现：直接在 confirm 路由中创建 ali-oss client 实例调用 `putMeta`：
   ```typescript
   const ossClient = new OSS({
     region: process.env.OSS_REGION!,
     accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
     accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
     bucket: process.env.OSS_BUCKET!,
   })
   await ossClient.putMeta(data.ossKey, { 'Content-Type': data.fileType })
   ```

7. **不通知资料员**（等 submit API 统一通知）

**响应**：
```json
{
  "success": true,
  "data": {
    "id": "cuid_string",
    "requirementId": "cuid_string",
    "fileName": "passport.jpg",
    "fileSize": 1048576,
    "ossUrl": "https://oss-cn-beijing.aliyuncs.com/...",
    "sortOrder": 1,
    "createdAt": "2026-03-25T01:50:00.000Z"
  }
}
```

**完整代码模板**：
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { getSignedUrl } from '@/lib/oss'
import OSS from 'ali-oss'
import { z } from 'zod'

const confirmSchema = z.object({
  requirementId: z.string().min(1),
  ossKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  fileType: z.string().min(1),
  label: z.string().max(100).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'documents', 'create')

    const body = await request.json()
    const data = confirmSchema.parse(body)

    // 查询需求
    const requirement = await prisma.documentRequirement.findFirst({
      where: { id: data.requirementId, companyId: user.companyId },
      include: { order: { select: { id: true } } },
    })
    if (!requirement) throw new AppError('NOT_FOUND', '资料需求不存在', 404)

    // ossKey 安全校验
    if (!data.ossKey.includes(user.companyId)) {
      throw new AppError('INVALID_OSS_KEY', 'OSS 路径不合法', 400)
    }

    // 事务内处理
    const result = await prisma.$transaction(async (tx) => {
      // 签名下载 URL
      const signed = getSignedUrl(data.ossKey, 7 * 24 * 3600) // 7天

      // 最大排序号
      const lastFile = await tx.documentFile.findFirst({
        where: { requirementId: data.requirementId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      })

      // 创建文件记录
      const docFile = await tx.documentFile.create({
        data: {
          requirementId: data.requirementId,
          companyId: user.companyId,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType,
          ossKey: data.ossKey,
          ossUrl: signed.url,
          uploadedBy: user.userId,
          sortOrder: (lastFile?.sortOrder ?? 0) + 1,
          label: data.label ?? null,
        },
      })

      // 条件更新需求状态
      if (['PENDING', 'REJECTED', 'SUPPLEMENT'].includes(requirement.status)) {
        await tx.documentRequirement.update({
          where: { id: data.requirementId },
          data: { status: 'UPLOADED' },
        })
      }

      // 操作日志
      await tx.orderLog.create({
        data: {
          orderId: requirement.order.id,
          companyId: user.companyId,
          userId: user.userId,
          action: `上传资料: ${requirement.name}`,
          detail: `文件: ${data.fileName} (${(data.fileSize / 1024).toFixed(1)}KB)`,
        },
      })

      return docFile
    })

    // 修正 OSS Content-Type（事务外，不影响 DB 一致性）
    try {
      const ossClient = new OSS({
        region: process.env.OSS_REGION!,
        accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
        bucket: process.env.OSS_BUCKET!,
      })
      await ossClient.putMeta(data.ossKey, { 'Content-Type': data.fileType })
    } catch {
      // MIME 修正失败不影响主流程，日志记录即可
      const { logApiError } = await import('@/lib/logger')
      logApiError('oss-put-meta', new Error('OSS putMeta failed'), { ossKey: data.ossKey })
    }

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

---

### M3-7：文件删除 API

**新建** `src/app/api/documents/files/[id]/route.ts`

```
端点：DELETE /api/documents/files/[id]
认证：getCurrentUser(request)
权限：requirePermission(user, 'documents', 'delete')
```

**注意**：这是**文件级**删除（删除单个 DocumentFile），与 `DELETE /api/documents/[id]`（需求级删除，级联删文件）不同。

**处理逻辑**：
1. 认证 + 权限检查
2. 查询 DocumentFile（`id === params.id && companyId === user.companyId`）
   - 不存在则抛 404
3. 如果是 CUSTOMER 角色，额外校验 `uploadedBy === user.userId`（只能删自己上传的）
4. 删除 OSS 文件：`deleteFile(docFile.ossKey)`
5. 删除 DB DocumentFile 记录
6. 检查该 requirement 下是否还有文件：
   - `prisma.documentFile.count({ where: { requirementId: docFile.requirementId } })`
   - 如果 count === 0 → 回退 status 为 PENDING
7. 写操作日志

**响应**：
```json
{
  "success": true,
  "data": { "message": "已删除" }
}
```

**完整代码模板**：
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { deleteFile } from '@/lib/oss'
import { logApiError } from '@/lib/logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'documents', 'delete')

    const docFile = await prisma.documentFile.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        requirement: {
          select: { id: true, orderId: true, name: true },
        },
      },
    })
    if (!docFile) throw new AppError('NOT_FOUND', '文件不存在', 404)

    // CUSTOMER 只能删自己上传的
    if (user.role === 'CUSTOMER' && docFile.uploadedBy !== user.userId) {
      throw new AppError('FORBIDDEN', '只能删除自己上传的文件', 403)
    }

    // 删除 OSS 文件
    try {
      await deleteFile(docFile.ossKey)
    } catch (err) {
      logApiError('oss-delete', err, { ossKey: docFile.ossKey })
    }

    // 删除 DB 记录
    await prisma.documentFile.delete({ where: { id } })

    // 检查 requirement 是否还有文件
    const remainingCount = await prisma.documentFile.count({
      where: { requirementId: docFile.requirementId },
    })
    if (remainingCount === 0) {
      await prisma.documentRequirement.update({
        where: { id: docFile.requirementId },
        data: { status: 'PENDING' },
      })
    }

    // 操作日志
    await prisma.orderLog.create({
      data: {
        orderId: docFile.requirement.orderId,
        companyId: user.companyId,
        userId: user.userId,
        action: `删除资料文件: ${docFile.requirement.name}`,
        detail: `文件: ${docFile.fileName}`,
      },
    })

    return NextResponse.json(createSuccessResponse({ message: '已删除' }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
```

---

### M3-19：通知类型 DOCS_SUBMITTED

**修改 1** `prisma/schema.prisma`：
```prisma
enum NotificationType {
  ORDER_NEW
  ORDER_CREATED
  STATUS_CHANGE
  DOC_REVIEWED
  DOCS_SUBMITTED          // ← 新增
  MATERIAL_UPLOADED
  MATERIAL_FEEDBACK
  APPOINTMENT_REMIND
  SYSTEM
}
```

**修改 2** `src/types/order.ts`：
```typescript
export type NotificationType =
  | 'ORDER_NEW'
  | 'ORDER_CREATED'
  | 'STATUS_CHANGE'
  | 'DOC_REVIEWED'
  | 'DOCS_SUBMITTED'       // ← 新增
  | 'MATERIAL_UPLOADED'
  | 'MATERIAL_FEEDBACK'
  | 'APPOINTMENT_REMIND'
  | 'SYSTEM'
```

**数据库迁移**：
```bash
# 方式1：prisma migrate（推荐）
npx prisma migrate dev --name add_docs_submitted_notification_type

# 方式2：直接 SQL（如果 migrate 不方便）
npx prisma db execute --stdin << 'EOF'
ALTER TABLE erp_notifications MODIFY COLUMN type ENUM(
  'ORDER_NEW','ORDER_CREATED','STATUS_CHANGE','DOC_REVIEWED',
  'DOCS_SUBMITTED','MATERIAL_UPLOADED','MATERIAL_FEEDBACK',
  'APPOINTMENT_REMIND','SYSTEM'
) NOT NULL;
EOF
```

---

### M3-8：客户上传组件 ⭐ 核心

**新建** `src/components/documents/customer-upload.tsx`

**Props 接口**：
```typescript
interface CustomerUploadProps {
  orderId: string
  requirements: DocumentRequirement[]
  applicantCount?: number
  applicants?: Array<{ id: string; name: string }>
  onRefresh: () => void
}
```

**渲染结构**（每个 DocumentRequirement 一个区块）：
```
┌─ 护照首页 ──────────────────── [必填] [已上传] ──┐
│ 说明：有效期6个月以上，4页空白页，彩色扫描           │
│ ❌ 驳回原因：请提供彩色扫描件                       │
│ 已上传文件：                                       │
│   🖼️ passport.jpg (2.3MB)  [👁预览] [🗑删除]      │
│ [📁上传] [📷拍照]    ← 仅 PENDING/REJECTED/SUPPLEMENT 时可操作 │
└────────────────────────────────────────────────┘
```

**上传流程（预签名三步）**：
```typescript
async function handleUpload(requirementId: string, file: File) {
  // 1. 获取预签名 URL
  const presignRes = await apiFetch('/api/documents/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirementId, fileName: file.name, fileType: file.type }),
  })
  const presignJson = await presignRes.json()
  if (!presignJson.success) {
    toast('error', presignJson.error?.message ?? '获取上传链接失败')
    return
  }
  const { presignedUrl, ossKey } = presignJson.data

  // 2. 直传 OSS（XMLHttpRequest 带进度条）
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`OSS upload failed: ${xhr.status}`))
      }
    }
    xhr.onerror = () => reject(new Error('网络错误'))
    xhr.send(file)
  })

  // 3. 确认写库
  const confirmRes = await apiFetch('/api/documents/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requirementId,
      ossKey,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    }),
  })
  const confirmJson = await confirmRes.json()
  if (confirmJson.success) {
    toast('success', '上传成功')
    onRefresh()
  } else {
    toast('error', confirmJson.error?.message ?? '确认失败')
  }
}
```

**删除流程**：
```typescript
async function handleDelete(fileId: string) {
  if (!confirm('确定删除该文件？')) return
  const res = await apiFetch(`/api/documents/files/${fileId}`, { method: 'DELETE' })
  const json = await res.json()
  if (json.success) {
    toast('success', '已删除')
    onRefresh()
  } else {
    toast('error', json.error?.message ?? '删除失败')
  }
}
```

**拍照支持**：复用 `CameraCapture` 组件，捕获后走同样上传流程。

**多人订单分组**：复用 `DocumentPanel` 的 `groupedRequirements()` 逻辑：
- `applicantCount > 1 && applicants.length > 1` 时按人分组
- 需求均匀分配到各申请人组
- 每组显示申请人头像+姓名+进度

**文件预览**：复用 `FilePreview` 组件 compact 模式。

**状态显示**：
| 资料需求状态 | 客户可操作 | UI 显示 |
|---|---|---|
| PENDING | 上传/拍照 | 灰色圆点 + "待上传" |
| UPLOADED | 上传/拍照/删除 | 蓝色圆点 + "已上传" |
| REVIEWING | 不可操作 | 紫色圆点 + "审核中" |
| APPROVED | 不可操作 | 绿色圆点 + "已合格" |
| REJECTED | 上传/拍照/删除 | 红色圆点 + "需修改" + 驳回原因 |
| SUPPLEMENT | 上传/拍照/删除 | 黄色圆点 + "需补充" + 驳回原因 |

---

### M3-23：Socket Cookie 认证

**修改** `src/lib/socket.ts`

**当前代码**（第 14-27 行）：
```typescript
io.use(async (socket: Socket, next) => {
  const token = socket.handshake.auth.token as string | undefined
  if (!token) {
    return next(new Error('Authentication required'))
  }
  // ...
})
```

**修改为**：
```typescript
function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
}

io.use(async (socket: Socket, next) => {
  // 优先使用 auth.token（如果客户端显式传递）
  const authToken = socket.handshake.auth.token as string | undefined
  // fallback：从 Cookie 读取（HttpOnly Cookie 浏览器自动携带到握手请求）
  const cookies = parseCookies(socket.handshake.headers.cookie)
  const cookieToken = cookies['access_token']
  const token = authToken || cookieToken

  if (!token) {
    return next(new Error('Authentication required'))
  }

  try {
    const payload = await verifyAccessToken(token)
    socket.data.user = payload
    next()
  } catch {
    next(new Error('Invalid token'))
  }
})
```

**验证方式**：客户端连接时浏览器自动携带 Cookie，服务端从 `socket.handshake.headers.cookie` 解析 `access_token`。

---

### M3-24：发送清单通知客户

**修改** `src/app/api/orders/[id]/documents/route.ts` POST 方法

**当前代码**（第 40-70 行）在批量创建 DocumentRequirement 之后只有操作日志。

**新增**：在操作日志之后、return 之前插入通知逻辑：

```typescript
    // 写操作日志
    await prisma.orderLog.create({
      data: {
        orderId: id,
        companyId: user.companyId,
        userId: user.userId,
        action: '添加资料需求',
        detail: `添加了 ${data.items.length} 项资料需求`,
      },
    })

    // ====== 新增：通知客户 ======
    // 重新查询 order 获取 customerId（当前查询不含 customerId）
    const orderWithCustomer = await prisma.order.findUnique({
      where: { id },
      select: { customerId: true, orderNo: true },
    })
    if (orderWithCustomer?.customerId) {
      const { emitToUser } = await import('@/lib/socket')

      await prisma.notification.create({
        data: {
          companyId: user.companyId,
          userId: orderWithCustomer.customerId,
          orderId: id,
          type: 'DOC_REVIEWED',
          title: `订单 ${orderWithCustomer.orderNo} 新增资料需求`,
          content: `资料员为您新增了 ${data.items.length} 项资料需求，请及时上传`,
        },
      })

      emitToUser(orderWithCustomer.customerId, 'notification', {
        type: 'DOC_REVIEWED',
        title: '资料清单已更新',
        orderId: id,
        orderNo: orderWithCustomer.orderNo,
      })
    }
    // ====== 新增结束 ======

    return NextResponse.json(createSuccessResponse(created), { status: 201 })
```

**覆盖场景**：
1. 首次发送清单（CONNECTED→COLLECTING_DOCS 之前批量创建）
2. COLLECTING_DOCS 状态下追加新需求项（操作员打回后、资料员补充等）

---

### 批次 2 验收

| # | 检查项 | 通过标准 |
|---|---|---|
| 1 | `npx tsc --noEmit` | 0 错误 |
| 2 | `npm run build` | 0 警告 |
| 3 | presign → PUT → confirm 全流程 | 返回有效 URL，DB 记录正确，MIME 已修正 |
| 4 | 文件删除（OSS + DB + 状态回退） | OSS 对象消失，requirement 无文件时回退 PENDING |
| 5 | CustomerUpload 组件渲染 | 逐项显示名称/状态/说明/文件/操作按钮 |
| 6 | 拍照上传可用 | CameraCapture → presign → PUT → confirm |
| 7 | 多人订单分组 | applicantCount>1 时按人分组 |
| 8 | Socket Cookie 认证 | 代码改造完成（客户端验证留批次 4） |
| 9 | 发送清单通知客户 | POST documents 后客户收到 DOC_REVIEWED |
| 10 | presign 文件类型校验 | 不支持的类型返回 400 |
| 11 | REVIEWING 状态上传不打断 | confirm 不将 REVIEWING 改回 UPLOADED |

---

## 11. 批次 3：B 类材料 + 详情页 + 确认提交 + 出签反馈

> 5h，依赖批次 1+2。

### M3-9：客户确认提交 API

**新建** `src/app/api/orders/[id]/submit/route.ts`

```
端点：POST /api/orders/[id]/submit
认证：getCurrentUser(request)
```

**处理逻辑**：
1. 认证
2. 查询订单（`id === orderId && customerId === user.userId`）
3. 验证 `status === COLLECTING_DOCS`
4. 事务内：
   a. 查询有文件的 requirements：`findMany({ where: { orderId, files: { some: {} } } })`
   b. 验证至少一个 requirement 有文件（否则抛 400）
   c. 将所有有文件的 requirement → REVIEWING
   d. 写操作日志："客户确认提交资料"
   e. 创建通知给 `order.collectorId`：
      ```typescript
      type: 'DOCS_SUBMITTED',
      title: `订单 ${orderNo} 客户已提交资料`,
      content: `${customerName} 已上传资料并确认提交，请及时审核`,
      ```
   f. Socket 推送：`emitToUser(collectorId, 'notification', { type: 'DOCS_SUBMITTED', ... })`

### M3-10：B 类材料说明面板

**新建** `src/components/orders/material-checklist.tsx`

显示逻辑：
- MAKING_MATERIALS：显示"签证材料正在制作中，请耐心等待..."提示
- PENDING_DELIVERY+：显示材料下载列表（预览+下载）

### M3-11：客户订单详情页 ⭐

**新建** `src/app/customer/orders/[id]/page.tsx`

页面结构：
```
← 返回   HX2026...   状态徽章
🌍 法国 · 旅游签证
StatusTimeline（6步进度条）

📤 我需要上传的资料
CustomerUpload 组件
[✅ 确认提交] ← COLLECTING_DOCS 且有文件时可点击

📥 签证材料（为您制作）
← MAKING_MATERIALS: 制作中提示
← PENDING_DELIVERY+: MaterialChecklist

🎫 签证结果反馈 ← 仅 DELIVERED 状态
[✅ 已出签]  [❌ 被拒签]

📋 订单信息
📜 操作记录
```

数据获取：`GET /api/orders/${orderId}`（返回含 documentRequirements+files, visaMaterials, orderLogs, applicants）

出签反馈：调用 `POST /api/orders/[id]/status` body: `{ toStatus: 'APPROVED' | 'REJECTED' }`

---

## 12. 批次 4：通知 + Socket

> 3h，依赖批次 1。

### M3-12：Socket 客户端 Hook

**新建** `src/hooks/use-socket-client.ts`

### M3-14：通知中心页面

**新建** `src/app/customer/notifications/page.tsx`

### M3-15：Tab 通知角标

**修改** `src/app/customer/layout.tsx`（集成 socket + 实时角标）

---

## 13. 批次 5：个人中心

> 2.5h，无依赖。

### M3-16：个人中心页面

**新建** `src/app/customer/profile/page.tsx`

### M3-17：修改密码 API

**新建** `src/app/api/auth/change-password/route.ts`

---

## 14. 批次 6：通知闭环 + 管理端增强

> 2.5h，依赖批次 2+3。

- M3-18 已在批次 2（M3-24）修复 ✅
- M3-21：文件删除集成到 DocumentPanel
- M3-22：批量上传并发优化
- M3-20：全链路通知验证（9 节点）

---

## 15. 批次 7：全量验收

> 2h，依赖全部。

- `npx tsc --noEmit` = 0 错误
- `npm run build` = 0 警告
- `npm run test` = 74+ 通过
- `as any` = 0
- `console.log` = 0
- `TODO` = 0
- `'use client'` 首行 = 全部正确
- 内部导航全用 `<Link>`
- Prisma 可选字段全部 `?? null`
- 端到端 15 步流程走通
- 移动端布局正常

---

## 16. 文件变更全量清单

### 新建文件（12 个）

| # | 文件 | 批次 | 说明 |
|---|---|:---:|---|
| 1 | `src/app/api/documents/presign/route.ts` | 2 | 预签名直传 URL |
| 2 | `src/app/api/documents/confirm/route.ts` | 2 | 上传确认写库 + MIME 修正 |
| 3 | `src/app/api/documents/files/[id]/route.ts` | 2 | 文件级删除 |
| 4 | `src/components/documents/customer-upload.tsx` | 2 | 客户上传组件 ⭐ |
| 5 | `src/app/api/orders/[id]/submit/route.ts` | 3 | 客户确认提交 + 通知 |
| 6 | `src/components/orders/material-checklist.tsx` | 3 | B 类材料下载面板 |
| 7 | `src/app/customer/orders/[id]/page.tsx` | 3 | 客户订单详情页 ⭐ |
| 8 | `src/hooks/use-socket-client.ts` | 4 | Socket 客户端 Hook |
| 9 | `src/app/customer/notifications/page.tsx` | 4 | 通知中心 |
| 10 | `src/app/customer/profile/page.tsx` | 5 | 个人中心 |
| 11 | `src/app/api/auth/change-password/route.ts` | 5 | 修改密码 |

### 修改文件（5 个）

| # | 文件 | 批次 | 变更 |
|---|---|:---:|---|
| 1 | `prisma/schema.prisma` | 2 | NotificationType 加 DOCS_SUBMITTED |
| 2 | `src/types/order.ts` | 2 | NotificationType 加 DOCS_SUBMITTED |
| 3 | `src/lib/socket.ts` | 2 | Cookie 认证改造 |
| 4 | `src/app/api/orders/[id]/documents/route.ts` | 2 | POST 加通知客户 |
| 5 | `src/app/customer/layout.tsx` | 4 | 集成 socket + 实时角标 |

### 不需要改的文件

| 文件 | 原因 |
|---|---|
| `src/middleware.ts` | 新 API 都需鉴权，自动处理 |
| `src/lib/rbac.ts` | ✅ 已补全 CUSTOMER delete + transition |
| `src/lib/oss.ts` | 所有函数已就绪 |
| `src/lib/transition.ts` | 状态机不变 |
| `src/lib/events.ts` | 通知机制已完善 |
| `src/lib/auth.ts` | getCurrentUser/verifyAccessToken 已就绪 |
| `src/lib/api-client.ts` | apiFetch 已就绪 |
| 所有 admin/* 页面 | M3 不改管理端 |

---

## 17. 执行计划

```
批次 1（3h）— 基础框架        ✅ 已完成 2026-03-23

批次 2（4.5h）— A 类资料上传核心 ⭐  ← 下一步
  ├── M3-5   presign/route.ts           预签名直传 API（40min）
  ├── M3-6   confirm/route.ts           上传确认 API + MIME 修正（50min）
  ├── M3-7   files/[id]/route.ts        文件删除 API（40min）
  ├── M3-19  schema.prisma + order.ts   通知类型 DOCS_SUBMITTED（20min）
  ├── M3-8   customer-upload.tsx        客户上传组件（1.5h）
  ├── M3-23  socket.ts                  Socket Cookie 认证（20min）
  ├── M3-24  documents/route.ts POST    发送清单通知客户（20min）
  └── 验收   tsc + build + 逻辑验证（20min）

批次 3（5h）— B 类材料 + 详情页 + 确认提交 + 出签反馈
  ├── M3-9   submit/route.ts            确认提交 API
  ├── M3-10  material-checklist.tsx     B 类材料面板
  ├── M3-11  orders/[id]/page.tsx       客户详情页 ⭐
  └── 集成 CustomerUpload + MaterialChecklist + StatusTimeline

批次 4（3h）— 通知 + Socket
  ├── M3-12  use-socket-client.ts       Socket 客户端 Hook
  ├── M3-14  notifications/page.tsx     通知中心
  └── M3-15  layout.tsx                 Tab 通知角标

批次 5（2.5h）— 个人中心
  ├── M3-16  profile/page.tsx           个人中心
  └── M3-17  change-password/route.ts   修改密码

批次 6（2.5h）— 通知闭环 + 管理端
  ├── M3-21  document-panel.tsx         文件删除集成
  ├── M3-22  document-panel.tsx         批量上传并发优化
  └── M3-20  全链路通知验证（9节点）

批次 7（2h）— 全量验收
  └── tsc + build + test + 全量检查
```

**总工作量：25h**

---

## 18. 验收标准

### 全局验收

| # | 检查项 | 标准 |
|---|---|---|
| 1 | `npx tsc --noEmit` | 0 错误 |
| 2 | `npm run build` | 0 警告 |
| 3 | `npm run test` | 74+ 通过 |
| 4 | `as any` | 0 处 |
| 5 | `console.log` | 0 处 |
| 6 | `TODO` | 0 处 |
| 7 | `'use client'` 首行 | 全部正确 |
| 8 | 内部导航 | 全部 `<Link>` |
| 9 | Prisma 可选字段 | 全部 `?? null` |

### 功能验收

| # | 功能 | 验收标准 |
|---|---|---|
| 1 | A 类资料上传 | presign → PUT → confirm 全流程，支持多文件/拍照/删除 |
| 2 | B 类材料展示 | MAKING_MATERIALS 显示制作中提示，之后可预览/下载 |
| 3 | 确认提交 | 有文件的 requirement 变 REVIEWING，资料员收到 DOCS_SUBMITTED |
| 4 | 出签反馈 | DELIVERED 状态客户可点"已出签"/"被拒签" |
| 5 | 通知中心 | 列表/未读/标记已读/全部已读/跳转订单 |
| 6 | Socket | 连接成功（Cookie 认证），通知推送触发角标更新 |
| 7 | 个人中心 | 信息展示，密码修改成功，订单入口可跳转 |
| 8 | 通知闭环 | 全部 9 个通知节点正确触发 |

### 端到端测试（15 步）

```
1. 客服创建订单 → 客户账号自动创建 → 客户收到 ORDER_CREATED
2. 资料员在公共池接单 → CONNECTED → 客户收到 STATUS_CHANGE
3. 资料员创建13项需求 → 发送客户 → 客户收到 DOC_REVIEWED ✅批次2
4. 客户登录 → 看到"📤有资料待上传" → 进入详情页
5. 客户逐项上传：护照（拍照）、身份证（文件）、银行流水（多文件）
6. 客户点击"确认提交" → REVIEWING → 资料员收到 DOCS_SUBMITTED
7. 资料员审核：护照 APPROVED、银行流水 SUPPLEMENT
8. 客户补充上传 → 确认提交 → 资料员再次收到通知
9. 资料员全部通过 → 提交审核 → PENDING_REVIEW
10. 操作员接单 → 确认达标 → MAKING_MATERIALS
11. 操作员上传保险/行程单 → PENDING_DELIVERY → 客户收到通知
12. 资料员确认交付 → DELIVERED → 客户收到通知
13. 客户下载签证材料
14. 客户反馈出签结果 → APPROVED
15. 全流程操作日志完整可追溯
```

---

## 19. 风险矩阵

| # | 风险 | 级别 | 解决方案 | 状态 |
|---|---|:---:|---|:---:|
| 1 | OSS CORS 限制 | 🟡 | Bucket 配置 CORS（部署时） | ⬜ |
| 2 | Socket Cookie 认证改造 | 🟡 | socket.ts 增加 Cookie fallback | ⬜批次2 |
| 3 | presigned URL 过期（1h） | 🟢 | 超时提示重试 | ⬜ |
| 4 | 大文件上传体验 | 🟢 | 前端预校验 50MB + 进度条 | ⬜ |
| 5 | 客户误删文件 | 🟢 | 确认弹窗 + 仅删自己上传的 | ⬜ |
| 6 | DOCS_SUBMITTED 枚举迁移 | 🟢 | db execute | ⬜批次2 |
| 7 | confirm 并发上传 | 🟢 | 条件更新 status，不覆盖 REVIEWING | ✅已设计 |
| 8 | OSS putMeta 失败 | 🟢 | try/catch 不影响主流程 | ✅已设计 |

---

## 20. 开发 Checklist

### 批次 2 开发前
- [ ] `npx tsc --noEmit` 确认 0 错误
- [ ] 阅读 `oss.ts` 的 `generatePresignedPutUrl` / `getSignedUrl` / `deleteFile`
- [ ] 阅读 `documents/upload/route.ts` 的 `ALLOWED_TYPES` 白名单
- [ ] 阅读 `rbac.ts` 当前 CUSTOMER 权限
- [ ] 阅读 `socket.ts` 当前认证逻辑

### 批次 2 完成后
- [ ] presign 返回有效 URL
- [ ] 客户端 PUT 直传 OSS 成功
- [ ] confirm 写库 + 状态条件更新 + MIME 修正
- [ ] 文件删除（OSS + DB + 状态回退）
- [ ] CustomerUpload 组件完整（上传/拍照/删除/预览/分组）
- [ ] DOCS_SUBMITTED 添加到 schema + types + 迁移
- [ ] Socket Cookie 认证改造
- [ ] 发送清单通知客户
- [ ] `npx tsc --noEmit` = 0 错误
- [ ] `npm run build` = 0 警告

### 批次 3 完成后
- [ ] 客户详情页完整展示
- [ ] A 类可上传
- [ ] B 类可下载（PENDING_DELIVERY+）
- [ ] MAKING_MATERIALS 显示制作中提示
- [ ] 确认提交通知资料员
- [ ] 出签反馈 UI 可用
- [ ] `npx tsc --noEmit` = 0 错误

### 批次 7（最终验收）
- [ ] 全部 9 项全局检查通过
- [ ] 端到端 15 步流程走通
- [ ] 移动端布局正常
- [ ] Git commit + push

---

*文档结束 — M3 全知手册 V6.0（两轮深度分析终版 + 批次2完整规格）*
