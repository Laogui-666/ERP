import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@shared/lib/auth'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { prisma } from '@shared/lib/prisma'

// POST /api/notifications/mark-all-read - 全部标记已读
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    await prisma.notification.updateMany({
      where: {
        userId: user.userId,
        companyId: user.companyId,
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json(createSuccessResponse({ message: '已全部标记为已读', unreadCount: 0 }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
