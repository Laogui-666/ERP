import type { OrderStatus } from '@/types/order'
import type { UserRole } from '@/types/user'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/types/api'
import { eventBus, EVENTS } from '@/lib/events'
import type { Prisma } from '@prisma/client'

interface TransitionRule {
  from: OrderStatus
  to: OrderStatus
  allowedRoles: UserRole[]
  action: string
  validate?: (order: { id: string }, userId: string) => Promise<boolean>
}

/**
 * 状态机合法流转规则（严格按PRD定义）
 * 
 * 客服 → 资料员 → 操作员 → 资料员 → 客户
 * 支持双向打回：
 *   操作员打回 COLLECTING_DOCS（需补充资料）
 *   资料员打回 MAKING_MATERIALS（需修改材料）
 */
export const TRANSITION_RULES: TransitionRule[] = [
  // === 阶段一：客服录单 → 资料员接单 ===
  {
    from: 'PENDING_CONNECTION',
    to: 'CONNECTED',
    allowedRoles: ['DOC_COLLECTOR', 'VISA_ADMIN'],
    action: '接单',
  },
  {
    from: 'CONNECTED',
    to: 'COLLECTING_DOCS',
    allowedRoles: ['DOC_COLLECTOR', 'VISA_ADMIN'],
    action: '发送资料清单',
  },

  // === 阶段二：资料收集 ===
  {
    from: 'COLLECTING_DOCS',
    to: 'COLLECTING_DOCS',
    allowedRoles: ['DOC_COLLECTOR', 'VISA_ADMIN', 'CUSTOMER'],
    action: '客户提交资料',
  },
  {
    from: 'COLLECTING_DOCS',
    to: 'PENDING_REVIEW',
    allowedRoles: ['DOC_COLLECTOR', 'VISA_ADMIN'],
    action: '提交审核',
  },

  // === 阶段三：操作员审核 ===
  {
    from: 'PENDING_REVIEW',
    to: 'UNDER_REVIEW',
    allowedRoles: ['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'],
    action: '操作员接单',
  },
  {
    from: 'UNDER_REVIEW',
    to: 'COLLECTING_DOCS',
    allowedRoles: ['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'],
    action: '打回补充资料',
  },
  {
    from: 'UNDER_REVIEW',
    to: 'MAKING_MATERIALS',
    allowedRoles: ['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'],
    action: '确认资料达标，开始制作',
  },

  // === 阶段四：材料制作与交付 ===
  {
    from: 'MAKING_MATERIALS',
    to: 'PENDING_DELIVERY',
    allowedRoles: ['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'],
    action: '上传签证材料',
  },
  {
    from: 'PENDING_DELIVERY',
    to: 'MAKING_MATERIALS',
    allowedRoles: ['DOC_COLLECTOR', 'VISA_ADMIN'],
    action: '打回修改材料',
  },
  {
    from: 'PENDING_DELIVERY',
    to: 'DELIVERED',
    allowedRoles: ['DOC_COLLECTOR', 'VISA_ADMIN'],
    action: '确认交付',
  },

  // === 阶段五：结果反馈 ===
  {
    from: 'DELIVERED',
    to: 'APPROVED',
    allowedRoles: ['OPERATOR', 'DOC_COLLECTOR', 'CUSTOMER', 'VISA_ADMIN'],
    action: '提交出签结果',
  },
  {
    from: 'DELIVERED',
    to: 'REJECTED',
    allowedRoles: ['OPERATOR', 'DOC_COLLECTOR', 'CUSTOMER', 'VISA_ADMIN'],
    action: '提交拒签结果',
  },

  // === M5：PARTIAL 手动推进规则 ===
  {
    from: 'PARTIAL',
    to: 'APPROVED',
    allowedRoles: ['COMPANY_OWNER', 'VISA_ADMIN'],
    action: '确认全部出签',
  },
  {
    from: 'PARTIAL',
    to: 'REJECTED',
    allowedRoles: ['COMPANY_OWNER', 'VISA_ADMIN'],
    action: '确认全部拒签',
  },
]

/**
 * 获取当前状态+角色可执行的所有流转
 */
export function getAvailableTransitions(
  currentStatus: OrderStatus,
  role: UserRole
): TransitionRule[] {
  return TRANSITION_RULES.filter(
    (rule) => rule.from === currentStatus && rule.allowedRoles.includes(role)
  )
}

/**
 * 状态机核心流转方法
 * 同一事务内：校验规则 → 校验权限 → 更新状态 → 写操作日志
 */
export async function transitionOrder(input: {
  orderId: string
  toStatus: OrderStatus
  userId: string
  userRole: UserRole
  companyId: string
  detail: string | undefined
}) {
  const { orderId, toStatus, userId, userRole, companyId, detail } = input

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId },
  })

  if (!order) {
    throw new AppError('ORDER_NOT_FOUND', '订单不存在', 404)
  }

  const rule = TRANSITION_RULES.find(
    (r) => r.from === order.status && r.to === toStatus
  )

  if (!rule) {
    throw new AppError(
      'INVALID_TRANSITION',
      `不允许从 "${order.status}" 流转到 "${toStatus}"`,
      400
    )
  }

  if (!rule.allowedRoles.includes(userRole)) {
    throw new AppError(
      'FORBIDDEN',
      `角色 ${userRole} 无权执行此操作: ${rule.action}`,
      403
    )
  }

  if (rule.validate) {
    const isValid = await rule.validate(order, userId)
    if (!isValid) {
      throw new AppError('VALIDATION_FAILED', '业务校验不通过', 400)
    }
  }

  // 事务：状态更新 + 操作日志
  await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {
      status: toStatus,
      updatedAt: new Date(),
    }

    // 绑定操作人
    if (toStatus === 'CONNECTED') {
      updateData.collectorId = userId
    } else if (toStatus === 'UNDER_REVIEW') {
      updateData.operatorId = userId
    }

    // 终态时间戳
    if (toStatus === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    }
    if (toStatus === 'APPROVED' || toStatus === 'REJECTED') {
      updateData.completedAt = new Date()
    }

    await tx.order.update({
      where: { id: orderId },
      data: updateData,
    })

    await tx.orderLog.create({
      data: {
        orderId,
        companyId,
        userId,
        action: rule.action,
        fromStatus: order.status,
        toStatus,
        detail: detail ?? null,
      },
    })
  })

  // 事务成功后触发事件（异步，不阻塞主流程）
  eventBus.emit(EVENTS.ORDER_STATUS_CHANGED, {
    orderId,
    companyId,
    actorId: userId,
    fromStatus: order.status,
    toStatus,
    action: rule.action,
  })
}

// ==================== M5：多人订单自动终态判断 ====================

/**
 * 根据所有申请人的出签结果，自动判断订单终态
 * 独立于 transitionOrder()，不走 TRANSITION_RULES
 * 调用场景：PATCH /api/applicants/[id] 更新 visaResult 后
 *
 * @returns 更新后的状态，如果还有人未出结果则返回 null
 */
export async function autoResolveOrderStatus(
  tx: Prisma.TransactionClient,
  orderId: string,
  companyId: string,
  actorId: string
): Promise<OrderStatus | null> {
  // 1. 获取所有申请人结果
  const applicants = await tx.applicant.findMany({
    where: { orderId },
    select: { visaResult: true, name: true },
  })

  // 2. 还有人没出结果 → 不操作
  if (applicants.some((a) => a.visaResult === null)) {
    return null
  }

  // 3. 判断终态
  const allApproved = applicants.every((a) => a.visaResult === 'APPROVED')
  const allRejected = applicants.every((a) => a.visaResult === 'REJECTED')
  const newStatus: OrderStatus = allApproved
    ? 'APPROVED'
    : allRejected
      ? 'REJECTED'
      : 'PARTIAL'

  // 4. 获取当前状态
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  })
  if (!order) return null

  // 5. 更新订单 + 写日志（同一事务）
  const updateData: Record<string, unknown> = {
    status: newStatus,
    visaResultAt: new Date(),
    updatedAt: new Date(),
  }
  if (newStatus !== 'PARTIAL') {
    updateData.completedAt = new Date()
  }

  await tx.order.update({
    where: { id: orderId },
    data: updateData,
  })

  const actionLabel = allApproved
    ? '全部出签'
    : allRejected
      ? '全部拒签'
      : '部分出签'

  const detail = applicants
    .map((a) => `${a.name}: ${a.visaResult === 'APPROVED' ? '出签' : '拒签'}`)
    .join('；')

  await tx.orderLog.create({
    data: {
      orderId,
      companyId,
      userId: actorId,
      action: actionLabel,
      fromStatus: order.status,
      toStatus: newStatus,
      detail,
    },
  })

  return newStatus
}
