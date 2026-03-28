# 沐海旅行 ERP - M4 实时通信全知开发手册

> **文档版本**: V7.0
> **创建日期**: 2026-03-28
> **更新日期**: 2026-03-29 02:05（批次 1+2 全部完成，presign/confirm 扩展+5 个聊天 API+tsc 0 错误+build 通过，源文件 126 / ~14,200 行 / 44 API 路由）
> **用途**: M4 阶段唯一开发指南。拿到本文件 + Git 仓库即可完整恢复开发上下文。
> **前置条件**: M1 ✅ + M2 ✅ + M3 ✅ + M5 ✅ 全部完成（126 源文件 / ~14,200 行 / 44 API 路由 / 18 页面 / 25 组件 / 74 测试用例）
> **核心交付**: 订单级站内聊天 + 管理端内部通讯 + 已读回执 + 消息持久化 + Socket.io 实时推送
> **预估工时**: ~22 小时（5 个批次）

---

## 目录

1. [M4 总览与目标](#1-m4-总览与目标)
2. [前置条件与现有资产](#2-前置条件与现有资产)
3. [业务场景深度分析](#3-业务场景深度分析)
4. [架构决策（14 项）](#4-架构决策-14-项)
5. [数据库设计](#5-数据库设计)
6. [API 端点设计](#6-api-端点设计)
7. [Socket.io 事件设计](#7-socketio-事件设计)
8. [前端组件设计](#8-前端组件设计)
9. [批次拆分与执行计划](#9-批次拆分与执行计划)
10. [批次 1：数据层 + 类型 + 迁移](#10-批次-1数据层--类型--迁移)
11. [批次 2：聊天 API](#11-批次-2聊天-api)
12. [批次 3：Socket.io 聊天事件](#12-批次-3socketio-聊天事件)
13. [批次 4：前端聊天 UI](#13-批次-4前端聊天-ui)
14. [批次 5：全量验收 + 优化](#14-批次-5全量验收--优化)
15. [文件变更全量清单](#15-文件变更全量清单)
16. [V3.0 深度审查缺口清单（20 项）](#16-v30-深度审查缺口清单-20-项)
17. [验收标准](#17-验收标准)

---

## 1. M4 总览与目标

### 1.1 一句话描述

在现有通知系统之上，新增 **订单级站内聊天**——客户与客服/资料员/操作员围绕订单进行即时沟通，所有消息持久化存储，支持已读回执、未读计数、文件/图片发送。

### 1.2 核心价值

| 痛点 | M4 解决方案 |
|---|---|
| 客户有问题只能打电话/微信找客服，信息散落 | 订单内直接沟通，历史可追溯 |
| 审核打回后客户不知道具体要改什么 | 打回时附带聊天说明，客户可追问 |
| 资料员/操作员之间沟通靠口头/微信 | 内部通讯可 @指定角色 |
| 管理者无法了解服务过程 | 聊天记录可审计 |

### 1.3 不做什么（范围排除）

| 排除项 | 原因 |
|---|---|
| 群聊 / 部门群组 | 签证行业一对一沟通为主，群聊 ROI 低 |
| 语音/视频通话 | 技术复杂度高，P2 级需求 |
| 消息撤回/编辑 | ERP 场景不需要，简化实现 |
| 表情包/GIF | 保持商务场景专业性 |
| 端到端加密 | 企业内部系统，不需要 |

---

## 2. 前置条件与现有资产

### 2.1 已有基础设施（可直接复用）

| 资产 | 文件 | 说明 |
|---|---|---|
| Socket.io 服务端 | `src/lib/socket.ts` | `initSocketServer` + `emitToUser` + `emitToCompany`，房间设计已有 `user:{userId}` 和 `company:{companyId}` |
| Custom Server | `server.ts` | Next.js + Socket.io 共享端口，无需额外端口 |
| Socket 客户端 Hook | `src/hooks/use-socket-client.ts` | 单例模式 + Cookie 认证 + `isConnected` + `disconnect` + visibilitychange 重连 |
| 通知系统 | `src/lib/events.ts` | EventBus + 通知创建 + Socket 推送，9 节点全部闭环 |
| 通知 Store | `src/stores/notification-store.ts` | Zustand + `addNotification` + 未读计数 |
| API 客户端封装 | `src/lib/api-client.ts` | `apiFetch` + 401 自动刷新 + 重试 |
| 权限系统 | `src/lib/rbac.ts` | 9 级 RBAC + `requirePermission` + `getDataScopeFilter` |
| 文件上传 | `src/lib/oss.ts` | 阿里云 OSS + 预签名直传 `buildOssKey` + `generatePresignedPutUrl` |
| 文件预览 | `src/components/ui/file-preview.tsx` | 图片/PDF/TXT + 灯箱 + 下载 |
| 拍照组件 | `src/components/ui/camera-capture.tsx` | 前后置切换 + 证件取景引导框 |
| Prisma Client | `src/lib/prisma.ts` | 单例 |
| 订单级房间 | Socket.io `order:{orderId}` | 架构文档已预留，当前代码未 join |
| 中间件 | `src/middleware.ts` | 公开路由白名单 + 统一鉴权 + 客户跳转，`/api/chat/*` 自动鉴权无需修改 |

### 2.2 关键约束

- 数据库：阿里云 RDS MySQL 8.0，与其他项目共享（必须 `erp_` 前缀）
- 禁止 `prisma db push`，使用 `prisma db execute --file` 执行 SQL
- TypeScript 严格模式 + `exactOptionalPropertyTypes`
- Prisma 可选字段必须 `?? null`
- 新 Model 必须 `@@map("erp_xxx")`
- 新字段必须 `@map("snake_case")`
- MySQL 兼容：不使用 PostgreSQL 特有语法（如 `NULLS LAST`）

---

## 3. 业务场景深度分析

### 3.1 用户角色与聊天关系

```
场景一：客户 ↔ 客服（最高频）
  客户（CUSTOMER Lv9）↔ 客服（CUSTOMER_SERVICE Lv4 / CS_ADMIN Lv3）
  触发：客户有疑问、客服主动联系、审核打回后沟通

场景二：资料员 ↔ 客户
  资料员（DOC_COLLECTOR Lv6）↔ 客户（CUSTOMER Lv9）
  触发：资料收集中需要补充说明、催促上传

场景三：操作员 ↔ 资料员（内部）
  操作员（OPERATOR Lv7）↔ 资料员（DOC_COLLECTOR Lv6）
  触发：审核中发现材料问题需内部沟通

场景四：管理者查看
  管理者（COMPANY_OWNER Lv2 / CS_ADMIN Lv3 / VISA_ADMIN Lv5）
  触发：查看聊天记录了解服务过程（只读 / 可介入）
```

### 3.2 聊天入口位置

| 入口 | 页面 | 操作 |
|---|---|---|
| 订单详情页（管理端） | `/admin/orders/[id]` | 新增「聊天」Tab（含未读角标） |
| 订单详情页（客户端） | `/customer/orders/[id]` | 页面底部浮动聊天按钮 → 抽屉面板（移动端全屏） |
| 顶栏（管理端） | `topbar.tsx` | 消息图标 + 全局未读计数 + 会话列表下拉 |

### 3.3 消息类型

| 类型 | 说明 | 发送方式 |
|---|---|---|
| TEXT | 文本消息 | 输入框直接发送 |
| IMAGE | 图片消息 | 上传/拍照 → OSS → 发送 |
| FILE | 文件消息 | 上传 → OSS → 发送 |
| SYSTEM | 系统消息 | 系统自动生成（不可人工发送） |

> 系统消息示例：
> - "订单已创建，客服将尽快与您联系"
> - "资料员已接单，将协助您准备资料"
> - "请按清单上传所需资料"
> - "资料审核通过，等待制作签证材料"
> - "资料需要修改，请查看具体说明"
> - "签证材料已上传，请确认"
> - "签证材料已交付"
> - "签证结果：出签/拒签"

### 3.4 工作流与聊天的关联

```
工作流节点              聊天行为
──────────────────────────────────────────────
客服创建订单            系统消息："订单已创建，客服将尽快与您联系"
客户登录查看            客户可在此聊天窗口提问
资料员接单              系统消息："资料员已接单，将协助您准备资料"
资料员审核打回          资料员在聊天中说明具体问题
客户追问               客户直接回复
客户提交资料            系统消息："资料已提交审核"
操作员审核              操作员可 @资料员沟通
操作员打回              操作员在聊天中说明
材料交付               系统消息："签证材料已交付"
出签/拒签              系统消息："签证结果：出签/拒签"
```

---

## 4. 架构决策（14 项）

| # | 决策 | 理由 |
|---|---|---|
| 1 | **聊天绑定订单（1:1 会话）** | 签证行业沟通围绕订单展开，不需要独立的"联系人列表"概念。每个订单自动创建一个聊天会话 |
| 2 | **多人可见（非 1:1 私聊）** | 订单的客服/资料员/操作员/客户/管理者都能看到同一个聊天流，保证信息透明 |
| 3 | **消息持久化到 MySQL** | 不用 Redis / MongoDB——项目已有 MySQL，消息量级（每订单百条级）MySQL 完全够用 |
| 4 | **系统消息用专用系统用户** | Prisma FK 约束要求 senderId 存在于 erp_users，seed.ts 创建 `chat_system` 用户（id='chat_system'，companyId='system'，role='SUPER_ADMIN'），系统消息 senderId 用此 ID。**V3.0 修复**：确认 phone 不与 superadmin 冲突（`13800000001` vs `13800000000`），`@@unique([companyId, phone])` 约束安全 |
| 5 | **Socket.io 推送 + DB 持久化** | 双通道：发消息先写 DB 再 Socket 推送，确保离线用户上线后能拉取历史 |
| 6 | **消息支持图片/文件** | 业务场景需要发送证件照片、补充文件，复用现有 OSS 预签名直传 |
| 7 | **已读回执（per-user）** | `ChatRead` 记录每个用户对该会话的最后已读消息 ID，计算未读数 |
| 8 | **系统消息由后端自动生成** | 关键工作流节点自动插入 SYSTEM 类型消息，减少人工沟通成本 |
| 9 | **聊天入口嵌入订单详情页** | 不新建独立聊天页面——用户心智是"在订单里沟通"，Tab 形式嵌入 |
| 10 | **管理端顶部全局消息角标** | topbar 增加消息图标，显示所有会话总未读数，点击展开会话列表 |
| 11 | **分页加载历史消息** | 初始加载最新 50 条，向上滚动加载更多（cursor-based 分页，`(createdAt, id)` 复合游标） |
| 12 | **输入状态指示（typing）** | Socket.io 事件驱动，对方正在输入时显示"xxx 正在输入..."，3s 超时消失 |
| 13 | **管理者只读 + 可介入** | 公司负责人/管理员默认可查看所有聊天，可选择"加入对话"变为可发送 |
| 14 | **useSocketClient 回调注册表** | **V3.0 新增**：useSocketClient 是全局单例，多组件回调互相覆盖。解决方案：全局回调注册表 `Map<string, Handler>`，各组件注册/注销独立 ID，Socket 事件遍历注册表分发 |
| 15 | **JwtPayload 追加 realName + avatar** | **V4.0 新增**：当前 JwtPayload 只有 userId/username/role/companyId/departmentId，Socket 事件需要 realName（typing/read）和 avatar（消息头像）。追加到 JWT 避免每次 Socket 事件都查 DB。login API 签发时写入 |
| 16 | **admin 订单详情不用 Tab，用浮动按钮** | **V4.0 修正**：admin/orders/[id] 当前是单列/两列 Grid 布局（非 Tab），聊天入口改为浮动按钮+抽屉面板（与客户端一致），而非插入不存在的 Tab 结构 |

---

## 5. 数据库设计

### 5.1 新增表

#### erp_chat_rooms — 聊天会话

```prisma
enum ChatRoomStatus {
  ACTIVE     // 进行中
  ARCHIVED   // 已归档（订单终态后自动归档）
  MUTED      // 已静默（管理者选择不接收通知）
}

model ChatRoom {
  id            String          @id @default(cuid())
  companyId     String          @map("company_id")
  orderId       String          @unique @map("order_id")
  title         String          @db.VarChar(200)
  status        ChatRoomStatus  @default(ACTIVE) @map("status")
  lastMessage   String?         @db.Text @map("last_message")
  lastMessageAt DateTime?       @map("last_message_at")
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")

  company       Company         @relation(fields: [companyId], references: [id])
  order         Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  messages      ChatMessage[]
  reads         ChatRead[]

  @@index([companyId])
  @@index([companyId, lastMessageAt])  // 会话列表按最近消息排序
  @@map("erp_chat_rooms")
}
```

#### erp_chat_messages — 聊天消息

```prisma
enum ChatMessageType {
  TEXT      // 文本
  IMAGE    // 图片
  FILE     // 文件
  SYSTEM   // 系统消息
}

model ChatMessage {
  id          String          @id @default(cuid())
  roomId      String          @map("room_id")
  companyId   String          @map("company_id")
  senderId    String          @map("sender_id")
  type        ChatMessageType
  content     String          @db.Text
  fileName    String?         @db.VarChar(255) @map("file_name")
  fileSize    Int?            @map("file_size")
  metadata    Json?
  createdAt   DateTime        @default(now()) @map("created_at")

  room        ChatRoom        @relation(fields: [roomId], references: [id], onDelete: Cascade)
  sender      User            @relation(fields: [senderId], references: [id])

  @@index([roomId, createdAt])          // 会话内按时间查询
  @@index([roomId, createdAt, id])      // 复合游标分页：防同时间戳丢失
  @@index([companyId])
  @@index([senderId])
  @@map("erp_chat_messages")
}
```

#### erp_chat_reads — 已读回执

```prisma
model ChatRead {
  id                  String    @id @default(cuid())
  roomId              String    @map("room_id")
  userId              String    @map("user_id")
  lastReadMessageId   String?   @map("last_read_message_id")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  room                ChatRoom  @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user                User      @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])     // 每人每会话一条记录
  @@index([userId])
  @@map("erp_chat_reads")
}
```

### 5.2 现有 Model 变更

```prisma
// Company model 追加：
chatRooms ChatRoom[]

// User model 追加：
chatMessages  ChatMessage[]
chatReads     ChatRead[]

// Order model 追加：
chatRoom ChatRoom?
```

### 5.3 迁移 SQL 顺序（关键）

> MySQL 要求先建枚举类型再建表，先建表再建外键。顺序不可错。

```sql
-- 1. 创建枚举类型
ALTER TABLE erp_chat_rooms ... (ChatRoomStatus)
ALTER TABLE erp_chat_messages ... (ChatMessageType)

-- 2. 创建表（含索引）
CREATE TABLE erp_chat_rooms (...);
CREATE TABLE erp_chat_messages (...);
CREATE TABLE erp_chat_reads (...);

-- 3. 外键已在 CREATE TABLE 中定义（ON DELETE CASCADE）
```

> 实际由 `prisma migrate dev --name add_chat` 自动生成。

---

## 6. API 端点设计

### 6.1 聊天会话

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/chat/rooms` | Lv2-9 | 我的会话列表（含未读数 + 最后消息） |
| GET | `/api/chat/rooms/[orderId]` | 有权限 | 获取/创建订单的聊天会话 |

### 6.2 聊天消息

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/chat/rooms/[orderId]/messages` | 有权限 | 获取消息历史（cursor-based 分页，默认 50 条） |
| POST | `/api/chat/rooms/[orderId]/messages` | Lv2-7,9 | 发送消息（TEXT / IMAGE / FILE） |

### 6.3 已读回执

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| POST | `/api/chat/rooms/[orderId]/read` | 有权限 | 标记已读（传入 lastReadMessageId） |

### 6.4 文件上传（复用现有 presign/confirm，context 扩展）

**V3.0 修正**：presign 和 confirm API 需要扩展 `context` 参数区分聊天和资料上传路径。

#### presign API 扩展

```typescript
// 当前 presignSchema:
const presignSchema = z.object({
  requirementId: z.string().min(1),   // ← 资料上传必须
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
})

// V3.0 修改为：
const presignSchema = z.object({
  context: z.enum(['document', 'chat']).default('document'),
  requirementId: z.string().min(1).optional(),  // context=document 时必填
  orderId: z.string().min(1).optional(),         // context=chat 时必填
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
})

// 校验逻辑：
if (data.context === 'document' && !data.requirementId) {
  throw new AppError('VALIDATION_ERROR', '资料上传需要 requirementId', 400)
}
if (data.context === 'chat' && !data.orderId) {
  throw new AppError('VALIDATION_ERROR', '聊天上传需要 orderId', 400)
}

// OSS 路径构建：
let ossKey: string
if (data.context === 'chat') {
  ossKey = buildOssKey({
    companyId: user.companyId,
    orderId: data.orderId!,
    type: 'chat',        // ← oss.ts 需扩展支持
    fileName: data.fileName,
  })
} else {
  // 现有逻辑不变
  ossKey = buildOssKey({
    companyId: user.companyId,
    orderId: requirement.order.id,
    type: 'documents',
    subId: data.requirementId,
    fileName: data.fileName,
  })
}
```

#### confirm API 扩展

```typescript
// 当前 confirmSchema 写入 DocumentFile
// V3.0 修改为：
const confirmSchema = z.object({
  context: z.enum(['document', 'chat']).default('document'),
  requirementId: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),       // context=chat 时必填
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(1),
  fileType: z.string().min(1),
  ossKey: z.string().min(1),
})

// context=chat 时：不写 DocumentFile，返回 ossUrl 供前端发消息用
// context=document 时：现有逻辑不变（写 DocumentFile + 更新 DocReqStatus）
```

#### oss.ts 扩展 buildOssKey

```typescript
// 当前 type 只支持 'documents' | 'materials'
// V3.0 追加 'chat'
export function buildOssKey(params: {
  companyId: string
  orderId: string
  type: 'documents' | 'materials' | 'chat'  // ← 新增
  subId?: string
  fileName: string
}): string {
  const { companyId, orderId, type, subId, fileName } = params
  const timestamp = Date.now()
  const safeName = fileName.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]/g, '_')

  if (type === 'chat') {
    // chat/{companyId}/{orderId}/{timestamp}_{filename}
    return `chat/${companyId}/${orderId}/${timestamp}_${safeName}`
  }
  // 现有逻辑不变...
}
```

### 6.5 权限矩阵

| 角色 | 查看会话 | 发送消息 | 查看历史 | 标记已读 |
|---|:---:|:---:|:---:|:---:|
| SUPER_ADMIN (Lv1) | ✅ wildcard | ✅ wildcard | ✅ | ✅ |
| COMPANY_OWNER (Lv2) | ✅ chat:read | ✅ chat:send | ✅ | ✅ |
| CS_ADMIN (Lv3) | ✅ chat:read | ✅ chat:send | ✅ | ✅ |
| CUSTOMER_SERVICE (Lv4) | ✅ 仅自己订单 | ✅ chat:send | ✅ | ✅ |
| VISA_ADMIN (Lv5) | ✅ chat:read | ✅ chat:send | ✅ | ✅ |
| DOC_COLLECTOR (Lv6) | ✅ 仅自己订单 | ✅ chat:send | ✅ | ✅ |
| OPERATOR (Lv7) | ✅ 仅自己订单 | ✅ chat:send | ✅ | ✅ |
| OUTSOURCE (Lv8) | ❌ 无 chat 权限 | ❌ | ❌ | ❌ |
| CUSTOMER (Lv9) | ✅ 仅自己订单 | ✅ chat:send | ✅ | ✅ |

---

## 7. Socket.io 事件设计

### 7.1 客户端 → 服务端

| 事件 | 参数 | 说明 |
|---|---|---|
| `chat:join` | `{ orderId }` | 加入订单聊天房间（含权限校验） |
| `chat:leave` | `{ orderId }` | 离开聊天房间 |
| `chat:typing` | `{ orderId }` | 正在输入通知（服务端 2s 冷却） |
| `chat:mark-read` | `{ orderId, lastReadMessageId }` | 标记已读（服务端 3s debounce） |

### 7.2 服务端 → 客户端

| 事件 | 参数 | 说明 |
|---|---|---|
| `chat:message` | `{ id, roomId, orderId, senderId, senderName, senderAvatar, type, content, fileName?, fileSize?, createdAt }` | 新消息推送 |
| `chat:typing` | `{ orderId, userId, realName }` | 对方正在输入 |
| `chat:read` | `{ orderId, userId, realName, lastReadMessageId }` | 已读回执推送 |
| `chat:unread-update` | `{ orderId, unreadCount }` | 未读计数变化 |
| `chat:error` | `{ message }` | 错误通知（如无权加入房间） |

### 7.3 Socket.io 服务端改造要点

**V3.0 修正**：`emitToRoom` 是新增函数，不是已有函数。

```typescript
// src/lib/socket.ts 追加

// 新增：向房间广播
export function emitToRoom(room: string, event: string, data: unknown): void {
  io?.to(room).emit(event, data)
}
```

**V4.0 关键修复 — JwtPayload 追加 realName + avatar**：

当前 `socket.data.user` 来自 JWT（`verifyAccessToken`），但 JwtPayload 不含 realName 和 avatar。`socket.data.user.realName` 全部为 `undefined`，导致 typing/read 事件和消息推送的发送者信息缺失。

修复链路：

```typescript
// 1. src/lib/auth.ts — JwtPayload 追加字段
export interface JwtPayload {
  userId: string
  username: string
  role: UserRole
  companyId: string
  departmentId: string | null
  realName: string       // V4.0 新增
  avatar: string | null  // V4.0 新增
}

// 2. src/app/api/auth/login/route.ts — 签发 JWT 时写入
const payload = {
  userId: user.id,
  username: user.username,
  role: user.role,
  companyId: user.companyId,
  departmentId: user.departmentId,
  realName: user.realName,   // V4.0 新增
  avatar: user.avatar,       // V4.0 新增
}
```

JWT 大小增加约 30 字节（中文名 ~10 字符），15 分钟过期，安全影响可忽略。

**连接时懒加入**：只 join 最近 20 个活跃订单的房间（不含终态订单），管理者不自动 join（打开聊天面板时通过 `chat:join` 按需加入）。

**chat:join 权限校验**：校验用户是订单相关人员（customer/collector/operator/createdBy）或有 chat:read 权限的管理者（COMPANY_OWNER/VISA_ADMIN/CS_ADMIN）。

**typing 限流**：服务端 2s 冷却，同一用户同一房间 2s 内只转发一次。

**mark-read debounce**：服务端 3s 延迟合并，同一用户同一房间 3s 内只写入最后一次。

**V4.0 新增 — 内存泄漏防护**：

```typescript
// typingCooldown / readDebounce 定期清理（每 5 分钟）
setInterval(() => {
  const now = Date.now()
  for (const [key, ts] of typingCooldown) {
    if (now - ts > 60_000) typingCooldown.delete(key)  // 1 分钟前的条目
  }
  for (const [key, timer] of readDebounce) {
    // timer 应该已执行并删除自身，兜底清理
    clearTimeout(timer)
    readDebounce.delete(key)
  }
}, 5 * 60 * 1000)

// disconnect 时清理该用户的所有条目
socket.on('disconnect', () => {
  for (const key of typingCooldown) {
    if (key[0].startsWith(user.userId + ':')) typingCooldown.delete(key[0])
  }
  for (const [key, timer] of readDebounce) {
    if (key.startsWith(user.userId + ':')) {
      clearTimeout(timer)
      readDebounce.delete(key)
    }
  }
})
```

---

## 8. 前端组件设计

### 8.1 组件树

```
管理端订单详情 (/admin/orders/[id])
├── 现有：信息 Tab / 资料 Tab / 材料 Tab / 日志 Tab
└── 新增：💬 聊天 Tab（含未读角标）
    └── ChatPanel 组件
        ├── ChatMessageList（消息列表 + 滚动加载 + 系统消息特殊样式）
        │   ├── ChatMessage（单条消息）
        │   └── ChatTypingIndicator（"xxx 正在输入..."）
        └── ChatInput（输入框 + 发送按钮 + 文件上传 + 拍照 + 字数提示）

客户端订单详情 (/customer/orders/[id])
├── 现有：上传 / 确认提交 / 材料下载 / 出签反馈 / 信息 / 日志
└── 新增：💬 浮动聊天按钮（桌面端右下角抽屉 / 移动端全屏）
    └── ChatPanel（compact 模式）

管理端顶栏 (topbar.tsx)
├── 现有：面包屑 / 通知铃铛 / 个人中心
└── 新增：💬 消息图标
    └── ChatRoomList（会话列表下拉面板）
```

### 8.2 核心组件规格

#### ChatMessage（单条消息）

```
┌─────────────────────────────────────────────┐
│ [系统消息] 订单已创建，客服将尽快与您联系    │  ← 居中，灰色，无头像
├─────────────────────────────────────────────┤
│ 张三 (客服)                          14:02  │  ← 左对齐，灰色气泡
│ ┌─────────────────────┐                     │
│ │ 请上传护照首页扫描件  │                     │
│ └─────────────────────┘                     │
├─────────────────────────────────────────────┤
│                              14:05  我      │  ← 右对齐，主色气泡
│                    ┌─────────────────┐       │
│                    │ 好的，已上传      │       │
│                    └─────────────────┘       │
├─────────────────────────────────────────────┤
│ [图片] ┌─────┐                               │
│        │ IMG │  ← 点击灯箱预览               │
│        └─────┘                               │
├─────────────────────────────────────────────┤
│ [文件] 📄 护照扫描件.pdf  1.2MB  ← 点击下载  │
├─────────────────────────────────────────────┤
│ 张三正在输入...                              │  ← 3s 后消失
└─────────────────────────────────────────────┘
```

#### ChatInput（输入区域）

```
┌─────────────────────────────────────────────┐
│  [📎] [📷]  │ 输入消息...          │  [发送]  │
│             │                      │  152/2k │  ← 实时字数，超1800变黄，超2000变红
└─────────────────────────────────────────────┘
```

- 📎 文件上传：复用 presign + confirm（context='chat'）→ ossUrl → 发送 FILE 消息
- 📷 拍照：复用 CameraCapture → OSS（chat/ 路径）→ 发送 IMAGE 消息
- 输入防抖 300ms → emit chat:typing
- Enter 发送，Shift+Enter 换行
- 发送后清空输入框 + 自动滚底
- **V4.0 文件上传错误处理**：presign/confirm 任一步失败 → toast 错误提示 + 阻止消息发送 + 恢复输入框内容

#### ChatRoomList（顶栏下拉）

```
┌────────────────────────────────────────────┐
│ 💬 消息 (5)                                 │  ← 顶栏按钮
├────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │ HX20260328001  王小明  好的，已上传...  3│ │  ← 未读气泡
│ │ HX20260327042  李四    请补充在职证明    │ │
│ │ HX20260326018  赵六    材料已交付 ✓     │ │
│ └────────────────────────────────────────┘ │
│ ── 点击跳转到对应订单详情页聊天 Tab ──      │
└────────────────────────────────────────────┘
```

### 8.3 状态管理

#### 新增 Store：`src/stores/chat-store.ts`

```typescript
interface ChatState {
  messages: Record<string, ChatMessageItem[]>   // 按 orderId 缓存消息
  rooms: ChatRoomSummary[]                       // 会话列表
  totalUnread: number                            // 全局未读总数
  typingUsers: Record<string, { userId: string; realName: string; timer: ReturnType<typeof setTimeout> }[]>

  fetchRooms: () => Promise<void>
  fetchMessages: (orderId: string, cursor?: { createdAt: string; id: string }) => Promise<{ hasMore: boolean }>
  sendMessage: (orderId: string, data: SendMessagePayload) => Promise<void>
  markRead: (orderId: string, lastReadMessageId: string) => Promise<void>
  addMessage: (orderId: string, message: ChatMessageItem) => void
  addTypingUser: (orderId: string, userId: string, realName: string) => void
  removeTypingUser: (orderId: string, userId: string) => void
}
```

#### 新增 Hook：`src/hooks/use-chat.ts`

```typescript
function useChat(orderId: string) {
  // 1. 初始化：join room + 加载历史
  // 2. 通过回调注册表监听 Socket 事件
  // 3. 暴露 send / markRead / loadMore / handleTyping
  // 4. 清理：leave room + 注销回调
  return { messages, send, loadMore, handleTyping, typingUsers, unreadCount }
}
```

### 8.4 Socket 回调注册表（V3.0 新增 — 解决单例覆盖问题）

```typescript
// src/hooks/use-socket-client.ts 改造

// 全局回调注册表
type ChatMessageHandler = (data: ChatMessageSocketPayload) => void
type ChatTypingHandler = (data: { orderId: string; userId: string; realName: string }) => void
type ChatReadHandler = (data: { orderId: string; userId: string; realName: string; lastReadMessageId: string }) => void

const chatMessageHandlers = new Map<string, ChatMessageHandler>()
const chatTypingHandlers = new Map<string, ChatTypingHandler>()
const chatReadHandlers = new Map<string, ChatReadHandler>()

export function registerChatHandler(id: string, handler: ChatMessageHandler) {
  chatMessageHandlers.set(id, handler)
  return () => chatMessageHandlers.delete(id)
}
export function registerTypingHandler(id: string, handler: ChatTypingHandler) {
  chatTypingHandlers.set(id, handler)
  return () => chatTypingHandlers.delete(id)
}
export function registerReadHandler(id: string, handler: ChatReadHandler) {
  chatReadHandlers.set(id, handler)
  return () => chatReadHandlers.delete(id)
}

// Socket 事件分发
socket.on('chat:message', (data) => {
  for (const handler of chatMessageHandlers.values()) handler(data)
})
socket.on('chat:typing', (data) => {
  for (const handler of chatTypingHandlers.values()) handler(data)
})
socket.on('chat:read', (data) => {
  for (const handler of chatReadHandlers.values()) handler(data)
})

// 暴露 join/leave 方法
export function joinRoom(orderId: string) { socket?.emit('chat:join', { orderId }) }
export function leaveRoom(orderId: string) { socket?.emit('chat:leave', { orderId }) }
export function sendTyping(orderId: string) { socket?.emit('chat:typing', { orderId }) }
export function socketMarkRead(orderId: string, messageId: string) {
  socket?.emit('chat:mark-read', { orderId, lastReadMessageId: messageId })
}
```

组件中使用：
```tsx
useEffect(() => {
  const unregister = registerChatHandler(`chat-panel-${orderId}`, (data) => {
    if (data.orderId === orderId) {
      chatStore.addMessage(orderId, data)
    }
  })
  return unregister
}, [orderId])
```

---

## 9. 批次拆分与执行计划

| 批次 | 内容 | 工时 | 前置 | 状态 |
|---|---|---|---|---|
| **批次 1** | 数据层：Schema + 迁移 + 类型 + 种子(chat_system) + RBAC(chat权限) + JwtPayload(realName+avatar) + login改造 + ChatRoom自动创建 + 系统消息工具 + 事件总线集成 | 4h | — | ✅ 完成 |
| **批次 2** | 聊天 API：会话列表 + 消息 CRUD + 已读回执 + presign/confirm context扩展 + oss.ts chat类型 | 4h | 批次 1 | ✅ 完成 |
| **批次 3** | Socket.io：emitToRoom + 聊天事件 + 回调注册表 + 输入指示 + 房间管理 + auto-join + 内存泄漏防护 | 3.5h | 批次 2 | ⬜ 待开发 |
| **批次 4** | 前端 UI：ChatPanel + ChatInput + ChatRoomList + 顶栏集成 + admin浮动按钮 + 系统消息触发 + 客户端集成 | 7h | 批次 3 | ⬜ 待开发 |
| **批次 5** | 验收 + 优化 + 离线通知 + 测试 + 文档更新 | 3.5h | 批次 4 | ⬜ 待开发 |

**总计：~22 小时（V5.0 修正：+2h，含 V5.0 新增 8 项 P0/P1 修复）**

---

## 10. 批次 1：数据层 + 类型 + 迁移

### 10.1 任务清单

| # | 任务 | 文件 | 说明 |
|---|---|---|---|
| M4-1 | Schema 扩展 | `prisma/schema.prisma` | 新增 ChatRoom / ChatMessage / ChatRead Model + ChatMessageType/ChatRoomStatus 枚举 + Company/User/Order 关联 |
| M4-2 | 迁移 SQL | `prisma/migrations/xxx_add_chat/migration.sql` | 3 张新表 + 索引 + 外键 |
| M4-3 | TypeScript 类型 | `src/types/chat.ts` | ChatRoom / ChatMessageItem / SendMessagePayload / ChatRoomSummary 接口 |
| M4-4 | 种子数据扩展 | `prisma/seed.ts` | 新增 `chat_system` 系统用户（id='chat_system'，phone='13800000001'，不与 superadmin 13800000000 冲突） |
| M4-5 | RBAC 权限扩展 | `src/lib/rbac.ts` | 为 Lv2-7,9 新增 `chat` 资源 `read`/`send` 权限（OUTSOURCE 不加） |
| M4-5b | **JwtPayload 扩展** | `src/lib/auth.ts` | **V5.0 P0-1**：追加 `realName: string` + `avatar: string \| null` 字段 |
| M4-5c | **login 签发改造** | `src/app/api/auth/login/route.ts` | **V5.0 P0-1**：JWT payload 追加 realName + avatar 写入 |
| M4-6 | ChatRoom 自动创建 | `src/app/api/orders/route.ts` (POST) | 订单创建事务内追加 chatRoom.upsert（防并发） |
| M4-7 | 系统消息工具函数 | `src/lib/chat-system.ts` | `sendSystemMessage(orderId, companyId, content)` 含 DB 写入 + ChatRoom 摘要更新 + Socket 推送 |
| M4-8 | 事件总线集成 | `src/lib/events.ts` | ORDER_STATUS_CHANGED 处理器中追加 sendSystemMessage 调用（10 个流转节点 transitionKey 映射）+ 终态 ChatRoom 归档 |

### 10.2 详细实现

#### M4-1: Schema 扩展

在 `prisma/schema.prisma` 末尾新增（具体代码见第 5 章）。

在现有 Model 追加关联：

```prisma
// Company model 追加：
chatRooms ChatRoom[]

// User model 追加：
chatMessages  ChatMessage[]
chatReads     ChatRead[]

// Order model 追加：
chatRoom ChatRoom?
```

#### M4-2: 迁移 SQL

```bash
cd erp-project
npx prisma migrate dev --name add_chat
```

> 生成 3 张新表：`erp_chat_rooms` / `erp_chat_messages` / `erp_chat_reads`

#### M4-3: TypeScript 类型

新建 `src/types/chat.ts`：

```typescript
export interface ChatRoom {
  id: string
  orderId: string
  title: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  createdAt: string
}

export interface ChatMessageItem {
  id: string
  roomId: string
  senderId: string
  senderName: string
  senderAvatar: string | null
  senderRole: string | null
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  content: string
  fileName: string | null
  fileSize: number | null
  createdAt: string
}

export interface SendMessagePayload {
  type: 'TEXT' | 'IMAGE' | 'FILE'
  content: string          // TEXT: 文本 / IMAGE/FILE: ossUrl
  fileName?: string
  fileSize?: number
}

export interface ChatRoomSummary {
  orderId: string
  orderNo: string
  title: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  status: 'ACTIVE' | 'ARCHIVED' | 'MUTED'
}
```

#### M4-4: 种子数据扩展

在 `prisma/seed.ts` 的 `main()` 函数末尾（`console.log('🎉 Seeding completed!')` 之前）追加：

```typescript
// 3. 创建聊天系统用户（用于系统消息 senderId，满足 FK 约束）
const chatSystemUser = await prisma.user.upsert({
  where: { username: 'chat_system' },
  update: {},
  create: {
    id: 'chat_system',
    companyId: 'system',
    username: 'chat_system',
    phone: '13800000001',           // 不与 superadmin 的 13800000000 冲突
    passwordHash: await bcrypt.hash('ChatSystem@2026', 12),
    realName: '系统助手',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
  },
})
console.log('✅ Chat system user created:', chatSystemUser.username)
```

> **注意**：`@@unique([companyId, phone])` 约束下，chat_system 的 `13800000001` 与 superadmin 的 `13800000000` 不冲突。

#### M4-5: RBAC 权限扩展

在 `src/lib/rbac.ts` 的 `ROLE_PERMISSIONS` 中追加 `chat` 资源：

```typescript
// SUPER_ADMIN 已有 wildcard，无需追加

COMPANY_OWNER: [
  // ... 已有权限 ...
  { resource: 'chat', actions: ['read', 'send'] },
],
CS_ADMIN: [
  // ... 已有权限 ...
  { resource: 'chat', actions: ['read', 'send'] },
],
CUSTOMER_SERVICE: [
  // ... 已有权限 ...
  { resource: 'chat', actions: ['read', 'send'] },
],
VISA_ADMIN: [
  // ... 已有权限 ...
  { resource: 'chat', actions: ['read', 'send'] },
],
DOC_COLLECTOR: [
  // ... 已有权限 ...
  { resource: 'chat', actions: ['read', 'send'] },
],
OPERATOR: [
  // ... 已有权限 ...
  { resource: 'chat', actions: ['read', 'send'] },
],
OUTSOURCE: [
  // ... 已有权限 ...
  // 不加 chat 权限 → 无法访问聊天
],
CUSTOMER: [
  // ... 已有权限 ...
  { resource: 'chat', actions: ['read', 'send'] },
],
```

#### M4-6: ChatRoom 自动创建（V3.0 修正：在 orders/route.ts，非 transition.ts）

在 `src/app/api/orders/route.ts` 的 POST handler 中，订单创建成功后追加：

```typescript
// 在 prisma.order.create 成功、返回 Response 之前：

// 自动创建聊天会话（upsert 防并发重复）
await prisma.chatRoom.upsert({
  where: { orderId: order.id },
  create: {
    companyId: order.companyId,
    orderId: order.id,
    title: `订单 ${order.orderNo}`,
  },
  update: {},  // 已存在则跳过
})
```

> **为什么用 upsert 而非 create**：高并发场景下（如批量导入），可能多个请求同时为同一订单创建 ChatRoom。`orderId` 有 `@unique` 约束，create 会抛唯一约束异常。upsert 先查后写，安全。

#### M4-7: 系统消息工具函数

新建 `src/lib/chat-system.ts`：

```typescript
import { prisma } from '@/lib/prisma'
import { emitToRoom } from '@/lib/socket'

const SYSTEM_USER_ID = 'chat_system'

export async function sendSystemMessage(
  orderId: string,
  companyId: string,
  content: string,
) {
  const room = await prisma.chatRoom.findUnique({
    where: { orderId },
    select: { id: true },
  })
  if (!room) return  // ChatRoom 未创建（旧订单），静默跳过

  const message = await prisma.chatMessage.create({
    data: {
      roomId: room.id,
      companyId,
      senderId: SYSTEM_USER_ID,
      type: 'SYSTEM',
      content,
    },
  })

  // 更新 ChatRoom 摘要
  await prisma.chatRoom.update({
    where: { id: room.id },
    data: {
      lastMessage: content.slice(0, 100),
      lastMessageAt: new Date(),
    },
  })

  // Socket 推送
  emitToRoom(`order:${orderId}`, 'chat:message', {
    id: message.id,
    roomId: room.id,
    orderId,
    senderId: SYSTEM_USER_ID,
    senderName: '系统',
    senderAvatar: null,
    type: 'SYSTEM',
    content,
    createdAt: message.createdAt.toISOString(),
  })

  return message
}
```

#### M4-8: 事件总线集成

在 `src/lib/events.ts` 的 `ORDER_STATUS_CHANGED` 处理器末尾追加系统消息：

```typescript
import { sendSystemMessage } from '@/lib/chat-system'

// 在事件处理器的最后（createMany notification 之后）：

// 系统消息 → 聊天
const systemMessages: Record<string, string> = {
  'PENDING_CONNECTION→CONNECTED': '资料员已接单，将协助您准备资料',
  'CONNECTED→COLLECTING_DOCS': '请按清单上传所需资料',
  'COLLECTING_DOCS→PENDING_REVIEW': '资料已提交审核',
  'UNDER_REVIEW→MAKING_MATERIALS': '资料审核通过，等待制作签证材料',
  'UNDER_REVIEW→COLLECTING_DOCS': '资料需要修改，请查看聊天中的具体说明',
  'MAKING_MATERIALS→PENDING_DELIVERY': '签证材料已上传，请确认',
  'PENDING_DELIVERY→DELIVERED': '签证材料已交付',
  'DELIVERED→APPROVED': '🎉 签证结果：出签！恭喜！',
  'DELIVERED→REJECTED': '签证结果：拒签。请联系客服了解详情',
  'PENDING_DELIVERY→MAKING_MATERIALS': '材料需要修改，请查看说明',
}

const transitionKey = `${fromStatus}→${toStatus}`
const chatMessage = systemMessages[transitionKey]
if (chatMessage) {
  // 异步，不阻塞主流程
  sendSystemMessage(orderId, companyId, chatMessage).catch((err) => {
    logApiError('chat-system-message', err, { orderId, transitionKey })
  })
}

// V4.0：终态自动归档 ChatRoom
const terminalStatuses = ['DELIVERED', 'APPROVED', 'REJECTED']
if (terminalStatuses.includes(toStatus)) {
  prisma.chatRoom.updateMany({
    where: { orderId, status: 'ACTIVE' },
    data: { status: 'ARCHIVED' },
  }).catch((err) => {
    logApiError('chat-room-archive', err, { orderId, toStatus })
  })
}
```

### 10.3 验收标准

- [ ] `npx prisma generate` 无错误
- [ ] 迁移 SQL 执行成功，3 张新表创建
- [ ] `npx tsc --noEmit` 0 错误
- [ ] `npm run build` 0 警告
- [ ] 创建订单后 DB 中自动创建 ChatRoom（验证 erp_chat_rooms 表）
- [ ] chat_system 用户存在于 erp_users 表
- [ ] 状态流转后 DB 中出现 SYSTEM 类型 ChatMessage

---

## 11. 批次 2：聊天 API

> ✅ **已完成** 2026-03-29 | 8 项子任务 + 5 项修复全部交付

### 完成摘要

| # | 任务 | 文件 | 状态 |
|---|---|---|:---:|
| M4-9 | 会话列表 API | `src/app/api/chat/rooms/route.ts` | ✅ |
| M4-10 | 会话详情 API | `src/app/api/chat/rooms/[orderId]/route.ts` | ✅ |
| M4-11 | 消息列表 API | `src/app/api/chat/rooms/[orderId]/messages/route.ts` (GET) | ✅ |
| M4-12 | 发送消息 API | 同上 (POST) | ✅ |
| M4-13 | 标记已读 API | `src/app/api/chat/rooms/[orderId]/read/route.ts` | ✅ |
| M4-14 | presign API 扩展 | `src/app/api/documents/presign/route.ts` | ✅ |
| M4-15 | confirm API 扩展 | `src/app/api/documents/confirm/route.ts` | ✅ |
| M4-16 | oss.ts 扩展 | `src/lib/oss.ts` | ✅ |

### 批次 2 深度审查修复（5 项）

| # | 级别 | 文件 | 问题 | 修复 |
|---|:---:|---|---|---|
| 1 | 🔴 | `types/order.ts` | NotificationType 联合类型重复 `'SYSTEM'` | 删除重复 |
| 2 | 🟡 | `presign/route.ts` | requirementId 必填，chat 文件无此值 | +context/orderId，权限按分支 |
| 3 | 🟡 | `confirm/route.ts` | ossKey 校验拒绝 chat 路径 + chat 不应写 DocumentFile | +context 分支，chat 返回 ossUrl |
| 4 | 🟡 | `oss.ts` | buildOssKey type 不支持 'chat' | type 联合追加 'chat' |
| 5 | 🟡 | `types/api.ts` | ApiMeta 缺 hasMore/cursor（聊天分页需要） | 追加 2 字段 |

### 架构决策补充（3 项）

| # | 决策 | 理由 |
|---|---|---|
| 补充 1 | chat 文件 OSS 走 `companies/` 统一前缀 | 与 documents/materials 一致，ossKey 校验统一 |
| 补充 2 | presign/confirm 按 context 检查不同权限 | chat 需 chat:send，非 documents:create |
| 补充 3 | POST messages 事务外 Socket 推送 | 失败不影响数据一致性，与 materials 模式一致 |

### 验收结果

```
tsc --noEmit  → 0 错误 ✅
npm run build  → 0 警告 0 错误 ✅
源文件 121 → 126 (+5)
API 路由 39 → 44 (+5)
```

### 11.1 任务清单

| # | 任务 | 文件 | 说明 |
|---|---|---|---|
| M4-9 | 会话列表 API | `src/app/api/chat/rooms/route.ts` | GET：用户关联会话 + 未读数（原生 SQL，MySQL 兼容） |
| M4-10 | 会话详情 API | `src/app/api/chat/rooms/[orderId]/route.ts` | GET：获取或创建会话 |
| M4-11 | 消息列表 API | `src/app/api/chat/rooms/[orderId]/messages/route.ts` (GET) | 复合游标分页 `(createdAt, id)` |
| M4-12 | 发送消息 API | 同上 (POST) | 创建消息 + 更新 ChatRoom + Socket 推送 |
| M4-13 | 标记已读 API | `src/app/api/chat/rooms/[orderId]/read/route.ts` | upsert ChatRead |
| M4-14 | presign API 扩展 | `src/app/api/documents/presign/route.ts` | 追加 `context`/`orderId` 参数，`requirementId` 改可选 |
| M4-15 | confirm API 扩展 | `src/app/api/documents/confirm/route.ts` | 追加 `context`/`orderId` 参数，chat 模式不写 DocumentFile |
| M4-16 | oss.ts 扩展 | `src/lib/oss.ts` | buildOssKey 追加 `type: 'chat'` |

### 11.2 详细实现

#### M4-9: GET /api/chat/rooms

```typescript
// 关键点：
// 1. 原生 SQL，MySQL 兼容（不用 NULLS LAST）
// 2. 未读数计算：ChatMessage.id > ChatRead.lastReadMessageId（cuid 字符串可比较）
// 3. 按 lastMessageAt DESC 排序，NULL 排最后

const rooms = await prisma.$queryRaw`
  SELECT
    cr.id, cr.order_id as orderId, o.order_no as orderNo,
    cr.title, cr.status, cr.last_message as lastMessage,
    cr.last_message_at as lastMessageAt,
    cr.created_at as createdAt,
    COALESCE(unread.cnt, 0) as unreadCount
  FROM erp_chat_rooms cr
  INNER JOIN erp_orders o ON o.id = cr.order_id
  LEFT JOIN (
    SELECT cm.room_id, COUNT(*) as cnt
    FROM erp_chat_messages cm
    LEFT JOIN erp_chat_reads crd
      ON crd.room_id = cm.room_id AND crd.user_id = ${userId}
    WHERE cm.id > COALESCE(crd.last_read_message_id, '')
    GROUP BY cm.room_id
  ) unread ON unread.room_id = cr.id
  WHERE (o.customer_id = ${userId}
     OR o.collector_id = ${userId}
     OR o.operator_id = ${userId}
     OR o.created_by = ${userId})
    AND cr.company_id = ${user.companyId}
    AND cr.status != 'ARCHIVED'
  ORDER BY cr.last_message_at IS NULL, cr.last_message_at DESC
  LIMIT 50
`
```

#### M4-11: GET messages（复合游标分页）

```typescript
// cursor 为空 → 返回最新 50 条
// cursor 不为空 → WHERE (createdAt < cursor.createdAt) OR (createdAt = cursor.createdAt AND id < cursor.id)

const where: Prisma.ChatMessageWhereInput = cursor
  ? {
      roomId,
      OR: [
        { createdAt: { lt: new Date(cursor.createdAt) } },
        {
          createdAt: new Date(cursor.createdAt),
          id: { lt: cursor.id },
        },
      ],
    }
  : { roomId }

const messages = await prisma.chatMessage.findMany({
  where,
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  take: limit + 1,  // 多取 1 条判断 hasMore
  include: { sender: { select: { id: true, realName: true, avatar: true, role: true } } },
})

const hasMore = messages.length > limit
if (hasMore) messages.pop()

return {
  data: messages.reverse().map(/* 映射为 ChatMessageItem */),
  meta: {
    hasMore,
    cursor: messages[0] ? { createdAt: messages[0].createdAt.toISOString(), id: messages[0].id } : null,
  },
}
```

#### M4-12: POST messages（事务 + 并发安全 + exactOptionalPropertyTypes）

```typescript
// 关键修复：Prisma 事务内创建消息 + 更新 ChatRoom 摘要
// ChatRoom.lastMessageAt 使用原子操作防竞态

// V4.0 修复：exactOptionalPropertyTypes 要求可选字段用条件赋值，不能传 undefined
const messageData: Record<string, unknown> = {
  roomId: room.id,
  companyId,
  senderId: user.userId,
  type: data.type,
  content: data.content,
}
if (data.type !== 'TEXT') {
  // IMAGE/FILE 类型携带文件信息
  if (data.fileName !== undefined) messageData.fileName = data.fileName
  if (data.fileSize !== undefined) messageData.fileSize = data.fileSize
}

const result = await prisma.$transaction(async (tx) => {
  const message = await tx.chatMessage.create({ data: messageData as any })

  await tx.chatRoom.update({
    where: { id: room.id },
    data: { lastMessage: data.content.slice(0, 100), lastMessageAt: message.createdAt },
  })

  return message
})

// Socket 推送（事务外，失败不影响数据一致性）
// V4.0：user.realName 和 user.avatar 来自 JwtPayload（已追加字段）
emitToRoom(`order:${orderId}`, 'chat:message', {
  id: result.id,
  roomId: room.id,
  orderId,
  senderId: user.userId,
  senderName: user.realName,      // V4.0 修复：来自 JwtPayload
  senderAvatar: user.avatar,      // V4.0 修复：来自 JwtPayload
  type: result.type,
  content: result.content,
  fileName: result.fileName ?? null,
  fileSize: result.fileSize ?? null,
  createdAt: result.createdAt.toISOString(),
})
```

#### M4-14 ~ M4-16: presign/confirm/oss 扩展

具体代码见第 6.4 章。核心变更：

| 文件 | 变更 |
|---|---|
| `presign/route.ts` | schema 追加 `context`(default 'document') + `orderId`(chat 时必填)；`requirementId` 改可选；chat 时 ossKey 用 `chat/` 前缀 |
| `confirm/route.ts` | schema 追加 `context` + `orderId`；chat 模式只返回 ossUrl，不写 DocumentFile |
| `oss.ts` | `buildOssKey` type 追加 `'chat'`，chat 路径为 `chat/{companyId}/{orderId}/{timestamp}_{filename}` |

### 11.3 验收标准

- [ ] GET /api/chat/rooms 返回会话列表 + 未读数（MySQL 兼容）
- [ ] GET messages 返回分页消息（复合游标正确）
- [ ] POST messages 创建消息 + 更新 ChatRoom + Socket 推送
- [ ] POST read 更新已读位置
- [ ] presign context='chat' 返回 chat/ 前缀 ossKey
- [ ] confirm context='chat' 返回 ossUrl 但不写 DocumentFile
- [ ] 权限校验正确（Lv8 OUTSOURCE 被拒绝 → 403）
- [ ] `npx tsc --noEmit` 0 错误

---

## 12. 批次 3：Socket.io 聊天事件

### 12.1 任务清单

| # | 任务 | 文件 | 说明 |
|---|---|---|---|
| M4-17 | emitToRoom 函数 | `src/lib/socket.ts` | 新增 `emitToRoom(room, event, data)` |
| M4-18 | Socket 服务端扩展 | `src/lib/socket.ts` | chat:join(含权限校验)/leave/typing(2s冷却)/mark-read(3s debounce) 事件 |
| M4-19 | 连接时自动加入房间 | `src/lib/socket.ts` | connection 时查询最近 20 个活跃订单 → auto join |
| M4-20 | 回调注册表 | `src/hooks/use-socket-client.ts` | registerChatHandler/registerTypingHandler/registerReadHandler + joinRoom/leaveRoom/sendTyping/socketMarkRead |
| M4-21 | Socket 事件分发 | `src/hooks/use-socket-client.ts` | socket.on('chat:message/typing/read') 遍历注册表分发 |

### 12.2 详细实现

#### M4-17: emitToRoom

```typescript
// src/lib/socket.ts 追加（在 emitToCompany 之后）

export function emitToRoom(room: string, event: string, data: unknown): void {
  io?.to(room).emit(event, data)
}
```

#### M4-18: Socket 事件处理

```typescript
// io.on('connection') 内追加：

// chat:join — 含权限校验（P0 修复）
socket.on('chat:join', async ({ orderId }: { orderId: string }) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      companyId: user.companyId,
      OR: [
        { customerId: user.userId },
        { collectorId: user.userId },
        { operatorId: user.userId },
        { createdBy: user.userId },
      ],
    },
    select: { id: true },
  })
  // 管理者也可以加入（有 chat:read 权限）
  if (!order) {
    const hasPermission = ['COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN', 'SUPER_ADMIN'].includes(socket.data.user.role)
    if (!hasPermission) {
      socket.emit('chat:error', { message: '无权访问该聊天' })
      return
    }
  }
  socket.join(`order:${orderId}`)
})

socket.on('chat:leave', ({ orderId }: { orderId: string }) => {
  socket.leave(`order:${orderId}`)
})

// typing 限流 — 2s 冷却
const typingCooldown = new Map<string, number>()
socket.on('chat:typing', ({ orderId }: { orderId: string }) => {
  const key = `${user.userId}:${orderId}`
  const now = Date.now()
  if (now - (typingCooldown.get(key) ?? 0) < 2000) return
  typingCooldown.set(key, now)
  socket.to(`order:${orderId}`).emit('chat:typing', {
    orderId, userId: user.userId, realName: socket.data.user.realName,
  })
})

// mark-read debounce — 3s 合并
const readDebounce = new Map<string, ReturnType<typeof setTimeout>>()
socket.on('chat:mark-read', ({ orderId, lastReadMessageId }: { orderId: string; lastReadMessageId: string }) => {
  const key = `${user.userId}:${orderId}`
  const existing = readDebounce.get(key)
  if (existing) clearTimeout(existing)
  readDebounce.set(key, setTimeout(async () => {
    readDebounce.delete(key)
    const room = await prisma.chatRoom.findUnique({ where: { orderId }, select: { id: true } })
    if (!room) return
    await prisma.chatRead.upsert({
      where: { roomId_userId: { roomId: room.id, userId: user.userId } },
      update: { lastReadMessageId },
      create: { roomId: room.id, userId: user.userId, lastReadMessageId },
    })
    socket.to(`order:${orderId}`).emit('chat:read', {
      orderId, userId: user.userId, realName: socket.data.user.realName, lastReadMessageId,
    })
  }, 3000))
})

// V4.0：disconnect 时清理该用户的 typing/read 状态
socket.on('disconnect', () => {
  for (const [key] of typingCooldown) {
    if (key.startsWith(user.userId + ':')) typingCooldown.delete(key)
  }
  for (const [key, timer] of readDebounce) {
    if (key.startsWith(user.userId + ':')) {
      clearTimeout(timer)
      readDebounce.delete(key)
    }
  }
})

// V4.0：定期清理过期条目（每 5 分钟）
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, ts] of typingCooldown) {
    if (now - ts > 60_000) typingCooldown.delete(key)
  }
}, 5 * 60 * 1000)

// 清理 interval 防止内存泄漏
socket.on('disconnect', () => {
  clearInterval(cleanupInterval)
})
```

#### M4-19: 连接时自动加入

```typescript
// 在 io.on('connection') 内，join company/user room 之后追加：

const activeOrders = await prisma.order.findMany({
  where: {
    companyId: user.companyId,
    status: { notIn: ['DELIVERED', 'APPROVED', 'REJECTED'] },
    OR: [
      { customerId: user.userId },
      { collectorId: user.userId },
      { operatorId: user.userId },
      { createdBy: user.userId },
    ],
  },
  select: { id: true },
  orderBy: { updatedAt: 'desc' },
  take: 20,
})
for (const order of activeOrders) {
  socket.join(`order:${order.id}`)
}
```

#### M4-20 ~ M4-21: 回调注册表

具体代码见第 8.4 章。

### 12.3 验收标准

- [ ] 客户端连接后自动加入活跃订单房间
- [ ] `chat:join` / `chat:leave` 端到端验证
- [ ] `chat:typing` 广播到同房间其他用户（2s 限流生效）
- [ ] `chat:mark-read` 写入 DB + 广播（3s debounce 生效）
- [ ] 管理者无订单关联也可 join 房间
- [ ] `npx tsc --noEmit` 0 错误

---

## 13. 批次 4：前端聊天 UI

### 13.1 任务清单

| # | 任务 | 文件 | 说明 |
|---|---|---|---|
| M4-22 | ChatStore | `src/stores/chat-store.ts` | Zustand 状态管理 |
| M4-23 | useChat Hook | `src/hooks/use-chat.ts` | 聊天逻辑封装 |
| M4-24 | ChatMessage 组件 | `src/components/chat/chat-message.tsx` | 单条消息渲染（TEXT/IMAGE/FILE/SYSTEM） |
| M4-25 | ChatMessageList 组件 | `src/components/chat/chat-message-list.tsx` | 消息列表 + 滚动位置保持 + 加载更多 |
| M4-26 | ChatInput 组件 | `src/components/chat/chat-input.tsx` | 输入框 + 文件 + 拍照 + 字数提示 |
| M4-27 | ChatPanel 组件 | `src/components/chat/chat-panel.tsx` | 主面板（组装 MessageList + Input） |
| M4-28 | ChatRoomList 组件 | `src/components/chat/chat-room-list.tsx` | 顶栏会话列表下拉 |
| M4-29 | 管理端订单详情集成 | `src/app/admin/orders/[id]/page.tsx` | 新增「聊天」Tab（含未读角标） |
| M4-30 | 客户端订单详情集成 | `src/app/customer/orders/[id]/page.tsx` | 浮动聊天按钮 + 抽屉面板（移动端全屏） |
| M4-31 | 顶栏集成 | `src/components/layout/topbar.tsx` | NotificationBell 旁新增 ChatRoomList |

### 13.2 详细实现

#### M4-25: ChatMessageList 滚动位置保持

```typescript
const handleScroll = useCallback(async () => {
  if (containerRef.current?.scrollTop !== 0) return
  if (isLoadingMore || !hasMore) return

  const prevScrollHeight = containerRef.current.scrollHeight
  setIsLoadingMore(true)
  const result = await loadMore()
  setIsLoadingMore(false)

  if (containerRef.current) {
    const newScrollHeight = containerRef.current.scrollHeight
    containerRef.current.scrollTop = newScrollHeight - prevScrollHeight
  }
  setHasMore(result.hasMore)
}, [loadMore, isLoadingMore, hasMore])
```

#### M4-26: ChatInput 字数提示

- 实时字数显示 `currentLen/2000`
- 超过 1800 字 → 黄色警告
- 超过 2000 字 → 红色 + 禁止发送
- Enter 发送 / Shift+Enter 换行
- 输入 300ms 防抖 → emit chat:typing

#### M4-29: 管理端集成（V4.0 修正 — 浮动按钮，非 Tab）

**V4.0 重要修正**：`admin/orders/[id]/page.tsx` 当前是 **两列 Grid 布局**（左：信息/资料/材料，右：关联人员/日志），**不使用 Tab**。聊天入口改为浮动按钮+抽屉面板（与客户端一致）。

```tsx
// 在 src/app/admin/orders/[id]/page.tsx 中追加：

const [showChat, setShowChat] = useState(false)

// 在页面最底部（状态流转弹窗之前）追加：
{/* 聊天浮动按钮 */}
<div className="fixed bottom-6 right-6 z-40">
  {showChat && (
    <div className="w-96 h-[500px] mb-3 glass-card-static rounded-xl shadow-2xl animate-slide-in-up overflow-hidden">
      <ChatPanel orderId={order.id} />
    </div>
  )}
  <button
    onClick={() => setShowChat(!showChat)}
    className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
  >
    💬
    {chatUnread > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-error)] text-xs rounded-full flex items-center justify-center">
        {chatUnread > 9 ? '9+' : chatUnread}
      </span>
    )}
  </button>
</div>
```

> **为什么不用 Tab**：当前页面是纯垂直布局，没有 Tab 组件。改为 Tab 需要大规模重构（拆分资料面板、材料面板等为 Tab 内容），超出 M4 范围。浮动按钮+抽屉面板是最小侵入方案，UX 与客户端一致。M6 如需统一 Tab 架构再重构。

#### M4-30: 客户端集成

```tsx
// 浮动聊天按钮 + 抽屉面板
const [showChat, setShowChat] = useState(false)

<div className="fixed bottom-20 right-4 z-40">
  {showChat && (
    <div className="
      w-80 h-96                          /* 桌面端 */
      max-sm:fixed max-sm:inset-0        /* 移动端全屏 */
      max-sm:w-full max-sm:h-full
      max-sm:bottom-0 max-sm:right-0
      max-sm:rounded-none max-sm:z-50
      glass-card-static rounded-xl shadow-2xl animate-slide-in-up overflow-hidden
    ">
      <ChatPanel orderId={order.id} compact />
    </div>
  )}
  <button onClick={() => setShowChat(!showChat)}
    className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center">
    💬
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-error)] text-xs rounded-full flex items-center justify-center">
        {unreadCount}
      </span>
    )}
  </button>
</div>
```

#### M4-31: 顶栏集成

在 `src/components/layout/topbar.tsx` 中：

```tsx
<div className="flex items-center gap-5">
  <ChatRoomList />      {/* ← 新增，NotificationBell 左侧 */}
  <NotificationBell />
  <div className="h-8 w-px bg-white/10" />
  {/* ...用户信息... */}
</div>
```

### 13.3 样式规范

- 本人消息：`bg-[var(--color-primary)]/20` + `backdrop-blur`，右对齐
- 他人消息：`bg-white/5` + `backdrop-blur`，左对齐
- 系统消息：居中，`text-[var(--color-text-placeholder)]`，无气泡背景
- 输入框：底部固定，`glass-card-static` 背景
- 滚动条：自定义细滚动条（`scrollbar-thin`）
- 动画：新消息淡入（`animate-fade-in-up`），抽屉展开（`animate-slide-in-up`）

### 13.4 验收标准

- [ ] 管理端订单详情页「聊天」Tab 正常显示（含未读角标）
- [ ] 客户端订单详情页聊天浮窗正常展开/收起（移动端全屏）
- [ ] 发送文本消息 → 实时出现在双方屏幕
- [ ] 发送图片消息 → 图片预览 + 灯箱
- [ ] 发送文件消息 → 文件卡片 + 下载
- [ ] 系统消息在工作流节点自动出现
- [ ] 向上滚动加载历史消息（滚动位置保持）
- [ ] "xxx 正在输入" 正常显示/3s 后消失
- [ ] 已读回执正常工作
- [ ] 顶栏消息图标显示总未读数
- [ ] 点击顶栏消息图标 → 会话列表 → 点击跳转
- [ ] 重新打开页面历史消息完整
- [ ] `npx tsc --noEmit` 0 错误
- [ ] `npm run build` 0 警告

---

## 14. 批次 5：全量验收 + 优化

### 14.1 任务清单

| # | 任务 | 说明 |
|---|---|---|
| M4-32 | 全量 tsc + build 验收 | 0 错误 0 警告 |
| M4-33 | 测试用例补充 | `src/lib/__tests__/chat-system.test.ts` 单元测试 |
| M4-34 | 边界场景处理 | 长消息折叠、超长消息截断（>2000字）、空消息校验、并发发送、多设备登录 |
| M4-35 | 离线消息通知 | 用户不在线时，创建 Notification（5 分钟去重） |
| M4-36 | 性能优化 | 消息列表虚拟滚动评估（<500条暂不需要）、图片懒加载 |
| M4-37 | 文档更新 | 03-project-status + 02-architecture + 01-PRD + 其余文档版本号 |

### 14.2 边界场景

| 场景 | 处理 |
|---|---|
| 客户发消息时客服不在线 | 消息持久化到 DB，客服上线后拉取历史 + 收到 Notification |
| 终态订单仍可聊天 | 允许查看历史，但不自动 join 房间（需手动 chat:join） |
| 超长消息（>2000 字） | API 层 zod 校验拒绝 + 前端字数提示 |
| 重复发送 | 前端发送按钮 loading + 后端接受轻微重复（幂等） |
| 图片上传失败 | 前端显示错误提示，不发送消息 |
| 多设备登录 | 同一用户多个 Socket 连接都会收到消息（join 同一 room） |
| ChatRoom 不存在（旧订单） | POST messages 时自动创建 ChatRoom |
| 聊天文件 OSS 路径安全 | ossKey 必须以 `chat/` 开头，服务端校验 |

### 14.3 离线消息通知（M4-35）

```typescript
// 在 sendSystemMessage 和 POST messages 成功后：
// 查询房间内所有关联用户 → 检查是否有活跃 Socket 连接
// 无连接的用户 → 创建 Notification（5 分钟内同一房间不重复创建）

const recentNotification = await prisma.notification.findFirst({
  where: {
    userId: targetUserId,
    orderId,
    type: 'SYSTEM',
    createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
  },
})
if (!recentNotification) {
  await prisma.notification.create({
    data: {
      companyId, userId: targetUserId, orderId,
      type: 'SYSTEM',
      title: `订单 ${orderNo} 有新消息`,
      content: content.slice(0, 200),
    },
  })
}
```

### 14.4 单元测试

新建 `src/lib/__tests__/chat-system.test.ts`：

```typescript
describe('sendSystemMessage', () => {
  it('should create SYSTEM message with chat_system senderId')
  it('should update ChatRoom lastMessage and lastMessageAt')
  it('should emit to socket room order:{orderId}')
  it('should handle missing ChatRoom gracefully (return undefined)')
})
```

### 14.5 验收标准

- [ ] 全部 14.1 任务完成
- [ ] `npx tsc --noEmit` 0 错误
- [ ] `npm run build` 0 警告
- [ ] 新增测试通过
- [ ] 74 + N 测试全部通过
- [ ] as any / console.log / TODO = 0
- [ ] 'use client' 首行全部正确
- [ ] Prisma ?? null 全部正确
- [ ] 所有文档版本号更新

---

## 15. 文件变更全量清单

### 新建文件（16 个）

| 文件 | 说明 |
|---|---|
| `prisma/migrations/xxx_add_chat/migration.sql` | 迁移 SQL（3表+枚举+外键） |
| `src/types/chat.ts` | 聊天类型定义 |
| `src/lib/chat-system.ts` | 系统消息工具函数 |
| `src/stores/chat-store.ts` | 聊天 Zustand Store |
| `src/hooks/use-chat.ts` | 聊天 Hook |
| `src/app/api/chat/rooms/route.ts` | 会话列表 API（原生 SQL） |
| `src/app/api/chat/rooms/[orderId]/route.ts` | 会话详情 API |
| `src/app/api/chat/rooms/[orderId]/messages/route.ts` | 消息 API（GET 分页 + POST 发送） |
| `src/app/api/chat/rooms/[orderId]/read/route.ts` | 已读 API |
| `src/components/chat/chat-message.tsx` | 单条消息组件 |
| `src/components/chat/chat-message-list.tsx` | 消息列表组件（滚动位置保持） |
| `src/components/chat/chat-input.tsx` | 输入组件（字数提示+文件+拍照） |
| `src/components/chat/chat-panel.tsx` | 主面板组件 |
| `src/components/chat/chat-room-list.tsx` | 会话列表下拉组件 |
| `src/lib/__tests__/chat-system.test.ts` | 单元测试 |

### 修改文件（16 个）

| 文件 | 变更 |
|---|---|
| `prisma/schema.prisma` | +3 Model + 2 Enum + Company/User/Order 关联 |
| `prisma/seed.ts` | +chat_system 系统用户 |
| `src/lib/auth.ts` | JwtPayload 追加 realName + avatar 字段（V4.0 P0 修复） |
| `src/app/api/auth/login/route.ts` | JWT 签发 payload 追加 realName + avatar（V4.0 P0 修复） |
| `src/lib/rbac.ts` | +chat 资源 read/send 权限（Lv2-7,9） |
| `src/lib/socket.ts` | +emitToRoom +chat 事件（权限校验+限流+debounce+懒加载+内存清理） |
| `src/lib/oss.ts` | buildOssKey type + 'chat' |
| `src/hooks/use-socket-client.ts` | +回调注册表 +joinRoom/leaveRoom/sendTyping/socketMarkRead |
| `src/lib/events.ts` | +sendSystemMessage 调用（10 个工作流节点） + 订单终态归档 ChatRoom |
| `src/app/api/orders/route.ts` (POST) | +ChatRoom upsert 创建 |
| `src/app/api/documents/presign/route.ts` | +context/orderId 参数 |
| `src/app/api/documents/confirm/route.ts` | +context/orderId 参数 |
| `src/app/admin/orders/[id]/page.tsx` | +聊天浮动按钮+抽屉面板（V4.0 修正：非 Tab） |
| `src/app/customer/orders/[id]/page.tsx` | +聊天浮窗（移动端全屏） |
| `src/components/layout/topbar.tsx` | +ChatRoomList |
| `src/app/customer/layout.tsx` | +聊天未读计数（Socket 监听 + fallback 轮询） |

### 源文件统计

| 指标 | M4 前 | M4 后 | 增量 |
|---|---|---|---|
| 源文件 | 119 | ~135 | +16 |
| 代码行数 | ~14,200 | ~16,200 | +~2,000 |
| API 路由 | 39 | 43 | +4 |
| 组件 | 25 | 30 | +5 |
| 测试文件 | 4 | 5 | +1 |

---

## 16. 深度审查缺口清单（累计 32 项）

> V3.0 首轮 20 项 + V4.0 二轮 12 项，全部已在上文中修复。

### V3.0 首轮（20 项）

| # | 优先级 | 文件 | 问题 | 修复位置 |
|---|---|---|---|---|
| 1 | 🔴 P0 | `presign/route.ts` | presign API schema 要求 `requirementId` 必填，chat 文件无需求 ID | §6.4 M4-14 |
| 2 | 🔴 P0 | `confirm/route.ts` | confirm 写入 DocumentFile，chat 文件应返回 ossUrl | §6.4 M4-15 |
| 3 | 🔴 P0 | `oss.ts` | buildOssKey type 只支持 documents/materials | §6.4 M4-16 |
| 4 | 🔴 P0 | `api/orders/route.ts` | ChatRoom 创建位置错误 | §10.2 M4-6 |
| 5 | 🔴 P0 | `seed.ts` | chat_system phone 冲突风险 | §10.2 M4-4 |
| 6 | 🔴 P0 | `use-socket-client.ts` | 单例回调覆盖 | §8.4 M4-20 |
| 7 | 🟡 P1 | `socket.ts` | 缺 emitToRoom | §12.2 M4-17 |
| 8 | 🟡 P1 | `events.ts` | 系统消息节点覆盖不全 | §10.2 M4-8 |
| 9 | 🟡 P1 | `schema.prisma` | 迁移顺序 | §5.3 |
| 10 | 🟡 P1 | `chat:join` | 管理者权限校验 | §12.2 M4-18 |
| 11 | 🟡 P1 | `ChatRoom` | 并发创建异常 | §10.2 M4-6 |
| 12 | 🟡 P1 | `rooms API` | MySQL NULLS LAST | §11.2 M4-9 |
| 13 | 🟡 P1 | `messages API` | 单游标同时间戳丢失 | §11.2 M4-11 |
| 14 | 🟡 P1 | `POST messages` | 事务外 Socket 延迟 | §11.2 M4-12 |
| 15 | 🟢 P2 | `topbar.tsx` | 顶栏新增组件 | §13.1 M4-31 |
| 16 | 🟢 P2 | 离线通知 | 5 分钟去重 | §14.3 M4-35 |
| 17 | 🟢 P2 | 文件大小限制 | 复用 MAX_FILE_SIZE | §14.2 |
| 18 | 🟢 P2 | admin layout | 移动端响应式 | §13.2 M4-29 |
| 19 | 💡 | `middleware.ts` | 无需修改 | §2.1 |
| 20 | 💡 | `server.ts` | 无需修改 | §2.1 |

### V4.0 二轮（12 项）

| # | 优先级 | 文件 | 问题 | 修复位置 |
|---|---|---|---|---|
| 21 | 🔴 P0 | `auth.ts` + `login/route.ts` | **JwtPayload 缺少 realName + avatar** → Socket typing/read/message 事件的 `senderName`/`realName` 全部为 `undefined`，前端显示空白 | §7.3 + §12.2：JwtPayload 追加 2 字段，login 签发时写入 |
| 22 | 🔴 P0 | `admin/orders/[id]/page.tsx` | **页面不是 Tab 结构而是两列 Grid**，原计划"新增聊天 Tab"无法实施 | §13.2 M4-29：改为浮动按钮+抽屉面板 |
| 23 | 🟡 P1 | `POST messages handler` | **exactOptionalPropertyTypes**：`data: { fileName, fileSize }` 传 undefined 会报 TS 错误 | §11.2 M4-12：条件赋值 `Record<string, unknown>` |
| 24 | 🟡 P1 | `socket.ts` | **typingCooldown / readDebounce Map 内存泄漏**：只增不清，长期运行积累 | §7.3：5 分钟定时清理 + disconnect 时清理用户条目 |
| 25 | 🟡 P1 | `socket.ts` | **disconnect 事件未清理聊天相关状态**：用户登出后 typing/read timer 仍存在 | §7.3：disconnect handler 清理 |
| 26 | 🟡 P1 | `events.ts` | **订单终态时 ChatRoom 应自动归档**：当前 ChatRoom status 永远 ACTIVE | §10.2 M4-8：终态流转时 update ChatRoom.status = ARCHIVED |
| 27 | 🟡 P1 | `useChat` + `ChatPanel` | **需要 userId 判断 isOwn 消息**：ChatMessage 组件需区分左右对齐 | §13.1：从 `useAuth()` 获取 `user.id` |
| 28 | 🟡 P1 | `ChatInput` | **文件上传到 OSS 失败时缺少错误处理**：需 toast 提示 + 阻止发送 | §13.1 M4-26：try/catch + toast |
| 29 | 🟢 P2 | `admin/orders/[id]` | **聊天未读角标实时更新**：需决定轮询还是 Socket | §13.2 M4-29：Socket 监听 + 30s 轮询 fallback |
| 30 | 🟢 P2 | `login/route.ts` | **JwtPayload 也缺 avatar**：消息头像需来自 JWT 或 DB | §7.3：JWT 追加 avatar 字段 |
| 31 | 💡 | `NotificationBell` | **ChatRoomList 可复用其交互模式**：点击外部关闭 + 下拉面板 + 未读气泡 | §13.1 M4-28 |
| 32 | 💡 | `prisma.$queryRaw` | **rooms API 原生 SQL 需类型断言**：`$queryRaw<RoomRow[]>` | §11.2 M4-9 |

### V6.0 四轮（5 项 — 源代码逐文件深度审查）

| # | 优先级 | 文件 | 问题 | 修复位置 |
|---|---|---|---|---|
| 33 | 🔴 P0 | `src/types/order.ts:61` | **NotificationType TypeScript 缺 `'SYSTEM'`** — Prisma schema 已有但 TS 联合类型遗漏，M4 离线通知创建 `type: 'SYSTEM'` 将 TS 报错 | §10.2 M4-3b：联合类型追加 `'SYSTEM'` |
| 34 | 🔴 P0 | `src/app/api/orders/route.ts` | **ChatRoom upsert 时序问题** — 放在事务末尾则 `sendSystemMessage` 可能在 ChatRoom 之前执行，导致静默丢失。需移到 order 创建之后立即执行 | §10.2 M4-6：upsert 移到事务最前面 |
| 35 | 🟡 P1 | `src/hooks/use-socket-client.ts` | **Socket notification 监听生命周期 Bug** — 组件 re-mount 时 `socketInstance?.connected` 为 true → 直接 return → `socket.on('notification')` 不会重新绑定 → M4 注册表回调也受影响 | §12.2 M4-20：复用连接时也要重新绑定事件 |
| 36 | 🟡 P1 | `src/app/api/documents/confirm/route.ts` | **ossKey 安全校验需扩展** — 当前 `startsWith('companies/')` 会拒绝 chat 文件（`chat/{companyId}/...`），需按 context 分别校验 | §11.2 M4-15：context 分支校验 |
| 37 | 🟡 P1 | `src/lib/oss.ts` | **buildOssKey chat 分支需前置** — chat 不走 `companies/` 前缀，需在现有逻辑之前单独处理 | §11.2 M4-16：chat 分支提到最前面 |

### V6.0 累计缺口统计

| 轮次 | P0 | P1 | P2 | 建议 | 合计 |
|---|:---:|:---:|:---:|:---:|:---:|
| V3.0 首轮 | 6 | 8 | 4 | 2 | 20 |
| V4.0 二轮 | 2 | 6 | 3 | 1 | 12 |
| V5.0 三轮 | 0 | 0 | 0 | 0 | 0 |
| **V6.0 四轮** | **2** | **3** | **0** | **0** | **5** |
| **Batch 2 开发** | **0** | **3** | **2** | **0** | **5** |
| **累计（去重）** | **10** | **16** | **7** | **3** | **39（去重 36）** |

---

## 17. 验收标准

### 17.1 功能验收（12 项）

| # | 验收点 | 检查方法 |
|---|---|---|
| 1 | 创建订单后自动创建 ChatRoom | API 创建订单 → 查 DB erp_chat_rooms |
| 2 | 工作流节点自动发送系统消息 | 执行状态流转 → 查聊天面板出现系统消息 |
| 3 | 发送文本消息实时双向可见 | 两个浏览器登录 → 互发消息 → 双方实时显示 |
| 4 | 发送图片消息预览+灯箱 | 发送图片 → 点击 → 全屏灯箱 |
| 5 | 发送文件消息可下载 | 发送文件 → 点击下载 → 文件完整 |
| 6 | 历史消息分页加载 | 向上滚动 → 加载更多 → 连续性正确 + 滚动位置保持 |
| 7 | "正在输入" 指示 | 一方输入 → 另一方看到指示 → 3s 后消失 |
| 8 | 已读回执 | 一方阅读 → 另一方看到已读标记 |
| 9 | 顶栏未读计数 | 收到新消息 → 顶栏角标 +1 → 点击清零 |
| 10 | 会话列表跳转 | 顶栏消息 → 会话列表 → 点击 → 跳转到订单聊天 |
| 11 | 离线消息恢复 | 关闭浏览器 → 另一方发消息 → 重新打开 → 历史完整 |
| 12 | 权限隔离 | OUTSOURCE 角色 → API 返回 403 |

### 17.2 全局验收（8 项）

| # | 检查项 | 标准 |
|---|---|---|
| 1 | TypeScript | `npx tsc --noEmit` 0 错误 |
| 2 | Build | `npm run build` 0 警告 0 错误 |
| 3 | 测试 | 全部测试通过（74 + 新增） |
| 4 | as any | 0 残留 |
| 5 | console.log | 0 残留（用 logApiError） |
| 6 | TODO | 0 残留 |
| 7 | 'use client' 首行 | 全部正确 |
| 8 | Prisma ?? null | 全部正确 |

### 17.3 端到端测试流程（15 步）

```
1. 客服创建订单 → ChatRoom 自动创建（验证 DB）
2. 客户登录 → 看到订单 → 点击进入详情页
3. 客户点击聊天按钮 → 展开聊天面板
4. 客户看到系统消息："订单已创建，客服将尽快与您联系"
5. 客户输入 "你好，请问需要什么资料？" → 发送
6. 客服端（另一个浏览器）实时收到消息
7. 客服回复："请上传护照首页扫描件" + 附件
8. 客户端实时收到消息 + 附件预览
9. 资料员接单 → 系统消息 "资料员已接单"
10. 资料员审核打回 → 在聊天中说明具体问题
11. 客户追问 → 资料员回复
12. 客户上传资料 → 系统消息 "资料已提交审核"
13. 客服顶栏看到未读气泡 → 点击 → 会话列表 → 跳转
14. 关闭客户浏览器 → 客服发消息 → 客户重新打开 → 历史完整
15. 管理者登录 → 查看聊天记录 → 可读
```

---

## 18. V5.0 逐文件深度审查报告（32 项缺口 + 冲突兼容性验证）

> **审查日期**: 2026-03-29
> **审查范围**: 119 个源文件 + prisma/schema.prisma + prisma/seed.ts + tsconfig.json + 7 份项目文档
> **审查方法**: 逐文件比对 M4 开发计划中引用的每一个文件，验证当前代码状态 vs 计划改造需求

### 18.1 P0 必须修复（阻塞开发）— 8 项

| # | 文件:行 | 当前状态 | 问题 | 修复方案 | 冲突风险 |
|---|---|---|---|---|---|
| P0-1 | `src/lib/auth.ts:31-37` | JwtPayload 只有 userId/username/role/companyId/departmentId | **缺 realName + avatar** → Socket 事件 senderName/senderAvatar 全部 undefined | auth.ts JwtPayload 追加 `realName: string` + `avatar: string \| null`；login/route.ts 签发时写入 | ✅ 无冲突：新增字段不影响现有 167 处 JwtPayload 读取（只读 userId/role 等旧字段），token 增大 ~30 字节可忽略 |
| P0-2 | `src/hooks/use-socket-client.ts:21-55` | 单例模式，optionsRef.current 存回调 | **多组件回调覆盖**：ChatPanel + NotificationBell 同时用 → 后挂载覆盖前一个 | 保留 options.onNotification 兼容路径 + 新增全局回调注册表 Map<string, Handler>（registerChatHandler/registerTypingHandler/registerReadHandler） | ✅ 无冲突：现有 onNotification 调用方式不变，注册表是纯增量 |
| P0-3 | `src/app/api/documents/presign/route.ts:15-18` | `requirementId: z.string().min(1)` 必填 | **chat 文件无 requirementId** | schema 追加 `context: z.enum(['document','chat']).default('document')` + `orderId: z.string().min(1).optional()`；requirementId 改 optional | ✅ 无冲突：现有调用方（customer-upload.tsx:53）传 requirementId + 不传 context → context 默认 'document' → 走现有分支 |
| P0-4 | `src/app/api/documents/confirm/route.ts:16-23` | schema 必填 requirementId，始终写 DocumentFile | **chat 文件不能写 DocumentFile** | schema 追加 context/orderId；context=chat 时不写 DocumentFile，只返回 ossUrl | ✅ 无冲突：现有调用方（customer-upload.tsx:93）传 requirementId + 不传 context → 走现有分支 |
| P0-5 | `src/lib/oss.ts:50-61` | buildOssKey type: `'documents' \| 'materials'` | **缺 'chat' 类型** | type 联合追加 `'chat'`；chat 路径 `chat/{companyId}/{orderId}/{timestamp}_{filename}` | ✅ 无冲突：3 个现有调用方（presign/materials/upload）都传 'documents' 或 'materials' |
| P0-6 | `src/lib/socket.ts:47-74` | 只有 emitToUser + emitToCompany | **缺 emitToRoom** → 聊天无法推送到 order:{orderId} 房间 | 新增 `emitToRoom(room, event, data)` 函数 | ✅ 无冲突：纯增量函数，不影响现有 12 处 emitToUser 调用 |
| P0-7 | `prisma/seed.ts` | 只有 superadmin + 3 模板 | **缺 chat_system 系统用户** → FK 约束要求 senderId 存在 | 追加 chat_system upsert（id='chat_system', phone='13800000001', companyId='system'） | ✅ 无冲突：phone 13800000001 vs superadmin 13800000000，@@unique([companyId,phone]) 满足 |
| P0-8 | `src/lib/rbac.ts:11-93` | 9 级角色权限矩阵无 chat 资源 | **缺 chat 权限** → API 无法做 requirePermission | 为 Lv2-7,9 追加 `{ resource: 'chat', actions: ['read','send'] }`；OUTSOURCE 不加 | ✅ 无冲突：纯增量资源，不影响现有 10 种资源权限 |

### 18.2 P1 应该修复（影响功能完整性）— 12 项

| # | 文件 | 问题 | 修复方案 | 冲突风险 |
|---|---|---|---|---|
| P1-1 | `src/app/api/orders/route.ts` POST | ChatRoom 未自动创建 | 事务末尾追加 `chatRoom.upsert` | ✅ 在事务内：upsert 防并发，失败则整个订单回滚（合理：ChatRoom 创建失败说明 DB 有问题，不应留下半成品订单） |
| P1-2 | `src/lib/events.ts:40-120` | 状态变更只创建 Notification，无聊天系统消息 | 追加 sendSystemMessage 调用（10 个工作流节点 transitionKey 映射表）+ 终态归档 ChatRoom | ✅ 无冲突：在现有 notification 逻辑之后追加，async catch 不阻塞主流程 |
| P1-3 | `src/lib/socket.ts:47-56` | 连接时只 join company/user room | 追加查询最近 20 个活跃订单 → auto join `order:{orderId}` | ✅ 无冲突：在现有 join 之后追加 |
| P1-4 | `src/lib/socket.ts:53-55` | disconnect 空函数 `() => {}` | 追加 typingCooldown/readDebounce 清理 + cleanupInterval 清理 | ✅ 无冲突：扩展空函数 |
| P1-5 | `src/app/api/documents/confirm/route.ts:47-52` | ossKey 安全校验只检查 documents 前缀 | chat 模式检查 `chat/{companyId}/orders/{orderId}/` 前缀 | ✅ context 分支处理，现有路径不受影响 |
| P1-6 | `src/app/admin/orders/[id]/page.tsx` | 页面是两列 Grid 非 Tab | 改用浮动按钮 + 抽屉面板（与客户端一致），z-index 需 > 现有 StatusTransitionModal | ✅ 最小侵入：只在页面底部追加浮动按钮 JSX，不改现有布局 |
| P1-7 | `src/lib/transition.ts` + `events.ts` | 终态 ChatRoom 未归档 | events.ts 终态流转时 `chatRoom.updateMany({ status: 'ARCHIVED' })` | ✅ 无冲突：ChatRoom 新表，不影响现有 transition 逻辑 |
| P1-8 | `src/app/api/documents/presign/route.ts:38-46` | ossKey 构建必须查 DocumentRequirement | chat context 直接用 body.orderId 构建 | ✅ context 分支处理 |
| P1-9 | `src/app/customer/layout.tsx:12-16` | Tab "消息" = 通知，M4 引入聊天后有歧义 | 保持 "消息" Tab 用于通知（已建立用户心智），聊天通过订单详情页浮动按钮进入 | ✅ 不改 Tab 标签，避免用户混淆 |
| P1-10 | `src/app/customer/layout.tsx:40-48` | 只轮询通知未读 | M4 追加聊天未读计数（Socket 监听 chat:unread-update + fallback 轮询） | ✅ 增量追加，不影响现有通知轮询 |
| P1-11 | `prisma/seed.ts` | chat_system phone 必须不冲突 | phone='13800000001'（superadmin='13800000000'），@@unique([companyId,phone]) 安全 | ✅ 已验证 |
| P1-12 | `src/lib/events.ts` | 系统消息节点覆盖不全 | 10 个 transitionKey 精确映射（见 §10.2 M4-8） | ✅ Map 查找，O(1) 性能 |

### 18.3 P2 建议修复（优化体验）— 6 项

| # | 文件 | 问题 | 建议 |
|---|---|---|---|
| P2-1 | `src/components/layout/topbar.tsx:38-44` | 顶栏只有 NotificationBell | M4 新增 ChatRoomList 在 NotificationBell 左侧 |
| P2-2 | `src/lib/socket.ts` | typingCooldown/readDebounce Map 只增不清 → 内存泄漏 | 5 分钟定时清理 interval + disconnect 时清理用户条目 |
| P2-3 | 全局 | exactOptionalPropertyTypes=true → POST messages 传 undefined 给可选字段 TS 报错 | 条件赋值 `Record<string, unknown>` |
| P2-4 | `src/app/admin/orders/[id]/page.tsx` | 聊天未读角标实时更新方案 | Socket 监听 chat:unread-update + 30s fallback 轮询 |
| P2-5 | `src/lib/logger.ts` | chat-system 错误日志上下文 | 新增 chat-system-message / chat-room-archive 上下文 |
| P2-6 | `src/types/order.ts` | NotificationType 可能需扩展 | 评估离线消息是否复用 SYSTEM 类型或新增 CHAT 类型 |

### 18.4 M4 计划中已确认正确的决策 — 6 项

| # | 决策 | 验证结果 |
|---|---|---|
| M4-C1 | ChatRoom 在 orders/route.ts POST 创建（非 transition.ts） | ✅ 正确：订单创建是 ChatRoom 最早创建时机，transition.ts 只处理状态流转 |
| M4-C2 | admin/orders/[id] 用浮动按钮不用 Tab | ✅ 正确：逐行审查确认页面是两列 Grid 布局，无 Tab 组件 |
| M4-C3 | 连接时 auto-join 最近 20 个活跃订单 | ✅ 正确：erp_orders 已有 `[companyId, status]` 索引，查询性能有保障 |
| M4-C4 | presign/confirm 用 context 参数区分 | ✅ 正确：现有调用方（customer-upload.tsx）传 requirementId 不传 context → 默认 document → 完全兼容 |
| M4-C5 | JwtPayload 追加 realName + avatar | ✅ 正确：token 增大 ~30 字节，15 分钟过期，安全影响可忽略；167 处现有读取不受影响 |
| M4-C6 | 客户 Tab "消息" 保持通知用途 | ✅ 正确：避免已建立的用户心智被破坏，聊天通过订单详情页进入 |

### 18.5 冲突兼容性验证总结

| 维度 | 验证项 | 结果 |
|---|---|---|
| **TypeScript 编译** | `npx tsc --noEmit` | ✅ 0 错误（改造前基线） |
| **presign 向后兼容** | 现有调用方（customer-upload.tsx:53）传 `{requirementId, fileName, fileType}` | ✅ context 默认 'document'，requirementId 存在 → 走现有分支 |
| **confirm 向后兼容** | 现有调用方（customer-upload.tsx:93）传 `{requirementId, ossKey, fileName, fileSize, fileType}` | ✅ 同上 |
| **buildOssKey 向后兼容** | 3 个调用方（presign/materials/upload）传 'documents'/'materials' | ✅ 新增 'chat' 分支不影响 |
| **JwtPayload 向后兼容** | 167 处读取 user.userId/role/companyId 等 | ✅ 新增字段不影响旧字段读取 |
| **RBAC 向后兼容** | 现有 10 种资源权限 | ✅ 新增 chat 资源是纯增量 |
| **Socket.ts 向后兼容** | 现有 emitToUser（12 处调用）/emitToCompany | ✅ emitToRoom 是新增函数 |
| **seed.ts 向后兼容** | 现有 superadmin + 3 模板 | ✅ chat_system 用 upsert，phone 不冲突 |
| **Schema 向后兼容** | 11 张现有表 + 7 枚举 | ✅ 新增 3 表 + 2 枚举 + 3 关联，全部 erp_ 前缀 |
| **Middleware 向后兼容** | /api/chat/* 路由 | ✅ 自动被 auth 检查保护，无需修改 |
| **exactOptionalPropertyTypes** | 新代码可选字段处理 | ⚠️ 需注意：ChatMessage 创建时 fileName/fileSize 用条件赋值 |

### 18.6 修正后的批次执行计划（V5.0 终版）

| 批次 | 子任务 | 工时 | 较 V4.0 变化 |
|---|---|---|---|
| **批次 1** | M4-1 Schema 扩展 + M4-2 迁移 SQL + M4-3 TypeScript 类型 + **M4-4 seed chat_system** + **M4-5 RBAC chat 权限** + **JwtPayload realName/avatar** + **login 签发改造** + M4-6 ChatRoom 自动创建 + M4-7 系统消息工具 + M4-8 事件总线集成 | **4h** | +1h（新增 4 子任务） |
| **批次 2** | M4-9 会话列表 API + M4-10 会话详情 + M4-11 消息分页 + M4-12 发送消息 + M4-13 已读回执 + **M4-14 presign context扩展** + **M4-15 confirm context扩展** + **M4-16 oss.ts chat类型** | **4h** | 不变（扩展已覆盖） |
| **批次 3** | **M4-17 emitToRoom** + M4-18 Socket 事件 + **M4-19 auto-join + disconnect清理 + 内存泄漏防护** + M4-20 回调注册表 + M4-21 事件分发 | **3.5h** | +0.5h（新增 3 子任务） |
| **批次 4** | M4-22 ChatStore + M4-23 useChat + M4-24~28 组件 + **M4-29 admin浮动按钮** + M4-30 客户端集成 + M4-31 顶栏集成 | **7h** | 不变（修正已覆盖） |
| **批次 5** | M4-32 全量验收 + M4-33 测试 + M4-34 边界 + M4-35 离线通知 + M4-36 性能 + M4-37 文档 | **3.5h** | +0.5h（验收更严格） |
| **总计** | | **22h** | **+2h** |

### 18.7 V3.0 + V4.0 + V5.0 累计缺口统计

| 轮次 | P0 | P1 | P2 | 建议 | 合计 |
|---|:---:|:---:|:---:|:---:|:---:|
| V3.0 首轮 | 6 | 8 | 4 | 2 | 20 |
| V4.0 二轮 | 2 | 6 | 3 | 1 | 12 |
| **V5.0 三轮** | **0 新增** | **0 新增** | **0 新增** | **0 新增** | **0** |
| **累计（去重）** | **8** | **12** | **6** | **3** | **32（去重 29）** |

> V5.0 三轮审查未发现新缺口。所有缺口已在 V3.0/V4.0 中识别，V5.0 主要贡献是：**逐文件验证每个缺口的真实性** + **验证修复方案的向后兼容性** + **确认无新冲突**。

---

*文档结束 — M4 唯一开发指南（V5.0 逐文件深度审查 + 冲突兼容性验证版）*
