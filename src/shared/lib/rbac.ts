import type { UserRole } from '@shared/types/user'
import type { JwtPayload } from '@shared/lib/auth'
import { AppError } from '@shared/types/api'

// ==================== 功能权限矩阵 ====================

interface Permission {
  resource: string
  actions: string[]
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [{ resource: '*', actions: ['*'] }],

  COMPANY_OWNER: [
    { resource: 'orders', actions: ['read', 'create', 'update', 'assign', 'transition', 'reassign'] },
    { resource: 'pool', actions: ['read'] },
    { resource: 'users', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'departments', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'documents', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'materials', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'templates', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'audit', actions: ['read'] },
    { resource: 'notifications', actions: ['read', 'update'] },
    { resource: 'chat', actions: ['read', 'send'] },
  ],

  CS_ADMIN: [
    { resource: 'orders', actions: ['read', 'create', 'update', 'assign', 'reassign'] },
    { resource: 'users', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'notifications', actions: ['read', 'update'] },
    { resource: 'chat', actions: ['read', 'send'] },
  ],

  CUSTOMER_SERVICE: [
    { resource: 'orders', actions: ['read', 'create', 'update'] },
    { resource: 'notifications', actions: ['read', 'update'] },
    { resource: 'chat', actions: ['read', 'send'] },
  ],

  VISA_ADMIN: [
    { resource: 'orders', actions: ['read', 'create', 'update', 'assign', 'transition', 'reassign'] },
    { resource: 'pool', actions: ['read', 'claim'] },
    { resource: 'users', actions: ['read'] },
    { resource: 'documents', actions: ['read', 'create', 'update'] },
    { resource: 'materials', actions: ['read', 'create', 'update'] },
    { resource: 'templates', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'notifications', actions: ['read', 'update'] },
    { resource: 'chat', actions: ['read', 'send'] },
  ],

  DOC_COLLECTOR: [
    { resource: 'orders', actions: ['read', 'transition'] },
    { resource: 'pool', actions: ['read', 'claim'] },
    { resource: 'documents', actions: ['read', 'create', 'update'] },
    { resource: 'templates', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'notifications', actions: ['read', 'update'] },
    { resource: 'chat', actions: ['read', 'send'] },
  ],

  OPERATOR: [
    { resource: 'orders', actions: ['read', 'transition'] },
    { resource: 'pool', actions: ['read', 'claim'] },
    { resource: 'documents', actions: ['read'] },
    { resource: 'materials', actions: ['read', 'create', 'update'] },
    { resource: 'notifications', actions: ['read', 'update'] },
    { resource: 'chat', actions: ['read', 'send'] },
  ],

  OUTSOURCE: [
    { resource: 'orders', actions: ['read', 'transition'] },
    { resource: 'pool', actions: ['read', 'claim'] },
    { resource: 'documents', actions: ['read'] },
    { resource: 'materials', actions: ['read', 'create', 'update'] },
    { resource: 'notifications', actions: ['read', 'update'] },
    // OUTSOURCE 无 chat 权限
  ],

  CUSTOMER: [
    { resource: 'orders', actions: ['read', 'transition'] },
    { resource: 'documents', actions: ['read', 'create', 'delete'] },
    { resource: 'materials', actions: ['read'] },
    { resource: 'notifications', actions: ['read', 'update'] },
    { resource: 'chat', actions: ['read', 'send'] },
  ],
}

// ==================== 路由级权限 ====================

const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/admin/dashboard': ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'],
  '/admin/orders': ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'CUSTOMER_SERVICE', 'VISA_ADMIN', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE'],
  '/admin/pool': ['VISA_ADMIN', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE'],
  '/admin/workspace': ['CUSTOMER_SERVICE', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE'],
  '/admin/templates': ['COMPANY_OWNER', 'VISA_ADMIN', 'DOC_COLLECTOR'],
  '/admin/team': ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'],
  '/admin/analytics': ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'],
  '/admin/settings': ['SUPER_ADMIN', 'COMPANY_OWNER'],
  '/customer': ['CUSTOMER'],
}

// ==================== 导出函数 ====================

export function hasPermission(role: UserRole, resource: string, action: string): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false

  return permissions.some((perm) => {
    const resourceMatch = perm.resource === '*' || perm.resource === resource
    const actionMatch = perm.actions.includes('*') || perm.actions.includes(action)
    return resourceMatch && actionMatch
  })
}

export function requirePermission(user: JwtPayload, resource: string, action: string): void {
  if (!hasPermission(user.role, resource, action)) {
    throw new AppError('FORBIDDEN', `无权限执行此操作: ${resource}.${action}`, 403)
  }
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const matchingRoutes = Object.keys(ROUTE_ACCESS)
    .filter((route) => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)

  if (matchingRoutes.length === 0) return true

  const allowedRoles = ROUTE_ACCESS[matchingRoutes[0]]
  return allowedRoles.includes(role)
}

/**
 * 数据范围过滤：按角色返回查询条件
 */
export function getDataScopeFilter(user: JwtPayload): Record<string, unknown> {
  switch (user.role) {
    case 'SUPER_ADMIN':
      return {}
    case 'COMPANY_OWNER':
      return { companyId: user.companyId }
    case 'CS_ADMIN':
      // 客服部：能看到本部门客服创建的订单
      return { companyId: user.companyId }
    case 'CUSTOMER_SERVICE':
      // 客服：只看到自己录入的订单
      return { companyId: user.companyId, createdBy: user.userId }
    case 'VISA_ADMIN':
      return { companyId: user.companyId }
    case 'DOC_COLLECTOR':
      // 资料员：自己接单的订单
      return {
        companyId: user.companyId,
        collectorId: user.userId,
      }
    case 'OPERATOR':
    case 'OUTSOURCE':
      // 操作员/外包：自己接单的订单
      return {
        companyId: user.companyId,
        operatorId: user.userId,
      }
    case 'CUSTOMER':
      return {
        companyId: user.companyId,
        customerId: user.userId,
      }
    default:
      return { companyId: user.companyId }
  }
}

export const ROLES_HIERARCHY: UserRole[] = [
  'SUPER_ADMIN',
  'COMPANY_OWNER',
  'CS_ADMIN',
  'CUSTOMER_SERVICE',
  'VISA_ADMIN',
  'DOC_COLLECTOR',
  'OPERATOR',
  'OUTSOURCE',
  'CUSTOMER',
]
