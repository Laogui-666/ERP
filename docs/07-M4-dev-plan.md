# 沐海旅行 ERP - M4 实时通信全知开发手册

> **文档版本**: V1.0
> **创建日期**: 2026-03-28
> **用途**: M4 阶段唯一开发指南。拿到本文件 + Git 仓库即可完整恢复开发上下文。
> **前置条件**: M1 ✅ + M2 ✅ + M3 ✅ + M5 ✅ 全部完成（119 源文件 / ~13,757 行 / 39 API 路由 / 18 页面 / 25 组件 / 74 测试用例）
> **核心交付**: 订单级站内聊天 + 管理端内部通讯 + 已读回执 + 消息持久化 + Socket.io 实时推送
> **预估工时**: ~20 小时（5 个批次）

---

## 目录

1. [M4 总览与目标](#1-m4-总览与目标)
2. [前置条件与现有资产](#2-前置条件与现有资产)
3. [业务场景深度分析](#3-业务场景深度分析)
4. [架构决策（12 项）](#4-架构决策-12-项)
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
16. [验收标准](#16-验收标准)

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
| 文件上传 | `src/lib/oss.ts` | 阿里云 OSS + 预签名直传 |
| 文件预览 | `src/components/ui/file-preview.tsx` | 图片/PDF/TXT + 灯箱 + 下载 |
| Prisma Client | `src/lib/prisma.ts` | 单例 |
| 订单级房间 | Socket.io `order:{orderId}` | 架构文档已预留，当前代码未 join |

### 2.2 关键约束

- 数据库：阿里云 RDS MySQL 8.0，与其他项目共享（必须 `erp_` 前缀）
- 禁止 `prisma db push`，使用 `prisma db execute --file` 执行 SQL
- TypeScript 严格模式 + `exactOptionalPropertyTypes`
- Prisma 可选字段必须 `?? null`
- 新 Model 必须 `@@map("erp_xxx")`
- 新字段必须 `@map("snake_case")`

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
| 订单详情页（管理端） | `/admin/orders/[id]` | 「聊天」Tab / 右侧栏聊天面板 |
| 订单详情页（客户端） | `/customer/orders/[id]` | 页面底部聊天入口 |
| 订单列表（客户端） | `/customer/orders` | 订单卡片上的未读消息气泡 |
| 顶栏（管理端） | `topbar.tsx` | 消息图标 + 全局未读计数 |

### 3.3 消息类型

| 类型 | 说明 | 发送方式 |
|---|---|---|
| TEXT | 文本消息 | 输入框直接发送 |
| IMAGE | 图片消息 | 上传/拍照 → OSS → 发送 |
| FILE | 文件消息 | 上传 → OSS → 发送 |
| SYSTEM | 系统消息 | 系统自动生成（不可人工发送） |

> 系统消息示例：
> - "订单状态变更为：资料收集中"
> - "资料已审核通过"
> - "签证材料已上传"

### 3.4 工作流与聊天的关联

```
工作流节点              聊天行为
──────────────────────────────────────────────
客服创建订单            系统消息："订单已创建"
客户登录查看            客户可在此聊天窗口提问
资料员接单              系统消息："资料员 xxx 已接单"
资料员审核打回          资料员在聊天中说明具体问题
客户追问               客户直接回复
客户提交资料            系统消息："资料已提交审核"
操作员审核              操作员可 @资料员沟通
操作员打回              操作员在聊天中说明
材料交付               系统消息："材料已交付"
出签/拒签              系统消息："签证结果：出签/拒签"
```

---

## 4. 架构决策（12 项）

| # | 决策 | 理由 |
|---|---|---|
| 1 | **聊天绑定订单（1:1 会话）** | 签证行业沟通围绕订单展开，不需要独立的"联系人列表"概念。每个订单自动创建一个聊天会话 |
| 2 | **多人可见（非 1:1 私聊）** | 订单的客服/资料员/操作员/客户/管理者都能看到同一个聊天流，保证信息透明 |
| 3 | **消息持久化到 MySQL** | 不用 Redis / MongoDB——项目已有 MySQL，消息量级（每订单百条级）MySQL 完全够用 |
| 4 | **Socket.io 推送 + DB 持久化** | 双通道：发消息先写 DB 再 Socket 推送，确保离线用户上线后能拉取历史 |
| 5 | **消息支持图片/文件** | 业务场景需要发送证件照片、补充文件，复用现有 OSS 预签名直传 |
| 6 | **已读回执（per-user）** | `ChatRead` 记录每个用户对该会话的最后已读消息 ID，计算未读数 |
| 7 | **系统消息由后端自动生成** | 关键工作流节点自动插入 SYSTEM 类型消息，减少人工沟通成本 |
| 8 | **聊天入口嵌入订单详情页** | 不新建独立聊天页面——用户心智是"在订单里沟通"，Tab 形式嵌入 |
| 9 | **管理端顶部全局消息角标** | topbar 增加消息图标，显示所有会话总未读数，点击展开会话列表 |
| 10 | **分页加载历史消息** | 初始加载最新 50 条，向上滚动加载更多（cursor-based 分页） |
| 11 | **输入状态指示（typing）** | Socket.io 事件驱动，对方正在输入时显示"xxx 正在输入..."，3s 超时消失 |
| 12 | **管理者只读 + 可介入** | 公司负责人/管理员默认可查看所有聊天，可选择"加入对话"变为可发送 |

---

## 5. 数据库设计

### 5.1 新增表

#### erp_chat_rooms — 聊天会话

```prisma
model ChatRoom {
  id          String      @id @default(cuid())
  companyId   String      @map("company_id")
  orderId     String      @unique @map("order_id")       // 每个订单一个聊天室
  title       String      @db.VarChar(200)                // 自动生成："订单 HX20260328XXXX"
  lastMessage String?     @db.Text @map("last_message")   // 最后一条消息摘要（顶栏预览）
  lastMessageAt DateTime? @map("last_message_at")         // 最后消息时间
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  company     Company     @relation(fields: [companyId], references: [id])
  order       Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  messages    ChatMessage[]
  reads       ChatRead[]

  @@index([companyId])
  @@index([lastMessageAt])
  @@map("erp_chat_rooms")
}
```

#### erp_chat_messages — 聊天消息

```prisma
model ChatMessage {
  id          String        @id @default(cuid())
  roomId      String        @map("room_id")
  companyId   String        @map("company_id")
  senderId    String        @map("sender_id")             // 发送者 userId（SYSTEM 消息为 "system"）
  type        ChatMessageType                            // TEXT / IMAGE / FILE / SYSTEM
  content     String        @db.Text                      // TEXT: 文本内容 / IMAGE/FILE: ossUrl / SYSTEM: 描述文本
  fileName    String?       @db.VarChar(255) @map("file_name")   // FILE 类型的原始文件名
  fileSize    Int?          @map("file_size")                    // FILE 类型的文件大小
  metadata    Json?                                           // 扩展字段（图片尺寸等）
  createdAt   DateTime      @default(now()) @map("created_at")

  room        ChatRoom      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  sender      User?         @relation(fields: [senderId], references: [id])

  @@index([roomId, createdAt])    // 会话内按时间查询（最核心查询）
  @@index([companyId])
  @@index([senderId])
  @@map("erp_chat_messages")
}
```

#### erp_chat_reads — 已读回执

```prisma
model ChatRead {
  id              String    @id @default(cuid())
  roomId          String    @map("room_id")
  userId          String    @map("user_id")
  lastReadMessageId String? @map("last_read_message_id")  // 最后已读的消息 ID
  updatedAt       DateTime  @updatedAt @map("updated_at")

  room            ChatRoom  @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user            User      @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])     // 每人每会话一条记录
  @@index([userId])
  @@map("erp_chat_reads")
}
```

### 5.2 新增枚举

```prisma
enum ChatMessageType {
  TEXT      // 文本
  IMAGE    // 图片
  FILE     // 文件
  SYSTEM   // 系统消息
}
```

### 5.3 Order 表变更

```prisma
model Order {
  // ... 已有字段 ...
  chatRoom ChatRoom?       // 1:1 关联
}
```

### 5.4 User 表变更

```prisma
model User {
  // ... 已有字段 ...
  chatMessages  ChatMessage[]     // 发送的消息
  chatReads     ChatRead[]        // 已读回执
}
```

### 5.5 迁移 SQL（估算）

- 3 张新表：`erp_chat_rooms` / `erp_chat_messages` / `erp_chat_reads`
- 1 个新枚举：`ChatMessageType`
- Order 表：无结构变更（ChatRoom.orderId 已建立关联）
- 预计影响行数：0（全是新表）

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

### 6.4 文件上传（复用现有）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/documents/presign` | 复用现有预签名直传，聊天图片/文件走同一通道 |
| POST | `/api/documents/confirm` | 复用现有上传确认 |

> 聊天文件不写入 `erp_document_files` 表，直接在 ChatMessage 中存储 ossUrl。文件生命周期跟随 ChatRoom。

### 6.5 权限矩阵

| 角色 | 查看会话 | 发送消息 | 查看历史 | 标记已读 |
|---|:---:|:---:|:---:|:---:|
| SUPER_ADMIN (Lv1) | ✅ | ⚠️ 可介入 | ✅ | ✅ |
| COMPANY_OWNER (Lv2) | ✅ | ⚠️ 可介入 | ✅ | ✅ |
| CS_ADMIN (Lv3) | ✅ | ✅ | ✅ | ✅ |
| CUSTOMER_SERVICE (Lv4) | ✅ 仅自己订单 | ✅ | ✅ | ✅ |
| VISA_ADMIN (Lv5) | ✅ | ⚠️ 可介入 | ✅ | ✅ |
| DOC_COLLECTOR (Lv6) | ✅ 仅自己订单 | ✅ | ✅ | ✅ |
| OPERATOR (Lv7) | ✅ 仅自己订单 | ✅ | ✅ | ✅ |
| OUTSOURCE (Lv8) | ❌ | ❌ | ❌ | ❌ |
| CUSTOMER (Lv9) | ✅ 仅自己订单 | ✅ | ✅ | ✅ |

> Lv1/Lv2/Lv5 默认只读，需要调用 `/api/chat/rooms/[orderId]/join` 变为可发送。首次发送时自动 join。

---

## 7. Socket.io 事件设计

### 7.1 客户端 → 服务端

| 事件 | 参数 | 说明 |
|---|---|---|
| `chat:join` | `{ orderId }` | 加入订单聊天房间（order:{orderId}） |
| `chat:leave` | `{ orderId }` | 离开聊天房间 |
| `chat:typing` | `{ orderId }` | 正在输入通知 |
| `chat:mark-read` | `{ orderId, lastReadMessageId }` | 标记已读 |

### 7.2 服务端 → 客户端

| 事件 | 参数 | 说明 |
|---|---|---|
| `chat:message` | `{ id, roomId, orderId, senderId, senderName, senderAvatar, type, content, fileName?, fileSize?, createdAt }` | 新消息推送 |
| `chat:typing` | `{ orderId, userId, realName }` | 对方正在输入 |
| `chat:read` | `{ orderId, userId, realName, lastReadMessageId }` | 已读回执推送 |
| `chat:unread-update` | `{ orderId, unreadCount }` | 未读计数变化 |

### 7.3 Socket.io 服务端改造

```typescript
// src/lib/socket.ts 扩展

// 新增 chat 相关事件处理
io.on('connection', (socket) => {
  const user = socket.data.user

  // ... 现有 join company/user room ...

  // 聊天：加入订单房间
  socket.on('chat:join', ({ orderId }: { orderId: string }) => {
    socket.join(`order:${orderId}`)
  })

  // 聊天：离开订单房间
  socket.on('chat:leave', ({ orderId }: { orderId: string }) => {
    socket.leave(`order:${orderId}`)
  })

  // 聊天：正在输入
  socket.on('chat:typing', ({ orderId }: { orderId: string }) => {
    socket.to(`order:${orderId}`).emit('chat:typing', {
      orderId,
      userId: user.userId,
      realName: socket.data.realName,
    })
  })
})
```

### 7.4 聊天房间管理

在用户连接 Socket 时，自动加入其**所有活跃订单**的聊天房间：

```typescript
// 连接时查询用户关联的活跃订单
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
})

for (const order of activeOrders) {
  socket.join(`order:${order.id}`)
}
```

> 终态订单（已交付/出签/拒签）不再自动加入，但仍可手动 `chat:join` 查看历史。

---

## 8. 前端组件设计

### 8.1 组件树

```
管理端订单详情 (/admin/orders/[id])
├── 现有：信息 Tab / 资料 Tab / 材料 Tab / 日志 Tab
└── 新增：💬 聊天 Tab
    └── ChatPanel 组件
        ├── ChatHeader（会话参与者 + 在线状态）
        ├── ChatMessageList（消息列表 + 滚动加载 + 系统消息特殊样式）
        │   ├── ChatMessage（单条消息）
        │   │   ├── TEXT：文本气泡
        │   │   ├── IMAGE：图片预览 + 点击灯箱
        │   │   ├── FILE：文件卡片（名称/大小/下载）
        │   │   └── SYSTEM：居中灰色系统提示
        │   └── ChatTypingIndicator（"xxx 正在输入..."）
        └── ChatInput（输入框 + 发送按钮 + 文件上传 + 拍照）

客户端订单详情 (/customer/orders/[id])
├── 现有：上传 / 确认提交 / 材料下载 / 出签反馈 / 信息 / 日志
└── 新增：💬 聊天入口（底部固定按钮 or Tab）
    └── CustomerChatPanel（与 ChatPanel 共用核心组件，权限适配）

管理端顶栏 (topbar.tsx)
├── 现有：面包屑 / 通知铃铛 / 个人中心
└── 新增：💬 消息图标
    └── ChatRoomList（会话列表下拉面板）
        └── ChatRoomItem（订单号 + 最后消息 + 未读数 + 时间）
```

### 8.2 核心组件规格

#### ChatPanel（主面板）

| 属性 | 说明 |
|---|---|
| Props | `orderId: string`, `className?: string` |
| 状态 | `messages`, `isLoadingMore`, `hasMore`, `typingUsers`, `unreadCount` |
| 行为 | 初始化加载 → 获取历史消息 → 监听 Socket 事件 → 自动滚底 → 向上滚动加载更多 |

#### ChatMessage（单条消息）

| 属性 | 说明 |
|---|---|
| Props | `message: ChatMessageItem`, `isOwn: boolean`, `showAvatar: boolean` |
| 渲染 | 本人消息右对齐（主色气泡），他人消息左对齐（灰色气泡），系统消息居中灰色 |
| 头像 | 连续消息只显示一次头像（与上条同一发送者则隐藏） |

#### ChatInput（输入区域）

| 属性 | 说明 |
|---|---|
| Props | `onSend: (text: string) => void`, `onFileUpload: (files: File[]) => void`, `onTyping: () => void`, `disabled?: boolean` |
| 行为 | Enter 发送 / Shift+Enter 换行 / 输入触发 typing 事件（300ms 防抖）/ 文件按钮 → 上传 → 发送 |
| UI | 玻璃拟态风格，与现有设计系统一致 |

#### ChatRoomList（会话列表 — 顶栏下拉）

| 属性 | 说明 |
|---|---|
| Props | 无（内部调用 API） |
| 行为 | 点击消息图标 → 展开下拉 → 显示会话列表 → 点击跳转订单详情页聊天 Tab |
| UI | 与 NotificationBell 同级，样式一致（glass-card-static + 圆角 + 动画） |

### 8.3 状态管理

#### 新增 Store：`src/stores/chat-store.ts`

```typescript
interface ChatState {
  // 按 orderId 缓存消息
  messages: Record<string, ChatMessageItem[]>
  // 会话列表
  rooms: ChatRoomSummary[]
  // 全局未读总数
  totalUnread: number
  // 正在输入的用户（按 orderId）
  typingUsers: Record<string, { userId: string; realName: string; timer: NodeTimeout }[]>

  // Actions
  fetchRooms: () => Promise<void>
  fetchMessages: (orderId: string, cursor?: string) => Promise<{ hasMore: boolean }>
  sendMessage: (orderId: string, data: SendMessagePayload) => Promise<void>
  markRead: (orderId: string, lastReadMessageId: string) => Promise<void>
  addMessage: (orderId: string, message: ChatMessageItem) => void
  addTypingUser: (orderId: string, userId: string, realName: string) => void
  removeTypingUser: (orderId: string, userId: string) => void
}
```

#### 新增 Hook：`src/hooks/use-chat.ts`

```typescript
// 封装 ChatPanel 所需逻辑
function useChat(orderId: string) {
  // 1. 初始化：join room + 加载历史
  // 2. 监听 Socket 事件（chat:message / chat:typing / chat:read）
  // 3. 暴露 send / markRead / loadMore
  // 4. 清理：leave room + 移除监听
}
```

---

## 9. 批次拆分与执行计划

| 批次 | 内容 | 工时 | 前置 |
|---|---|---|---|
| **批次 1** | 数据层：Schema + 迁移 + 类型 + ChatRoom 自动创建 | 3h | — |
| **批次 2** | 聊天 API：会话列表 + 消息 CRUD + 已读回执 | 4h | 批次 1 |
| **批次 3** | Socket.io：聊天事件 + 输入指示 + 房间管理 | 3h | 批次 2 |
| **批次 4** | 前端 UI：ChatPanel + ChatInput + ChatRoomList + 顶栏集成 | 7h | 批次 3 |
| **批次 5** | 验收 + 优化 + 测试 | 3h | 批次 4 |

**总计：~20 小时**

---

## 10. 批次 1：数据层 + 类型 + 迁移

### 10.1 任务清单

| # | 任务 | 文件 | 说明 |
|---|---|---|---|
| M4-1 | Schema 扩展 | `prisma/schema.prisma` | 新增 ChatRoom / ChatMessage / ChatRead Model + ChatMessageType 枚举 |
| M4-2 | 迁移 SQL | `prisma/migrations/xxxx_add_chat/migration.sql` | 3 张新表 + 索引 |
| M4-3 | TypeScript 类型 | `src/types/chat.ts` | ChatRoom / ChatMessage / ChatRead 接口 + SendMessagePayload |
| M4-4 | ChatRoom 自动创建 | `src/lib/transition.ts` | transitionOrder 中，订单创建时自动创建 ChatRoom |
| M4-5 | 系统消息工具函数 | `src/lib/chat-system.ts` | `sendSystemMessage(roomId, companyId, content)` 函数 |
| M4-6 | 事件总线集成 | `src/lib/events.ts` | 关键工作流节点自动发送系统消息 |

### 10.2 详细实现

#### M4-1: Schema 扩展

在 `prisma/schema.prisma` 末尾新增：

```prisma
// ==================== 聊天会话 ====================

enum ChatMessageType {
  TEXT
  IMAGE
  FILE
  SYSTEM
}

model ChatRoom {
  id            String        @id @default(cuid())
  companyId     String        @map("company_id")
  orderId       String        @unique @map("order_id")
  title         String        @db.VarChar(200)
  lastMessage   String?       @db.Text @map("last_message")
  lastMessageAt DateTime?     @map("last_message_at")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  company       Company       @relation(fields: [companyId], references: [id])
  order         Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  messages      ChatMessage[]
  reads         ChatRead[]

  @@index([companyId])
  @@index([lastMessageAt])
  @@map("erp_chat_rooms")
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
  sender      User?           @relation(fields: [senderId], references: [id])

  @@index([roomId, createdAt])
  @@index([companyId])
  @@index([senderId])
  @@map("erp_chat_messages")
}

model ChatRead {
  id                String    @id @default(cuid())
  roomId            String    @map("room_id")
  userId            String    @map("user_id")
  lastReadMessageId String?   @map("last_read_message_id")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  room              ChatRoom  @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user              User      @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])
  @@index([userId])
  @@map("erp_chat_reads")
}
```

在 `Company` model 新增：
```prisma
chatRooms ChatRoom[]
```

在 `User` model 新增：
```prisma
chatMessages ChatMessage[]
chatReads    ChatRead[]
```

在 `Order` model 新增：
```prisma
chatRoom ChatRoom?
```

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
  fileName?: string        // 文件原始名
  fileSize?: number        // 文件大小
}

export interface ChatRoomSummary {
  orderId: string
  orderNo: string
  title: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}
```

#### M4-4: ChatRoom 自动创建

在 `src/lib/transition.ts` 中，当 `createOrder` 成功后同步创建 ChatRoom：

```typescript
// 在 POST /api/orders 创建订单成功后
await prisma.chatRoom.create({
  data: {
    companyId: order.companyId,
    orderId: order.id,
    title: `订单 ${order.orderNo}`,
  },
})
```

#### M4-5: 系统消息工具函数

新建 `src/lib/chat-system.ts`：

```typescript
import { prisma } from '@/lib/prisma'
import { emitToRoom } from '@/lib/socket'

export async function sendSystemMessage(
  orderId: string,
  companyId: string,
  content: string,
) {
  // 查找 ChatRoom
  const room = await prisma.chatRoom.findUnique({
    where: { orderId },
    select: { id: true },
  })
  if (!room) return

  // 创建消息
  const message = await prisma.chatMessage.create({
    data: {
      roomId: room.id,
      companyId,
      senderId: 'system',
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
    senderId: 'system',
    senderName: '系统',
    senderAvatar: null,
    type: 'SYSTEM',
    content,
    createdAt: message.createdAt.toISOString(),
  })

  return message
}
```

#### M4-6: 事件总线集成

在 `src/lib/events.ts` 中，在关键工作流节点追加系统消息：

| 节点 | 系统消息内容 |
|---|---|
| 订单创建 | "订单已创建，客服将尽快与您联系" |
| 资料员接单 | "资料员已接单，将协助您准备资料" |
| 状态流转 → COLLECTING_DOCS | "请按清单上传所需资料" |
| 资料审核通过 | "资料审核通过，等待制作签证材料" |
| 资料审核打回 | "资料需要修改，请查看具体说明" |
| 材料上传 | "签证材料已上传，请确认" |
| 状态流转 → DELIVERED | "签证材料已交付" |
| 出签/拒签 | "签证结果：出签/拒签" |

### 10.3 验收标准

- [ ] `npx prisma generate` 无错误
- [ ] 迁移 SQL 执行成功，3 张新表创建
- [ ] `npx tsc --noEmit` 0 错误
- [ ] `npm run build` 0 警告
- [ ] 创建订单后自动创建 ChatRoom（验证数据库）

---

## 11. 批次 2：聊天 API

### 11.1 任务清单

| # | 任务 | 文件 | 说明 |
|---|---|---|---|
| M4-7 | 会话列表 API | `src/app/api/chat/rooms/route.ts` | GET：返回用户关联的会话列表 + 未读数 |
| M4-8 | 会话详情 API | `src/app/api/chat/rooms/[orderId]/route.ts` | GET：获取/创建会话 |
| M4-9 | 消息列表 API | `src/app/api/chat/rooms/[orderId]/messages/route.ts` | GET：cursor-based 分页（50 条） |
| M4-10 | 发送消息 API | 同上（POST） | POST：创建消息 + 更新 ChatRoom 摘要 + Socket 推送 |
| M4-11 | 标记已读 API | `src/app/api/chat/rooms/[orderId]/read/route.ts` | POST：upsert ChatRead |

### 11.2 详细实现

#### M4-7: GET /api/chat/rooms

```typescript
// 权限：所有已登录用户
// 逻辑：
// 1. 查询用户关联的 ChatRooms（通过 Order 关联）
// 2. LEFT JOIN ChatRead 计算未读数
// 3. 按 lastMessageAt DESC 排序
// 返回：
// {
//   success: true,
//   data: [{
//     orderId, orderNo, title, lastMessage, lastMessageAt,
//     unreadCount: 3,   // messages 表 COUNT WHERE id > lastReadMessageId
//   }]
// }

// 查询逻辑：
const rooms = await prisma.$queryRaw`
  SELECT
    cr.id, cr.order_id as orderId, o.order_no as orderNo,
    cr.title, cr.last_message as lastMessage,
    cr.last_message_at as lastMessageAt,
    cr.created_at as createdAt,
    COALESCE(unread.cnt, 0) as unreadCount
  FROM erp_chat_rooms cr
  INNER JOIN erp_orders o ON o.id = cr.order_id
  LEFT JOIN erp_chat_reads crd ON crd.room_id = cr.id AND crd.user_id = ${userId}
  LEFT JOIN (
    SELECT cm.room_id, COUNT(*) as cnt
    FROM erp_chat_messages cm
    LEFT JOIN erp_chat_reads crd2 ON crd2.room_id = cm.room_id AND crd2.user_id = ${userId}
    WHERE cm.id > COALESCE(crd2.last_read_message_id, '')
    GROUP BY cm.room_id
  ) unread ON unread.room_id = cr.id
  WHERE o.customer_id = ${userId}
     OR o.collector_id = ${userId}
     OR o.operator_id = ${userId}
     OR o.created_by = ${userId}
  ORDER BY cr.last_message_at DESC NULLS LAST
  LIMIT 50
`
```

> 实际实现可用 Prisma ORM + 应用层计算未读数，原生 SQL 仅作为性能参考。

#### M4-9: GET /api/chat/rooms/[orderId]/messages

```typescript
// 权限：订单相关人员（customer/collector/operator/createdBy）+ 管理者
// 参数：?cursor=xxx&limit=50
// 逻辑：
// 1. 校验用户对订单有访问权
// 2. 查找 ChatRoom
// 3. cursor 为空 → 返回最新 50 条
//    cursor 不为空 → 返回 createdAt < cursor 的 50 条
// 4. 查询 User 信息填充 senderName/senderAvatar/senderRole
// 返回：
// {
//   success: true,
//   data: [ChatMessageItem],
//   meta: { hasMore: true, cursor: "2026-03-28T..." }
// }
```

#### M4-10: POST /api/chat/rooms/[orderId]/messages

```typescript
// 权限：CUSTOMER/Lv3-4/Lv6-7 可直接发送；Lv1-2/5 首次发送自动 join
// Body: { type: 'TEXT'|'IMAGE'|'FILE', content: string, fileName?: string, fileSize?: number }
// 逻辑：
// 1. 校验权限 + 校验订单存在
// 2. 校验 ChatRoom 存在（不存在则自动创建）
// 3. 校验内容：
//    - TEXT: content 非空，最长 2000 字符
//    - IMAGE: content 为 ossUrl，校验 ossKey 路径
//    - FILE: content 为 ossUrl + fileName + fileSize
// 4. Prisma 事务：
//    a. 创建 ChatMessage
//    b. 更新 ChatRoom (lastMessage, lastMessageAt)
// 5. Socket 推送到 order:{orderId}
// 6. 通知：非即时场景下为离线用户创建 Notification
// 返回：
// { success: true, data: ChatMessageItem }

// 通知逻辑（低优先级优化）：
// 如果接收方不在线（Socket 未连接），创建一条 Notification
// type: 'SYSTEM'，title: "xxx 给您发了一条消息"
// 避免高频消息轰炸：同会话 5 分钟内只发 1 条通知
```

#### M4-11: POST /api/chat/rooms/[orderId]/read

```typescript
// Body: { lastReadMessageId: string }
// 逻辑：
// Prisma upsert ChatRead:
//   where: { roomId_userId: { roomId, userId } }
//   update: { lastReadMessageId }
//   create: { roomId, userId, lastReadMessageId }
// Socket 推送：chat:read → order:{orderId}
// 返回：
// { success: true }
```

### 11.3 验收标准

- [ ] GET /api/chat/rooms 返回会话列表 + 未读数
- [ ] GET messages 返回分页消息
- [ ] POST messages 创建消息 + 更新 ChatRoom + Socket 推送
- [ ] POST read 更新已读位置
- [ ] 权限校验正确（Lv8 OUTSOURCE 被拒绝）
- [ ] `npx tsc --noEmit` 0 错误

---

## 12. 批次 3：Socket.io 聊天事件

### 12.1 任务清单

| # | 任务 | 文件 | 说明 |
|---|---|---|---|
| M4-12 | Socket 服务端扩展 | `src/lib/socket.ts` | chat:join/leave/typing/mark-read 事件处理 |
| M4-13 | emitToRoom 工具函数 | `src/lib/socket.ts` | 新增 `emitToRoom(room, event, data)` |
| M4-14 | 连接时自动加入房间 | `src/lib/socket.ts` | connection 时查询活跃订单 → 自动 join |
| M4-15 | Socket 客户端扩展 | `src/hooks/use-socket-client.ts` | 新增 chat 事件监听 + typing 防抖发送 |

### 12.2 详细实现

#### M4-12 + M4-13: Socket 服务端扩展

```typescript
// src/lib/socket.ts 追加

// 新增：向房间广播
export function emitToRoom(room: string, event: string, data: unknown): void {
  io?.to(room).emit(event, data)
}

// io.on('connection') 内追加：
// 1. 查询活跃订单 → 自动 join
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
})
for (const order of activeOrders) {
  socket.join(`order:${order.id}`)
}

// 2. 聊天事件
socket.on('chat:join', ({ orderId }: { orderId: string }) => {
  socket.join(`order:${orderId}`)
})

socket.on('chat:leave', ({ orderId }: { orderId: string }) => {
  socket.leave(`order:${orderId}`)
})

socket.on('chat:typing', ({ orderId }: { orderId: string }) => {
  socket.to(`order:${orderId}`).emit('chat:typing', {
    orderId,
    userId: user.userId,
    realName: socket.data.realName,
  })
})

socket.on('chat:mark-read', async ({ orderId, lastReadMessageId }) => {
  // 更新 DB
  const room = await prisma.chatRoom.findUnique({
    where: { orderId },
    select: { id: true },
  })
  if (!room) return

  await prisma.chatRead.upsert({
    where: { roomId_userId: { roomId: room.id, userId: user.userId } },
    update: { lastReadMessageId },
    create: { roomId: room.id, userId: user.userId, lastReadMessageId },
  })

  // 广播已读回执
  socket.to(`order:${orderId}`).emit('chat:read', {
    orderId,
    userId: user.userId,
    realName: socket.data.realName,
    lastReadMessageId,
  })
})
```

#### M4-15: Socket 客户端扩展

```typescript
// src/hooks/use-socket-client.ts 追加 options

interface UseSocketOptions {
  onNotification?: (data: { ... }) => void
  // 新增：
  onChatMessage?: (data: ChatMessageSocketPayload) => void
  onChatTyping?: (data: { orderId: string; userId: string; realName: string }) => void
  onChatRead?: (data: { orderId: string; userId: string; realName: string; lastReadMessageId: string }) => void
}

// 在 socket.on 部分追加：
socket.on('chat:message', (data) => {
  optionsRef.current.onChatMessage?.(data)
})

socket.on('chat:typing', (data) => {
  optionsRef.current.onChatTyping?.(data)
})

socket.on('chat:read', (data) => {
  optionsRef.current.onChatRead?.(data)
})

// 新增暴露方法：
return {
  isConnected,
  disconnect,
  // 新增：
  joinRoom: (orderId: string) => socket.emit('chat:join', { orderId }),
  leaveRoom: (orderId: string) => socket.emit('chat:leave', { orderId }),
  sendTyping: (orderId: string) => socket.emit('chat:typing', { orderId }),
  markRead: (orderId: string, lastReadMessageId: string) =>
    socket.emit('chat:mark-read', { orderId, lastReadMessageId }),
}
```

### 12.3 验收标准

- [ ] 客户端连接后自动加入活跃订单房间
- [ ] `chat:join` / `chat:leave` 端到端验证
- [ ] `chat:typing` 广播到同房间其他用户
- [ ] `chat:mark-read` 写入 DB + 广播
- [ ] `npx tsc --noEmit` 0 错误

---

## 13. 批次 4：前端聊天 UI

### 13.1 任务清单

| # | 任务 | 文件 | 说明 |
|---|---|---|---|
| M4-16 | ChatStore | `src/stores/chat-store.ts` | Zustand 状态管理 |
| M4-17 | useChat Hook | `src/hooks/use-chat.ts` | 聊天逻辑封装 |
| M4-18 | ChatMessage 组件 | `src/components/chat/chat-message.tsx` | 单条消息渲染 |
| M4-19 | ChatMessageList 组件 | `src/components/chat/chat-message-list.tsx` | 消息列表 + 滚动加载 |
| M4-20 | ChatInput 组件 | `src/components/chat/chat-input.tsx` | 输入框 + 文件 + 拍照 |
| M4-21 | ChatPanel 组件 | `src/components/chat/chat-panel.tsx` | 主面板（组装 MessageList + Input） |
| M4-22 | ChatRoomList 组件 | `src/components/chat/chat-room-list.tsx` | 顶栏会话列表下拉 |
| M4-23 | 管理端订单详情集成 | `src/app/admin/orders/[id]/page.tsx` | 新增「聊天」Tab |
| M4-24 | 客户端订单详情集成 | `src/app/customer/orders/[id]/page.tsx` | 新增聊天入口 |
| M4-25 | 顶栏集成 | `src/components/layout/topbar.tsx` | 新增消息图标 + ChatRoomList |

### 13.2 详细实现

#### M4-18: ChatMessage 组件

```
┌─────────────────────────────────────────────┐
│ [系统消息] 订单已创建，客服将尽快与您联系    │  ← 居中，灰色，无头像
├─────────────────────────────────────────────┤
│ [他人消息]                         03-28 14:02│
│ 张三 (客服)                                      │  ← 左对齐，灰色气泡
│ ┌─────────────────────┐                        │
│ │ 请上传护照首页扫描件  │                        │
│ └─────────────────────┘                        │
├─────────────────────────────────────────────┤
│                           03-28 14:05 [本人]│
│                           ┌─────────────────┐│  ← 右对齐，主色气泡
│                           │ 好的，已上传      ││
│                           └─────────────────┘│
├─────────────────────────────────────────────┤
│ [图片消息]                                     │
│ ┌─────┐                                       │
│ │ IMG │  ← 点击灯箱预览                        │
│ └─────┘                                       │
├─────────────────────────────────────────────┤
│ [文件消息]                                     │
│ ┌─────────────────────────┐                   │
│ │ 📄 护照扫描件.pdf  1.2MB │  ← 点击下载       │
│ └─────────────────────────┘                   │
├─────────────────────────────────────────────┤
│ [输入指示] 张三正在输入...                     │  ← 3s 后自动消失
└─────────────────────────────────────────────┘
```

#### M4-20: ChatInput 组件

```
┌─────────────────────────────────────────────┐
│  [📎] [📷]  │ 输入消息...          │  [发送]  │
│             │                      │         │
└─────────────────────────────────────────────┘

- 📎 文件上传：复用 presign + confirm → ossUrl → 发送 FILE 消息
- 📷 拍照：复用 CameraCapture → OSS → 发送 IMAGE 消息
- 输入防抖 300ms → emit chat:typing
- Enter 发送，Shift+Enter 换行
- 发送后清空输入框 + 自动滚底
```

#### M4-22: ChatRoomList 组件

```
┌────────────────────────────────────────────┐
│ 💬 消息 (5)                                 │  ← 顶栏按钮
├────────────────────────────────────────────┤
│ (点击展开下拉面板)                           │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ HX20260328001  王小明  好的，已上传...  3│ │  ← 未读气泡
│ │ HX20260327042  李四    请补充在职证明    │ │
│ │ HX20260326018  赵六    材料已交付 ✓     │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ── 点击跳转到对应订单详情页聊天 Tab ──      │
└────────────────────────────────────────────┘
```

#### M4-17: useChat Hook 伪代码

```typescript
function useChat(orderId: string) {
  const { socket, isConnected, joinRoom, leaveRoom, sendTyping, markRead: socketMarkRead } = useSocketClient({
    onChatMessage: (data) => {
      if (data.orderId === orderId) {
        chatStore.addMessage(orderId, data)
        // 自动滚底
        scrollToBottom()
        // 自动标记已读（如果在前台）
        if (document.visibilityState === 'visible') {
          markRead(data.id)
        }
      }
    },
    onChatTyping: (data) => {
      if (data.orderId === orderId && data.userId !== currentUser.id) {
        chatStore.addTypingUser(orderId, data.userId, data.realName)
      }
    },
    onChatRead: (data) => {
      // 更新已读指示器
    },
  })

  // 初始化
  useEffect(() => {
    if (isConnected) {
      joinRoom(orderId)
      chatStore.fetchMessages(orderId)
    }
    return () => leaveRoom(orderId)
  }, [orderId, isConnected])

  // typing 防抖
  const typingTimeout = useRef<NodeTimeout>()
  const handleTyping = useCallback(() => {
    if (!typingTimeout.current) {
      sendTyping(orderId)
    }
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      typingTimeout.current = undefined
    }, 3000)
  }, [orderId])

  // 发送消息
  const send = useCallback(async (payload: SendMessagePayload) => {
    await chatStore.sendMessage(orderId, payload)
  }, [orderId])

  // 标记已读
  const markRead = useCallback(async (messageId: string) => {
    await chatStore.markRead(orderId, messageId)
    socketMarkRead(orderId, messageId)
  }, [orderId])

  // 加载更多
  const loadMore = useCallback(async () => {
    const lastMessage = chatStore.messages[orderId]?.[0]
    if (lastMessage) {
      return chatStore.fetchMessages(orderId, lastMessage.createdAt)
    }
    return { hasMore: false }
  }, [orderId])

  return { messages, send, loadMore, handleTyping, typingUsers, unreadCount }
}
```

#### M4-23: 管理端订单详情集成

在 `src/app/admin/orders/[id]/page.tsx` 的 Tab 列表中新增「聊天」Tab：

```tsx
// Tab 结构（新增后）：
const tabs = [
  { id: 'info', label: '订单信息', icon: '📋' },
  { id: 'documents', label: '资料管理', icon: '📄' },
  { id: 'materials', label: '签证材料', icon: '🛂' },
  { id: 'chat', label: '聊天', icon: '💬' },       // ← 新增
  { id: 'logs', label: '操作记录', icon: '📝' },
]

// Tab 内容：
{activeTab === 'chat' && (
  <ChatPanel orderId={order.id} />
)}
```

#### M4-24: 客户端订单详情集成

在 `src/app/customer/orders/[id]/page.tsx` 中，新增聊天区域：

方案 A（推荐）：底部固定聊天按钮 → 展开抽屉式聊天面板
方案 B：新增 Tab

推荐方案 A，因为客户端页面已有多个区块，Tab 会增加层级。

```tsx
// 方案 A：浮动聊天按钮 + 抽屉
const [showChat, setShowChat] = useState(false)

// 页面底部
<div className="fixed bottom-20 right-4 z-40">
  {showChat && (
    <div className="w-80 h-96 glass-card-static rounded-xl shadow-2xl animate-slide-in-up overflow-hidden">
      <ChatPanel orderId={order.id} compact />
    </div>
  )}
  <button
    onClick={() => setShowChat(!showChat)}
    className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
  >
    💬
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-error)] text-xs rounded-full flex items-center justify-center">
        {unreadCount}
      </span>
    )}
  </button>
</div>
```

#### M4-25: 顶栏集成

在 `src/components/layout/topbar.tsx` 中，通知铃铛旁新增消息图标：

```tsx
<div className="flex items-center gap-2">
  <ChatRoomList />      {/* ← 新增 */}
  <NotificationBell />
  {/* ...个人中心... */}
</div>
```

### 13.3 样式规范

- 消息气泡：玻璃拟态风格，与现有 glass-card 一致
- 本人消息：`bg-[var(--color-primary)]/20` + `backdrop-blur`
- 他人消息：`bg-white/5` + `backdrop-blur`
- 系统消息：居中，`text-[var(--color-text-placeholder)]`，无气泡背景
- 输入框：底部固定，`glass-card-static` 背景
- 滚动条：自定义细滚动条（`scrollbar-thin`）
- 动画：新消息淡入（`animate-fade-in-up`），抽屉展开（`animate-slide-in-up`）

### 13.4 验收标准

- [ ] 管理端订单详情页「聊天」Tab 可正常显示
- [ ] 客户端订单详情页聊天浮窗可正常展开/收起
- [ ] 发送文本消息 → 实时出现在双方屏幕
- [ ] 发送图片消息 → 图片预览 + 灯箱
- [ ] 发送文件消息 → 文件卡片 + 下载
- [ ] 系统消息在工作流节点自动出现
- [ ] 向上滚动加载历史消息
- [ ] "xxx 正在输入" 正常显示/消失
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
| M4-26 | 全量 tsc + build 验收 | 0 错误 0 警告 |
| M4-27 | 测试用例补充 | chat-system.ts 单元测试 |
| M4-28 | 边界场景处理 | 长消息折叠、超长消息截断、空消息校验、并发发送 |
| M4-29 | 离线消息通知 | 用户不在线时，创建 Notification（5 分钟去重） |
| M4-30 | 性能优化 | 消息列表虚拟滚动（react-window）、图片懒加载 |
| M4-31 | 文档更新 | 03-project-status + 02-architecture + README |

### 14.2 边界场景

| 场景 | 处理 |
|---|---|
| 客户发消息时客服不在线 | 消息持久化到 DB，客服上线后拉取历史 + 收到 Notification |
| 终态订单仍可聊天 | 允许查看历史，但不自动 join 房间 |
| 超长消息（>2000 字） | API 层截断拒绝 + 前端字数提示 |
| 重复发送 | 前端发送按钮 loading + 后端幂等（无特殊处理，接受轻微重复） |
| 图片上传失败 | 前端显示错误提示，不发送消息 |
| 多设备登录 | 同一用户多个 Socket 连接都会收到消息 |

### 14.3 单元测试

新建 `src/lib/__tests__/chat-system.test.ts`：

```typescript
describe('sendSystemMessage', () => {
  it('should create SYSTEM message and update ChatRoom')
  it('should emit to socket room')
  it('should handle missing ChatRoom gracefully')
})
```

### 14.4 验收标准

- [ ] 全部 14.1 任务完成
- [ ] `npx tsc --noEmit` 0 错误
- [ ] `npm run build` 0 警告
- [ ] 新增测试通过
- [ ] 74 + N 测试全部通过
- [ ] as any / console.log / TODO = 0
- [ ] 所有文档版本号更新

---

## 15. 文件变更全量清单

### 新建文件（10 个）

| 文件 | 说明 |
|---|---|
| `prisma/migrations/xxxx_add_chat/migration.sql` | 迁移 SQL |
| `src/types/chat.ts` | 聊天类型定义 |
| `src/lib/chat-system.ts` | 系统消息工具函数 |
| `src/stores/chat-store.ts` | 聊天 Zustand Store |
| `src/hooks/use-chat.ts` | 聊天 Hook |
| `src/app/api/chat/rooms/route.ts` | 会话列表 API |
| `src/app/api/chat/rooms/[orderId]/route.ts` | 会话详情 API |
| `src/app/api/chat/rooms/[orderId]/messages/route.ts` | 消息 API |
| `src/app/api/chat/rooms/[orderId]/read/route.ts` | 已读 API |
| `src/components/chat/chat-message.tsx` | 消息组件 |
| `src/components/chat/chat-message-list.tsx` | 消息列表组件 |
| `src/components/chat/chat-input.tsx` | 输入组件 |
| `src/components/chat/chat-panel.tsx` | 主面板组件 |
| `src/components/chat/chat-room-list.tsx` | 会话列表组件 |
| `src/lib/__tests__/chat-system.test.ts` | 测试 |

### 修改文件（6 个）

| 文件 | 变更 |
|---|---|
| `prisma/schema.prisma` | 新增 3 Model + 1 Enum + 关联 |
| `src/lib/socket.ts` | +emitToRoom +chat 事件 +自动 join |
| `src/hooks/use-socket-client.ts` | +chat 事件监听 +joinRoom/leaveRoom/sendTyping/markRead |
| `src/app/admin/orders/[id]/page.tsx` | +聊天 Tab |
| `src/app/customer/orders/[id]/page.tsx` | +聊天浮窗 |
| `src/components/layout/topbar.tsx` | +ChatRoomList |
| `src/lib/events.ts` | +系统消息触发点 |
| `src/app/api/orders/route.ts` (POST) | +ChatRoom 自动创建 |

### 源文件统计

| 指标 | M4 前 | M4 后 | 增量 |
|---|---|---|---|
| 源文件 | 119 | ~134 | +15 |
| 代码行数 | ~13,757 | ~15,200 | +~1,450 |
| API 路由 | 39 | 43 | +4 |
| 组件 | 25 | 30 | +5 |
| 测试文件 | 4 | 5 | +1 |

---

## 16. 验收标准

### 16.1 功能验收（12 项）

| # | 验收点 | 检查方法 |
|---|---|---|
| 1 | 创建订单后自动创建 ChatRoom | API 创建订单 → 查 DB erp_chat_rooms |
| 2 | 工作流节点自动发送系统消息 | 执行状态流转 → 查聊天面板出现系统消息 |
| 3 | 发送文本消息实时双向可见 | 两个浏览器登录 → 互发消息 → 双方实时显示 |
| 4 | 发送图片消息预览+灯箱 | 发送图片 → 点击 → 全屏灯箱 |
| 5 | 发送文件消息可下载 | 发送文件 → 点击下载 → 文件完整 |
| 6 | 历史消息分页加载 | 向上滚动 → 加载更多 → 连续性正确 |
| 7 | "正在输入" 指示 | 一方输入 → 另一方看到指示 → 3s 后消失 |
| 8 | 已读回执 | 一方阅读 → 另一方看到已读标记 |
| 9 | 顶栏未读计数 | 收到新消息 → 顶栏角标 +1 → 点击清零 |
| 10 | 会话列表跳转 | 顶栏消息 → 会话列表 → 点击 → 跳转到订单聊天 |
| 11 | 离线消息恢复 | 关闭浏览器 → 另一方发消息 → 重新打开 → 历史完整 |
| 12 | 权限隔离 | OUTSOURCE 角色 → API 返回 403 |

### 16.2 全局验收（8 项）

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

### 16.3 端到端测试流程（15 步）

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

*文档结束 — M4 唯一开发指南*
