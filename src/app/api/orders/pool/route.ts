import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'
import type { OrderStatus } from '@/types/order'

// GET /api/orders/pool - 公共池订单列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'pool', 'read')

    const params = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    }).parse(Object.fromEntries(request.nextUrl.searchParams))

    // 资料员看到 PENDING_CONNECTION 的订单
    // 操作员看到 PENDING_REVIEW 的订单
    let poolStatus: OrderStatus
    if (['DOC_COLLECTOR', 'VISA_ADMIN'].includes(user.role)) {
      poolStatus = 'PENDING_CONNECTION'
    } else if (['OPERATOR', 'OUTSOURCE'].includes(user.role)) {
      poolStatus = 'PENDING_REVIEW'
    } else {
      throw new AppError('FORBIDDEN', '无权查看公共池', 403)
    }

    const where = {
      companyId: user.companyId,
      status: poolStatus,
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNo: true,
          customerName: true,
          targetCountry: true,
          visaType: true,
          status: true,
          amount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json(createSuccessResponse(orders, {
      total,
      page: params.page,
      pageSize: params.pageSize,
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
