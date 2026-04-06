import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@shared/lib/auth'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { prisma } from '@shared/lib/prisma'
import { z } from 'zod'

// GET /api/notifications - 通知列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    const params = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      unreadOnly: z.coerce.boolean().optional(),
      from: z.string().datetime().optional(),
    }).parse(Object.fromEntries(request.nextUrl.searchParams))

    const skip = (params.page - 1) * params.pageSize

    const where: Record<string, unknown> = {
      userId: user.userId,
      companyId: user.companyId,
    }
    if (params.unreadOnly) {
      where.isRead = false
    }
    if (params.from) {
      where.createdAt = { gte: new Date(params.from) }
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: user.userId, companyId: user.companyId, isRead: false },
      }),
    ])

    return NextResponse.json(createSuccessResponse(notifications, {
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize),
      unreadCount,
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
