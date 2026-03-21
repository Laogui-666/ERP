import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

/**
 * POST /api/orders/[id]/cancel
 * 取消订单
 *
 * 权限：COMPANY_OWNER / CS_ADMIN / VISA_ADMIN
 * 规则：APPROVED / REJECTED 已是终态，不可取消
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'update')

    const body = await request.json()
    const schema = z.object({ reason: z.string().min(1, '取消原因不能为空') })
    const { reason } = schema.parse(body)

    const order = await prisma.order.findFirst({
      where: { id: params.id, companyId: user.companyId },
    })
    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    if (['APPROVED', 'REJECTED'].includes(order.status)) {
      throw new AppError('INVALID_STATUS', '终态订单不可取消', 400)
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          completedAt: new Date(),
        },
      })

      await tx.orderLog.create({
        data: {
          orderId: params.id,
          companyId: user.companyId,
          userId: user.userId,
          action: '取消订单',
          fromStatus: order.status,
          toStatus: 'REJECTED',
          detail: reason,
        },
      })

      // 通知相关人员
      const notifyUserIds = new Set<string>()
      if (order.collectorId) notifyUserIds.add(order.collectorId)
      if (order.operatorId) notifyUserIds.add(order.operatorId)
      if (order.customerId) notifyUserIds.add(order.customerId)

      if (notifyUserIds.size > 0) {
        await tx.notification.createMany({
          data: Array.from(notifyUserIds).map((uid) => ({
            companyId: user.companyId,
            userId: uid,
            orderId: params.id,
            type: 'STATUS_CHANGE' as const,
            title: '订单已取消',
            content: `订单 ${order.orderNo} 已被取消，原因：${reason}`,
          })),
        })
      }
    })

    return NextResponse.json(createSuccessResponse({ message: '订单已取消' }))
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
