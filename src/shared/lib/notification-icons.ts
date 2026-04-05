// 通知类型图标 + 路由映射（共享常量）

// 通知类型 → 图标
export const NOTIFICATION_ICONS: Record<string, string> = {
  ORDER_NEW: '🆕',
  ORDER_CREATED: '📋',
  STATUS_CHANGE: '🔄',
  DOC_REVIEWED: '📄',
  DOCS_SUBMITTED: '📤',
  MATERIAL_UPLOADED: '📥',
  MATERIAL_FEEDBACK: '📝',
  APPOINTMENT_REMIND: '⏰',
  CHAT_MESSAGE: '💬',
  SYSTEM: '🔔',
}

// 根据通知获取跳转路由
export function getNotificationRoute(
  orderId: string | null,
  role?: string | null,
): string | null {
  if (!orderId) return null
  const base = role === 'CUSTOMER' ? '/customer/orders' : '/admin/orders'
  return `${base}/${orderId}`
}
