# 沐海旅行 ERP — M5 全知开发手册

> **文档版本**: V1.0
> **创建日期**: 2026-03-21
> **用途**: M5 阶段唯一开发指南。即使丢失所有上下文，拿到本文件 + Git 仓库即可完整恢复开发。
> **前置条件**: M1 + M2 全部完成（80 源文件 / 25 API / 14 页面 / 17 组件）

---

## 目录

1. [M5 总览](#1-m5-总览)
2. [Phase A：多申请人（M5-1 ~ M5-5）](#2-phase-a多申请人)
3. [Phase B：数据看板（M5-6 ~ M5-10）](#3-phase-b数据看板)
4. [Phase C：导出与迁移（M5-11 ~ M5-14）](#4-phase-c导出与迁移)
5. [数据库变更全量清单](#5-数据库变更全量清单)
6. [API 端点全量清单](#6-api-端点全量清单)
7. [前端页面变更清单](#7-前端页面变更清单)
8. [类型定义变更](#8-类型定义变更)
9. [开发环境启动](#9-开发环境启动)
10. [验收标准](#10-验收标准)

---

## 1. M5 总览

### 1.1 目标

| 目标 | 说明 |
|---|---|
| 多申请人支持 | 一个订单支持 1~N 个申请人，每人独立跟踪资料和出签结果 |
| 财务统计 | 自动计算平台费、毛利，替代手工 Excel |
| 数据看板 | 月度趋势、国家分布、出签率、绩效排行等 9 种图表 |
| Excel 导出 | 完全对齐现有手工表 23 列格式，支持多人行合并 |
| 历史数据迁移 | 将 15 个月手工 Excel (~2,475 条) 批量导入 ERP |

### 1.2 开发顺序

```
阶段一（数据层）：    M5-1 数据模型 → M5-14 财务计算函数
阶段二（多申请人）：  M5-2 → M5-3 → M5-4 → M5-5
阶段三（看板）：      M5-6 → M5-7 → M5-8 → M5-9 → M5-10
阶段四（导出）：      M5-11 → M5-12 → M5-13
```

### 1.3 关键文件位置

```
erp-project/
├── prisma/schema.prisma          ← 修改：新增 Applicant 模型 + Order 扩展字段
├── prisma/migrations/            ← 新增：migration.sql
├── prisma/seed.ts                ← 修改：无需改（Applicant 无种子数据）
├── src/
│   ├── types/order.ts            ← 修改：新增 Applicant/VisaResult 类型
│   ├── lib/transition.ts         ← 修改：多人结果判断逻辑
│   ├── lib/utils.ts              ← 修改：新增财务计算函数
│   ├── app/api/
│   │   ├── orders/route.ts       ← 修改：创建订单支持多人
│   │   ├── orders/[id]/route.ts  ← 修改：详情返回 applicants
│   │   ├── orders/[id]/status/route.ts  ← 修改：终态判断逻辑
│   │   ├── analytics/            ← 新增：4 个 API 路由
│   │   │   ├── overview/route.ts
│   │   │   ├── trend/route.ts
│   │   │   ├── workload/route.ts
│   │   │   └── export/route.ts
│   │   └── applicants/           ← 新增：申请人 CRUD
│   │       └── [id]/route.ts
│   ├── app/admin/
│   │   ├── analytics/page.tsx    ← 重写：数据看板页面
│   │   ├── orders/page.tsx       ← 修改：创建订单表单支持多人
│   │   └── orders/[id]/page.tsx  ← 修改：申请人卡片展示
│   └── components/
│       ├── orders/               ← 新增：申请人相关组件
│       │   ├── applicant-card.tsx
│       │   ├── applicant-form.tsx
│       │   └── applicant-result.tsx
│       └── analytics/            ← 新增：图表组件
│           ├── trend-chart.tsx
│           ├── pie-chart.tsx
│           ├── gauge-chart.tsx
│           └── ranking-table.tsx
```

---

## 2. Phase A：多申请人

### M5-1：数据模型

#### 2.1.1 新建 Applicant 模型

**文件**: `prisma/schema.prisma`

在 `enum OrderStatus` 之后、`// ==================== 资料需求 ====================` 之前插入：

```prisma
// ==================== 申请人（多申请人订单） ====================

model Applicant {
  id              String     @id @default(cuid())
  orderId         String     @db.VarChar(30)
  companyId       String     @db.VarChar(30)

  // 基本信息
  name            String     @db.VarChar(50)
  phone           String?    @db.VarChar(20)
  passportNo      String?    @db.VarChar(20)
  passportExpiry  DateTime?

  // 签证结果（每个人独立）
  visaResult      VisaResult?
  visaResultAt    DateTime?
  visaResultNote  String?    @db.Text

  // 资料状态
  documentsComplete Boolean  @default(false)

  sortOrder       Int        @default(0)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  order           Order      @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@index([companyId])
  @@map("erp_applicants")
}

enum VisaResult {
  APPROVED
  REJECTED
}
```

#### 2.1.2 Order 模型扩展字段

**文件**: `prisma/schema.prisma`，在 `fingerprintRequired` 之后、`createdAt` 之前插入：

```prisma
  // 多申请人
  applicantCount  Int          @default(1)
  contactName     String?      @db.VarChar(50)
  targetCity      String?      @db.VarChar(50)

  // 流程时间线
  submittedAt     DateTime?
  visaResultAt    DateTime?

  // 财务明细
  platformFeeRate   Decimal?   @db.Decimal(5,4)
  platformFee       Decimal?   @db.Decimal(10,2)
  visaFee           Decimal?   @db.Decimal(10,2)
  insuranceFee      Decimal?   @db.Decimal(10,2)
  rejectionInsurance Decimal?  @db.Decimal(10,2)
  reviewBonus       Decimal?   @db.Decimal(10,2)
  grossProfit       Decimal?   @db.Decimal(10,2)
```

#### 2.1.3 OrderStatus 枚举扩展

在 `REJECTED` 之后新增：

```prisma
  PARTIAL             // 部分出签（多人订单特有）
```

#### 2.1.4 Order 模型关联

在 `notifications        Notification[]` 之后新增：

```prisma
  applicants           Applicant[]
```

#### 2.1.5 迁移执行

```bash
cd erp-project
npx prisma migrate dev --name add_applicant_and_order_extensions
npx prisma generate
```

---

### M5-2：创建订单表单（多人支持）

#### 2.2.1 修改创建订单 API

**文件**: `src/app/api/orders/route.ts` — POST 方法

**当前逻辑**：接收单个客户信息，创建 1 个 Order + 1 个 Customer User

**修改为**：

```typescript
const createSchema = z.object({
  // 现有字段...
  contactName: z.string().max(50).optional(),        // 新增
  targetCity: z.string().max(50).optional(),         // 新增
  applicants: z.array(z.object({                      // 新增：申请人数组
    name: z.string().min(1).max(50),
    phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
    passportNo: z.string().max(20).optional(),
  })).min(1),                                         // 至少 1 人
  // 财务字段
  platformFeeRate: z.number().min(0).max(1).optional(),
  visaFee: z.number().min(0).optional(),
  insuranceFee: z.number().min(0).optional(),
  rejectionInsurance: z.number().min(0).optional(),
  reviewBonus: z.number().min(0).optional(),
})
```

**事务内新增逻辑**：

```typescript
// 1. 创建 Order（同现有，新增 contactName/targetCity/财务字段）
// 2. 创建/关联 Customer User（用 applicants[0] 或 contactName）
// 3. 批量创建 Applicant
await tx.applicant.createMany({
  data: data.applicants.map((a, i) => ({
    orderId: order.id,
    companyId: user.companyId,
    name: a.name,
    phone: a.phone ?? null,
    passportNo: a.passportNo ?? null,
    sortOrder: i,
  })),
})
// 4. 更新 applicantCount
await tx.order.update({
  where: { id: order.id },
  data: { applicantCount: data.applicants.length },
})
// 5. 自动计算平台费和毛利
const platformFee = data.amount * (data.platformFeeRate ?? 0)
const grossProfit = data.amount - platformFee - (data.visaFee ?? 0)
  - (data.insuranceFee ?? 0) - (data.rejectionInsurance ?? 0)
  - (data.reviewBonus ?? 0)
```

#### 2.2.2 修改前端创建订单表单

**文件**: `src/app/admin/orders/page.tsx` — 新建订单 Modal

**新增申请人管理区域**：

```
┌─ 新建订单 ──────────────────────────────┐
│ 联系人: [__________]                     │
│ 手机号: [__________]                     │
│ 国家:   [____]  城市: [____]             │
│ 套餐:   [____]  金额: [____]             │
│                                          │
│ ┌─ 申请人列表 ──────────────────────┐    │
│ │ ① 姓名: [______] 手机: [______]   │    │
│ │ ② 姓名: [______] 手机: [______]   │    │
│ │         [+ 添加申请人]             │    │
│ └────────────────────────────────────┘   │
│                                          │
│ ┌─ 财务（可选）────────────────────┐     │
│ │ 扣点费率: [0.061] 签证费: [__]    │     │
│ │ 保险费: [__] 拒签保险: [__]       │     │
│ │ 好评返现: [__]                     │     │
│ └────────────────────────────────────┘   │
│                                          │
│                    [取消]  [创建订单]     │
└──────────────────────────────────────────┘
```

**状态管理**：

```typescript
const [applicants, setApplicants] = useState([
  { name: '', phone: '', passportNo: '' }  // 默认 1 人
])

const addApplicant = () => {
  setApplicants([...applicants, { name: '', phone: '', passportNo: '' }])
}

const removeApplicant = (index: number) => {
  if (applicants.length <= 1) return  // 至少保留 1 人
  setApplicants(applicants.filter((_, i) => i !== index))
}
```

---

### M5-3：资料收集面板（按人分组）

#### 2.3.1 修改 DocumentPanel 组件

**文件**: `src/components/documents/document-panel.tsx`

**当前逻辑**：平铺展示所有 DocumentRequirement

**修改为**：按 Applicant 分组展示

```
┌─ 资料收集 ──────────────────────────────┐
│                                          │
│  总进度: 5/12 项资料已完成                │
│                                          │
│  ┌─ 张三 ────────────────────────────┐   │
│  │ 进度: 3/6    [收集中]              │   │
│  │ ✅ 护照        ✅ 照片             │   │
│  │ ✅ 在职证明    ❌ 银行流水  需补充  │   │
│  │ ⏳ 行程单      ⏳ 酒店预订         │   │
│  └────────────────────────────────────┘   │
│                                          │
│  ┌─ 李四 ────────────────────────────┐   │
│  │ 进度: 2/6    [收集中]              │   │
│  │ ✅ 护照        ⏳ 照片             │   │
│  │ ⏳ 在职证明    ⏳ 银行流水         │   │
│  │ ⏳ 行程单      ⏳ 酒店预订         │   │
│  └────────────────────────────────────┘   │
│                                          │
│  [添加资料项]    [提交审核] ← 全部齐全才亮 │
└──────────────────────────────────────────┘
```

**实现要点**：

1. 获取订单的 `applicants` 列表
2. 每个 DocumentRequirement 增加 `applicantId` 字段（可选，关联到具体申请人）
3. 如果 `applicantCount === 1`，保持现有平铺展示（兼容旧订单）
4. 如果 `applicantCount > 1`，按 Applicant 分组展示
5. "提交审核" 按钮：检查所有 Applicant 的 `documentsComplete === true`

**注意**：对于共享资料（如行程单、酒店预订多人共用），可以标记为"共享"，只需上传一次。

#### 2.3.2 DocumentRequirement 新增字段（可选）

如果需要精确关联到申请人：

```prisma
model DocumentRequirement {
  // 现有字段...
  applicantId     String?    @db.VarChar(30)  // 关联申请人（null=共享资料）
  isShared        Boolean    @default(false)   // 是否多人共享
}
```

**建议**：M5 阶段先不加此字段。保持现有的"一个资料需求列表"模型，通过 `documentsComplete` 标记每个人是否完成。更复杂的按人分配资料在 M6 智能检查时再细化。

---

### M5-4：订单详情（申请人卡片）

#### 2.4.1 修改订单详情 API

**文件**: `src/app/api/orders/[id]/route.ts` — GET 方法

在 `include` 中新增 applicants：

```typescript
include: {
  // 现有...
  applicants: {
    orderBy: { sortOrder: 'asc' },
  },
  // 现有...
}
```

#### 2.4.2 修改订单详情页面

**文件**: `src/app/admin/orders/[id]/page.tsx`

在信息展示区域之后、资料面板之前，新增申请人卡片区域：

```tsx
{/* 申请人卡片 */}
<div className="glass-card p-6">
  <h3 className="text-lg font-semibold mb-4">
    申请人 ({order.applicantCount}人)
  </h3>
  <div className="grid gap-3">
    {order.applicants.map((applicant) => (
      <ApplicantCard key={applicant.id} applicant={applicant} />
    ))}
  </div>
</div>
```

#### 2.4.3 新建 ApplicantCard 组件

**文件**: `src/components/orders/applicant-card.tsx`

```tsx
interface ApplicantCardProps {
  applicant: Applicant
  onResultChange?: (id: string, result: VisaResult, note?: string) => void
}

export function ApplicantCard({ applicant, onResultChange }: ApplicantCardProps) {
  return (
    <div className="glass-card-static p-4 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/15
                        flex items-center justify-center text-sm font-medium">
          {applicant.name[0]}
        </div>
        <div>
          <div className="font-medium">{applicant.name}</div>
          <div className="text-xs text-[var(--color-text-placeholder)]">
            {applicant.phone ?? '无手机号'}
            {applicant.passportNo && ` · 护照 ${applicant.passportNo}`}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* 资料状态 */}
        <Badge variant={applicant.documentsComplete ? 'success' : 'warning'}>
          {applicant.documentsComplete ? '资料齐全' : '收集中'}
        </Badge>
        {/* 出签结果 */}
        {applicant.visaResult === 'APPROVED' && (
          <Badge variant="success">出签 ✅</Badge>
        )}
        {applicant.visaResult === 'REJECTED' && (
          <Badge variant="danger">拒签 ❌</Badge>
        )}
        {!applicant.visaResult && (
          <span className="text-xs text-[var(--color-text-placeholder)]">待出签</span>
        )}
      </div>
    </div>
  )
}
```

---

### M5-5：状态流转（多人结果判断）

#### 2.5.1 新增申请人结果 API

**文件**：新建 `src/app/api/applicants/[id]/route.ts`

```typescript
// PATCH /api/applicants/[id] — 更新申请人结果
const updateSchema = z.object({
  visaResult: z.enum(['APPROVED', 'REJECTED']),
  visaResultNote: z.string().optional(),
  documentsComplete: z.boolean().optional(),
})

export async function PATCH(request, { params }) {
  // 1. 认证 + 权限
  // 2. 查找 applicant（校验 companyId）
  // 3. 更新 applicant.visaResult + visaResultAt + visaResultNote
  // 4. 检查同订单所有 applicant 是否都有结果
  //    → 全部 APPROVED: 订单 → APPROVED
  //    → 全部 REJECTED: 订单 → REJECTED
  //    → 混合: 订单 → PARTIAL
  // 5. 通知相关人员
}
```

#### 2.5.2 订单终态判断函数

**文件**: `src/lib/transition.ts` — 新增函数

```typescript
/**
 * 根据所有申请人结果，计算订单最终状态
 */
export async function checkOrderFinalStatus(
  tx: Prisma.TransactionClient,
  orderId: string
): Promise<OrderStatus | null> {
  const applicants = await tx.applicant.findMany({
    where: { orderId },
    select: { visaResult: true },
  })

  // 还有人没出结果
  if (applicants.some(a => a.visaResult === null)) return null

  const allApproved = applicants.every(a => a.visaResult === 'APPROVED')
  const allRejected = applicants.every(a => a.visaResult === 'REJECTED')

  if (allApproved) return 'APPROVED'
  if (allRejected) return 'REJECTED'
  return 'PARTIAL'  // 有人出签有人拒签
}
```

#### 2.5.3 状态机扩展

在 `TRANSITION_RULES` 中新增 PARTIAL 相关规则：

```typescript
// PARTIAL 状态可以被管理员手动标记为终态
{
  from: 'PARTIAL',
  to: 'APPROVED',
  allowedRoles: ['COMPANY_OWNER', 'VISA_ADMIN'],
  action: '标记为全部出签',
},
{
  from: 'PARTIAL',
  to: 'REJECTED',
  allowedRoles: ['COMPANY_OWNER', 'VISA_ADMIN'],
  action: '标记为全部拒签',
},
```

#### 2.5.4 订单详情页新增结果操作

在申请人卡片上，为有权限的角色（OPERATOR/DOC_COLLECTOR/VISA_ADMIN）显示操作按钮：

```
┌─ 张三 ──────────────────────────────┐
│ 姓名: 张三  手机: 138xxxx  护照: EA*** │
│ 资料状态: ✅ 齐全                     │
│ 出签结果: [出签] [拒签]  ← 点击标记     │
│ 备注: [________________]              │
└───────────────────────────────────────┘
```

---

## 3. Phase B：数据看板

### M5-6：分析 API

#### 3.6.1 概览 API

**文件**: 新建 `src/app/api/analytics/overview/route.ts`

```
GET /api/analytics/overview?month=2026-03
```

**权限**: `requirePermission(user, 'analytics', 'read')` — Lv1-3,5

**返回**：

```json
{
  "success": true,
  "data": {
    "totalOrders": 156,
    "totalRevenue": 128500.00,
    "totalProfit": 42300.00,
    "profitRate": "32.9%",
    "inProgress": 45,
    "approved": 98,
    "rejected": 8,
    "partial": 5,
    "approvalRate": "89.9%",
    "avgProcessDays": 12.5,
    "comparison": {
      "ordersChange": "+12%",
      "revenueChange": "+8%",
      "profitChange": "+15%"
    }
  }
}
```

**查询逻辑**：

```typescript
// 统计指定月份（或当月）的订单
const where = {
  companyId: user.companyId,
  createdAt: { gte: monthStart, lte: monthEnd },
}

const [totalOrders, orders] = await Promise.all([
  prisma.order.count({ where }),
  prisma.order.findMany({
    where,
    select: { status: true, amount: true, platformFee: true,
              visaFee: true, insuranceFee: true, grossProfit: true,
              createdAt: true, deliveredAt: true },
  }),
])

// 聚合计算
const totalRevenue = orders.reduce((s, o) => s + Number(o.amount), 0)
const totalProfit = orders.reduce((s, o) => s + Number(o.grossProfit ?? 0), 0)
const approved = orders.filter(o => o.status === 'APPROVED').length
const rejected = orders.filter(o => o.status === 'REJECTED').length
// ...
```

#### 3.6.2 趋势 API

**文件**: 新建 `src/app/api/analytics/trend/route.ts`

```
GET /api/analytics/trend?months=6    // 最近 6 个月
GET /api/analytics/trend?start=2025-01&end=2026-03
```

**返回**：

```json
{
  "success": true,
  "data": [
    { "month": "2025-10", "orders": 112, "revenue": 98000, "profit": 32000, "approved": 85, "rejected": 6 },
    { "month": "2025-11", "orders": 220, "revenue": 185000, "profit": 61000, "approved": 190, "rejected": 12 },
    { "month": "2025-12", "orders": 288, "revenue": 245000, "profit": 81000, "approved": 255, "rejected": 15 },
    { "month": "2026-01", "orders": 262, "revenue": 220000, "profit": 73000, "approved": 230, "rejected": 14 },
    { "month": "2026-02", "orders": 153, "revenue": 130000, "profit": 43000, "approved": 135, "rejected": 8 },
    { "month": "2026-03", "orders": 156, "revenue": 128500, "profit": 42300, "approved": 98, "rejected": 8 }
  ]
}
```

#### 3.6.3 人员负荷 API

**文件**: 新建 `src/app/api/analytics/workload/route.ts`

```
GET /api/analytics/workload?month=2026-03
```

**返回**：

```json
{
  "success": true,
  "data": {
    "customerService": [
      { "userId": "xxx", "realName": "江敏", "orders": 89, "revenue": 75000 },
      { "userId": "yyy", "realName": "廖琴", "orders": 52, "revenue": 43000 },
      { "userId": "zzz", "realName": "黄杰", "orders": 15, "revenue": 10500 }
    ],
    "operators": [
      { "userId": "aaa", "realName": "吴韩億", "orders": 78, "approved": 70, "rejected": 4, "rate": "89.7%" },
      { "userId": "bbb", "realName": "刘珊珊", "orders": 55, "approved": 48, "rejected": 3, "rate": "87.3%" },
      { "userId": "ccc", "realName": "邓邓", "orders": 23, "approved": 20, "rejected": 2, "rate": "87.0%" }
    ],
    "collectors": [
      { "userId": "ddd", "realName": "蒋", "orders": 95, "completed": 88 },
      { "userId": "eee", "realName": "杨", "orders": 45, "completed": 42 },
      { "userId": "fff", "realName": "张", "orders": 16, "completed": 15 }
    ]
  }
}
```

### M5-7：仪表盘图表组件

#### 3.7.1 图表库选型

**推荐**: 纯 CSS/SVG 实现简单图表（柱状图/饼图）+ `recharts` 用于复杂图表

**安装**：
```bash
npm install recharts
```

#### 3.7.2 图表组件清单

| 组件 | 文件 | 图表类型 | 数据源 |
|---|---|---|---|
| TrendChart | `src/components/analytics/trend-chart.tsx` | 折线图 | /api/analytics/trend |
| CountryPieChart | `src/components/analytics/country-pie.tsx` | 饼图 | /api/analytics/overview |
| PaymentPieChart | `src/components/analytics/payment-pie.tsx` | 饼图 | /api/analytics/overview |
| GaugeChart | `src/components/analytics/gauge-chart.tsx` | 仪表盘 | 出签率 |
| StatCard | `src/components/analytics/stat-card.tsx` | 数值卡 | 核心指标 |
| ProfitBarChart | `src/components/analytics/profit-bar.tsx` | 柱状图 | 营收vs利润 |

#### 3.7.3 数据看板页面

**文件**: `src/app/admin/analytics/page.tsx`（重写）

```
┌─ 数据统计 ──────────────────────────────────────────┐
│                                                      │
│ 筛选: [月份范围▼] [国家▼] [客服▼] [操作员▼]          │
│                                                      │
│ ┌─ 核心指标 ──────────────────────────────────────┐  │
│ │ 💰 总营收 ¥128,500  │ 📊 总订单 156            │  │
│ │ 📈 毛利 ¥42,300     │ ✅ 出签率 89.9%          │  │
│ │ ⏱️ 平均时长 12.5天   │ 🔄 进行中 45             │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ ┌─ 月度趋势 ────────┐  ┌─ 国家分布 ───────────┐    │
│ │  📈 折线图         │  │  🍩 饼图              │    │
│ │  订单数+金额趋势   │  │  法国/澳洲/美国/...   │    │
│ └──────────────────┘  └─────────────────────┘    │
│                                                      │
│ ┌─ 营收vs利润 ──────┐  ┌─ 出签率仪表盘 ──────┐    │
│ │  📊 柱状图         │  │  🎯 89.9%            │    │
│ │  月度对比          │  │  ████████░░          │    │
│ └──────────────────┘  └─────────────────────┘    │
│                                                      │
│ ┌─ 客服绩效 ────────────────────────────────────┐   │
│ │  排名 │ 姓名  │ 订单数 │ 营收    │ 占比        │   │
│ │  1    │ 江敏  │ 89    │ ¥75,000 │ 58.4%      │   │
│ │  2    │ 廖琴  │ 52    │ ¥43,000 │ 33.5%      │   │
│ │  3    │ 黄杰  │ 15    │ ¥10,500 │ 8.2%       │   │
│ └───────────────────────────────────────────────┘   │
│                                                      │
│ ┌─ 操作员绩效 ──────────────────────────────────┐   │
│ │  排名 │ 姓名   │ 接单数 │ 出签 │ 拒签 │ 出签率 │   │
│ │  1    │ 吴韩億 │ 78    │ 70   │ 4   │ 89.7% │   │
│ │  2    │ 刘珊珊 │ 55    │ 48   │ 3   │ 87.3% │   │
│ └───────────────────────────────────────────────┘   │
│                                                      │
│ ┌─ 异常预警 ────────────────────────────────────┐   │
│ │  ⚠️ V20260317045 "待审核" 超48h               │   │
│ │  ⚠️ V20260316023 "资料收集中" 超72h            │   │
│ └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### M5-8 ~ M5-10

在 M5-7 的看板页面中一并实现，不需要单独的文件。绩效排行榜用表格组件，筛选器用 Select 组件，异常预警复用现有的 Cron 超时检测 API。

---

## 4. Phase C：导出与迁移

### M5-11：Excel 导出 API

#### 4.11.1 安装依赖

```bash
npm install xlsx
```

#### 4.11.2 新建导出 API

**文件**: `src/app/api/analytics/export/route.ts`

```
GET /api/analytics/export?month=2026-03&format=xlsx
```

**返回**: 直接返回 Excel 文件流（`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`）

#### 4.11.3 列结构（完全对齐手工表）

| 列号 | 列名 | 数据来源 | 说明 |
|:---:|---|---|---|
| A | 序号 | 自增 | |
| B | 联系人 | Order.contactName | |
| C | 申请人 | Applicant.name | 多人用换行分隔 |
| D | 申请人数 | Order.applicantCount | |
| E | 手机号 | Order.customerPhone | |
| F | 国家 | Order.targetCountry | |
| G | 城市 | Order.targetCity | |
| H | 套餐 | Order.visaCategory | |
| I | 备注/预计出行 | Order.remark + travelDate | |
| J | 下单时间 | Order.createdAt | 格式 MM.DD |
| K | 接待客服 | createdBy → User.realName | |
| L | 资料收集 | collectorId → User.realName | |
| M | 平台进度更新 | Order.status 中文标签 | |
| N | 递交日期 | Order.submittedAt | 格式 YYYY.MM.DD |
| O | 出签时间 | Applicant.visaResultAt | 多人取最后时间 |
| P | 出签人数 | APPROVED 的 Applicant 数量 | |
| Q | 操作专员 | operatorId → User.realName | |
| R | 订单编号 | Order.externalOrderNo | |
| S | 订单金额 | Order.amount | |
| T | 支付方式 | Order.paymentMethod | |
| U | 平台扣点 | Order.platformFeeRate | 百分比格式 |
| V | 平台费用 | Order.platformFee | |
| W | 签证费 | Order.visaFee | |
| X | 申根保险 | Order.insuranceFee | |
| Y | 拒签保险 | Order.rejectionInsurance | |
| Z | 好评返现 | Order.reviewBonus | |

#### 4.11.4 多人行合并

当一个订单有 N 个申请人时：
- 联系人/国家/金额等共享字段只在第一行显示
- 申请人列每人一行
- 其他行留空（Excel 合并单元格视觉效果）

```typescript
// 伪代码
for (const order of orders) {
  const applicants = order.applicants
  const sharedData = { 序号, 联系人, 手机号, 国家, 城市, 套餐, ... }

  for (let i = 0; i < applicants.length; i++) {
    const row = i === 0 ? sharedData : { ...emptyShared, 申请人: applicants[i].name }
    sheet.addRow(row)
  }

  // Excel 合并单元格
  if (applicants.length > 1) {
    for (let col = 0; col < 26; col++) {
      if (col !== 2 && col !== 4 && col !== 14) { // 跳过申请人、出签人数、出签时间列
        sheet.mergeCells(startRow, col, startRow + applicants.length - 1, col)
      }
    }
  }
}
```

### M5-12：多人订单行合并

在 M5-11 的导出逻辑中一并实现。

### M5-13：历史数据批量导入

#### 4.13.1 导入脚本

**文件**: 新建 `scripts/import-excel.ts`

```bash
npx tsx scripts/import-excel.ts ./签证统计表2026.3.xlsx
```

**处理逻辑**：

```typescript
// 1. 读取 Excel 所有工作表
// 2. 对每个工作表（每月）：
//    a. 解析表头，建立列名→字段映射
//    b. 逐行读取：
//       - 创建 Order（联系人/国家/金额/客服/操作员/订单号等）
//       - 创建 Applicant（申请人姓名）
//       - 设置流程时间线（下单时间/递交时间/出签时间）
//       - 设置财务字段（扣点/费用/签证费/保险）
//       - 计算毛利
//       - 根据"签OR拒签"列设置 visaResult
//    c. 跳过空行和汇总行
// 3. 统计导入结果：成功/跳过/错误
```

**难点处理**：

| 难点 | 解决方案 |
|---|---|
| Excel 日期是数字（如 45887） | `new Date((excelDate - 25569) * 86400 * 1000)` |
| 电话号码格式不统一 | 正则提取数字，取 11 位 |
| 多人订单在同一行 | 检测"申请人 1/2/3"列名，拆分为多个 Applicant |
| 操作员/客服姓名需映射到 User | 预建姓名→userId 映射表 |
| 退款/取消订单 | 检测备注中的"退款"/"取消"关键词，标记状态 |

### M5-14：财务自动计算

#### 4.14.1 计算函数

**文件**: `src/lib/utils.ts` — 新增

```typescript
/**
 * 计算平台费用
 */
export function calcPlatformFee(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100
}

/**
 * 计算毛利
 */
export function calcGrossProfit(order: {
  amount: number
  platformFeeRate?: number | null
  visaFee?: number | null
  insuranceFee?: number | null
  rejectionInsurance?: number | null
  reviewBonus?: number | null
}): number {
  const platformFee = calcPlatformFee(order.amount, order.platformFeeRate ?? 0)
  const total = platformFee
    + (order.visaFee ?? 0)
    + (order.insuranceFee ?? 0)
    + (order.rejectionInsurance ?? 0)
    + (order.reviewBonus ?? 0)
  return Math.round((order.amount - total) * 100) / 100
}
```

#### 4.14.2 自动触发时机

| 时机 | 操作 |
|---|---|
| 创建订单时 | 自动计算 `platformFee` 和 `grossProfit` |
| 更新财务字段时 | 重新计算 `grossProfit` |
| 导入历史数据时 | 批量计算 |

---

## 5. 数据库变更全量清单

### 5.1 新建表

| 表名 | 说明 |
|---|---|
| `erp_applicants` | 申请人表 |

### 5.2 修改表

**`erp_orders` 新增字段**：

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| applicant_count | INT | 1 | 申请人数 |
| contact_name | VARCHAR(50) | NULL | 联系人 |
| target_city | VARCHAR(50) | NULL | 送签城市 |
| submitted_at | DATETIME | NULL | 递交时间 |
| visa_result_at | DATETIME | NULL | 最后出签时间 |
| platform_fee_rate | DECIMAL(5,4) | NULL | 扣点费率 |
| platform_fee | DECIMAL(10,2) | NULL | 平台费用 |
| visa_fee | DECIMAL(10,2) | NULL | 签证费 |
| insurance_fee | DECIMAL(10,2) | NULL | 保险费 |
| rejection_insurance | DECIMAL(10,2) | NULL | 拒签保险 |
| review_bonus | DECIMAL(10,2) | NULL | 好评返现 |
| gross_profit | DECIMAL(10,2) | NULL | 毛利 |

### 5.3 枚举扩展

**`OrderStatus`** 新增: `PARTIAL`

**新建枚举** `VisaResult`: `APPROVED`, `REJECTED`

---

## 6. API 端点全量清单

### 6.1 新增端点

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| PATCH | `/api/applicants/[id]` | Lv5-7 | 更新申请人结果/资料状态 |
| GET | `/api/analytics/overview` | Lv1-3,5 | 核心指标概览 |
| GET | `/api/analytics/trend` | Lv1-3,5 | 月度趋势数据 |
| GET | `/api/analytics/workload` | Lv1-3,5 | 人员负荷/绩效 |
| GET | `/api/analytics/export` | Lv1-3,5 | Excel 导出 |

### 6.2 修改端点

| 方法 | 路径 | 变更 |
|---|---|---|
| POST | `/api/orders` | 新增 applicants 数组 + 财务字段 + contactName + targetCity |
| GET | `/api/orders/[id]` | include 新增 applicants |
| POST | `/api/orders/[id]/status` | 终态判断逻辑扩展（PARTIAL） |

---

## 7. 前端页面变更清单

### 7.1 新增页面/组件

| 文件 | 说明 |
|---|---|
| `src/components/orders/applicant-card.tsx` | 申请人卡片组件 |
| `src/components/orders/applicant-form.tsx` | 申请人表单组件（创建订单用） |
| `src/components/analytics/trend-chart.tsx` | 月度趋势折线图 |
| `src/components/analytics/country-pie.tsx` | 国家分布饼图 |
| `src/components/analytics/gauge-chart.tsx` | 出签率仪表盘 |
| `src/components/analytics/stat-card.tsx` | 指标卡片 |
| `src/components/analytics/ranking-table.tsx` | 绩效排行表格 |
| `src/app/api/applicants/[id]/route.ts` | 申请人结果 API |
| `src/app/api/analytics/overview/route.ts` | 概览 API |
| `src/app/api/analytics/trend/route.ts` | 趋势 API |
| `src/app/api/analytics/workload/route.ts` | 人员负荷 API |
| `src/app/api/analytics/export/route.ts` | 导出 API |
| `scripts/import-excel.ts` | 历史数据导入脚本 |

### 7.2 修改页面/组件

| 文件 | 变更 |
|---|---|
| `src/app/admin/orders/page.tsx` | 创建订单表单：申请人动态列表 + 财务字段 |
| `src/app/admin/orders/[id]/page.tsx` | 详情页新增申请人卡片区域 + 结果标记按钮 |
| `src/app/admin/analytics/page.tsx` | 完全重写为数据看板 |
| `src/components/documents/document-panel.tsx` | 支持按申请人分组展示（applicantCount > 1 时） |
| `src/types/order.ts` | 新增 Applicant/VisaResult 类型 + Order 扩展字段 |
| `src/lib/transition.ts` | 新增 checkOrderFinalStatus + PARTIAL 规则 |
| `src/lib/utils.ts` | 新增 calcPlatformFee/calcGrossProfit |

---

## 8. 类型定义变更

### 8.1 `src/types/order.ts` 新增

```typescript
export type VisaResult = 'APPROVED' | 'REJECTED'

export interface Applicant {
  id: string
  orderId: string
  name: string
  phone: string | null
  passportNo: string | null
  passportExpiry: string | null
  visaResult: VisaResult | null
  visaResultAt: string | null
  visaResultNote: string | null
  documentsComplete: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}
```

### 8.2 `src/types/order.ts` Order 接口扩展

```typescript
export interface Order {
  // 现有字段...

  // 新增
  applicantCount: number
  contactName: string | null
  targetCity: string | null
  submittedAt: string | null
  visaResultAt: string | null
  platformFeeRate: string | null
  platformFee: string | null
  visaFee: string | null
  insuranceFee: string | null
  rejectionInsurance: string | null
  reviewBonus: string | null
  grossProfit: string | null
}

export interface OrderDetail extends Order {
  // 现有字段...
  applicants: Applicant[]  // 新增
}
```

### 8.3 OrderStatus 扩展

```typescript
export type OrderStatus =
  | 'PENDING_CONNECTION'
  | 'CONNECTED'
  | 'COLLECTING_DOCS'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'MAKING_MATERIALS'
  | 'PENDING_DELIVERY'
  | 'DELIVERED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PARTIAL'           // 新增

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  // 现有...
  PARTIAL: '部分出签',   // 新增
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  // 现有...
  PARTIAL: '#C4A97D',   // 新增（莫兰迪黄）
}
```

---

## 9. 开发环境启动

```bash
cd erp-project

# 确保依赖已安装
npm install

# 数据库迁移
npx prisma migrate dev --name add_applicant_and_order_extensions

# 重新生成 Prisma Client
npx prisma generate

# 类型检查
npx tsc --noEmit

# 启动开发服务器
npm run dev
```

---

## 10. 验收标准

### Phase A 验收

- [ ] 创建订单时可添加多个申请人（至少 1 人）
- [ ] 订单详情展示所有申请人卡片
- [ ] 可标记每个申请人的出签/拒签结果
- [ ] 全部出签 → 订单状态 APPROVED
- [ ] 全部拒签 → 订单状态 REJECTED
- [ ] 有人出签有人拒签 → 订单状态 PARTIAL
- [ ] 资料收集面板按申请人分组显示
- [ ] tsc 0 错误 + build 通过

### Phase B 验收

- [ ] 数据看板页面加载核心指标
- [ ] 月度趋势折线图正确显示
- [ ] 国家分布饼图正确显示
- [ ] 客服/操作员绩效排行榜正确排序
- [ ] 筛选器切换后图表刷新
- [ ] tsc 0 错误 + build 通过

### Phase C 验收

- [ ] Excel 导出文件可正常打开
- [ ] 导出列结构与手工表完全一致
- [ ] 多人订单行合并显示正确
- [ ] 历史数据导入后数据库记录数与 Excel 行数一致
- [ ] 导入数据的金额/财务计算正确
- [ ] tsc 0 错误 + build 通过

---

*文档结束 — M5 全知手册*
