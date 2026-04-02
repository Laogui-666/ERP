# 华夏签证 - 签证行业ERP系统

# 产品需求文档 (PRD)

> **文档版本**: V19.0
> **生成日期**: 2026-03-19
> **最后更新**: 2026-04-02
> **所属公司**: 华夏签证  
> **产品定位**: 面向 C 端用户的综合签证服务平台（含 ERP 后台管理子系统）  

---

## 目录

1. [产品概述](#1-产品概述)
2. [用户角色体系（9级）](#2-用户角色体系)
3. [核心功能模块](#3-核心功能模块)
4. [核心工作流详细定义](#4-核心工作流详细定义)
5. [签证统计与数据导出](#5-签证统计与数据导出基于手工表优化)
6. [签证行业专项优化](#6-签证行业专项优化)
7. [非功能性需求](#7-非功能性需求)
8. [UI/UX 设计规范（液态玻璃 + 莫兰迪冷色系）](#8-uiux-设计规范)
9. [里程碑与优先级](#9-里程碑与优先级)

---

## 1. 产品概述

### 1.1 背景与目标

用户核心痛点：
- **资料繁琐**：不同国家/签证类型材料清单差异巨大，客户常反复补交
- **流转节点多**：客服→资料员→操作员→客户，跨角色协作信息断层
- **沟通成本高**：靠微信/电话沟通，缺乏标准化流程，漏单错单频发
- **进度不透明**：客户无法实时了解状态，频繁询问增加客服压力

**平台目标**：通过智能工具 + 标准化流程，为 C 端用户提供从"想出国"到"拿到签证"的一站式服务体验。ERP 后台系统作为内部管理支撑，对 C 端用户不可见。

### 1.2 产品定位

| 维度 | 说明 |
|---|---|
| **品牌** | 华夏签证 |
| **Slogan** | 专业签证，一站搞定 |
| **部署** | 阿里云 ECS + 阿里云 RDS MySQL |
| **技术栈** | Next.js 15.5.14 (App Router) + React 19.2.4 + Prisma ORM + MySQL + Tailwind CSS + Zustand + Socket.io |
| **短信** | 暂搁置，预留端口和接口定义 |

### 1.3 核心价值

| 价值 | 说明 |
|---|---|
| 一站式服务 | 签证办理 + 行程规划 + 翻译 + 文档生成 |
| 智能工具 | AI 签证评估、智能表格填写、自动化流程 |
| 价格透明 | 费用公开，无隐藏收费 |
| 进度可视 | 用户随时查看订单状态和审核意见 |
| 安全保障 | 资料加密、隐私保护、完整操作日志 |

---

## 2. C 端平台功能

### 2.1 首页

参考 Airbnb 风格，打造成熟的 C 端产品首页：
- **Hero 区域**：搜索框 + 快捷标签（热门国家）
- **热门目的地**：横向滚动卡片（国旗 + 国家名 + 价格 + 出签时间）
- **智能工具箱**：6 大工具入口卡片（2×3 网格）
- **价值主张**：极速 / 安全 / 透明 / 智能
- **用户评价**：社交证明
- **数据统计**：50,000+ 用户 / 50+ 国家 / 99.2% 出签率

### 2.2 智能工具箱

6 大工具，UI + 输入表单完整，提交后显示"功能开发中，即将上线"：

| 工具 | 路径 | 功能描述 |
|---|---|---|
| 行程规划 | /tools/itinerary | 输入目的地和时间，AI 规划旅行路线 |
| 申请表助手 | /tools/form-helper | 各国签证申请表智能填写 |
| 智能翻译 | /tools/translator | 多语言即时翻译 |
| 文档助手 | /tools/documents | 在职证明/在读证明等文件生成 |
| 签证评估 | /tools/assessment | AI 评估签证通过率、拒签风险 |
| 签证资讯 | /tools/news | 最新签证政策、行业动态 |

### 2.3 导航体系

**底部 5 Tab**：首页(/)、服务(/services)、工具(/tools)、订单(/orders)、我的(/profile)

**顶部导航**：Logo + 搜索栏 + 通知铃铛 + 头像下拉（登录后）

### 2.4 ERP 入口集成

ERP 系统作为子功能，入口在"我的"页面内：
- **C 端用户(CUSTOMER)**：显示"我的订单" -> /customer/orders
- **B 端角色**：显示"后台管理"或"工作台" -> /admin/*
- **核心原则**：首页、导航栏、服务页等公共区域不暴露 ERP 入口

---

## 3. 用户角色体系

## 2. 用户角色体系

### 2.1 9级角色权限总览

| 级别 | 角色代码 | 角色名称 | 数据范围 | 所属部门 |
|:---:|---|---|---|---|
| 1 | `SUPER_ADMIN` | 超级管理员 | 全网站数据 | 系统 |
| 2 | `COMPANY_OWNER` | 公司负责人 | 公司全部数据 | 公司负责人 |
| 3 | `CS_ADMIN` | 客服部管理员 | 客服部门数据 | 客服部 |
| 4 | `CUSTOMER_SERVICE` | 客服 | 自有订单 | 客服部 |
| 5 | `VISA_ADMIN` | 签证部管理员 | 签证部门数据 | 签证部 |
| 6 | `DOC_COLLECTOR` | 资料员 | 自有订单 | 签证部 |
| 7 | `OPERATOR` | 签证操作员 | 自有订单 | 签证部 |
| 8 | `OUTSOURCE` | 外包业务员 | 自有订单 | 公司负责人 |
| 9 | `CUSTOMER` | 普通用户 | 自有订单 | 客户 |

### 2.2 角色层级与数据可见性

```
SUPER_ADMIN (Lv1)          ──► 全平台所有公司所有数据
  │
COMPANY_OWNER (Lv2)        ──► 本公司全部数据
  │
  ├── CS_ADMIN (Lv3)       ──► 客服部全部订单数据
  │     └── CUSTOMER_SERVICE (Lv4) ──► 自己录入的订单
  │
  ├── VISA_ADMIN (Lv5)     ──► 签证部全部订单数据
  │     ├── DOC_COLLECTOR (Lv6)    ──► 自己接单的订单
  │     └── OPERATOR (Lv7)         ──► 自己接单的订单
  │
  └── OUTSOURCE (Lv8)      ──► 分配给自己的订单（敏感信息脱敏）

CUSTOMER (Lv9)             ──► 自己的订单
```

### 2.3 各角色详细权限矩阵

| 功能 | SUPER_ADMIN | COMPANY_OWNER | CS_ADMIN | CUSTOMER_SERVICE | VISA_ADMIN | DOC_COLLECTOR | OPERATOR | OUTSOURCE | CUSTOMER |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 管理入驻公司 | ✅ | — | — | — | — | — | — | — | — |
| 管理本公司组织架构 | — | ✅ | — | — | — | — | — | — | — |
| 管理客服部员工 | — | ✅ | ✅ | — | — | — | — | — | — |
| 管理签证部员工 | — | ✅ | — | — | ✅ | — | — | — | — |
| 创建订单 | — | ✅ | ✅ | ✅ | — | — | — | — | — |
| 从公共池接单 | — | — | — | — | ✅ | ✅ | ✅ | ✅ | — |
| 收集/审核客户资料 | — | — | — | — | ✅ | ✅ | — | — | — |
| 复审资料 | — | — | — | — | ✅ | — | ✅ | ✅ | — |
| 制作签证材料 | — | — | — | — | ✅ | — | ✅ | ✅ | — |
| 交付客户 | — | — | — | — | ✅ | ✅ | — | — | — |
| 上传/下载资料 | — | — | — | — | — | — | — | — | ✅ |
| 查看数据看板 | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — |
| 转单操作 | — | ✅ | ✅ | — | ✅ | — | — | — | — |
| 查看操作日志 | ✅ | ✅ | — | — | — | — | — | — | — |

### 2.4 脱敏规则（OUTSOURCE 角色）

| 字段 | 脱敏规则 | 示例 |
|---|---|---|
| 手机号 | 保留前3后4 | `138****5678` |
| 护照号 | 保留前2后3 | `EA***567` |
| 身份证号 | 保留前3后4 | `110***1234` |
| 邮箱 | 保留首字母+@域名 | `z***@gmail.com` |
| 银行卡 | 完全隐藏 | `****` |

---

## 3. 核心功能模块

### 3.1 模块划分

| 模块 | 说明 | 优先级 | 阶段 |
|---|---|:---:|---|
| IAM | 登录注册、JWT 鉴权、RBAC 9级权限 | P0 | M1 |
| Tenant | 公司入驻、配置、数据隔离 | P0 | M1 |
| Order | 订单 CRUD、状态机流转 | P0 | M2 |
| Workflow | 状态机引擎、流转校验、事件触发 | P0 | M2 |
| Document | 文件上传/预览/下载/审核/归档 | P0 | M3 |
| Notification | 站内信（WebSocket）、系统通知 | P0 | M3 |
| SMS | 短信服务（暂搁置，预留端口） | P1 | — |
| Dashboard | 统计图表、绩效排名、异常监控 | P1 | M5 |
| Org | 部门管理、员工管理、角色管理 | P1 | M2 |
| Customer Portal | 客户移动端界面 | P0 | M3 |
| Audit | 操作日志、变更记录 | P1 | M5 |
| Visa Templates | 签证资料清单模板库 | P2 | M6 |
| Shop API | 预留网店订单同步接口 | P2 | — |

### 3.2 模块依赖

```
┌─────┐   ┌────────┐
│ IAM │──►│ Tenant │
└──┬──┘   └───┬────┘
   │          │
   ▼          ▼
┌──────────────────┐
│      Order       │
└────────┬─────────┘
         │
    ┌────▼────┐
    │Workflow │──── 事件总线 ────┐
    └────┬────┘                  │
         │                       ▼
    ┌────▼────┐         ┌──────────────┐
    │Document │         │ Notification │──► SMS(预留)
    └─────────┘         └──────────────┘
                              │
    ┌──────────┐              ▼
    │Dashboard │      ┌──────────────┐
    └──────────┘      │  Audit Log   │
                      └──────────────┘
```

---

## 4. 核心工作流详细定义

### 4.1 状态机枚举

```typescript
enum OrderStatus {
  PENDING_CONNECTION  = 'PENDING_CONNECTION',   // 待对接
  CONNECTED           = 'CONNECTED',             // 已对接
  COLLECTING_DOCS     = 'COLLECTING_DOCS',       // 资料收集中
  PENDING_REVIEW      = 'PENDING_REVIEW',        // 待审核
  UNDER_REVIEW        = 'UNDER_REVIEW',          // 资料审核中
  MAKING_MATERIALS    = 'MAKING_MATERIALS',      // 材料制作中
  PENDING_DELIVERY    = 'PENDING_DELIVERY',      // 待交付
  DELIVERED           = 'DELIVERED',             // 已交付
  APPROVED            = 'APPROVED',              // 出签
  REJECTED            = 'REJECTED',              // 拒签
  PARTIAL             = 'PARTIAL',               // 部分出签（多人订单特有，M5已实现）
}
```

### 4.2 状态流转规则

```
PENDING_CONNECTION ──[客服提交]──► CONNECTED
                                       │
                              ┌────────▼─────────┐
                              │ COLLECTING_DOCS   │◄───────────┐
                              └────────┬─────────┘             │
                                       │                       │
                              ┌────────▼─────────┐             │
                              │ PENDING_REVIEW    │             │ (操作员打回/需补充)
                              └────────┬─────────┘             │
                                       │                       │
                              ┌────────▼─────────┐             │
                              │ UNDER_REVIEW ─────┼─────────────┘
                              └────────┬─────────┘
                                       │
                              ┌────────▼─────────┐
                              │ MAKING_MATERIALS  │◄───────────┐
                              └────────┬─────────┘             │
                                       │                       │ (资料员打回修改)
                              ┌────────▼─────────┐             │
                              │ PENDING_DELIVERY ─┼─────────────┘
                              └────────┬─────────┘
                                       │
                              ┌────────▼─────────┐
                              │ DELIVERED         │
                              └────────┬─────────┘
                                       │
                              ┌────────▼─────────┐
                              │ APPROVED /        │
                              │ REJECTED          │
                              └──────────────────┘
```

**合法流转表：**

| 当前状态 | 目标状态 | 触发角色 | 触发动作 |
|---|---|---|---|
| `PENDING_CONNECTION` | `CONNECTED` | DOC_COLLECTOR / VISA_ADMIN | 资料员接单 |
| `CONNECTED` | `COLLECTING_DOCS` | DOC_COLLECTOR / VISA_ADMIN | 发送资料清单给客户 |
| `COLLECTING_DOCS` | `COLLECTING_DOCS` | CUSTOMER / DOC_COLLECTOR | 客户提交资料 / 资料员审核 |
| `COLLECTING_DOCS` | `PENDING_REVIEW` | DOC_COLLECTOR / VISA_ADMIN | 资料员提交审核 |
| `PENDING_REVIEW` | `UNDER_REVIEW` | OPERATOR / OUTSOURCE / VISA_ADMIN | 操作员接单 |
| `UNDER_REVIEW` | `COLLECTING_DOCS` | OPERATOR / OUTSOURCE / VISA_ADMIN | 操作员打回（需补充） |
| `UNDER_REVIEW` | `MAKING_MATERIALS` | OPERATOR / OUTSOURCE / VISA_ADMIN | 操作员确认资料达标 |
| `MAKING_MATERIALS` | `PENDING_DELIVERY` | OPERATOR / OUTSOURCE / VISA_ADMIN | 操作员上传成品 |
| `PENDING_DELIVERY` | `MAKING_MATERIALS` | DOC_COLLECTOR / VISA_ADMIN | 资料员打回修改 |
| `PENDING_DELIVERY` | `DELIVERED` | DOC_COLLECTOR / VISA_ADMIN | 资料员确认交付 |
| `DELIVERED` | `APPROVED` | OPERATOR / DOC_COLLECTOR / CUSTOMER | 提交出签结果 |
| `DELIVERED` | `REJECTED` | OPERATOR / DOC_COLLECTOR / CUSTOMER | 提交拒签结果 |
| `*非终态` | `REJECTED` | COMPANY_OWNER / CS_ADMIN / VISA_ADMIN | 取消订单（需填写原因） |

**转单操作（不改变状态）：**

| 操作 | 触发角色 | 说明 |
|---|---|---|
| 资料员转单 | COMPANY_OWNER / CS_ADMIN / VISA_ADMIN | 将订单转交给同角色其他资料员 |
| 操作员转单 | COMPANY_OWNER / CS_ADMIN / VISA_ADMIN | 将订单转交给同角色其他操作员 |

### 4.3 各阶段详细交互

#### 阶段一：客服接单录单

**触发者**: CUSTOMER_SERVICE / CS_ADMIN / COMPANY_OWNER  
**前置条件**: 客户已下单付款

| 步骤 | 操作 | 系统行为 | 通知 |
|---|---|---|---|
| 1 | 客服录入客户信息+订单信息 | 创建 Order，状态 `PENDING_CONNECTION` | — |
| 2 | 核对无误，点击"提交" | 推送到资料员公共池；创建/关联客户账号；订单同步到客户端 | 资料员：站内通知"又有新订单啦" |
| 3 | — | — | 客户：站内通知 + 短信(预留) |

**客户信息字段**：
- 基本信息：姓名、手机号、邮箱
- 证件信息：护照号、签发日期、有效期
- 签证信息：申请国家、签证类型、出行日期
- 订单信息：金额、付款方式、来源渠道
- 备注信息

**客户账号创建**：客服录入订单时系统自动创建客户账号（`passwordHash` 为空）。客户首次登录时系统提示"首次登录请先设置密码"，跳转至 `/reset-password` 页面，验证手机号+用户名后设置新密码并自动登录。

#### 阶段二：资料员接单及收集反馈

**触发者**: DOC_COLLECTOR / VISA_ADMIN + CUSTOMER

| 步骤 | 操作者 | 操作 | 系统行为 | 通知 |
|---|---|---|---|---|
| 1 | 资料员 | 公共池选择订单→"接单" | 绑定 `collectorId`，从公共池移出，状态→`CONNECTED` | — |
| 2 | 资料员 | 补充客户信息，打开"资料收集面板" | — | — |
| 3 | 资料员 | 选择/添加资料清单→"发送客户" | 生成 DocumentRequirement 记录，状态→`COLLECTING_DOCS` | 客户收到通知 |
| 4 | 客户 | 上传资料→"确认提交" | 更新 DocumentRequirement 文件 URL 和状态 | 资料员收到通知 |
| 5 | 资料员 | 审核资料（预览/下载），合格打勾/不合格备注 | 更新资料状态和驳回原因 | 客户收到通知 |
| 6 | 循环 | 重复步骤 4-5 | — | — |
| 7 | 资料员 | 资料达标→"提交审核" | 推送到操作员公共池，状态→`PENDING_REVIEW` | 操作员收到通知 |

#### 阶段三：操作员接单及审核

**触发者**: OPERATOR / OUTSOURCE / VISA_ADMIN + DOC_COLLECTOR + CUSTOMER

| 步骤 | 操作者 | 操作 | 系统行为 | 通知 |
|---|---|---|---|---|
| 1 | 操作员 | 公共池选择订单→"接单" | 绑定 `operatorId`，状态→`UNDER_REVIEW` | — |
| 2 | 操作员 | 审核资料→"反馈资料员" | 记录审核意见 | 资料员收到通知 |
| 3 | 资料员 | 查看反馈，补充资料或发送客户 | 如需客户补充：状态→`COLLECTING_DOCS` | 客户收到通知 |
| 4 | 循环 | 重复资料收集+审核 | — | — |
| 5 | 操作员 | 资料达标→"开始制作签证材料" | 状态→`MAKING_MATERIALS` | 资料员+客户收到通知 |

#### 阶段四：签证材料制作与交付

| 步骤 | 操作者 | 操作 | 系统行为 | 通知 |
|---|---|---|---|---|
| 1 | 操作员 | 上传资料包→"发送资料" | 生成 VisaMaterial，状态→`PENDING_DELIVERY` | 资料员收到通知 |
| 2 | 资料员 | 查看成品，若需修改→"反馈操作员" | 状态→`MAKING_MATERIALS` | 操作员收到通知 |
| 3 | 循环 | 重复 1-2 | — | — |
| 4 | 资料员 | 成品达标→"材料交付" | 状态→`DELIVERED` | 客户收到通知+短信(预留) |

#### 阶段五：结果反馈

| 步骤 | 操作者 | 操作 | 系统行为 | 通知 |
|---|---|---|---|---|
| 1 | 系统 | 预约日前一天自动检查 | Cron 任务触发 | 短信提醒(预留) |
| 2 | 操作员/客户 | 提交出签结果 | 状态→`APPROVED`/`REJECTED` | 客户收到通知 |
| 3 | 员工 | 选择短信模板→发送结果通知 | 短信发送(预留) | — |

### 4.4 多申请人订单设计

#### 4.4.1 业务背景

签证业务中大量存在"一个订单多个申请人"的场景：
- 夫妻同行（2人）
- 家庭出游（3~5人）
- 团队办理（5~10人）

手工 Excel 中通过"联系人+申请人1/申请人2/..."列名区分，但 ERP 需要结构化处理。

#### 4.4.2 数据模型：Applicant 子表

```
Order (1) ────── (N) Applicant

Order.status          → 控制工作流推进（订单级）
Applicant.visaResult  → 控制每人独立结果（申请人级）
```

| 字段 | 类型 | 说明 |
|---|---|---|
| name | String | 申请人姓名 |
| phone | String? | 手机号（部分人有独立联系方式） |
| passportNo | String? | 护照号 |
| passportExpiry | DateTime? | 护照有效期 |
| visaResult | VisaResult? | 出签结果：APPROVED / REJECTED / null(进行中) |
| visaResultAt | DateTime? | 出签/拒签时间 |
| visaResultNote | String? | 结果备注（如拒签原因） |
| documentsComplete | Boolean | 资料是否齐全 |
| sortOrder | Int | 排序 |

#### 4.4.3 工作流规则

**阶段一~四（订单级统一推进，不拆分）**：

| 阶段 | 多人处理规则 |
|---|---|
| 资料收集 | 每个 Applicant 独立标记 `documentsComplete`，**全部齐全**后"提交审核"按钮才可点击 |
| 审核 | 操作员查看整个订单所有申请人的资料，**一起审核** |
| 材料制作 | 所有申请人的签证材料**一起制作上传** |
| 交付 | 一起交付客户 |

**阶段五（申请人级独立结果）**：

| 场景 | 订单最终状态 | 说明 |
|---|---|---|
| 全部出签 | `APPROVED` | 所有 Applicant.visaResult = APPROVED |
| 全部拒签 | `REJECTED` | 所有 Applicant.visaResult = REJECTED |
| 部分出签 | `PARTIAL`（新增） | 有人出签有人拒签 |
| 尚有未出结果 | `DELIVERED` | 还有人没有 visaResult |

#### 4.4.4 前端交互

**客服创建订单**：支持动态添加/删除申请人，至少 1 人。

**资料收集面板**：按申请人分组展示资料清单，每组独立标记完成状态。

**订单详情**：展示申请人卡片列表，每张卡片显示独立的资料状态和出签结果。

#### 4.4.5 订单级扩展字段

| 新增字段 | 类型 | 说明 |
|---|---|---|
| applicantCount | Int | 申请人数（自动计算） |
| contactName | String? | 联系人（下单人 ≠ 申请人） |
| targetCity | String? | 送签城市 |
| submittedAt | DateTime? | 递交使馆时间 |
| visaResultAt | DateTime? | 最后一人出结果时间 |

---

## 5. 签证统计与数据导出（基于手工表优化）

### 5.1 当前手工表分析

公司当前使用 Excel 手工统计，覆盖 2025年1月 ~ 2026年3月，共 15 个工作表，约 2,718 行数据。

**实际数据规模（2026年3月单月）**：~330 单 / 471 个申请人 / 多人订单占比 33.5%

**表头位置**：第 2 行（第 1 行为合并标题，非表头）

**各月列数差异**：

| 表 | 列数 | 特殊说明 |
|---|:---:|---|
| 2026年3月（最新） | 23 | 标准模板，无"签OR拒签"列 |
| 2026年1-2月 | 23 | 与最新表一致 |
| 2025年10-12月 | 23-24 | 12月有"好评返现"列 |
| 2025年3-7月 | 24 | 有"申请人数"/"出签人数"列 |
| 2025年8-9月 | 21 | 缺少签证费/保险列 |
| 2025年1月 | 28 | 格式完全不同，需跳过 |

**多人订单检测**：通过 B 列（联系人）合并单元格识别，非多列模式。合并范围内每行 C 列 = 一个申请人，共享字段取第一行。

手工表 23 列结构（以最新表为标准）：

| 分类 | 列名 | ERP 映射 | 状态 |
|---|---|---|:---:|
| 客户 | 联系人 | Order.contactName | M5 实现 |
| 客户 | 申请人 | Applicant.name | M5 实现 |
| 客户 | 手机号 | Order.customerPhone | ✅ |
| 签证 | 国家 | Order.targetCountry | ✅ |
| 签证 | 城市 | Order.targetCity | M5 实现 |
| 签证 | 套餐 | Order.visaCategory | ✅ |
| 签证 | 备注/预计出行 | Order.remark + Order.travelDate | ✅ |
| 流程 | 下单时间 | Order.createdAt | ✅ |
| 流程 | 接待客服 | Order.createdBy → User.realName | ✅ |
| 流程 | 资料收集（人员） | Order.collectorId → User.realName | ✅ |
| 流程 | 平台进度更新 | Order.status 中文标签 | ✅ |
| 流程 | 递交日期 | Order.submittedAt | M5 实现 |
| 流程 | 出签时间 | Applicant.visaResultAt | M5 实现 |
| 流程 | 操作专员 | Order.operatorId → User.realName | ✅ |
| 订单 | 订单编号 | Order.externalOrderNo | ✅ |
| 订单 | 订单金额 | Order.amount | ✅ |
| 财务 | 支付方式 | Order.paymentMethod | ✅ |
| 财务 | 平台扣点 | Order.platformFeeRate | M5 实现 |
| 财务 | 平台费用 | Order.platformFee | M5 实现 |
| 财务 | 签证费 | Order.visaFee | M5 实现 |
| 财务 | 申根保险 | Order.insuranceFee | M5 实现 |
| 财务 | 拒签保险 | Order.rejectionInsurance | M5 实现 |
| 财务 | 好评返现 | Order.reviewBonus | M5 实现 |

**映射率：12/23 直接映射 + 11/23 M5 新增字段 = 100% 可覆盖**

**支付方式标准化**（13种 → 5种）：

| ERP 标准值 | Excel 实际取值 |
|---|---|
| ALIPAY | 支付宝 |
| HUABEI | 花呗、花呗支付 |
| CREDIT | 信用支付、分期购 |
| WECHAT | 盼达二维码、华夏二维码、企业二维码 等 |
| CASH | 生哥现收 |

### 5.2 财务自动计算

```
毛利 = 订单金额 - 平台费用 - 签证费(总计) - 保险费(总计) - 好评返现
平台费用 = 订单金额 × 平台扣点费率
```

### 5.3 Excel 导出功能

**端点**：`GET /api/analytics/export`

| 参数 | 说明 |
|---|---|
| month | 按月导出，如 `2026-03` |
| startDate / endDate | 按日期范围导出 |
| country | 按国家筛选 |
| createdBy | 按客服筛选 |
| format | `xlsx` / `csv` |

**导出格式**：完全对齐现有手工表列结构，支持多人订单行合并显示。

### 5.4 数据看板可视化

| 图表 | 类型 | 数据源 | 筛选维度 |
|---|---|---|---|
| 月度订单趋势 | 折线图 | 按月 count + sum(amount) | 月份范围 |
| 国家分布 | 饼图 | 按 targetCountry 分组 | 月份 |
| 客服绩效 | 排行榜 | 按 createdBy 统计订单数+金额 | 月份 |
| 操作员绩效 | 排行榜 | 按 operatorId 统计出签率 | 月份 |
| 营收 vs 利润 | 柱状图 | sum(amount) vs sum(grossProfit) | 月份 |
| 出签率 | 仪表盘 | approved / (approved + rejected) | 月份/国家 |
| 支付方式分布 | 饼图 | 按 paymentMethod 分组 | 月份 |
| 平均办理时长 | 数值卡 | avg(submittedAt - createdAt) | 月份/签证类型 |
| 异常订单预警 | 列表 | 超时未推进的订单 | 实时 |

### 5.5 历史数据迁移

提供批量导入脚本，将历史 Excel 数据一次性导入 ERP：

```bash
npx tsx scripts/import-excel.ts ./签证统计表2026.3.xlsx
```

**导入策略**：

| 策略 | 说明 |
|---|---|
| 标准模板 | 以最新表（2026.3）的 23 列为标准 |
| 表头行 | 第 2 行（第 1 行是标题，跳过） |
| 多人检测 | B 列合并单元格范围 = 同一订单的多行 |
| 日期转换 | Excel 序列号 → JS Date（含小数的递交日期） |
| 扣点转换 | 文本"6.1%" → 数字 0.061 |
| 支付标准化 | 13 种取值 → 5 种标准值 |
| 缺失列 | 8-9月无财务列 → 字段留 NULL |
| 异常表 | "1月（已统计）"格式完全不同 → 跳过 |
| 订单号 | 多个换行分隔 → 取第一个 |
| dry-run | 先预览再写入，用户确认后执行 |

---

## 6. 签证行业专项优化

### 6.1 签证类型模板库

预置常见国家/签证类型的资料清单模板：

| 国家 | 签证类型 | 典型材料 |
|---|---|---|
| 申根国家 | 旅游签 | 护照、照片、在职证明、银行流水、行程单、酒店预订单、机票预订单、旅行保险 |
| 美国 | B1/B2 | DS-160确认页、护照、照片、在职证明、资产证明、行程计划 |
| 日本 | 单次旅游 | 护照、照片、在职证明、银行流水、行程表、酒店预订 |
| 澳大利亚 | 旅游签 | 护照、照片、在职证明、银行流水、行程、保险 |
| 英国 | 标准访客 | 护照、照片、在职证明、银行流水、住宿证明、行程 |
| 加拿大 | 旅游签 | 护照、照片、在职证明、银行流水、旅行历史、行程 |

**优化特性**：
- 根据"申请国家+签证类型"自动推荐资料清单
- 资料员可一键应用模板再微调
- 公司自建模板库，模板公司内共享
- 模板版本管理，更新后不影响历史订单

### 6.2 签证分类流程差异化

| 签证类型 | 流程差异 |
|---|---|
| 贴纸签证 | 需原件邮寄，交付包含邮寄指引 |
| 电子签证 | 全线上，交付电子文件即可 |
| 申根签证 | 客户需反馈出签状态 |
| 需录指纹/面试 | 额外预约提醒环节 |

### 6.3 智能资料检查

- 根据签证类型自动校验必填资料是否齐全
- 护照有效期检查（距出行日是否满足要求）
- 照片规格检查（预留 OCR/图像识别接口）

### 6.4 批量操作

- 资料员可批量发送资料清单
- 管理员可批量导出订单数据
- 按国家、类型、状态等多维度筛选

### 6.5 订单模板与快速录入

- 客服可使用"订单模板"快速录单
- 老客户再次下单自动填充历史信息

---

## 7. 非功能性需求

### 7.1 性能

| 指标 | 要求 |
|---|---|
| 页面首次加载 (LCP) | < 2s |
| API 响应 (P95) | < 500ms |
| 文件上传 | 最大 50MB/文件，支持断点续传 |
| 并发用户 | 500+ 同时在线 |
| WebSocket | 500+ 并发连接稳定 |

### 7.2 安全

| 维度 | 措施 |
|---|---|
| 认证 | JWT + HttpOnly Cookie, Access Token 15min + Refresh Token 7d |
| 授权 | RBAC 9级 + 公司级数据隔离 |
| 密码 | bcrypt 哈希, 最低8位含大小写+数字 |
| 文件 | 上传类型白名单、大小限制 |
| SQL注入 | Prisma 参数化查询 |
| XSS | React 默认转义 + CSP 头 |
| CSRF | SameSite Cookie + Token 校验 |
| HTTPS | 全站强制 |
| 脱敏 | OUTSOURCE 角色自动脱敏 |

### 7.3 可用性

- 系统可用性 99.5%+
- 数据库每日自动备份
- 文件存储冗余

### 7.4 兼容性

- **客户端**：移动端优先，iOS Safari 14+、Android Chrome 90+
- **管理端**：桌面端优先，Chrome 90+、Edge 90+、Firefox 88+

---

## 8. UI/UX 设计规范

### 8.1 设计风格：液态玻璃 (Liquid Glass) + 莫兰迪冷色系

**核心设计语言**：
- **液态玻璃 (Liquid Glass)**：半透明毛玻璃组件系统，含 4 级强度（light / medium / heavy / accent），桌面端悬停时展现液态光泽层 + 鼠标跟随光效
- **莫兰迪冷色系**：低饱和度、柔和的冷色调，高级感克制，通过 Tailwind `morandi` 色板 + CSS 变量双通道管理
- **动态背景**：桌面端 4 个浮动渐变光球 + 微光网格线 + 鼠标跟随光晕；移动端自动降级为静态渐变装饰
- **弹簧阻尼动效**：所有交互使用物理弹簧缓动（非线性），4 种预设缓动曲线：`--ease-spring` / `--ease-damping` / `--ease-smooth` / `--ease-bounce`
- **响应式双模式**：桌面端管理端布局（侧边栏 + 顶栏），移动端客户端布局（顶栏 + 底部 Tab）

### 8.2 CSS 变量体系（globals.css :root）

所有设计 Token 通过 CSS 自定义属性统一管理，Tailwind 和原生 CSS 共用：

```css
:root {
  /* 莫兰迪冷色系 */
  --color-primary: #7C8DA6;          /* 主色 - 灰蓝 */
  --color-primary-dark: #5A6B82;     /* 深沉蓝灰 */
  --color-primary-light: #A8B5C7;    /* 浅灰蓝 */
  --color-primary-glow: rgba(124, 141, 166, 0.25);
  --color-secondary: #8FA3A6;        /* 青灰 */
  --color-accent: #9B8EC4;           /* 紫灰 */
  --color-accent-glow: rgba(155, 142, 196, 0.2);

  /* 状态色 */
  --color-success: #7FA87A;          /* 莫兰迪绿灰 */
  --color-warning: #C4A97D;          /* 莫兰迪暖黄 */
  --color-error: #B87C7C;            /* 莫兰迪红灰 */
  --color-info: #7CA8B8;             /* 莫兰迪蓝 */

  /* 背景 */
  --color-bg-from: #1A1F2E;          /* 深蓝黑 */
  --color-bg-to: #252B3B;            /* 深蓝灰 */
  --color-bg-mid: #1F2536;           /* 中间过渡 */

  /* 文字层级 */
  --color-text-primary: #E8ECF1;     /* 冷白 */
  --color-text-secondary: #8E99A8;   /* 灰蓝 */
  --color-text-placeholder: #5A6478; /* 深灰蓝 */

  /* 液态玻璃核心变量 */
  --glass-bg: rgba(255, 255, 255, 0.06);
  --glass-bg-hover: rgba(255, 255, 255, 0.10);
  --glass-bg-active: rgba(255, 255, 255, 0.04);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-hover: rgba(255, 255, 255, 0.14);
  --glass-blur: 20px;
  --glass-blur-heavy: 30px;
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  --glass-shadow-hover: 0 16px 48px rgba(0, 0, 0, 0.2);
  --glass-inset: inset 0 1px 0 rgba(255, 255, 255, 0.06);

  /* 缓动曲线 */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-damping: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* 圆角系统 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
}
```

### 8.3 色彩系统

#### Tailwind morandi 色板（tailwind.config.ts）

```typescript
colors: {
  morandi: {
    blue: '#7C8DA6',
    'blue-dark': '#5A6B82',
    'blue-light': '#A8B5C7',
    gray: '#8E99A8',
    'gray-light': '#A8B5C7',
    'gray-dark': '#5A6478',
    green: '#7FA87A',
    'green-light': '#A3C4AD',
    coral: '#B87C7C',
    'coral-light': '#D4ADA9',
    purple: '#9B8EC4',
    'purple-light': '#B8ADCF',
    cream: '#E8ECF1',
    'cream-dark': '#D4CFC8',
  },
}
```

#### 状态色彩标识

| 状态 | 颜色 | 色值 | Badge variant |
|---|---|---|---|
| 待对接 | 灰蓝 | `#8E99A8` | `default` |
| 已对接 | 莫兰迪蓝 | `#7CA8B8` | `info` |
| 资料收集中 | 莫兰迪黄 | `#C4A97D` | `warning` |
| 待审核 | 莫兰迪橙 | `#C49A7D` | `warning` |
| 资料审核中 | 莫兰迪紫 | `#9B8EC4` | `purple` |
| 材料制作中 | 莫兰迪青 | `#7DADA8` | `info` |
| 待交付 | 莫兰迪靛 | `#8B8EC4` | `purple` |
| 已交付 | 莫兰迪绿 | `#7FA87A` | `success` |
| 部分出签 | 莫兰迪黄 | `#C4A97D` | `warning` |
| 出签 | 莫兰迪绿 | `#7FA87A` | `success` |
| 拒签 | 莫兰迪红 | `#B87C7C` | `danger` |

### 8.4 排版系统

| 层级 | 字号 | 字重 | 用途 | 实现 |
|---|---|---|---|---|
| Display | 28px | 700 | 登录页大标题 | `text-[28px] font-bold` |
| H1 | 22px | 700 | 区域标题 | `text-[22px] font-bold` |
| H2 | 18px | 600 | 卡片标题 | `text-[18px] font-semibold` |
| H3 | 16px | 600 | 小节标题 | `text-[16px] font-semibold` |
| Body | 14px | 400 | 正文/表格 | `text-[14px]` |
| Caption | 13px | 400/500 | 辅助说明/输入标签 | `text-[13px]` |
| Small | 12px | 400 | 辅助文字/状态副文本 | `text-[12px]` |
| Tiny | 11px | 400/500 | 标签/角标/面包屑 | `text-[11px]` |

**字体栈**：
```css
font-family: 'Inter', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
```

**排版细节**：
- 标题使用 `tracking-tight`（紧凑字距）
- 标签使用 `tracking-wide` + `uppercase`（宽松大写）
- 中文正文使用默认字距

### 8.5 液态玻璃组件规范

#### 8.5.1 玻璃卡片 — 4 级强度

| 变体 | CSS 类 | 用途 |
|---|---|---|
| Light | `glass-card-light` | 次要信息、轻量容器 |
| Medium | `glass-card` | 主内容卡片（默认） |
| Heavy | `glass-card-static` | 高对比容器、弹窗 |
| Accent | `glass-card-accent` | 高亮卡片、选中项 |

**默认卡片（glass-card）**：
```css
background: var(--glass-bg);                    /* rgba(255,255,255,0.06) */
backdrop-filter: blur(var(--glass-blur));       /* 20px */
border: 1px solid var(--glass-border);          /* rgba(255,255,255,0.08) */
border-radius: var(--radius-lg);                /* 16px */
box-shadow: var(--glass-shadow), var(--glass-inset);
```

**桌面端悬停效果**：
- 背景提亮 → `--glass-bg-hover`（rgba 0.10）
- 边框增亮 → `--glass-border-hover`（rgba 0.14）
- 阴影加深 → `--glass-shadow-hover`（0 16px 48px）
- 浮起 2px → `translateY(-2px)`
- 液态光泽层渐显 → `::before` pseudo-element opacity 0→1

**点击反馈**：`translateY(0) scale(0.99)` + 背景降为 active 态

**GlassCard 组件 Props**（`glass-card.tsx`）：
```typescript
interface GlassCardProps {
  intensity?: 'light' | 'medium' | 'heavy' | 'accent'
  hover?: boolean          // 是否启用悬停增强
  glow?: boolean           // 鼠标跟随光效（仅桌面端）
  animated?: boolean       // 入场动画
  delay?: number           // 动画延迟 (ms)
}
```

#### 8.5.2 玻璃输入框 (Glass Input)

```css
background: rgba(255, 255, 255, 0.04);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: var(--radius-md);                /* 12px */
padding: 11px 16px;
font-size: 14px;
/* focus 时 */
background: rgba(255, 255, 255, 0.06);
border-color: rgba(124, 141, 166, 0.4);
box-shadow: 0 0 0 3px rgba(124, 141, 166, 0.1), var(--glass-inset);
```

#### 8.5.3 玻璃按钮 — 5 种变体

| 变体 | CSS 类 | 用途 |
|---|---|---|
| Primary | `glass-btn-primary` | 主操作（提交、确认） |
| Secondary | `glass-btn-secondary` | 次要操作（取消、返回） |
| Ghost | Tailwind inline | 轻量操作（图标按钮） |
| Danger | `glass-btn-danger` | 危险操作（删除、取消订单） |
| Success | `glass-btn-success` | 确认操作（通过、交付） |

**主按钮细节**：
- 渐变背景：`linear-gradient(135deg, rgba(124,141,166,0.35), rgba(124,141,166,0.18))`
- 悬停时**光泽扫过效果**：`::before` pseudo-element 从左到右滑过（`left: -100% → 100%`）
- 悬停浮起 `translateY(-1px)` + 阴影 `0 6px 20px`
- 点击缩放 `scale(0.98)` + 极速响应 `transition-duration: 0.08s`

**Button 组件**（`ui/button.tsx`）：
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean    // 显示 spinner + 禁用
}
```

#### 8.5.4 玻璃弹窗 (Glass Modal)

```css
/* 遮罩层 */
background: rgba(10, 13, 20, 0.6);
backdrop-filter: blur(6px);
animation: fadeIn 0.25s var(--ease-damping);

/* 弹窗主体 */
background: rgba(32, 38, 54, 0.96);
backdrop-filter: blur(40px);
border: 1px solid rgba(255, 255, 255, 0.07);
border-radius: var(--radius-xl);                /* 20px */
box-shadow: 0 32px 80px rgba(0, 0, 0, 0.35), var(--glass-inset);
animation: springInScale 0.45s var(--ease-spring);  /* 弹簧缩放入场 */
```

#### 8.5.5 玻璃侧边栏

```css
background: rgba(22, 27, 41, 0.88);
backdrop-filter: blur(var(--glass-blur-heavy));  /* 30px */
border-right: 1px solid rgba(255, 255, 255, 0.04);
box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
```

#### 8.5.6 玻璃顶栏

```css
background: rgba(22, 27, 41, 0.72);
backdrop-filter: blur(var(--glass-blur));        /* 20px */
border-bottom: 1px solid rgba(255, 255, 255, 0.04);
box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
```

#### 8.5.7 状态徽章 (Badge)

6 种变体：`default` / `success` / `warning` / `danger` / `info` / `purple`

```css
padding: 4px 12px;
border-radius: 20px;
font-size: 12px;
font-weight: 500;
backdrop-filter: blur(10px);
border: 1px solid rgba(对应色, 0.15);
background: rgba(对应色, 0.12);
```

#### 8.5.8 Toast 通知

4 种类型色码：
| 类型 | 背景 | 边框 |
|---|---|---|
| success | `rgba(127,168,122,0.15)` | `var(--color-success)/20` |
| error | `rgba(184,124,124,0.15)` | `var(--color-error)/20` |
| warning | `rgba(196,169,125,0.15)` | `var(--color-warning)/20` |
| info | `rgba(124,168,184,0.15)` | `var(--color-info)/20` |

位置：右下角 `fixed bottom-5 right-5`，3.5 秒自动消失，入场 `animate-fade-in-right`

#### 8.5.9 玻璃表格

```css
thead th:
  background: rgba(255, 255, 255, 0.03);
  font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

tbody tr: hover → background rgba(255, 255, 255, 0.03)
tbody td: border-bottom: 1px solid rgba(255, 255, 255, 0.03);
```

#### 8.5.10 自定义滚动条

```css
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
/* Firefox */
scrollbar-width: thin;
scrollbar-color: rgba(255,255,255,0.08) transparent;
```

### 8.6 动态背景系统

#### 桌面端（>= 769px）

DynamicBackground 组件渲染 4 层：
1. **浮动渐变光球**（4 个 orb）：不同尺寸/颜色/动画路径，`filter: blur(80px)`，20-25s 循环
2. **微光网格线**：60px 间距半透明网格，中心渐隐遮罩
3. **鼠标跟随光晕**：400px 径向渐变，`transition: 0.8s damping` 平滑追踪

#### 移动端（< 768px）

动态背景自动隐藏（`display: none`），降级为静态渐变装饰：
- 2 个固定位置的径向渐变圆（更小尺寸、更低透明度）

### 8.7 响应式布局规范

#### 管理端（Desktop-first）

```
桌面端 (>= 768px):
┌─────────────────────────────────────────────────┐
│ glass-sidebar (fixed, w-64 = 256px)              │
│ glass-topbar (h-[60px], ml-64)                   │
│ main content (ml-64, p-6)                        │
└─────────────────────────────────────────────────┘

移动端 (< 768px):
┌─────────────────────┐
│ 移动端顶栏 (h-[56px]) │  ← glass-topbar + 汉堡菜单
│ 侧边栏抽屉 (overlay)  │  ← 滑入动画 + 遮罩
│ main content (p-4)   │
└─────────────────────┘
```

#### 客户端（Mobile-first）

```
┌─────────────────────┐
│ glass-topbar (sticky, py-3.5)  ← 品牌名 + 用户名 + 退出
│ main (max-w-lg, px-4, py-4)    ← 内容限宽 448px
│ 底部 Tab (fixed, pb safe-area) ← 3 Tab: 订单/消息/我的
│ pb-[68px]                       ← 底部留白避开 Tab
└─────────────────────┘
```

#### 断点

| 断点 | 宽度 | 用途 |
|---|---|---|
| sm | 640px | 大屏手机 |
| md | 768px | 管理端侧边栏切换点 |
| lg | 1024px | 小桌面 |
| xl | 1280px | 桌面 |

---

## 9. 里程碑与优先级

| 阶段 | 周期 | 交付物 | 优先级 |
|---|---|---|:---:|
| M1: 基础架构 | Week 1-2 | 项目初始化、数据库Schema、JWT认证、9级RBAC、多租户基座 | P0 |
| M2: 核心工作流 | Week 3-5 | 订单CRUD、状态机引擎、各角色工作台UI | P0 |
| M3: 文件与客户端 | Week 6-8 | 阿里云OSS预签名直传、客户上传组件(A类)、材料下载面板(B类)、客户详情页、确认提交、出签反馈、通知中心、Socket.io客户端、个人中心、通知闭环(9节点) | P0 | ✅ 100% (全部8批次完成) |
| M4: 实时通信 | Week 9-10 | Socket.io通知、站内信、SMS预留接口 | P1 | ✅ 100% (全部5批次完成) |
| **M5: 多申请人+数据看板** | **Week 11-13** | **Applicant子表(✅)、多申请人工作流(✅)、财务字段(✅)、数据看板(✅)、Excel导出(✅)、历史数据迁移(✅)** | **P0** | **✅ 100% (全部8批次完成)** |
| M6: 行业优化 | Week 14-15 | 签证模板库(✅)、智能检查(✅)、批量操作(✅)、订单模板快速录入(✅)、签证分类流程差异化(✅)、团队管理(✅)、系统设置(✅) | P2 | ✅ 100% |
| **M7: 分层模块化** | **Week 16-17** | **统一登录入口、Portal首页（广告Banner+6大工具入口+推荐内容流）、门户布局（底部4Tab）、ERP入口集成（账号面板）、6大工具模块骨架（资讯/行程/申请表/评估/翻译/证明文件）** | **P0** | **🔲 ✅ 100% (Phase 0-5 全部完成)** |
| **M8: C 端平台化改造** | **Week 18-19** | **品牌统一(华夏签证)、C 端首页(Airbnb 风格)、底部 5 Tab 导航、ERP 入口隐藏("我的"页面内)、6 大工具 UI 完善、服务页面** | **P0** | **🔲 待开发**（详见 09-c-end-transformation-plan.md）

> **架构决策**：M7 采用"不动存量、纯增量"方案 — ERP系统（141文件）零改动，新增门户层（~16文件）独立路由 `/portal/*`，仅改3个现有文件（page.tsx + login/page.tsx + middleware.ts）。详见 `08-architecture-redesign.md V6.0`。

### 工作流完整性验证（2026-03-28）

基于用户提供的完整业务工作流描述（5阶段20+步骤），逐句对比当前代码实现，完成全面查漏补缺：

| # | 级别 | 缺口 | 修复 |
|---|:---:|---|---|
| 1 | P0 | 操作员审核资料不通知资料员 | documents/[id]/PATCH 增加通知资料员（含进度统计） |
| 2 | P0 | 资料审核合格时资料员无感知 | APPROVED 也通知资料员（"已合格 3/5"） |
| 3 | P0 | 资料员打回材料缺备注通道 | 状态流转弹窗备注必填 + 动态 placeholder |
| 4 | P1 | "提交复审" vs "提交审核"文案 | 根据 orderLogs 判断复审场景 |
| 5 | P1 | 签证类型差异化结果反馈 | 申根/电子签/其他 → 不同反馈入口 |
| 6 | P1 | 客户端缺"全部合格"视觉提示 | 全部 APPROVED 时显示绿色完成提示 |
| 7 | P2 | 店铺 API 未预留 | 新增 /api/shop/sync + /api/shop/webhook (501) |
| 8 | P2 | SMS 接口未创建 | 新增 /api/sms/send + /api/sms/templates (501) |
| 9 | P2 | 状态流转备注 placeholder 不明确 | 根据操作类型动态生成提示文字 |

---

*文档结束*
