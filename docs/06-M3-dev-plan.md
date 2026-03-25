# 沐海旅行 ERP - M3 全知开发手册（V9.0 终版）

> **文档版本**: V10.0
> **更新日期**: 2026-03-26 00:38
> **用途**: M3 阶段唯一开发指南。即使丢失所有上下文，拿到本文件 + Git 仓库即可完整恢复开发。
> **前置条件**: M1 ✅ + M2 ✅ + M5 ✅ 全部完成（113 源文件 / ~13,069 行 / 34 API 路由 / 17 页面 / 25 组件 / 74 测试用例）
> **核心交付**: 客户端门户完整可用 + 两类资料交互闭环 + 实时通信接入 + 全链路通知闭环
> **分析基础**: 三轮深度分析（逐文件审查全部 113 个源文件 + 34 个 API 路由 + 工作流文档 + 客户材料清单 + 实际工作流比对）+ 批次2专项两轮审查 + 批次2深度审查4项修复 + 批次3完整实现+验收 + 批次4深度分析8缺口修复
> **当前阶段**: M3 批次 1-5/8 完成 ✅ | 下一步：批次 6（通知闭环+管理端增强）

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
| M3 文件与客户端 | 🔄 50%（批次 1-4/8 完成，25h 计划） |

### 1.3 代码规模

| 维度 | 数量 |
|---|---|
| 源文件 | 113 个 |
| 代码行数 | ~13,069 行 |
| API 路由 | 34 个 |
| 页面 | 17 个 |
| 组件 | 25 个 |
| 测试文件 | 4 个（74 用例） |
| Hooks | 3 个 |
| Stores | 3 个 |
| 工具库 | 11 个 |

### 1.4 关键文件位置速查

```
erp-project/                                    ← 项目根目录
├── prisma/schema.prisma                        ← ✅ 数据库 Schema（含 DOCS_SUBMITTED 已加，批次2）
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
│   │   │   │   ├── presign/route.ts            ← ✅ 已建：预签名直传 URL（批次2）
│   │   │   │   ├── confirm/route.ts            ← ✅ 已建：上传确认写库 + MIME 修正（批次2）
│   │   │   │   ├── files/[id]/route.ts         ← ✅ 已建：文件级删除（批次2）
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
│   │   │   └── customer-upload.tsx             ← ✅ 已建：客户上传组件（批次2）
│   │   └── ui/
│   │       ├── file-preview.tsx                ← ✅ 文件预览（compact+card+灯箱）
│   │       └── camera-capture.tsx              ← ✅ 拍照（前后置+取景框）
│   ├── hooks/
│   │   └── use-socket-client.ts                ← 新建：Socket.io 客户端（批次4）
│   ├── lib/
│   │   ├── oss.ts                              ← ✅ getOssClient单例导出/getSignedUrl/deleteFile/generatePresignedPutUrl（批次2）
│   │   ├── file-types.ts                       ← ✅ 已建：ALLOWED_FILE_TYPES + MAX_FILE_SIZE（批次2）
│   │   ├── socket.ts                           ← ✅ 已改：Cookie fallback 认证（批次2）
│   │   ├── rbac.ts                             ← ✅ CUSTOMER read/create/delete
│   │   ├── auth.ts                             ← ✅ getCurrentUser/verifyAccessToken
│   │   ├── events.ts                           ← ✅ eventBus + emitToUser
│   │   ├── api-client.ts                       ← ✅ apiFetch（Token 自动刷新）
│   │   └── transition.ts                       ← ✅ 状态机
│   ├── types/order.ts                          ← ✅ 已改：加 DOCS_SUBMITTED（批次2）
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
| `generatePresignedPutUrl(ossKey, mimeType, expires)` | `oss.ts` | 生成预签名上传 URL | 批次 2 ✅ |
| `getSignedUrl(ossKey, expires)` | `oss.ts` | 生成签名下载 URL（内联展示） | 批次 2 ✅ |
| `getDownloadUrl(ossKey, fileName, expires)` | `oss.ts` | 生成强制下载 URL | 批次 3 |
| `deleteFile(ossKey)` | `oss.ts` | 删除单个 OSS 文件 | 批次 2 ✅ |
| `deleteFiles(ossKeys)` | `oss.ts` | 批量删除 OSS 文件 | — |
| `buildOssKey(params)` | `oss.ts` | 构建 OSS 存储路径 | 批次 2 ✅ |
| `getOssClient()` | `oss.ts` | OSS 单例客户端（M3批次2新增导出） | 批次 2 ✅ |
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
| `MaterialChecklist` | `orders/material-checklist.tsx` | B类材料下载面板（MAKING_MATERIALS制作中提示+PENDING_DELIVERY+下载） | ✅批次3 |
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

#### 🔴 P0-1：Socket.io Cookie 认证失败 ✅ 已修复
- **文件**：`src/lib/socket.ts`
- **修复**：`io.use()` 增加 `parseCookies()` Cookie fallback 解析（批次 2 M3-23 ✅）

#### 🔴 P0-2：资料员发送清单后客户无通知 ✅ 已修复
- **修复**：POST 方法内查询 `order.customerId`，创建 `DOC_REVIEWED` 通知 + Socket 推送（批次 2 M3-24 ✅）

#### 🔴 P0-3：NotificationType 枚举缺少 DOCS_SUBMITTED ✅ 已修复
- **修复**：Schema + types/order.ts 都已加入 `DOCS_SUBMITTED`（批次 2 M3-19 ✅）

### 第二轮：逐文件深度审查（20 个关键文件）

#### 🟡 P1-4：presigned URL 未包含 Content-Type → OSS 对象 MIME 类型未知 ✅ 已修复
- **修复**：confirm API 中调用 `ossClient.copy()` with `x-oss-metadata-directive: REPLACE` 修正 MIME（批次 2 M3-6 ✅）

#### 🟡 P1-5：presign API 未校验文件类型 ✅ 已修复
- **修复**：presign API 使用共享 `ALLOWED_FILE_TYPES`（`src/lib/file-types.ts`）校验（批次 2 M3-5 ✅）

#### 🟢 P2-6：OSS Bucket CORS 未配置 ⬜ 部署时处理
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

#### 🟢 P2-7：confirm API 状态更新需条件判断 ✅ 已修复
- **修复**：confirm API 仅当 `status ∈ {PENDING, REJECTED, SUPPLEMENT}` 时设 UPLOADED（批次 2 M3-6 ✅）

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

> ✅ 已完成 2026-03-25 | 7 项子任务 + 深度审查 4 项修复全部交付

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

### 批次 2 验收（全部通过 ✅）

| # | 检查项 | 通过标准 | 结果 |
|---|---|---|:---:|
| 1 | `npx tsc --noEmit` | 0 错误 | ✅ |
| 2 | `npm run build` | 0 警告 | ✅ |
| 3 | presign → PUT → confirm 全流程 | 返回有效 URL，DB 记录正确，MIME 已修正 | ✅ |
| 4 | 文件删除（OSS + DB + 状态回退） | OSS 对象消失，requirement 无文件时回退 PENDING | ✅ |
| 5 | CustomerUpload 组件渲染 | 逐项显示名称/状态/说明/文件/操作按钮 | ✅ |
| 6 | 拍照上传可用 | CameraCapture → presign → PUT → confirm | ✅ |
| 7 | 多人订单分组 | applicantCount>1 时按人分组 | ✅ |
| 8 | Socket Cookie 认证 | 代码改造完成 | ✅ |
| 9 | 发送清单通知客户 | POST documents 后客户收到 DOC_REVIEWED | ✅ |
| 10 | presign 文件类型校验 | 不支持的类型返回 400 | ✅ |
| 11 | REVIEWING 状态上传不打断 | confirm 不将 REVIEWING 改回 UPLOADED | ✅ |

### 批次 2 深度审查修复（4 项全部完成 ✅）

| # | 优先级 | 文件 | 问题 | 修复 |
|---|:---:|---|---|---|
| 1 | 🔴 P0 | `confirm/route.ts` | ossKey 安全校验仅做 includes() 子串检查，可伪造 | 改为 startsWith() 验证完整路径前缀 |
| 2 | 🟡 P1 | `confirm/route.ts` | 每次 new OSS({...}) 创建实例 | 导出 oss.ts getOssClient() 单例复用 |
| 3 | 🟡 P1 | `presign+upload/route.ts` | ALLOWED_TYPES 硬编码两份 | 提取为 file-types.ts 共享常量 |
| 4 | 🟢 P2 | `customer-upload.tsx` | 批量上传每文件都 onRefresh() | handleUpload 返回 boolean，全部完成统一刷新 |

---

## 11. 批次 3：B 类材料 + 详情页 + 确认提交 + 出签反馈

> ✅ 已完成 2026-03-25 | 3 项子任务全部交付

### M3-9：客户确认提交 API ✅

**新建** `src/app/api/orders/[id]/submit/route.ts`（117 行）

```
端点：POST /api/orders/[id]/submit
认证：getCurrentUser(request)
```

**请求体**：无（纯 POST，无需 body）

**处理逻辑（完整实现）**：
1. 认证 + 校验 `customerId === user.userId`（只能提交自己的订单）
2. 查询订单含 `documentRequirements`（含 `_count.files`）+ `collectorId` + `orderNo`
3. 验证 `status === COLLECTING_DOCS`（否则抛 400 `INVALID_STATUS`）
4. 筛选有文件的 requirements：`r._count.files > 0`
5. 验证至少一个有文件（否则抛 400 `NO_FILES`）
6. **幂等处理**：所有有文件的已是 REVIEWING → 直接返回成功
7. 事务内：
   a. 遍历有文件的 req，`status !== REVIEWING && !== APPROVED` → 设 REVIEWING
   b. 写操作日志：`action='客户确认提交资料'`, `detail='提交了 N 项资料'`
   c. 创建通知给 `order.collectorId`：`type=DOCS_SUBMITTED`, 含需求项名称列表
8. 事务后：`emitToUser(collectorId, 'notification', {...})` Socket 推送

**错误码**：401 未登录 / 404 订单不存在 / 400 状态不可提交 / 400 无文件

**关键设计**：
- 不改变订单状态（仍为 COLLECTING_DOCS），等资料员全部 APPROVED 后手动推 PENDING_REVIEW
- 无文件的 requirement 保持 PENDING，资料员可继续追加需求
- 幂等：重复提交不会报错，返回"已提交"消息

### M3-10：B 类材料说明面板 ✅

**新建** `src/components/orders/material-checklist.tsx`（93 行）

**Props**：
```typescript
interface MaterialChecklistProps {
  status: OrderStatus
  materials: VisaMaterial[]
}
```

**渲染逻辑**：
- `status === MAKING_MATERIALS`：居中显示"签证材料正在制作中，请耐心等待..." + 加载动画 + "制作完成后会第一时间通知您"
- `status ∈ {PENDING_DELIVERY, DELIVERED, APPROVED, REJECTED, PARTIAL}`：
  - 材料列表，每个材料显示：FilePreview(compact) + 下载按钮 + 版本号 + 创建时间 + 备注
  - 下载链接用 `mat.ossUrl`（DB 中已存的签名 URL，7天有效）
  - 空列表显示"暂无签证材料"
- 其他状态：不渲染（return null）

**注意**：客户端组件不能调用 `getDownloadUrl()`（服务端函数），使用 DB 中存储的 `ossUrl` 签名链接。

### M3-11：客户订单详情页 ⭐ ✅

**新建** `src/app/customer/orders/[id]/page.tsx`（352 行）

**数据获取**：`apiFetch('/api/orders/${orderId}')` → `OrderDetail`（含 applicants/documentRequirements+files/visaMaterials/orderLogs）

**页面结构（完整实现）**：
```
[头部]
← 返回按钮    HX2026XXXXX    [StatusBadge 状态徽章]

[签证概要]
🌍 法国 · 旅游签证 👥 2人（多人时显示）

[状态时间线]
GlassCard 包裹 StatusTimeline 组件（竖向6步+完成时间+终态）

━━━ 分隔线 ━━━

[📤 我需要上传的资料]
CustomerUpload 组件（已实现，直接复用）
  requirements={order.documentRequirements}
  applicantCount={order.applicantCount}
  applicants={order.applicants}
  onRefresh={fetchOrder}

[✅ 确认提交资料] 按钮
  显示条件：status === COLLECTING_DOCS && 有文件
  禁用态：提交中显示 spinner
  提交后：toast 成功 + fetchOrder 刷新
  已提交提示：所有 REVIEWING/APPROVED → "资料已提交，正在审核中"

━━━ 分隔线 ━━━

[📥 签证材料（为您制作）]
MaterialChecklist 组件
  status={order.status}
  materials={order.visaMaterials}
  仅 MAKING_MATERIALS+ 状态显示

━━━ 分隔线 ━━━

[🎫 签证结果] ← 仅 DELIVERED 状态
  初始：[确认签证结果] 按钮
  点击后展开：
    [✅ 已出签] [❌ 被拒签] [取消]
  反馈 API：POST /api/orders/[id]/status body: { toStatus: 'APPROVED'|'REJECTED' }

━━━ 分隔线 ━━━

[📋 订单信息] GlassCard
  InfoRow 显示：目标国家/签证类型/签证类别/出行日期/金额/支付方式/预约日期/指纹采集/送签城市/创建时间

[📜 操作记录] GlassCard（非空时显示）
  竖线+圆点时间线：操作人 + 时间 + 操作内容 + 详情
```

**状态判断**：
- `canSubmit = status === 'COLLECTING_DOCS' && documentRequirements.some(r => r.files.length > 0)`
- `canFeedback = status === 'DELIVERED'`
- `showMaterials = status ∈ {MAKING_MATERIALS, PENDING_DELIVERY, DELIVERED, APPROVED, REJECTED, PARTIAL}`
- `showDocuments = documentRequirements.length > 0`

**加载态**：骨架屏复用 `loading.tsx` 风格

**空态**：订单不存在 → 提示 + 返回订单列表按钮

### 批次 3 验收（全部通过 ✅）

| # | 检查项 | 结果 |
|---|---|:---:|
| 1 | `npx tsc --noEmit` | ✅ 0 错误 |
| 2 | `npm run build` | ✅ 0 警告 0 错误 |
| 3 | `npm run test` | ✅ 74/74 通过 |
| 4 | `as any` / `console.log` / `TODO` | ✅ 全部 0 |
| 5 | `'use client'` 首行 | ✅ 全部正确 |
| 6 | 确认提交 API 幂等性 | ✅ REVIEWING 不重复更新 |
| 7 | MaterialChecklist 无服务端依赖 | ✅ 用 DB ossUrl 非 getDownloadUrl |

---

## 12. 批次 4：通知 + Socket ✅ 已完成

> 3h | 完成于 2026-03-25 | Git: c30e666

### 深度分析发现的 8 个缺口

| # | 级别 | 缺口 | 修复 |
|---|:---:|---|---|
| 1 | 🔴P0 | `NotificationItem` 缺 `orderId` | notification-store.ts 接口加 `orderId: string \| null` |
| 2 | 🔴P0 | Socket 单例无生命周期管理 | Hook 暴露 `disconnect()` 方法 |
| 3 | 🔴P0 | 通知类型路由逻辑未定义 | 新建 `notification-icons.ts` 共享 `getNotificationRoute()` |
| 4 | 🟡P1 | 通知中心无分页 | page.tsx 实现分页 20条/页 + "加载更多"按钮 |
| 5 | 🟡P1 | 双重轮询浪费 | layout.tsx Socket 实时 + `isConnected` 控制轮询 fallback |
| 6 | 🟡P1 | 通知图标映射重复 | 提取 `notification-icons.ts` 共享常量 |
| 7 | 🟡P1 | Socket 断连无 UI 反馈 | Hook 返回 `isConnected` 状态 |
| 8 | 🟢P2 | 角标更新延迟 | store 内 `markAsRead` 已即时更新，验证通过 |

### 交付清单

#### M3-12：Socket 客户端 Hook ✅

**文件**：`src/hooks/use-socket-client.ts`（72 行）

**实际实现**（完整代码）：
```typescript
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  onNotification?: (data: {
    type: string
    title: string
    orderId?: string
    orderNo?: string
  }) => void
}

// 全局单例：跨页面复用
let socketInstance: Socket | null = null

export function useSocketClient(options: UseSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(socketInstance?.connected ?? false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    // 已有连接且存活 → 复用，只更新回调
    if (socketInstance?.connected) {
      setIsConnected(true)
      return
    }

    // 如果有残留的断开连接，先清理
    if (socketInstance) {
      socketInstance.removeAllListeners()
      socketInstance.disconnect()
      socketInstance = null
    }

    const socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    })

    socketInstance = socket

    socket.on('connect', () => { setIsConnected(true) })
    socket.on('disconnect', () => { setIsConnected(false) })
    socket.on('connect_error', () => { setIsConnected(false) })

    socket.on('notification', (data) => {
      optionsRef.current.onNotification?.(data)
    })

    // Tab 恢复前台时主动重连
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // 手动断开（登出时调用）
  const disconnect = useCallback(() => {
    if (socketInstance) {
      socketInstance.removeAllListeners()
      socketInstance.disconnect()
      socketInstance = null
      setIsConnected(false)
    }
  }, [])

  return { isConnected, disconnect }
}
```

**关键设计**：
- 单例模式：全局 `socketInstance`，页面切换不断开
- Cookie 认证：不传 `auth.token`，浏览器自动携带 HttpOnly Cookie
- `isConnected` 状态：布局层可据此切换轮询/实时模式
- `disconnect()` 方法：登出时清理连接
- `visibilitychange` 监听：Tab 恢复前台时自动重连

#### M3-14：通知中心页面 ✅

**文件**：`src/app/customer/notifications/page.tsx`（185 行）

**功能清单**：
- 通知列表按时间倒序展示（20条/页）
- 未读通知：左侧蓝色边框 + 右侧蓝点
- 通知类型图标（复用 `NOTIFICATION_ICONS` 共享常量）
- 点击自动标记已读 + 跳转对应订单（`getNotificationRoute()`）
- "全部已读"按钮（仅未读 > 0 时显示）
- "加载更多"分页按钮（触底加载下一页）
- 空态：铃铛图标 + "暂无消息" + "订单状态变更时会通知您"
- 加载态：旋转动画

#### M3-15：Tab 通知角标集成 ✅

**修改文件**：`src/app/customer/layout.tsx`

**变更内容**：
1. 导入 `useSocketClient` Hook
2. `onNotification` 回调中调用 `fetchUnreadCount()` 即时刷新角标
3. 用 `isConnected` 状态控制轮询策略：
   - Socket 已连接 → 不轮询（靠实时推送）
   - Socket 断连 → 启动 30s 轮询作为 fallback

**关键代码**：
```typescript
const { isConnected } = useSocketClient({
  onNotification: () => { fetchUnreadCount() },
})

useEffect(() => {
  fetchUnreadCount()
}, [fetchUnreadCount])

useEffect(() => {
  if (isConnected) return // Socket 正常时不轮询
  const interval = setInterval(fetchUnreadCount, 30000)
  return () => clearInterval(interval)
}, [isConnected, fetchUnreadCount])
```

#### 共享常量 ✅

**新建**：`src/lib/notification-icons.ts`（17 行）

```typescript
// 通知类型 → 图标
export const NOTIFICATION_ICONS: Record<string, string> = {
  ORDER_NEW: '🆕', ORDER_CREATED: '📋', STATUS_CHANGE: '🔄',
  DOC_REVIEWED: '📄', DOCS_SUBMITTED: '📤', MATERIAL_UPLOADED: '📥',
  MATERIAL_FEEDBACK: '📝', APPOINTMENT_REMIND: '⏰', SYSTEM: '🔔',
}

// 根据通知获取跳转路由
export function getNotificationRoute(orderId: string | null): string | null {
  if (!orderId) return null
  return `/customer/orders/${orderId}`
}
```

被 `customer/notifications/page.tsx` 和 `notifications/notification-bell.tsx` 共同引用。

#### Store 修复 ✅

**修改**：`src/stores/notification-store.ts`

`NotificationItem` 接口新增 `orderId: string | null` 字段。API 本身已返回此字段（Notification schema 有 `orderId`），之前只是 TypeScript 类型定义遗漏。

### 批次 4 验收（全部通过 ✅）

| # | 检查项 | 结果 |
|---|---|:---:|
| 1 | `npx tsc --noEmit` | ✅ 0 错误 |
| 2 | `npm run build` | ✅ 0 警告 |
| 3 | `npm run test` | ✅ 74/74 通过 |
| 4 | `as any` / `console.log` / `TODO` | ✅ 全部 0 |
| 5 | Socket 连接 + Cookie 认证 | ✅ 代码完成 |
| 6 | 通知中心：加载/分页/已读/跳转 | ✅ |
| 7 | Tab 角标：Socket 实时 + 断连 fallback | ✅ |
| 8 | notification-bell 复用共享常量 | ✅ |

---

## 13. 批次 5：个人中心

> 2.5h，无依赖。

### M3-16：个人中心页面

**新建** `src/app/customer/profile/page.tsx`

**功能**：
- 用户信息展示（头像/姓名/手机/邮箱/角色）
- 修改密码入口
- 订单入口（跳转 /customer/orders）
- 退出登录按钮

**完整代码模板**：
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { GlassCard } from '@/components/layout/glass-card'
import { useToast } from '@/components/ui/toast'
import { apiFetch } from '@/lib/api-client'

export default function CustomerProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { toast } = useToast()

  // 修改密码
  const [showPwForm, setShowPwForm] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast('error', '请填写完整')
      return
    }
    if (newPassword.length < 6) {
      toast('error', '新密码至少6位')
      return
    }
    if (newPassword !== confirmPw) {
      toast('error', '两次输入不一致')
      return
    }
    setIsSaving(true)
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '密码修改成功')
        setShowPwForm(false)
        setOldPassword('')
        setNewPassword('')
        setConfirmPw('')
      } else {
        toast('error', json.error?.message ?? '修改失败')
      }
    } catch {
      toast('error', '修改失败')
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">我的</h2>

      {/* 用户信息 */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-xl font-bold text-[var(--color-primary)]">
            {user.realName?.[0] ?? user.username[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {user.realName ?? user.username}
            </p>
            <p className="text-xs text-[var(--color-text-placeholder)] mt-0.5">
              {user.phone}
            </p>
            {user.email && (
              <p className="text-xs text-[var(--color-text-placeholder)]">{user.email}</p>
            )}
          </div>
        </div>
      </GlassCard>

      {/* 菜单 */}
      <GlassCard className="divide-y divide-white/[0.06]">
        <MenuItem
          icon="📋"
          label="我的订单"
          onClick={() => router.push('/customer/orders')}
        />
        <MenuItem
          icon="🔒"
          label="修改密码"
          onClick={() => setShowPwForm(!showPwForm)}
        />
      </GlassCard>

      {/* 修改密码表单 */}
      {showPwForm && (
        <GlassCard className="p-5 space-y-3">
          <input
            type="password"
            placeholder="当前密码"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:border-[var(--color-primary)]/50"
          />
          <input
            type="password"
            placeholder="新密码（至少6位）"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:border-[var(--color-primary)]/50"
          />
          <input
            type="password"
            placeholder="确认新密码"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:border-[var(--color-primary)]/50"
          />
          <button
            onClick={handleChangePassword}
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? '提交中...' : '确认修改'}
          </button>
        </GlassCard>
      )}

      {/* 退出登录 */}
      <button
        onClick={() => { void logout() }}
        className="w-full py-3 rounded-xl border border-[var(--color-error)]/30 text-[var(--color-error)] text-sm font-medium hover:bg-[var(--color-error)]/10 transition-colors"
      >
        退出登录
      </button>
    </div>
  )
}

function MenuItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
      </div>
      <svg className="w-4 h-4 text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
```

### M3-17：修改密码 API

**新建** `src/app/api/auth/change-password/route.ts`

```
端点：POST /api/auth/change-password
认证：getCurrentUser(request)
```

**请求体（Zod 校验）**：
```typescript
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6).max(50),
})
```

**处理逻辑**：
1. 认证（所有已登录用户可调用）
2. Zod 校验
3. 查询用户（`id === user.userId`）
4. `bcrypt.compare(oldPassword, user.passwordHash)` 验证旧密码
5. `bcrypt.hash(newPassword, 10)` 哈希新密码
6. 更新 `passwordHash`
7. 返回成功

**错误码**：401 未登录 / 400 参数校验失败 / 401 旧密码错误

**完整代码模板**：
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { AppError, createSuccessResponse } from '@/types/api'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(6, '新密码至少6位').max(50, '新密码最多50位'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    const body = await request.json()
    const data = changePasswordSchema.parse(body)

    // 查询当前密码
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { passwordHash: true },
    })
    if (!dbUser) throw new AppError('NOT_FOUND', '用户不存在', 404)

    // 验证旧密码
    const isOldValid = await bcrypt.compare(data.oldPassword, dbUser.passwordHash)
    if (!isOldValid) throw new AppError('INVALID_PASSWORD', '当前密码错误', 401)

    // 更新密码
    const newHash = await bcrypt.hash(data.newPassword, 10)
    await prisma.user.update({
      where: { id: user.userId },
      data: { passwordHash: newHash },
    })

    return NextResponse.json(createSuccessResponse({ message: '密码修改成功' }))
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

## 14. 批次 6：通知闭环 + 管理端增强

> 2.5h，依赖批次 2+3。

- M3-18 已在批次 2（M3-24）修复 ✅（发送清单通知客户）
- M3-21：文件删除集成到 DocumentPanel
- M3-22：批量上传并发优化
- M3-20：全链路通知验证（9 节点）

### M3-21：文件删除集成到 DocumentPanel

**修改** `src/components/documents/document-panel.tsx`

**当前状态**：管理端 DocumentPanel 支持上传/审核/预览，但没有文件级删除按钮。

**修改内容**：
1. 在每个文件行添加"删除"按钮（仅 `OPERATOR`/`DOC_COLLECTOR`/`VISA_ADMIN` 可见）
2. 删除逻辑复用 `DELETE /api/documents/files/${fileId}`
3. 删除后 `onRefresh()` 刷新

**关键代码片段**（在文件列表渲染处添加）：
```tsx
{canDelete && (
  <button
    onClick={async () => {
      if (!confirm('确定删除该文件？')) return
      const res = await apiFetch(`/api/documents/files/${file.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast('success', '已删除')
        onRefresh?.()
      } else {
        toast('error', json.error?.message ?? '删除失败')
      }
    }}
    className="text-xs text-[#B87C7C] hover:text-[#B87C7C]/80"
  >
    删除
  </button>
)}
```

**`canDelete` 判断**：`['DOC_COLLECTOR', 'OPERATOR', 'VISA_ADMIN', 'COMPANY_OWNER'].includes(user.role)`

### M3-22：批量上传并发优化

**修改** `src/components/documents/document-panel.tsx`（上传逻辑）

**当前问题**：多文件上传是串行的（逐个上传），大文件多时体验差。

**优化方案**：改为并发上传（最多 3 个同时），带整体进度。

**关键代码片段**：
```typescript
async function handleBatchUpload(requirementId: string, files: FileList) {
  const fileArray = Array.from(files)
  const CONCURRENCY = 3
  let completed = 0

  // 并发池
  const pool = async (file: File) => {
    const ok = await handleSingleUpload(requirementId, file)
    completed++
    setBatchProgress({ current: completed, total: fileArray.length })
    return ok
  }

  // 分批执行
  const results: boolean[] = []
  for (let i = 0; i < fileArray.length; i += CONCURRENCY) {
    const batch = fileArray.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(batch.map(pool))
    results.push(...batchResults)
  }

  if (results.some(Boolean)) onRefresh?.()
}
```

### M3-20：全链路通知验证（9 节点）

手动走一遍端到端流程，验证每个通知节点：

| # | 节点 | 触发方式 | 接收者 | 验证方法 |
|---|---|---|---|---|
| 1 | ORDER_NEW | 客服创建订单 | 资料员 | 登录资料员账号检查通知 |
| 2 | ORDER_CREATED | 客服创建订单 | 客户 | 登录客户账号检查通知 |
| 3 | STATUS_CHANGE | 任何状态流转 | 相关人员 | 接单/审核/交付时检查 |
| 4 | DOC_REVIEWED | 资料员发送清单 | 客户 | 客户检查通知+详情页有需求项 |
| 5 | DOCS_SUBMITTED | 客户确认提交 | 资料员 | 资料员检查通知+需求项变 REVIEWING |
| 6 | DOC_REVIEWED | 资料审核驳回 | 客户 | 客户检查驳回原因 |
| 7 | MATERIAL_UPLOADED | 操作员上传材料 | 资料员+客户 | 双方检查通知 |
| 8 | STATUS_CHANGE | 取消订单 | 相关人员 | 检查通知 |
| 9 | STATUS_CHANGE | 转单 | 目标用户 | 检查通知 |

**验收标准**：9 个节点全部触发，通知内容准确（中文），Socket 推送实时到达。

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
| 1 | `src/app/api/documents/presign/route.ts` | ✅ 2 | 预签名直传 URL |
| 2 | `src/app/api/documents/confirm/route.ts` | ✅ 2 | 上传确认写库 + MIME 修正 |
| 3 | `src/app/api/documents/files/[id]/route.ts` | ✅ 2 | 文件级删除 |
| 4 | `src/components/documents/customer-upload.tsx` | ✅ 2 | 客户上传组件 ⭐ |
| 5 | `src/lib/file-types.ts` | ✅ 2 | 文件类型白名单常量 |
| 6 | `src/app/api/orders/[id]/submit/route.ts` | ✅ 3 | 客户确认提交 + 通知 |
| 7 | `src/components/orders/material-checklist.tsx` | ✅ 3 | B 类材料下载面板 |
| 8 | `src/app/customer/orders/[id]/page.tsx` | ✅ 3 | 客户订单详情页 ⭐ |
| 9 | `src/lib/notification-icons.ts` | ✅ 4 | 通知类型图标+路由映射共享常量 |
| 10 | `src/hooks/use-socket-client.ts` | ✅ 4 | Socket 客户端 Hook ⭐ |
| 11 | `src/app/customer/notifications/page.tsx` | ✅ 4 | 通知中心页面 ⭐ |
| 12 | `src/app/customer/profile/page.tsx` | ✅ 5 | 个人中心（用户信息+修改密码+退出登录） |

### 修改文件（7 个）

| # | 文件 | 批次 | 变更 |
|---|---|:---:|---|
| 1 | `prisma/schema.prisma` | ✅ 2 | NotificationType 加 DOCS_SUBMITTED |
| 2 | `src/types/order.ts` | ✅ 2 | NotificationType 加 DOCS_SUBMITTED |
| 3 | `src/lib/socket.ts` | ✅ 2 | Cookie 认证改造 |
| 4 | `src/lib/oss.ts` | ✅ 2 | 导出 getOssClient 单例 |
| 5 | `src/app/api/orders/[id]/documents/route.ts` | ✅ 2 | POST 加通知客户 + Socket 推送 |
| 6 | `src/stores/notification-store.ts` | ✅ 4 | NotificationItem 加 orderId 字段 |
| 7 | `src/app/customer/layout.tsx` | ✅ 4 | Socket 实时角标 + isConnected 轮询 fallback |
| 8 | `src/components/notifications/notification-bell.tsx` | ✅ 4 | 复用 NOTIFICATION_ICONS 共享常量 |

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

批次 2（4.5h）— A 类资料上传核心 ⭐  ✅ 已完成 2026-03-25
  ├── M3-5   presign/route.ts           预签名直传 API ✅
  ├── M3-6   confirm/route.ts           上传确认 API + MIME 修正 ✅
  ├── M3-7   files/[id]/route.ts        文件删除 API ✅
  ├── M3-19  schema.prisma + order.ts   通知类型 DOCS_SUBMITTED ✅
  ├── M3-8   customer-upload.tsx        客户上传组件 ✅
  ├── M3-23  socket.ts                  Socket Cookie 认证 ✅
  ├── M3-24  documents/route.ts POST    发送清单通知客户 ✅
  ├── file-types.ts                     共享文件类型常量 ✅
  └── 深度审查  4项修复(ossKey验证/OSS单例/常量提取/批量刷新) ✅

批次 3（5h）— B 类材料 + 详情页 + 确认提交 + 出签反馈  ✅ 已完成 2026-03-25
  ├── M3-9   submit/route.ts            确认提交 API ✅
  ├── M3-10  material-checklist.tsx     B 类材料面板 ✅
  ├── M3-11  orders/[id]/page.tsx       客户详情页 ⭐ ✅
  └── 验收：tsc 0错误 / build 0警告 / test 74通过 ✅

批次 4（3h）— 通知 + Socket  ✅ 已完成 2026-03-25
  ├── M3-12  use-socket-client.ts       Socket 客户端 Hook ✅
  ├── M3-14  notifications/page.tsx     通知中心(分页+跳转) ✅
  ├── M3-15  layout.tsx                 Tab 通知角标实时集成 ✅
  ├── notification-icons.ts             共享常量 ✅
  ├── notification-store.ts             +orderId字段 ✅
  ├── notification-bell.tsx             复用共享图标 ✅
  └── 深度审查  8项缺口修复 ✅

批次 5（2.5h）— 个人中心  ✅ 已完成 2026-03-26
  ├── M3-16  profile/page.tsx           个人中心 ✅ (220行-用户信息+修改密码+密码强度+退出)
  └── M3-17  change-password/route.ts   修改密码 ✅ (64行-旧密码校验+空密码检测+PRD合规规则)

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
| 2 | Socket Cookie 认证改造 | 🟡 | socket.ts 增加 Cookie fallback | ✅批次2 |
| 3 | presigned URL 过期（1h） | 🟢 | 超时提示重试 | ⬜ |
| 4 | 大文件上传体验 | 🟢 | 前端预校验 50MB + 进度条 | ✅批次2 |
| 5 | 客户误删文件 | 🟢 | 确认弹窗 + 仅删自己上传的 | ✅批次2 |
| 6 | DOCS_SUBMITTED 枚举迁移 | 🟢 | db execute | ✅批次2 |
| 7 | confirm 并发上传 | 🟢 | 条件更新 status，不覆盖 REVIEWING | ✅批次2 |
| 8 | OSS putMeta 失败 | 🟢 | try/catch 不影响主流程 | ✅批次2 |
| 9 | ossKey 路径伪造 | 🔴 | startsWith 验证完整路径前缀 | ✅批次2修复 |
| 10 | ALLOWED_TYPES 重复维护 | 🟡 | 提取为 file-types.ts 共享常量 | ✅批次2修复 |

---

## 20. 开发 Checklist

### 批次 2 开发前
- [ ] `npx tsc --noEmit` 确认 0 错误
- [ ] 阅读 `oss.ts` 的 `generatePresignedPutUrl` / `getSignedUrl` / `deleteFile`
- [ ] 阅读 `documents/upload/route.ts` 的 `ALLOWED_TYPES` 白名单
- [ ] 阅读 `rbac.ts` 当前 CUSTOMER 权限
- [ ] 阅读 `socket.ts` 当前认证逻辑

### 批次 2 完成后 ✅ 全部通过
- [x] presign 返回有效 URL
- [x] 客户端 PUT 直传 OSS 成功
- [x] confirm 写库 + 状态条件更新 + MIME 修正
- [x] 文件删除（OSS + DB + 状态回退）
- [x] CustomerUpload 组件完整（上传/拍照/删除/预览/分组）
- [x] DOCS_SUBMITTED 添加到 schema + types + 迁移
- [x] Socket Cookie 认证改造
- [x] 发送清单通知客户
- [x] `npx tsc --noEmit` = 0 错误
- [x] `npm run build` = 0 警告
- [x] 深度审查 ossKey 路径验证修复
- [x] 深度审查 OSS 单例复用修复
- [x] 深度审查 ALLOWED_TYPES 共享常量修复
- [x] 深度审查批量上传刷新优化

### 批次 3 完成后 ✅ 全部通过
- [x] 客户详情页完整展示
- [x] A 类可上传（复用 CustomerUpload）
- [x] B 类可下载（PENDING_DELIVERY+）
- [x] MAKING_MATERIALS 显示制作中提示
- [x] 确认提交通知资料员（DOCS_SUBMITTED + Socket 推送）
- [x] 出签反馈 UI 可用（DELIVERED 状态可点）
- [x] 确认提交幂等（REVIEWING 不重复更新）
- [x] MaterialChecklist 无服务端依赖（用 DB ossUrl）
- [x] `npx tsc --noEmit` = 0 错误
- [x] `npm run build` = 0 警告
- [x] 74 tests pass

### 批次 7（最终验收）
- [ ] 全部 9 项全局检查通过
- [ ] 端到端 15 步流程走通
- [ ] 移动端布局正常
- [ ] Git commit + push

---

*文档结束 — M3 全知手册 V8.0（批次1-3完成版 + 批次4-6完整规格）*
