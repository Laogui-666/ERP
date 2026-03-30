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
  // 提交复审：操作员已分配过，直接回流到操作员（不需要重新接单）
  {
    from: 'COLLECTING_DOCS',
    to: 'UNDER_REVIEW',
    allowedRoles: ['DOC_COLLECTOR', 'VISA_ADMIN'],
    action: '提交复审',
    validate: async (order) => {
      const freshOrder = await prisma.order.findUnique({
        where: { id: order.id },
        select: { operatorId: true },
      })
      return !!freshOrder?.operatorId
    },
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

  // 事务：重新读取状态（防并发） + 状态更新 + 操作日志
  await prisma.$transaction(async (tx) => {
    // 事务内重新读取订单状态（防止外层 findFirst 到事务执行时状态已变）
    const freshOrder = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    })
    if (!freshOrder) {
      throw new AppError('ORDER_NOT_FOUND', '订单不存在', 404)
    }

    // 重新校验流转规则（基于事务内最新状态）
    const freshRule = TRANSITION_RULES.find(
      (r) => r.from === freshOrder.status && r.to === toStatus
    )
    if (!freshRule) {
      throw new AppError(
        'INVALID_TRANSITION',
        `不允许从 "${freshOrder.status}" 流转到 "${toStatus}"（状态已被其他操作变更）`,
        400
      )
    }

    const updateData: Record<string, unknown> = {
      status: toStatus,
      updatedAt: new Date(),
    }

    // 绑定操作人
    if (toStatus === 'CONNECTED') {
      updateData.collectorId = userId
    } else if (toStatus === 'UNDER_REVIEW' && freshOrder.status === 'PENDING_REVIEW') {
      // 仅首次从 PENDING_REVIEW 接单时绑定操作员
      // 复审场景（COLLECTING_DOCS → UNDER_REVIEW）保留原操作员
      updateData.operatorId = userId
    }

    // 终态时间戳
    if (toStatus === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    }
    if (toStatus === 'APPROVED' || toStatus === 'REJECTED') {
      updateData.completedAt = new Date()
    }

    // WHERE 含 status 条件 → 并发时只有一个能成功
    const result = await tx.order.updateMany({
      where: { id: orderId, status: freshOrder.status },
      data: updateData,
    })

    if (result.count === 0) {
      throw new AppError(
        'CONCURRENT_MODIFICATION',
        '操作失败：订单状态已被其他操作变更，请刷新后重试',
        409
      )
    }

    await tx.orderLog.create({
      data: {
        orderId,
        companyId,
        userId,
        action: freshRule.action,
        fromStatus: freshOrder.status,
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

  // 5. 更新订单 + 写日志（同一事务，WHERE 含 status 防并发）
  const updateData: Record<string, unknown> = {
    status: newStatus,
    visaResultAt: new Date(),
    updatedAt: new Date(),
  }
  if (newStatus !== 'PARTIAL') {
    updateData.completedAt = new Date()
  }

  const updateResult = await tx.order.updateMany({
    where: { id: orderId, status: order.status },
    data: updateData,
  })

  if (updateResult.count === 0) {
    // 并发冲突：另一个事务已修改状态，不抛异常（申请人结果已写入成功）
    return null
  }

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
