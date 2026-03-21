# M1 审查修复计划

> **创建日期**: 2026-03-20
> **审查范围**: 全部 62 个源文件 + Prisma Schema + 配置文件
> **审查结果**: TypeScript 编译 0 错误 / 构建成功 / 发现 6 个需修复问题

## 修复清单

| # | 优先级 | 文件 | 问题 | 风险 | 状态 |
|---|---|---|---|---|:---:|
| 1 | 🔴 P0 | `src/app/api/users/route.ts` | `as any` 绕过角色枚举校验，可注入任意角色 | 权限提升漏洞 | ✅ |
| 2 | 🔴 P0 | `src/app/api/orders/pool/route.ts` | 公共池未排除已接订单（缺 `collectorId/operatorId: null` 过滤） | 重复接单 | ✅ |
| 3 | 🔴 P0 | `src/app/api/orders/route.ts` POST | 客户账号查询缺少 `companyId` 过滤 | 跨公司数据泄露 | ✅ |
| 4 | 🔴 P0 | `src/app/(auth)/register/page.tsx` | 手机号 zod 校验缺正则，允许无效号码注册 | 业务数据污染 | ✅ |
| 5 | 🟡 P1 | `src/middleware.ts` | `getCurrentUser` 调用两次，每个页面请求多一次 JWT 解析 | 性能浪费 | ✅ |
| 6 | 🟡 P1 | `src/app/api/orders/route.ts` GET | 订单列表查询了未使用的 collector/operator 关联 | 多余 LEFT JOIN | ✅ |

## 修复详情

### #1 用户角色注入漏洞
**文件**: `src/app/api/users/route.ts`
**问题**: `role: z.string()` 未限制枚举值 + `as any` 绕过类型检查
**修复**: 改为 `z.enum([...合法角色...])`，移除 `as any`

### #2 公共池重复接单
**文件**: `src/app/api/orders/pool/route.ts`
**问题**: 只按 `status` 过滤，未排除已被接单的订单
**修复**: 资料员池加 `collectorId: null`，操作员池加 `operatorId: null`

### #3 跨公司客户查找
**文件**: `src/app/api/orders/route.ts` POST handler
**问题**: `findFirst({ where: { phone } })` 缺少 `companyId` 和 `role` 过滤
**修复**: 加 `companyId: user.companyId, role: 'CUSTOMER'`

### #4 注册手机号校验
**文件**: `src/app/(auth)/register/page.tsx`
**问题**: phone 字段只检查 `min(11)`，允许非数字和无效号段
**修复**: zod 加 `.regex(/^1[3-9]\d{9}$/)`，前端加 `pattern` + `maxLength={11}`

### #5 中间件重复鉴权
**文件**: `src/middleware.ts`
**问题**: API 分支和页面分支各调用一次 `getCurrentUser`
**修复**: 函数开头统一调用一次，后续复用

### #6 列表查询优化
**文件**: `src/app/api/orders/route.ts` GET handler
**问题**: select 中包含 `collector/operator` 关联但列表不需要
**修复**: 移除关联 select，减少 LEFT JOIN
