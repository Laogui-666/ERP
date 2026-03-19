import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission, getDataScopeFilter } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'

// GET /api/orders/[id] - 订单详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'read')

    const scopeFilter = getDataScopeFilter(user)
    const order = await prisma.order.findFirst({
      where: { id: params.id, ...scopeFilter },
      include: {
        customer: { select: { id: true, realName: true } },
        collector: { select: { id: true, realName: true } },
        operator: { select: { id: true, realName: true } },
        documentRequirements: {
          include: { files: true },
          orderBy: { sortOrder: 'asc' },
        },
        visaMaterials: { orderBy: { createdAt: 'desc' } },
        orderLogs: {
          include: { user: { select: { realName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!order) {
      throw new AppError('NOT_FOUND', '订单不存在', 404)
    }

    return NextResponse.json(createSuccessResponse(order))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}

// PATCH /api/orders/[id] - 更新订单信息
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'update')

    const body = await request.json()
    const scopeFilter = getDataScopeFilter(user)

    const existing = await prisma.order.findFirst({
      where: { id: params.id, ...scopeFilter },
    })
    if (!existing) throw new AppError('NOT_FOUND', '订单不存在', 404)

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(createSuccessResponse(order))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
