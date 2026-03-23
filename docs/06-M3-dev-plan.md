# 沐海旅行 ERP - M3 全知开发手册（V4.0 终版）

> **文档版本**: V5.0
> **更新日期**: 2026-03-23 18:20
> **用途**: M3 阶段唯一开发指南。即使丢失所有上下文，拿到本文件 + Git 仓库即可完整恢复开发。
> **前置条件**: M1 ✅ + M2 ✅ + M5 ✅ 全部完成（102 源文件 / 11518 行 / 30 API 路由 / 15 页面 / 23 组件 / 74 测试用例）
> **核心交付**: 客户端门户完整可用 + 两类资料交互闭环 + 实时通信接入 + 全链路通知闭环
> **分析基础**: 三轮深度分析（逐文件审查全部 100 个源文件 + 30 个 API 路由 + 工作流文档 + 客户材料清单 + 实际工作流比对）

---

## 目录

1. [M3 总览](#1-m3-总览)
2. [两类资料流向深度分析](#2-两类资料流向深度分析)
3. [工作流逐阶段核对](#3-工作流逐阶段核对)
4. [全链路通知矩阵](#4-全链路通知矩阵)
5. [现状差距分析](#5-现状差距分析)
6. [架构决策（10 项）](#6-架构决策)
7. [Phase A：基础框架补全（M3-1 ~ M3-4）](#7-phase-a基础框架补全)
8. [Phase B：客户端资料交互（M3-5 ~ M3-10）](#8-phase-b客户端资料交互)
9. [Phase C：订单详情页（M3-11）](#9-phase-c订单详情页)
10. [Phase D：通知与实时通信（M3-12 ~ M3-15）](#10-phase-d通知与实时通信)
11. [Phase E：个人中心（M3-16 ~ M3-17）](#11-phase-e个人中心)
12. [Phase F：API 补全与通知闭环（M3-18 ~ M3-20）](#12-phase-fapi-补全与通知闭环)
13. [Phase G：管理端增强（M3-21 ~ M3-22）](#13-phase-g管理端增强)
14. [文件变更全量清单](#14-文件变更全量清单)
15. [执行计划（8 批次 / 25h）](#15-执行计划)
16. [验收标准](#16-验收标准)
17. [风险矩阵](#17-风险矩阵)
18. [开发 Checklist](#18-开发-checklist)

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
| M3 文件与客户端 | 🔄 12.5%（批次1/8完成） |

### 1.3 关键文件位置速查

```
erp-project/                                    ← 项目根目录
├── prisma/schema.prisma                        ← 数据库 Schema（含 DOCS_SUBMITTED 待加）
├── server.ts                                   ← Custom Server（HTTP + Socket.io）
├── src/
│   ├── app/
│   │   ├── customer/                           ← M3 主战场
│   │   │   ├── layout.tsx                      ← ✅已改：3个Tab + 未读角标轮询
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx                    ← ✅已改：Link可点击 + 待办提示 + 多人标记
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx                ← 新建：客户订单详情页 ⭐核心
│   │   │   │       └── loading.tsx             ← ✅已建：加载骨架屏
│   │   │   ├── notifications/page.tsx          ← 新建：通知中心
│   │   │   └── profile/page.tsx                ← 新建：个人中心
│   │   ├── api/
│   │   │   ├── documents/
│   │   │   │   ├── presign/route.ts            ← 新建：预签名直传 URL
│   │   │   │   ├── confirm/route.ts            ← 新建：上传确认写库
│   │   │   │   ├── files/[id]/route.ts         ← 新建：文件级删除
│   │   │   │   ├── upload/route.ts             ← 不改（管理端兼容保留）
│   │   │   │   └── [id]/route.ts               ← 不改（审核逻辑已有）
│   │   │   ├── orders/[id]/
│   │   │   │   ├── documents/route.ts          ← 修改：POST 增加通知客户
│   │   │   │   └── submit/route.ts             ← 新建：客户确认提交 + 通知资料员
│   │   │   └── auth/
│   │   │       └── change-password/route.ts    ← 新建：修改密码
│   ├── components/
│   │   ├── orders/
│   │   │   ├── status-timeline.tsx             ← ✅已建：6步进度条
│   │   │   └── material-checklist.tsx          ← 新建：B类材料下载面板
│   │   └── documents/
│   │       └── customer-upload.tsx             ← 新建：客户上传组件 ⭐核心
│   ├── hooks/
│   │   └── use-socket-client.ts                ← 新建：Socket.io 客户端
│   ├── lib/
│   │   ├── rbac.ts                             ← ✅已改：CUSTOMER 加 delete + transition
│   │   └── socket.ts                           ← 修改：支持 Cookie 认证
│   └── types/
│       └── order.ts                            ← 修改：加 DOCS_SUBMITTED 类型
```

---

## 2. 两类资料流向深度分析

### 2.1 核心概念：A 类 vs B 类

| 维度 | A 类资料（客户上传） | B 类材料（操作员制作） |
|---|---|---|
| **数据模型** | `DocumentRequirement` → `DocumentFile` | `VisaMaterial` |
| **创建者** | 资料员（选择模板/手动添加） | 操作员 |
| **上传者** | 客户（预签名直传） | 操作员（服务端上传） |
| **审核者** | 资料员 | 资料员 |
| **消费者** | 资料员/操作员（审核用） | 客户（下载用） |
| **状态管理** | DocReqStatus (6 种) | 无独立状态，随订单状态 |
| **典型材料** | 护照、身份证、户口本、在职证明、银行流水 | 保险单、行程单、机票、酒店预订单 |

### 2.2 A 类资料完整数据流

```
阶段1: 资料员创建需求清单
  资料员 → POST /api/orders/[id]/documents
    → 创建 N 个 DocumentRequirement (status=PENDING)
    → 通知客户（M3-18 新增）
    → 状态 CONNECTED → COLLECTING_DOCS（首次发送时）

阶段2: 客户逐项上传
  客户 → POST /api/documents/presign（获取预签名 URL）
       → PUT oss-cn-beijing.aliyuncs.com（直传 OSS）
       → POST /api/documents/confirm
         → 创建 DocumentFile
         → 更新 requirement.status = UPLOADED（仅 PENDING/REJECTED/SUPPLEMENT 时）
         → 不通知资料员（设计决策：等确认提交）

阶段3: 客户确认提交
  客户 → POST /api/orders/[id]/submit
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

### 2.3 B 类材料完整数据流

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

### 2.4 管理端 DocumentPanel vs 客户端 CustomerUpload 对比

| 能力 | DocumentPanel（管理端） | CustomerUpload（客户端） |
|---|---|---|
| 添加需求项 | ✅ 资料员操作 | ❌ 客户只看不加 |
| 选择模板 | ✅ | ❌ |
| 审核（合格/不合格） | ✅ | ❌ |
| 上传文件 | ✅ 服务端上传 | ✅ 预签名直传 |
| 拍照上传 | ✅ | ✅ |
| 查看说明文字 | ✅ | ✅（重点展示） |
| 删除文件 | ⬜M3-21 新增 | ✅M3-7 仅删自己上传 |
| "确认提交"按钮 | ❌ | ✅M3-9 |
| 多文件上传 | ✅ | ✅ |
| 按申请人分组 | ✅M5 已实现 | ✅复用逻辑 |

### 2.5 客户材料清单结构化分析

| # | 材料名称 | 预选 | 多文件 | 说明文字要点 |
|---|---|:---:|:---:|---|
| 1 | 签证个人信息表 | ✅ | — | 如实填写，信息与护照一致 |
| 2 | 护照首页 | ✅ | — | 有效期≥6月，4页空白，彩色扫描 |
| 3 | 当前有效护照整本全部页 | — | ✅ | 个人信息页+所有使用页，1:1彩色 |
| 4 | 身份证 | ✅ | — | 正反面，1:1彩色 |
| 5 | 户口本 | ✅ | ✅ | 家庭整本/集体户首页+本人页 |
| 6 | 婚姻状况 | — | — | 条件性：已婚→结婚证/离婚→离婚证 |
| 7 | 工作证明 | — | ✅ | 在职/退休/未就业/自雇 |
| 8 | 营业执照/组织机构代码 | — | ✅ | A4复印加盖公章 |
| 9 | 资金证明（银行流水） | — | ✅ | 近半年，余额≥5万，20天内打印 |
| 10 | 旧护照信息页 | — | ✅ | 可选 |
| 11 | 辅助资产 | — | ✅ | 可选：房产/车产/理财 |
| 12 | 邀请人资料 | — | ✅ | 条件性：探亲/访友/商务 |
| 13 | 同行人资料 | — | ✅ | 可选 |
| 14 | 其余补充资料 | — | ✅ | 资料员手动添加 |

**说明文字性质**：纯展示性文字，不做系统自动条件识别。由资料员在创建需求项时填入 description 字段，前端原样展示。

---

## 3. 工作流逐阶段核对

> 基于实际工作流文档（5 阶段）逐句与代码核对的结果。

### 阶段一：客服接单录单

| 步骤 | 工作流描述 | 代码实现 | 状态 |
|---|---|---|:---:|
| 1 | 客服录入订单信息 | `POST /api/orders` | ✅ |
| 2 | 核对无误点击"提交" | — | ✅ |
| 3 | 订单出现在已接单界面 | 客服数据范围 createdBy=userId | ✅ |
| 4 | 推送到资料员待接单界面 | 公共池 PENDING_CONNECTION | ✅ |
| 5 | 自动为客户创建账号 | 创建订单时自动注册 Customer | ✅ |
| 6 | 订单推送到客户列表 | customerId 关联 | ✅ |
| 7 | 资料员通知："又有新订单啦" | ORDER_NEW 通知 | ✅ |
| 8 | 短信提醒（搁置） | SMS 预留 | ✅ |
| — | 状态：待对接 | PENDING_CONNECTION | ✅ |

### 阶段二：资料员接单及收集反馈

| 步骤 | 工作流描述 | 代码实现 | 状态 |
|---|---|---|:---:|
| 2.1 | 资料员点击"接单" | `POST /api/orders/[id]/claim` → CONNECTED | ✅ |
| 2.2 | 补充/修改客户信息 | `PATCH /api/orders/[id]` | ✅ |
| 2.2 | 打开资料收集面板 | DocumentPanel 组件 | ✅ |
| 2.2 | 选择/添加资料清单 | `POST /api/orders/[id]/documents` 批量创建 | ✅ |
| 2.2 | 点击"发送客户"（首次） | `POST /api/orders/[id]/status` CONNECTED→COLLECTING_DOCS | ✅ |
| 2.2 | 客户收到通知 | events.ts STATUS_CHANGE → 通知客户 | ✅ |
| 2.3 | 客户上传资料 | M3-8 CustomerUpload（⬜新建） | ⬜ |
| 2.3 | 客户点击"确认提交" | M3-9 submit API（⬜新建） | ⬜ |
| 2.3 | 资料员收到通知 | M3-9 DOCS_SUBMITTED（⬜新建） | ⬜ |
| 2.4 | 资料员审核（打勾/备注） | PATCH `/api/documents/[id]` APPROVED/REJECTED/SUPPLEMENT | ✅ |
| 2.4 | 驳回通知客户 | PATCH 内部 DOC_REVIEWED 通知 | ✅ |
| 2.4 | 添加新需求项 | POST documents → ⚠️ 不通知客户（M3-18 修复） | ⬜ |
| 2.4 | 点击"发送客户"（追加） | 状态不变，无通知（M3-18 通过 POST 通知覆盖） | ⬜ |
| 2.5 | 循环 2.3→2.4 直到齐全 | 自然循环 | ✅ |
| 2.5 | 点击"提交审核" | COLLECTING_DOCS→PENDING_REVIEW | ✅ |
| — | 操作员收到通知 | events.ts → 通知操作员 | ✅ |
| — | 状态：待审核 | PENDING_REVIEW | ✅ |

### 阶段三：操作员接单及审核反馈

| 步骤 | 工作流描述 | 代码实现 | 状态 |
|---|---|---|:---:|
| 3.1 | 操作员点击"接单" | `POST /api/orders/[id]/claim` → UNDER_REVIEW | ✅ |
| 3.2 | 操作员审核（打勾/备注） | PATCH documents | ✅ |
| 3.2 | 点击"反馈资料员"（打回） | UNDER_REVIEW→COLLECTING_DOCS | ✅ |
| 3.2 | 资料员收到通知 | events.ts STATUS_CHANGE | ✅ |
| 3.3 | 资料员补充资料 | DocumentPanel 上传 | ✅ |
| 3.3 | 若需客户补充→"发送客户" | POST documents → M3-18 通知客户 | ⬜ |
| 3.4 | 循环直到操作员确认 | — | ✅ |
| 3.5 | 点击"开始制作" | UNDER_REVIEW→MAKING_MATERIALS | ✅ |
| — | 客户+资料员收到通知 | events.ts | ✅ |
| — | 状态：材料制作中 | MAKING_MATERIALS | ✅ |

### 阶段四：材料制作与交付

| 步骤 | 工作流描述 | 代码实现 | 状态 |
|---|---|---|:---:|
| 4.1 | 操作员上传材料 | `POST /api/orders/[id]/materials` | ✅ |
| 4.1 | 点击"发送资料" | materials POST 自动流转 MAKING_MATERIALS→PENDING_DELIVERY | ✅ |
| 4.1 | 资料员收到通知 | materials POST 内建通知 + events.ts | ✅ |
| 4.2 | 资料员查看 | MaterialPanel | ✅ |
| 4.2 | 需修改→"反馈操作员" | PENDING_DELIVERY→MAKING_MATERIALS | ✅ |
| 4.2 | 操作员收到通知 | events.ts | ✅ |
| 4.4 | 资料员点击"材料交付" | PENDING_DELIVERY→DELIVERED | ✅ |
| 4.4 | 客户收到通知 | events.ts | ✅ |
| — | 状态：已交付 | DELIVERED | ✅ |

### 阶段五：客户送签及结果反馈

| 步骤 | 工作流描述 | 代码实现 | 状态 |
|---|---|---|:---:|
| 5.1 | 预约前一天自动短信提醒 | `POST /api/cron/appointment-remind`（站内通知） | ✅ |
| 5.2 | 客户反馈出签结果 | TRANSITION_RULES 中 CUSTOMER 有权限 | ✅ |
| 5.2 | 客户端 UI 反馈 | M3-11 详情页新增出签反馈按钮（⬜新建） | ⬜ |
| 5.2 | 操作员提交结果 | OPERATOR 权限 | ✅ |
| 5.2 | 客户收到通知 | events.ts | ✅ |
| — | 状态：出签/拒签 | APPROVED/REJECTED | ✅ |

### 💡 "确认提交"机制设计决策

工作流步骤 2.3 说"客户点击确认提交后，资料员收到通知"。

**关键决策**：确认提交**不改变订单状态**（仍在 COLLECTING_DOCS），仅通知资料员来审核。

**理由**：
- 订单状态 "资料收集中" 的含义是：资料收集工作进行中
- 客户提交资料是收集过程中的一个子步骤，不需要推进主状态
- 资料员可能需要多轮审核/补充，每次都回到 COLLECTING_DOCS

**实现**：
- 客户上传 → presign confirm → requirement 设为 UPLOADED（静默，不通知）
- 客户确认提交 → submit API → requirement UPLOADED→REVIEWING → 通知资料员
- 资料员审核 → PATCH → APPROVED/REJECTED → 通知客户
- 循环直到全部 APPROVED → 资料员点击"提交审核" → COLLECTING_DOCS→PENDING_REVIEW

---

## 4. 全链路通知矩阵

### 4.1 9 个通知节点

| # | 触发时机 | 接收者 | 类型 | 代码位置 | 状态 |
|---|---|---|---|---|:---:|
| N1 | 客服创建订单 | 资料员 | ORDER_NEW | orders POST | ✅ |
| N2 | 客服创建订单 | 客户 | ORDER_CREATED | orders POST | ✅ |
| N3 | 状态变更（任何） | 相关人员 | STATUS_CHANGE | events.ts | ✅ |
| N4 | 资料员发送清单/追加需求 | 客户 | DOC_REVIEWED | documents POST | ⬜M3-18 |
| N5 | 客户确认提交 | 资料员 | DOCS_SUBMITTED | submit POST | ⬜M3-9 |
| N6 | 资料审核驳回 | 客户 | DOC_REVIEWED | documents/[id] PATCH | ✅ |
| N7 | 材料上传 | 资料员 | MATERIAL_UPLOADED | materials POST | ✅ |
| N8 | 材料上传（首版） | 客户 | MATERIAL_UPLOADED | materials POST | ✅ |
| N9 | 取消订单 | 相关人员 | STATUS_CHANGE | cancel POST | ✅ |

### 4.2 缺口修复方案

**缺口 N4：资料员发送清单/追加需求后客户无通知**
- 文件：`src/app/api/orders/[id]/documents/route.ts` POST 方法
- 修复：在批量创建 DocumentRequirement 之后，查询 order.customerId，创建 DOC_REVIEWED 通知 + Socket 推送
- 覆盖场景：①首次发送清单 ②COLLECTING_DOCS 追加新需求项

**缺口 N5：客户确认提交后资料员无通知**
- 文件：新建 `src/app/api/orders/[id]/submit/route.ts`
- 修复：创建 DOCS_SUBMITTED 通知给 collectorId + Socket 推送

**新增类型**：`DOCS_SUBMITTED` — 客户已提交资料（通知资料员）

---

## 5. 现状差距分析

### 5.1 客户端页面差距

| 页面 | 当前 | M3 需求 | 缺口 |
|---|---|---|---|
| /customer/orders | ✅列表（卡片不可点击） | 卡片可点击 + 待办提示 | Link 包裹 |
| /customer/orders/[id] | ⬜不存在 | ⭐核心详情页 | 全新建 |
| /customer/notifications | ⬜不存在 | 通知中心 | 全新建 |
| /customer/profile | ⬜不存在 | 个人中心 + 订单入口 | 全新建 |
| Tab 导航 | 1个可用 + 2个禁用占位 | 3个全可用 + 角标 | layout 重写 |

### 5.2 权限缺口

| 角色 | 当前 | 缺失 | 修复 |
|---|---|---|---|
| CUSTOMER | documents: read, create | **delete** | rbac.ts 加 delete |

### 5.3 Socket.io 客户端接入障碍

| 问题 | 原因 | 解决 |
|---|---|---|
| 认证失败 | 服务端只读 `socket.handshake.auth.token`，HttpOnly Cookie JS 无法读取 | socket.ts 同时检查 Cookie `access_token` 作为 fallback |

### 5.4 现有 API 复用确认

| 端点 | CUSTOMER 可用 | M3 用途 | 验证 |
|---|:---:|---|---|
| GET /api/orders | ✅ | 订单列表 | scopeFilter: customerId=userId |
| GET /api/orders/[id] | ✅ | 详情（含资料/材料/日志） | scopeFilter: customerId=userId |
| GET /api/orders/[id]/documents | ✅ | A 类资料清单 | documents.read |
| GET /api/orders/[id]/materials | ✅ | B 类材料列表 | materials.read |
| GET /api/notifications | ✅ | 通知列表 | notifications.read |
| PATCH /api/notifications/[id] | ✅ | 标记已读 | notifications.update |
| POST /api/notifications/mark-all-read | ✅ | 全部已读 | notifications.update |
| POST /api/orders/[id]/status | ✅ | 出签结果反馈 | orders.transition |

---

## 6. 架构决策（10 项）

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
- `DELETE /api/documents/files/[id]` — 文件级删除
- `POST /api/orders/[id]/submit` — 客户确认提交 + 通知资料员
- `POST /api/auth/change-password` — 修改密码

### 决策 3：预签名直传三步流程
```
客户端 → POST /api/documents/presign（获取 URL + ossKey）
       → PUT oss-cn-beijing.aliyuncs.com（直传 OSS，带进度条）
       → POST /api/documents/confirm（写 DB，不通知资料员）
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
- 📋 订单 → `/customer/orders`
- 💬 消息 → `/customer/notifications`（含未读角标）
- 👤 我的 → `/customer/profile`（含"我的订单"入口）

### 决策 8：客户删除文件权限
- 客户只能删除自己上传的文件（`uploadedBy === userId`）
- 管理员不限
- 需要新增 `documents:delete` 权限

### 决策 9：新增通知类型
- `DOCS_SUBMITTED` — 客户已提交资料（通知资料员）
- 修改 `prisma/schema.prisma` 的 NotificationType enum
- 修改 `src/types/order.ts` 的 NotificationType type

### 决策 10：确认提交逻辑修正
**原计划问题**：submit API 检查 `requirement.status === 'UPLOADED'`。但 presign confirm 也会设 UPLOADED，可能导致逻辑混淆。

**修正**：submit API 不依赖中间状态，只检查"有没有文件"：
```typescript
// 将所有有文件的 requirement 设为 REVIEWING（不管之前是 PENDING/UPLOADED/REJECTED/SUPPLEMENT）
const requirementsWithFiles = await tx.documentRequirement.findMany({
  where: { orderId, files: { some: {} } },
})
await tx.documentRequirement.updateMany({
  where: { id: { in: requirementsWithFiles.map(r => r.id) } },
  data: { status: 'REVIEWING' },
})
```

M3-6 confirm API 保持不变（设 UPLOADED），但 submit 时以"有无文件"为准，更健壮。

---

## 7. Phase A：基础框架补全（M3-1 ~ M3-4）

### M3-1：Tab 导航路由化

**修改** `src/app/customer/layout.tsx`

当前只有 1 个 Tab（📋订单），💬和👤是禁用占位按钮。

改造内容：
- TABS 数组补全为 3 项：`/customer/orders`、`/customer/notifications`、`/customer/profile`
- 集成 `useSocketClient` Hook（M3-12）
- 集成 notificationStore 获取 `unreadCount`
- 💬 Tab 右上角显示红色未读角标（unreadCount > 0 时）
- 当前 Tab 高亮 + 底部指示条

```typescript
const TABS = [
  { href: '/customer/orders', label: '订单', icon: '📋' },
  { href: '/customer/notifications', label: '消息', icon: '💬' },
  { href: '/customer/profile', label: '我的', icon: '👤' },
]
```

验收：✅ 3个Tab可点击路由切换 ✅ 当前Tab高亮 ✅ 浏览器前进后退正常 ✅ 未读角标轮询30s

---

### M3-2：订单列表增强

**修改** `src/app/customer/orders/page.tsx`

改动：
1. 卡片包裹 `<Link href={/customer/orders/${order.id}}>` → 可点击进入详情
2. COLLECTING_DOCS 显示 "📤 有资料待上传" 待办提示
3. PENDING_DELIVERY / DELIVERED 显示 "📥 签证材料已制作完成，请下载"
4. 多人订单显示 "👥 N人同行"
5. 状态进度条保留现有实现

验收：✅ 卡片点击跳转详情 ✅ COLLECTING_DOCS/PENDING_DELIVERY/DELIVERED待办提示正确 ✅ 多人👥标记

---

### M3-3：状态时间线组件

**新建** `src/components/orders/status-timeline.tsx`

6 步进度条：待对接 → 已对接 → 资料收集 → 审核 → 制作 → 交付

```typescript
interface StatusTimelineProps {
  currentStatus: OrderStatus
  orderLogs: Array<{ action: string; toStatus: string | null; createdAt: string }>
}
```

实现要点：
- 每步从 orderLogs 提取完成时间（匹配 toStatus）
- 当前步骤高亮 + 脉冲动画
- 已完成步骤绿色打勾
- 终态（APPROVED/REJECTED/PARTIAL）全部点亮
- 移动端纵向排列，桌面端可选横向

验收：✅ 6步进度条正确反映状态 ✅ orderLogs提取完成时间 ✅ 当前步骤pulse动画 ✅ 终态全部点亮

---

### M3-4：客户端权限补全

**修改** `src/lib/rbac.ts`

```typescript
// CUSTOMER 当前：
{ resource: 'documents', actions: ['read', 'create'] }

// 改为：
{ resource: 'documents', actions: ['read', 'create', 'delete'] }
```

验收：✅ CUSTOMER 有 delete + transition 权限

---

## 8. Phase B：客户端资料交互（M3-5 ~ M3-10）

### M3-5：预签名直传 API

**新建** `src/app/api/documents/presign/route.ts`

```
POST /api/documents/presign
Auth: CUSTOMER (documents.create)

Body:
{
  "requirementId": "cuid_string",
  "fileName": "passport.jpg",
  "fileType": "image/jpeg"
}

响应:
{
  "success": true,
  "data": {
    "presignedUrl": "https://oss-cn-beijing.aliyuncs.com/...",
    "ossKey": "companies/xxx/orders/xxx/documents/xxx/1234567890_passport.jpg"
  }
}
```

逻辑：
1. 认证 + 权限检查
2. 验证 requirementId 存在 + companyId 匹配
3. 验证文件类型在白名单内
4. 构建 ossKey：`buildOssKey({ companyId, orderId, type:'documents', subId: requirementId, fileName })`
5. `generatePresignedPutUrl(ossKey, fileType, 3600)`
6. 返回 `{ presignedUrl, ossKey }`

文件类型白名单（与 upload/route.ts 一致）：
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

验收：[ ] 返回有效预签名 URL [ ] 客户端可 PUT 直传

---

### M3-6：上传确认 API

**新建** `src/app/api/documents/confirm/route.ts`

```
POST /api/documents/confirm
Auth: CUSTOMER (documents.create)

Body:
{
  "requirementId": "cuid_string",
  "ossKey": "companies/xxx/...",
  "fileName": "passport.jpg",
  "fileSize": 1048576,
  "fileType": "image/jpeg",
  "label": "首页"  // 可选
}

响应:
{
  "success": true,
  "data": { "id": "file_cuid", ... }
}
```

逻辑：
1. 认证 + 权限
2. 验证 requirementId 存在 + companyId 匹配
3. 验证 ossKey 格式正确（包含 companyId 和 orderId）
4. 生成签名下载 URL：`getSignedUrl(ossKey)`
5. 获取当前 requirement 最大 sortOrder + 1
6. 创建 DocumentFile 记录
7. 更新 requirement.status = UPLOADED（仅当当前为 PENDING / REJECTED / SUPPLEMENT 时）
8. 写操作日志
9. **不通知资料员**（等"确认提交"统一通知）

验收：[ ] 文件记录写入 DB [ ] 需求状态更新 [ ] 操作日志正确

---

### M3-7：文件级删除 API

**新建** `src/app/api/documents/files/[id]/route.ts`

```
DELETE /api/documents/files/[id]
Auth: CUSTOMER (documents.delete) 或管理员

响应:
{
  "success": true,
  "data": { "message": "已删除" }
}
```

逻辑：
1. 认证 + 权限
2. 查找 DocumentFile（校验 companyId）
3. 如果是 CUSTOMER，额外校验 `uploadedBy === userId`（只能删自己上传的）
4. 删除 OSS 文件：`deleteFile(ossKey)`
5. 删除 DB DocumentFile 记录
6. 检查该 requirement 下是否还有文件 → 无则回退 status 为 PENDING
7. 写操作日志

验收：[ ] 文件可删除 [ ] OSS 同步删除 [ ] 无文件时状态回退

---

### M3-8：客户上传组件 ⭐

**新建** `src/components/documents/customer-upload.tsx`

组件结构：
```typescript
interface CustomerUploadProps {
  orderId: string
  requirements: DocumentRequirement[]
  applicantCount: number
  applicants: Array<{ id: string; name: string }>
  onRefresh: () => void
}
```

逐项展示（每个 DocumentRequirement 一个区块）：
- 材料名称 + 必填标记 + 状态标识
- 说明文字（description，支持换行显示）
- 驳回原因（REJECTED/SUPPLEMENT 时显示，红色高亮）
- 已上传文件列表（复用 FilePreview 组件）
- 操作按钮：[📁上传] [📷拍照] [🗑删除]

上传流程（预签名三步）：
```typescript
async function handleUpload(requirementId: string, file: File) {
  // 1. 获取预签名 URL
  const presignRes = await apiFetch('/api/documents/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirementId, fileName: file.name, fileType: file.type }),
  })
  const { presignedUrl, ossKey } = await presignRes.json().then(r => r.data)

  // 2. 直传 OSS（XHR 带进度条）
  await uploadWithProgress(presignedUrl, file, (progress) => {
    setUploadProgress(progress)
  })

  // 3. 确认写库
  await apiFetch('/api/documents/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requirementId, ossKey, fileName: file.name,
      fileSize: file.size, fileType: file.type,
    }),
  })

  // 4. 刷新
  onRefresh()
}
```

删除流程：
```typescript
async function handleDelete(fileId: string) {
  if (!confirm('确定删除该文件？')) return
  await apiFetch(`/api/documents/files/${fileId}`, { method: 'DELETE' })
  onRefresh()
}
```

拍照支持：复用 CameraCapture 组件，捕获后走同样上传流程。

多人订单：复用 DocumentPanel 的分组逻辑（按申请人分组展示）。

验收：[ ] 每需求项显示名称+说明+状态 [ ] 上传成功 [ ] 拍照可用 [ ] 删除可用 [ ] 进度条 [ ] 多人分组

---

### M3-9：客户确认提交 API

**新建** `src/app/api/orders/[id]/submit/route.ts`

```
POST /api/orders/[id]/submit
Auth: CUSTOMER

Body: 无（或空对象）

响应:
{
  "success": true,
  "data": { "message": "资料已提交，等待审核" }
}
```

逻辑：
1. 认证：`getCurrentUser(request)`
2. 参数：`params.id` = orderId
3. 验证订单存在 + `customerId === userId`
4. 验证订单 status === `COLLECTING_DOCS`
5. 事务内：
   a. 查询有文件的 requirement：`findMany({ where: { orderId, files: { some: {} } } })`
   b. 验证至少一个 requirement 有文件
   c. 将所有有文件的 requirement → REVIEWING（**不依赖中间状态**）
   d. 写操作日志："客户确认提交资料"
   e. 查询 order.collectorId
   f. 如果有 collectorId，创建通知：
      ```typescript
      {
        companyId, userId: collectorId, orderId,
        type: 'DOCS_SUBMITTED',
        title: `订单 ${orderNo} 客户已提交资料`,
        content: `${customerName} 已上传资料并确认提交，请及时审核`,
      }
      ```
   g. Socket 推送给资料员：`emitToUser(collectorId, 'notification', { type: 'DOCS_SUBMITTED', ... })`

验收：[ ] 需求状态变 REVIEWING [ ] 资料员收到通知 [ ] Socket 推送 [ ] 无文件时报错

---

### M3-10：B 类材料说明面板

**新建** `src/components/orders/material-checklist.tsx`

```typescript
interface MaterialChecklistProps {
  materials: VisaMaterial[]
  orderStatus: OrderStatus
}
```

显示逻辑：
- `MAKING_MATERIALS`：显示"签证材料正在制作中，请耐心等待..."提示
- `PENDING_DELIVERY` / `DELIVERED` / `APPROVED` / `REJECTED` / `PARTIAL`：显示材料下载列表

每个材料项：
- 文件名 + 大小 + 类型图标
- [👁预览] 按钮（复用 FilePreview 内嵌预览）
- [⬇下载] 按钮（调用 `getDownloadUrl` 强制下载）
- 上传时间 + 版本号

**纯展示，无上传，无编辑，无删除**（客户不能操作操作员的材料）。

验收：[ ] 正确状态显示 [ ] MAKING_MATERIALS 显示制作中提示 [ ] 可预览下载 [ ] 移动端布局

---

## 9. Phase C：订单详情页（M3-11）

**新建** `src/app/customer/orders/[id]/page.tsx` + `loading.tsx`

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
│ [✅ 确认提交] ← COLLECTING_DOCS   │
│   且有文件时可点击                │
├──────────────────────────────────┤
│ 📥 签证材料（为您制作）           │
│ ← MAKING_MATERIALS: 制作中提示    │
│ ← PENDING_DELIVERY+: MaterialChecklist │
├──────────────────────────────────┤
│ 🎫 签证结果反馈                   │
│ ← 仅 DELIVERED 状态显示           │
│ [✅ 已出签]  [❌ 被拒签]          │
├──────────────────────────────────┤
│ 📋 订单信息                       │
│ 联系人/手机/国家/类型/金额/时间    │
├──────────────────────────────────┤
│ 📜 操作记录                       │
│ OrderLog 时间线                   │
└──────────────────────────────────┘
```

数据获取：
```typescript
const res = await apiFetch(`/api/orders/${orderId}`)
const order: OrderDetail = await res.json().then(r => r.data)
// 含 documentRequirements+files, visaMaterials, orderLogs, applicants
```

确认提交按钮逻辑：
```typescript
const canSubmit = order.status === 'COLLECTING_DOCS' &&
  order.documentRequirements.some(req => req.files.length > 0)

async function handleSubmit() {
  await apiFetch(`/api/orders/${order.id}/submit`, { method: 'POST' })
  toast('success', '资料已提交，等待资料员审核')
  fetchOrder() // 刷新
}
```

⭐ 出签结果反馈 UI：
```tsx
{order.status === 'DELIVERED' && (
  <GlassCard className="p-5">
    <h3>🎫 签证结果反馈</h3>
    <p className="text-xs text-[var(--color-text-secondary)] mb-3">
      请在收到签证结果后反馈给我们
    </p>
    <div className="flex gap-3">
      <button
        onClick={() => handleResult('APPROVED')}
        className="flex-1 py-2.5 rounded-xl bg-[var(--color-success)]/15 text-[var(--color-success)] font-medium"
      >
        ✅ 已出签
      </button>
      <button
        onClick={() => handleResult('REJECTED')}
        className="flex-1 py-2.5 rounded-xl bg-[var(--color-error)]/15 text-[var(--color-error)] font-medium"
      >
        ❌ 被拒签
      </button>
    </div>
  </GlassCard>
)}

async function handleResult(result: 'APPROVED' | 'REJECTED') {
  await apiFetch(`/api/orders/${order.id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toStatus: result }),
  })
  toast('success', result === 'APPROVED' ? '恭喜出签！' : '感谢反馈')
  fetchOrder()
}
```

多人订单：复用 M5 的按申请人分组展示逻辑。

验收：[ ] 完整展示 [ ] A类可上传 [ ] B类可下载 [ ] 确认提交通知资料员 [ ] 出签反馈可用 [ ] 移动端布局

---

## 10. Phase D：通知与实时通信（M3-12 ~ M3-15）

### M3-12：Socket 客户端 Hook

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
    // 不传 auth.token — 服务端从 Cookie 读取（M3-13 改造）
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('[Socket] connected')
    })

    socket.on('notification', () => {
      fetchUnreadCount()
    })

    socket.on('order:status', () => {
      // 可触发页面数据刷新
    })

    socket.on('disconnect', () => {
      console.log('[Socket] disconnected')
    })

    socketRef.current = socket
    return () => { socket.disconnect() }
  }, [fetchUnreadCount])

  return socketRef.current
}
```

---

### M3-13：Socket 服务端 Cookie 认证改造

**修改** `src/lib/socket.ts`

在现有 `io.use()` 中增加 Cookie fallback：

```typescript
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
  // 优先使用 auth.token（如果客户端显式传递）
  const authToken = socket.handshake.auth.token as string | undefined
  // fallback：从 Cookie 读取（HttpOnly Cookie 无法从 JS 读取，但浏览器会自动携带）
  const cookies = parseCookies(socket.handshake.headers.cookie)
  const cookieToken = cookies['access_token']
  const token = authToken || cookieToken

  if (!token) return next(new Error('Authentication required'))

  try {
    const payload = await verifyAccessToken(token)
    socket.data.user = payload
    next()
  } catch {
    next(new Error('Invalid token'))
  }
})
```

---

### M3-14：通知中心页面

**新建** `src/app/customer/notifications/page.tsx`

功能：
- 通知列表（分页加载，pageSize=50）
- 未读标记（蓝色圆点 + 文字加粗）
- 点击通知 → 调用 `PATCH /api/notifications/[id]` 标记已读 → 跳转到 `/customer/orders/{orderId}`
- 「全部已读」按钮 → `POST /api/notifications/mark-all-read`
- 下拉刷新

数据：`GET /api/notifications?page=1&pageSize=50`

---

### M3-15：Tab 通知角标

**修改** `src/app/customer/layout.tsx`

在 layout 中读取 `unreadCount`（从 notificationStore），"消息"Tab 右上角显示红色数字（> 0 时）。

```tsx
<span className="relative">
  <span className="text-lg">{tab.icon}</span>
  {tab.href === '/customer/notifications' && unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-error)] text-[10px] text-white flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</span>
```

---

## 11. Phase E：个人中心（M3-16 ~ M3-17）

### M3-16：个人中心页面

**新建** `src/app/customer/profile/page.tsx`

展示：
- 头像占位圆形（姓名首字母）
- 姓名、手机号、邮箱、注册时间
- 「📋 我的订单」入口链接 → `/customer/orders`
- 「修改密码」按钮 → 弹窗
- 「退出登录」按钮

---

### M3-17：修改密码 API

**新建** `src/app/api/auth/change-password/route.ts`

```
POST /api/auth/change-password
Auth: 已登录用户

Body:
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

逻辑：
1. 认证
2. 查询当前用户 passwordHash
3. 旧密码 bcrypt.compare 校验
4. 新密码校验：≥8位，含大小写+数字
5. 新密码 bcrypt.hash
6. 更新 passwordHash
7. 返回成功

---

## 12. Phase F：API 补全与通知闭环（M3-18 ~ M3-20）

### M3-18：资料员发送清单/追加需求通知客户

**修改** `src/app/api/orders/[id]/documents/route.ts` POST 方法

在批量创建 DocumentRequirement 之后，增加通知客户逻辑：

```typescript
// 通知客户：资料清单已发送 / 新增资料需求
if (order.customerId) {
  const isFirstTime = !order.collectorId // CONNECTED 状态首次发送
  await prisma.notification.create({
    data: {
      companyId: user.companyId,
      userId: order.customerId,
      orderId: id,
      type: 'DOC_REVIEWED',
      title: isFirstTime
        ? `订单 ${order.orderNo} 资料清单已发送`
        : `订单 ${order.orderNo} 新增资料需求`,
      content: isFirstTime
        ? '资料员已为您准备好资料清单，请查看并上传所需材料'
        : `资料员新增了 ${data.items.length} 项资料需求，请查看`,
    },
  })
  emitToUser(order.customerId, 'notification', {
    type: 'DOC_REVIEWED',
    title: isFirstTime ? '资料清单已发送' : '新增资料需求',
    orderId: id,
    orderNo: order.orderNo,
  })
}
```

**覆盖两种场景**：
1. 首次发送清单（CONNECTED→COLLECTING_DOCS 之前）
2. COLLECTING_DOCS 状态下追加新需求项（操作员打回后、资料员补充等）

---

### M3-19：新增通知类型

**修改** `src/types/order.ts`：
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

**修改** `prisma/schema.prisma`：
```prisma
enum NotificationType {
  ORDER_NEW
  ORDER_CREATED
  STATUS_CHANGE
  DOC_REVIEWED
  DOCS_SUBMITTED      // ← 新增
  MATERIAL_UPLOADED
  MATERIAL_FEEDBACK
  APPOINTMENT_REMIND
  SYSTEM
}
```

需要运行 `npx prisma db execute` 或迁移添加新枚举值。

---

### M3-20：通知全链路验证清单

| # | 通知节点 | 触发者 | 接收者 | 代码位置 | 状态 |
|---|---|---|---|---|:---:|
| 1 | 订单创建 | 客服 | 资料员 | orders POST | ✅ |
| 2 | 订单创建 | 客服 | 客户 | orders POST | ✅ |
| 3 | 状态变更（任何） | 任意角色 | 相关人员 | events.ts | ✅ |
| 4 | 资料员发送清单/追加需求 | 资料员 | 客户 | documents POST | ⬜M3-18 |
| 5 | 客户确认提交 | 客户 | 资料员 | submit POST | ⬜M3-9 |
| 6 | 资料审核驳回 | 资料员 | 客户 | documents/[id] PATCH | ✅ |
| 7 | 材料上传 | 操作员 | 资料员 | materials POST | ✅ |
| 8 | 材料上传（首版） | 操作员 | 客户 | materials POST | ✅ |
| 9 | 取消订单 | 管理员 | 相关人员 | cancel POST | ✅ |

---

## 13. Phase G：管理端增强（M3-21 ~ M3-22）

### M3-21：管理端文件删除

**修改** `src/components/documents/document-panel.tsx`

复用 M3-7 的 `DELETE /api/documents/files/[id]`。

在每个文件的 FilePreview 旁边增加删除按钮：
- 管理员不限（可删除任何文件）
- 客户端限制为 uploadedBy === userId（由 API 校验）

---

### M3-22：批量上传并发优化

**修改** `src/components/documents/document-panel.tsx`

当前：逐个串行上传。
优化：最多 3 个并发 + 总进度条。

```typescript
// 并发控制：最多3个
const chunks = []
for (let i = 0; i < files.length; i += 3) {
  chunks.push(files.slice(i, i + 3))
}
for (const chunk of chunks) {
  await Promise.all(chunk.map(uploadFile))
}
```


---

## 14. 文件变更全量清单

### 新建文件（14 个）

| # | 文件 | 说明 | 状态 |
|---|---|---|:---:|
| 1 | `src/app/customer/orders/[id]/page.tsx` | 客户订单详情页 ⭐ | ⬜ |
| 2 | `src/app/customer/orders/[id]/loading.tsx` | 加载骨架屏 | ✅ 已创建 |
| 3 | `src/app/customer/notifications/page.tsx` | 通知中心 | ⬜ |
| 4 | `src/app/customer/profile/page.tsx` | 个人中心 | ⬜ |
| 5 | `src/app/api/documents/presign/route.ts` | 预签名直传 URL | ⬜ |
| 6 | `src/app/api/documents/confirm/route.ts` | 上传确认写库 | ⬜ |
| 7 | `src/app/api/documents/files/[id]/route.ts` | 文件级删除 | ⬜ |
| 8 | `src/app/api/orders/[id]/submit/route.ts` | 客户确认提交+通知 | ⬜ |
| 9 | `src/app/api/auth/change-password/route.ts` | 修改密码 | ⬜ |
| 10 | `src/components/orders/status-timeline.tsx` | 状态时间线 | ✅ 已创建 |
| 11 | `src/components/documents/customer-upload.tsx` | 客户上传组件 ⭐ | ⬜ |
| 12 | `src/components/orders/material-checklist.tsx` | B类材料下载面板 | ⬜ |
| 13 | `src/hooks/use-socket-client.ts` | Socket.io 客户端 | ⬜ |
| 14 | (prisma migration) | DOCS_SUBMITTED 枚举值 | ⬜ |

### 修改文件（7 个）

| # | 文件 | 变更 | 风险 |
|---|---|---|:---:|
| 1 | `src/app/customer/layout.tsx` | 补全 Tab + 角标轮询 | ✅ 已完成 |
| 2 | `src/app/customer/orders/page.tsx` | Link包裹 + 待办提示 + 多人标记 | ✅ 已完成 |
| 3 | `src/app/api/orders/[id]/documents/route.ts` | POST 加通知客户（首次+追加） | 🟢 |
| 4 | `src/lib/rbac.ts` | CUSTOMER 加 delete + transition | ✅ 已完成 |
| 5 | `src/lib/socket.ts` | Cookie 认证改造 | 🟡 |
| 6 | `src/types/order.ts` | 加 DOCS_SUBMITTED 类型 | 🟢 |
| 7 | `src/components/documents/document-panel.tsx` | 文件删除 + 并发上传 | 🟢 |

### 不需要改的文件

| 文件 | 原因 |
|---|---|
| `prisma/schema.prisma` | 仅加枚举值，无新表/字段，通过 db execute |
| `src/middleware.ts` | /customer/* 已有鉴权 |
| `src/lib/transition.ts` | 状态机不变 |
| `src/lib/events.ts` | 通知机制已完善 |
| `src/lib/oss.ts` | 预签名/签名 URL 函数已存在 |
| `src/app/api/documents/upload/route.ts` | 管理端兼容保留 |
| `src/app/api/documents/[id]/route.ts` | 审核逻辑已有 |
| `src/app/api/orders/[id]/materials/route.ts` | 材料 API 已完整 |
| 所有 admin/* 页面 | M3 不改管理端 |

---

## 15. 执行计划（8 批次 / 25h）

```
批次 1（3h）— 基础框架        [无依赖] ✅ 已完成 2026-03-23
  ├── M3-1   Tab 导航路由化（layout.tsx）✅
  ├── M3-2   订单列表增强（orders/page.tsx）✅
  ├── M3-3   状态时间线组件（status-timeline.tsx）✅
  ├── M3-4   权限补全（rbac.ts: CUSTOMER+delete+transition）✅
  └── 额外   loading.tsx骨架屏 + server.ts/console.log修复 + documents/[id] console.error修复
  验收: ✅ Tab切换 | ✅ 卡片跳转 | ✅ 时间线 | ✅ tsc 0错误 | ✅ build 0警告

批次 2（4h）— A 类资料上传核心 ⭐  [依赖批次1] ⬜ 下一步
  ├── M3-5   预签名直传 API（presign/route.ts）
  ├── M3-6   上传确认 API（confirm/route.ts）
  ├── M3-7   文件删除 API（files/[id]/route.ts）
  ├── M3-8   客户上传组件（customer-upload.tsx）
  └── M3-19  新增通知类型 DOCS_SUBMITTED
  验收: 预签名直传全流程 | 文件可删除 | 组件完整 | tsc 0错误

批次 3（5h）— B 类材料 + 详情页 + 确认提交 + 出签反馈 ⭐  [依赖批次1+2]
  ├── M3-9   确认提交 API（submit/route.ts）
  ├── M3-10  材料说明面板（material-checklist.tsx）
  ├── M3-11  客户订单详情页（orders/[id]/page.tsx）含出签反馈 UI
  └── 集成 CustomerUpload + MaterialChecklist + StatusTimeline
  验收: 详情页完整 | A类上传 | B类下载 | 确认提交通知 | 出签反馈 | tsc 0错误

批次 4（3h）— 通知 + Socket  [依赖批次1]
  ├── M3-12  Socket 客户端 Hook（use-socket-client.ts）
  ├── M3-13  Socket 服务端 Cookie 认证改造（socket.ts）
  ├── M3-14  通知中心页面（notifications/page.tsx）
  └── M3-15  Tab 通知角标（layout.tsx）
  验收: Socket连接 | 通知列表 | 角标实时更新 | tsc 0错误

批次 5（2.5h）— 个人中心  [无依赖]
  ├── M3-16  个人中心页面（profile/page.tsx）含"我的订单"入口
  └── M3-17  修改密码 API（change-password/route.ts）
  验收: 信息展示 | 密码修改 | 订单入口跳转 | tsc 0错误

批次 6（2.5h）— 通知闭环 + 管理端  [依赖批次2+3]
  ├── M3-18  资料员发送清单/追加需求通知客户（documents POST）
  ├── M3-21  文件删除集成到 DocumentPanel
  ├── M3-22  批量上传并发优化
  └── M3-20  全链路通知验证（9节点）
  验收: 全部9个通知节点正确 | 管理端删除 | 并发上传

批次 7（2h）— 全量验收  [依赖全部]
  ├── tsc 0错误 + build 0警告 + 74+测试通过
  ├── as any / console.log / TODO 检查 = 0
  ├── 'use client' 首行检查
  ├── 内部导航全用 <Link> 检查
  ├── Prisma ?? null 检查
  ├── 端到端 15 步流程走通
  ├── 权限验证（CUSTOMER 仅访问自己订单/文件）
  └── 移动端适配（iOS Safari + Android Chrome）
  验收: 全部检查项通过
```

依赖图：
```
批次1 ──┬──► 批次2 ──► 批次3 ──► 批次6 ──► 批次7
        ├──► 批次4 ─────────────────────────┤
        └──► 批次5 ─────────────────────────┤
```

**总工作量：25h**

| 批次 | 工时 | 依赖 | 优先级 |
|---|:---:|---|:---:|
| 1 基础框架 | 3h | 无 | P0 |
| 2 资料上传 | 4h | 批次1 | P0 |
| 3 详情页+提交 | 5h | 批次1+2 | P0 |
| 4 通知+Socket | 3h | 批次1 | P0 |
| 5 个人中心 | 2.5h | 无 | P1 |
| 6 通知闭环 | 2.5h | 批次2+3 | P1 |
| 7 全量验收 | 2h | 全部 | P0 |
| **合计** | **25h** | | |

---

## 16. 验收标准

### 16.1 全局验收

| # | 检查项 | 标准 |
|---|---|---|
| 1 | `npx tsc --noEmit` | 0 错误 |
| 2 | `npm run build` | 0 警告 |
| 3 | `npm run test` | 74+ 通过 |
| 4 | `as any` | 0 处 |
| 5 | `console.log` | 0 处 |
| 6 | `TODO` | 0 处 |
| 7 | `'use client'` 首行 | 全部正确 |
| 8 | 内部导航 | 全部 `<Link>`，无 `<a>` |
| 9 | Prisma 可选字段 | 全部 `?? null` |

### 16.2 功能验收

| # | 功能 | 验收标准 |
|---|---|---|
| 1 | Tab 导航 | 3个Tab点击切换路由，当前高亮，浏览器前进后退正常 |
| 2 | 订单列表 | 卡片点击进入详情，待办提示正确，多人标记 |
| 3 | 状态时间线 | 6步进度条反映当前状态，每步有完成时间 |
| 4 | A 类资料上传 | 预签名直传全流程，支持多文件/拍照/删除 |
| 5 | B 类材料展示 | MAKING_MATERIALS 显示制作中提示，之后可预览/下载 |
| 6 | 确认提交 | 有文件的 requirement 变 REVIEWING，资料员收到 DOCS_SUBMITTED 通知 |
| 7 | 出签反馈 | DELIVERED 状态客户可点"已出签"/"被拒签" |
| 8 | 通知中心 | 列表/未读/标记已读/全部已读/跳转订单 |
| 9 | Socket | 连接成功，通知推送触发角标更新 |
| 10 | 个人中心 | 信息展示，密码修改成功，订单入口可跳转 |
| 11 | 通知闭环 | 全部 9 个通知节点正确触发 |
| 12 | 权限 | CUSTOMER 仅能访问自己订单/文件，删除仅限自己上传 |

### 16.3 端到端测试场景（15 步）

```
1. 客服创建订单 → 客户账号自动创建 → 客户收到 ORDER_CREATED
2. 资料员在公共池接单 → CONNECTED → 客户收到 STATUS_CHANGE
3. 资料员选择模板创建13项需求 → 点击"发送客户"
   → COLLECTING_DOCS → 客户收到 DOC_REVIEWED ⬜M3-18
4. 客户登录 → 看到"📤有资料待上传" → 点击进入详情页
5. 客户逐项上传：护照（拍照）、身份证（文件）、银行流水（多文件）
   → 预签名直传 OSS → confirm 写库 → 资料员暂未收到通知
6. 客户点击"确认提交"
   → REVIEWING → 资料员收到 DOCS_SUBMITTED ⬜M3-9
7. 资料员审核：护照 APPROVED、银行流水 SUPPLEMENT "请补近6个月"
   → 客户收到 DOC_REVIEWED
8. 客户补充上传 → 确认提交 → 资料员再次收到通知
9. 资料员全部通过 → 提交审核 → PENDING_REVIEW → 操作员收到通知
10. 操作员接单 → 复审 → 确认达标 → MAKING_MATERIALS
11. 操作员上传保险/行程单/酒店 → PENDING_DELIVERY → 资料员+客户收到通知
12. 资料员确认交付 → DELIVERED → 客户收到通知
13. 客户详情页看到"📥签证材料" → 下载保险/行程单/酒店
14. 客户反馈出签结果 → 点击"已出签" → APPROVED
15. 全流程操作日志完整可追溯
```

---

## 17. 风险矩阵

| # | 风险 | 级别 | 解决方案 | 状态 |
|---|---|:---:|---|:---:|
| 1 | OSS CORS 限制（浏览器直传需 Bucket 配置 CORS） | 🟡 中 | Bucket 配置 CORS 允许当前域名 | ⬜ |
| 2 | Socket.io Cookie 认证改造 | 🟡 中 | socket.ts 改造读 Cookie fallback | ⬜M3-13 |
| 3 | 预签名 URL 过期（1h 有效期） | 🟢 低 | 超时提示重试 | ⬜ |
| 4 | 大文件上传体验 | 🟢 低 | 前端预校验 50MB + 进度条 | ⬜ |
| 5 | 移动端兼容 | 🟢 低 | 标准 Web API | ⬜ |
| 6 | 客户误删文件 | 🟢 低 | 删除前确认弹窗 + 仅删自己上传的 | ⬜ |
| 7 | 多人订单展示复杂度 | 🟢 低 | 复用 M5 DocumentPanel 分组逻辑 | ⬜ |
| 8 | NotificationType 枚举值迁移 | 🟢 低 | db execute 添加新值 | ⬜ |

---

## 18. 开发 Checklist

### 批次 1 开发前 ✅ 已完成
- [x] `git pull origin main` 拉取最新代码
- [x] `npx tsc --noEmit` 确认 0 错误
- [x] 阅读 `customer/layout.tsx` 当前实现

### 批次 1 完成后 ✅ 已验收
- [x] 3 个 Tab 可点击路由切换
- [x] Tab 高亮 + 浏览器前进后退正常
- [x] 订单卡片可点击跳转详情
- [x] 待办提示文案正确（COLLECTING_DOCS/PENDING_DELIVERY/DELIVERED）
- [x] 状态时间线正确显示（6步+终态+pulse动画）
- [x] `npx tsc --noEmit` = 0 错误
- [x] `npm run build` = 0 警告
- [x] 额外：loading骨架屏 + server.ts/console.log修复 + documents/[id] console.error修复

### 批次 2 开发前
- [ ] 阅读 `oss.ts` 的 `generatePresignedPutUrl` 函数
- [ ] 阅读 `documents/upload/route.ts` 的文件类型白名单
- [ ] 阅读 `rbac.ts` 当前 CUSTOMER 权限

### 批次 2 完成后
- [ ] 预签名 URL 可获取
- [ ] 客户端 PUT 直传 OSS 成功
- [ ] confirm 写库 + 状态更新
- [ ] 文件删除（OSS + DB + 状态回退）
- [ ] CustomerUpload 组件完整
- [ ] DOCS_SUBMITTED 类型添加到 schema + types
- [ ] `npx tsc --noEmit` = 0 错误

### 批次 3 开发前
- [ ] 阅读 `customer/orders/page.tsx` 当前实现
- [ ] 阅读 `admin/orders/[id]/page.tsx` 的详情页结构

### 批次 3 完成后
- [ ] 客户详情页完整展示
- [ ] A 类可上传
- [ ] B 类可下载（PENDING_DELIVERY+）
- [ ] MAKING_MATERIALS 显示制作中提示
- [ ] 确认提交通知资料员
- [ ] 出签反馈 UI 可用
- [ ] `npx tsc --noEmit` = 0 错误

### 批次 4 开发前
- [ ] 阅读 `socket.ts` 当前认证逻辑
- [ ] 阅读 `notification-store.ts` 的 fetchUnreadCount

### 批次 4 完成后
- [ ] Socket 连接成功（Cookie 认证）
- [ ] 通知列表加载正确
- [ ] 未读角标实时更新
- [ ] `npx tsc --noEmit` = 0 错误

### 批次 5 完成后
- [ ] 个人信息展示正确
- [ ] 密码修改成功
- [ ] "我的订单"入口跳转
- [ ] `npx tsc --noEmit` = 0 错误

### 批次 6 完成后
- [ ] 全部 9 个通知节点触发正确
- [ ] 管理端可删除文件
- [ ] 并发上传工作正常
- [ ] `npx tsc --noEmit` = 0 错误

### 批次 7（最终验收）
- [ ] `npx tsc --noEmit` = 0 错误
- [ ] `npm run build` = 0 警告
- [ ] `npm run test` = 74+ 通过
- [ ] `grep -r "as any" src/` = 0
- [ ] `grep -r "console.log" src/` = 0
- [ ] `grep -r "TODO" src/` = 0
- [ ] 端到端 15 步流程走通
- [ ] 移动端布局正常
- [ ] Git commit + push

---

*文档结束 — M3 全知手册 V4.0（三轮深度分析终版）*
