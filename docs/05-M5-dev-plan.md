# 华夏签证 ERP - M5 全知开发手册（最终版）

> **文档版本**: V13.0
> **更新日期**: 2026-03-30 02:30
> **用途**: M5 阶段唯一开发指南。即使丢失所有上下文，拿到本文件 + Git 仓库即可完整恢复开发。
> **前置条件**: M1 + M2 全部完成（119 源文件 / ~13,757 行 / 39 API 路由 / 18 页面 / 25 组件）
> **数据基础**: 基于用户实际 Excel 统计表深度分析（15 个工作表 / 2718 数据行 / 330 单月订单）

---

## 目录

1. [M5 总览](#1-m5-总览)
2. [Excel 实际数据分析](#2-excel-实际数据分析)
3. [架构决策（10 项）](#3-架构决策)
4. [Phase A：多申请人（M5-1 ~ M5-5）](#4-phase-a多申请人)
5. [Phase B：数据看板（M5-6 ~ M5-10）](#5-phase-b数据看板)
6. [Phase C：导出与迁移（M5-11 ~ M5-14）](#6-phase-c导出与迁移)
7. [文件变更全量清单](#7-文件变更全量清单)
8. [执行计划（8 批次）](#8-执行计划)
9. [验收标准](#9-验收标准)
10. [风险矩阵](#10-风险矩阵)

---

## 1. M5 总览

### 1.1 目标

| 目标 | 说明 |
|---|---|
| 多申请人支持 | 一个订单支持 1~N 个申请人，每人独立跟踪资料和出签结果 |
| 财务统计 | 自动计算平台费、毛利，替代手工 Excel |
| 数据看板 | 月度趋势、国家分布、出签率、绩效排行等图表 |
| Excel 导出 | 完全对齐现有手工表 23 列格式，支持多人行合并 |
| 历史数据迁移 | 将 15 个月手工 Excel (~2718 条) 批量导入 ERP |

### 1.2 当前项目状态

| 维度 | 状态 |
|---|---|
| M1 基础架构 | ✅ 100% |
| M2 核心工作流 | ✅ 100% (19/19) |
| M3 文件与客户端 | ✅ 100%（全部8批次完成） |
| M5 多申请人+看板 | ✅ 100% (全部8批次完成) |

### 1.3 关键文件位置

```
erp-project/
├── prisma/schema.prisma
├── src/
│   ├── types/order.ts
│   ├── lib/transition.ts
│   ├── lib/utils.ts
│   ├── lib/events.ts
│   ├── lib/rbac.ts
│   ├── lib/desensitize.ts
│   ├── components/
│   │   ├── orders/status-badge.tsx
│   │   ├── orders/applicant-card.tsx        ← 新建
│   │   ├── orders/applicant-form-item.tsx   ← 新建
│   │   ├── documents/document-panel.tsx
│   │   └── analytics/                       ← 新建目录
│   ├── app/
│   │   ├── api/orders/route.ts
│   │   ├── api/orders/[id]/route.ts
│   │   ├── api/orders/[id]/cancel/route.ts
│   │   ├── api/applicants/[id]/route.ts     ← 新建
│   │   ├── api/analytics/                   ← 新建目录
│   │   ├── admin/orders/page.tsx
│   │   ├── admin/orders/[id]/page.tsx
│   │   └── admin/analytics/page.tsx
│   ├── stores/order-store.ts
│   └── middleware.ts
├── scripts/import-excel.ts                  ← 新建
└── docs/05-M5-dev-plan.md                   ← 本文件
```

---

## 2. Excel 实际数据分析

> 基于用户上传的真实 Excel 文件（`签证统计表2026.3.xlsx`，5.5MB）的深度探针分析。

### 2.1 文件结构

| 维度 | 值 |
|---|---|
| 工作表数 | 15 个（2025年1月 ~ 2026年3月） |
| 总数据行 | 2,718 行 |
| 最大表 | 2026年3月 - 493行 × 23列（当前工作表） |
| 有效订单（2026.3） | ~330 单 / 471 个申请人 |

### 2.2 最新表（2026年3月）列结构

```
第 1 行: 合并标题 "2026年3月签证统计表"（非表头，跳过）
第 2 行: 真正的表头（从这行读取）
第 3 行起: 数据

A: 序号
B: 联系人
C: 申请人
D: 手机号
E: 国家
F: 城市
G: 套餐
H: 备注/预计出行/邮箱等
I: 下单时间
J: 接待客服
K: 资料收集
L: 平台进度更新
M: 递交日期
N: 出签时间
O: 操作专员
P: 订单编号
Q: 订单金额
R: 支付方式
S: 平台扣点
T: 平台费用
U: 签证费(澳签/英签等）
V: 申根保险费用
W: 拒签保险
```

### 2.3 关键发现

#### 发现 1：多人订单通过合并单元格实现（33.5%）

Excel 中多人订单的实现方式：联系人/国家/金额等共享字段做**合并单元格**，申请人列每人一行。

```
行3: 联系人="孙婕"  申请人="孙婕"  手机号="134..."  国家="英国"  金额="6464"
行4: 联系人=""       申请人="龚佳豪" 手机号=""        国家=""       金额=""
行5: 联系人=""       申请人="龚再权" 手机号=""        国家=""       金额=""
```

多人分布：2人×90, 3人×12, 4人×6, 5人×1, 8人×1

#### 发现 2：没有出签结果列

最新表（2026.3）**已删除"签OR拒签"列**。只有"平台进度更新"列有"✅"标记表示已递交，无出签/拒签字段。

#### 发现 3：日期是 Excel 序列号

```
下单时间 = 45784  →  Excel 日期序列号
递交日期 = 46006.5625  →  含小数（精确到小时）
转换公式: new Date((excelDate - 25569) * 86400000)
```

#### 发现 4：平台扣点格式不统一

| 格式 | 出现次数 | 示例 |
|---|---|---|
| 数字小数 | 260 次 | `0.061`, `0.073` |
| 百分比文本 | 4 次 | `6.1%` |
| 零值 | 1 次 | `0` |

#### 发现 5：支付方式 13 种，需标准化

实际取值：支付宝(265), 信用支付(21), 花呗支付(21), 花呗(8), 盼达二维码(9), 华夏二维码(5), 分期购(2), 企业二维码(2), 小红书(1), 企业微信收(1), 华夏收款码(1), 华夏企业微信(1), 生哥现收(1)

#### 发现 6：资料员用昵称

实际取值：蒋(214), 张(191), 杨(47), 黄(7), 黄杰(4), 张+解释信(3), 蒋+算保险(2)...

#### 发现 7：订单号可能有多个（换行分隔）

多人订单的订单号列：`"4663399970934521204\n4681835461553521204\n4681638937960521204"`

#### 发现 8：各月表头不完全一致

- 1月表有 28 列，格式完全不同（含"进件时间"/"预计出行"/"签OR拒签"等独特列）
- 8-9月表只有 21 列，缺少签证费/保险列
- 10月表有分组表头："基本情况" / "订单进度" / "订单金额" / "订单成本"
- 11-12月和2026.1-3月表基本一致（23列）

### 2.4 ERP 与 Excel 的字段映射

| Excel 列 | ERP 字段 | 说明 |
|---|---|---|
| A 序号 | - | 不导入（ERP 自动生成） |
| B 联系人 | `Order.contactName` | 多人订单合并单元格，取第一行 |
| C 申请人 | `Applicant.name` | 每行一个申请人 |
| D 手机号 | `Order.customerPhone` | 取第一行（联系人手机） |
| E 国家 | `Order.targetCountry` | 合并单元格，取第一行 |
| F 城市 | `Order.targetCity` | 合并单元格，取第一行 |
| G 套餐 | `Order.visaCategory` | 合并单元格，取第一行 |
| H 备注 | `Order.remark` | 合并单元格，取第一行 |
| I 下单时间 | `Order.createdAt` | Excel 序列号 → JS Date |
| J 接待客服 | `Order.createdBy` → User.realName 映射 | |
| K 资料收集 | `Order.collectorId` → User.realName 映射 | 昵称→全名 |
| L 平台进度更新 | - | 仅 ✅ 标记，不映射到状态 |
| M 递交日期 | `Order.submittedAt` | Excel 序列号（含小数） |
| N 出签时间 | `Applicant.visaResultAt` | 最新表此列为空（无出签结果） |
| O 操作专员 | `Order.operatorId` → User.realName 映射 | |
| P 订单编号 | `Order.externalOrderNo` | 多个时取第一个 |
| Q 订单金额 | `Order.amount` | 合并单元格，取第一行 |
| R 支付方式 | `Order.paymentMethod` | 需标准化（13种→5种） |
| S 平台扣点 | `Order.platformFeeRate` | 文本"6.1%"→0.061 |
| T 平台费用 | `Order.platformFee` | 合并单元格，取第一行 |
| U 签证费 | `Order.visaFee` | 8-9月此列缺失→NULL |
| V 申根保险 | `Order.insuranceFee` | 8-9月此列缺失→NULL |
| W 拒签保险 | `Order.rejectionInsurance` | 8-9月此列缺失→NULL |

### 2.5 支付方式标准化

| ERP 标准值 | Excel 实际取值 |
|---|---|
| `ALIPAY` | "支付宝" |
| `HUABEI` | "花呗", "花呗支付" |
| `CREDIT` | "信用支付", "分期购" |
| `WECHAT` | "盼达二维码", "华夏二维码", "华夏收款码", "企业二维码", "华夏企业微信", "企业微信收", "小红书" |
| `CASH` | "生哥现收" |

### 2.6 导入策略

| 策略 | 说明 |
|---|---|
| 标准模板 | 以最新表（2026.3）的 23 列为标准 |
| 表头行 | 第 2 行（第 1 行是标题，跳过） |
| 多人检测 | B 列合并单元格范围 = 同一订单的多行 |
| 日期转换 | Excel 序列号 → JS Date（注意含小数的递交日期） |
| 扣点转换 | 文本"6.1%" → 数字 0.061 |
| 缺失列 | 8-9月无财务列 → 字段留 NULL |
| 异常表 | "1月（已统计）"格式完全不同 → 跳过或单独处理 |
| 订单号 | 多个换行分隔 → 取第一个 |
| dry-run | 先预览再写入，用户确认后执行 |

---

## 3. 架构决策

### 决策 1：PARTIAL 状态不走 `transitionOrder()`

`transitionOrder()` 是用户驱动的状态变更，有角色校验和规则匹配。PARTIAL 是系统副作用（最后一个 Applicant 结果写入时自动判断），设计为独立函数 `autoResolveOrderStatus()`。

```typescript
// transition.ts - 新增，不修改 transitionOrder()
export async function autoResolveOrderStatus(
  tx: Prisma.TransactionClient,
  orderId: string,
  companyId: string,
  actorId: string
): Promise<OrderStatus | null>

// TRANSITION_RULES 只加 2 条手动推进规则
{ from: 'PARTIAL', to: 'APPROVED', allowedRoles: ['COMPANY_OWNER', 'VISA_ADMIN'] }
{ from: 'PARTIAL', to: 'REJECTED', allowedRoles: ['COMPANY_OWNER', 'VISA_ADMIN'] }
```

### 决策 2：`Order.customerName` = 联系人，`Applicant.name` = 申请人

手工表中"联系人"和"申请人"是不同列。一个联系人可对应多个申请人（如家长帮孩子办签证）。

- `Order.contactName`（新增）= 联系人（默认等于 `customerName`）
- `Applicant` 子表 = 每个实际申请人
- 不传 `applicants` 时，自动从 `customerName` 创建 1 个 Applicant

### 决策 3：创建订单 API 向后兼容

`applicants` 字段为 optional。不传 = 旧模式（自动从 customerName 创建 1 人）。现有前端零修改即可工作。

### 决策 4：趋势查询用原生 SQL

15 个月 × 每月独立 `findMany` = 15 次查询。用 `GROUP BY DATE_FORMAT(created_at, '%Y-%m')` 一次搞定。概览和人员负荷用 Prisma `findMany` + 内存聚合（单月 ~300 条，足够快）。

### 决策 5：类型变更执行顺序

```
types/order.ts → schema.prisma → prisma migrate → transition.ts → API → stores → components
```

每步有 TypeScript 编译器校验，保证类型安全。

### 决策 6：cancel API 自动兼容 PARTIAL

PARTIAL 不在 `['APPROVED', 'REJECTED']` 终态列表中，cancel API 的 `if (['APPROVED', 'REJECTED'].includes(status))` 检查自动放行 PARTIAL。无需改代码。

### 决策 7：中间件无需修改

新 API 路由（`/api/applicants/*`, `/api/analytics/*`）都需鉴权，中间件自动处理。

### 决策 8：rbac.ts 无需修改

已有 `analytics: read` 权限（Lv1-3,5）。新增的 `applicants` API 走 `orders: transition` 权限。

### 决策 9：申请人卡片放在详情页左栏

在"客户信息"卡片之后、"签证信息"之前插入。因为它本质上是客户信息的多申请人扩展。

### 决策 10：看板页面完全重写

当前 `analytics/page.tsx` 是占位页，直接重写为完整数据看板。

---

## 4. Phase A：多申请人

### M5-1：数据模型 + Schema + 迁移

#### 4.1.1 修改 `prisma/schema.prisma`

**新增枚举**：
```prisma
enum VisaResult {
  APPROVED
  REJECTED
}
```

**OrderStatus 枚举扩展**：
```prisma
enum OrderStatus {
  // 现有 10 个值...
  PARTIAL             // 部分出签
}
```

**新增 Model**：
```prisma
model Applicant {
  id                String      @id @default(cuid())
  orderId           String      @map("order_id")
  companyId         String      @map("company_id")
  name              String      @db.VarChar(50)
  phone             String?     @db.VarChar(20)
  passportNo        String?     @db.VarChar(20) @map("passport_no")
  passportExpiry    DateTime?   @map("passport_expiry")
  visaResult        VisaResult? @map("visa_result")
  visaResultAt      DateTime?   @map("visa_result_at")
  visaResultNote    String?     @db.Text @map("visa_result_note")
  documentsComplete Boolean     @default(false) @map("documents_complete")
  sortOrder         Int         @default(0) @map("sort_order")
  createdAt         DateTime    @default(now()) @map("created_at")
  updatedAt         DateTime    @updatedAt @map("updated_at")

  order             Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([companyId])
  @@map("erp_applicants")
}
```

**Order Model 扩展**（12 个可选字段 + 1 个关联）：
```prisma
model Order {
  // ...现有字段不变...

  // 多申请人
  applicantCount     Int       @default(1) @map("applicant_count")
  contactName        String?   @db.VarChar(50) @map("contact_name")
  targetCity         String?   @db.VarChar(50) @map("target_city")

  // 流程时间线
  submittedAt        DateTime? @map("submitted_at")
  visaResultAt       DateTime? @map("visa_result_at")

  // 财务
  platformFeeRate    Decimal?  @db.Decimal(5,4) @map("platform_fee_rate")
  platformFee        Decimal?  @db.Decimal(10,2) @map("platform_fee")
  visaFee            Decimal?  @db.Decimal(10,2) @map("visa_fee")
  insuranceFee       Decimal?  @db.Decimal(10,2) @map("insurance_fee")
  rejectionInsurance Decimal?  @db.Decimal(10,2) @map("rejection_insurance")
  reviewBonus        Decimal?  @db.Decimal(10,2) @map("review_bonus")
  grossProfit        Decimal?  @db.Decimal(10,2) @map("gross_profit")

  // 关联
  applicants         Applicant[]

  @@index([companyId, status])
}
```

#### 4.1.2 运行迁移

```bash
npx prisma migrate dev --name add_applicant_and_order_extensions
npx prisma generate
npx tsc --noEmit  # 确认零错误
```

#### 4.1.3 修改 `src/types/order.ts`

```typescript
// 新增类型
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

// OrderStatus 加 PARTIAL
export type OrderStatus =
  | 'PENDING_CONNECTION' | 'CONNECTED' | 'COLLECTING_DOCS'
  | 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'MAKING_MATERIALS'
  | 'PENDING_DELIVERY' | 'DELIVERED' | 'APPROVED' | 'REJECTED'
  | 'PARTIAL'

// ORDER_STATUS_LABELS 加
PARTIAL: '部分出签'

// ORDER_STATUS_COLORS 加
PARTIAL: '#C4A97D'

// Order 接口扩展
export interface Order {
  // ...现有字段...
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

// OrderDetail 加 applicants
export interface OrderDetail extends Order {
  // ...现有字段...
  applicants: Applicant[]
}

// CreateOrderPayload 扩展
export interface CreateOrderPayload {
  // ...现有字段...
  applicants?: Array<{ name: string; phone?: string; passportNo?: string }>
  contactName?: string
  targetCity?: string
  platformFeeRate?: number
  visaFee?: number
  insuranceFee?: number
  rejectionInsurance?: number
  reviewBonus?: number
}
```

#### 4.1.4 修改 `src/lib/events.ts`

```typescript
const STATUS_LABELS: Record<string, string> = {
  // ...现有...
  PARTIAL: '部分出签',
}
```

#### 4.1.5 修改 `src/components/orders/status-badge.tsx`

```typescript
const STATUS_VARIANTS: Record<OrderStatus, ...> = {
  // ...现有...
  PARTIAL: 'warning',
}
```

---

### M5-2：创建订单（多人支持）

#### 4.2.1 修改 `POST /api/orders`（`src/app/api/orders/route.ts`）

**schema 扩展**（所有新字段 optional，向后兼容）：
```typescript
const createSchema = z.object({
  // 现有字段不变...
  customerName: z.string().min(1).max(50),
  customerPhone: z.string().regex(/^1[3-9]\d{9}$/),
  // ...

  // 新增
  applicants: z.array(z.object({
    name: z.string().min(1).max(50),
    phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
    passportNo: z.string().max(20).optional(),
  })).min(1).optional(),

  contactName: z.string().max(50).optional(),
  targetCity: z.string().max(50).optional(),
  platformFeeRate: z.number().min(0).max(1).optional(),
  visaFee: z.number().optional(),
  insuranceFee: z.number().optional(),
  rejectionInsurance: z.number().optional(),
  reviewBonus: z.number().optional(),
})
```

**事务内新增逻辑**：
```typescript
// 兼容层：不传 applicants → 自动创建 1 人
const applicantList = data.applicants ?? [{
  name: data.customerName,
  phone: data.customerPhone,
  passportNo: data.passportNo ?? undefined,
}]

// 创建 Order 时加新字段
const order = await tx.order.create({
  data: {
    // ...所有现有字段不变...
    applicantCount: applicantList.length,
    contactName: data.contactName ?? data.customerName,
    targetCity: data.targetCity ?? null,
    platformFeeRate: data.platformFeeRate ?? 0.061,
    platformFee: calcPlatformFee(data.amount, data.platformFeeRate ?? 0.061),
    visaFee: data.visaFee ?? null,
    insuranceFee: data.insuranceFee ?? null,
    rejectionInsurance: data.rejectionInsurance ?? null,
    reviewBonus: data.reviewBonus ?? null,
    grossProfit: calcGrossProfit({
      amount: data.amount,
      platformFeeRate: data.platformFeeRate ?? 0.061,
      visaFee: data.visaFee,
      insuranceFee: data.insuranceFee,
      rejectionInsurance: data.rejectionInsurance,
      reviewBonus: data.reviewBonus,
    }),
  },
})

// 创建 Applicant
await tx.applicant.createMany({
  data: applicantList.map((a, i) => ({
    orderId: order.id,
    companyId: user.companyId,
    name: a.name,
    phone: a.phone ?? null,
    passportNo: a.passportNo ?? null,
    sortOrder: i,
  })),
})
```

#### 4.2.2 修改创建订单表单（`src/app/admin/orders/page.tsx`）

**CreateOrderModal 改动**：
- "客户信息"区块改为"联系人信息"（字段不变）
- 新增"申请人列表"区块（动态增删表单，至少 1 人）
- "订单信息"区块新增"送签城市"
- 新增"财务明细"区块（扣点费率下拉 + 自动计算 + 签证费/保险/好评返现）

```tsx
// 申请人动态列表状态
const [applicants, setApplicants] = useState([
  { name: '', phone: '', passportNo: '' }
])

const addApplicant = () => {
  setApplicants([...applicants, { name: '', phone: '', passportNo: '' }])
}

const removeApplicant = (index: number) => {
  if (applicants.length <= 1) return
  setApplicants(applicants.filter((_, i) => i !== index))
}
```

#### 4.2.3 新建 `src/components/orders/applicant-form-item.tsx`

单个申请人表单项组件，接收 index/applicant/onChange/onRemove props。

---

### M5-3：资料收集面板（按人分组）

#### 4.3.1 修改 `src/components/documents/document-panel.tsx`

**策略**：当 `applicantCount > 1` 时按申请人分组展示；`applicantCount === 1` 时保持现有平铺展示。

```
┌─ 资料清单 ──────────────────────────────────────┐
│ 总进度: 8/12 项合格                               │
│                                                   │
│ ┌─ 张三 ───────── 进度: 3/4 ── [收集中] ──┐     │
│ │ ✅ 护照    ✅ 照片    ✅ 在职证明         │     │
│ │ ❌ 银行流水  需补充近6个月                │     │
│ │    [📁上传] [📷拍照]                     │     │
│ └──────────────────────────────────────────┘     │
│                                                   │
│ ┌─ 李四 ───────── 进度: 3/4 ── [收集中] ──┐     │
│ │ ...                                         │     │
│ └──────────────────────────────────────────┘     │
│                                                   │
│ [+ 添加资料项]     [提交审核] ← 全部齐全才可点    │
└───────────────────────────────────────────────────┘
```

**注意**：M5 阶段不在 DocumentRequirement 上绑定 applicantId（保持简单）。分组仅在前端展示层面实现。详细的按人分配资料留到 M6。

---

### M5-4：订单详情（申请人卡片）

#### 4.4.1 修改 `GET /api/orders/[id]`（`src/app/api/orders/[id]/route.ts`）

```typescript
include: {
  // 现有...
  applicants: {
    orderBy: { sortOrder: 'asc' },
  },
  // 现有...
}
```

#### 4.4.2 新建 `src/components/orders/applicant-card.tsx`

```tsx
interface ApplicantCardProps {
  applicant: Applicant
  canMarkResult: boolean
  onResultChange?: (id: string, result: VisaResult, note?: string) => void
}

export function ApplicantCard({ applicant, canMarkResult, onResultChange }: ApplicantCardProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/15
                        flex items-center justify-center text-xs font-medium">
          {applicant.name[0]}
        </div>
        <div>
          <div className="text-sm font-medium">{applicant.name}</div>
          <div className="text-xs text-[var(--color-text-placeholder)]">
            {applicant.phone ?? '无手机号'}
            {applicant.passportNo && ` · 护照 ${applicant.passportNo}`}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={applicant.documentsComplete ? 'success' : 'warning'} size="sm">
          {applicant.documentsComplete ? '资料齐全' : '收集中'}
        </Badge>
        {applicant.visaResult === 'APPROVED' && <Badge variant="success" size="sm">出签 ✅</Badge>}
        {applicant.visaResult === 'REJECTED' && <Badge variant="danger" size="sm">拒签 ❌</Badge>}
        {!applicant.visaResult && canMarkResult && (
          <div className="flex gap-1">
            <button onClick={() => onResultChange?.(applicant.id, 'APPROVED')}
              className="text-xs px-2 py-1 rounded bg-[var(--color-success)]/15 text-[var(--color-success)]">
              出签
            </button>
            <button onClick={() => onResultChange?.(applicant.id, 'REJECTED')}
              className="text-xs px-2 py-1 rounded bg-[var(--color-error)]/15 text-[var(--color-error)]">
              拒签
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

#### 4.4.3 修改订单详情页（`src/app/admin/orders/[id]/page.tsx`）

- 在"客户信息"卡片之后插入"申请人卡片"区域
- `getAvailableActions` switch-case 加 PARTIAL case
- 添加申请人结果标记逻辑

```typescript
// getAvailableActions 新增
case 'PARTIAL':
  if (['COMPANY_OWNER', 'VISA_ADMIN'].includes(role)) {
    actions.push({ toStatus: 'APPROVED', label: '确认全部出签' })
    actions.push({ toStatus: 'REJECTED', label: '确认全部拒签' })
  }
  break
```

---

### M5-5：状态流转（多人结果判断）

#### 4.5.1 修改 `src/lib/transition.ts`

**新增 `autoResolveOrderStatus` 函数**（独立于 `transitionOrder`）：

```typescript
export async function autoResolveOrderStatus(
  tx: Prisma.TransactionClient,
  orderId: string,
  companyId: string,
  actorId: string
): Promise<{ updated: boolean; newStatus: OrderStatus | null }> {
  const applicants = await tx.applicant.findMany({
    where: { orderId },
    select: { visaResult: true, name: true },
  })

  if (applicants.some(a => a.visaResult === null)) {
    return { updated: false, newStatus: null }
  }

  const allApproved = applicants.every(a => a.visaResult === 'APPROVED')
  const allRejected = applicants.every(a => a.visaResult === 'REJECTED')
  const newStatus: OrderStatus = allApproved ? 'APPROVED'
    : allRejected ? 'REJECTED'
    : 'PARTIAL'

  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  })

  await tx.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      visaResultAt: new Date(),
      completedAt: newStatus !== 'PARTIAL' ? new Date() : null,
    },
  })

  await tx.orderLog.create({
    data: {
      orderId, companyId, userId: actorId,
      action: allApproved ? '全部出签' : allRejected ? '全部拒签' : '部分出签',
      fromStatus: order!.status,
      toStatus: newStatus,
      detail: applicants.map(a =>
        `${a.name}: ${a.visaResult === 'APPROVED' ? '出签' : '拒签'}`
      ).join('；'),
    },
  })

  return { updated: true, newStatus }
}
```

**扩展 TRANSITION_RULES**（2 条）：
```typescript
{
  from: 'PARTIAL',
  to: 'APPROVED',
  allowedRoles: ['COMPANY_OWNER', 'VISA_ADMIN'],
  action: '确认全部出签',
},
{
  from: 'PARTIAL',
  to: 'REJECTED',
  allowedRoles: ['COMPANY_OWNER', 'VISA_ADMIN'],
  action: '确认全部拒签',
},
```

#### 4.5.2 新建 `PATCH /api/applicants/[id]`（`src/app/api/applicants/[id]/route.ts`）

```typescript
const updateSchema = z.object({
  visaResult: z.enum(['APPROVED', 'REJECTED']).optional(),
  visaResultNote: z.string().optional(),
  documentsComplete: z.boolean().optional(),
})

export async function PATCH(request, { params }) {
  // 1. 认证 + 权限
  const user = await getCurrentUser(request)
  if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
  requirePermission(user, 'orders', 'transition')

  // 2. 查找 applicant（校验 companyId）
  const applicant = await prisma.applicant.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: { order: { select: { id: true, companyId: true, status: true } } },
  })
  if (!applicant) throw new AppError('NOT_FOUND', '申请人不存在', 404)

  // 3. 事务内更新 + 自动判断终态
  await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {}
    if (data.visaResult !== undefined) {
      updateData.visaResult = data.visaResult
      updateData.visaResultAt = new Date()
    }
    if (data.visaResultNote !== undefined) updateData.visaResultNote = data.visaResultNote ?? null
    if (data.documentsComplete !== undefined) updateData.documentsComplete = data.documentsComplete

    await tx.applicant.update({ where: { id: params.id }, data: updateData })

    if (data.visaResult !== undefined) {
      await autoResolveOrderStatus(tx, applicant.order.id, user.companyId, user.userId)
    }

    await tx.orderLog.create({
      data: {
        orderId: applicant.order.id,
        companyId: user.companyId,
        userId: user.userId,
        action: data.visaResult
          ? `${applicant.name} ${data.visaResult === 'APPROVED' ? '出签' : '拒签'}`
          : `${applicant.name} 资料${data.documentsComplete ? '齐全' : '待补充'}`,
      },
    })
  })

  return NextResponse.json(createSuccessResponse({ message: '已更新' }))
}
```

---

## 5. Phase B：数据看板

### M5-6：分析 API

#### 5.6.1 概览 API - `GET /api/analytics/overview?month=2026-03`

权限：`requirePermission(user, 'analytics', 'read')`（Lv1-3,5，rbac.ts 已有）

```typescript
// Prisma findMany + 内存聚合（单月 ~300 条，足够快）
const orders = await prisma.order.findMany({
  where: {
    companyId: user.companyId,
    createdAt: { gte: monthStart, lte: monthEnd },
  },
  select: {
    status: true, amount: true, platformFee: true,
    visaFee: true, insuranceFee: true, grossProfit: true,
    createdAt: true, deliveredAt: true, targetCountry: true,
    paymentMethod: true, createdBy: true, operatorId: true,
  },
})
```

返回：
```json
{
  "totalOrders": 330,
  "totalApplicants": 471,
  "totalRevenue": 186500,
  "totalProfit": 62300,
  "profitRate": "33.4%",
  "inProgress": 144,
  "approved": 0,
  "rejected": 0,
  "byCountry": { "法国": 89, "澳洲": 76, "美国": 45, ... },
  "byPayment": { "支付宝": 265, "信用支付": 21, ... }
}
```

#### 5.6.2 趋势 API - `GET /api/analytics/trend?months=6`

**用原生 SQL GROUP BY**（1 次查询搞定多月聚合）：

```typescript
const raw = await prisma.$queryRaw`
  SELECT
    DATE_FORMAT(created_at, '%Y-%m') as month,
    COUNT(*) as orders,
    COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as revenue,
    COALESCE(SUM(CAST(gross_profit AS DECIMAL)), 0) as profit,
    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
    SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
  FROM erp_orders
  WHERE company_id = ${user.companyId}
    AND created_at >= ${startDate}
    AND created_at <= ${endDate}
  GROUP BY DATE_FORMAT(created_at, '%Y-%m')
  ORDER BY month ASC
`

// 注意：MySQL COUNT/SUM 返回 bigint，需要 Number() 转换
const data = raw.map(row => ({
  month: row.month,
  orders: Number(row.orders),
  revenue: Number(row.revenue),
  profit: Number(row.profit),
  approved: Number(row.approved),
  rejected: Number(row.rejected),
}))
```

#### 5.6.3 人员负荷 API - `GET /api/analytics/workload?month=2026-03`

```typescript
// 按 createdBy 分组统计客服绩效
// 按 operatorId 分组统计操作员绩效
// 按 collectorId → User.realName 映射统计资料员负荷
```

### M5-7 ~ M5-10：图表组件 + 看板页面

#### 新建组件

| 组件 | 文件 | 说明 |
|---|---|---|
| StatCard | `src/components/analytics/stat-card.tsx` | 核心指标卡片（数值+标签+图标） |
| TrendChart | `src/components/analytics/trend-chart.tsx` | 月度趋势折线图（recharts） |
| RankingTable | `src/components/analytics/ranking-table.tsx` | 绩效排行表格 |

#### 重写 `src/app/admin/analytics/page.tsx`

筛选器 + 核心指标卡片 + 趋势折线图 + 国家饼图 + 绩效排行榜 + 异常预警列表。

#### 安装依赖

```bash
npm install recharts
```

---

## 6. Phase C：导出与迁移

### M5-11：Excel 导出 API - `GET /api/analytics/export?month=2026-03&format=xlsx`

#### 列结构（23 列，完全对齐最新 Excel）

| 列 | 名称 | 数据来源 |
|---|---|---|
| A | 序号 | 自增 |
| B | 联系人 | `Order.contactName` |
| C | 申请人 | `Applicant.name`（多人换行） |
| D | 手机号 | `Order.customerPhone` |
| E | 国家 | `Order.targetCountry` |
| F | 城市 | `Order.targetCity` |
| G | 套餐 | `Order.visaCategory` |
| H | 备注/预计出行 | `Order.remark` + `travelDate` |
| I | 下单时间 | `Order.createdAt`（格式 MM.DD） |
| J | 接待客服 | `createdBy → User.realName` |
| K | 资料收集 | `collectorId → User.realName` |
| L | 平台进度更新 | `Order.status` 中文标签 |
| M | 递交日期 | `Order.submittedAt`（格式 YYYY.MM.DD） |
| N | 出签时间 | `Applicant.visaResultAt`（取最后时间） |
| O | 操作专员 | `operatorId → User.realName` |
| P | 订单编号 | `Order.externalOrderNo` |
| Q | 订单金额 | `Order.amount` |
| R | 支付方式 | `Order.paymentMethod` |
| S | 平台扣点 | `Order.platformFeeRate`（百分比格式） |
| T | 平台费用 | `Order.platformFee` |
| U | 签证费 | `Order.visaFee` |
| V | 申根保险 | `Order.insuranceFee` |
| W | 拒签保险 | `Order.rejectionInsurance` |

#### 多人行合并

```typescript
// 1. 先写数据行（共享字段只写第一行，后续行该列留空）
// 2. 再设置 ws['!merges']（顺序错误会导致合并失效）
// 3. 最后 XLSX.write()
```

### M5-12：多人订单行合并

在 M5-11 的导出逻辑中一并实现。

### M5-13：历史数据导入

#### 导入脚本 - `scripts/import-excel.ts`

```bash
npx tsx scripts/import-excel.ts ./签证统计表2026.3.xlsx
```

#### 核心算法

```typescript
// 1. 读取 Excel 所有工作表
// 2. 从第 2 行读表头（第 1 行是标题）
// 3. 列名模糊匹配（不要求精确匹配）
// 4. 检测 B 列合并单元格 → 识别多人订单
//    合并范围内的每行 = 一个 Applicant
//    其他合并列取第一行值
// 5. 月份名 → 日期推断（"2026年3月" → "2026-03"）
// 6. Excel 序列号 → JS Date 转换
// 7. 平台扣点 "6.1%" → 0.061
// 8. 支付方式标准化（13种 → 5种）
// 9. dry-run 输出预览（前 5 个订单）
// 10. 用户确认后写入数据库
```

#### 跳过规则

| 规则 | 说明 |
|---|---|
| "1月（已统计）" | 跳过（28 列，格式完全不同） |
| 8-9月 | 正常导入，财务字段留 NULL |
| 空行 | 跳过 |
| 汇总行 | 跳过（检测"合计"关键词） |

#### 客服/资料员姓名映射

导入前需要建立姓名→userId 映射表：

```typescript
const NAME_MAP: Record<string, string> = {
  '江敏': 'user_id_1',
  '廖琴': 'user_id_2',
  '黄杰': 'user_id_3',
  '蒋': 'user_id_4',   // 资料员昵称 → 全名
  '张': 'user_id_5',
  '杨': 'user_id_6',
  '黄': 'user_id_7',
  '吴韩億': 'user_id_8',
  '刘珊珊': 'user_id_9',
  '邓邓': 'user_id_10',
}
```

### M5-14：财务自动计算

在 `src/lib/utils.ts` 中新增：

```typescript
export function calcPlatformFee(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100
}

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

触发时机：创建订单时 / 更新财务字段时 / 导入历史数据时。

---

## 7. 文件变更全量清单

### 新建文件（12 个）

| # | 文件 | 说明 | 行数估计 |
|---|---|---|:---:|
| 1 | `src/app/api/applicants/[id]/route.ts` | 申请人结果更新 API | ~80 |
| 2 | `src/app/api/analytics/overview/route.ts` | 概览 API | ~60 |
| 3 | `src/app/api/analytics/trend/route.ts` | 趋势 API（原生 SQL） | ~70 |
| 4 | `src/app/api/analytics/workload/route.ts` | 人员负荷 API | ~70 |
| 5 | `src/app/api/analytics/export/route.ts` | Excel 导出 API | ~120 |
| 6 | `src/components/orders/applicant-card.tsx` | 申请人卡片组件 | ~80 |
| 7 | `src/components/orders/applicant-form-item.tsx` | 申请人表单项组件 | ~60 |
| 8 | `src/components/analytics/stat-card.tsx` | 指标卡片 | ~40 |
| 9 | `src/components/analytics/trend-chart.tsx` | 趋势折线图 | ~80 |
| 10 | `src/components/analytics/ranking-table.tsx` | 绩效排行表格 | ~60 |
| 11 | `scripts/import-excel.ts` | 历史数据导入脚本 | ~200 |
| 12 | `prisma/migrations/xxx/migration.sql` | 数据库迁移 | 自动生成 |

### 修改文件（13 个）

| # | 文件 | 变更 | 风险 |
|---|---|---|:---:|
| 1 | `prisma/schema.prisma` | +Applicant model, +Order 12字段, +PARTIAL枚举, +VisaResult枚举 | 🟡 |
| 2 | `src/types/order.ts` | +Applicant接口, +PARTIAL, +Order扩展字段, +LABELS/COLORS | 🟢 |
| 3 | `src/lib/transition.ts` | +autoResolveOrderStatus, +2条PARTIAL规则 | 🟡 |
| 4 | `src/lib/utils.ts` | +calcPlatformFee, +calcGrossProfit | 🟢 |
| 5 | `src/lib/events.ts` | +PARTIAL到STATUS_LABELS | 🟢 |
| 6 | `src/components/orders/status-badge.tsx` | +PARTIAL到STATUS_VARIANTS | 🟢 |
| 7 | `src/app/api/orders/route.ts` (POST) | +applicants可选, +财务计算, +创建Applicant | 🟡 |
| 8 | `src/app/api/orders/[id]/route.ts` (GET) | +include applicants | 🟢 |
| 9 | `src/app/api/orders/[id]/route.ts` (PATCH) | +财务字段白名单 | 🟢 |
| 10 | `src/app/admin/orders/page.tsx` | 创建表单加申请人动态列表+财务字段 | 🟡 |
| 11 | `src/app/admin/orders/[id]/page.tsx` | +申请人卡片, +PARTIAL case, +结果标记 | 🟡 |
| 12 | `src/app/admin/analytics/page.tsx` | 完全重写为数据看板 | 🟡 |
| 13 | `src/components/documents/document-panel.tsx` | applicantCount>1时分组展示 | 🟡 |

### 不需要改的文件

| 文件 | 理由 |
|---|---|
| `src/middleware.ts` | 新 API 都需鉴权，自动处理 |
| `src/lib/rbac.ts` | 已有 `analytics: read` 权限 |
| `src/lib/desensitize.ts` | 申请人数据不含敏感字段 |
| `src/stores/order-store.ts` | API 返回自动包含 applicants |
| `src/hooks/use-orders.ts` | 不涉及申请人逻辑 |
| `src/components/layout/sidebar.tsx` | 数据统计菜单已存在 |
| `src/app/admin/pool/page.tsx` | 公共池逻辑不变 |
| `src/app/admin/workspace/page.tsx` | 工作台逻辑不变 |
| `src/app/api/orders/[id]/claim/route.ts` | 接单逻辑不变 |
| `src/app/api/orders/[id]/cancel/route.ts` | PARTIAL 不在终态列表，自动兼容 |
| `src/app/api/orders/[id]/reassign/route.ts` | 转单逻辑不变 |
| `src/app/api/orders/[id]/status/route.ts` | PARTIAL 手动推进走此路径 |
| `src/app/customer/orders/page.tsx` | M5 不改客户端 |

---

## 8. 执行计划

```
批次 1 ✅ - 类型+Schema+迁移（2h）
  ├── src/types/order.ts         +Applicant +PARTIAL +Order扩展
  ├── prisma/schema.prisma       +Model +Fields +Enums
  ├── prisma migrate (SQL已生成，部署时执行)
  ├── src/lib/events.ts          +PARTIAL label
  └── src/components/orders/status-badge.tsx  +PARTIAL variant
  验收: npx tsc --noEmit = 0 错误 ✅

批次 2 ✅ - 后端核心（2h）
  ├── src/lib/transition.ts      +autoResolveOrderStatus +2条PARTIAL规则
  └── src/lib/utils.ts           +calcPlatformFee +calcGrossProfit
  验收: npx tsc --noEmit = 0 错误 ✅

批次 3 ✅ - 订单 API 扩展（2h）
  ├── POST /api/orders           +applicants可选 +财务计算 +创建Applicant
  ├── GET  /api/orders/[id]      +include applicants
  └── PATCH /api/orders/[id]     +财务字段白名单+自动重算毛利
  验收: npx tsc --noEmit = 0 错误 ✅

批次 4 ✅ - 申请人 API（1.5h）
  └── PATCH /api/applicants/[id]  含autoResolveOrderStatus调用+通知
  验收: npx tsc --noEmit = 0 错误 ✅

批次 5 ✅ - 前端多申请人（3h）
  ├── src/components/orders/applicant-card.tsx     新组件
  ├── src/components/orders/applicant-form-item.tsx 新组件
  ├── src/app/admin/orders/page.tsx                创建表单重写申请人区域+财务预览
  └── src/app/admin/orders/[id]/page.tsx           +申请人卡片 +PARTIAL case +结果标记+财务明细
  验收: 创建订单→多人展示→结果标记 全流程走通 ✅

批次 6 ✅ - 数据看板（4h）
  ├── /api/analytics/overview    概览API
  ├── /api/analytics/trend       趋势API(原生SQL)
  ├── /api/analytics/workload    人员负荷API
  ├── /api/analytics/export      导出API(23列+行合并)
  ├── stat-card.tsx              指标卡片
  ├── trend-chart.tsx            折线图(recharts)
  ├── ranking-table.tsx          排行表
  └── analytics/page.tsx         完全重写
  验收: 看板页面加载正确, 导出文件可打开 ✅

批次 7 ✅ - Excel 导入（3h）
  └── scripts/import-excel.ts    合并单元格检测 + 列映射 + 月份推断 + dry-run
  验收: dry-run 预览正确, 正式导入后数据库记录数与 Excel 一致

批次 8 ✅ — 资料面板分组 + 验收（1.5h）
  ├── document-panel.tsx         applicantCount>1时按人分组展示
  ├── npx tsc --noEmit           零错误 ✅
  └── npm run build              构建通过 ✅
  验收: 全部功能清单通过
```

**全部完成：批次 1-8（~26.5h） | 总计：~26.5 小时（3.5 天）**

---

## 9. 验收标准

### Phase A 验收

- [ ] 创建订单不传 applicants → 自动创建 1 人 → 向后兼容 ✓
- [ ] 创建订单传 3 个 applicants → 3 人各自独立 ✓
- [ ] 订单详情展示所有申请人卡片 ✓
- [ ] 标记申请人 A 出签、B 拒签 → 订单状态 PARTIAL ✓
- [ ] 标记剩余申请人 → 全部出签 → 订单状态 APPROVED ✓
- [ ] 资料收集面板 applicantCount>1 时按人分组 ✓
- [ ] tsc 0 错误 + build 通过 ✓

### Phase B 验收

- [ ] 数据看板页面加载核心指标 ✓
- [ ] 月度趋势折线图正确显示 ✓
- [ ] 客服/资料员/操作员绩效排行榜正确排序 ✓
- [ ] 筛选器切换后数据刷新 ✓
- [ ] tsc 0 错误 + build 通过 ✓

### Phase C 验收

- [ ] Excel 导出 23 列与手工表完全一致 ✓
- [ ] 多人订单行合并显示正确 ✓
- [ ] 导入 dry-run 预览准确 ✓
- [ ] 正式导入后数据库记录数一致 ✓
- [ ] tsc 0 错误 + build 通过 ✓

---

## 10. 风险矩阵

| # | 风险 | 级别 | 影响 | 解决方案 | 状态 |
|---|---|:---:|---|---|:---:|
| 1 | PARTIAL 与状态机架构冲突 | 🔴 | transition.ts / 详情页 | 独立 autoResolveOrderStatus + 2条手动规则 | ✅ 已解决 |
| 2 | 创建订单向后兼容 | 🔴 | 订单 API / 创建表单 | applicants 可选 + 默认创建1人 | ✅ 已解决 |
| 3 | 趋势查询性能 | 🔴 | 分析 API | 原生 SQL GROUP BY | ✅ 已解决 |
| 4 | Excel 合并单元格解析 | 🔴 | 导入脚本 | B列合并范围检测算法 | ✅ 已解决 |
| 5 | Store 类型安全 | 🟡 | types/order.ts | 先改类型再改 API 最后改前端 | ✅ 已解决 |
| 6 | cancel API 兼容 PARTIAL | 🟡 | cancel/route.ts | PARTIAL 不在终态列表，自动兼容 | ✅ 已解决 |
| 7 | Excel 列名不统一 | 🟡 | 导入脚本 | 模糊匹配 + 跳过异常表 | ✅ 已解决 |
| 8 | 中间件文件流 | 🟡 | 导出 API | 验证即可 | ✅ 已验证 |
| 9 | 数据库迁移 | 🟢 | prisma schema | MySQL 8.0 在线 DDL | ✅ 安全 |
| 10 | 1月表格式不同 | 🟢 | 导入脚本 | 跳过 | ✅ 已解决 |

---

*文档结束 - M5 全知手册 V2.0（基于实际 Excel 数据深度分析的最终版）*
