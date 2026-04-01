import { describe, it, expect } from 'vitest'
import {
  desensitizePhone,
  desensitizePassport,
  desensitizeIdCard,
  desensitizeEmail,
  desensitizeName,
  desensitizeBankCard,
  canViewSensitiveData,
  desensitizeOrderData,
} from '@erp/lib/desensitize'

describe('desensitizePhone', () => {
  it('should mask middle 4 digits', () => {
    expect(desensitizePhone('13812345678')).toBe('138****5678')
  })

  it('should return empty for null', () => {
    expect(desensitizePhone(null)).toBe('')
  })

  it('should return original for short numbers', () => {
    expect(desensitizePhone('123')).toBe('123')
  })
})

describe('desensitizePassport', () => {
  it('should mask middle characters', () => {
    expect(desensitizePassport('EA1234567')).toBe('EA***567')
  })

  it('should return *** for short strings', () => {
    expect(desensitizePassport('AB')).toBe('***')
  })

  it('should return empty for null', () => {
    expect(desensitizePassport(null)).toBe('')
  })
})

describe('desensitizeIdCard', () => {
  it('should mask middle digits', () => {
    expect(desensitizeIdCard('110101199001011234')).toBe('110***1234')
  })

  it('should return empty for null', () => {
    expect(desensitizeIdCard(null)).toBe('')
  })
})

describe('desensitizeEmail', () => {
  it('should mask local part', () => {
    expect(desensitizeEmail('zhangsan@gmail.com')).toBe('z***@gmail.com')
  })

  it('should return empty for null', () => {
    expect(desensitizeEmail(null)).toBe('')
  })

  it('should handle single char local part', () => {
    expect(desensitizeEmail('a@b.com')).toBe('a@b.com')
  })
})

describe('desensitizeName', () => {
  it('should mask all but first char', () => {
    expect(desensitizeName('张三')).toBe('张*')
  })

  it('should return * for single char', () => {
    expect(desensitizeName('张')).toBe('*')
  })

  it('should return empty for empty string', () => {
    expect(desensitizeName('')).toBe('')
  })
})

describe('desensitizeBankCard', () => {
  it('should return **** for any input', () => {
    expect(desensitizeBankCard('6222021234567890')).toBe('****')
  })

  it('should return **** for null', () => {
    expect(desensitizeBankCard(null)).toBe('****')
  })
})

describe('canViewSensitiveData', () => {
  it('OUTSOURCE cannot view sensitive data', () => {
    expect(canViewSensitiveData('OUTSOURCE')).toBe(false)
  })

  it('other roles can view sensitive data', () => {
    expect(canViewSensitiveData('SUPER_ADMIN')).toBe(true)
    expect(canViewSensitiveData('COMPANY_OWNER')).toBe(true)
    expect(canViewSensitiveData('DOC_COLLECTOR')).toBe(true)
    expect(canViewSensitiveData('CUSTOMER')).toBe(true)
  })
})

describe('desensitizeOrderData', () => {
  const order = {
    id: '1',
    customerName: '张三',
    customerPhone: '13812345678',
    customerEmail: 'zhangsan@gmail.com',
    passportNo: 'EA1234567',
    targetCountry: '法国',
  }

  it('should not desensitize for non-OUTSOURCE roles', () => {
    const result = desensitizeOrderData(order, 'SUPER_ADMIN')
    expect(result.customerPhone).toBe('13812345678')
    expect(result.customerEmail).toBe('zhangsan@gmail.com')
    expect(result.passportNo).toBe('EA1234567')
  })

  it('should desensitize for OUTSOURCE role', () => {
    const result = desensitizeOrderData(order, 'OUTSOURCE')
    expect(result.customerPhone).toBe('138****5678')
    expect(result.customerEmail).toBe('z***@gmail.com')
    expect(result.passportNo).toBe('EA***567')
  })

  it('should preserve non-sensitive fields', () => {
    const result = desensitizeOrderData(order, 'OUTSOURCE')
    expect(result.customerName).toBe('张三')
    expect(result.targetCountry).toBe('法国')
    expect(result.id).toBe('1')
  })
})
