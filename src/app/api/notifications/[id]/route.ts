import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { AppError, createSuccessResponse } from '@/types/api'
import { prisma } from '@/lib/prisma'

// PATCH /api/notifications/[id] - 标记单条已读
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    const notification = await prisma.notification.findFirst({
      where: { id: params.id, userId: user.userId },
    })

    if (!notification) {
      throw new AppError('NOT_FOUND', '通知不存在', 404)
    }

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    })

    return NextResponse.json(createSuccessResponse(updated))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
