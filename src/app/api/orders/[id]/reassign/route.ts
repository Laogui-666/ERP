import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

/**
 * POST /api/orders/[id]/reassign
 * 转单：将订单转交给同角色的其他员工
 *
 * 权限：COMPANY_OWNER / CS_ADMIN / VISA_ADMIN
 *
 * 场景：
 * - 资料员转单给其他资料员（PENDING_CONNECTION/CONNECTED/COLLECTING_DOCS/PENDING_DELIVERY）
 * - 操作员转单给其他操作员（PENDING_REVIEW/UNDER_REVIEW/MAKING_MATERIALS）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'reassign')

    const body = await request.json()
    const schema = z.object({
      targetUserId: z.string().min(1),
      reason: z.string().optional(),
    })
    const data = schema.parse(body)

    // 查找订单
    const order = await prisma.order.findFirst({
      where: { id: id, companyId: user.companyId },
    })
    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    // 查找目标用户
    const targetUser = await prisma.user.findFirst({
      where: { id: data.targetUserId, companyId: user.companyId, status: 'ACTIVE' },
    })
    if (!targetUser) throw new AppError('NOT_FOUND', '目标用户不存在', 404)

    // 确定转单类型
    const collectorStatuses = ['PENDING_CONNECTION', 'CONNECTED', 'COLLECTING_DOCS', 'PENDING_DELIVERY']
    const operatorStatuses = ['PENDING_REVIEW', 'UNDER_REVIEW', 'MAKING_MATERIALS']

    let updateData: Record<string, unknown> = {}
    let action = ''

    if (collectorStatuses.includes(order.status)) {
      // 资料员转单
      if (!['DOC_COLLECTOR', 'VISA_ADMIN'].includes(targetUser.role)) {
        throw new AppError('INVALID', '目标用户必须是资料员或签证部管理员', 400)
      }
      updateData = { collectorId: targetUser.id }
      action = `转单给资料员 ${targetUser.realName}`
    } else if (operatorStatuses.includes(order.status)) {
      // 操作员转单
      if (!['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'].includes(targetUser.role)) {
        throw new AppError('INVALID', '目标用户必须是操作员/外包或签证部管理员', 400)
      }
      updateData = { operatorId: targetUser.id }
      action = `转单给操作员 ${targetUser.realName}`
    } else {
      throw new AppError('INVALID_STATUS', `订单状态 ${order.status} 不允许转单`, 400)
    }

    // 执行转单（同一事务）
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: id },
        data: updateData,
      })

      await tx.orderLog.create({
        data: {
          orderId: id,
          companyId: user.companyId,
          userId: user.userId,
          action,
          detail: data.reason ?? null,
        },
      })

      // 通知目标用户
      await tx.notification.create({
        data: {
          companyId: user.companyId,
          userId: targetUser.id,
          orderId: id,
          type: 'ORDER_NEW',
          title: '收到转单',
          content: `${user.username} 将订单 ${order.orderNo} (${order.customerName}) 转交给您${data.reason ? `，原因：${data.reason}` : ''}`,
        },
      })
    })

    return NextResponse.json(createSuccessResponse({ message: `已转交给 ${targetUser.realName}` }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        new AppError('VALIDATION_ERROR', '参数校验失败', 400, error.errors).toJSON(),
        { status: 400 },
      )
    }
    throw error
  }
}
