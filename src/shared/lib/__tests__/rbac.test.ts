import { describe, it, expect } from 'vitest'
import { hasPermission, canAccessRoute, getDataScopeFilter } from '@shared/lib/rbac'
import type { UserRole } from '@shared/types/user'
import type { JwtPayload } from '@shared/lib/auth'

function makeUser(role: UserRole, overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    userId: 'user-1',
    username: 'test',
    role,
    companyId: 'company-1',
    departmentId: null,
    realName: '测试用户',
    avatar: null,
    ...overrides,
  }
}

describe('hasPermission', () => {
  it('SUPER_ADMIN has all permissions', () => {
    expect(hasPermission('SUPER_ADMIN', 'orders', 'create')).toBe(true)
    expect(hasPermission('SUPER_ADMIN', 'users', 'delete')).toBe(true)
    expect(hasPermission('SUPER_ADMIN', 'anything', 'whatever')).toBe(true)
  })

  it('CUSTOMER_SERVICE can create orders but not delete users', () => {
    expect(hasPermission('CUSTOMER_SERVICE', 'orders', 'create')).toBe(true)
    expect(hasPermission('CUSTOMER_SERVICE', 'orders', 'read')).toBe(true)
    expect(hasPermission('CUSTOMER_SERVICE', 'users', 'delete')).toBe(false)
    expect(hasPermission('CUSTOMER_SERVICE', 'analytics', 'read')).toBe(false)
  })

  it('DOC_COLLECTOR can transition orders but not create', () => {
    expect(hasPermission('DOC_COLLECTOR', 'orders', 'transition')).toBe(true)
    expect(hasPermission('DOC_COLLECTOR', 'orders', 'read')).toBe(true)
    expect(hasPermission('DOC_COLLECTOR', 'orders', 'create')).toBe(false)
    expect(hasPermission('DOC_COLLECTOR', 'pool', 'claim')).toBe(true)
  })

  it('CUSTOMER can only read orders and documents', () => {
    expect(hasPermission('CUSTOMER', 'orders', 'read')).toBe(true)
    expect(hasPermission('CUSTOMER', 'documents', 'read')).toBe(true)
    expect(hasPermission('CUSTOMER', 'documents', 'create')).toBe(true)
    expect(hasPermission('CUSTOMER', 'orders', 'create')).toBe(false)
    expect(hasPermission('CUSTOMER', 'pool', 'read')).toBe(false)
  })

  it('OUTSOURCE can transition and manage materials', () => {
    expect(hasPermission('OUTSOURCE', 'orders', 'transition')).toBe(true)
    expect(hasPermission('OUTSOURCE', 'materials', 'create')).toBe(true)
    expect(hasPermission('OUTSOURCE', 'orders', 'create')).toBe(false)
  })

  it('CUSTOMER can send chat messages', () => {
    expect(hasPermission('CUSTOMER', 'chat', 'read')).toBe(true)
    expect(hasPermission('CUSTOMER', 'chat', 'send')).toBe(true)
  })

  it('OUTSOURCE cannot access chat', () => {
    expect(hasPermission('OUTSOURCE', 'chat', 'read')).toBe(false)
    expect(hasPermission('OUTSOURCE', 'chat', 'send')).toBe(false)
  })

  it('DOC_COLLECTOR can read and send chat', () => {
    expect(hasPermission('DOC_COLLECTOR', 'chat', 'read')).toBe(true)
    expect(hasPermission('DOC_COLLECTOR', 'chat', 'send')).toBe(true)
  })

  it('COMPANY_OWNER can read and send chat', () => {
    expect(hasPermission('COMPANY_OWNER', 'chat', 'read')).toBe(true)
    expect(hasPermission('COMPANY_OWNER', 'chat', 'send')).toBe(true)
  })
})

describe('canAccessRoute', () => {
  it('SUPER_ADMIN can access all routes', () => {
    expect(canAccessRoute('SUPER_ADMIN', '/admin/dashboard')).toBe(true)
    expect(canAccessRoute('SUPER_ADMIN', '/admin/orders')).toBe(true)
    expect(canAccessRoute('SUPER_ADMIN', '/admin/settings')).toBe(true)
  })

  it('CUSTOMER_SERVICE cannot access dashboard or analytics', () => {
    expect(canAccessRoute('CUSTOMER_SERVICE', '/admin/orders')).toBe(true)
    expect(canAccessRoute('CUSTOMER_SERVICE', '/admin/workspace')).toBe(true)
    expect(canAccessRoute('CUSTOMER_SERVICE', '/admin/dashboard')).toBe(false)
    expect(canAccessRoute('CUSTOMER_SERVICE', '/admin/analytics')).toBe(false)
  })

  it('CUSTOMER can only access customer routes', () => {
    expect(canAccessRoute('CUSTOMER', '/customer/orders')).toBe(true)
    expect(canAccessRoute('CUSTOMER', '/admin/orders')).toBe(false)
    expect(canAccessRoute('CUSTOMER', '/admin/dashboard')).toBe(false)
  })

  it('DOC_COLLECTOR can access pool and workspace', () => {
    expect(canAccessRoute('DOC_COLLECTOR', '/admin/orders')).toBe(true)
    expect(canAccessRoute('DOC_COLLECTOR', '/admin/pool')).toBe(true)
    expect(canAccessRoute('DOC_COLLECTOR', '/admin/workspace')).toBe(true)
    expect(canAccessRoute('DOC_COLLECTOR', '/admin/analytics')).toBe(false)
  })

  it('unknown routes are allowed by default', () => {
    expect(canAccessRoute('CUSTOMER_SERVICE', '/admin/unknown')).toBe(true)
  })
})

describe('getDataScopeFilter', () => {
  it('SUPER_ADMIN has no filter (all data)', () => {
    const user = makeUser('SUPER_ADMIN')
    expect(getDataScopeFilter(user)).toEqual({})
  })

  it('COMPANY_OWNER sees company data', () => {
    const user = makeUser('COMPANY_OWNER')
    const filter = getDataScopeFilter(user)
    expect(filter).toEqual({ companyId: 'company-1' })
  })

  it('CUSTOMER_SERVICE sees only own orders', () => {
    const user = makeUser('CUSTOMER_SERVICE')
    const filter = getDataScopeFilter(user)
    expect(filter).toEqual({ companyId: 'company-1', createdBy: 'user-1' })
  })

  it('DOC_COLLECTOR sees only collected orders', () => {
    const user = makeUser('DOC_COLLECTOR')
    const filter = getDataScopeFilter(user)
    expect(filter).toEqual({ companyId: 'company-1', collectorId: 'user-1' })
  })

  it('OPERATOR sees only operated orders', () => {
    const user = makeUser('OPERATOR')
    const filter = getDataScopeFilter(user)
    expect(filter).toEqual({ companyId: 'company-1', operatorId: 'user-1' })
  })

  it('CUSTOMER sees only own orders', () => {
    const user = makeUser('CUSTOMER')
    const filter = getDataScopeFilter(user)
    expect(filter).toEqual({ companyId: 'company-1', customerId: 'user-1' })
  })
})
