# 沐海旅行 - 签证行业ERP系统

签证办理行业专属 SaaS 多租户 ERP 系统

## 快速开始

### 方式一：AI 自动初始化

将以下内容发送给 AI 助手：

```
请帮我初始化 ERP 项目：

1. 运行 ERP-BOOTSTRAP.sh 脚本
2. 阅读 docs/ 目录下的四份文档（01-PRD、02-architecture、03-project-status、04-dev-standards）
3. 告诉我当前项目状态及后续开发计划
```

### 方式二：手动执行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（ERP-BOOTSTRAP.sh 自动创建 .env.local，或手动配置）
cp .env.example .env.local

# 3. 生成 Prisma Client
npx prisma generate

# 4. 填充种子数据
npx prisma db seed

# 5. 启动开发服务器（Custom Server + Socket.io）
npm run dev
```

## 环境配置一览

| 配置项 | 值 |
|---|---|
| 服务器 | 223.6.248.154:3002 |
| 数据库 | 阿里云 RDS MySQL 8.0 |
| 文件存储 | 阿里云 OSS oss-cn-beijing / hxvisa001 |
| Git | github.com/Laogui-666/ERP |

## 超级管理员账号

- 用户名：`superadmin`
- 密码：`Admin@123456`
- 角色：SUPER_ADMIN (Lv1)

## 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 全栈框架 | Next.js (App Router) | 14.2.18 |
| 前端 UI | React + Tailwind CSS + Shadcn UI | 18.x / 3.4 |
| ORM | Prisma | 5.22 |
| 数据库 | 阿里云 RDS MySQL | 8.0 |
| 状态管理 | Zustand | 5.x |
| 实时通信 | Socket.io | 4.8 |
| 文件存储 | 阿里云 OSS | SDK 2.x |
| 认证 | JWT (jose) | 无状态双 Token |

## 目录结构

```
├── prisma/                    # 数据库 Schema & 迁移 & 种子
├── src/
│   ├── app/
│   │   ├── (auth)/           # 登录/注册/重置密码
│   │   ├── (admin)/          # 管理端（仪表盘/订单/公共池...）
│   │   ├── (customer)/       # 客户端（订单/通知...）
│   │   └── api/              # 17 个 API 路由
│   ├── components/           # UI 组件（13个）
│   ├── lib/                  # 核心库（auth/rbac/transition/events/socket/oss...）
│   ├── services/             # 业务服务层
│   ├── hooks/                # React Hooks
│   ├── stores/               # Zustand 状态管理
│   ├── types/                # TypeScript 类型定义
│   ├── middleware.ts          # 鉴权 + 权限 + 租户中间件
│   └── styles/               # 玻璃拟态 + 莫兰迪冷色系
├── server.ts                  # Custom Server（Next.js + Socket.io 共享端口）
├── docs/                      # 项目文档（PRD/架构/状态/规范）
├── ERP-BOOTSTRAP.sh           # 一键初始化脚本
└── README.md
```

## 数据库表（全部 erp_ 前缀）

| 表名 | 说明 |
|---|---|
| erp_companies | 公司/租户 |
| erp_departments | 部门 |
| erp_users | 用户（9级角色） |
| erp_orders | 签证订单 |
| erp_document_requirements | 资料需求清单 |
| erp_document_files | 资料文件 |
| erp_visa_materials | 签证材料 |
| erp_order_logs | 操作日志 |
| erp_notifications | 站内通知 |
| erp_visa_templates | 签证模板库 |

## 核心工作流

```
客服录单 → 待对接
  ↓ 资料员接单（公共池）
已对接 → 资料收集中 ←→ 客户上传/资料员审核
  ↓ 资料员提交审核
待审核 → 操作员接单（公共池）→ 资料审核中
  ↓                          ↓ (打回补充)
开始制作材料 ←──────────── 资料收集中
  ↓
待交付 → 资料员确认 → 已交付 → 出签/拒签
```

## 当前进度

- **M1 基础架构**: ✅ 100%（12/12 修复项完成）
- **M2 核心工作流**: 🔧 进行中（19 项任务，通知系统已完成）
- **M3 文件+客户端**: ⬜ 待开发
- **M4 实时通信**: ⬜ 待开发
- **M5 数据与管理**: ⬜ 待开发
- **M6 行业优化**: ⬜ 待开发

## 部署

```bash
npm run build
npx prisma migrate deploy
pm2 start npm --name "erp" -- start
```

## 文档

- [产品需求文档 (PRD)](./docs/01-PRD.md)
- [架构设计文档](./docs/02-architecture.md)
- [项目状态](./docs/03-project-status.md)
- [开发规范](./docs/04-dev-standards.md)
