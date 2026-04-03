import type { UserRole } from '@shared/types/user'
import type { JwtPayload } from '@shared/lib/auth'
import { AppError } from '@shared/types/api'

// ==================== 字段权限定义 ====================

export interface FieldPermission {
  resource: string
  fields: string[]
}

// ==================== 增强型权限矩阵 ====================

interface EnhancedPermission {
  resource: string
  actions: string[]
  fields?: string[]
  conditions?: Record<string, unknown>
}

// 字段级权限配置
const FIELD_PERMISSIONS: Record<UserRole, FieldPermission[]> = {
  SUPER_ADMIN: [
    { resource: 'orders', fields: ['*'] },
    { resource: 'users', fields: ['*'] },
    { resource: 'documents', fields: ['*'] },
    { resource: 'materials', fields: ['*'] },
  ],

  COMPANY_OWNER: [
    { resource: 'orders', fields: ['*'] },
    { resource: 'users', fields: ['*'] },
    { resource: 'documents', fields: ['*'] },
    { resource: 'materials', fields: ['*'] },
  ],

  CS_ADMIN: [
    { resource: 'orders', fields: ['id', 'orderNo', 'customerName', 'customerPhone', 'status', 'amount', 'createdAt'] },
    { resource: 'users', fields: ['id', 'username', 'realName', 'role', 'departmentId'] },
    { resource: 'documents', fields: ['*'] },
  ],

  CUSTOMER_SERVICE: [
    { resource: 'orders', fields: ['id', 'orderNo', 'customerName', 'customerPhone', 'status', 'amount', 'createdAt', 'remark'] },
    { resource: 'documents', fields: ['*'] },
  ],

  VISA_ADMIN: [
    { resource: 'orders', fields: ['*'] },
    { resource: 'users', fields: ['id', 'username', 'realName', 'role', 'departmentId'] },
    { resource: 'documents', fields: ['*'] },
    { resource: 'materials', fields: ['*'] },
  ],

  DOC_COLLECTOR: [
    { resource: 'orders', fields: ['id', 'orderNo', 'customerName', 'status', 'createdAt'] },
    { resource: 'documents', fields: ['*'] },
  ],

  OPERATOR: [
    { resource: 'orders', fields: ['id', 'orderNo', 'customerName', 'status', 'createdAt', 'targetCountry', 'visaType'] },
    { resource: 'documents', fields: ['id', 'name', 'status', 'files'] },
    { resource: 'materials', fields: ['*'] },
  ],

  OUTSOURCE: [
    { resource: 'orders', fields: ['id', 'orderNo', 'status', 'createdAt', 'targetCountry', 'visaType'] },
    { resource: 'documents', fields: ['id', 'name', 'status'] },
    { resource: 'materials', fields: ['*'] },
  ],

  CUSTOMER: [
    { resource: 'orders', fields: ['id', 'orderNo', 'status', 'createdAt', 'targetCountry', 'visaType', 'amount'] },
    { resource: 'documents', fields: ['id', 'name', 'status'] },
    { resource: 'materials', fields: ['id', 'fileName', 'ossUrl'] },
  ],
}

// 增强型权限矩阵
const ENHANCED_ROLE_PERMISSIONS: Record<UserRole, EnhancedPermission[]> = {
  SUPER_ADMIN: [
    { resource: '*', actions: ['*'], fields: ['*'] },
  ],

  COMPANY_OWNER: [
    { 
      resource: 'orders', 
      actions: ['read', 'create', 'update', 'assign', 'transition', 'reassign', 'delete'],
      fields: ['*'],
    },
    { resource: 'pool', actions: ['read'], fields: ['*'] },
    { resource: 'users', actions: ['read', 'create', 'update', 'delete'], fields: ['*'] },
    { resource: 'departments', actions: ['read', 'create', 'update', 'delete'], fields: ['*'] },
    { resource: 'documents', actions: ['read', 'create', 'update', 'delete'], fields: ['*'] },
    { resource: 'materials', actions: ['read', 'create', 'update', 'delete'], fields: ['*'] },
    { resource: 'templates', actions: ['read', 'create', 'update', 'delete'], fields: ['*'] },
    { resource: 'analytics', actions: ['read', 'export'], fields: ['*'] },
    { resource: 'audit', actions: ['read'], fields: ['*'] },
    { resource: 'notifications', actions: ['read', 'update'], fields: ['*'] },
    { resource: 'chat', actions: ['read', 'send'], fields: ['*'] },
  ],

  CS_ADMIN: [
    { 
      resource: 'orders', 
      actions: ['read', 'create', 'update', 'assign', 'reassign'],
      fields: ['id', 'orderNo', 'customerName', 'customerPhone', 'status', 'amount', 'createdAt', 'remark'],
    },
    { resource: 'users', actions: ['read'], fields: ['id', 'username', 'realName', 'role', 'departmentId'] },
    { resource: 'analytics', actions: ['read'], fields: ['*'] },
    { resource: 'notifications', actions: ['read', 'update'], fields: ['*'] },
    { resource: 'chat', actions: ['read', 'send'], fields: ['*'] },
  ],

  CUSTOMER_SERVICE: [
    { 
      resource: 'orders', 
      actions: ['read', 'create', 'update'],
      fields: ['id', 'orderNo', 'customerName', 'customerPhone', 'status', 'amount', 'createdAt', 'remark'],
    },
    { resource: 'notifications', actions: ['read', 'update'], fields: ['*'] },
    { resource: 'chat', actions: ['read', 'send'], fields: ['*'] },
  ],

  VISA_ADMIN: [
    { 
      resource: 'orders', 
      actions: ['read', 'create', 'update', 'assign', 'transition', 'reassign'],
      fields: ['*'],
    },
    { resource: 'pool', actions: ['read', 'claim'], fields: ['*'] },
    { resource: 'users', actions: ['read'], fields: ['id', 'username', 'realName', 'role', 'departmentId'] },
    { resource: 'documents', actions: ['read', 'create', 'update'], fields: ['*'] },
    { resource: 'materials', actions: ['read', 'create', 'update'], fields: ['*'] },
    { resource: 'templates', actions: ['read', 'create', 'update', 'delete'], fields: ['*'] },
    { resource: 'analytics', actions: ['read'], fields: ['*'] },
    { resource: 'notifications', actions: ['read', 'update'], fields: ['*'] },
    { resource: 'chat', actions: ['read', 'send'], fields: ['*'] },
  ],

  DOC_COLLECTOR: [
    { 
      resource: 'orders', 
      actions: ['read', 'transition'],
      fields: ['id', 'orderNo', 'customerName', 'status', 'createdAt'],
    },
    { resource: 'pool', actions: ['read', 'claim'], fields: ['*'] },
    { resource: 'documents', actions: ['read', 'create', 'update'], fields: ['*'] },
    { resource: 'notifications', actions: ['read', 'update'], fields: ['*'] },
    { resource: 'chat', actions: ['read', 'send'], fields: ['*'] },
  ],

  OPERATOR: [
    { 
      resource: 'orders', 
      actions: ['read', 'transition'],
      fields: ['id', 'orderNo', 'customerName', 'status', 'createdAt', 'targetCountry', 'visaType'],
    },
    { resource: 'pool', actions: ['read', 'claim'], fields: ['*'] },
    { resource: 'documents', actions: ['read'], fields: ['id', 'name', 'status', 'files'] },
    { resource: 'materials', actions: ['read', 'create', 'update'], fields: ['*'] },
    { resource: 'notifications', actions: ['read', 'update'], fields: ['*'] },
    { resource: 'chat', actions: ['read', 'send'], fields: ['*'] },
  ],

  OUTSOURCE: [
    { 
      resource: 'orders', 
      actions: ['read', 'transition'],
      fields: ['id', 'orderNo', 'status', 'createdAt', 'targetCountry', 'visaType'],
    },
    { resource: 'pool', actions: ['read', 'claim'], fields: ['*'] },
    { resource: 'documents', actions: ['read'], fields: ['id', 'name', 'status'] },
    { resource: 'materials', actions: ['read', 'create', 'update'], fields: ['*'] },
    { resource: 'notifications', actions: ['read', 'update'], fields: ['*'] },
  ],

  CUSTOMER: [
    { 
      resource: 'orders', 
      actions: ['read', 'transition'],
      fields: ['id', 'orderNo', 'status', 'createdAt', 'targetCountry', 'visaType', 'amount'],
    },
    { resource: 'documents', actions: ['read', 'create', 'delete'], fields: ['id', 'name', 'status'] },
    { resource: 'materials', actions: ['read'], fields: ['id', 'fileName', 'ossUrl'] },
    { resource: 'notifications', actions: ['read', 'update'], fields: ['*'] },
    { resource: 'chat', actions: ['read', 'send'], fields: ['*'] },
  ],
}

// ==================== 字段权限检查 ====================

export function hasFieldPermission(role: UserRole, resource: string, field: string): boolean {
  const fieldPermissions = FIELD_PERMISSIONS[role]
  if (!fieldPermissions) return false

  return fieldPermissions.some((perm) => {
    const resourceMatch = perm.resource === '*' || perm.resource === resource
    const fieldMatch = perm.fields.includes('*') || perm.fields.includes(field)
    return resourceMatch && fieldMatch
  })
}

// ==================== 数据脱敏 ====================

export function desensitizeData<T extends Record<string, unknown>>(
  data: T,
  role: UserRole,
  resource: string
): Partial<T> {
  const result: Partial<T> = {}

  for (const [key, value] of Object.entries(data)) {
    if (hasFieldPermission(role, resource, key)) {
      result[key as keyof T] = value as T[keyof T]
    }
  }

  return result
}

export function desensitizeArray<T extends Record<string, unknown>>(
  data: T[],
  role: UserRole,
  resource: string
): Partial<T>[] {
  return data.map((item) => desensitizeData(item, role, resource))
}

// ==================== 增强型权限检查 ====================

export function hasEnhancedPermission(
  role: UserRole,
  resource: string,
  action: string,
  field?: string
): boolean {
  const permissions = ENHANCED_ROLE_PERMISSIONS[role]
  if (!permissions) return false

  const matchingPerm = permissions.find((perm) => {
    const resourceMatch = perm.resource === '*' || perm.resource === resource
    const actionMatch = perm.actions.includes('*') || perm.actions.includes(action)
    return resourceMatch && actionMatch
  })

  if (!matchingPerm) return false

  // 如果指定了字段，检查字段权限
  if (field && matchingPerm.fields) {
    return matchingPerm.fields.includes('*') || matchingPerm.fields.includes(field)
  }

  return true
}

export function requireEnhancedPermission(
  user: JwtPayload,
  resource: string,
  action: string,
  field?: string
): void {
  if (!hasEnhancedPermission(user.role, resource, action, field)) {
    throw new AppError(
      'FORBIDDEN',
      field
        ? `无权限访问字段: ${resource}.${field}`
        : `无权限执行此操作: ${resource}.${action}`,
      403
    )
  }
}

// ==================== 权限审计 ====================

interface PermissionAuditLog {
  userId: string
  role: UserRole
  resource: string
  action: string
  field?: string
  granted: boolean
  timestamp: Date
  ip?: string
}

const auditLogs: PermissionAuditLog[] = []

export function logPermissionCheck(
  userId: string,
  role: UserRole,
  resource: string,
  action: string,
  granted: boolean,
  field?: string,
  ip?: string
): void {
  const logEntry: PermissionAuditLog = {
    userId,
    role,
    resource,
    action,
    granted,
    timestamp: new Date(),
  }
  
  if (field) {
    logEntry.field = field
  }
  if (ip) {
    logEntry.ip = ip
  }
  
  auditLogs.push(logEntry)

  // 保留最近10000条日志
  if (auditLogs.length > 10000) {
    auditLogs.shift()
  }
}

export function getPermissionAuditLogs(
  filters?: Partial<Omit<PermissionAuditLog, 'timestamp'>>
): PermissionAuditLog[] {
  let logs = [...auditLogs]

  if (filters) {
    logs = logs.filter((log) => {
      return Object.entries(filters).every(([key, value]) => {
        return log[key as keyof PermissionAuditLog] === value
      })
    })
  }

  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// ==================== 导出函数 ====================

export {
  ENHANCED_ROLE_PERMISSIONS,
  FIELD_PERMISSIONS,
}

export type {
  EnhancedPermission,
  PermissionAuditLog,
}