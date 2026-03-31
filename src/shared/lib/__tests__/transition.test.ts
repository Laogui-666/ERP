import { describe, it, expect } from 'vitest'
import { TRANSITION_RULES, getAvailableTransitions } from '@erp/lib/transition'
import type { OrderStatus } from '@erp/types/order'
import type { UserRole } from '@shared/types/user'

describe('TRANSITION_RULES', () => {
  it('should have exactly 15 rules', () => {
    expect(TRANSITION_RULES).toHaveLength(15)
  })

  it('should cover all expected status transitions', () => {
    const transitions = TRANSITION_RULES.map((r) => `${r.from}→${r.to}`)
    expect(transitions).toContain('PENDING_CONNECTION→CONNECTED')
    expect(transitions).toContain('CONNECTED→COLLECTING_DOCS')
    expect(transitions).toContain('COLLECTING_DOCS→PENDING_REVIEW')
    expect(transitions).toContain('COLLECTING_DOCS→UNDER_REVIEW')
    expect(transitions).toContain('PENDING_REVIEW→UNDER_REVIEW')
    expect(transitions).toContain('UNDER_REVIEW→COLLECTING_DOCS')
    expect(transitions).toContain('UNDER_REVIEW→MAKING_MATERIALS')
    expect(transitions).toContain('MAKING_MATERIALS→PENDING_DELIVERY')
    expect(transitions).toContain('PENDING_DELIVERY→MAKING_MATERIALS')
    expect(transitions).toContain('PENDING_DELIVERY→DELIVERED')
    expect(transitions).toContain('DELIVERED→APPROVED')
    expect(transitions).toContain('DELIVERED→REJECTED')
    expect(transitions).toContain('PARTIAL→APPROVED')
    expect(transitions).toContain('PARTIAL→REJECTED')
    expect(transitions).toContain('COLLECTING_DOCS→COLLECTING_DOCS')
  })

  it('every rule has an action description', () => {
    for (const rule of TRANSITION_RULES) {
      expect(rule.action).toBeTruthy()
      expect(typeof rule.action).toBe('string')
    }
  })

  it('every rule has at least one allowed role', () => {
    for (const rule of TRANSITION_RULES) {
      expect(rule.allowedRoles.length).toBeGreaterThan(0)
    }
  })
})

describe('getAvailableTransitions', () => {
  it('DOC_COLLECTOR can claim from PENDING_CONNECTION', () => {
    const transitions = getAvailableTransitions('PENDING_CONNECTION', 'DOC_COLLECTOR')
    expect(transitions).toHaveLength(1)
    expect(transitions[0].to).toBe('CONNECTED')
  })

  it('CUSTOMER_SERVICE cannot claim from PENDING_CONNECTION', () => {
    const transitions = getAvailableTransitions('PENDING_CONNECTION', 'CUSTOMER_SERVICE')
    expect(transitions).toHaveLength(0)
  })

  it('DOC_COLLECTOR can submit for review from COLLECTING_DOCS', () => {
    const transitions = getAvailableTransitions('COLLECTING_DOCS', 'DOC_COLLECTOR')
    // Can: COLLECTING_DOCS→COLLECTING_DOCS, COLLECTING_DOCS→PENDING_REVIEW, COLLECTING_DOCS→UNDER_REVIEW
    expect(transitions.length).toBeGreaterThanOrEqual(2)
    expect(transitions.some((t) => t.to === 'PENDING_REVIEW')).toBe(true)
    expect(transitions.some((t) => t.to === 'UNDER_REVIEW')).toBe(true)
  })

  it('OPERATOR can review and reject from UNDER_REVIEW', () => {
    const transitions = getAvailableTransitions('UNDER_REVIEW', 'OPERATOR')
    expect(transitions).toHaveLength(2)
    expect(transitions.some((t) => t.to === 'COLLECTING_DOCS')).toBe(true)
    expect(transitions.some((t) => t.to === 'MAKING_MATERIALS')).toBe(true)
  })

  it('OPERATOR can deliver materials from MAKING_MATERIALS', () => {
    const transitions = getAvailableTransitions('MAKING_MATERIALS', 'OPERATOR')
    expect(transitions).toHaveLength(1)
    expect(transitions[0].to).toBe('PENDING_DELIVERY')
  })

  it('DOC_COLLECTOR can confirm delivery from PENDING_DELIVERY', () => {
    const transitions = getAvailableTransitions('PENDING_DELIVERY', 'DOC_COLLECTOR')
    expect(transitions).toHaveLength(2)
    expect(transitions.some((t) => t.to === 'MAKING_MATERIALS')).toBe(true)
    expect(transitions.some((t) => t.to === 'DELIVERED')).toBe(true)
  })

  it('any allowed role can submit results from DELIVERED', () => {
    const roles: UserRole[] = ['OPERATOR', 'DOC_COLLECTOR', 'CUSTOMER', 'VISA_ADMIN']
    for (const role of roles) {
      const transitions = getAvailableTransitions('DELIVERED', role)
      expect(transitions.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('only COMPANY_OWNER and VISA_ADMIN can handle PARTIAL', () => {
    const ownerTransitions = getAvailableTransitions('PARTIAL', 'COMPANY_OWNER')
    expect(ownerTransitions).toHaveLength(2)

    const adminTransitions = getAvailableTransitions('PARTIAL', 'VISA_ADMIN')
    expect(adminTransitions).toHaveLength(2)

    const csTransitions = getAvailableTransitions('PARTIAL', 'CUSTOMER_SERVICE')
    expect(csTransitions).toHaveLength(0)
  })

  it('no transitions available from terminal states', () => {
    const approvedTransitions = getAvailableTransitions('APPROVED', 'SUPER_ADMIN')
    expect(approvedTransitions).toHaveLength(0)

    const rejectedTransitions = getAvailableTransitions('REJECTED', 'SUPER_ADMIN')
    expect(rejectedTransitions).toHaveLength(0)
  })

  it('CUSTOMER can only submit results from DELIVERED', () => {
    const transitions = getAvailableTransitions('DELIVERED', 'CUSTOMER')
    expect(transitions).toHaveLength(2)
    expect(transitions.some((t) => t.to === 'APPROVED')).toBe(true)
    expect(transitions.some((t) => t.to === 'REJECTED')).toBe(true)
  })

  it('CUSTOMER has no transitions except COLLECTING_DOCS self-loop', () => {
    // CUSTOMER can only: submit docs (COLLECTING_DOCS→COLLECTING_DOCS) and submit results (DELIVERED→APPROVED/REJECTED)
    const noTransitionStates: OrderStatus[] = [
      'PENDING_CONNECTION', 'CONNECTED',
      'PENDING_REVIEW', 'UNDER_REVIEW', 'MAKING_MATERIALS',
      'PENDING_DELIVERY',
    ]
    for (const status of noTransitionStates) {
      const transitions = getAvailableTransitions(status, 'CUSTOMER')
      expect(transitions).toHaveLength(0)
    }

    // COLLECTING_DOCS has a self-loop for CUSTOMER
    const collectingTransitions = getAvailableTransitions('COLLECTING_DOCS', 'CUSTOMER')
    expect(collectingTransitions).toHaveLength(1)
    expect(collectingTransitions[0].to).toBe('COLLECTING_DOCS')
  })
})
