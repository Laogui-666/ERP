import { ORDER_STATUS_LABELS } from '@/types/order'
import { logApiError } from '@/lib/logger'
import { emitToUser } from '@/lib/socket'

export const EVENTS = {
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_STATUS_CHANGED: 'order:status-changed',
  ORDER_ASSIGNED: 'order:assigned',
  ORDER_CLAIMED: 'order:claimed',
  DOCUMENT_UPLOADED: 'document:uploaded',
  NOTIFICATION_NEW: 'notification:new',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

type EventHandler = (data: unknown) => void

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map()

  on(event: EventName, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }

  emit(event: EventName, data: unknown): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data)
        } catch (error) {
          logApiError(`event:${event}`, error, { event })
        }
      })
    }
  }
}

export const eventBus = new EventBus()

// ==================== 事件处理器注册 ====================

interface StatusChangeData {
  orderId: string
  companyId: string
  actorId: string
  fromStatus: string
  toStatus: string
  action: string
}

// 状态变更 → 创建站内通知
eventBus.on(EVENTS.ORDER_STATUS_CHANGED, async (data) => {
  const { orderId, companyId, actorId, fromStatus, toStatus, action } = data as StatusChangeData

  // 异步导入避免循环依赖
  const { prisma } = await import('@/lib/prisma')

  // 查询订单基本信息
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { orderNo: true, customerName: true, collectorId: true, operatorId: true, customerId: true, createdBy: true },
  })
  if (!order) return

  // 确定需要通知的用户（排除操作者本人）
  const notifyUserIds = new Set<string>()
  if (order.collectorId && order.collectorId !== actorId) notifyUserIds.add(order.collectorId)
  if (order.operatorId && order.operatorId !== actorId) notifyUserIds.add(order.operatorId)
  if (order.customerId && order.customerId !== actorId) notifyUserIds.add(order.customerId)
  if (order.createdBy && order.createdBy !== actorId) notifyUserIds.add(order.createdBy)

  if (notifyUserIds.size === 0) return

  const fromLabel = ORDER_STATUS_LABELS[fromStatus as keyof typeof ORDER_STATUS_LABELS] ?? fromStatus
  const toLabel = ORDER_STATUS_LABELS[toStatus as keyof typeof ORDER_STATUS_LABELS] ?? toStatus

  await prisma.notification.createMany({
    data: Array.from(notifyUserIds).map((userId) => ({
      companyId,
      userId,
      orderId,
      type: 'STATUS_CHANGE',
      title: `订单 ${order.orderNo} ${action}`,
      content: `${order.customerName} 的订单状态：${fromLabel} → ${toLabel}`,
    })),
  })

  // Socket.io 实时推送通知（异步，不阻塞主流程）
  for (const userId of notifyUserIds) {
    emitToUser(userId, 'notification', {
      type: 'STATUS_CHANGE',
      title: `订单 ${order.orderNo} ${action}`,
      orderId,
      orderNo: order.orderNo,
    })
  }
})
