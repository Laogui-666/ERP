# 沐海旅行 ERP - M3 全知开发手册（终版）

> **文档版本**: V3.0
> **更新日期**: 2026-03-23 01:00
> **用途**: M3 阶段唯一开发指南。即使丢失所有上下文，拿到本文件 + Git 仓库即可完整恢复开发。
> **前置条件**: M1 ✅ + M2 ✅ + M5 ✅ 全部完成（100 源文件 / 11183 行 / 30 API 路由 / 15 页面 / 22 组件 / 74 测试用例）
> **核心交付**: 客户端门户完整可用 + 两类资料交互闭环 + 实时通信接入 + 全链路通知闭环
> **分析基础**: 两轮深度分析（逐文件审查全部 100 个源文件 + 30 个 API 路由 + 工作流文档 + 客户材料清单）

---

## 目录

1. [M3 总览](#1-m3-总览)
2. [两类资料流向深度分析](#2-两类资料流向深度分析)
3. [客户材料清单结构化分析](#3-客户材料清单结构化分析)
4. [全链路通知矩阵（逐节点审查）](#4-全链路通知矩阵)
5. [现状差距分析（含代码审查结果）](#5-现状差距分析)
6. [架构决策（10 项）](#6-架构决策)
7. [Phase A：基础框架补全（M3-1 ~ M3-4）](#7-phase-a基础框架补全)
8. [Phase B：客户端资料交互（M3-5 ~ M3-10）](#8-phase-b客户端资料交互)
9. [Phase C：订单详情页（M3-11）](#9-phase-c订单详情页)
10. [Phase D：通知与实时通信（M3-12 ~ M3-15）](#10-phase-d通知与实时通信)
11. [Phase E：个人中心（M3-16 ~ M3-17）](#11-phase-e个人中心)
12. [Phase F：API 补全与通知闭环（M3-18 ~ M3-20）](#12-phase-fapi-补全与通知闭环)
13. [Phase G：管理端增强（M3-21 ~ M3-22）](#13-phase-g管理端增强)
14. [文件变更全量清单](#14-文件变更全量清单)
15. [执行计划（8 批次）](#15-执行计划)
16. [验收标准](#16-验收标准)
17. [风险矩阵](#17-风险矩阵)
18. [端到端测试场景](#18-端到端测试场景)

---

## 1. M3 总览

### 1.1 目标

| 目标 | 说明 |
|---|---|
| 客户端门户完整可用 | 订单详情、A 类资料上传、B 类材料下载、通知中心、个人中心 |
| A 类资料交互闭环 | 资料员发送清单 → 客户逐项上传 → 客户确认提交 → 资料员审核 → 补充循环 |
| B 类材料交付闭环 | 操作员上传 → 资料员确认 → 状态变为已交付 → 客户下载 |
| 通知全链路打通 | 5 个缺口修复 + Socket.io 实时推送客户端接入 |
| 客户材料清单适配 | 12 类材料说明文字展示 + 预选机制 + 多文件上传 |

### 1.2 当前项目状态

| 维度 | 状态 |
|---|---|
| M1 基础架构 | ✅ 100% |
| M2 核心工作流 | ✅ 100% (19/19) |
| M5 多申请人+看板 | ✅ 100% (8/8 批次) |
| M3 文件与客户端 | ⬜ 0%（本手册） |

### 1.3 关键文件位置速查

```
erp-repo/
├── prisma/schema.prisma
├── src/
│   ├── app/
│   │   ├── customer/                           ← M3 主战场
│   │   │   ├── layout.tsx                      ← 修改：补全3个Tab + Socket + 角标
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx                    ← 修改：卡片可点击 + 待办提示
│   │   │   │   └── [id]/page.tsx               ← 新建：客户订单详情页 ⭐核心
│   │   │   ├── notifications/page.tsx          ← 新建：通知中心
│   │   │   └── profile/page.tsx                ← 新建：个人中心
│   │   ├── api/
│   │   │   ├── documents/
│   │   │   │   ├── presign/route.ts            ← 新建：预签名直传
│   │   │   │   ├── confirm/route.ts            ← 新建：上传确认写库
│   │   │   │   ├── files/[id]/route.ts         ← 新建：文件级删除
│   │   │   │   ├── upload/route.ts             ← 不改（兼容保留）
│   │   │   │   └── [id]/route.ts               ← 不改（审核逻辑已有）
│   │   │   ├── orders/[id]/
│   │   │   │   ├── documents/route.ts          ← 修改：POST 增加通知客户
│   │   │   │   └── submit/route.ts             ← 新建：客户确认提交 + 通知资料员
│   │   │   └── auth/
│   │   │       └── change-password/route.ts    ← 新建：修改密码
│   │   └── (已有 API 路由均不改)
│   ├── components/
│   │   ├── orders/
│   │   │   ├── status-timeline.tsx             ← 新建：6步进度条
│   │   │   └── material-checklist.tsx          ← 新建：材料说明面板
│   │   └── documents/
│   │       └── customer-upload.tsx             ← 新建：客户上传组件 ⭐核心
│   ├── hooks/
│   │   └── use-socket-client.ts                ← 新建：Socket.io 客户端
│   └── lib/
│       ├── rbac.ts                             ← 修改：CUSTOMER 加 delete 权限
│       └── socket.ts                           ← 修改：支持 Cookie 认证
└── docs/
    └── 06-M3-dev-plan.md                      ← 本文件
```

---

## 2. 两类资料流向深度分析

### 2.1 完整 5 阶段工作流时序（基于工作流文档逐句核对）

```
阶段一：客服接单录单
  客服录入 → POST /api/orders
  → 自动创建客户账号（passwordHash 为空）
  → 状态: PENDING_CONNECTION
  → 通知: 资料员收到"又有新订单啦" ✅已有
  → 通知: 客户收到"订单已创建" ✅已有

阶段二：资料员接单及收集反馈
  资料员接单 → POST /api/orders/[id]/claim
  → 状态: PENDING_CONNECTION → CONNECTED ✅已有

  资料员选择/添加资料清单 → POST /api/orders/[id]/documents
  → 创建 DocumentRequirement 记录
  → ⚠️ 客户未收到通知 → M3-18 修复

  资料员点击"发送客户" → 状态: CONNECTED → COLLECTING_DOCS
  → POST /api/orders/[id]/status ✅已有
  → 通知: 客户收到状态变更通知 ✅已有（events.ts）

  客户上传资料 → POST /api/documents/presign → 直传 OSS → POST /api/documents/confirm
  → ⚠️ 不立即通知资料员 → 设计决策：等客户"确认提交"

  客户点击"确认提交" → POST /api/orders/[id]/submit
  → ⚠️ 新 API → M3-9 新建
  → 通知: 资料员收到"客户已提交资料" → M3-9 实现

  资料员审核 → PATCH /api/documents/[id]
  → 合格: status=APPROVED（不通知客户，合理）
  → 不合格: status=REJECTED/SUPPLEMENT → 通知客户 ✅已有

  全部合格 → 资料员点击"提交审核"
  → POST /api/orders/[id]/status (COLLECTING_DOCS → PENDING_REVIEW)
  → 通知: 操作员收到 ✅已有（events.ts）

阶段三：操作员接单及审核反馈
  操作员接单 → POST /api/orders/[id]/claim
  → 状态: PENDING_REVIEW → UNDER_REVIEW ✅已有

  操作员反馈 → PATCH /api/documents/[id] 或直接通知
  → 通知: 资料员收到 ✅已有（events.ts）

  操作员确认达标 → POST /api/orders/[id]/status (UNDER_REVIEW → MAKING_MATERIALS)
  → 通知: 资料员+客户 ✅已有（events.ts）

阶段四：材料制作与交付
  操作员上传材料 → POST /api/orders/[id]/materials
  → 状态: MAKING_MATERIALS → PENDING_DELIVERY ✅已有
  → 通知: 资料员 ✅已有，客户 ✅已有

  资料员确认交付 → POST /api/orders/[id]/status (PENDING_DELIVERY → DELIVERED)
  → 通知: 客户 ✅已有（events.ts）

  客户查看/下载材料 → GET /api/orders/[id]/materials
  → ✅已有（CUSTOMER 有 materials.read）

阶段五：结果反馈
  操作员/客户提交结果 → POST /api/orders/[id]/status (DELIVERED → APPROVED/REJECTED)
  → CUSTOMER 在 TRANSITION_RULES 中 ✅已有
  → ⚠️ 客户端无此 UI → M3-11 中实现（低优先级，M3 可先不做）
```

### 2.2 A 类资料（客户上传 → 系统审核）

| 数据流 | API | 状态 |
|---|---|:---:|
| 资料员创建需求清单 | POST /api/orders/[id]/documents | ✅已有 |
| 资料员选择模板应用 | POST /api/orders/[id]/documents（批量） | ✅已有 |
| 客户查看需求清单 | GET /api/orders/[id]/documents | ✅已有 |
| 客户上传文件（预签名） | POST /api/documents/presign + 直传 OSS | ⬜M3新建 |
| 客户确认上传写库 | POST /api/documents/confirm | ⬜M3新建 |
| 客户删除自己上传的文件 | DELETE /api/documents/files/[id] | ⬜M3新建 |
| 客户确认提交（触发审核） | POST /api/orders/[id]/submit | ⬜M3新建 |
| 资料员审核 | PATCH /api/documents/[id] | ✅已有 |
| 客户查看审核结果 | GET /api/orders/[id]/documents | ✅已有 |

### 2.3 B 类材料（操作员制作 → 客户下载）

| 数据流 | API | 状态 |
|---|---|:---:|
| 操作员上传签证材料 | POST /api/orders/[id]/materials | ✅已有 |
| 资料员查看材料 | GET /api/orders/[id]/materials | ✅已有 |
| 客户查看/下载材料 | GET /api/orders/[id]/materials | ✅已有 |
| 预览/下载 | FilePreview 组件 + getSignedUrl | ✅已有 |

**结论**：B 类材料全流程 API 已就绪，M3 仅需在客户端展示。

### 2.4 管理端 DocumentPanel vs 客户端 CustomerUpload 对比

| 能力 | DocumentPanel（管理端） | CustomerUpload（客户端） |
|---|---|---|
| 添加需求项 | ✅ | ❌（只看不加） |
| 选择模板 | ✅ | ❌ |
| 审核（合格/不合格） | ✅ | ❌ |
| 上传文件 | ✅（服务端上传） | ✅（预签名直传） |
| 拍照上传 | ✅ | ✅ |
| 查看说明文字 | ✅ | ✅（重点展示） |
| 删除文件 | ⬜（M3-21 增强） | ✅（M3-8） |
| "发送客户"按钮 | ✅（已有，但不通知） | ❌ |
| "确认提交"按钮 | ❌ | ✅（M3-9） |
| 多文件上传 | ✅ | ✅ |
| 按申请人分组 | ✅（M5 已实现） | ✅（复用逻辑） |

---

## 3. 客户材料清单结构化分析

### 3.1 12 大类材料清单

| # | 材料名称 | 预选 | 多文件 | 说明文字要点 |
|---|---|:---:|:---:|---|
| 1 | 签证个人信息表 | ✅ | — | 如实填写，信息与护照一致 |
| 2 | 护照首页 | ✅ | — | 有效期≥6月，4页空白，彩色扫描 |
| 3 | 当前有效护照整本全部页 | — | ✅ | 个人信息页+所有使用页，1:1彩色 |
| 4 | 身份证 | ✅ | — | 正反面，1:1彩色 |
| 5 | 户口本 | ✅ | ✅ | 家庭整本/集体户首页+本人页 |
| 6 | 婚姻状况 | — | — | 条件性：已婚→结婚证/离婚→离婚证 |
| 7 | 工作证明 | — | ✅ | 按职业细分：在职/退休/未就业/自雇 |
| 8 | 营业执照/组织机构代码 | — | ✅ | A4复印加盖公章 |
| 9 | 资金证明（银行流水） | — | ✅ | 近半年，余额≥5万，20天内打印 |
| 10 | 旧护照信息页 | — | ✅ | 可选 |
| 11 | 辅助资产 | — | ✅ | 可选：房产/车产/理财 |
| 12 | 邀请人资料 | — | ✅ | 条件性：探亲/访友/商务 |
| 13 | 同行人资料 | — | ✅ | 可选 |
| 14 | 其余补充资料 | — | ✅ | 资料员手动添加 |

### 3.2 关键设计要点

1. **预选机制**：4 项默认预选 → 系统预置模板中标记 `defaultSelected: true`
2. **说明文字即要求**：`DocumentRequirement.description` 存储详细要求 → 前端原样展示
3. **条件性材料**：系统不自动判断，由资料员根据客户情况手动添加
4. **多文件**：同一需求项下可多次上传 → DocumentRequirement → DocumentFile (1:N)
5. **不需要 OCR/条件识别**：纯说明性展示

---

## 4. 全链路通知矩阵（逐节点审查）

> 基于代码逐文件审查（events.ts + 各 API route）的结果。

### 4.1 通知节点总览

| # | 触发时机 | 通知接收者 | 通知类型 | 代码位置 | 状态 |
|---|---|---|---|---|:---:|
| N1 | 客服创建订单 | 资料员们 | ORDER_NEW | orders/route.ts POST | ✅ |
| N2 | 客服创建订单 | 客户 | ORDER_CREATED | orders/route.ts POST | ✅ |
| N3 | 状态变更（任何） | collector+operator+customer+createdBy | STATUS_CHANGE | events.ts | ✅ |
| N4 | 资料员审核驳回 | 客户 | DOC_REVIEWED | documents/[id] PATCH | ✅ |
| N5 | 操作员上传材料 | 资料员 | MATERIAL_UPLOADED | materials POST | ✅ |
| N6 | 操作员上传材料（首次） | 客户 | MATERIAL_UPLOADED | materials POST | ✅ |
| N7 | 取消订单 | collector+operator+customer | STATUS_CHANGE | cancel POST | ✅ |
| N8 | **资料员发送资料清单** | **客户** | **—** | **documents POST** | **⬜ M3-18** |
| N9 | **客户确认提交资料** | **资料员** | **—** | **—（无此API）** | **⬜ M3-9** |
| N10 | **客户上传文件** | **资料员** | **—** | **upload/confirm** | **设计决策：不通知** |

### 4.2 缺口分析

**缺口 N8：资料员发送清单后客户无通知**
- 代码位置：`src/app/api/orders/[id]/documents/route.ts` POST 方法
- 当前行为：批量创建 DocumentRequirement，写操作日志，返回结果
- 缺失：不创建客户通知
- 修复：POST 方法末尾增加通知客户逻辑

**缺口 N9：客户确认提交后资料员无通知**
- 原因：当前不存在"客户确认提交" API
- 修复：新建 `POST /api/orders/[id]/submit` + 创建资料员通知

**N10 设计决策：客户每次上传不通知资料员**
- 原因：客户可能分多次上传（如先传护照，过两天再传银行流水），每次都通知会造成骚扰
- 方案：客户上传后文件保存为"草稿"状态，点击"确认提交"时统一通知资料员
- 这符合工作流文档中"确认提交"的交互描述

### 4.3 新增通知类型

当前 `NotificationType` 缺少一个类型：

```typescript
// 需新增
| 'DOCS_SUBMITTED'      // 客户已提交资料（通知资料员）
```

---

## 5. 现状差距分析（含代码审查结果）

### 5.1 客户端页面差距

| 页面 | 当前 | M3 需求 |
|---|---|---|
| /customer/orders | ✅列表（卡片不可点击） | 卡片可点击 + 待办提示 |
| /customer/orders/[id] | ⬜不存在 | ⭐核心交付 |
| /customer/notifications | ⬜不存在 | 通知中心 |
| /customer/profile | ⬜不存在 | 个人中心 |
| Tab 导航 | 1个可用 + 2个禁用占位 | 3个全可用 |

### 5.2 API 通知缺口（逐路由审查）

| 路由 | 审查结果 | M3 动作 |
|---|---|---|
| orders POST | N1+N2 ✅ | 无需改 |
| orders/[id]/status POST | N3 ✅（通过 events.ts） | 无需改 |
| orders/[id]/claim POST | N3 ✅（通过 transitionOrder→events） | 无需改 |
| documents/[id] PATCH | N4 ✅（仅 REJECTED/SUPPLEMENT） | 无需改 |
| documents POST | ⬜ N8 缺失 | M3-18 修复 |
| materials POST | N5+N6 ✅ | 无需改 |
| orders/[id]/cancel POST | N7 ✅ | 无需改 |
| orders/[id]/submit | ⬜ 不存在 | M3-9 新建 |
| events.ts (ORDER_STATUS_CHANGED) | N3 ✅ | 无需改 |

### 5.3 权限缺口

| 角色 | 当前权限 | 缺失 | 修复 |
|---|---|---|---|
| CUSTOMER | documents: read, create | **delete** | rbac.ts 加 delete |
| CUSTOMER | orders: read | — | 无需 transition（"确认提交"不走状态机） |

### 5.4 Socket.io 客户端接入障碍

| 问题 | 分析 | 解决方案 |
|---|---|---|
| 认证方式不匹配 | 服务端读 `socket.handshake.auth.token`，但 access_token 是 HttpOnly Cookie，JS 无法读取 | 修改 socket.ts 支持从 Cookie 读取 token |

### 5.5 OSS 预签名直传障碍

| 问题 | 分析 | 解决方案 |
|---|---|---|
| CORS 限制 | 浏览器直传 OSS 需要 Bucket 配置 CORS | 运行时配置 OSS CORS（或运维手动配置） |

### 5.6 现有 API 复用确认

| 端点 | CUSTOMER 可用 | M3 用途 | 验证 |
|---|:---:|---|---|
| GET /api/orders | ✅ | 订单列表 | scopeFilter: customerId=userId |
| GET /api/orders/[id] | ✅ | 详情（含资料/材料/日志） | scopeFilter: customerId=userId |
| GET /api/orders/[id]/documents | ✅ | A 类资料清单 | documents.read |
| GET /api/orders/[id]/materials | ✅ | B 类材料列表 | materials.read |
| GET /api/notifications | ✅ | 通知列表 | notifications.read |
| PATCH /api/notifications/[id] | ✅ | 标记已读 | notifications.update |
| POST /api/notifications/mark-all-read | ✅ | 全部已读 | notifications.update |
| POST /api/documents/upload | ✅ | 服务端上传（兼容） | documents.create |

---

## 6. 架构决策

### 决策 1：客户端页面结构
```
/customer/
├── orders/page.tsx              ← 修改：卡片可点击
├── orders/[id]/page.tsx         ← 新建：详情页 ⭐
├── notifications/page.tsx       ← 新建：通知中心
└── profile/page.tsx             ← 新建：个人中心
```

### 决策 2：仅新建 5 个辅助端点
核心业务 API 全部已存在，M3 只需：
- `POST /api/documents/presign` — 预签名 URL
- `POST /api/documents/confirm` — 写库 + 生成签名URL
- `POST /api/orders/[id]/submit` — 客户确认提交 + 通知资料员
- `DELETE /api/documents/files/[id]` — 文件级删除
- `POST /api/auth/change-password` — 修改密码

### 决策 3：预签名直传三步流程
```
客户端 → POST /api/documents/presign（获取 URL + ossKey）
       → PUT oss-cn-beijing.aliyuncs.com（直传 OSS，带进度）
       → POST /api/documents/confirm（写 DB，不通知资料员）
```

### 决策 4：客户"确认提交"机制
```
上传阶段：客户逐项上传（静默，不通知资料员）
提交阶段：客户点击"确认提交" → POST /api/orders/[id]/submit
  → DocumentRequirement 状态: UPLOADED → REVIEWING
  → 创建通知给资料员: DOCS_SUBMITTED
  → Socket 推送
```

**不走状态机**：Order 保持 COLLECTING_DOCS 不变。"确认提交"只是通知资料员来审核。

### 决策 5：两类资料展示分离
- A 类：「📤 我需要上传的资料」— 按需求项逐项展示状态 + 说明文字 + 上传
- B 类：「📥 签证材料（为您制作）」— 仅 PENDING_DELIVERY 及以后显示

### 决策 6：Socket.io Cookie 认证改造
当前：`socket.handshake.auth.token`（HttpOnly Cookie 无法从 JS 读取）
改造：服务端同时检查 Cookie `access_token` 作为 fallback
```typescript
// socket.ts auth middleware 改造
const authToken = socket.handshake.auth.token as string | undefined
const cookieToken = parseCookies(socket.handshake.headers.cookie).access_token
const token = authToken || cookieToken
```

### 决策 7：Tab 导航路由化
- 📋 订单 → `/customer/orders`
- 💬 消息 → `/customer/notifications`（含未读角标）
- 👤 我的 → `/customer/profile`

### 决策 8：客户删除文件权限
- 客户只能删除自己上传的文件（`uploadedBy === userId`）
- 需要新增 `documents:delete` 权限

### 决策 9：新增通知类型
- `DOCS_SUBMITTED` — 客户已提交资料（通知资料员）

### 决策 10：管理端不强制迁移预签名
- 客户端使用预签名直传
- 管理端保持现有服务端上传（文件通常较小，够用）

---

## 7. Phase A：基础框架补全

### M3-1：Tab 导航路由化

**修改** `src/app/customer/layout.tsx`

当前只有 1 个可用 Tab（📋订单），💬消息和👤我的是禁用占位按钮。

改造：
- 补全 TABS 数组为 3 项
- 集成 `useSocketClient` Hook
- 集成 `useNotificationStore` 获取 `unreadCount`
- 💬 Tab 右上角显示红色未读角标

```typescript
const TABS = [
  { href: '/customer/orders', label: '订单', icon: '📋' },
  { href: '/customer/notifications', label: '消息', icon: '💬' },
  { href: '/customer/profile', label: '我的', icon: '👤' },
]
```

验收：[ ] 3个Tab可点击路由切换 [ ] 当前Tab高亮 [ ] 未读角标显示

---

### M3-2：订单列表增强

**修改** `src/app/customer/orders/page.tsx`

改动：
1. 卡片包裹 `<Link href={/customer/orders/${order.id}}>` → 可点击
2. COLLECTING_DOCS 显示 "📤 有资料待上传"
3. PENDING_DELIVERY/DELIVERED 显示 "📥 签证材料已制作完成，请下载"
4. 多人订单显示申请人数量

验收：[ ] 卡片点击跳转详情 [ ] 待办提示文案正确

---

### M3-3：状态时间线组件

**新建** `src/components/orders/status-timeline.tsx`

6步进度条（待对接→已对接→资料收集→审核→制作→交付），终态全部点亮。每步从 orderLogs 提取完成时间。

```typescript
interface StatusTimelineProps {
  currentStatus: OrderStatus
  orderLogs: Array<{ action: string; toStatus: string | null; createdAt: string }>
}
```

验收：[ ] 进度条正确反映状态 [ ] 每步有时间 [ ] 终态全亮

---

### M3-4：客户端权限补全

**修改** `src/lib/rbac.ts`

```typescript
// CUSTOMER 当前：
{ resource: 'documents', actions: ['read', 'create'] }

// 改为：
{ resource: 'documents', actions: ['read', 'create', 'delete'] }
```

验收：[ ] CUSTOMER 可调用 DELETE /api/documents/files/[id]

---

## 8. Phase B：客户端资料交互

### M3-5：预签名直传 API

**新建** `src/app/api/documents/presign/route.ts`

```
POST /api/documents/presign
Body: { requirementId, fileName, fileType }
Auth: CUSTOMER (documents.create)

逻辑：
1. 验证 requirementId 存在 + companyId 匹配
2. 构建 ossKey: buildOssKey({ companyId, orderId, type:'documents', subId: requirementId, fileName })
3. generatePresignedPutUrl(ossKey, fileType, 3600)
4. 返回 { presignedUrl, ossKey }
```

验收：[ ] 返回有效预签名 URL [ ] 客户端可 PUT 直传

---

### M3-6：上传确认 API

**新建** `src/app/api/documents/confirm/route.ts`

```
POST /api/documents/confirm
Body: { requirementId, ossKey, fileName, fileSize, fileType, label? }
Auth: CUSTOMER (documents.create)

逻辑：
1. 验证 requirementId + ossKey 匹配
2. 生成签名下载 URL: getSignedUrl(ossKey)
3. 获取当前最大 sortOrder + 1
4. 创建 DocumentFile 记录
5. 更新 DocumentRequirement.status = UPLOADED（仅当当前为 PENDING/REJECTED/SUPPLEMENT）
6. 写操作日志
7. 不通知资料员（等"确认提交"）
```

验收：[ ] 文件记录写入 DB [ ] 需求状态更新 [ ] 操作日志正确

---

### M3-7：文件级删除 API

**新建** `src/app/api/documents/files/[id]/route.ts`

```
DELETE /api/documents/files/[id]
Auth: CUSTOMER (documents.delete) 或管理员

逻辑：
1. 查找 DocumentFile（校验 companyId）
2. 如果是 CUSTOMER，额外校验 uploadedBy === userId
3. 删除 OSS 文件（deleteFile）
4. 删除 DB 记录
5. 检查该 requirement 下是否还有文件 → 无则回退 status 为 PENDING
6. 写操作日志
```

验收：[ ] 文件可删除 [ ] OSS 同步删除 [ ] 无文件时状态回退

---

### M3-8：客户上传组件

**新建** `src/components/documents/customer-upload.tsx`

按 DocumentRequirement 逐项展示：
- 材料名称 + 详细说明文字（description，支持换行显示）
- 状态标识（⏳待上传 / 🔄已上传待提交 / ✅已合格 / ❌需修改 / 📝需补充）
- 驳回原因（REJECTED/SUPPLEMENT 时显示）
- 已上传文件列表（FilePreview 组件复用）
- 操作按钮：[📁上传] [📷拍照] [🗑删除]
- 多文件标记（同一需求项可多次上传）

上传流程：
```typescript
async function handleUpload(requirementId: string, file: File) {
  // 1. 预签名
  const { presignedUrl, ossKey } = await apiFetch('/api/documents/presign', {
    method: 'POST', body: JSON.stringify({ requirementId, fileName: file.name, fileType: file.type }),
  }).then(r => r.json())

  // 2. 直传 OSS（XHR 带进度）
  await uploadWithProgress(presignedUrl, file, onProgress)

  // 3. 确认写库
  await apiFetch('/api/documents/confirm', {
    method: 'POST', body: JSON.stringify({ requirementId, ossKey, fileName: file.name, fileSize: file.size, fileType: file.type }),
  })

  // 4. 刷新
  onRefresh()
}
```

验收：[ ] 每需求项显示名称+说明+状态 [ ] 上传成功 [ ] 拍照可用 [ ] 删除可用

---

### M3-9：客户确认提交 API

**新建** `src/app/api/orders/[id]/submit/route.ts`

```
POST /api/orders/[id]/submit
Auth: CUSTOMER

逻辑：
1. 验证订单存在 + customerId === userId
2. 验证订单状态为 COLLECTING_DOCS
3. 验证至少一个 DocumentRequirement 有文件
4. 事务：
   a. 将所有 UPLOADED 状态的 DocumentRequirement → REVIEWING
   b. 写操作日志："客户确认提交资料"
   c. 创建通知给 collectorId:
      type: DOCS_SUBMITTED
      title: "订单 {orderNo} 客户已提交资料"
      content: "{customerName} 已上传资料并确认提交，请及时审核"
5. Socket 推送给资料员
```

验收：[ ] 需求状态变 REVIEWING [ ] 资料员收到通知 [ ] Socket 推送

---

### M3-10：材料说明面板

**新建** `src/components/orders/material-checklist.tsx`

展示 B 类材料列表（签证材料，为客户制作）：
- 仅在 PENDING_DELIVERY / DELIVERED / APPROVED / REJECTED / PARTIAL 状态显示
- 每项：文件名 + 大小 + 类型图标 + [👁预览] [⬇下载]
- 复用 FilePreview 组件

验收：[ ] 正确状态显示 [ ] 可预览下载

---

## 9. Phase C：订单详情页

### M3-11：客户订单详情页 ⭐核心

**新建** `src/app/customer/orders/[id]/page.tsx`

页面结构（从上到下）：
```
┌──────────────────────────────────┐
│ ← 返回   HX2026...   状态徽章     │
├──────────────────────────────────┤
│ 🌍 法国 · 旅游签证                │
│ StatusTimeline（6步进度条）        │
├──────────────────────────────────┤
│ 📤 我需要上传的资料               │
│ CustomerUpload 组件               │
│ （逐项：名称+说明+状态+上传）      │
│                                  │
│ [✅ 确认提交] (COLLECTING_DOCS    │
│  且有文件时可点击)                │
├──────────────────────────────────┤
│ 📥 签证材料（为您制作）           │
│ ← 仅 PENDING_DELIVERY+ 显示      │
│ MaterialChecklist 组件            │
├──────────────────────────────────┤
│ 📋 订单信息                       │
│ 联系人/手机/国家/类型/金额/时间    │
├──────────────────────────────────┤
│ 📜 操作记录                       │
│ OrderLog 时间线                   │
└──────────────────────────────────┘
```

数据获取：`GET /api/orders/[id]`（返回 OrderDetail，含 documentRequirements+files, visaMaterials, orderLogs）

确认提交按钮：
```typescript
const canSubmit = order.status === 'COLLECTING_DOCS' &&
  order.documentRequirements.some(req => req.files.length > 0)

async function handleSubmit() {
  await apiFetch(`/api/orders/${order.id}/submit`, { method: 'POST' })
  toast('success', '资料已提交，等待资料员审核')
  fetchOrder() // 刷新
}
```

多人订单：复用 M5 的按申请人分组展示逻辑（document-panel.tsx 中已有）。

验收：[ ] 完整展示 [ ] A类可上传 [ ] B类可下载 [ ] 确认提交通知资料员 [ ] 移动端布局

---

## 10. Phase D：通知与实时通信

### M3-12：Socket.io 客户端 Hook

**新建** `src/hooks/use-socket-client.ts`

```typescript
'use client'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useNotificationStore } from '@/stores/notification-store'

export function useSocketClient() {
  const socketRef = useRef<Socket | null>(null)
  const { fetchUnreadCount } = useNotificationStore()

  useEffect(() => {
    // 不传 auth.token — 服务端从 Cookie 读取
    const socket = io({ transports: ['websocket', 'polling'], reconnection: true })

    socket.on('notification', () => { fetchUnreadCount() })
    socket.on('order:status', () => { /* 触发页面刷新 */ })
    socketRef.current = socket
    return () => { socket.disconnect() }
  }, [fetchUnreadCount])

  return socketRef.current
}
```

---

### M3-13：Socket.io 服务端 Cookie 认证改造

**修改** `src/lib/socket.ts`

```typescript
// 当前：只读 auth.token
// 改造：同时检查 Cookie

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {}
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
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

---

### M3-14：通知中心页面

**新建** `src/app/customer/notifications/page.tsx`

功能：
- 通知列表（分页加载）
- 未读标记（蓝点 + 加粗）
- 点击 → 标记已读 + 跳转到 `/customer/orders/{orderId}`
- 「全部已读」按钮
- 下拉刷新

数据：`GET /api/notifications?page=1&pageSize=50`

---

### M3-15：Tab 通知角标

**修改** `src/app/customer/layout.tsx`

在 layout 中读取 `unreadCount`，"消息"Tab 右上角显示红色数字（>0 时）。

---

## 11. Phase E：个人中心

### M3-16：个人中心页面

**新建** `src/app/customer/profile/page.tsx`

展示：头像(占位)、姓名、手机号、邮箱、注册时间
操作：修改密码按钮（弹窗）、退出登录按钮

---

### M3-17：修改密码 API

**新建** `src/app/api/auth/change-password/route.ts`

```
POST /api/auth/change-password
Body: { oldPassword, newPassword }
Auth: 已登录用户

逻辑：
1. 验证旧密码（bcrypt.compare）
2. 新密码校验：≥8位，含大小写+数字
3. 更新 passwordHash（bcrypt.hash）
4. 返回成功
```

---

## 12. Phase F：API 补全与通知闭环

### M3-18：资料员发送清单通知客户

**修改** `src/app/api/orders/[id]/documents/route.ts` POST 方法

在批量创建 DocumentRequirement 之后，写操作日志之前，增加：

```typescript
// 通知客户：资料清单已发送
if (order.customerId) {
  await prisma.notification.create({
    data: {
      companyId: user.companyId,
      userId: order.customerId,
      orderId: id,
      type: 'DOC_REVIEWED',
      title: `订单 ${order.orderNo} 资料清单已发送`,
      content: `资料员已为您准备好资料清单，请查看并上传所需材料`,
    },
  })
  emitToUser(order.customerId, 'notification', {
    type: 'DOC_REVIEWED',
    title: `订单 ${order.orderNo} 资料清单已发送`,
    orderId: id,
    orderNo: order.orderNo,
  })
}
```

同时需要先查询 order 的 customerId（当前 POST 方法没有查询）。

---

### M3-19：新增通知类型

**修改** `src/types/order.ts`

```typescript
export type NotificationType =
  | 'ORDER_NEW'
  | 'ORDER_CREATED'
  | 'STATUS_CHANGE'
  | 'DOC_REVIEWED'
  | 'DOCS_SUBMITTED'       // ← 新增：客户已提交资料
  | 'MATERIAL_UPLOADED'
  | 'MATERIAL_FEEDBACK'
  | 'APPOINTMENT_REMIND'
  | 'SYSTEM'
```

---

### M3-20：通知全链路验证清单

| 通知节点 | 触发者 | 接收者 | 代码位置 | 状态 |
|---|---|---|---|:---:|
| 订单创建 | 客服 | 资料员 | orders/route.ts | ✅ |
| 订单创建 | 客服 | 客户 | orders/route.ts | ✅ |
| 状态变更（任何） | 任意角色 | 相关人员 | events.ts | ✅ |
| 资料员发送清单 | 资料员 | 客户 | documents/route.ts | ⬜M3-18 |
| 客户确认提交 | 客户 | 资料员 | submit/route.ts | ⬜M3-9 |
| 资料审核驳回 | 资料员 | 客户 | documents/[id] | ✅ |
| 材料上传 | 操作员 | 资料员 | materials POST | ✅ |
| 材料上传（首版） | 操作员 | 客户 | materials POST | ✅ |
| 取消订单 | 管理员 | 相关人员 | cancel POST | ✅ |

---

## 13. Phase G：管理端增强

### M3-21：管理端文件删除

复用 M3-7 的 `DELETE /api/documents/files/[id]`。

在 DocumentPanel 中为每个文件增加删除按钮（管理员权限，不限 uploadedBy）。

---

### M3-22：批量上传并发优化

**修改** `src/components/documents/document-panel.tsx`

当前逐个串行 → 最多 3 个并发 + 总进度条。

---

## 14. 文件变更全量清单

### 新建文件（13 个）

| # | 文件 | 说明 | 行数 |
|---|---|---|:---:|
| 1 | `src/app/customer/orders/[id]/page.tsx` | 客户订单详情页 ⭐ | ~350 |
| 2 | `src/app/customer/notifications/page.tsx` | 通知中心 | ~150 |
| 3 | `src/app/customer/profile/page.tsx` | 个人中心 | ~120 |
| 4 | `src/app/api/documents/presign/route.ts` | 预签名直传 | ~60 |
| 5 | `src/app/api/documents/confirm/route.ts` | 上传确认写库 | ~90 |
| 6 | `src/app/api/documents/files/[id]/route.ts` | 文件级删除 | ~60 |
| 7 | `src/app/api/orders/[id]/submit/route.ts` | 客户确认提交+通知 | ~80 |
| 8 | `src/app/api/auth/change-password/route.ts` | 修改密码 | ~50 |
| 9 | `src/components/orders/status-timeline.tsx` | 状态时间线 | ~80 |
| 10 | `src/components/documents/customer-upload.tsx` | 客户上传组件 ⭐ | ~250 |
| 11 | `src/components/orders/material-checklist.tsx` | B类材料列表 | ~60 |
| 12 | `src/hooks/use-socket-client.ts` | Socket.io客户端 | ~50 |
| 13 | `src/app/customer/orders/[id]/loading.tsx` | 加载骨架屏 | ~30 |

### 修改文件（7 个）

| # | 文件 | 变更 | 风险 |
|---|---|---|:---:|
| 1 | `src/app/customer/layout.tsx` | 补全Tab+Socket+角标 | 🟡 |
| 2 | `src/app/customer/orders/page.tsx` | 卡片点击+待办提示 | 🟢 |
| 3 | `src/app/api/orders/[id]/documents/route.ts` | POST加通知客户 | 🟢 |
| 4 | `src/lib/rbac.ts` | CUSTOMER加delete | 🟢 |
| 5 | `src/lib/socket.ts` | Cookie认证改造 | 🟡 |
| 6 | `src/types/order.ts` | 加DOCS_SUBMITTED类型 | 🟢 |
| 7 | `src/components/documents/document-panel.tsx` | 并发上传+文件删除 | 🟢 |

### 不改的文件

| 文件 | 原因 |
|---|---|
| prisma/schema.prisma | 无新表/字段 |
| src/middleware.ts | /customer/* 已有鉴权 |
| src/lib/transition.ts | 状态机不变 |
| src/lib/events.ts | 通知机制已完善 |
| 所有 API 路由（除上述4个新建+1个修改） | 已满足需求 |

---

## 15. 执行计划

```
批次 1（3h）— 基础框架
  ├── M3-1   Tab 导航路由化（layout.tsx）
  ├── M3-2   订单列表增强（orders/page.tsx）
  ├── M3-3   状态时间线组件（status-timeline.tsx）
  └── M3-4   权限补全（rbac.ts: CUSTOMER+delete）
  验收: Tab切换 | 卡片跳转 | 时间线 | 权限

批次 2（4h）— 资料上传核心 ⭐
  ├── M3-5   预签名直传 API（presign/route.ts）
  ├── M3-6   上传确认 API（confirm/route.ts）
  ├── M3-7   文件删除 API（files/[id]/route.ts）
  ├── M3-8   客户上传组件（customer-upload.tsx）
  └── M3-19  新增通知类型 DOCS_SUBMITTED（types/order.ts）
  验收: 预签名直传全流程 | 文件可删除 | 组件完整

批次 3（4h）— 详情页 + 确认提交 ⭐
  ├── M3-9   确认提交 API（submit/route.ts）
  ├── M3-10  材料说明面板（material-checklist.tsx）
  ├── M3-11  客户订单详情页（orders/[id]/page.tsx）
  └── 集成 CustomerUpload + MaterialChecklist + StatusTimeline
  验收: 详情页完整 | A类上传 | B类下载 | 确认提交通知

批次 4（3h）— 通知 + Socket
  ├── M3-12  Socket 客户端 Hook（use-socket-client.ts）
  ├── M3-13  Socket 服务端 Cookie 认证改造（socket.ts）
  ├── M3-14  通知中心页面（notifications/page.tsx）
  └── M3-15  Tab 通知角标（layout.tsx）
  验收: Socket连接 | 通知列表 | 角标实时更新

批次 5（2h）— 个人中心
  ├── M3-16  个人中心页面（profile/page.tsx）
  └── M3-17  修改密码 API（change-password/route.ts）
  验收: 信息展示 | 密码修改

批次 6（2h）— 通知闭环
  ├── M3-18  资料员发送清单通知客户（documents POST 修改）
  └── M3-20  全链路通知验证
  验收: 全部9个通知节点正确触发

批次 7（2h）— 管理端增强
  ├── M3-21  文件删除集成到 DocumentPanel
  └── M3-22  批量上传并发优化
  验收: 管理端删除 | 并发上传

批次 8（2h）— 全量验收
  ├── tsc 0错误 + build 0警告 + 74+测试通过
  ├── 端到端流程走通
  ├── 权限验证（CUSTOMER 仅访问自己订单）
  ├── 移动端适配
  ├── as any / console.log / TODO 检查
  └── 文档更新
  验收: 全部检查项通过
```

**总工作量：~22h（3 天）**

| 批次 | 工时 | 依赖 | 优先级 |
|---|:---:|---|:---:|
| 1 基础框架 | 3h | 无 | P0 |
| 2 资料上传 | 4h | 批次1 | P0 |
| 3 详情页+提交 | 4h | 批次1+2 | P0 |
| 4 通知+Socket | 3h | 批次1 | P0 |
| 5 个人中心 | 2h | 无 | P1 |
| 6 通知闭环 | 2h | 批次3 | P1 |
| 7 管理端增强 | 2h | 批次2 | P1 |
| 8 全量验收 | 2h | 全部 | P0 |
| **合计** | **22h** | | |

依赖图：
```
批次1 ──┬──► 批次2 ──► 批次3 ──► 批次6 ──► 批次8
        ├──► 批次4 ─────────────────────────┤
        └──► 批次5 ─────────────────────────┤
                                             │
             批次7 ──────────────────────────┘
```

---

## 16. 验收标准

### 全局验收

| # | 检查项 | 标准 |
|---|---|---|
| 1 | `npx tsc --noEmit` | 0 错误 |
| 2 | `npm run build` | 0 警告 |
| 3 | `npm run test` | 74+ 通过 |
| 4 | `as any` / `console.log` / `TODO` | 0 处 |
| 5 | `'use client'` 首行 | 全部正确 |
| 6 | 内部导航 | 全部 `<Link>`，无 `<a>` |
| 7 | Prisma 可选字段 | 全部 `?? null` |

### 功能验收

| 功能 | 验收标准 |
|---|---|
| Tab 导航 | 3个Tab点击切换路由，当前高亮，浏览器前进后退正常 |
| 订单列表 | 卡片点击进入详情，待办提示正确 |
| 状态时间线 | 6步进度条反映当前状态，每步有时间 |
| A 类资料上传 | 预签名直传全流程，支持多文件/拍照/删除 |
| B 类材料展示 | 正确状态显示，可预览/下载 |
| 确认提交 | 需求状态变REVIEWING，资料员收到通知 |
| 通知中心 | 列表/未读/标记已读/全部已读/跳转订单 |
| Socket | 连接成功，通知推送触发角标更新 |
| 个人中心 | 信息展示，密码修改成功 |
| 通知闭环 | 全部9个通知节点正确触发 |
| 权限 | CUSTOMER仅能访问自己订单/文件 |
| 移动端 | iOS Safari + Android Chrome 布局正常 |

---

## 17. 风险矩阵

| # | 风险 | 级别 | 解决方案 | 状态 |
|---|---|:---:|---|:---:|
| 1 | OSS CORS 限制 | 🟡 中 | Bucket 配置 CORS 允许当前域名 | ⬜ |
| 2 | Socket.io Cookie 认证 | 🟡 中 | socket.ts 改造读 Cookie fallback | ⬜M3-13 |
| 3 | 预签名 URL 过期 | 🟢 低 | 有效期1h，超时提示重试 | ⬜ |
| 4 | 大文件上传体验 | 🟢 低 | 前端预校验50MB + 进度条 | ⬜ |
| 5 | 移动端兼容 | 🟢 低 | 标准 Web API | ⬜ |
| 6 | 客户误删文件 | 🟢 低 | 删除前确认弹窗 + 仅删自己上传的 | ⬜ |
| 7 | 多人订单展示 | 🟢 低 | 复用 M5 DocumentPanel 分组逻辑 | ⬜ |

---

## 18. 端到端测试场景

### 场景 1：完整签证办理流程（单人）

```
1. 客服创建订单（国家=法国，类型=旅游）
   ✅ 客户账号自动创建 → 客户收到 ORDER_CREATED 通知

2. 资料员在公共池接单
   ✅ 状态 → CONNECTED → 客户收到 STATUS_CHANGE 通知

3. 资料员选择"申根旅游"模板 → 添加13项需求 → 点击"发送客户"
   ✅ 状态 → COLLECTING_DOCS
   ✅ 客户收到 DOC_REVIEWED "资料清单已发送"通知  ← M3-18修复

4. 客户登录 → 看到订单卡片"📤有资料待上传"
   ✅ 点击进入详情 → 看到13项需求 + 详细说明文字

5. 客户上传护照首页（拍照/文件）
   ✅ 预签名直传 OSS → confirm 写库 → 该需求状态 UPLOADED
   ✅ 资料员暂未收到通知（静默上传）

6. 客户再上传身份证、银行流水
   ✅ 同上

7. 客户点击"确认提交"
   ✅ 需求状态 → REVIEWING
   ✅ 资料员收到 DOCS_SUBMITTED "客户已提交资料"通知  ← M3-9新建

8. 资料员审核
   护照首页 → APPROVED（不通知客户）
   银行流水 → SUPPLEMENT "请提供近6个月完整流水"
   ✅ 客户收到 DOC_REVIEWED 通知

9. 客户补充上传银行流水 → 确认提交
   ✅ 资料员再次收到通知

10. 资料员全部通过 → 提交审核
    ✅ 状态 → PENDING_REVIEW → 操作员收到通知

11. 操作员接单 → 复审 → 开始制作
    ✅ 状态 → MAKING_MATERIALS

12. 操作员上传保险/行程单/酒店
    ✅ 状态 → PENDING_DELIVERY
    ✅ 资料员+客户收到通知

13. 资料员确认交付
    ✅ 状态 → DELIVERED → 客户收到通知

14. 客户查看详情 → 看到"📥签证材料"区块
    ✅ 下载保险/行程单/酒店预订单

15. 客户反馈出签结果（如需）
    ✅ 状态 → APPROVED/REJECTED
```

### 场景 2：多人订单

```
1. 客服创建订单（夫妻同行，2申请人）
2. 资料员发送清单 → 每申请人独立需求组
3. 客户按人分组上传 → 每组独立进度
4. 全部合格 → 确认提交 → 流程继续
```

---

*文档结束 - M3 全知手册 V3.0（终版）*
