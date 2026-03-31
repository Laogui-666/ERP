// 数据脱敏工具（严格按PRD脱敏规则）

/**
 * 手机号脱敏：保留前3后4 → 138****5678
 */
export function desensitizePhone(phone: string | null): string {
  if (!phone) return ''
  if (phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

/**
 * 护照号脱敏：保留前2后3 → EA***567
 */
export function desensitizePassport(passport: string | null): string {
  if (!passport) return ''
  if (passport.length <= 5) return '***'
  return passport.slice(0, 2) + '***' + passport.slice(-3)
}

/**
 * 身份证号脱敏：保留前3后4 → 110***1234
 */
export function desensitizeIdCard(idCard: string | null): string {
  if (!idCard) return ''
  if (idCard.length < 8) return idCard
  return idCard.slice(0, 3) + '***' + idCard.slice(-4)
}

/**
 * 邮箱脱敏：保留首字母+@域名 → z***@gmail.com
 */
export function desensitizeEmail(email: string | null): string {
  if (!email) return ''
  const [name, domain] = email.split('@')
  if (!name || !domain) return email
  if (name.length <= 1) return name + '@' + domain
  return name[0] + '***@' + domain
}

/**
 * 姓名脱敏
 */
export function desensitizeName(name: string): string {
  if (!name) return ''
  if (name.length <= 1) return '*'
  return name[0] + '*'.repeat(name.length - 1)
}

/**
 * 银行卡号脱敏：完全隐藏
 */
export function desensitizeBankCard(_cardNo: string | null): string {
  return '****'
}

/**
 * 判断角色是否可以查看原始敏感数据
 * OUTSOURCE 角色自动脱敏，其他管理角色可查看
 */
export function canViewSensitiveData(viewerRole: string): boolean {
  return viewerRole !== 'OUTSOURCE'
}

/**
 * 订单数据脱敏（OUTSOURCE 角色使用）
 */
export function desensitizeOrderData<T extends Record<string, unknown>>(
  data: T,
  viewerRole: string
): T {
  if (canViewSensitiveData(viewerRole)) return data

  return {
    ...data,
    customerPhone: desensitizePhone(data.customerPhone as string | null),
    customerEmail: desensitizeEmail(data.customerEmail as string | null),
    passportNo: desensitizePassport(data.passportNo as string | null),
  }
}
