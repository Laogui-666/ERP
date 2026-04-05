import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission } from '@shared/lib/rbac'
import { transitionOrder } from '@erp/lib/transition'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { z } from 'zod'
import type { OrderStatus } from '@erp/types/order'

const statusSchema = z.object({
  toStatus: z.string().min(1),
  detail: z.string().optional(),
})

// POST /api/orders/[id]/status - 状态流转
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'transition')

    const body = await request.json()
    const { toStatus, detail } = statusSchema.parse(body)

    await transitionOrder({
      orderId: id,
      toStatus: toStatus as OrderStatus,
      userId: user.userId,
      userRole: user.role,
      companyId: user.companyId,
      detail,
    })

    return NextResponse.json(createSuccessResponse({ message: '状态已更新' }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        new AppError('VALIDATION_ERROR', '参数校验失败', 400, error.errors).toJSON(),
        { status: 400 }
      )
    }
    throw error
  }
}
