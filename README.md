# 沐海旅行 - 签证行业ERP系统

签证办理行业专属 SaaS 多租户 ERP 系统

## 技术栈

| 层 | 技术 |
|---|---|
| 全栈框架 | Next.js 14 (App Router) |
| 前端 UI | React 18 + Tailwind CSS + Shadcn UI |
| ORM | Prisma 5.x |
| 数据库 | 阿里云 RDS MySQL 8.0 |
| 状态管理 | Zustand |
| 实时通信 | Socket.io |
| 文件存储 | 阿里云 OSS |
| 认证 | JWT (jose) |

## 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入数据库等配置

# 3. 数据库迁移
npx prisma migrate dev

# 4. 初始化种子数据
npx prisma db seed

# 5. 启动开发服务器
npm run dev
```

## 目录结构

```
├── prisma/                    # 数据库 Schema & 迁移
├── src/
│   ├── app/
│   │   ├── (auth)/           # 登录/注册页面
│   │   ├── (admin)/          # 管理端页面
│   │   ├── (customer)/       # 客户端页面
│   │   └── api/              # API 路由
│   ├── components/           # React 组件
│   ├── lib/                  # 核心工具库
│   ├── services/             # 业务服务层
│   ├── hooks/                # React Hooks
│   ├── stores/               # Zustand 状态
│   ├── types/                # TypeScript 类型
│   ├── middleware.ts          # Next.js 中间件
│   └── styles/               # 样式文件
├── docs/                     # 项目文档
└── README.md
```

## 核心工作流

```
客服录单 → 待对接
  ↓ 资料员接单
资料收集中 ←→ 待审核 → 资料审核中
  ↓                ↓ (打回)
提交审核        开始制作材料
  ↓                ↓
材料制作中 ←→ 待交付 → 已交付 → 出签/拒签
```

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
