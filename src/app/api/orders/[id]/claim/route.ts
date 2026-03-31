import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission } from '@shared/lib/rbac'
import { transitionOrder } from '@erp/lib/transition'
import { AppError, createSuccessResponse } from '@shared/types/api'

// POST /api/orders/[id]/claim - 从公共池接单
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'pool', 'claim')

    // 验证订单在公共池中（未被分配）
    const order = await prisma.order.findFirst({
      where: {
        id: id,
        companyId: user.companyId,
      },
    })

    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    // 资料员接单：PENDING_CONNECTION → CONNECTED
    if (['DOC_COLLECTOR', 'VISA_ADMIN'].includes(user.role)) {
      if (order.status !== 'PENDING_CONNECTION') {
        throw new AppError('INVALID_STATE', `订单当前状态为 ${order.status}，无法接单`, 400)
      }
      await transitionOrder({
        orderId: id,
        toStatus: 'CONNECTED',
        userId: user.userId,
        userRole: user.role,
        companyId: user.companyId,
        detail: '从公共池接单',
      })
    }
    // 操作员接单：PENDING_REVIEW → UNDER_REVIEW
    else if (['OPERATOR', 'OUTSOURCE'].includes(user.role)) {
      if (order.status !== 'PENDING_REVIEW') {
        throw new AppError('INVALID_STATE', `订单当前状态为 ${order.status}，无法接单`, 400)
      }
      await transitionOrder({
        orderId: id,
        toStatus: 'UNDER_REVIEW',
        userId: user.userId,
        userRole: user.role,
        companyId: user.companyId,
        detail: '从公共池接单',
      })
    } else {
      throw new AppError('FORBIDDEN', '无权接单', 403)
    }

    return NextResponse.json(createSuccessResponse({ message: '接单成功' }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
