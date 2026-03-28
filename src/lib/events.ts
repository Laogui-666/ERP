import { ORDER_STATUS_LABELS } from '@/types/order'
import { logApiError } from '@/lib/logger'
import { emitToUser } from '@/lib/socket'
import { sendSystemMessage, archiveChatRoom } from '@/lib/chat-system'

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

  // GAP-3 修复：操作员打回时，通知内容汇总审核意见
  let enhancedContent = `${order.customerName} 的订单状态：${fromLabel} → ${toLabel}`
  if (toStatus === 'COLLECTING_DOCS' && fromStatus === 'UNDER_REVIEW') {
    const rejectedDocs = await prisma.documentRequirement.findMany({
      where: {
        orderId,
        status: { in: ['REJECTED', 'SUPPLEMENT'] },
      },
      select: { name: true, status: true, rejectReason: true },
    })
    if (rejectedDocs.length > 0) {
      const summary = rejectedDocs.map(d =>
        `${d.name}（${d.status === 'REJECTED' ? '需修改' : '需补充'}${d.rejectReason ? `: ${d.rejectReason}` : ''}）`
      ).join('、')
      enhancedContent += `，需处理：${summary}`
    }
  }

  await prisma.notification.createMany({
    data: Array.from(notifyUserIds).map((userId) => ({
      companyId,
      userId,
      orderId,
      type: 'STATUS_CHANGE' as const,
      title: `订单 ${order.orderNo} ${action}`,
      content: enhancedContent,
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

  // M4: 系统消息 → 聊天（异步，不阻塞主流程）
  const systemMessages: Record<string, string> = {
    'PENDING_CONNECTION→CONNECTED': '资料员已接单，将协助您准备资料',
    'CONNECTED→COLLECTING_DOCS': '请按清单上传所需资料',
    'COLLECTING_DOCS→PENDING_REVIEW': '资料已提交审核',
    'PENDING_REVIEW→UNDER_REVIEW': '操作员正在审核资料',
    'UNDER_REVIEW→MAKING_MATERIALS': '资料审核通过，等待制作签证材料',
    'UNDER_REVIEW→COLLECTING_DOCS': '资料需要修改，请查看聊天中的具体说明',
    'MAKING_MATERIALS→PENDING_DELIVERY': '签证材料已上传，请确认',
    'PENDING_DELIVERY→DELIVERED': '签证材料已交付',
    'DELIVERED→APPROVED': '🎉 签证结果：出签！恭喜！',
    'DELIVERED→REJECTED': '签证结果：拒签。请联系客服了解详情',
    'PENDING_DELIVERY→MAKING_MATERIALS': '材料需要修改，请查看说明',
  }

  const transitionKey = `${fromStatus}→${toStatus}`
  const chatMessage = systemMessages[transitionKey]
  if (chatMessage) {
    sendSystemMessage(orderId, companyId, chatMessage).catch((err) => {
      logApiError('chat-system-message-event', err, { orderId, transitionKey })
    })
  }

  // 终态自动归档 ChatRoom
  const terminalStatuses = ['APPROVED', 'REJECTED']
  if (terminalStatuses.includes(toStatus)) {
    archiveChatRoom(orderId).catch((err) => {
      logApiError('chat-room-archive-event', err, { orderId, toStatus })
    })
  }
})
