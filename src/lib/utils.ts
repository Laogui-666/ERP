export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 生成系统专属订单号
 * 格式: HX + YYYYMMDD + 4位随机码
 * 示例: HX20260320A3F2
 * HX = 沐海/公司标识，一眼可识别为本系统订单
 */
export function generateOrderNo(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `HX${y}${m}${d}${rand}`
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => {
    delete result[key]
  })
  return result as Omit<T, K>
}

// ==================== M5 财务计算 ====================

/**
 * 计算平台费用 = 订单金额 × 平台扣点费率
 * 精确到分
 */
export function calcPlatformFee(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100
}

/**
 * 计算毛利 = 订单金额 - 平台费用 - 签证费 - 保险费 - 拒签保险 - 好评返现
 */
export function calcGrossProfit(order: {
  amount: number
  platformFeeRate?: number | null
  visaFee?: number | null
  insuranceFee?: number | null
  rejectionInsurance?: number | null
  reviewBonus?: number | null
}): number {
  const platformFee = calcPlatformFee(order.amount, order.platformFeeRate ?? 0)
  const totalCost = platformFee
    + (order.visaFee ?? 0)
    + (order.insuranceFee ?? 0)
    + (order.rejectionInsurance ?? 0)
    + (order.reviewBonus ?? 0)
  return Math.round((order.amount - totalCost) * 100) / 100
}
