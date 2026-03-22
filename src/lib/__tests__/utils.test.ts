import { describe, it, expect } from 'vitest'
import {
  calcPlatformFee,
  calcGrossProfit,
  generateOrderNo,
  formatDate,
  formatDateTime,
  cn,
  pick,
  omit,
} from '@/lib/utils'

describe('calcPlatformFee', () => {
  it('should calculate 6.1% platform fee correctly', () => {
    expect(calcPlatformFee(1000, 0.061)).toBe(61)
  })

  it('should calculate 7.3% platform fee correctly', () => {
    expect(calcPlatformFee(1000, 0.073)).toBe(73)
  })

  it('should handle zero amount', () => {
    expect(calcPlatformFee(0, 0.061)).toBe(0)
  })

  it('should handle zero rate', () => {
    expect(calcPlatformFee(1000, 0)).toBe(0)
  })

  it('should round to 2 decimal places', () => {
    expect(calcPlatformFee(333, 0.061)).toBe(20.31)
  })

  it('should handle large amounts', () => {
    // 999999.99 * 0.061 = 60999.99939, rounds to 61000
    expect(calcPlatformFee(999999.99, 0.061)).toBe(61000)
  })
})

describe('calcGrossProfit', () => {
  it('should calculate gross profit correctly', () => {
    const result = calcGrossProfit({
      amount: 1000,
      platformFeeRate: 0.061,
      visaFee: 200,
      insuranceFee: 50,
      rejectionInsurance: 30,
      reviewBonus: 10,
    })
    // 1000 - 61 - 200 - 50 - 30 - 10 = 649
    expect(result).toBe(649)
  })

  it('should handle missing optional fields', () => {
    const result = calcGrossProfit({
      amount: 1000,
      platformFeeRate: 0.061,
    })
    // 1000 - 61 - 0 - 0 - 0 - 0 = 939
    expect(result).toBe(939)
  })

  it('should handle null values', () => {
    const result = calcGrossProfit({
      amount: 1000,
      platformFeeRate: null,
      visaFee: null,
      insuranceFee: null,
      rejectionInsurance: null,
      reviewBonus: null,
    })
    expect(result).toBe(1000)
  })

  it('should handle negative profit (loss)', () => {
    const result = calcGrossProfit({
      amount: 100,
      platformFeeRate: 0.5,
      visaFee: 100,
    })
    // 100 - 50 - 100 = -50
    expect(result).toBe(-50)
  })

  it('should default rate to 0 when null', () => {
    const result = calcGrossProfit({
      amount: 1000,
      platformFeeRate: null,
    })
    expect(result).toBe(1000)
  })
})

describe('generateOrderNo', () => {
  it('should start with HX', () => {
    const orderNo = generateOrderNo()
    expect(orderNo.startsWith('HX')).toBe(true)
  })

  it('should have correct format: HX + YYYYMMDD + 4 chars', () => {
    const orderNo = generateOrderNo()
    expect(orderNo.length).toBe(14) // HX(2) + 20260322(8) + 4 = 14
  })

  it('should generate unique order numbers', () => {
    const set = new Set<string>()
    for (let i = 0; i < 100; i++) {
      set.add(generateOrderNo())
    }
    // At least 95% unique (random collision possible but very unlikely)
    expect(set.size).toBeGreaterThanOrEqual(95)
  })
})

describe('formatDate', () => {
  it('should return formatted date', () => {
    const result = formatDate('2026-03-22T10:00:00Z')
    expect(result).toMatch(/2026/)
  })

  it('should return dash for null', () => {
    expect(formatDate(null)).toBe('-')
  })
})

describe('formatDateTime', () => {
  it('should return formatted datetime', () => {
    const result = formatDateTime('2026-03-22T10:00:00Z')
    expect(result).toMatch(/2026/)
  })

  it('should return dash for null', () => {
    expect(formatDateTime(null)).toBe('-')
  })
})

describe('cn', () => {
  it('should join class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('should filter falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })
})

describe('pick', () => {
  it('should pick specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 }
    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })
})

describe('omit', () => {
  it('should omit specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 }
    expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 })
  })
})
