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
 * 聊天消息时间格式化
 * - 今天：HH:mm
 * - 昨天：昨天 HH:mm
 * - 本年：MM-DD HH:mm
 * - 跨年：YYYY-MM-DD HH:mm
 */
export function formatMessageTime(date: Date | string | null): string {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()

  const isSameDay = d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()

  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  if (isSameDay) return time
  if (isYesterday) return `昨天 ${time}`
  if (d.getFullYear() === now.getFullYear()) {
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${time}`
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${time}`
}

/**
 * 生成系统专属订单号
 * 格式: HX + YYYYMMDD + 6位随机码（hex）
 * 示例: HX20260320A3F2B1
 * HX = 华夏签证/公司标识，一眼可识别为本系统订单
 *
 * 注意：使用 Math.random() 而非 crypto.randomBytes
 * 原因：utils.ts 被浏览器端代码打包，crypto 仅 Node.js 可用。
 * 数据库 orderNo UNIQUE 约束是最终兜底，1/16M 日碰撞可接受。
 */
export function generateOrderNo(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.random().toString(16).substring(2, 8).toUpperCase()
  return `HX${y}${m}${d}${rand}`
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
