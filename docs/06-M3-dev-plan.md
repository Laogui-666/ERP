# 沐海旅行 ERP - M3 全知开发手册

> **文档版本**: V1.0
> **更新日期**: 2026-03-22 12:30
> **用途**: M3 阶段唯一开发指南。即使丢失所有上下文，拿到本文件 + Git 仓库即可完整恢复开发。
> **前置条件**: M1 ✅ + M2 ✅ + M5 ✅ 全部完成（100 源文件 / 11183 行 / 30 API 路由 / 15 页面 / 22 组件）
> **核心交付**: 客户端门户完整可用 + 文件系统增强 + 实时通信接入

---

## 目录

1. [M3 总览](#1-m3-总览)
2. [两类资料流向分析](#2-两类资料流向分析)
3. [现状差距分析](#3-现状差距分析)
4. [架构决策（6 项）](#4-架构决策)
5. [Phase A：客户端核心页面（M3-1 ~ M3-4）](#5-phase-a客户端核心页面)
6. [Phase B：客户端资料交互（M3-5 ~ M3-7）](#6-phase-b客户端资料交互)
7. [Phase C：实时通信与通知（M3-8 ~ M3-10）](#7-phase-c实时通信与通知)
8. [Phase D：管理端文件增强（M3-11 ~ M3-13）](#8-phase-d管理端文件增强)
9. [文件变更全量清单](#9-文件变更全量清单)
10. [执行计划（6 批次）](#10-执行计划)
11. [验收标准](#11-验收标准)
12. [风险矩阵](#12-风险矩阵)

---

## 1. M3 总览

### 1.1 目标

| 目标 | 说明 |
|---|---|
| 客户端门户完整可用 | 订单详情、资料上传、材料下载、通知中心、个人中心 |
| 两类资料流向闭环 | A 类（客户上传）+ B 类（操作员交付）双向打通 |
| 文件系统增强 | 预签名直传、批量操作、文件删除 |
| 实时通信接入 | Socket.io 客户端连接、实时通知推送 |

### 1.2 当前项目状态

| 维度 | 状态 |
|---|---|
| M1 基础架构 | ✅ 100% |
| M2 核心工作流 | ✅ 100% (19/19) |
| M5 多申请人+看板 | ✅ 100% (8/8 批次) |
| M3 文件与客户端 | ⬜ 0%（本手册） |

### 1.3 关键文件位置

```
erp-project/
├── src/
│   ├── app/
│   │   ├── customer/                        ← M3 主要改动区域
│   │   │   ├── layout.tsx                   ← 修改：Tab 路由化 + Socket + 角标
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx                 ← 修改：卡片点击跳转
│   │   │   │   └── [id]/page.tsx            ← 新建：订单详情页
│   │   │   ├── notifications/page.tsx       ← 新建：通知中心
│   │   │   └── profile/page.tsx             ← 新建：个人中心
│   │   ├── api/
│   │   │   ├── documents/
│   │   │   │   ├── presign/route.ts         ← 新建：预签名直传
│   │   │   │   ├── confirm/route.ts         ← 新建：上传确认
│   │   │   │   └── files/[id]/route.ts      ← 新建：文件删除
│   │   │   └── auth/
│   │   │       └── change-password/route.ts ← 新建：修改密码
│   ├── components/
│   │   ├── orders/
│   │   │   └── status-timeline.tsx          ← 新建：状态时间线
│   │   └── documents/
│   │       └── customer-upload.tsx          ← 新建：客户上传组件
│   ├── hooks/
│   │   └── use-socket-client.ts             ← 新建：Socket.io 客户端
│   └── lib/
│       └── oss.ts                           ← 修改：增加预签名辅助
├── docs/
│   ├── 01-PRD.md                            ← 修改：版本号
│   ├── 02-architecture.md                   ← 修改：版本号
│   ├── 03-project-status.md                 ← 修改：M3 状态 + 变更日志
│   ├── 04-dev-standards.md                  ← 修改：版本号
│   └── 06-M3-dev-plan.md                   ← 新建：本文件
```

---

## 2. 两类资料流向分析

> **这是 M3 最核心的设计基础。** 签证业务中存在两类完全不同的资料交互，方向相反、角色不同、操作不同。

### 2.1 两类资料定义

```
                    ┌─────────────────────────────────────────┐
                    │              ERP 系统                    │
                    │                                         │
  ┌──────┐  上传   │  ┌─────────────────────────────────┐    │   审核
  │ 客户  │ ─────► │  │ A 类：客户资料                    │    │ ◄──── 资料员
  │       │        │  │ erp_document_requirements        │    │       操作员
  │       │        │  │ + erp_document_files             │    │
  └──────┘        │  └─────────────────────────────────┘    │
                    │                                         │
  ┌──────┐  下载   │  ┌─────────────────────────────────┐    │   制作上传
  │ 客户  │ ◄───── │  │ B 类：交付材料                    │    │ ◄──── 操作员
  │       │        │  │ erp_visa_materials               │    │
  └──────┘        │  └─────────────────────────────────┘    │
                    └─────────────────────────────────────────┘
```

### 2.2 A 类：客户资料（客户上传 → 系统审核）

| 属性 | 说明 |
|---|---|
| **方向** | 客户 → 系统 |
| **数据表** | `erp_document_requirements`（需求定义）+ `erp_document_files`（实际文件） |
| **创建者** | 资料员定义需求清单 → 客户逐项上传文件 |
| **审核者** | 资料员初审 → 操作员复审 |
| **客户角色** | **上传者**：看到"待上传"列表，逐项上传，等待审核结果 |

**典型 A 类材料：**

| 材料 | 说明 | 必填 |
|---|---|:---:|
| 护照首页 | 有效期6个月以上 | ✅ |
| 护照剩余页 | 所有签证页+盖章页 | ✅ |
| 身份证正反面 | 清晰可辨认 | ✅ |
| 户口本整本 | 全页复印或拍照 | ✅ |
| 在职证明 | 公司抬头信纸，加盖公章 | ✅ |
| 在读证明 | 学校开具（学生适用） | 视情况 |
| 退休证 | 退休人员适用 | 视情况 |
| 银行流水 | 近6个月，余额建议5万+ | ✅ |
| 照片 | 2寸白底近照（各国尺寸不同） | ✅ |
| 房产证 | 辅助资产证明 | ❌ |
| 车辆登记证 | 辅助资产证明 | ❌ |
| 结婚证 | 夫妻同行适用 | 视情况 |
| 营业执照 | 自营企业适用 | 视情况 |

**A 类工作流：**
```
资料员选择模板/手动添加需求 → 生成 DocumentRequirement 记录
    ↓ "发送客户"
客户收到通知 → 查看待上传列表 → 逐项上传文件
    ↓ "确认提交"
资料员收到通知 → 审核资料（合格打勾 / 不合格备注原因）
    ↓ 不合格
客户收到通知 → 补充/修改 → 重新提交
    ↓ 全部合格
资料员点击"提交审核" → 操作员复审
    ↓ 操作员确认达标
进入 B 类流程（材料制作）
```

### 2.3 B 类：交付材料（操作员制作 → 客户下载）

| 属性 | 说明 |
|---|---|
| **方向** | 系统 → 客户 |
| **数据表** | `erp_visa_materials` |
| **创建者** | 操作员制作并上传 |
| **确认者** | 资料员确认交付质量 |
| **客户角色** | **下载者**：看到"已制作"列表，预览/下载 |

**典型 B 类材料：**

| 材料 | 说明 | 类型 |
|---|---|---|
| 申根旅行保险 | 保额3万欧以上 | 系统代购 |
| 行程单 | 每日行程安排 | 操作员制作 |
| 机票预订确认 | 往返机票信息 | 系统代订 |
| 酒店预订确认 | 覆盖全部行程 | 系统代订 |
| 签证申请表 | 在线填写并打印 | 操作员填写 |
| 送签资料包 | 全部材料打包 | 操作员整理 |
| 拒签说明 | 拒签时附加 | 操作员制作 |
| 录指纹预约单 | 需录指纹的签证 | 系统预约 |

**B 类工作流：**
```
操作员确认资料达标 → 点击"开始制作签证材料"
    ↓ 制作中
操作员上传签证材料（保险/行程单/机票/酒店等）
    ↓ "发送资料"
资料员收到通知 → 查看材料 → 确认交付 / 反馈修改
    ↓ 确认交付
客户收到通知 → 查看并下载全部交付材料
    ↓
客户自行送签或邮寄材料
```

### 2.4 两类资料在当前系统中的映射

| 维度 | A 类（客户资料） | B 类（交付材料） |
|---|---|---|
| **Prisma Model** | `DocumentRequirement` + `DocumentFile` | `VisaMaterial` |
| **数据库表** | `erp_document_requirements` + `erp_document_files` | `erp_visa_materials` |
| **API 端点** | `GET/POST /api/orders/[id]/documents`<br>`PATCH /api/documents/[id]`<br>`POST /api/documents/upload` | `GET/POST /api/orders/[id]/materials` |
| **管理端面板** | `DocumentPanel` 组件 | `MaterialPanel` 组件 |
| **客户端展示** | ⬜ M3 实现（需求列表+上传入口） | ⬜ M3 实现（材料列表+下载入口） |
| **文件存储** | `companies/{companyId}/orders/{orderId}/documents/{reqId}/` | `companies/{companyId}/orders/{orderId}/materials/v{version}/` |
| **状态流转** | PENDING → UPLOADED → APPROVED/REJECTED/SUPPLEMENT | 上传后状态流转至 PENDING_DELIVERY |
| **审核流程** | 资料员审核 + 操作员复审 | 资料员确认交付 |
| **客户操作** | 上传文件 | 下载/预览文件 |
| **敏感度** | 高（护照/身份证/银行流水）→ 需脱敏 | 低（保险/行程/酒店）→ 直接展示 |

### 2.5 客户端需呈现的信息结构

```
订单详情页
├── 状态进度条（当前处于哪个阶段）
├── 订单基本信息（国家/类型/金额/时间）
│
├── 📤 我需要上传的资料（A 类）
│   ├── 需求项 1：护照首页 ──── 状态：✅ 已合格
│   ├── 需求项 2：身份证 ──── 状态：✅ 已合格
│   ├── 需求项 3：银行流水 ─── 状态：❌ 需补充（原因：请提供近6个月完整流水）
│   ├── 需求项 4：在职证明 ─── 状态：⏳ 待上传
│   │   [📁 上传文件]  [📷 拍照]
│   └── 需求项 5：照片 ────── 状态：⏳ 待上传
│
├── 📥 为我制作的材料（B 类）← 仅在 PENDING_DELIVERY / DELIVERED 状态显示
│   ├── 📄 申根旅行保险.pdf ── [👁 预览] [⬇ 下载]
│   ├── 📄 行程单.pdf ────── [👁 预览] [⬇ 下载]
│   ├── 📄 酒店预订单.pdf ── [👁 预览] [⬇ 下载]
│   └── 📄 签证申请表.pdf ── [👁 预览] [⬇ 下载]
│
└── 📋 操作记录
    ├── 03-20 14:30 客服创建订单
    ├── 03-20 15:20 资料员接单
    ├── 03-21 09:00 您提交了护照首页
    ├── 03-21 10:30 资料员审核通过：护照首页
    ├── 03-21 14:00 您提交了银行流水
    ├── 03-21 16:00 资料员驳回：银行流水（请提供近6个月完整流水）
    └── ...
```

---

## 3. 现状差距分析

### 3.1 客户端现状

| 功能 | 当前状态 | 说明 |
|---|---|---|
| 订单列表 | ✅ 基础完成 | 卡片展示 + 状态进度条，但**卡片不可点击** |
| 订单详情 | ⬜ 不存在 | 无详情页，无法查看资料/材料 |
| A 类资料上传 | ⬜ 不存在 | 客户无法上传任何文件 |
| B 类材料下载 | ⬜ 不存在 | 客户无法看到操作员制作的材料 |
| 通知列表 | ⬜ 不存在 | 只有管理端 NotificationBell，客户端无通知页 |
| 个人中心 | ⬜ 不存在 | Tab 按钮无功能 |
| Tab 导航 | ⬜ 占位 | 4 个 Tab 是静态按钮，不切换路由 |
| Socket.io | ⬜ 未接入 | 客户端无实时推送 |

### 3.2 管理端现状（已完成，M3 需增强）

| 功能 | 当前状态 | M3 增强 |
|---|---|---|
| DocumentPanel | ✅ 完成 | 预签名直传 + 批量优化 |
| MaterialPanel | ✅ 完成 | 无变更 |
| 文件上传 | ✅ 服务端上传 | 切换到预签名直传 |
| 文件删除 | ⬜ 不存在 | 新建 API |

### 3.3 API 现状（已存在，M3 复用）

| 端点 | 权限 | CUSTOMER 可用 | 说明 |
|---|---|:---:|---|
| `GET /api/orders` | Lv2-9 | ✅ | 订单列表（CUSTOMER 自动过滤） |
| `GET /api/orders/[id]` | 有权限 | ✅ | 订单详情（含资料/材料/日志） |
| `GET /api/orders/[id]/documents` | 有权限 | ✅ | 资料清单 |
| `POST /api/documents/upload` | 有权限 | ✅ | 上传文件（CUSTOMER 有 documents.create） |
| `GET /api/orders/[id]/materials` | Lv5-7,9 | ✅ | 材料列表 |
| `GET /api/notifications` | 已登录 | ✅ | 通知列表 |
| `PATCH /api/notifications/[id]` | 接收者 | ✅ | 标记已读 |
| `POST /api/notifications/mark-all-read` | 已登录 | ✅ | 全部已读 |

**结论**：所有需要的 API 端点**已存在**，M3 不需要新建业务 API（仅新增预签名直传和密码修改）。

---

## 4. 架构决策

### 决策 1：客户端页面结构

```
/customer/
├── orders/
│   ├── page.tsx              # 订单列表（已有，增强）
│   └── [id]/page.tsx         # 订单详情（新建）⭐ 核心页面
├── notifications/page.tsx    # 通知中心（新建）
└── profile/page.tsx          # 个人中心（新建）
```

### 决策 2：复用现有 API，不新建业务端点

- 订单详情：`GET /api/orders/[id]`（已有，CUSTOMER 可访问）
- 资料清单：`GET /api/orders/[id]/documents`（已有）
- 文件上传：`POST /api/documents/upload`（已有，CUSTOMER 有 create 权限）
- 材料列表：`GET /api/orders/[id]/materials`（已有，CUSTOMER 可读）
- 通知：`GET /api/notifications`（已有）

仅新建 3 个辅助端点：
- `POST /api/documents/presign` — 预签名直传（优化）
- `POST /api/documents/confirm` — 直传确认（优化）
- `POST /api/auth/change-password` — 修改密码

### 决策 3：预签名直传方案

当前上传流程（服务端中转）：
```
客户端 → Next.js API → OSS（文件经过服务器，占带宽）
```

M3 切换到预签名直传：
```
客户端 → Next.js API 请求预签名 URL
客户端 → 直传 OSS（文件不经过服务器）
客户端 → Next.js API 确认上传（写数据库）
```

**优势**：减轻 ECS 带宽压力，支持大文件上传，体验更快。

### 决策 4：Tab 导航路由化

底部 4 个 Tab 改为实际路由：
- 🏠 首页 → `/customer`（重定向到 `/customer/orders`）
- 📋 订单 → `/customer/orders`
- 💬 消息 → `/customer/notifications`
- 👤 我的 → `/customer/profile`

当前 Tab 只是静态 `<button>`，改为 `<Link>` + active 状态高亮。

### 决策 5：Socket.io 客户端接入

- 使用 `socket.io-client`（已安装在 dependencies）
- 客户端连接时携带 access_token 认证
- 监听 `notification` 事件 → 更新通知角标 + toast
- 监听 `order:status` 事件 → 刷新当前订单状态
- 自动重连（socket.io 内置）

### 决策 6：两类资料在客户端的展示策略

- **A 类**：展示为"我需要上传的资料"，每个需求项显示状态（待上传/已上传/已合格/需修改/需补充），带上传按钮
- **B 类**：展示为"为我制作的材料"，每个文件带预览/下载按钮，仅在 `PENDING_DELIVERY` / `DELIVERED` / `APPROVED` / `REJECTED` / `PARTIAL` 状态显示
- 两类用视觉分隔（不同区块标题 + 图标），避免客户混淆

---

## 5. Phase A：客户端核心页面

### M3-1：Tab 导航路由化

#### 修改 `src/app/customer/layout.tsx`

**当前问题**：4 个 Tab 是静态按钮，不切换路由。

**改造方案**：
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/customer/orders', label: '订单', icon: '📋' },
  { href: '/customer/notifications', label: '消息', icon: '💬' },
  { href: '/customer/profile', label: '我的', icon: '👤' },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      {/* 顶部导航（不变） */}
      <header className="glass-topbar sticky top-0 z-50 px-4 py-3">
        ...
      </header>

      {/* 内容区域 */}
      <main className="mx-auto max-w-lg px-4 py-4 pb-20">
        {children}
      </main>

      {/* 底部 Tab（改为 Link + active 状态） */}
      <nav className="glass-topbar fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-1 transition-colors',
                  isActive ? 'text-[var(--color-primary-light)]' : 'text-[var(--color-text-placeholder)]'
                )}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-xs">{tab.label}</span>
                {isActive && <span className="w-4 h-0.5 rounded-full bg-[var(--color-primary)]" />}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
```

**验收**：
- [ ] 点击 Tab 切换到对应路由
- [ ] 当前 Tab 高亮
- [ ] 浏览器前进/后退正常

---

### M3-2：订单列表增强

#### 修改 `src/app/customer/orders/page.tsx`

**改动点**：
1. 卡片增加 `onClick` 跳转到 `/customer/orders/{id}`
2. 增加"申请人"信息展示（多人订单）
3. 增加"待办提示"（如"3项资料待上传"）

```typescript
// 卡片包裹 Link
<Link href={`/customer/orders/${order.id}`}>
  <GlassCard className="p-5 animate-fade-in-up cursor-pointer hover:bg-white/[0.04]">
    ...
    {/* 新增：待办提示 */}
    {order.status === 'COLLECTING_DOCS' && (
      <div className="mt-2 text-xs text-[var(--color-warning)]">
        📤 有资料待上传，请查看详情
      </div>
    )}
    {['PENDING_DELIVERY', 'DELIVERED'].includes(order.status) && (
      <div className="mt-2 text-xs text-[var(--color-info)]">
        📥 签证材料已制作完成，请查看详情下载
      </div>
    )}
  </GlassCard>
</Link>
```

**验收**：
- [ ] 卡片点击进入详情页
- [ ] 待办提示正确显示

---

### M3-3：订单详情页（核心页面）

#### 新建 `src/app/customer/orders/[id]/page.tsx`

**这是 M3 最核心的页面。** 需要展示两类资料、状态时间线、操作记录。

**页面结构**：
```
订单详情页
├── 顶部：返回按钮 + 订单号 + 状态徽章
│
├── 状态卡片
│   ├── 签证国家 + 类型
│   └── StatusTimeline 组件（6步进度条）
│
├── 📤 我需要上传的资料（A 类）
│   ├── 需求项列表（状态 + 操作按钮）
│   └── CustomerUpload 组件（上传/拍照）
│
├── 📥 为我制作的材料（B 类）← 条件显示
│   ├── 材料列表（FilePreview 组件复用）
│   └── 预览/下载按钮
│
├── 订单基本信息
│   ├── 联系人、手机号、国家、类型、金额
│   └── 下单时间、送签城市
│
└── 📋 操作记录
    └── OrderLog 时间线（复用管理端样式）
```

**数据获取**：
```typescript
// 使用现有 API
const res = await apiFetch(`/api/orders/${orderId}`)
// 返回 OrderDetail（含 applicants, documentRequirements, visaMaterials, orderLogs）
```

**A 类资料展示逻辑**：
```typescript
// 按 DocumentRequirement 逐项展示
{order.documentRequirements.map(req => (
  <div key={req.id}>
    <span>{req.name}</span>
    <StatusDot status={req.status} />
    {req.status === 'PENDING' && <UploadButton requirementId={req.id} />}
    {req.status === 'REJECTED' && <p>原因：{req.rejectReason}</p>}
    {req.files.map(file => <FilePreview key={file.id} {...file} />)}
  </div>
))}
```

**B 类材料展示逻辑**：
```typescript
// 仅在特定状态显示
{['PENDING_DELIVERY', 'DELIVERED', 'APPROVED', 'REJECTED', 'PARTIAL'].includes(order.status) && (
  <section>
    <h3>📥 为我制作的材料</h3>
    {order.visaMaterials.map(mat => (
      <FilePreview key={mat.id} {...mat} compact />
    ))}
  </section>
)}
```

**验收**：
- [ ] 详情页完整展示订单信息
- [ ] A 类资料按需求项展示状态 + 上传入口
- [ ] B 类材料在正确状态显示 + 可预览/下载
- [ ] 操作记录时间线正确
- [ ] 移动端布局合理

---

### M3-4：状态时间线组件

#### 新建 `src/components/orders/status-timeline.tsx`

**6 步进度条**，每步显示状态名称 + 是否完成 + 时间标注。

```typescript
interface StatusTimelineProps {
  currentStatus: OrderStatus
  orderLogs: OrderLog[]  // 用于提取每步完成时间
}

const STEPS = [
  { key: 'PENDING_CONNECTION', label: '待对接', icon: '📋' },
  { key: 'CONNECTED', label: '已对接', icon: '🤝' },
  { key: 'COLLECTING_DOCS', label: '资料收集', icon: '📤' },
  { key: 'UNDER_REVIEW', label: '审核中', icon: '🔍' },
  { key: 'MAKING_MATERIALS', label: '材料制作', icon: '📝' },
  { key: 'DELIVERED', label: '已交付', icon: '✅' },
]
```

**显示逻辑**：
- 终态（APPROVED/REJECTED/PARTIAL）：所有步骤标记为完成
- 中间状态：当前步骤之前的标记完成，当前步骤高亮，之后的标记未完成
- 每步下方显示完成时间（从 orderLogs 中提取）

**验收**：
- [ ] 进度条正确反映当前状态
- [ ] 每步有时间标注
- [ ] 移动端显示正常（横排可滚动）

---

## 6. Phase B：客户端资料交互

### M3-5：预签名直传 API

#### 新建 `src/app/api/documents/presign/route.ts`

```typescript
// POST /api/documents/presign
// 请求预签名上传 URL

const presignSchema = z.object({
  requirementId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
})

// 1. 认证 + 权限（CUSTOMER 需有 documents.create 权限）
// 2. 验证 requirementId 存在且属于当前公司
// 3. 构建 ossKey
// 4. 调用 generatePresignedPutUrl()
// 5. 返回 { presignedUrl, ossKey }
```

#### 新建 `src/app/api/documents/confirm/route.ts`

```typescript
// POST /api/documents/confirm
// 确认文件已上传到 OSS，写入数据库

const confirmSchema = z.object({
  requirementId: z.string().min(1),
  ossKey: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  fileType: z.string().min(1),
  label: z.string().optional(),
})

// 1. 认证 + 权限
// 2. 验证 requirementId + ossKey
// 3. 生成签名 URL（ossKey → ossUrl）
// 4. 写入 DocumentFile 记录
// 5. 更新 DocumentRequirement.status = UPLOADED
// 6. 写操作日志
// 7. 通知资料员
```

**验收**：
- [ ] 预签名 URL 有效，客户端可直传
- [ ] 确认后数据库记录正确
- [ ] 资料员收到通知

---

### M3-6：客户上传组件

#### 新建 `src/components/documents/customer-upload.tsx`

**功能**：
- 按 DocumentRequirement 逐项展示
- 每项显示名称 + 状态 + 驳回原因
- 待上传项显示"上传"和"拍照"按钮
- 已上传项显示文件列表（FilePreview）
- 上传进度条
- 批量上传支持

**上传流程（使用预签名直传）**：
```typescript
async function handleUpload(requirementId: string, file: File) {
  // 1. 请求预签名 URL
  const presignRes = await apiFetch('/api/documents/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirementId, fileName: file.name, fileType: file.type }),
  })
  const { presignedUrl, ossKey } = await presignRes.json()

  // 2. 直传 OSS
  await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  // 3. 确认上传
  await apiFetch('/api/documents/confirm', {
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

  // 4. 刷新列表
  onRefresh()
}
```

**验收**：
- [ ] 客户可按需求项上传文件
- [ ] 文件直传 OSS
- [ ] 上传后状态更新
- [ ] 支持拍照上传

---

### M3-7：文件删除 API

#### 新建 `src/app/api/documents/files/[id]/route.ts`

```typescript
// DELETE /api/documents/files/[id]
// 删除单个文件（OSS + DB）

// 1. 认证 + 权限（documents.delete）
// 2. 查找文件（校验 companyId）
// 3. 删除 OSS 文件
// 4. 删除 DB 记录
// 5. 如果需求下无文件，回退状态为 PENDING
// 6. 写操作日志
```

**验收**：
- [ ] 文件可删除
- [ ] OSS 文件同步删除
- [ ] 需求状态正确回退

---

## 7. Phase C：实时通信与通知

### M3-8：Socket.io 客户端 Hook

#### 新建 `src/hooks/use-socket-client.ts`

```typescript
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useNotificationStore } from '@/stores/notification-store'
import { useToast } from '@/components/ui/toast'

interface SocketNotification {
  type: string
  title: string
  orderId?: string
  orderNo?: string
}

export function useSocketClient() {
  const socketRef = useRef<Socket | null>(null)
  const { fetchUnreadCount, addNotification } = useNotificationStore()
  const { toast } = useToast()

  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })

    socket.on('connect', () => {
      console.log('[Socket] connected')
    })

    socket.on('notification', (data: SocketNotification) => {
      // 更新未读数
      fetchUnreadCount()
      // toast 提示
      toast('info', data.title)
    })

    socket.on('order:status', (data: { orderId: string; status: string }) => {
      // 如果当前正在查看该订单，触发刷新
      // 通过事件总线或 store 实现
    })

    socket.on('disconnect', () => {
      console.log('[Socket] disconnected')
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [fetchUnreadCount, toast])

  return { socket: socketRef.current }
}
```

**验收**：
- [ ] Socket 连接成功
- [ ] 收到通知时 toast 提示
- [ ] 断线自动重连

---

### M3-9：通知中心页面

#### 新建 `src/app/customer/notifications/page.tsx`

**功能**：
- 通知列表（分页）
- 未读通知标记（蓝点）
- 点击通知标记已读 + 跳转到对应订单
- "全部已读"按钮
- 下拉刷新

**数据获取**：
```typescript
// 使用现有 API
const res = await apiFetch('/api/notifications?page=1&pageSize=50')
// 返回通知列表 + unreadCount
```

**验收**：
- [ ] 通知列表正确展示
- [ ] 未读标记正确
- [ ] 点击标记已读
- [ ] 全部已读功能
- [ ] 跳转到对应订单

---

### M3-10：Tab 通知角标 + Socket 集成

#### 修改 `src/app/customer/layout.tsx`

**改动点**：
1. 集成 `useSocketClient` Hook
2. Tab "消息" 增加未读数角标
3. 通知角标实时更新

```typescript
// 在 layout 中
const { socket } = useSocketClient()
const { unreadCount } = useNotificationStore()

// Tab 渲染
{...TABS.map(tab => {
  if (tab.href === '/customer/notifications' && unreadCount > 0) {
    return (
      <Link ...>
        <span className="text-lg relative">
          {tab.icon}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-error)] 
                          text-white text-[9px] rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </span>
        ...
      </Link>
    )
  }
})}
```

**验收**：
- [ ] 未读数角标实时更新
- [ ] Socket 推送触发角标变化
- [ ] 标记已读后角标减少

---

## 8. Phase D：管理端文件增强

### M3-11：预签名直传切换（管理端）

#### 修改 `src/app/api/documents/upload/route.ts`

**当前**：服务端接收文件 → 上传 OSS
**改为**：服务端接收文件 → 上传 OSS（保持兼容），同时支持预签名模式

保留现有端点作为兼容方案，预签名通过 `/api/documents/presign` + `/api/documents/confirm` 实现。

管理端 `DocumentPanel` 组件可逐步迁移到预签名模式，也可保持现有服务端上传（管理端文件通常较小，服务端上传足够）。

**决策**：M3 阶段**不强制迁移管理端到预签名**。客户端使用预签名，管理端保持现有方式。

---

### M3-12：批量上传优化

#### 修改 `src/components/documents/document-panel.tsx`

**当前**：文件逐个串行上传
**优化**：并发上传 + 总进度条

```typescript
// 并发上传（最多 3 个并发）
const CONCURRENCY = 3
const chunks = []
for (let i = 0; i < fileArray.length; i += CONCURRENCY) {
  chunks.push(fileArray.slice(i, i + CONCURRENCY))
}

for (const chunk of chunks) {
  await Promise.allSettled(
    chunk.map(file => uploadSingle(file))
  )
  // 更新进度
}
```

**验收**：
- [ ] 多文件并发上传
- [ ] 总进度条显示
- [ ] 单个失败不影响其他

---

### M3-13：全量验收

| # | 检查项 | 标准 |
|---|---|---|
| 1 | npx tsc --noEmit | 0 错误 |
| 2 | npm run build | 0 警告 |
| 3 | npm run test | 74+ 用例通过 |
| 4 | as any / console.log / TODO | 0 处 |
| 5 | 'use client' 首行 | 全部正确 |
| 6 | 内部导航 Link | 无 `<a>` 误用 |
| 7 | Prisma ?? null | 全部合规 |
| 8 | 端到端流程 | 客服创建→客户查看→客户上传→资料员审核→操作员制作→客户下载 |
| 9 | 权限验证 | CUSTOMER 仅能访问自己的订单 |
| 10 | 移动端适配 | iOS Safari / Android Chrome 布局正常 |

---

## 9. 文件变更全量清单

### 新建文件（10 个）

| # | 文件 | 说明 | 预估行数 |
|---|---|---|:---:|
| 1 | `src/app/customer/orders/[id]/page.tsx` | 客户订单详情页（M3 核心） | ~250 |
| 2 | `src/app/customer/notifications/page.tsx` | 通知中心页 | ~130 |
| 3 | `src/app/customer/profile/page.tsx` | 个人中心页 | ~100 |
| 4 | `src/app/api/documents/presign/route.ts` | 预签名直传 API | ~60 |
| 5 | `src/app/api/documents/confirm/route.ts` | 上传确认 API | ~80 |
| 6 | `src/app/api/documents/files/[id]/route.ts` | 文件删除 API | ~50 |
| 7 | `src/app/api/auth/change-password/route.ts` | 修改密码 API | ~50 |
| 8 | `src/components/orders/status-timeline.tsx` | 状态时间线组件 | ~80 |
| 9 | `src/components/documents/customer-upload.tsx` | 客户上传组件 | ~150 |
| 10 | `src/hooks/use-socket-client.ts` | Socket.io 客户端 Hook | ~60 |

### 修改文件（5 个）

| # | 文件 | 变更 | 风险 |
|---|---|---|:---:|
| 1 | `src/app/customer/layout.tsx` | Tab 路由化 + Socket 集成 + 通知角标 | 🟡 |
| 2 | `src/app/customer/orders/page.tsx` | 卡片点击跳转 + 待办提示 | 🟢 |
| 3 | `src/components/documents/document-panel.tsx` | 并发上传优化 | 🟢 |
| 4 | `src/lib/oss.ts` | 增加预签名确认辅助函数 | 🟢 |
| 5 | `docs/03-project-status.md` | M3 状态更新 + 变更日志 | 🟢 |

### 不需要改的文件

| 文件 | 理由 |
|---|---|
| 所有 API 路由（除新建 3 个） | 现有 API 已满足 M3 需求 |
| `src/middleware.ts` | 新路由在 /customer/* 下，已有鉴权 |
| `src/lib/rbac.ts` | CUSTOMER 已有 documents.create 权限 |
| `src/lib/transition.ts` | 状态机不变 |
| `prisma/schema.prisma` | 不需要新增表/字段 |
| 所有管理端页面 | M3 不改管理端 |

---

## 10. 执行计划

```
批次 1 — 客户端核心页面（4h）
  ├── Tab 导航路由化（customer/layout.tsx）
  ├── 订单列表增强（卡片点击 + 待办提示）
  ├── 订单详情页（customer/orders/[id]/page.tsx）⭐
  └── 状态时间线组件（status-timeline.tsx）
  验收: tsc 0 错误 | 详情页完整展示 | Tab 切换正常

批次 2 — 客户端资料上传（3h）
  ├── 预签名直传 API（presign + confirm）
  ├── 客户上传组件（customer-upload.tsx）
  ├── 集成到详情页（A 类资料上传入口）
  └── 文件删除 API（files/[id]）
  验收: 客户可上传文件 | 直传 OSS | 资料员收到通知

批次 3 — 通知 + Socket（3h）
  ├── Socket.io 客户端 Hook（use-socket-client.ts）
  ├── 通知中心页面（notifications/page.tsx）
  ├── Tab 通知角标（layout.tsx 集成）
  └── 实时推送验证
  验收: 通知列表完整 | 角标实时更新 | Socket 连接正常

批次 4 — 个人中心（2h）
  ├── 个人中心页面（profile/page.tsx）
  ├── 修改密码 API（change-password/route.ts）
  └── 修改密码表单
  验收: 个人信息展示 | 密码修改成功

批次 5 — 管理端文件增强（3h）
  ├── 批量上传并发优化（document-panel.tsx）
  ├── oss.ts 增加预签名辅助函数
  └── 客户端/管理端上传流程统一验证
  验收: 批量上传并发 | 预签名直传正常

批次 6 — 全量验收（2h）
  ├── tsc + build + test
  ├── 端到端流程走通
  ├── 权限验证（9 角色）
  ├── 移动端适配
  └── 文档更新（03-project-status.md）
  验收: 全部检查项通过
```

**总工作量：~17h（2.5 天）**

| 批次 | 工时 | 依赖 |
|---|:---:|---|
| 批次 1：核心页面 | 4h | 无 |
| 批次 2：资料上传 | 3h | 批次 1 |
| 批次 3：通知 Socket | 3h | 批次 1 |
| 批次 4：个人中心 | 2h | 无 |
| 批次 5：文件增强 | 3h | 批次 2 |
| 批次 6：验收 | 2h | 全部 |
| **合计** | **17h** | |

---

## 11. 验收标准

### Phase A 验收

- [ ] 底部 Tab 点击切换到对应路由，当前 Tab 高亮
- [ ] 订单卡片点击进入详情页
- [ ] 详情页展示完整订单信息 + 状态时间线
- [ ] A 类资料按需求项展示状态 + 上传入口
- [ ] B 类材料在正确状态显示 + 可预览/下载
- [ ] 操作记录时间线正确展示
- [ ] tsc 0 错误 + build 通过

### Phase B 验收

- [ ] 预签名直传全流程走通（请求 URL → 直传 OSS → 确认写库）
- [ ] 客户可按需求项上传文件
- [ ] 上传后资料员收到通知
- [ ] 支持拍照上传
- [ ] 文件可删除（OSS + DB 同步）
- [ ] tsc 0 错误 + build 通过

### Phase C 验收

- [ ] Socket.io 客户端连接成功
- [ ] 收到通知时 toast 提示
- [ ] 通知列表页面完整（未读标记 + 全部已读 + 跳转订单）
- [ ] Tab 角标实时更新
- [ ] 断线自动重连
- [ ] tsc 0 错误 + build 通过

### Phase D 验收

- [ ] 个人信息展示正确
- [ ] 修改密码功能完整
- [ ] 批量上传并发 + 进度
- [ ] tsc 0 错误 + build 通过 + 74+ 测试通过

---

## 12. 风险矩阵

| # | 风险 | 级别 | 影响 | 解决方案 | 状态 |
|---|---|:---:|---|---|:---:|
| 1 | 预签名直传跨域 | 🟡 中 | 客户端上传 | OSS Bucket CORS 配置（`*` 或指定域名） | ⬜ 待配置 |
| 2 | Socket.io 客户端认证 | 🟡 中 | 实时推送 | 连接时传递 cookie/token，服务端已有 JWT 校验 | ⬜ 待实现 |
| 3 | 客户端文件大小限制 | 🟢 低 | 上传体验 | 前端预校验（50MB）+ 进度条 | ⬜ 待实现 |
| 4 | 移动端 Safari 兼容 | 🟢 低 | 布局 | 使用标准 Web API，避免实验性特性 | ⬜ 待测试 |
| 5 | 预签名 URL 过期 | 🟢 低 | 上传失败 | URL 有效期 1 小时，超时提示重新请求 | ⬜ 待实现 |
| 6 | B 类材料状态显示时机 | 🟢 低 | 用户体验 | 仅在 PENDING_DELIVERY 及之后状态显示 | ⬜ 待实现 |

---

*文档结束 - M3 全知手册 V1.0*
